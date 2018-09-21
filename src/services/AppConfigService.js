/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This service will provide app config related operations.
 *
 * @author veshu
 * @version 1.0
 */
const config = require('../config');
const helper = require('../common/helper');

/**
 * gets the application configuration required for frontend
 * @returns {Object} the configuration details
 */
async function getAppConfig() {
  return {
    helpLink: config.HELP_LINK,
    copilotRole: config.COPILOT_ROLE,
    administratorRoles: config.ADMINISTRATOR_ROLES,
  };
}

module.exports = {
  getAppConfig,
};

helper.buildService(module.exports);
