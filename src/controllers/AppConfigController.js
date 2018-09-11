/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This controller exposes application configuration related endpoints.
 *
 * @author veshu
 * @version 1.0
 */
const helper = require('../common/helper');
const AppConfigService = require('../services/AppConfigService');

/**
 * gets the application configuration required for frontend
 * @returns {Object} the configuration details
 */
async function getAppConfig() {
  return await AppConfigService.getAppConfig();
}

module.exports = {
  getAppConfig,
};

helper.buildController(module.exports);
