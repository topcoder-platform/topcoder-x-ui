/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This controller exposes Github PATs endpoints.
 *
 * @author kevinkid
 * @version 1.0
 */
const helper = require('../common/helper');
const GithubPATsService = require('../services/GithubPATsService');

/**
 * searches the pat according to criteria
 * @param {Object} req the request
 * @param {Object} res  the response
 * @returns {Object} the result
 */
async function search(req) {
  return await GithubPATsService.search(req.query);
}

/**
 * create pat
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function create(req) {
  return await GithubPATsService.create(req.body.pat);
}

/**
 * remove pat item
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the result
 */
async function remove(req) {
  return await GithubPATsService.remove(req.params.id);
}


module.exports = {
  search,
  create,
  remove,
};

helper.buildController(module.exports);
