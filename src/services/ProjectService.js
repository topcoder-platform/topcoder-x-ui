/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This service will provide project operations.
 *
 * @author TCSCODER
 * @version 1.0
 */

const fs = require('fs');
const path = require('path');
const Joi = require('joi');
const gitHubApi = require('octonode');
const Gitlab = require('gitlab/dist/es5').default;
const _ = require('lodash');
const guid = require('guid');
const kafka = require('../utils/kafka');
const helper = require('../common/helper');
const dbHelper = require('../common/db-helper');
const models = require('../models');
const config = require('../config');
const errors = require('../common/errors');

const userService = require('./UserService');
const securityService = require('./SecurityService');


const currentUserSchema = Joi.object().keys({
  handle: Joi.string().required(),
  roles: Joi.array().required(),
});
const projectSchema = {
  project: {
    id: Joi.string().required(),
    title: Joi.string().required(),
    tcDirectId: Joi.number().required(),
    repoUrl: Joi.string().required(),
    rocketChatWebhook: Joi.string().allow(null),
    rocketChatChannelName: Joi.string().allow(null),
    archived: Joi.boolean().required(),
    owner: Joi.string().required(),
    secretWebhookKey: Joi.string().required(),
    copilot: Joi.string().required(),
    createdAt: Joi.date(),
    updatedAt: Joi.date(),
  },
  currentUser: currentUserSchema,
};

const createProjectSchema = {
  project: {
    title: Joi.string().required(),
    tcDirectId: Joi.number().required(),
    repoUrl: Joi.string().required(),
    copilot: Joi.string().required(),
    rocketChatWebhook: Joi.string().allow(null),
    rocketChatChannelName: Joi.string().allow(null),
    archived: Joi.boolean().required(),
  },
  currentUserTopcoderHandle: Joi.string().required(),
};

/**
 * ensures the requested project detail is valid
 * @param {Object} project the project detail
 * @private
 */
async function _validateProjectData(project) {
  const provider = await helper.getProviderType(project.repoUrl);
  const setting = await userService.getUserSetting(project.copilot);
  if (!setting[provider]) {
    throw new errors.ValidationError(`User ${project.copilot} doesn't currently have Topcoder-X access setup for ${provider}. 
    Please have them sign in and set up their ${provider} account with Topcoder-X before adding as copilot`);
  }
}

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
  if (dbProject.owner !== currentUser.handle && dbProject.copilot !== currentUser.handle) {
    throw new errors.ForbiddenError('You don\'t have access on this project');
  }
  return dbProject;
}

/**
 * creates project
 * @param {Object} project the project detail
 * @param {String} currentUserTopcoderHandle the topcoder handle of current user
 * @returns {Object} created project
 */
async function create(project, currentUserTopcoderHandle) {
  await _validateProjectData(project);
  /**
     * Uncomment below code to enable the function of raising event when 'project was created'
     *
     * var projectCreateEvent = {
     *  "event":"project created"
     * }
     * await kafka.send(JSON.stringify(JSON.stringify(projectCreateEvent)));
     */

  project.owner = currentUserTopcoderHandle;
  project.secretWebhookKey = guid.raw();
  project.copilot = project.copilot.toLowerCase();
  project.id = helper.generateIdentifier();
  return await dbHelper.create(models.Project, project);
}

create.schema = createProjectSchema;

/**
 * updates project
 * @param {Object} project the project detail
 * @param {String} currentUser the topcoder current user
 * @returns {Object} updated project
 */
async function update(project, currentUser) {
  const dbProject = await _ensureEditPermissionAndGetInfo(project.id, currentUser);
  await _validateProjectData(project);
  if (dbProject.archived === 'false' && project.archived === true) {
    // project archived detected.
    const result = {
      event: 'project archived',
    };
    // send the event data to kafka
    await kafka.send(JSON.stringify(result));
  }

  /**
     * Uncomment below code to enable the function of raising event when 'project was updated'
     *
     * var projectUpdateEvent = {
     *  "event":"project updated"
     * }
     * await kafka.send(JSON.stringify(JSON.stringify(projectUpdateEvent)));
     */
  project.owner = dbProject.owner;
  project.copilot = project.copilot.toLowerCase();
  Object.entries(project).map((item) => {
    dbProject[item[0]] = item[1];
    return item;
  });

  return await dbHelper.update(models.Project, dbProject.id, dbProject);
}

update.schema = projectSchema;

/**
 * gets all projects
 * @param {Object} query the query filter object
 * @param {String} currentUser the topcoder current user
 * @returns {Array} all projects
 */
async function getAll(query, currentUser) {
  const condition = {
    archived: 'false',
  };

  if (query.status === 'archived') {
    condition.archived = 'true';
  }
  // if show all is checked user must be admin
  if (query.showAll && await securityService.isAdminUser(currentUser.roles)) {
    return await dbHelper.scan(models.Project, condition);
  }

  const filter = {
    FilterExpression: '(#owner= :handle or copilot = :handle) AND #archived = :status',
    ExpressionAttributeNames: {
      '#owner': 'owner',
      '#archived': 'archived',
    },
    ExpressionAttributeValues: {
      ':handle': currentUser.handle,
      ':status': condition.archived,
    },
  };

  return await dbHelper.scan(models.Project, filter);
}

getAll.schema = Joi.object().keys({
  query: Joi.object().keys({
    status: Joi.string().required().allow('active', 'archived').default('active'),
    showAll: Joi.bool().optional().default(false),
  }),
  currentUser: currentUserSchema,
});

/**
 * creates label
 * @param {Object} body the request body
 * @param {String} currentUser the topcoder current user
 * @returns {Object} result
 */
async function createLabel(body, currentUser) {
  const dbProject = await _ensureEditPermissionAndGetInfo(body.projectId, currentUser);
  const provider = await helper.getProviderType(dbProject.repoUrl);
  const copilot = await helper.getProjectCopilot(models, dbProject, provider);
  const results = dbProject.repoUrl.split('/');
  let index = 1;
  const repoName = results[results.length - index];
  index += 1;
  const excludePart = 3;
  const repoOwner = _(results).slice(excludePart, results.length - 1).join('/');
  if (provider === 'github') {
    try {
      const client = gitHubApi.client(copilot.accessToken);
      const ghrepo = client.repo(`${repoOwner}/${repoName}`);
      await Promise.all(config.LABELS.map(async (label) => {
        await new Promise((resolve, reject) => {
          ghrepo.label({
            name: label.name,
            color: label.color,
          }, (error) => {
            if (error) {
              return reject(error);
            }
            return resolve();
          });
        });
      }));
    } catch (err) {
      // if error is already exists discard
      if (_.chain(err).get('body.errors').countBy({
        code: 'already_exists',
      }).get('true')
        .isUndefined()
        .value()) {
        throw helper.convertGitHubError(err, 'Failed to create labels.');
      }
    }
  } else {
    try {
      const client = new Gitlab({
        url: config.GITLAB_API_BASE_URL,
        oauthToken: copilot.accessToken,
      });
      await Promise.all(config.LABELS.map(async (label) => {
        await client.Labels.create(`${repoOwner}/${repoName}`, {
          name: label.name,
          color: `#${label.color}`,
        });
      }));
    } catch (err) {
      if (_.get(err, 'error.message') !== 'Label already exists') {
        throw helper.convertGitLabError(err, 'Failed to create labels.');
      }
    }
  }
  return {
    success: true,
  };
}

createLabel.schema = Joi.object().keys({
  body: Joi.object().keys({
    projectId: Joi.string().required(),
  }),
  currentUser: currentUserSchema,
});

/**
 * creates hook
 * @param {Object} body the request body
 * @param {String} currentUser the topcoder current user
 * @returns {Object} result
 */
async function createHook(body, currentUser) {
  const dbProject = await _ensureEditPermissionAndGetInfo(body.projectId, currentUser);
  const provider = await helper.getProviderType(dbProject.repoUrl);
  const copilot = await helper.getProjectCopilot(models, dbProject, provider);
  const results = dbProject.repoUrl.split('/');
  let index = 1;
  const repoName = results[results.length - index];
  index += 1;
  const excludePart = 3;
  const repoOwner = _(results).slice(excludePart, results.length - 1).join('/');
  if (provider === 'github') {
    try {
      const client = gitHubApi.client(copilot.accessToken);
      const ghrepo = client.repo(`${repoOwner}/${repoName}`);
      await new Promise((resolve, reject) => {
        ghrepo.hook({
          name: 'web',
          active: true,
          events: [
            'push',
            'pull_request',
            'create',
            'commit_comment',
            'issue_comment',
            'issues',
            'label',
          ],
          config: {
            url: `${config.HOOK_BASE_URL}/webhooks/github`,
            content_type: 'json',
            secret: dbProject.secretWebhookKey,
          },
        }, (error) => {
          if (error) {
            return reject(error);
          }
          return resolve();
        });
      });
    } catch (err) {
      // if error is already exists discard
      if (_.chain(err).get('body.errors').countBy({
        message: 'Hook already exists on this repository',
      }).get('true')
        .isUndefined()
        .value()) {
        throw helper.convertGitHubError(err, 'Failed to create webhook.');
      }
    }
  } else {
    try {
      const client = new Gitlab({
        url: config.GITLAB_API_BASE_URL,
        oauthToken: copilot.accessToken,
      });
      await client.ProjectHooks.add(`${repoOwner}/${repoName}`,
        `${config.HOOK_BASE_URL}/webhooks/gitlab`, {
          push_events: true,
          issues_events: true,
          confidential_issues_events: true,
          merge_requests_events: true,
          tag_push_events: true,
          note_events: true,
          job_events: true,
          pipeline_events: true,
          wiki_page_events: true,
          token: dbProject.secretWebhookKey,
        }
      );
    } catch (err) {
      throw helper.convertGitLabError(err, 'Failed to create webhook.');
    }
  }
  return {
    success: true,
  };
}

createHook.schema = createLabel.schema;


/**
 * adds the wiki rules the project's repository
 * @param {Object} body the request body
 * @param {String} currentUser the topcoder current user
 * @returns {Object} result
 */
async function addWikiRules(body, currentUser) {
  const dbProject = await _ensureEditPermissionAndGetInfo(body.projectId, currentUser);
  const provider = await helper.getProviderType(dbProject.repoUrl);
  const copilot = await helper.getProjectCopilot(models, dbProject, provider);
  const results = dbProject.repoUrl.split('/');
  let index = 1;
  const repoName = results[results.length - index];
  index += 1;
  const excludePart = 3;
  const repoOwner = _(results).slice(excludePart, results.length - 1).join('/');
  const content = fs.readFileSync(path.resolve(__dirname, '../assets/WorkingWithTickets.md'), 'utf8'); // eslint-disable-line
  if (provider === 'github') {
    try {
      const client = gitHubApi.client(copilot.accessToken);
      const ghrepo = client.repo(`${repoOwner}/${repoName}`);
      await new Promise((resolve, reject) => {
        ghrepo.issue({
          title: 'Github ticket rules',
          body: content,
        }, (error) => {
          if (error) {
            return reject(error);
          }
          return resolve();
        });
      });
    } catch (err) {
      throw helper.convertGitHubError(err, 'Failed to add wiki rules.');
    }
  } else {
    try {
      const client = new Gitlab({
        url: config.GITLAB_API_BASE_URL,
        oauthToken: copilot.accessToken,
      });
      await client.Wikis.create(`${repoOwner}/${repoName}`,
        {
          content,
          title: 'Gitlab ticket rules',
        }
      );
    } catch (err) {
      throw helper.convertGitLabError(err, 'Failed to add wiki rules.');
    }
  }
  return {
    success: true,
  };
}

addWikiRules.schema = createLabel.schema;

/**
 * transfer the ownership of project
 * @param {Object} body the request body
 * @param {String} currentUser the topcoder current user
 * @returns {Object} result
 */
async function transferOwnerShip(body, currentUser) {
  if (!await securityService.isAdminUser(currentUser.roles)) {
    throw new errors.ForbiddenError('You can\'t transfer the ownership of this project');
  }
  const dbProject = await _ensureEditPermissionAndGetInfo(body.projectId, currentUser);
  const provider = await helper.getProviderType(dbProject.repoUrl);
  const setting = await userService.getUserSetting(body.owner);
  if (!setting.gitlab && !setting.github) {
    throw new errors.ValidationError(`User ${body.owner} doesn't currently have Topcoder-X access. 
    Please have them sign in and set up their Gitlab and Github accounts with Topcoder-X before transferring ownership.`);
  } else if (!setting[provider]) {
    throw new errors.ValidationError(`User ${body.owner} doesn't currently have Topcoder-X access setup for ${provider}. 
    Please have them sign in and set up their ${provider} accounts with Topcoder-X before transferring ownership.`);
  }

  return await dbHelper.update(models.Project, dbProject.id, {
    owner: body.owner,
  });
}
transferOwnerShip.schema = Joi.object().keys({
  body: Joi.object().keys({
    projectId: Joi.string().required(),
    owner: Joi.string().required(),
  }),
  currentUser: currentUserSchema,
});

module.exports = {
  create,
  update,
  getAll,
  createLabel,
  createHook,
  addWikiRules,
  transferOwnerShip,
};

helper.buildService(module.exports);
