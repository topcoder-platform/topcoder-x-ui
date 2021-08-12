/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This service will provide project operations.
 *
 * @author TCSCODER
 * @version 1.0
 */
const Joi = require('joi');
const _ = require('lodash');
const models = require('../models');
const helper = require('../common/helper');
const dbHelper = require('../common/db-helper');

const Organisation = models.Organisation;

const searchSchema = {
  criteria: Joi.object().keys({
    sortBy: Joi.string().valid('name', 'owner').required(),
    sortDir: Joi.string().valid('asc', 'desc').default('asc'),
    page: Joi.number().integer().min(1).required(),
    perPage: Joi.number().integer().min(1).required(),
  }).required(),
};

const createPATSchema = {
  pat: {
    name: Joi.string().required(),
    owner: Joi.string().required(),
    personalAccessToken: Joi.string().required(),
  },
};

const removePATSchema = {
  id: Joi.string().required(),
};

/**
 * searches pats
 * @param {Object} criteria the search criteria
 * @returns {Array} pats
 */
async function search(criteria) {
  const pats = await dbHelper.scan(Organisation, {});
  const filteredPats = _.map(pats, (pat) => {return {id: pat.id, name: pat.name, owner: pat.owner}});
  const offset = (criteria.page - 1) * criteria.perPage;
  const result = {
    pages: Math.ceil(filteredPats.length / criteria.perPage) || 1,
    docs: _(filteredPats).orderBy(criteria.sortBy, criteria.sortDir)
      .slice(offset).take(criteria.perPage)
      .value(),
  };
  return result;
}

search.schema = searchSchema;

/**
 * creates pat
 * @param {Object} pat details
 * @returns {Object} created pat
 */
async function create(pat) {
  const existPAT = await dbHelper.queryOneOrganisation(Organisation, pat.name);
  if (existPAT) {
    return { error: true, exist: true };
  }

  pat.id = helper.generateIdentifier();

  let dbPat = await dbHelper.create(Organisation, pat);
  return {id: dbPat.id, name: dbPat.name, owner: dbPat.owner};
}

create.schema = createPATSchema;

/**
 * delete payment item
 * @param {object} id payment id
 * @returns {Object} the success status
 */
async function remove(id) {
  await dbHelper.removeById(Organisation, id);
  return {success: true};
}

remove.schema = removePATSchema;


module.exports = {
  search,
  create,
  remove,
};

helper.buildService(module.exports);
