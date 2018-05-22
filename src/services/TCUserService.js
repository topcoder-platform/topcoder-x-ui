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
const superagent = require('superagent');
const superagentPromise = require('superagent-promise');
const config = require('../config');
const errors = require('../common/errors');
const helper = require('../common/helper');
const UserMapping = require('../models').UserMapping;

const request = superagentPromise(superagent, Promise);


/**
 * gets the handle of tc user.
 * @param {String} token the user token
 * @returns {String} the handle
 */
async function getHandle(token) {
  const handle = await request
    .get(config.TC_USER_PROFILE_URL)
    .set('Authorization', `Bearer ${token}`)
    .end()
    .then((res) => res.body.handle);

  return handle;
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

  return await helper.ensureExists(UserMapping, query);
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
