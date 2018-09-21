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
  return await ProjectService.update(req.body, req.currentUser);
}

/**
 * get all projects
 * @param {Object} req the request
 * @returns {Array} the result
 */
async function getAll(req) {
  return await ProjectService.getAll(req.query, req.currentUser);
}

/**
 * create label
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function createLabel(req) {
  return await ProjectService.createLabel(req.body, req.currentUser);
}

/**
 * create hook
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function createHook(req) {
  return await ProjectService.createHook(req.body, req.currentUser);
}

/**
 * adds the wiki rules the project's repository
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function addWikiRules(req) {
  return await ProjectService.addWikiRules(req.body, req.currentUser);
}

/**
 * transfer the ownership of project
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function transferOwnerShip(req) {
  return await ProjectService.transferOwnerShip(req.body, req.currentUser);
}

module.exports = {
  create,
  update,
  getAll,
  createLabel,
  createHook,
  addWikiRules,
  transferOwnerShip,
};

helper.buildController(module.exports);
