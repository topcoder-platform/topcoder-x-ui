/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This controller exposes security related endpoints.
 *
 * @author veshu
 * @version 1.0
 */

const helper = require('../common/helper');
const securityService = require('../services/SecurityService');

/**
 * check if current user is authorized for Topcoder X or not.
 * @param {Object} req the request
 * @returns {Object} the result
 */
async function isAuthorized(req) {
  return await securityService.isRolesAllowed(req.currentUser.roles);
}

module.exports = {
  isAuthorized,
};

helper.buildController(module.exports);
