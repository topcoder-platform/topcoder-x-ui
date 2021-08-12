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
const GithubService = require('./GithubService');
const GitlabService = require('./GitlabService');

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



const searchSchema = {
  criteria: Joi.object().keys({
    sortBy: Joi.string().valid('topcoderUsername', 'githubUsername', 'gitlabUsername').required(),
    sortDir: Joi.string().valid('asc', 'desc').default('asc'),
    page: Joi.number().integer().min(1).required(),
    perPage: Joi.number().integer().min(1).required(),
    query: Joi.string(),
  }).required(),
};

const createUserMappingSchema = {
  userMapping: {
    topcoderUsername: Joi.string().required(),
    githubUsername: Joi.string(),
    githubUserId: Joi.number(),
    gitlabUsername: Joi.string(),
    gitlabUserId: Joi.number(),
  },
};

const removeUserMappingSchema = {
  topcoderUsername: Joi.string().required(),
};

/**
 * searches user mappings
 * @param {Object} criteria the search criteria
 * @returns {Array} user mappings
 */
async function search(criteria) {
  const githubUserMappings = await dbHelper.scan(GithubUserMapping, {});
  const gitlabUserMappings = await dbHelper.scan(GitlabUserMapping, {});
  const offset = (criteria.page - 1) * criteria.perPage;

  const filteredGithubUserMappings = _(githubUserMappings).slice(offset).take(criteria.perPage)
      .filter(userMapping => {
        if (!criteria.query) return true;
        else {
          return _.includes(userMapping.topcoderUsername.toLowerCase(), criteria.query.toLowerCase()) ||
            _.includes(userMapping.githubUsername.toLowerCase(), criteria.query.toLowerCase())
        }
      })
      .value();
  const filteredGitlabUserMappings = _(gitlabUserMappings).slice(offset).take(criteria.perPage)
      .filter(userMapping => {
        if (!criteria.query) return true;
        else {
          return _.includes(userMapping.topcoderUsername.toLowerCase(), criteria.query.toLowerCase()) ||
            _.includes(userMapping.gitlabUsername.toLowerCase(), criteria.query.toLowerCase())
        }
      })
      .value();

  const userMappings = _.concat(filteredGithubUserMappings, filteredGitlabUserMappings);
  const orderedUserMappings = _.orderBy(userMappings, criteria.sortBy, criteria.sortDir);
  const tcUsernames = _.map(orderedUserMappings, 'topcoderUsername');
  const uniqueTcUsernames = _.uniq(tcUsernames);
  const docs = await Promise.all(_.map(uniqueTcUsernames, async (tcUsername) => {
    const mapping = {
      topcoderUsername: tcUsername
    };
    const githubMapping = _.find(githubUserMappings, (object) => object.topcoderUsername === tcUsername); // eslint-disable-line lodash/matches-prop-shorthand
    const gitlabMapping = _.find(gitlabUserMappings, (object) => object.topcoderUsername === tcUsername); // eslint-disable-line lodash/matches-prop-shorthand
    if (githubMapping) {
      mapping.githubUsername = githubMapping.githubUsername;
      mapping.githubUserId = githubMapping.githubUserId;
    }
    else {
      const dbGithubMapping = await dbHelper.queryOneUserMappingByTCUsername(GithubUserMapping, tcUsername);
      if (dbGithubMapping) {
        mapping.githubUsername = dbGithubMapping.githubUsername;
        mapping.githubUserId = dbGithubMapping.githubUserId;
      }
    }
    if (gitlabMapping) {
      mapping.gitlabUsername = gitlabMapping.gitlabUsername;
      mapping.gitlabUserId = gitlabMapping.gitlabUserId;
    }
    else {
      const dbGitlabMapping = await dbHelper.queryOneUserMappingByTCUsername(GitlabUserMapping, tcUsername);
      if (dbGitlabMapping) {
        mapping.gitlabUsername = dbGitlabMapping.gitlabUsername;
        mapping.gitlabUserId = dbGitlabMapping.gitlabUserId;
      }
    }
    return mapping;
  }));

  const result = {
    pages: Math.ceil(githubUserMappings.length / criteria.perPage) || 1,
    docs,
  };
  return result;
}

search.schema = searchSchema;

/**
 * creates userMapping
 * @param {Object} userMapping details
 * @returns {Object} created userMapping
 */
async function create(userMapping) {
  if (userMapping.githubUsername) {
    const existGithubMapping = await dbHelper.queryOneUserMappingByTCUsername(
      GithubUserMapping, userMapping.topcoderUsername);
    if (existGithubMapping) {
      return { error: true, exist: true, provider: 'Github' };
    }
    else {
      const githubUserId = await GithubService.getUserIdByUsername(userMapping.githubUsername);
      const mappingToSave = {
        id: helper.generateIdentifier(),
        topcoderUsername: userMapping.topcoderUsername,
        githubUsername: userMapping.githubUsername,
        githubUserId
      };
      await dbHelper.create(GithubUserMapping, mappingToSave);
    }
  }
  if (userMapping.gitlabUsername) {
    const existGitlabMapping = await dbHelper.queryOneUserMappingByTCUsername(
      GitlabUserMapping, userMapping.topcoderUsername);
    if (existGitlabMapping) {
      return { error: true, exist: true, provider: 'Gitlab' };
    }
    else {
      const gitlabUserId = await GitlabService.getUserIdByUsername(userMapping.gitlabUsername);
      const mappingToSave = {
        id: helper.generateIdentifier(),
        topcoderUsername: userMapping.topcoderUsername,
        gitlabUsername: userMapping.gitlabUsername,
        gitlabUserId
      };
      await dbHelper.create(GitlabUserMapping, mappingToSave);
    }
  }

  return {success: true};
}

create.schema = createUserMappingSchema;



/**
 * updates userMapping
 * @param {Object} userMapping details
 * @returns {Object} updated userMapping
 */
async function update(userMapping) {
  const existGithubMapping = await dbHelper.queryOneUserMappingByTCUsername(
    GithubUserMapping, userMapping.topcoderUsername);
  const existGitlabMapping = await dbHelper.queryOneUserMappingByTCUsername(
    GitlabUserMapping, userMapping.topcoderUsername);
  if (userMapping.githubUsername) {
    const githubUserId = await GithubService.getUserIdByUsername(userMapping.githubUsername);
    const mappingToSave = {
      topcoderUsername: userMapping.topcoderUsername,
      githubUsername: userMapping.githubUsername,
      githubUserId
    };
    if (existGithubMapping) {
      mappingToSave.id = existGithubMapping.id;
      await dbHelper.update(GithubUserMapping, existGithubMapping.id, mappingToSave);
    }
    else {
      mappingToSave.id = helper.generateIdentifier();
      await dbHelper.create(GithubUserMapping, mappingToSave);
    }
  }
  else {
    if (existGithubMapping) {
      await dbHelper.removeById(GithubUserMapping, existGithubMapping.id);
    }
  }
  if (userMapping.gitlabUsername) {
    const gitlabUserId = await GitlabService.getUserIdByUsername(userMapping.gitlabUsername);
    const mappingToSave = {
      topcoderUsername: userMapping.topcoderUsername,
      gitlabUsername: userMapping.gitlabUsername,
      gitlabUserId
    };
    if (existGitlabMapping) {
      mappingToSave.id = existGitlabMapping.id;
      await dbHelper.update(GitlabUserMapping, existGitlabMapping.id, mappingToSave);
    }
    else {
      mappingToSave.id = helper.generateIdentifier();
      await dbHelper.create(GitlabUserMapping, mappingToSave);
    }
  }
  else {
    if (existGitlabMapping) {
      await dbHelper.removeById(GitlabUserMapping, existGitlabMapping.id);
    }
  }
  return {success: true};
}

update.schema = createUserMappingSchema;



/**
 * delete user mapping item
 * @param {string} topcoderUsername tc handle
 * @returns {Object} the success status
 */
async function remove(topcoderUsername) {
  const dbGithubMapping = await dbHelper.queryOneUserMappingByTCUsername(
    GithubUserMapping, topcoderUsername);
  const dbGitlabMapping = await dbHelper.queryOneUserMappingByTCUsername(
    GitlabUserMapping, topcoderUsername);

  if (dbGithubMapping) {
    await dbHelper.removeById(GithubUserMapping, dbGithubMapping.id);
  }
  if (dbGitlabMapping) {
    await dbHelper.removeById(GitlabUserMapping, dbGitlabMapping.id);
  }
  return {success: true};
}

remove.schema = removeUserMappingSchema;

module.exports = {
  getUserSetting,
  revokeUserSetting,
  getUserToken,
  getAccessTokenByHandle,
  search,
  create,
  remove,
  update,
};

helper.buildService(module.exports);
