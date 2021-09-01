/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * This service will provide Github operations.
 *
 * @author TCSCODER
 * @version 1.0
 */

const GitHub = require('github-api');
const Joi = require('joi');
const _ = require('lodash');
const config = require('../config');
const constants = require('../common/constants');
const helper = require('../common/helper');
const dbHelper = require('../common/db-helper');
const User = require('../models').User;
const GithubUserMapping = require('../models').GithubUserMapping;
const OwnerUserTeam = require('../models').OwnerUserTeam;
const Organisation = require('../models').Organisation;
const errors = require('../common/errors');
const superagent = require('superagent');
const superagentPromise = require('superagent-promise');

const request = superagentPromise(superagent, Promise);

/**
 * Ensure the owner user is in database.
 * @param {String} token the access token of owner user
 * @param {String} topcoderUsername the topcoder handle of owner user
 * @returns {Promise} the promise result of found owner user
 */
async function ensureOwnerUser(token, topcoderUsername) {
  let userProfile;
  try {
    const github = new GitHub({token});
    const user = await github.getUser().getProfile();
    userProfile = user.data;
  } catch (err) {
    throw helper.convertGitHubError(err, 'Failed to ensure valid owner user.');
  }
  const user = await dbHelper.queryOneUserByTypeAndRole(User,
    userProfile.login,
    constants.USER_TYPES.GITHUB,
    constants.USER_ROLES.OWNER);

  const userMapping = await dbHelper.queryOneUserMappingByTCUsername(GithubUserMapping, topcoderUsername);
  if (!userMapping) {
    await dbHelper.create(GithubUserMapping, {
      id: helper.generateIdentifier(),
      topcoderUsername,
      githubUserId: userProfile.id,
      githubUsername: userProfile.login,
    });
  } else {
    await dbHelper.update(GithubUserMapping, userMapping.id, {
      githubUserId: userProfile.id,
      githubUsername: userProfile.login,
    });
  }
  if (!user) {
    return await dbHelper.create(User, {
      id: helper.generateIdentifier(),
      role: constants.USER_ROLES.OWNER,
      type: constants.USER_TYPES.GITHUB,
      userProviderId: userProfile.id,
      username: userProfile.login,
      accessToken: token,
    });
  }
  // save user token data
  return await dbHelper.update(User, user.id, {
    userProviderId: userProfile.id,
    username: userProfile.login,
    accessToken: token,
  });
}

ensureOwnerUser.schema = Joi.object().keys({
  token: Joi.string().required(),
  topcoderUsername: Joi.string().required(),
});


/**
 * List teams of owner user.
 * @param {String} token the access token of owner user
 * @param {Number} page the page number (default to be 1). Must be >= 1
 * @param {Number} perPage the page size (default to be constants.DEFAULT_PER_PAGE). Must be within range [1, constants.MAX_PER_PAGE]
 * @returns {Promise} the promise result
 */
async function listOwnerUserTeams(token, page = 1, perPage = constants.DEFAULT_PER_PAGE) {
  try {
    const github = new GitHub({token});
    const user = github.getUser();

    const response = await user._request('GET', '/user/teams', {
      page,
      per_page: perPage,
    });

    const result = {
      page,
      perPage,
      lastPage: 1,
      teams: response.data,
    };

    if (response.headers.link) {
      const links = response.headers.link.split(/\s*,\s*/);
      links.reduce((_result, link) => {
        if (link.endsWith('rel="last"')) {
          _result.lastPage = (link.match(/.*[?&]page=(\d+).*/) || [])[1] || 1;
        }
        return _result;
      }, result);
      result.lastPage = parseInt(result.lastPage, 10);
    }

    return result;
  } catch (err) {
    throw helper.convertGitHubError(err, 'Failed to list user teams');
  }
}

listOwnerUserTeams.schema = Joi.object().keys({
  token: Joi.string().required(),
  page: Joi.number().integer().min(1).optional(),
  perPage: Joi.number().integer().min(1).max(constants.MAX_PER_PAGE)
    .optional(),
});

/**
 * Get owner user team registration URL.
 * @param {String} token the access token of owner user
 * @param {String} ownerUsername the owner user name
 * @param {String} teamId the team id
 * @param {String} accessLevel the team access level
 * @returns {Promise} the promise result
 */
async function getTeamRegistrationUrl(token, ownerUsername, teamId, accessLevel) {
  // check whether owner user can add team member to the team
  let membershipData;
  let githubOrgId;
  try {
    const github = new GitHub({token});
    const team = github.getTeam(teamId);
    const teamInfo = await team.getTeam();
    githubOrgId = await teamInfo.data.organization.id;
    const response = await team.getMembership(ownerUsername);
    membershipData = response.data;
  } catch (err) {
    throw helper.convertGitHubError(err, 'Failed to get team membership details.');
  }
  if (!membershipData || membershipData.role !== 'maintainer' || membershipData.state !== 'active') {
    throw new errors.ForbiddenError('The owner user can not add member to the team.');
  }

  // generate identifier
  const identifier = helper.generateIdentifier();

  // create owner user team
  await dbHelper.create(OwnerUserTeam, {
    id: helper.generateIdentifier(),
    ownerUsername,
    type: constants.USER_TYPES.GITHUB,
    teamId,
    githubOrgId,
    ownerToken: token,
    identifier,
    accessLevel,
  });

  // construct URL
  const url = `${config.WEBSITE}/api/${config.API_VERSION}/github/teams/registration/${identifier}`;
  return {url};
}

getTeamRegistrationUrl.schema = Joi.object().keys({
  token: Joi.string().required(),
  ownerUsername: Joi.string().required(),
  teamId: Joi.string().required(),
  accessLevel: Joi.string().valid('member', 'maintainer').required(),
});

/**
 * Add team member.
 * @param {String} teamId the team id
 * @param {String} ownerUserToken the owner user token
 * @param {String} normalUserToken the normal user token
 * @param {String} accessLevel the team's access level
 * @returns {Promise} the promise result
 */
async function addTeamMember(teamId, ownerUserToken, normalUserToken, accessLevel) {
  let username;
  let id;
  let state;
  try {
    // get normal user name
    const githubNormalUser = new GitHub({
      token: normalUserToken,
    });
    const normalUser = await githubNormalUser.getUser().getProfile();
    username = normalUser.data.login;
    id = normalUser.data.id;

    // add normal user to team
    const github = new GitHub({
      token: ownerUserToken,
    });
    const team = github.getTeam(teamId);
    const membershipResponse = await team.addMembership(username, {role: accessLevel});
    state = _.get(membershipResponse, 'data.state');
  } catch (err) {
    // if error is already exists discard
    if (_.chain(err).get('body.errors').countBy({
      code: 'already_exists',
    }).get('true')
      .isUndefined()
      .value()) {
      throw helper.convertGitHubError(err, 'Failed to add team member');
    }
  }
  // return github username and its state
  return {username, id, state};
}

addTeamMember.schema = Joi.object().keys({
  teamId: Joi.string().required(),
  ownerUserToken: Joi.string().required(),
  normalUserToken: Joi.string().required(),
  accessLevel: Joi.string().required(),
});

/**
 * Add organisation member.
 * @param {String} organisation the organisation name
 * @param {String} normalUserToken the normal user token
 * @returns {Promise} the promise result
 */
async function addOrganisationMember(organisation, normalUserToken) {
  let state;
  try {
    const dbOrganisation = await dbHelper.queryOneOrganisation(Organisation, organisation);
    if (!dbOrganisation) {
      console.log(`Personal access token not found for organisation ${organisation}.`);  /* eslint-disable-line no-console */
      return {};
    }
    const githubNormalUser = new GitHub({
      token: normalUserToken,
    });
    const normalUser = await githubNormalUser.getUser().getProfile();
    const username = normalUser.data.login;
    const base64PAT = Buffer.from(`${dbOrganisation.owner}:${dbOrganisation.personalAccessToken}`).toString('base64');
    const result = await request
      .put(`https://api.github.com/orgs/${organisation}/memberships/${username}`)
      .send({role: 'member'})
      .set('User-Agent', 'superagent')
      .set('Accept', 'application/vnd.github.v3+json')
      .set('Authorization', `Basic ${base64PAT}`)
      .end();
    state = _.get(result, 'body.state');
  } catch (err) {
    // if error is already exists discard
    if (_.chain(err).get('body.errors').countBy({
      code: 'already_exists',
    }).get('true')
      .isUndefined()
      .value()) {
      throw helper.convertGitHubError(err, 'Failed to add organisation member');
    }
  }
  // return its state
  return {state};
}

addOrganisationMember.schema = Joi.object().keys({
  organisation: Joi.string().required(),
  normalUserToken: Joi.string().required()
});

/**
 * Accept organisation invitation by member.
 * @param {String} organisation the organisation name
 * @param {String} normalUserToken the normal user token
 * @returns {Promise} the promise result
 */
async function acceptOrganisationInvitation(organisation, normalUserToken) {
  let state;
  try {
    const result = await request
      .patch(`https://api.github.com/user/memberships/orgs/${organisation}`)
      .send({state: 'active'})
      .set('User-Agent', 'superagent')
      .set('Accept', 'application/vnd.github.v3+json')
      .set('Authorization', `token ${normalUserToken}`)
      .end();
    state = _.get(result, 'body.state');
  } catch (err) {
    // if error is already exists discard
    if (_.chain(err).get('body.errors').countBy({
      code: 'already_exists',
    }).get('true')
      .isUndefined()
      .value()) {
      throw helper.convertGitHubError(err, 'Failed to accept organisation invitation');
    }
  }
  // return its state
  return {state};
}

acceptOrganisationInvitation.schema = Joi.object().keys({
  organisation: Joi.string().required(),
  normalUserToken: Joi.string().required()
});

/**
 * Gets the user id by username
 * @param {string} username the username
 * @returns {number} the user id
 */
async function getUserIdByUsername(username) {
  try {
    const github = new GitHub();
    const user = await github.getUser(username).getProfile();
    if (!user || !user.data) {
      throw new Error(`The user with username ${username} is not found on github`);
    }
    return user.data.id;
  } catch (err) {
    throw new Error(`The user with username ${username} is not found on github`);
  }
}

getUserIdByUsername.schema = Joi.object().keys({
  username: Joi.string().required(),
});

/**
 * Get team detailed data
 *
 * @param {String} token user owner token
 * @param {String|Number} teamId team id
 *
 * @returns {Object} team object, see https://developer.github.com/v3/teams/#get-team
 */
async function getTeamDetails(token, teamId) {
  const teamIdAsNumber = !_.isNumber(teamId) ? parseInt(teamId, 10) : teamId;
  let team;

  try {
    const github = new GitHub({token});
    const teamResponse = await github.getTeam(teamIdAsNumber).getTeam();

    team = teamResponse.data;
  } catch (err) {
    throw helper.convertGitHubError(err, `Failed to get team with id '${teamId}'.`);
  }

  return team;
}

getTeamDetails.schema = Joi.object().keys({
  token: Joi.string().required(),
  teamId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
});


/**
 * Get team detailed data
 *
 * @param {String} token user owner token
 * @param {String|Number} teamId team id
 * @param {String|Number} orgId team id
 * @param {String|Number} githubUserName team id
 *
 * @returns {Object} status object, see https://developer.github.com/v3/teams/members/#remove-team-membership
 */
async function deleteUserFromGithubTeam(token, teamId, orgId, githubUserName) {
  const teamIdAsNumber = !_.isNumber(teamId) ? parseInt(teamId, 10) : teamId;
  let deleteResult;
  try {
    const github = new GitHub({token});
    const team = await github.getTeam(teamIdAsNumber);
    const deleteGithubUserEndpoint = `/organizations/${orgId}/team/${teamIdAsNumber}/memberships/${githubUserName}`;
    deleteResult = await team._request('DELETE', deleteGithubUserEndpoint);
  } catch (err) {
    throw helper.convertGitHubError(err, `Failed to delete user '${githubUserName}' from org with orgId '${orgId}' and team id '${teamId}'.`);
  }
  return deleteResult;
}

deleteUserFromGithubTeam.schema = Joi.object().keys({
  token: Joi.string().required(),
  teamId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  orgId: Joi.string().required(),
  githubUserName: Joi.string().required(),
});

module.exports = {
  ensureOwnerUser,
  listOwnerUserTeams,
  getTeamRegistrationUrl,
  addTeamMember,
  getUserIdByUsername,
  getTeamDetails,
  deleteUserFromGithubTeam,
  addOrganisationMember,
  acceptOrganisationInvitation
};

helper.buildService(module.exports);
