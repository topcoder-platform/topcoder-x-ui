/*
 * Copyright (c) 2019 TopCoder, Inc. All rights reserved.
 */

/**
 * This service will provide app health related operations.
 *
 * @author Thomas Kranitsas
 * @version 1.0
 */
const config = require('../config');
const helper = require('../common/helper');
const { DynamoDB } = require('../models');

/**
 * gets the application health
 * @returns {Object} the health details
 */
async function getAppHealth() {
  const checkDynamoDB = new Promise((resolve, reject) => {
    DynamoDB.listTables({}, (err, data) => {
      if (err) {
        return reject(new errors.ServiceUnavailable('DynamoDB instance cannot be reached'));
      }
      return resolve();
    });
  });

  const timeOutBreak = new Promise((resolve, reject) => {
    setTimeout(reject, config.DYNAMODB.TIMEOUT, new errors.ServiceUnavailable('DynamoDB instance cannot be reached'));
  });

  await Promise.race([checkDynamoDB, timeOutBreak]);

  return {
    checksRun: 1,
  };
}

module.exports = {
  getAppHealth,
};

helper.buildService(module.exports);
