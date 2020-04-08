/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * This service will provide GitLab operations.
 *
 * @author TCSCODER
 * @version 1.0
 */

const Joi = require('joi');
const superagent = require('superagent');
const superagentPromise = require('superagent-promise');
const _ = require('lodash');
const config = require('../config');
const constants = require('../common/constants');
const helper = require('../common/helper');
const dbHelper = require('../common/db-helper');
const errors = require('../common/errors');
const User = require('../models').User;
const UserMapping = require('../models').UserMapping;
const OwnerUserTeam = require('../models').OwnerUserTeam;

const request = superagentPromise(superagent, Promise);
// milliseconds per second
const MS_PER_SECOND = 1000;

/**
 * Ensure the owner user is in database.
 * @param {String} token the access token of owner user
 * @param {String} topcoderUsername the topcoder handle of owner user
 * @returns {Promise} the promise result of found owner user
 */
async function ensureOwnerUser(token, topcoderUsername) {
  let userProfile;
  try {
    // get current user name
    userProfile = await request
      .get(`${config.AZURE_API_BASE_URL}/_apis/profile/profiles/me?api-version=5.1`)
      .set('Authorization', `Bearer ${token}`)
      .end()
      .then((res) => res.body);
  } catch (err) {
    throw helper.convertGitLabError(err, 'Failed to ensure valid owner user.');
  }
  if (!userProfile) {
    throw new errors.UnauthorizedError('Can not get user from the access token.');
  }
  const user = await dbHelper.scanOne(User, {
    username: userProfile.emailAddress,
    type: constants.USER_TYPES.AZURE,
    role: constants.USER_ROLES.OWNER,
  });

  const userMapping = await dbHelper.scanOne(UserMapping, {topcoderUsername});
  if (!userMapping) {
    await dbHelper.create(UserMapping, {
      id: helper.generateIdentifier(),
      topcoderUsername,
      azureUserId: userProfile.id,
      azureEmail: userProfile.emailAddress,
    });
  } else {
    await dbHelper.update(UserMapping, userMapping.id, {
      azureUserId: userProfile.id,
      azureEmail: userProfile.emailAddress,
    });
  }

  if (!user) {
    return await dbHelper.create(User, {
      id: helper.generateIdentifier(),
      role: constants.USER_ROLES.OWNER,
      type: constants.USER_TYPES.AZURE,
      userProviderId: helper.hashCode(userProfile.id),
      userProviderIdStr: userProfile.id,
      username: userProfile.emailAddress,
      accessToken: token,
    });
  }
  // save user token data
  return await dbHelper.update(User, user.id, {
    userProviderId: helper.hashCode(userProfile.id),
    userProviderIdStr: userProfile.id,
    username: userProfile.emailAddress,
    accessToken: token,
  });
}

ensureOwnerUser.schema = Joi.object().keys({
  token: Joi.string().required(),
  topcoderUsername: Joi.string().required(),
});

/**
 * List groups of owner user.
 * @param {Object} user the token
 * @param {Number} page the page number (default to be 1). Must be >= 1
 * @param {Number} perPage the page size (default to be constants.GITLAB_DEFAULT_PER_PAGE).
 *   Must be within range [1, constants.GITLAB_MAX_PER_PAGE]
 * @param {Boolean} getAll get all groups
 * @returns {Promise} the promise result
 */
async function listOwnerUserTeams(user, page = 1, perPage = constants.GITLAB_DEFAULT_PER_PAGE) {
  try {
    // https://app.vssps.visualstudio.com/_apis/accounts?api-version=5.0&ownerId=facd2f29-c239-6cd6-b374-d987a9f38d5c    
    const orgs = await request
      .get(`${config.AZURE_API_BASE_URL}/_apis/accounts?ownerId=${user.userProviderIdStr}&api-version=5.0`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .end()
      .then((res) => res.body);
    if (orgs.count === 0) {
      return {
        page,
        perPage,
        lastPage: 1,
        teams: []
      };
    }
    const org = orgs.value[0];
    const orgName = org.accountName;
    // https://dev.azure.com/telagaid/_apis/teams?api-version=5.1-preview.3
    const teams = await request
      .get(`${config.AZURE_DEVOPS_API_BASE_URL}/${orgName}/_apis/teams?api-version=5.1-preview.3`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .end()
      .then((res) => res.body);

    return {
      page,
      perPage,
      lastPage: 1,
      teams: teams.value.map((team) => {
        team.orgName = orgName;
        const urlComponent = team.url.split('/');
        team.projectId = urlComponent[urlComponent.length - 3]; // eslint-disable-line no-magic-numbers
        return team;
      })
    };
  } catch (err) {
    throw helper.convertGitLabError(err, 'Failed to list user groups');
  }
}

listOwnerUserTeams.schema = Joi.object().keys({
  user: Joi.object().required(),
  page: Joi.number().integer().min(1).optional(),
  perPage: Joi.number().integer().min(1).max(constants.GITLAB_MAX_PER_PAGE)
    .optional(),
  getAll: Joi.boolean().optional(),
});

/**
 * Get owner user group registration URL.
 * @param {String} token the access token of owner user
 * @param {String} ownerUsername the owner user name
 * @param {String} teamId the group id
 * @param {String} orgname the group access level
 * @param {String} projectId the projectid
 * @returns {Promise} the promise result
 */
async function getTeamRegistrationUrl(token, ownerUsername, teamId, orgname, projectId) {
  // generate identifier
  const identifier = helper.generateIdentifier();

  // create owner user group
  await dbHelper.create(OwnerUserTeam, {
    id: helper.generateIdentifier(),
    ownerUsername,
    type: constants.USER_TYPES.AZURE,
    teamId,
    identifier,
    ownerToken: token,
    githubOrgId: projectId,
    organizationName: orgname
  });

  // construct URL
  const url = `${config.WEBSITE}/api/${config.API_VERSION}/azure/teams/registration/${identifier}`;
  return {url};
}

getTeamRegistrationUrl.schema = Joi.object().keys({
  token: Joi.string().required(),
  ownerUsername: Joi.string().required(),
  teamId: Joi.string().required(),
  orgname: Joi.string().required(),
  projectId: Joi.string()
});

/**
 * Add group member.
 * @param {String} groupId the group id
 * @param {String} ownerUserToken the owner user token
 * @param {String} normalUserToken the normal user token
 * @param {String} accessLevel the access level
 * @param {String} expiredAt the expired at params to define how long user joined teams. can be null
 * @returns {Promise} the promise result
 */
async function addGroupMember(groupId, ownerUserToken, normalUserToken, accessLevel, expiredAt) {
  let username;
  let userId;
  try {
    // get normal user id
    const res = await request
      .get(`${config.GITLAB_API_BASE_URL}/api/v4/user`)
      .set('Authorization', `Bearer ${normalUserToken}`)
      .end();
    userId = res.body.id;
    username = res.body.username;
    if (!userId) {
      throw new errors.UnauthorizedError('Can not get user id from the normal user access token.');
    }

    let body = `user_id=${userId}&access_level=${accessLevel}`;
    if (expiredAt) {
      body = body + `&expires_at=${expiredAt} `;
    }
    // add user to group
    await request
      .post(`${config.GITLAB_API_BASE_URL}/api/v4/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${ownerUserToken}`)
      .send(body)
      .end();
    // return gitlab username
    return {
      username: res.body.username,
      id: res.body.id,
    };
  } catch (err) {
    if (_.get(JSON.parse(err.response.text), 'message') !== 'Member already exists') {
      if (err instanceof errors.ApiError) {
        throw err;
      }
      throw helper.convertGitLabError(err, 'Failed to add group member');
    }
    return {username, id: userId};
  }
}

addGroupMember.schema = Joi.object().keys({
  groupId: Joi.string().required(),
  ownerUserToken: Joi.string().required(),
  normalUserToken: Joi.string().required(),
  accessLevel: Joi.string().required(),
  expiredAt: Joi.string()
});

/**
 * Gets the user id by username
 * @param {string} username the username
 * @returns {number} the user id
 */
async function getUserIdByUsername(username) {
  try {
    // get current user
    const users = await request
      .get(`${config.GITLAB_API_BASE_URL}/api/v4/users?username=${username}`)
      .end()
      .then((res) => res.body);
    if (!users || !users.length) {
      throw new errors.NotFoundError(`The user with username ${username} is not found on gitlab`);
    }
    return users[0].id;
  } catch (err) {
    throw helper.convertGitLabError(err, 'Failed to get detail about user from gitlab.');
  }
}

getUserIdByUsername.schema = Joi.object().keys({
  username: Joi.string().required(),
});

/**
 * Refresh the owner user access token if needed
 * @param {Object} azureOwner the azure owner
 * @returns {Object} the user object
 */
async function refreshAzureUserAccessToken(azureOwner) {
  // if (azureOwner.accessTokenExpiration && azureOwner.accessTokenExpiration.getTime() <=
  //   new Date().getTime() + constants.AZURE_REFRESH_TOKEN_BEFORE_EXPIRATION * MS_PER_SECOND) {
      const refreshTokenResult = await request
        .post('https://app.vssps.visualstudio.com/oauth2/token')
        .send({
          client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
          client_assertion: encodeURIComponent(config.AZURE_CLIENT_SECRET),
          assertion: encodeURIComponent(azureOwner.refreshToken),
          grant_type: 'refresh_token',
          redirect_uri: `${config.WEBSITE_SECURE}${constants.AZURE_OWNER_CALLBACK_URL}`,
        })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .end();
      // save user token data
      const expiresIn = refreshTokenResult.body.expires_in || constants.AZURE_ACCESS_TOKEN_DEFAULT_EXPIRATION;
      return await dbHelper.update(User, azureOwner.id, {
        accessToken: refreshTokenResult.body.access_token,
        accessTokenExpiration: new Date(new Date().getTime() + expiresIn * MS_PER_SECOND),
        refreshToken: refreshTokenResult.body.refresh_token,
      });  
  // }
  // return azureOwner;
}

refreshAzureUserAccessToken.schema = Joi.object().keys({
  azureOwner: Joi.object().keys({
    id: Joi.string().required(),
    accessTokenExpiration: Joi.date().required(),
    refreshToken: Joi.string().required(),
    role: Joi.string(),
    userProviderId: Joi.number(),
    userProviderIdStr: Joi.string(),
    type: Joi.string(),
    accessToken: Joi.string(),
    username: Joi.string(),
  }),
});

/**
 * delete user fromgroup
 * @param {String} ownerUserToken the gitlab owner token
 * @param {String} groupId the gitlab group Id
 * @param {String} userId the normal user id
 */
async function deleteUserFromGitlabGroup(ownerUserToken, groupId, userId) {
  try {
    await request
      .del(`${config.GITLAB_API_BASE_URL}/api/v4/groups/${groupId}/members/${userId}`)
      .set('Authorization', `Bearer ${ownerUserToken}`)
      .send()
      .end();
  } catch (err) {
    // If a user is not found from gitlab, then ignore the error
    // eslint-disable-next-line no-magic-numbers
    if (err.status !== 404) {
      throw helper.convertGitLabError(err, `Failed to delete user from group, userId is ${userId}, groupId is ${groupId}.`);
    }
  }
}

deleteUserFromGitlabGroup.schema = Joi.object().keys({
  ownerUserToken: Joi.string().required(),
  groupId: Joi.string().required(),
  userId: Joi.string().required(),
});

module.exports = {
  ensureOwnerUser,
  listOwnerUserTeams,
  getTeamRegistrationUrl,
  addGroupMember,
  getUserIdByUsername,
  refreshAzureUserAccessToken,
  deleteUserFromGitlabGroup,
};

helper.buildService(module.exports);