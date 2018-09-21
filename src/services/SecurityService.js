/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This service will provide security related operations.
 *
 * @author veshu
 * @version 1.0
 */
const Joi = require('joi');
const _ = require('lodash');
const config = require('../config');
const helper = require('../common/helper');


/**
 * check if given roles are authorized for this app
 * @param {Array} roles the roles to check
 * @returns {Promise} the promise result whether roles are allowed or not
 */
async function isRolesAllowed(roles) {
  // at least one of the parameters should ge provided
  return _(roles).map((i) => i.toLowerCase())
    .intersection(_.map(config.ALLOWED_TOPCODER_ROLES, (j) => j.toLowerCase())).size() > 0;
}

isRolesAllowed.schema = {
  roles: Joi.array().items(Joi.string()).required(),
};

/**
 * check if given roles are admin user roles
 * @param {Array} roles the roles to check
 * @returns {Promise} the promise result whether roles are for admin user or not
 */
async function isAdminUser(roles) {
  // at least one of the parameters should ge provided
  return _(roles).map((i) => i.toLowerCase())
    .intersection(_.map(config.ADMINISTRATOR_ROLES, (j) => j.toLowerCase())).size() > 0;
}
isRolesAllowed.schema = {
  roles: Joi.array().items(Joi.string()).required(),
};

module.exports = {
  isRolesAllowed,
  isAdminUser,
};

helper.buildService(module.exports);
