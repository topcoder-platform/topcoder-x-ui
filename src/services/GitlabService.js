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
const errors = require('../common/errors');
const User = require('../models').User;
const UserMapping = require('../models').UserMapping;
const OwnerUserGroup = require('../models').OwnerUserGroup;

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
    // get current user name
    userProfile = await request
      .get(`${config.GITLAB_API_BASE_URL}/api/v4/user`)
      .set('Authorization', `Bearer ${token}`)
      .end()
      .then((res) => res.body);
  } catch (err) {
    throw helper.convertGitLabError(err, 'Failed to ensure valid owner user.');
  }
  if (!userProfile) {
    throw new errors.UnauthorizedError('Can not get user from the access token.');
  }
  let user = await User.findOne({
    username: userProfile.username,
    type: constants.USER_TYPES.GITLAB,
    role: constants.USER_ROLES.OWNER,
  });

  const userMapping = await UserMapping.findOne({ topcoderUsername });

  if (!userMapping) {
    await UserMapping.create({
      topcoderUsername,
      gitlabUserId: userProfile.id,
      gitlabUsername: userProfile.username,
    });
  } else {
    userMapping.gitlabUserId = userProfile.id;
    userMapping.gitlabUsername = userProfile.username;
    await userMapping.save();
  }

  if (!user) {
    user = {
      role: constants.USER_ROLES.OWNER,
      type: constants.USER_TYPES.GITLAB,
      userProviderId: userProfile.id,
      username: userProfile.username,
      accessToken: token
    };
    return await User.create(user);
  }
  user.userProviderId = userProfile.id;
  user.username = userProfile.username;
  // save user token data
  user.accessToken = token;
  return await user.save();
}

ensureOwnerUser.schema = Joi.object().keys({
  token: Joi.string().required(),
  topcoderUsername: Joi.string().required(),
});

/**
 * List groups of owner user.
 * @param {String} token the token
 * @param {Number} page the page number (default to be 1). Must be >= 1
 * @param {Number} perPage the page size (default to be constants.GITLAB_DEFAULT_PER_PAGE).
 *   Must be within range [1, constants.GITLAB_MAX_PER_PAGE]
 * @returns {Promise} the promise result
 */
async function listOwnerUserGroups(token, page = 1, perPage = constants.GITLAB_DEFAULT_PER_PAGE) {
  try {
    const response = await request
      .get(`${config.GITLAB_API_BASE_URL}/api/v4/groups`)
      .query({ page, per_page: perPage, min_access_level:40 })
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
    throw helper.convertGitLabError(err, 'Failed to list user groups');
  }
}

listOwnerUserGroups.schema = Joi.object().keys({
  token: Joi.string().required(),
  page: Joi.number().integer().min(1).optional(),
  perPage: Joi.number().integer().min(1).max(constants.GITLAB_MAX_PER_PAGE)
    .optional(),
});

/**
 * Get owner user group registration URL.
 * @param {String} ownerUsername the owner user name
 * @param {String} groupId the group id
 * @returns {Promise} the promise result
 */
async function getGroupRegistrationUrl(ownerUsername, groupId) {
  // generate identifier
  const identifier = helper.generateIdentifier();

  // create owner user group
  await OwnerUserGroup.create({
    ownerUsername,
    type: constants.USER_TYPES.GITLAB,
    groupId,
    identifier,
  });

  // construct URL
  const url = `${config.WEBSITE}/api/${config.API_VERSION}/gitlab/groups/registration/${identifier}`;
  return { url };
}

getGroupRegistrationUrl.schema = Joi.object().keys({
  ownerUsername: Joi.string().required(),
  groupId: Joi.string().required(),
});

/**
 * Add group member.
 * @param {String} groupId the group id
 * @param {String} ownerUserToken the owner user token
 * @param {String} normalUserToken the normal user token
 * @returns {Promise} the promise result
 */
async function addGroupMember(groupId, ownerUserToken, normalUserToken) {
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

    // add user to group
    await request
      .post(`${config.GITLAB_API_BASE_URL}/api/v4/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${ownerUserToken}`)
      .send(`user_id=${userId}&access_level=${constants.GITLAB_DEFAULT_GROUP_ACCESS_LEVEL}`)
      .end();
    // return gitlab username
    return { username: res.body.username, id: res.body.id };
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

module.exports = {
  ensureOwnerUser,
  listOwnerUserGroups,
  getGroupRegistrationUrl,
  addGroupMember,
  getUserIdByUsername,
};

helper.buildService(module.exports);
