/*
 * Copyright (c) 2019 TopCoder, Inc. All rights reserved.
 */

/**
 * This controller exposes application health related endpoints.
 *
 * @author Thomas Kranitsas
 * @version 1.0
 */
const helper = require('../common/helper');
const AppHealthService = require('../services/AppHealthService');

/**
 * gets the application health
 * @returns {Object} the health details
 */
async function getAppHealth() {
  return await AppHealthService.getAppHealth();
}

module.exports = {
  getAppHealth,
};

helper.buildController(module.exports);
