/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */
/**
 * This module contains the database helper methods.
 *
 * @version 1.0
 */

/**
 * Get all data collection
 * @param {Object} model The dynamoose model to scan
 * @returns {Promise<void>}
 */
async function scan(model) {
  return await new Promise((resolve, reject) => {
    model.scan().exec((err, result) => {
      if (err) {
        reject(err);
      }
      return resolve(result.count === 0 ? [] : result);
    });
  });
}

/**
 * Create item in database
 * @param {Object} Model The dynamoose model to create
 * @param {Object} data The create data object
 * @returns {Promise<void>}
 */
async function create(Model, data) {
  return await new Promise((resolve, reject) => {
    const dbItem = new Model(data);
    dbItem.save((err) => {
      if (err) {
        reject(err);
      }

      return resolve(dbItem);
    });
  });
}

/**
 * Delete all data in database
 * @param {Object} Model The dynamoose model to delete
 * @param {Array} list The data list
 */
async function removeAll(Model, list) {
  return await new Promise((resolve, reject) => {
  console.log(`Removing: ${list.length}`)
    Model.batchDelete(list, (err) => {
      if (err) {
        reject(err);
      }

      resolve();
    });
  });
}

module.exports = {
  scan,
  create,
  removeAll,
};
