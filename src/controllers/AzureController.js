/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * This controller exposes Azure REST endpoints.
 *
 * @author TCSCODER
 * @version 1.0
 */
// const _ = require('lodash');
const superagent = require('superagent');
const superagentPromise = require('superagent-promise');
const helper = require('../common/helper');
const dbHelper = require('../common/db-helper');
const errors = require('../common/errors');
const constants = require('../common/constants');
const config = require('../config');
const AzureService = require('../services/AzureService');
const UserService = require('../services/UserService');
const User = require('../models').User;
const OwnerUserTeam = require('../models').OwnerUserTeam;
const UserMapping = require('../models').UserMapping;
const UserTeamMapping = require('../models').UserTeamMapping;

const request = superagentPromise(superagent, Promise);

// milliseconds per second
const MS_PER_SECOND = 1000;

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
  // redirect to Azure OAuth
  const callbackUri = `${config.WEBSITE_SECURE}${constants.AZURE_OWNER_CALLBACK_URL}`;
  res.redirect(`https://app.vssps.visualstudio.com/oauth2/authorize?client_id=${
    config.AZURE_APP_ID
  }&redirect_uri=${
    encodeURIComponent(callbackUri)
  }&response_type=Assertion&state=${req.session.state}&scope=vso.identity_manage vso.memberentitlementmanagement_write vso.notification_manage vso.profile_write vso.project_manage vso.wiki_write vso.work_full`);
}

/**
 * Owner user login callback, redirected by Azure.
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

  // exchange code to get token
  const result = await request
    .post('https://app.vssps.visualstudio.com/oauth2/token')
    .send({
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: encodeURIComponent(config.AZURE_CLIENT_SECRET),
      assertion: encodeURIComponent(code),
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      redirect_uri: `${config.WEBSITE_SECURE}${constants.AZURE_OWNER_CALLBACK_URL}`,
    })
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .end();
  const topcoderUsername = req.currentUser.handle;
  const accessToken = result.body.access_token;
  const refreshToken = result.body.refresh_token;
  const expiresIn = result.body.expires_in || constants.AZURE_ACCESS_TOKEN_DEFAULT_EXPIRATION;
  
  // ensure the user is valid owner user
  const ownerUser = await AzureService.ensureOwnerUser(accessToken, topcoderUsername);
  // save user token data
  await dbHelper.update(User, ownerUser.id, {
    accessToken,
    accessTokenExpiration: new Date(new Date().getTime() + expiresIn * MS_PER_SECOND),
    refreshToken,
  });

  // refresh token periodically
  // store username to session
  req.session.azureOwnerUsername = ownerUser.username;
  // redirect to success page
  res.redirect(constants.OWNER_USER_LOGIN_SUCCESS_URL);
}

/**
 * List teams of owner user.
 * @param {Object} req the request
 * @returns {Object} the owner user groups
 */
async function listOwnerUserTeams(req) {
  const user = await UserService.getAccessTokenByHandle(req.currentUser.handle, constants.USER_TYPES.AZURE);
  if (!user || !user.accessToken) {
    throw new errors.UnauthorizedError('You have not setup for Azure.');
  }
  return await AzureService.listOwnerUserTeams(user, req.query.page, req.query.perPage);
}

/**
 * Get group registration URL.
 * @param {Object} req the request
 * @returns {Object} the group registration URL
 */
async function getTeamRegistrationUrl(req) {
  const user = await UserService.getAccessTokenByHandle(req.currentUser.handle, constants.USER_TYPES.AZURE);
  if (!user || !user.accessToken) {
    throw new errors.UnauthorizedError('You have not setup for Azure.');
  }
  return await AzureService.getTeamRegistrationUrl(user.accessToken, user.username, req.params.id,
    req.params.orgname, req.params.projectId);
}

/**
 * Add user to group.
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function addUserToTeam(req, res) {
  const identifier = req.params.identifier;
  // validate the identifier
  await helper.ensureExists(OwnerUserTeam, {identifier}, 'OwnerUserTeam');

  // store identifier to session, to be compared in callback
  req.session.identifier = identifier;

  // redirect to Azure OAuth
  const callbackUri = `${config.WEBSITE_SECURE}/api/${config.API_VERSION}/azure/normaluser/callback`;
  res.redirect(`https://app.vssps.visualstudio.com/oauth2/authorize?client_id=${
    config.AZURE_USER_APP_ID
  }&redirect_uri=${
    encodeURIComponent(callbackUri)
  }&response_type=Assertion&state=${identifier}&scope=vso.profile`);
}

/**
 * Normal user callback, to be added to group. Redirected by Azure.
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function addUserToTeamCallback(req, res) {
  if (req.query.error_description) {
    throw new errors.ForbiddenError(req.query.error_description.replace(/\+/g, ' '));
  }
  if (!req.session.identifier || req.query.state !== req.session.identifier) {
    throw new errors.ForbiddenError('Invalid state.');
  }
  const identifier = req.session.identifier;
  const code = req.query.code;
  if (!code) {
    throw new errors.ValidationError('Missing code.');
  }
  const team = await helper.ensureExists(OwnerUserTeam, {identifier}, 'OwnerUserTeam');

  if (!team) {
    throw new errors.NotFoundError('The group is not found or not accessible.');
  }

  // get owner user
  const ownerUser = await helper.ensureExists(User,
    {username: team.ownerUsername, type: constants.USER_TYPES.AZURE, role: constants.USER_ROLES.OWNER}, 'User');

  if (!ownerUser) {
    throw new errors.NotFoundError('The owner user is not found or not accessible.');
  }

  await AzureService.refreshAzureUserAccessToken(ownerUser);

  const result = await request
    .post('https://app.vssps.visualstudio.com/oauth2/token')
    .send({
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: encodeURIComponent(config.AZURE_USER_CLIENT_SECRET),
      assertion: encodeURIComponent(code),
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      redirect_uri: `${config.WEBSITE_SECURE}/api/${config.API_VERSION}/azure/normaluser/callback`,
    })
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .end();
  const token = result.body.access_token;
  
  const userProfile = await request
    .get(`${config.AZURE_API_BASE_URL}/_apis/profile/profiles/me?api-version=5.1`)
    .set('Authorization', `Bearer ${token}`)
    .end()
    .then((resp) => resp.body);

  try {
    await request
    .patch(`https://vsaex.dev.azure.com/${team.organizationName}/_apis/UserEntitlements?doNotSendInviteForNewUsers=true&api-version=5.1-preview.3`)
    .send([{
        from: '',
        op: 0,
        path: `/${userProfile.id}/projectEntitlements/${team.githubOrgId}/teamRefs`,
        value: {
          id:team.teamId
        }
      }])
    .set('Content-Type', 'application/json-patch+json')
    .set('Authorization', `Bearer ${team.ownerToken}`)
    .end();
  }
  catch(err) {
    console.log(err); // eslint-disable-line no-console
  }

  // associate azure username with TC username
  const mapping = await dbHelper.scanOne(UserMapping, {
    topcoderUsername: {eq: req.session.tcUsername},
  });
  if (mapping) {
    await dbHelper.update(UserMapping, mapping.id, {
      azureEmail: userProfile.emailAddress,
      azureUserId: userProfile.id
    });
  } else {
    await dbHelper.create(UserMapping, {
      id: helper.generateIdentifier(),
      topcoderUsername: req.session.tcUsername,
      azureEmail: userProfile.emailAddress,
      azureUserId: userProfile.id
    });
  }

  const azureUserToTeamMapping = await dbHelper.scanOne(UserTeamMapping, {
    teamId: {eq: team.teamId},
    azureUserId: {eq: userProfile.id},
  });

  if (!azureUserToTeamMapping) {
    await dbHelper.create(UserTeamMapping, {
      id: helper.generateIdentifier(),
      teamId: team.teamId,
      azureUserId: userProfile.id,
      azureProjectId: team.githubOrgId
    });
  }
  
  // redirect to success page
  res.redirect(`${constants.USER_ADDED_TO_TEAM_SUCCESS_URL}/azure/${team.organizationName}_${team.githubOrgId}`);
}


/**
 * Delete users from a team.
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function deleteUsersFromTeam(req, res) {
  const teamId = req.params.id;
  let teamInDB;
  try {
    teamInDB = await helper.ensureExists(OwnerUserTeam, {teamId}, 'OwnerUserTeam');
  } catch (err) {
    if (!(err instanceof errors.NotFoundError)) {
      throw err;
    }
  }
  // If teamInDB not exists, then just return
  if (teamInDB) {
    try {
      const ownerUser = await helper.ensureExists(User,
        {username: teamInDB.ownerUsername, type: constants.USER_TYPES.AZURE, role: constants.USER_ROLES.OWNER}, 'User');
      await AzureService.refreshAzureUserAccessToken(ownerUser);
      const userTeamMappings = await dbHelper.scan(UserTeamMapping, {teamId});
      // eslint-disable-next-line no-restricted-syntax
      for (const userTeamMapItem of userTeamMappings) {
        await AzureService.deleteUserFromAzureTeam(ownerUser.accessToken, teamInDB, userTeamMapItem.azureUserId);
        await dbHelper.remove(UserTeamMapping, {id: userTeamMapItem.id});
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
