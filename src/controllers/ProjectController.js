/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This controller exposes project endpoints.
 *
 * @author TCSCODER
 * @version 1.0
 */
const helper = require('../common/helper');
const ProjectService = require('../services/ProjectService');

/**
 * create project
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function create(req) {
  return await ProjectService.create(req.body);
}

/**
 * update project
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function update(req) {
  return await ProjectService.update(req.body);
}

/**
 * get all projects
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Array} the result
 */
async function getAll() {
  return await ProjectService.getAll();
}

/**
 * create label
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function createLabel(req) {
  return await ProjectService.createLabel(req.body);
}

/**
 * create hook
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function createHook(req) {
  return await ProjectService.createHook(req.body);
}

module.exports = {
  create,
  update,
  getAll,
  createLabel,
  createHook,
};

helper.buildController(module.exports);
