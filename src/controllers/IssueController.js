/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This controller exposes project endpoints.
 *
 * @author veshu
 * @version 1.0
 */
const helper = require('../common/helper');
const IssueService = require('../services/IssueService');

/**
 * search issues
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function search(req) {
  return await IssueService.search(req.query, req.currentUser.handle);
}

/**
 * create an issue
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function create(req) {
  return await IssueService.create(req.body, req.currentUser);
}

/**
 * recreate an issue
 * Remove the related db record.
 * Recreate new record and create new challenge.
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function recreate(req) {
  return await IssueService.recreate(req.body, req.currentUser);
}

module.exports = {
  search,
  create,
  recreate
};

helper.buildController(module.exports);