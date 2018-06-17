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
  return await ProjectService.create(req.body, req.currentUser.handle);
}

/**
 * update project
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function update(req) {
  return await ProjectService.update(req.body, req.currentUser.handle);
}

/**
 * get all projects
 * @param {Object} req the request
 * @returns {Array} the result
 */
async function getAll(req) {
  return await ProjectService.getAll(req.query.status, req.currentUser.handle);
}

/**
 * create label
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function createLabel(req) {
  return await ProjectService.createLabel(req.body, req.currentUser.handle);
}

/**
 * create hook
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function createHook(req) {
  return await ProjectService.createHook(req.body, req.currentUser.handle);
}

module.exports = {
  create,
  update,
  getAll,
  createLabel,
  createHook,
};

helper.buildController(module.exports);
