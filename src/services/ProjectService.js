/* eslint-disable max-lines */
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
const fs = require('fs');
const path = require('path');
const Joi = require('joi');
const GitHub = require('github-api');
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
    repoUrls: Joi.array().required(),
    rocketChatWebhook: Joi.string().allow(null),
    rocketChatChannelName: Joi.string().allow(null),
    archived: Joi.boolean().required(),
    owner: Joi.string().required(),
    secretWebhookKey: Joi.string().required(),
    copilot: Joi.string().allow(null),
    registeredWebhookId: Joi.string().allow(null),
    createdAt: Joi.date(),
    updatedAt: Joi.date(),
    createCopilotPayments: Joi.boolean(),
    isConnect: Joi.boolean().allow(null)
  },
  currentUser: currentUserSchema,
};

const createProjectSchema = {
  project: {
    title: Joi.string().required(),
    tcDirectId: Joi.number().required(),
    repoUrl: Joi.string().required(),
    copilot: Joi.string().allow(null),
    rocketChatWebhook: Joi.string().allow(null),
    rocketChatChannelName: Joi.string().allow(null),
    archived: Joi.boolean().required(),
    createCopilotPayments: Joi.boolean()
  },
  currentUser: currentUserSchema
};

/**
 * ensures the requested project detail is valid
 * @param {Object} project the project detail
 * @param {String} repoUrl the repo url
 * @private
 */
async function _validateProjectData(project, repoUrl) {
  let existsInDatabase;
  if (project.id) {
    existsInDatabase = await dbHelper.queryOneActiveProjectWithFilter(models.Project, repoUrl, project.id)
  } else {
    existsInDatabase = await dbHelper.queryOneActiveProject(models.Project, repoUrl)
  }
  if (existsInDatabase) {
    throw new errors.ValidationError(`This repo already has a Topcoder-X project associated with it.
    Copilot: ${existsInDatabase.copilot}, Owner: ${existsInDatabase.owner}`)
  }
  const provider = await helper.getProviderType(repoUrl);
  const userRole = project.copilot ? project.copilot : project.owner;
  const setting = await userService.getUserSetting(userRole);
  if (!setting[provider]) {
    throw new errors.ValidationError(`User ${userRole} doesn't currently have Topcoder-X access setup for ${provider}. Please have them sign in and set up their ${provider} account with Topcoder-X before adding as ${project.copilot !== undefined ? 'copilot' : 'owner'}`);
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
 * creates project
 * @param {Object} project the project detail
 * @param {Object} currentUser the topcoder current user
 * @returns {Object} created project
 */
async function create(project, currentUser) {
  const currentUserTopcoderHandle = currentUser.handle;
  project.owner = currentUserTopcoderHandle;
  const repoUrls = _.map(project.repoUrl.split(','), repoUrl => repoUrl.trim());
  for (const repoUrl of repoUrls) { // eslint-disable-line no-restricted-syntax
    await _validateProjectData(project, repoUrl);
  }
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
  project.copilot = project.copilot ? project.copilot.toLowerCase() : null;
  project.id = helper.generateIdentifier();

  const createdProject = await dbHelper.create(models.Project, project);

  for (const repoUrl of repoUrls) { // eslint-disable-line no-restricted-syntax
    await dbHelper.create(models.Repository, {
      id: helper.generateIdentifier(),
      projectId: project.id,
      url: repoUrl,
      archived: project.archived
    })
    try {
      await createLabel({projectId: project.id}, currentUser, repoUrl);
      await createHook({projectId: project.id}, currentUser, repoUrl);
      await addWikiRules({projectId: project.id}, currentUser, repoUrl);
    }
    catch (err) {
      throw new Error(`Project created. Adding the webhook, issue labels, and wiki rules failed. Repo ${repoUrl}`);
    }
  }

  return createdProject;
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
  const repoUrls = _.map(project.repoUrl.split(','), repoUrl => repoUrl.trim());
  for (const repoUrl of repoUrls) { // eslint-disable-line no-restricted-syntax
    await _validateProjectData(project, repoUrl);
  }
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
  project.copilot = project.copilot !== undefined ? project.copilot.toLowerCase() : null;
  Object.entries(project).map((item) => {
    dbProject[item[0]] = item[1];
    return item;
  });
  const oldRepositories = await dbHelper.queryRepositoriesByProjectId(dbProject.id);
  for (const repo of oldRepositories) { // eslint-disable-line
    await dbHelper.removeById(models.Repository, repo.id);
  }
  for (const repoUrl of repoUrls) { // eslint-disable-line no-restricted-syntax
    await dbHelper.create(models.Repository, {
      id: helper.generateIdentifier(),
      projectId: dbProject.id,
      url: repoUrl,
      archived: project.archived
    })
  }
  dbProject.updatedAt = new Date();
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
    let projects = await dbHelper.scan(models.Project, condition);
    projects = _.map(projects, (project) => {
      if (!project.updatedAt) {
        project.updatedAt = 0;
      }
      return project;
    });
    for (const project of projects) { // eslint-disable-line
      project.repoUrls = await dbHelper.populateRepoUrls(project.id);
    }  
    return _.orderBy(projects, ['updatedAt', 'title'], ['desc', 'asc']);
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

  let projects = await dbHelper.scan(models.Project, filter);
  projects = _.map(projects, (project) => {
    if (!project.updatedAt) {
      project.updatedAt = 0;
    }
    return project;
  });
  for (const project of projects) { // eslint-disable-line
    project.repoUrls = await dbHelper.populateRepoUrls(project.id);
  }
  return _.orderBy(projects, ['updatedAt', 'title'], ['desc', 'asc']);
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
 * @param {String} repoUrl the repo url of the project
 * @returns {Object} result
 */
async function createLabel(body, currentUser, repoUrl) {
  const dbProject = await _ensureEditPermissionAndGetInfo(body.projectId, currentUser);
  const provider = await helper.getProviderType(repoUrl);
  const userRole = await helper.getProjectCopilotOrOwner(models, dbProject, provider, false);
  const results = repoUrl.split('/');
  const index = 1;
  const repoName = results[results.length - index];
  const excludePart = 3;
  const repoOwner = _(results).slice(excludePart, results.length - 1).join('/');
  if (provider === 'github') {
    try {
      const github = new GitHub({token: userRole.accessToken});
      const issueWrapper = github.getIssues(repoOwner, repoName);
      await Promise.all(config.LABELS.map(async (label) => {
        await new Promise((resolve, reject) => {
          issueWrapper.createLabel({
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
  } else if (provider === 'gitlab') {
    try {
      const client = new Gitlab({
        url: config.GITLAB_API_BASE_URL,
        oauthToken: userRole.accessToken,
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
  repoUrl: Joi.string().required()
});

/**
 * creates hook
 * @param {Object} body the request body
 * @param {String} currentUser the topcoder current user
 * @param {String} repoUrl the repo url of the project
 * @returns {Object} result
 */
async function createHook(body, currentUser, repoUrl) {
  const dbProject = await _ensureEditPermissionAndGetInfo(body.projectId, currentUser);
  const dbRepo = await dbHelper.queryRepositoryByProjectIdFilterUrl(dbProject.id, repoUrl);
  const provider = await helper.getProviderType(repoUrl);
  const userRole = await helper.getProjectCopilotOrOwner(models, dbProject, provider, false);
  const results = repoUrl.split('/');
  const index = 1;
  const repoName = results[results.length - index];
  const excludePart = 3;
  const repoOwner = _(results).slice(excludePart, results.length - 1).join('/');
  const updateExisting = dbRepo.registeredWebhookId !== undefined;
  if (provider === 'github') {
    try {
      const github = new GitHub({token: userRole.accessToken});
      const repoWrapper = github.getRepo(repoOwner, repoName);
      await new Promise((resolve, reject) => {
        repoWrapper.listHooks(async (err, hooks) => {
          if (!err && dbRepo.registeredWebhookId &&
            _.find(hooks, {id: parseInt(dbRepo.registeredWebhookId, 10)})) {
            await repoWrapper.deleteHook(dbRepo.registeredWebhookId);
          }
          repoWrapper.createHook({
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
          }, async (error, hook) => {
            if (error) {
              return reject(error);
            }
            if (hook && hook.id) {
              dbRepo.registeredWebhookId = hook.id.toString();
              await dbHelper.update(models.Repository, dbRepo.id, dbRepo);
            }
            return resolve();
          });
        });
      });
    } catch (err) {
      // if error is already exists discard
      if (_.chain(err).get('body.errors').countBy({
        message: 'Hook already exists on this repository',
      }).get('true')
        .isUndefined()
        .value()) {
        const errMsg = 'Failed to create webhook';
        if (err.statusCode === 404) { // eslint-disable-line no-magic-numbers
          err.message = 'The repository is not found or doesn\'t have access to create webhook';
        }
        throw helper.convertGitHubError(err, errMsg);
      }
    }
  } else if (provider === 'gitlab') {
    try {
      const client = new Gitlab({
        url: config.GITLAB_API_BASE_URL,
        oauthToken: userRole.accessToken,
      });
      const hooks = await client.ProjectHooks.all(`${repoOwner}/${repoName}`);
      if (hooks && dbRepo.registeredWebhookId &&
        _.find(hooks, {id: parseInt(dbRepo.registeredWebhookId, 10)})) {
        await client.ProjectHooks.remove(`${repoOwner}/${repoName}`, dbRepo.registeredWebhookId);
      }
      const hook = await client.ProjectHooks.add(`${repoOwner}/${repoName}`,
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
      if (hook && hook.id) {
        dbRepo.registeredWebhookId = hook.id.toString();
        await dbHelper.update(models.Repository, dbRepo.id, dbRepo);
      }
    } catch (err) {
      const errMsg = 'Failed to create webhook';
      if (err.statusCode === 404) { // eslint-disable-line no-magic-numbers
        err.message = 'The repository is not found or doesn\'t have access to create webhook';
      }
      throw helper.convertGitLabError(err, errMsg);
    }
  } else {
    return {
      success: false
    };
  }
  return {
    success: true,
    updated: updateExisting,
  };
}

createHook.schema = createLabel.schema;


/**
 * adds the wiki rules the project's repository
 * @param {Object} body the request body
 * @param {String} currentUser the topcoder current user
 * @param {String} repoUrl the repo url of the project
 * @returns {Object} result
 */
async function addWikiRules(body, currentUser, repoUrl) {
  const dbProject = await _ensureEditPermissionAndGetInfo(body.projectId, currentUser);
  const provider = await helper.getProviderType(repoUrl);
  const userRole = await helper.getProjectCopilotOrOwner(models, dbProject, provider, dbProject.copilot !== undefined);
  const results = repoUrl.split('/');
  const index = 1;
  const repoName = results[results.length - index];
  const excludePart = 3;
  const repoOwner = _(results).slice(excludePart, results.length - 1).join('/');
  const content = fs.readFileSync(path.resolve(__dirname, '../assets/WorkingWithTickets.md'), 'utf8'); // eslint-disable-line
  if (provider === 'github') {
    try {
      const github = new GitHub({token: userRole.accessToken});
      const issueWrapper = github.getIssues(repoOwner, repoName);
      const {data: issues} = await issueWrapper.listIssues();
      const wikiIssue = _.find(issues, {title: 'Github ticket rules'});
      if (!wikiIssue || wikiIssue.body !== content) {
        await new Promise((resolve, reject) => {
          issueWrapper.createIssue({
            title: 'Github ticket rules',
            body: content,
          }, (error) => {
            if (error) {
              return reject(error);
            }
            return resolve();
          });
        });
      }
    } catch (err) {
      throw helper.convertGitHubError(err, 'Failed to add wiki rules.');
    }
  } else if (provider === 'gitlab') {
    try {
      const client = new Gitlab({
        url: config.GITLAB_API_BASE_URL,
        oauthToken: userRole.accessToken,
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

  const repoUrls = await dbHelper.populateRepoUrls(dbProject.id);
  const setting = await userService.getUserSetting(body.owner);
  for (const repoUrl of repoUrls) { // eslint-disable-line
    const provider = await helper.getProviderType(repoUrl);
    if (!setting.gitlab && !setting.github) {
      throw new errors.ValidationError(`User ${body.owner} doesn't currently have Topcoder-X access.
      Please have them sign in and set up their Gitlab and Github accounts with Topcoder-X before transferring ownership.`);
    } else if (!setting[provider]) {
      throw new errors.ValidationError(`User ${body.owner} doesn't currently have Topcoder-X access setup for ${provider}.
      Please have them sign in and set up their ${provider} accounts with Topcoder-X before transferring ownership.`);
    }
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
