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

module.exports = {
  search,
};

helper.buildController(module.exports);