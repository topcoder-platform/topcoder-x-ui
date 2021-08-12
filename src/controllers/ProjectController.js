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
const models = require('../models');

/**
 * create project
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function create(req) {
  return await ProjectService.create(req.body, req.currentUser);
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
  const dbProject = await helper.ensureExists(models.Project, req.body.projectId, 'Project');
  for (const repoUrl of dbProject.repoUrls) { // eslint-disable-line no-restricted-syntax
    try {
      await ProjectService.createLabel(req.body, req.currentUser, repoUrl);
    }
    catch (err) {
      throw new Error(`Adding the labels failed. Repo ${repoUrl}`);
    }
  }
  return {
    success: false
  };
}

/**
 * create hook
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function createHook(req) {
  const dbProject = await helper.ensureExists(models.Project, req.body.projectId, 'Project');
  for (const repoUrl of dbProject.repoUrls) { // eslint-disable-line no-restricted-syntax
    try {
      await ProjectService.createHook(req.body, req.currentUser, repoUrl);
    }
    catch (err) {
      throw new Error(`Adding the webhook failed. Repo ${repoUrl}`);
    }
  }
  return {
    success: false
  };
}

/**
 * adds the wiki rules the project's repository
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function addWikiRules(req) {
  const dbProject = await helper.ensureExists(models.Project, req.body.projectId, 'Project');
  for (const repoUrl of dbProject.repoUrls) { // eslint-disable-line no-restricted-syntax
    try {
      await ProjectService.addWikiRules(req.body, req.currentUser, repoUrl);
    }
    catch (err) {
      throw new Error(`Adding the wiki rules failed. Repo ${repoUrl}`);
    }
  }
  return {
    success: false
  };
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
