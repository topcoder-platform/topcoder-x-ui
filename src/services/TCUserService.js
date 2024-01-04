/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * This service will provide TC user operations.
 *
 * @author TCSCODER
 * @version 1.0
 */
const Joi = require('joi');
const errors = require('../common/errors');
const helper = require('../common/helper');
const {decodeToken} = require('../utils/tc-auth');
const GithubUserMapping = require('../models').GithubUserMapping;
const GitlabUserMapping = require('../models').GitlabUserMapping;

/**
 * gets the handle of tc user.
 * @param {String} token the user token
 * @returns {String} the handle
 */
async function getHandle(token) {
  const decoded = decodeToken(token);
  return decoded.handle;
}

getHandle.schema = Joi.object().keys({
  token: Joi.string().required(),
});

/**
 * Get user mapping details.
 * @param {Object} query the query parameters
 * @returns {Promise} the promise result of user mapping details
 */
async function getUserMapping(query) {
  // at least one of the parameters should ge provided
  if (!query.topcoderUsername && !query.githubUsername && !query.gitlabUsername) {
    throw new errors.ValidationError('Invalid Input.',
      'At least one of topcoderUsername/gitlabUsername/githubUsername should be provided.');
  }

  if (query.githubUsername) {
    return await helper.ensureExists(GithubUserMapping, query, 'GithubUserMapping');
  }
  return await helper.ensureExists(GitlabUserMapping, query, 'GitlabUserMapping');
}

getUserMapping.schema = Joi.object().keys({
  query: Joi.object().keys({
    topcoderUsername: Joi.string(),
    githubUsername: Joi.string(),
    gitlabUsername: Joi.string(),
  }).required(),
});


module.exports = {
  getHandle,
  getUserMapping,
};

helper.buildService(module.exports);
