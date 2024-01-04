/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * This controller exposes Gitlab REST endpoints.
 *
 * @author TCSCODER
 * @version 1.0
 */
const querystring = require('querystring');
const _ = require('lodash');
const superagent = require('superagent');
const superagentPromise = require('superagent-promise');
const helper = require('../common/helper');
const dbHelper = require('../common/db-helper');
const errors = require('../common/errors');
const constants = require('../common/constants');
const config = require('../config');
const GitlabService = require('../services/GitlabService');
const UserService = require('../services/UserService');
const logger = require('../common/logger');
const User = require('../models').User;
const OwnerUserGroup = require('../models').OwnerUserGroup;
const GitlabUserMapping = require('../models').GitlabUserMapping;
const UserGroupMapping = require('../models').UserGroupMapping;

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
  // redirect to GitLab OAuth
  const callbackUri = `${config.WEBSITE}${constants.GITLAB_OWNER_CALLBACK_URL}`;
  const query = querystring.stringify({
    client_id: config.GITLAB_CLIENT_ID,
    redirect_uri: querystring.escape(callbackUri),
    response_type: 'code',
    state: req.session.state,
    scope: 'api+read_repository',
  }, null, null, {encodeURIComponent: (str) => str});
  res.redirect(`https://gitlab.com/oauth/authorize?${query}`);
}

/**
 * Owner user login callback, redirected by GitLab.
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
    .post('https://gitlab.com/oauth/token')
    .query({
      client_id: config.GITLAB_CLIENT_ID,
      client_secret: config.GITLAB_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${config.WEBSITE}${constants.GITLAB_OWNER_CALLBACK_URL}`,
    })
    .end();
  const topcoderUsername = req.currentUser.handle;
  const accessToken = result.body.access_token;
  const refreshToken = result.body.refresh_token;
  const expiresIn = result.body.expires_in || constants.GITLAB_ACCESS_TOKEN_DEFAULT_EXPIRATION;
  const expiry = new Date(new Date().getTime() + (expiresIn * MS_PER_SECOND));
  // ensure the user is valid owner user
  const ownerUser = await GitlabService.ensureUser(
    accessToken, expiry, refreshToken, topcoderUsername, constants.USER_ROLES.OWNER);
  // save user token data
  await dbHelper.update(User, ownerUser.id, {
    accessToken,
    accessTokenExpiration: new Date(new Date().getTime() + expiresIn * MS_PER_SECOND),
    refreshToken,
  });

  // refresh token periodically
  // store username to session
  req.session.gitlabOwnerUsername = ownerUser.username;
  // redirect to success page
  res.redirect(constants.OWNER_USER_LOGIN_SUCCESS_URL);
}

/**
 * List groups of owner user.
 * @param {Object} req the request
 * @returns {Object} the owner user groups
 */
async function listOwnerUserGroups(req) {
  const user = await UserService.getAccessTokenByHandle(req.currentUser.handle, constants.USER_TYPES.GITLAB);
  // NOTE: Only user with topcoder-x account can pass this condition.
  //       Only them will be inserted into `User` table,
  //       normal user will not be in the `User` table.
  if (!user || !user.accessToken) {
    throw new errors.UnauthorizedError('You have not setup for Gitlab.');
  }
  const gitlabService = await GitlabService.create(user);
  return await gitlabService.listOwnerUserGroups(req.query.page, req.query.perPage, req.query.getAll);
}

/**
 * Get group registration URL.
 * @param {Object} req the request
 * @returns {Object} the group registration URL
 */
async function getGroupRegistrationUrl(req) {
  const user = await UserService.getAccessTokenByHandle(req.currentUser.handle, constants.USER_TYPES.GITLAB);
  if (!user || !user.accessToken) {
    throw new errors.UnauthorizedError('You have not setup for Gitlab.');
  }
  const gitlabService = await GitlabService.create(user);
  return await gitlabService.getGroupRegistrationUrl(
    req.params.id,
    req.params.accessLevel,
    req.params.expiredAt);
}

/**
 * Add user to group.
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function addUserToGroup(req, res) {
  const identifier = req.params.identifier;
  // validate the identifier
  await helper.ensureExistsWithKey(OwnerUserGroup, 'identifier', identifier, 'OwnerUserGroup');

  // store identifier to session, to be compared in callback
  req.session.identifier = identifier;

  // redirect to GitLab OAuth
  const callbackUri = `${config.WEBSITE}/api/${config.API_VERSION}/gitlab/normaluser/callback`;
  res.redirect(`https://gitlab.com/oauth/authorize?client_id=${
    config.GITLAB_CLIENT_ID
  }&redirect_uri=${
    encodeURIComponent(callbackUri)
  }&response_type=code&state=${identifier}&scope=read_user`);
}

/**
 * Normal user callback, to be added to group. Redirected by GitLab.
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function addUserToGroupCallback(req, res) {
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

  // exchange code to get normal user token
  const result = await request
    .post('https://gitlab.com/oauth/token')
    .query({
      client_id: config.GITLAB_CLIENT_ID,
      client_secret: config.GITLAB_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${config.WEBSITE}/api/${config.API_VERSION}/gitlab/normaluser/callback`,
    })
    .end();

  // Throw error if gitlab access token was not returned (ex. invalid code)
  if (!result.body.access_token) {
    throw new errors.UnauthorizedError('Gitlab authorization failed.', result.body.error_description);
  }

  // Ensure that the group exists and belongs to an owner user
  const group = await helper.ensureExistsWithKey(OwnerUserGroup, 'identifier', identifier, 'OwnerUserGroup');
  if (!group) {
    throw new errors.NotFoundError('The group is not found or not accessible.');
  }

  // get owner user
  const ownerUser = await dbHelper.queryOneUserByTypeAndRole(
    User,
    group.ownerUsername,
    constants.USER_TYPES.GITLAB,
    constants.USER_ROLES.OWNER);
  if (!ownerUser) {
    throw new errors.NotFoundError('The owner user is not found or not accessible.');
  }

  // create gitlab service for owner user
  const ownerGitlabService = await GitlabService.create(ownerUser);

  // get group name
  const groupsResult = await ownerGitlabService.listOwnerUserGroups(1, constants.MAX_PER_PAGE, true);
  const currentGroup = _.find(groupsResult.groups, (item) => { // eslint-disable-line arrow-body-style
    return item.id.toString() === group.groupId.toString();
  });

  const token = result.body.access_token;
  const userGitlabClient = await GitlabService.getClientWithAccessToken(token);
  const userInfo = await userGitlabClient.Users.showCurrentUser();

  // add user to group
  const gitlabUser = await ownerGitlabService.addGroupMember(
    group.groupId,
    userInfo,
    group.accessLevel,
    group.expiredAt);
  // associate gitlab username with TC username

  const mapping = await dbHelper.queryOneUserMappingByTCUsername(GitlabUserMapping, req.session.tcUsername);
  if (mapping) {
    await dbHelper.update(GitlabUserMapping, mapping.id, {
      gitlabUsername: gitlabUser.username,
      gitlabUserId: gitlabUser.id,
    });
  } else {
    await dbHelper.create(GitlabUserMapping, {
      id: helper.generateIdentifier(),
      topcoderUsername: req.session.tcUsername,
      gitlabUsername: gitlabUser.username,
      gitlabUserId: gitlabUser.id,
    });
  }
  // We get gitlabUser.id and group.groupId and
  // associate github username and teamId
  const gitlabUserToGroupMapping = await dbHelper.queryOneUserGroupMapping(UserGroupMapping,
    group.groupId,
    gitlabUser.id);

  if (!gitlabUserToGroupMapping) {
    await dbHelper.create(UserGroupMapping, {
      id: helper.generateIdentifier(),
      groupId: group.groupId,
      gitlabUserId: gitlabUser.id,
    });
  }
  // redirect to success page
  // For gitlab subgroups we need to replace / with something different. Default encoding doesn't work as angular route fails to match %2F
  res.redirect(`${constants.USER_ADDED_TO_TEAM_SUCCESS_URL}/gitlab/${currentGroup.full_path.replace('/', '@!2F')}`);
}

/**
 * Gitlab guest user login
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function guestUserLogin(req, res) {
  // generate an identifier if not present,
  // the identifier is used as OAuth state
  if (!req.session.state) {
    req.session.state = helper.generateIdentifier();
  }
  // redirect to GitLab OAuth
  const callbackUri = `${config.WEBSITE}${constants.GITLAB_GUEST_CALLBACK_URL}`;
  const query = querystring.stringify({
    client_id: config.GITLAB_CLIENT_ID,
    redirect_uri: querystring.escape(callbackUri),
    response_type: 'code',
    state: req.session.state,
    scope: 'api+write_repository',
  }, null, null, {encodeURIComponent: (str) => str});
  res.redirect(`https://gitlab.com/oauth/authorize?${query}`);
}

/**
 * Guest user callback, to be added to
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function guestUserCallback(req, res) {
  try {
    if (req.query.error_description) {
      throw new errors.ForbiddenError(req.query.error_description.replace(/\+/g, ' '));
    }
    if (!req.session.state || req.query.state !== req.session.state) {
      throw new errors.ForbiddenError('Invalid state.');
    }
    const code = req.query.code;
    if (!code) {
      throw new errors.ValidationError('Missing code.');
    }

    // exchange code to get guest user token
    const result = await request
      .post('https://gitlab.com/oauth/token')
      .query({
        client_id: config.GITLAB_CLIENT_ID,
        client_secret: config.GITLAB_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${config.WEBSITE}/api/${config.API_VERSION}/gitlab/guestuser/callback`,
      })
      .end();
    // Throw error if github access token was not returned (ex. invalid code)
    if (!result.body.access_token) {
      throw new errors.UnauthorizedError('Gitlab authorization failed.', result.body.error_description);
    }
    const {access_token: accessToken, refresh_token: refreshToken} = result.body;
    const expiresIn = result.body.expires_in || constants.GITLAB_ACCESS_TOKEN_DEFAULT_EXPIRATION;
    const expiry = new Date(new Date().getTime() + (expiresIn * MS_PER_SECOND));
    logger.debug(`[GitlabController#guestUserCallback] payload: ${JSON.stringify(result.body)}`);

    // Create/update user mapping
    await GitlabService.ensureUser(
      accessToken, expiry, refreshToken, req.currentUser.handle, constants.USER_ROLES.GUEST);

    // redirect to success page
    res.redirect(`${constants.GUEST_ONBOARDING_COMPLETED_URL}?success=true`);
  } catch (err) {
    res.redirect(`${constants.GUEST_ONBOARDING_COMPLETED_URL}?success=false&error=${err.toString()}`);
  }
}

/**
 * Delete users from a group.
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function deleteUsersFromTeam(req, res) {
  const groupId = req.params.id;
  let groupInDB;
  try {
    groupInDB = await helper.ensureExistsWithKey(OwnerUserGroup, 'groupId', groupId, 'OwnerUserGroup');
  } catch (err) {
    if (!(err instanceof errors.NotFoundError)) {
      throw err;
    }
  }
  // If groupInDB not exists, then just return
  if (groupInDB) {
    try {
      const ownerUser = await dbHelper.queryOneUserByTypeAndRole(User,
        groupInDB.ownerUsername, constants.USER_TYPES.GITLAB, constants.USER_ROLES.OWNER);
      if (!ownerUser) {
        throw new errors.NotFoundError('The owner user is not found or not accessible.');
      }
      const gitlabService = await GitlabService.create(ownerUser);
      const userGroupMappings = await dbHelper.scan(UserGroupMapping, {groupId});
      // eslint-disable-next-line no-restricted-syntax
      for (const userGroupMapItem of userGroupMappings) {
        await gitlabService.deleteUserFromGitlabGroup(groupId, userGroupMapItem.gitlabUserId);
        await dbHelper.removeById(UserGroupMapping, userGroupMapItem.id);
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
  listOwnerUserGroups,
  getGroupRegistrationUrl,
  addUserToGroup,
  addUserToGroupCallback,
  guestUserLogin,
  guestUserCallback,
  deleteUsersFromTeam,
};

helper.buildController(module.exports);
