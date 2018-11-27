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
const UserMapping = require('../models').UserMapping;

/**
 * gets user setting
 * @param {String} handle the topcoder handle
 * @returns {Object} the user setting
 */
async function getUserSetting(handle) {
  const mapping = await dbHelper.scanOne(UserMapping, {
    topcoderUsername: handle.toLowerCase(),
  });
  const setting = {
    github: false,
    gitlab: false,
  };

  if (!mapping) {
    return setting;
  }

  const users = [];
  if (mapping.githubUsername) {
    const github = await dbHelper.scanOne(User, {
      username: mapping.githubUsername,
      type: constants.USER_TYPES.GITHUB,
    });
    if (!_.isNil(github)) {
      users.push(github);
    }
  }

  if (mapping.gitlabUsername) {
    const gitlab = await dbHelper.scanOne(User, {
      username: mapping.gitlabUsername,
      type: constants.USER_TYPES.GITLAB,
    });
    if (!_.isNil(gitlab)) {
      users.push(gitlab);
    }
  }

  _.forEach(constants.USER_TYPES, (item) => {
    setting[item] = !!users.find((i) => i.type === item && i.accessToken);
  });
  return setting;
}

getUserSetting.schema = Joi.object().keys({
  handle: Joi.string().required(),
});

/**
 * gets user token
 * @param {String} username the user name
 * @param {String} tokenType the token type
 * @returns {String} the user access token
 */
async function getUserToken(username, tokenType) {
  const user = await dbHelper.scanOne(User, {
    username,
    type: tokenType,
  });

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
  const mapping = await dbHelper.scanOne(UserMapping, {
    topcoderUsername: handle.toLowerCase(),
  });
  let gitUserName;
  if (mapping) {
    gitUserName = provider === constants.USER_TYPES.GITHUB ? 'githubUsername' : 'gitlabUsername';
    return await dbHelper.scanOne(User, {
      username: mapping[gitUserName],
      type: provider,
    });
  }
  return gitUserName;
}

getUserToken.schema = Joi.object().keys({
  username: Joi.string().required(),
  tokenType: Joi.string().required(),
});

module.exports = {
  getUserSetting,
  getUserToken,
  getAccessTokenByHandle,
};

helper.buildService(module.exports);
