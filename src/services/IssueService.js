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
const moment = require('moment');
const helper = require('../common/helper');
const dbHelper = require('../common/db-helper');
const models = require('../models');

/**
 * searches the issues
 * @param {Object} criteria the search criteria
 * @param {String} currentUserTopcoderHandle current user's topcoder handle
 * @returns {Object} the search results
 */
async function search(criteria, currentUserTopcoderHandle) {
  let filterLabel = '';
  const filterValues = {};
  if (criteria.label) {
    filterLabel = 'contains(labels, :label)';
    filterValues[':label'] = criteria.label;
  }

  // select projects for current user
  const projects = await dbHelper.scan(models.Project, {
    owner: currentUserTopcoderHandle,
    archived: 'false',
  });

  if (projects && projects.length > 0) {
    const filterProjectIds = _.join(projects.map((p, index) => {
      const id = `:id${index}`;
      filterValues[id] = p.id;
      return id;
    }), ',');
    const FilterExpression = `${filterLabel} AND projectId in (${filterProjectIds})`;

    if (!criteria.sortBy) {
      criteria.sortBy = 'updatedAt';
      criteria.sortDir = 'desc';
    }

    const docs = await dbHelper.scan(models.Issue, {
      FilterExpression,
      ExpressionAttributeValues: filterValues,
    });

    for (const issue of docs) { // eslint-disable-line guard-for-in,no-restricted-syntax
      issue.projectId = await dbHelper.getById(models.Project, issue.projectId);
      issue.assignedAt = moment(issue.assignedAt).format('YYYY-MM-DD HH:mm:ss');
    }

    const offset = (criteria.page - 1) * criteria.perPage;
    const result = {
      pages: Math.ceil(docs.length / criteria.perPage) || 1,
      docs: _(docs).orderBy(criteria.sortBy, criteria.sortDir)
        .slice(offset).take(criteria.perPage)
        .value(),
    };
    return result;
  }

  return {
    pages: 0,
    docs: [],
  };
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
