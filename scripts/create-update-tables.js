/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */
'use strict';

/**
 * Script to sync DB model to dynamodb service.
 * @author TCSCODER
 * @version 1.1
 */

(async () => {
  try {
    console.log('Syncing database tables and indexes...');
    const models = require('../src/models');
    for (const key in models) {
      await pingTable(models[key]);
    }
    console.log('Remote tables is up to date.');
  } catch (e) {
    console.error(e);
  }
})();

/**
 * Check if the table is exist
 * @param {Model} model the db model
 * @returns {Promise} the promise object
 */
async function pingTable(model) {
  return new Promise((resolve, reject) => {
    if (!(model.scan && typeof model.scan == 'function' && model.scan({}).exec)) {
      return resolve();
    }
    model.scan({id: 0}).exec((err, result) => {
      if (err) {
        console.log(`Table is not exists ${err}`);
        return reject(err);
      }
      return resolve();
    });
  });
}