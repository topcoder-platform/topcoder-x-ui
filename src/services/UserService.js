/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This service will provide user operations.
 *
 * @author TCSCODER
 * @version 1.0
 */
const Joi = require('joi');
const _ = require('lodash');
const helper = require('../common/helper');
const dbHelper = require('../common/db-helper');
const errors = require('../common/errors');
const constants = require('../common/constants');
const User = require('../models').User;
const GithubUserMapping = require('../models').GithubUserMapping;
const GitlabUserMapping = require('../models').GitlabUserMapping;

/**
 * gets user setting
 * @param {String} handle the topcoder handle
 * @returns {Object} the user setting
 */
async function getUserSetting(handle) {
  const githubMapping = await dbHelper.queryOneUserMappingByTCUsername(
    GithubUserMapping, handle.toLowerCase());
  const gitlabMapping = await dbHelper.queryOneUserMappingByTCUsername(
    GitlabUserMapping, handle.toLowerCase());
  const setting = {
    github: false,
    gitlab: false,
    expired: {}
  };

  if (!githubMapping && !gitlabMapping) {
    return setting;
  }

  const users = [];
  if (githubMapping && githubMapping.githubUsername) {
    const github = await dbHelper.queryOneUserByType(
      User, githubMapping.githubUsername, constants.USER_TYPES.GITHUB);
    if (!_.isNil(github)) {
      users.push(github);
    }
  }

  if (gitlabMapping && gitlabMapping.gitlabUsername) {
    const gitlab = await dbHelper.queryOneUserByType(
      User, gitlabMapping.gitlabUsername, constants.USER_TYPES.GITLAB);
    if (!_.isNil(gitlab)) {
      users.push(gitlab);
    }
  }

  _.forEach(constants.USER_TYPES, (item) => {
    setting[item] = !!users.find((i) => i.type === item && i.accessToken);
    if (setting[item]) {
      setting['expired'][item] = !!users.find((i) =>
        i.type === item && i.accessTokenExpiration && i.accessTokenExpiration <= new Date().getTime());
    }
  });
  return setting;
}

getUserSetting.schema = Joi.object().keys({
  handle: Joi.string().required(),
});



/**
 * revoke user setting
 * @param {String} handle the topcoder handle
 * @param {String} provider the provider (github/gitlab)
 * @returns {Boolean} the execution status success or failed
 */
async function revokeUserSetting(handle, provider) {
  const mapping = await dbHelper.queryOneUserMappingByTCUsername(
    provider === 'github' ? GithubUserMapping : GitlabUserMapping, handle.toLowerCase());

  if (!mapping) {
    return false;
  }

  if (provider === 'github' && mapping.githubUsername) {
    dbHelper.removeUser(User, mapping.githubUsername, constants.USER_TYPES.GITHUB);
    return true;
  }

  if (provider === 'gitlab' && mapping.gitlabUsername) {
    dbHelper.removeUser(User, mapping.gitlabUsername, constants.USER_TYPES.GITLAB);
    return true;
  }

  return false;
}

revokeUserSetting.schema = Joi.object().keys({
  handle: Joi.string().required(),
  provider: Joi.string().required()
});



/**
 * gets user token
 * @param {String} username the user name
 * @param {String} tokenType the token type
 * @returns {String} the user access token
 */
async function getUserToken(username, tokenType) {
  const user = await dbHelper.queryOneUserByType(User, username, tokenType);

  if (!user) {
    throw new errors.NotFoundError(`User doesn't exist ${username} with type ${tokenType}`);
  }
  return {
    token: user.accessToken,
  };
}

/**
 * gets the user by topcoder username
 * @param {String} handle the topcoder handle
 * @param {String} provider the git host provider
 * @returns {Object} the user if found; null otherwise
 */
async function getAccessTokenByHandle(handle, provider) {
  const mapping = await dbHelper.queryOneUserMappingByTCUsername(
    provider === 'github' ? GithubUserMapping : GitlabUserMapping, handle.toLowerCase());
  let gitUserName;
  if (mapping) {
    gitUserName = provider === constants.USER_TYPES.GITHUB ? 'githubUsername' :   //eslint-disable-line no-nested-ternary
      'gitlabUsername';
    return await dbHelper.queryOneUserByType(User, mapping[gitUserName], provider);
  }
  return gitUserName;
}

getUserToken.schema = Joi.object().keys({
  username: Joi.string().required(),
  tokenType: Joi.string().required(),
});

module.exports = {
  getUserSetting,
  revokeUserSetting,
  getUserToken,
  getAccessTokenByHandle,
};

helper.buildService(module.exports);
