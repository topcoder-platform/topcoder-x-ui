/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This controller exposes setting endpoints.
 *
 * @author TCSCODER
 * @version 1.0
 */

const helper = require('../common/helper');
const UserService = require('../services/UserService');

/**
 * Gets user setting.
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function getUserSetting(req) {
  const topcoderUsername = req.query.topcoderUsername;
  return await UserService.getUserSetting(topcoderUsername);
}

/**
 * Gets user setting.
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function revokeUserSetting(req) {
  const topcoderUsername = req.query.topcoderUsername;
  const provider = req.query.provider;
  return await UserService.revokeUserSetting(topcoderUsername, provider);
}

/**
 * Gets user access token.
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function getUserToken(req) {
  return await UserService.getUserToken(req.query.username, req.query.tokenType);
}

/**
 * searches user mappings according to criteria
 * @param {Object} req the request
 * @param {Object} res  the response
 * @returns {Object} the result
 */
async function search(req) {
  return await UserService.search(req.query);
}

/**
 * create user mapping
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function create(req) {
  return await UserService.create(req.body.userMapping);
}

/**
 * update user mapping
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function update(req) {
  return await UserService.update(req.body.userMapping);
}

/**
 * remove user mapping
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function remove(req) {
  return await UserService.remove(req.params.username);
}

module.exports = {
  getUserSetting,
  revokeUserSetting,
  getUserToken,
  search,
  create,
  remove,
  update,
};

helper.buildController(module.exports);
