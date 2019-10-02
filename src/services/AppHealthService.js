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
const errors = require('../common/errors');
const User = require('../models').User;

/**
 * gets the application health
 * @returns {Object} the health details
 */
async function getAppHealth() {
  const checkMongoDB = new Promise((resolve, reject) => {
    User.findOne({}, (err, data) => {
      if (err) {
        return reject(new errors.ServiceUnavailable('MongoDB instance cannot be reached' + data));
      }
      return resolve();
    });
  });

  const timeOutBreak = new Promise((resolve, reject) => {
    setTimeout(reject, config.MONGODB_TIMEOUT, new errors.ServiceUnavailable('MongoDB instance cannot be reached'));
  });

  await Promise.race([checkMongoDB, timeOutBreak]);

  return {
    checksRun: 1,
  };
}

module.exports = {
  getAppHealth,
};

helper.buildService(module.exports);
