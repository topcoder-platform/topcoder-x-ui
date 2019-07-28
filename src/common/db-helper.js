const logger = require('./logger');

/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */
/**
 * This module contains the database helper methods.
 *
 * @version 1.0
 */

/**
 * Get Data by model id
 * @param {Object} model The dynamoose model to query
 * @param {String} id The id value
 * @returns {Promise<void>}
 */
async function getById(model, id) {
  return await new Promise((resolve, reject) => {
    model.query('id').eq(id).exec((err, result) => {
      if (err) {
        logger.error(`DynamoDB getById error ${err}`);
        reject(err);
      }

      return resolve(result[0]);
    });
  });
}

/**
 * Get data collection by scan parameters
 * @param {Object} model The dynamoose model to scan
 * @param {Object} scanParams The scan parameters object
 * @returns {Promise<void>}
 */
async function scan(model, scanParams) {
  return await new Promise((resolve, reject) => {
    model.scan(scanParams).exec((err, result) => {
      if (err) {
        logger.error(`DynamoDB scan error ${err}`);
        reject(err);
      }

      return resolve(result.count === 0 ? [] : result);
    });
  });
}

/**
 * Get single data by scan parameters
 * @param {Object} model The dynamoose model to scan
 * @param {Object} scanParams The scan parameters object
 * @returns {Promise<void>}
 */
async function scanOne(model, scanParams) {
  return await new Promise((resolve, reject) => {
    model.scan(scanParams).exec((err, result) => {
      if (err) {
        logger.error(`DynamoDB scanOne error ${err}`);
        reject(err);
      }

      return resolve(result.count === 0 ? null : result[0]);
    });
  });
}

/**
 * Create item in database
 * @param {Object} Model The dynamoose model to query
 * @param {Object} data The create data object
 * @returns {Promise<void>}
 */
async function create(Model, data) {
  return await new Promise((resolve, reject) => {
    const dbItem = new Model(data);
    dbItem.save((err) => {
      if (err) {
        logger.error(`DynamoDB create error ${err}`);
        reject(err);
      }

      return resolve(dbItem);
    });
  });
}

/**
 * Update item in database
 * @param {Object} Model The dynamoose model to update
 * @param {String} id The id of item
 * @param {Object} data The updated data object
 * @returns {Promise<void>}
 */
async function update(Model, id, data) {
  const dbItem = await getById(Model, id);
  Object.keys(data).forEach((key) => {
    dbItem[key] = data[key];
  });
  return await new Promise((resolve, reject) => {
    dbItem.save((err) => {
      if (err) {
        logger.error(`DynamoDB update error ${err}`);
        reject(err);
      }

      return resolve(dbItem);
    });
  });
}

/**
 * Delete item in database
 * @param {Object} Model The dynamoose model to delete
 * @param {Object} queryParams The query parameters object
 */
async function remove(Model, queryParams) {
  const dbItem = await scanOne(Model, queryParams);
  await new Promise((resolve, reject) => {
    dbItem.delete((err) => {
      if (err) {
        logger.error(`DynamoDB remove error ${err}`);
        reject(err);
      }

      resolve(dbItem);
    });
  });
}

module.exports = {
  getById,
  scan,
  scanOne,
  create,
  update,
  remove,
};
