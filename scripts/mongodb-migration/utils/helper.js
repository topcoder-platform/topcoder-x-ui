/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This file defines helper methods.
 *
 * @author TCSCODER
 * @version 1.0
 */

const uuid = require('uuid/v4');

/**
 * Generate an unique identifier
 *
 * @returns {String} the generated id
 */
function generateIdentifier() {
  return `${uuid()}-${new Date().getTime()}`;
}


module.exports = {
  generateIdentifier,
};
