/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * This controller exposes Github REST endpoints.
 *
 * @author TCSCODER
 * @version 1.0
 */

const _ = require('lodash');
const superagent = require('superagent');
const superagentPromise = require('superagent-promise');
const helper = require('../common/helper');
const dbHelper = require('../common/db-helper');
const errors = require('../common/errors');
const config = require('../config');
const GithubService = require('../services/GithubService');
const UserService = require('../services/UserService');
const OwnerUserTeam = require('../models').OwnerUserTeam;
const UserTeamMapping = require('../models').UserTeamMapping;
const GithubUserMapping = require('../models').GithubUserMapping;
const constants = require('../common/constants');

const request = superagentPromise(superagent, Promise);

/**
 * Owner user login.
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function ownerUserLogin(req, res) {
  // generate an identifier if not present,
  // the identifier is used as OAuth state
  if (!req.session.state) {
    req.session.state = helper.generateIdentifier();
  }
  // redirect to GitHub OAuth
  const callbackUri = `${config.WEBSITE}${constants.GITHUB_OWNER_CALLBACK_URL}`;
  res.redirect(`http://github.com/login/oauth/authorize?client_id=${
    config.GITHUB_CLIENT_ID
  }&redirect_uri=${
    encodeURIComponent(callbackUri)
  }&scope=${
    encodeURIComponent('admin:org admin:repo_hook repo')
  }&state=${req.session.state}`);
}

/**
 * Owner user login callback, redirected by GitHub.
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function ownerUserLoginCallback(req, res) {
  if (!req.session.state || req.query.state !== req.session.state) {
    throw new errors.ForbiddenError('Invalid state.');
  }

  const code = req.query.code;
  if (!code) {
    throw new errors.ValidationError('Missing code.');
  }
  const topcoderUsername = req.currentUser.handle;

  // exchange code to get token
  const result = await request
    .post('https://github.com/login/oauth/access_token')
    .query({client_id: config.GITHUB_CLIENT_ID, client_secret: config.GITHUB_CLIENT_SECRET, code})
    .set('Accept', 'application/json')
    .end();
  const token = result.body.access_token;
  // ensure the user is valid owner user
  const ownerUser = await GithubService.ensureOwnerUser(token, topcoderUsername);
  // store access token to session
  req.session.ownerUserAccessToken = token;
  req.session.ownerUsername = ownerUser.username;

  // redirect to success page
  res.redirect(constants.OWNER_USER_LOGIN_SUCCESS_URL);
}

/**
 * List teams of owner user.
 * @param {Object} req the request
 * @returns {Object} the owner user teams
 */
async function listOwnerUserTeams(req) {
  const user = await UserService.getAccessTokenByHandle(req.currentUser.handle, constants.USER_TYPES.GITHUB);
  if (!user || !user.accessToken) {
    throw new errors.UnauthorizedError('You have not setup for Github.');
  }
  return await GithubService.listOwnerUserTeams(user.accessToken, req.query.page, req.query.perPage);
}

/**
 * Get team registration URL.
 * @param {Object} req the request
 * @returns {Object} the team registration URL
 */
async function getTeamRegistrationUrl(req) {
  const user = await UserService.getAccessTokenByHandle(req.currentUser.handle, constants.USER_TYPES.GITHUB);
  if (!user || !user.accessToken) {
    throw new errors.UnauthorizedError('You have not setup for Github.');
  }
  return await GithubService.getTeamRegistrationUrl(user.accessToken, user.username, req.params.id,
    req.params.accessLevel);
}

/**
 * Add user to team.
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function addUserToTeam(req, res) {
  const identifier = req.params.identifier;
  console.log(`addUserToTeam called for ${identifier}`); /* eslint-disable-line no-console */
  // validate the identifier
  await helper.ensureExistsWithKey(OwnerUserTeam, 'identifier', identifier, 'OwnerUserTeam');

  // store identifier to session, to be compared in callback
  req.session.identifier = identifier;
  console.log(`addUserToTeam OwnerUserTeam ${JSON.stringify(OwnerUserTeam)}`); /* eslint-disable-line no-console */
  // redirect to GitHub OAuth
  const callbackUri = `${config.WEBSITE}/api/${config.API_VERSION}/github/normaluser/callback`;
  res.redirect(`http://github.com/login/oauth/authorize?client_id=${
    config.GITHUB_CLIENT_ID
  }&redirect_uri=${
    encodeURIComponent(callbackUri)
  }&state=${identifier}`);
}

/**
 * Normal user callback, to be added to team. Redirected by GitHub.
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function addUserToTeamCallback(req, res) {
  if (!req.session.identifier || req.query.state !== req.session.identifier) {
    throw new errors.ForbiddenError('Invalid state.');
  }
  const identifier = req.session.identifier;
  const code = req.query.code;
  if (!code) {
    throw new errors.ValidationError('Missing code.');
  }
  const team = await helper.ensureExistsWithKey(OwnerUserTeam, 'identifier', identifier, 'OwnerUserTeam');
  // exchange code to get token
  const result = await request
    .post('https://github.com/login/oauth/access_token')
    .query({client_id: config.GITHUB_CLIENT_ID, client_secret: config.GITHUB_CLIENT_SECRET, code})
    .set('Accept', 'application/json')
    .end();
  // Throw error if github access token was not returned (e.g. invalid code)
  if (!result.body.access_token) {
    throw new errors.UnauthorizedError('Github authorization failed.', result.body.error_description);
  }
  const token = result.body.access_token;
  // add user to team
  console.log(`adding ${token} to ${team.teamId} with ${team.ownerToken}`); /* eslint-disable-line no-console */
  const githubUser = await GithubService.addTeamMember(team.teamId, team.ownerToken, token, team.accessLevel);
  // associate github username with TC username
  const mapping = await dbHelper.queryOneUserMappingByTCUsername(GithubUserMapping, req.session.tcUsername);

  // get team details
  const teamDetails = await GithubService.getTeamDetails(team.ownerToken, team.teamId);

  if (mapping) {
    await dbHelper.update(GithubUserMapping, mapping.id, {
      githubUsername: githubUser.username,
      githubUserId: githubUser.id,
    });
  } else {
    console.log('User mapping not found. Create new mapping.'); /* eslint-disable-line no-console */
    await dbHelper.create(GithubUserMapping, {
      id: helper.generateIdentifier(),
      topcoderUsername: req.session.tcUsername,
      githubUsername: githubUser.username,
      githubUserId: githubUser.id,
    });
  }

  // associate github username and teamId
  const githubUserToTeamMapping = await dbHelper.queryOneUserTeamMapping(UserTeamMapping,
    team.teamId,
    githubUser.username,
    team.githubOrgId);

  if (!githubUserToTeamMapping) {
    await dbHelper.create(UserTeamMapping, {
      id: helper.generateIdentifier(),
      teamId: team.teamId,
      githubUserName: githubUser.username,
      githubOrgId: team.githubOrgId,
    });
  }

  // check if user is already in the team or not yet
  if (githubUser.state === 'active') {
    // redirect user to the success page, to let user know that he is already in the team
    const url = `${teamDetails.organization.login}_${teamDetails.name.replace(/ /g, '-')}`;
    res.redirect(`${constants.USER_ADDED_TO_TEAM_SUCCESS_URL}/github/${url}`);
  } else {
    // redirect user to organization invitation page
    const organizationLogin = _.get(teamDetails, 'organization.login');
    if (!organizationLogin) {
      throw new errors.ValidationError(`Couldn't get organization of the team with id '${team.teamId}'.`);
    }
    res.redirect(`https://github.com/orgs/${organizationLogin}/invitation?via_email=1`);
  }
}

/**
 * Delete users from a team.
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function deleteUsersFromTeam(req, res) {
  let teamInDB;
  const teamId = req.params.id;
  try {
    teamInDB = await helper.ensureExistsWithKey(OwnerUserTeam, 'teamId', teamId, 'OwnerUserTeam');
  } catch (err) {
    if (!(err instanceof errors.NotFoundError)) {
      throw err;
    }
  }
  // If teamInDB not exists, then just return
  if (teamInDB) {
    try {
      const githubOrgId = teamInDB.githubOrgId;
      const token = teamInDB.ownerToken;
      const userTeamMappings = await dbHelper.scan(UserTeamMapping, {
        teamId: req.params.id,
      });
      // eslint-disable-next-line no-restricted-syntax
      for (const userTeamMapItem of userTeamMappings) {
        await GithubService.deleteUserFromGithubTeam(token, teamId, githubOrgId, userTeamMapItem.githubUserName);
        await dbHelper.removeById(UserTeamMapping, userTeamMapItem.id);
      }
    } catch (err) {
      throw err;
    }
  }
  res.send({});
}

module.exports = {
  ownerUserLogin,
  ownerUserLoginCallback,
  listOwnerUserTeams,
  getTeamRegistrationUrl,
  addUserToTeam,
  addUserToTeamCallback,
  deleteUsersFromTeam,
};

helper.buildController(module.exports);
