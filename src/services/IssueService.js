/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This service will provide project operations.
 *
 * @author TCSCODER
 * @version 1.0
 */
/* eslint-disable no-undefined */
const Joi = require('joi');
const _ = require('lodash');
const moment = require('moment');
const gitHubApi = require('octonode');
const Gitlab = require('gitlab/dist/es5').default;
const config = require('../config');
const errors = require('../common/errors');
const helper = require('../common/helper');
const dbHelper = require('../common/db-helper');
const models = require('../models');

const securityService = require('./SecurityService');

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

/**
 * ensure if current user can update the project
 * if has access then get information
 * @param {String} projectId the project id
 * @param {String} currentUser the topcoder current user
 * @returns {Object} the project detail from database
 * @private
 */
async function _ensureEditPermissionAndGetInfo(projectId, currentUser) {
  const dbProject = await helper.ensureExists(models.Project, projectId, 'Project');
  if (await securityService.isAdminUser(currentUser.roles)) {
    return dbProject;
  }
  if (
    (dbProject.copilot !== undefined && dbProject.owner !== currentUser.handle
        && dbProject.copilot !== currentUser.handle) ||
    (dbProject.copilot === undefined && dbProject.owner !== currentUser.handle)
  ) {
    throw new errors.ForbiddenError('You don\'t have access on this project');
  }
  return dbProject;
}

/**
 * create issue
 * @param {Object} issue the issue detail
 * @param {String} currentUser the topcoder current user
 * @returns {Object} created issue
 */
async function create(issue, currentUser) {
  const dbProject = await _ensureEditPermissionAndGetInfo(issue.projectId, currentUser);
  const provider = await helper.getProviderType(dbProject.repoUrl);
  const userRole = await helper.getProjectCopilotOrOwner(models, dbProject, provider, dbProject.copilot !== undefined);
  const results = dbProject.repoUrl.split('/');
  const index = 1;
  const repoName = results[results.length - index];
  const excludePart = 3;
  const repoOwner = _(results).slice(excludePart, results.length - 1).join('/');
  const title = `[$${issue.prize}] ${issue.title}`;
  if (provider === 'github') {
    try {
      const client = gitHubApi.client(userRole.accessToken);
      const ghrepo = client.repo(`${repoOwner}/${repoName}`);
      const response = await new Promise((resolve, reject) => {
        ghrepo.issue({
          title,
          body: issue.comment,
          labels: [config.OPEN_FOR_PICKUP_ISSUE_LABEL]
        }, (error, resp) => {
          if (error) {
            return reject(error);
          }
          return resolve(resp);
        });
      });
      return {
        success: true,
        url: response.html_url,
        number: response.number
      };
    } catch (err) {
      // if error is already exists discard
      if (_.chain(err).get('body.errors').countBy({
        code: 'already_exists',
      }).get('true')
        .isUndefined()
        .value()) {
        throw helper.convertGitHubError(err, 'Failed to create issue.');
      }
    }
  } else {
    try {
      const client = new Gitlab({
        url: config.GITLAB_API_BASE_URL,
        oauthToken: userRole.accessToken,
      });
      const response = await client.Issues.create(`${repoOwner}/${repoName}`, {
        title,
        description: issue.comment,
        labels: config.OPEN_FOR_PICKUP_ISSUE_LABEL
      });
      return {
        success: true,
        url: response.web_url,
        number: response.iid
      };
    } catch (err) {
      if (_.get(err, 'error.message') !== 'Label already exists') {
        throw helper.convertGitLabError(err, 'Failed to create labels.');
      }
    }
  }
  return {
    success: false,
  };
}

const currentUserSchema = Joi.object().keys({
  handle: Joi.string().required(),
  roles: Joi.array().required(),
});

create.schema = {
  issue: {
    projectId: Joi.string().required(),
    prize: Joi.number().required(),
    title: Joi.string().required(),
    comment: Joi.string().required(),
    repoUrl: Joi.string().required()
  },
  currentUser: currentUserSchema,
};

module.exports = {
  search,
  create
};

helper.buildService(module.exports);
