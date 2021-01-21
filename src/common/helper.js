/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * This file defines helper methods.
 *
 * @author TCSCODER
 * @version 1.0
 */

const util = require('util');
const _ = require('lodash');
const uuid = require('uuid/v4');
const Joi = require('joi');
const getParams = require('get-parameter-names');
const bluebird = require('bluebird');
const bcrypt = require('bcryptjs');
const parseDomain = require('parse-domain');
const config = require('../config');
const logger = require('./logger');
const errors = require('./errors');
const constants = require('./constants');
const NotFoundError = require('./errors').NotFoundError;
const ValidationError = require('./errors').ValidationError;
const dbHelper = require('./db-helper');


bluebird.promisifyAll(bcrypt);
bluebird.promisifyAll(parseDomain);

/**
 * Convert array with arguments to object
 * @param {Array} params the name of parameters
 * @param {Array} arr the array with values
 * @returns {Object} the combined object
 * @private
 */
function _combineObject(params, arr) {
  const ret = {};
  _.forEach(arr, (arg, i) => {
    ret[params[i]] = arg;
  });
  return ret;
}

/**
 * Decorate all functions of a service and log debug information if DEBUG is enabled
 * @param {Object} service the service
 * @private
 */
function _decorateWithLogging(service) {
  if (config.LOG_LEVEL !== 'debug') {
    return;
  }
  _.forEach(service, (method, name) => {
    service[name] = async function serviceMethodWithLogging(...args) {
      try {
        const result = await method.apply(this, args);
        return result;
      } catch (e) {
        logger.logFullError(e, name);
        throw e;
      }
    };
  });
}

/**
 * Decorate all functions of a service and validate input values
 * and replace input arguments with sanitized result form Joi
 * Service method must have a `schema` property with Joi schema
 * @param {Object} service the service
 * @private
 */
function _decorateWithValidators(service) {
  _.forEach(service, (method, name) => {
    if (!method.schema) {
      return;
    }
    const params = getParams(method);
    service[name] = async function serviceMethodWithValidation(...args) {
      const value = _combineObject(params, args);
      const normalized = Joi.attempt(value, method.schema, {abortEarly: false});
      // Joi will normalize values
      // for example string number '1' to 1
      // if schema type is number
      const newArgs = _.map(params, (param) => normalized[param]);
      return await method.apply(this, newArgs);
    };
    service[name].params = params;
  });
}

/**
 * Apply logger and validation decorators
 * @param {Object} service the service to wrap
 */
function buildService(service) {
  _decorateWithValidators(service);
  _decorateWithLogging(service);
}

/**
 * Apply response json render and error handler.
 * @param {Object} controller the controller to wrap
 */
function buildController(controller) {
  _.forEach(controller, (method, name) => {
    controller[name] = (req, res, next) => {
      // Make sure to `.catch()` any errors and pass them along to the `next()`
      // middleware in the chain, in this case the error handler.
      method(req, res).then((result) => {
        if (!_.isNil(result)) {
          res.json(result);
        }
      }).catch(next);
    };
  });
}

/**
 * Convert github api error.
 * @param {Error} err the github api error
 * @param {String} message the error message
 * @returns {Error} converted error
 */
function convertGitHubError(err, message) {
  let resMsg = `${message}. ${err.message}.\n`;
  const detail = _.get(err, 'response.body.message');
  if (detail) {
    resMsg += ` Detail: ${detail}`;
  }
  const apiError = new errors.ApiError(
    _.get(err, 'response.status', constants.SERVICE_ERROR_STATUS),
    _.get(err, 'response.statusText', constants.SERVICE_ERROR),
    resMsg
  );
  return apiError;
}

/**
 * Convert gitlab api error.
 * @param {Error} err the gitlab api error
 * @param {String} message the error message
 * @returns {Error} converted error
 */
function convertGitLabError(err, message) {
  let resMsg = `${message}. ${err.message}.\n`;
  const detail = _.get(err, 'response.body.message');
  if (detail) {
    resMsg += ` Detail: ${detail}`;
  }
  const apiError = new errors.ApiError(
    err.status || _.get(err, 'response.status', constants.SERVICE_ERROR_STATUS),
    _.get(err, 'response.body.message', constants.SERVICE_ERROR),
    resMsg
  );
  return apiError;
}

/**
 * Ensure entity exists for given criteria. Return error if no result.
 * @param {Object} Model the mongoose model to query
 * @param {Object|String|Number} criteria the criteria (if object) or id (if string/number)
 * @param {String} modelName the name of model
 * @returns {Object} the found entity
 */
async function ensureExists(Model, criteria, modelName) {
  let query;
  let byId = true;
  if (_.isObject(criteria)) {
    byId = false;
    query = dbHelper.scanOne(Model, criteria);
  } else {
    query = dbHelper.getById(Model, criteria);
  }
  const result = await query;
  if (!result) {
    let msg;
    if (byId) {
      msg = util.format('%s not found with id: %s', modelName, criteria);
    } else {
      msg = util.format('%s not found with criteria: %j', modelName, criteria);
    }
    throw new NotFoundError(msg);
  }
  return result;
}

/**
 * get the provider name from git repo url
 * @param {String} repoUrl the project repo URL
 * @returns {String} the provider
 */
async function getProviderType(repoUrl) {
  const parsedDomain = await parseDomain(repoUrl);
  if (!parsedDomain || !parsedDomain.domain || 
    (parsedDomain.domain !== 'github' && parsedDomain.domain !== 'gitlab')) {
    throw new ValidationError('Invalid git repo url');
  }
  return parsedDomain.domain;
}

/**
 * gets the git username of copilot/owner for a project
 * @param {Object} models the db models
 * @param {Object} project the db project detail
 * @param {String} provider the git provider
 * @param {Boolean} isCopilot if true, then get copilot, otherwise get owner
 * @returns {Object} the owner/copilot for the project
 */
async function getProjectCopilotOrOwner(models, project, provider, isCopilot) {
  const userMapping = await dbHelper.scanOne(models.UserMapping, {
    topcoderUsername: isCopilot ? project.copilot : project.owner,
  });

  if (!userMapping || 
    (provider === 'github' && !userMapping.githubUserId) 
    || (provider === 'gitlab' && !userMapping.gitlabUserId)) {
    throw new Error(`Couldn't find ${isCopilot ? 'copilot' : 'owner'} username for '${provider}' for this repository.`);
  }

  let user = await dbHelper.scanOne(models.User, {
    username: provider === 'github' ? userMapping.githubUsername : // eslint-disable-line no-nested-ternary
      userMapping.gitlabUsername,
    type: provider,
  });

  return user;
}

/**
 * Generate an unique identifier
 *
 * @returns {String} the generated id
 */
function generateIdentifier() {
  return `${uuid()}-${new Date().getTime()}`;
}

/**
 * Generate simple hash of string
 *
 * @param {String} s the str
 * @returns {String} the hash
 */
function hashCode(s) {
  return s.split("").reduce(function(a, b){
    a = ((a << 5) - a) + b.charCodeAt(0); // eslint-disable-line no-bitwise, no-magic-numbers
    return a & a; // eslint-disable-line no-bitwise
  }, 0);
}

module.exports = {
  buildService,
  buildController,
  convertGitHubError,
  convertGitLabError,
  ensureExists,
  generateIdentifier,
  getProviderType,
  getProjectCopilotOrOwner,
  hashCode
};
