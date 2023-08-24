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
const GitlabUserMapping = require('../models').GitlabUserMapping;
const OwnerUserGroup = require('../models').OwnerUserGroup;

const request = superagentPromise(superagent, Promise);
// milliseconds per second
const MS_PER_SECOND = 1000;

/**
 * Get user profile.
 * @param {string} token User token
 * @returns {Promise<Object>} the promise result of user profile
 */
async function getUserProfile(token) {
  try {
    // get current user name
    const userProfile = await request
      .get(`${config.GITLAB_API_BASE_URL}/api/v4/user`)
      .set('Authorization', `Bearer ${token}`)
      .end()
      .then((res) => res.body);
    if (!userProfile) {
      throw new errors.UnauthorizedError('Can not get user from the access token.');
    }
    return userProfile;
  } catch (err) {
    if (!(err instanceof errors.UnauthorizedError)) {
      throw helper.convertGitLabError(err, 'Failed to ensure valid owner user.');
    }
    throw err;
  }
}

getUserProfile.schema = Joi.object().keys({
  token: Joi.string().required(),
});

/**
 * Ensure the owner user is in database.
 * @param {String} token the access token of owner user
 * @param {Date} expiryTime the expiry time of owner user
 * @param {String} refreshToken the refresh token of owner user
 * @param {String} topcoderUsername the topcoder handle of owner user
 * @param {String} userRole the role of user
 * @returns {Promise} the promise result of found owner user
 */
async function ensureUser(token, expiryTime, refreshToken, topcoderUsername, userRole) {
  const userProfile = await getUserProfile(token);
  const user = await dbHelper.queryOneUserByTypeAndRole(User,
    userProfile.username,
    constants.USER_TYPES.GITLAB,
    userRole);

  const userMapping = await dbHelper.queryOneUserMappingByTCUsername(GitlabUserMapping, topcoderUsername);
  if (!userMapping) {
    await dbHelper.create(GitlabUserMapping, {
      id: helper.generateIdentifier(),
      topcoderUsername,
      gitlabUserId: userProfile.id,
      gitlabUsername: userProfile.username,
    });
  } else {
    await dbHelper.update(GitlabUserMapping, userMapping.id, {
      gitlabUserId: userProfile.id,
      gitlabUsername: userProfile.username,
    });
  }

  if (!user) {
    return await dbHelper.create(User, {
      id: helper.generateIdentifier(),
      role: userRole,
      type: constants.USER_TYPES.GITLAB,
      userProviderId: userProfile.id,
      username: userProfile.username,
      accessToken: token,
      accessTokenExpiration: expiryTime,
      refreshToken,
    });
  }
  // save user token data
  return await dbHelper.update(User, user.id, {
    userProviderId: userProfile.id,
    username: userProfile.username,
    accessToken: token,
    accessTokenExpiration: expiryTime,
    refreshToken,
  });
}

ensureUser.schema = Joi.object().keys({
  token: Joi.string().required(),
  expiryTime: Joi.date().required(),
  refreshToken: Joi.string().required(),
  topcoderUsername: Joi.string().required(),
  userRole: Joi.string().required(),
});

/**
 * List groups of owner user.
 * @param {String} gitUsername the git username
 * @param {String} token the token
 * @param {Number} page the page number (default to be 1). Must be >= 1
 * @param {Number} perPage the page size (default to be constants.GITLAB_DEFAULT_PER_PAGE).
 *   Must be within range [1, constants.GITLAB_MAX_PER_PAGE]
 * @param {Boolean} getAll get all groups
 * @returns {Promise} the promise result
 */
async function listOwnerUserGroups(gitUsername, token, page = 1, perPage = constants.GITLAB_DEFAULT_PER_PAGE,
  getAll = false) {
  try {
    const response = await request
      .get(`${config.GITLAB_API_BASE_URL}/api/v4/groups`)
      .query({page, per_page: perPage, owned: true, all_available: getAll})
      .set('Authorization', `Bearer ${token}`)
      .end();

    const result = {
      page,
      perPage,
      lastPage: 1,
      groups: response.body,
    };

    if (response.headers.link) {
      const links = response.headers.link.split(/\s*,\s*/);
      links.forEach((link) => {
        if (link.endsWith('rel="last"')) {
          const matches = link.match(/.*[?&]page=(\d+).*/);
          if (matches) {
            result.lastPage = parseInt(matches[1], 10);
          }
        }
      });
    }
    return result;
  } catch (err) {
    throw await helper.convertGitLabErrorAsync(err, 'Failed to list user groups', gitUsername);
  }
}

listOwnerUserGroups.schema = Joi.object().keys({
  gitUsername: Joi.string().required(),
  token: Joi.string().required(),
  page: Joi.number().integer().min(1).optional(),
  perPage: Joi.number().integer().min(1).max(constants.GITLAB_MAX_PER_PAGE)
    .optional(),
  getAll: Joi.boolean().optional(),
});

/**
 * Get owner user group registration URL.
 * @param {String} ownerUsername the owner user name
 * @param {String} groupId the group id
 * @param {String} accessLevel the group access level
 * @param {String} expiredAt the expired at params to define how long user joined teams. can be null
 * @returns {Promise} the promise result
 */
async function getGroupRegistrationUrl(ownerUsername, groupId, accessLevel, expiredAt) {
  // generate identifier
  const identifier = helper.generateIdentifier();

  // create owner user group
  await dbHelper.create(OwnerUserGroup, {
    id: helper.generateIdentifier(),
    ownerUsername,
    type: constants.USER_TYPES.GITLAB,
    groupId,
    identifier,
    accessLevel,
    expiredAt,
  });

  // construct URL
  const url = `${config.WEBSITE}/api/${config.API_VERSION}/gitlab/groups/registration/${identifier}`;
  return {url};
}

getGroupRegistrationUrl.schema = Joi.object().keys({
  ownerUsername: Joi.string().required(),
  groupId: Joi.string().required(),
  accessLevel: Joi.string().required(),
  expiredAt: Joi.string(),
});

/**
 * Add group member.
 * @param {String} gitUsername the git username
 * @param {String} groupId the group id
 * @param {String} ownerUserToken the owner user token
 * @param {String} normalUserToken the normal user token
 * @param {String} accessLevel the access level
 * @param {String} expiredAt the expired at params to define how long user joined teams. can be null
 * @returns {Promise} the promise result
 */
async function addGroupMember(gitUsername, groupId, ownerUserToken, normalUserToken, accessLevel, expiredAt) { // eslint-disable-line max-params
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
    if (expiredAt && helper.isValidGitlabExpiresDate(expiredAt)) {
      body += `&expires_at=${expiredAt}`;
    }
    // add user to group
    await request
      .post(`${config.GITLAB_API_BASE_URL}/api/v4/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${ownerUserToken}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
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
      throw await helper.convertGitLabErrorAsync(
        err, `Failed to add group member userId=${userId} accessLevel=${accessLevel} expiredAt=${expiredAt}`,
        gitUsername);
    }
    return {username, id: userId};
  }
}

addGroupMember.schema = Joi.object().keys({
  gitUsername: Joi.string().required(),
  groupId: Joi.string().required(),
  ownerUserToken: Joi.string().required(),
  normalUserToken: Joi.string().required(),
  accessLevel: Joi.string().required(),
  expiredAt: Joi.string(),
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
    throw helper.convertGitLabError(err, 'Failed to get detail about user from gitlab');
  }
}

getUserIdByUsername.schema = Joi.object().keys({
  username: Joi.string().required(),
});

/**
 * Refresh the owner user access token if needed
 * @param {Object} gitlabOwner the gitlab owner
 * @returns {Promise} the promise result of owner user with refreshed token
 */
async function refreshGitlabUserAccessToken(gitlabOwner) {
  if (gitlabOwner.accessTokenExpiration && new Date().getTime() > gitlabOwner.accessTokenExpiration.getTime() -
    (constants.GITLAB_REFRESH_TOKEN_BEFORE_EXPIRATION * MS_PER_SECOND)) {
    const refreshTokenResult = await request
      .post('https://gitlab.com/oauth/token')
      .query({
        client_id: config.GITLAB_CLIENT_ID,
        client_secret: config.GITLAB_CLIENT_SECRET,
        refresh_token: gitlabOwner.refreshToken,
        grant_type: 'refresh_token',
        redirect_uri: `${config.WEBSITE}/api/${config.API_VERSION}/gitlab/owneruser/callback`,
      })
      .end();
      // save user token data
    const expiresIn = refreshTokenResult.body.expires_in || constants.GITLAB_ACCESS_TOKEN_DEFAULT_EXPIRATION;
    return await dbHelper.update(User, gitlabOwner.id, {
      accessToken: refreshTokenResult.body.access_token,
      accessTokenExpiration: new Date(new Date().getTime() + expiresIn * MS_PER_SECOND),
      refreshToken: refreshTokenResult.body.refresh_token,
    });
  }
  return gitlabOwner;
}

refreshGitlabUserAccessToken.schema = Joi.object().keys({
  gitlabOwner: Joi.object().keys({
    id: Joi.string().required(),
    accessTokenExpiration: Joi.date().required(),
    refreshToken: Joi.string().required(),
    role: Joi.string(),
    userProviderId: Joi.number(),
    type: Joi.string(),
    accessToken: Joi.string(),
    username: Joi.string(),
  }),
});

/**
 * delete user fromgroup
 * @param {String} gitUsername the git username
 * @param {String} ownerUserToken the gitlab owner token
 * @param {String} groupId the gitlab group Id
 * @param {String} userId the normal user id
 */
async function deleteUserFromGitlabGroup(gitUsername, ownerUserToken, groupId, userId) {
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
      throw await helper.convertGitLabErrorAsync(
        err, `Failed to delete user from group, userId is ${userId}, groupId is ${groupId}.`, gitUsername);
    }
  }
}

deleteUserFromGitlabGroup.schema = Joi.object().keys({
  gitUsername: Joi.string().required(),
  ownerUserToken: Joi.string().required(),
  groupId: Joi.string().required(),
  userId: Joi.string().required(),
});

module.exports = {
  getUserProfile,
  ensureUser,
  listOwnerUserGroups,
  getGroupRegistrationUrl,
  addGroupMember,
  getUserIdByUsername,
  refreshGitlabUserAccessToken,
  deleteUserFromGitlabGroup,
};

helper.buildService(module.exports);
