/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * This controller exposes Github REST endpoints.
 *
 * @author TCSCODER
 * @version 1.0
 */

const superagent = require('superagent');
const superagentPromise = require('superagent-promise');
const helper = require('../common/helper');
const dbHelper = require('../common/db-helper');
const errors = require('../common/errors');
const config = require('../config');
const GithubService = require('../services/GithubService');
const UserService = require('../services/UserService');
const OwnerUserTeam = require('../models').OwnerUserTeam;
const UserMapping = require('../models').UserMapping;
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
  return await GithubService.getTeamRegistrationUrl(user.accessToken, user.username, req.params.id);
}

/**
 * Add user to team.
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function addUserToTeam(req, res) {
  const identifier = req.params.identifier;
  // validate the identifier
  await helper.ensureExists(OwnerUserTeam, {identifier}, 'OwnerUserTeam');

  // store identifier to session, to be compared in callback
  req.session.identifier = identifier;

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
  const team = await helper.ensureExists(OwnerUserTeam, {identifier}, 'OwnerUserTeam');
  // exchange code to get token
  const result = await request
    .post('https://github.com/login/oauth/access_token')
    .query({client_id: config.GITHUB_CLIENT_ID, client_secret: config.GITHUB_CLIENT_SECRET, code})
    .set('Accept', 'application/json')
    .end();
  const token = result.body.access_token;
  // add user to team
  const githubUser = await GithubService.addTeamMember(team.teamId, team.ownerToken, token);
  // associate github username with TC username
  const mapping = await dbHelper.scanOne(UserMapping, {
    topcoderUsername: {eq: req.session.tcUsername},
  });

  if (mapping) {
    await dbHelper.update(UserMapping, mapping.id, {
      githubUsername: githubUser.username,
      githubUserId: githubUser.id,
    });
  } else {
    await dbHelper.create(UserMapping, {
      id: helper.generateIdentifier(),
      topcoderUsername: req.session.tcUsername,
      githubUsername: githubUser.username,
      githubUserId: githubUser.id,
    });
  }
  // redirect to success page
  res.redirect(`${constants.USER_ADDED_TO_TEAM_SUCCESS_URL}/github`);
}

module.exports = {
  ownerUserLogin,
  ownerUserLoginCallback,
  listOwnerUserTeams,
  getTeamRegistrationUrl,
  addUserToTeam,
  addUserToTeamCallback,
};

helper.buildController(module.exports);
