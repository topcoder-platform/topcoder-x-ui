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
const helper = require('../common/helper');
const models = require('../models');


/**
 * searches the issues
 * @param {Object} criteria the search criteria
 * @param {String} currentUserTopcoderHandle current user's topcoder handle
 * @returns {Object} the search results
 */
async function search(criteria, currentUserTopcoderHandle) {
  const query = {};
  if (criteria.label) {
    query.labels = { $in: [criteria.label] };
  }

  // select projects for current user
  const projects = await models.Project.find({ owner: currentUserTopcoderHandle, archived: false });
  query.projectId = {
    $in: projects.map((i) => i._id),
  };

  if (!criteria.sortBy) {
    criteria.sortBy = 'updatedAt';
    criteria.sortDir = 'desc';
  }
  const docs = await models.Issue.find(query)
    .populate({ path: 'projectId', select: 'title repoUrl' });
  const offset = (criteria.page - 1) * criteria.perPage;
  const result = {
    pages: Math.ceil(docs.length / criteria.perPage) || 1,
    docs: _(docs).orderBy(criteria.sortBy, criteria.sortDir)
      .slice(offset).take(criteria.perPage)
      .value(),
  };
  return result;
}

search.schema = Joi.object().keys({
  criteria: Joi.object().keys({
    label: Joi.string().required(),
    sortBy: Joi.string().valid('title', 'projectId.title', 'updatedAt', 'assignee', 'assignedAt').default('updatedAt'),
    sortDir: Joi.string().valid('asc', 'desc').default('asc'),
    page: Joi.number().integer().min(1).required(),
    perPage: Joi.number().integer().min(1).required(),
  }),
  currentUserTopcoderHandle: Joi.string().required(),
});

module.exports = {
  search,
};

helper.buildService(module.exports);
