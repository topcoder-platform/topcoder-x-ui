/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * This module contains the winston logger configuration.
 *
 * @author TCSCODER
 * @version 1.0
 */
const winston = require('winston');
const config = require('../config');

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: config.LOG_LEVEL,
    }),
  ],
});

/**
 * Log error details with signature
 * @param {Error} err the error
 * @param {String} signature the signature
 */
logger.logFullError = function logFullError(err, signature) {
  if (!err || err.logged) {
    return;
  }
  logger.error(`Error happened in ${signature}\n${err.stack}`);
  err.logged = true;
};


module.exports = logger;
