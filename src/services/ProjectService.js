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
const updateProjectSchema = {
  project: {
    id: Joi.string().required(),
    title: Joi.string().required(),
    tcDirectId: Joi.number().required(),
    //NOTE: `PATCH /challenges/:challengeId` requires the tags not empty
    tags: Joi.array().items(Joi.string().required()).min(1).required(),
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
    //NOTE: `PATCH /challenges/:challengeId` requires the tags not empty
    tags: Joi.array().items(Joi.string().required()).min(1).required(),
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
    Repo: ${repoUrl}, Copilot: ${existsInDatabase.copilot}, Owner: ${existsInDatabase.owner}`)
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
  if (dbProject.archived === 'true') {
    throw new errors.ForbiddenError('You can\'t access on this archived project');
  }
  return dbProject;
}

/**
 * create Repository as well as adding git label, hook, wiki
 * or
 * migrate Repository as well as related Issue and CopilotPayment
 * @param {String} repoUrl the repository url
 * @param {Object} project the new project
 * @param {String} currentUser the topcoder current user
 * @returns {Array} challengeUUIDs
 * @private
 */
async function _createOrMigrateRepository(repoUrl, project, currentUser) {
  let oldRepo = await dbHelper.queryOneRepository(repoUrl);
  if (oldRepo) {
    if (oldRepo.projectId === project.id) {
      throw new Error(`This error should never occur: the projectId of the repository to be migrate
        will never equal to the new project id`);
    }
    if (oldRepo.archived === false) {
      throw new Error(`Duplicate active repository should be blocked by _validateProjectData,
        or a time-sequence cornercase encountered here`);
    }
    try {
      const oldIssues = await dbHelper.queryIssueIdChallengeUUIDByRepoUrl(repoUrl);
      const issueIds = oldIssues.map(issue => issue.id);
      const challengeUUIDs = oldIssues.map(issue => issue.challengeUUID).filter(challengeUUID => challengeUUID);
      const paymentIds = await Promise.all(
        challengeUUIDs.map(challengeUUID => dbHelper.queryPaymentIdByChallengeUUID(challengeUUID))
      );

      await dbHelper.update(models.Repository, oldRepo.id, {projectId: project.id, archived: false});
      await Promise.all(issueIds.map(issueId => dbHelper.update(models.Issue, issueId, {projectId: project.id})));
      await Promise.all(
        paymentIds.filter(paymentId => paymentId)
          .map(paymentId => dbHelper.update(models.CopilotPayment, paymentId, {project: project.id}))
      );

      await createHook({projectId: project.id}, currentUser, repoUrl);

      const oldProject = await dbHelper.getById(models.Project, oldRepo.projectId);
      return _.isEqual(oldProject.tags, project.tags) ? [] : challengeUUIDs;
    }
    catch (err) {
      throw new Error(`Update ProjectId for Repository, Issue, CopilotPayment failed. Repo ${repoUrl}. Internal Error: ${err}`);
    }
  } else {
    try {
      await dbHelper.create(models.Repository, {
        id: helper.generateIdentifier(),
        projectId: project.id,
        url: repoUrl,
        archived: project.archived
      })
      await createLabel({projectId: project.id}, currentUser, repoUrl);
      await createHook({projectId: project.id}, currentUser, repoUrl);
      await addWikiRules({projectId: project.id}, currentUser, repoUrl);
    }
    catch (err) {
      throw new Error(`Project created. Adding the webhook, issue labels, and wiki rules failed. Repo ${repoUrl}. Internal Error: ${err}`);
    }
  }

  return [];
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
  project.tags = project.tags.join(',');

  const createdProject = await dbHelper.create(models.Project, project);

  let challengeUUIDsList = [];
  // TODO: The following db operation should/could be moved into one transaction
  for (const repoUrl of repoUrls) { // eslint-disable-line no-restricted-syntax
    try {
      const challengeUUIDs = await _createOrMigrateRepository(repoUrl, project, currentUser);
      if (!_.isEmpty(challengeUUIDs)) {
        challengeUUIDsList.push(challengeUUIDs);
      }
    }
    catch (err) {
      throw new Error(`Create or migrate repository failed. Repo ${repoUrl}. Internal Error: ${err.message}`);
    }
  }

  // NOTE: Will update challenge tags even if the project is created with archived at this step, currently.
  if (!_.isEmpty(challengeUUIDsList)) {
    const projectTagsUpdatedEvent = {
      event: 'challengeTags.update',
      data: {
        challengeUUIDsList,
        tags: project.tags,
      },
    };
    await kafka.send(JSON.stringify(projectTagsUpdatedEvent));
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
  // TODO: remove the useless code-block
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
  project.tags = project.tags.join(',');

  // TODO: move the following logic into one dynamoose transaction
  const repos = await dbHelper.queryRepositoriesByProjectId(project.id);

  let challengeUUIDsList = [];
  for (const repoUrl of repoUrls) { // eslint-disable-line no-restricted-syntax
    if (repos.find(repo => repo.url === repoUrl)) {
      const repoId = repos.find(repo => repo.url === repoUrl).id
      await dbHelper.update(models.Repository, repoId, {archived: project.archived});
      if (!_.isEqual(dbProject.tags, project.tags)) {
        // NOTE: delay query of challengeUUIDs into topcoder-x-processor
        challengeUUIDsList.push(repoUrl);
      }
    } else {
      try {
        const challengeUUIDs = await _createOrMigrateRepository(repoUrl, project, currentUser);
        if (!_.isEmpty(challengeUUIDs)) {
          challengeUUIDsList.push(challengeUUIDs);
        }
      }
      catch (err) {
        throw new Error(`Create or migrate repository failed. Repo ${repoUrl}. Internal Error: ${err.message}`);
      }
    }
  }
  project.updatedAt = new Date();
  const updatedProject = await dbHelper.update(models.Project, project.id, project);

  // NOTE: Will update challenge tags even if the project is changed to archived at this step, currently.
  if (!_.isEmpty(challengeUUIDsList)) {
    const projectTagsUpdatedEvent = {
      event: 'challengeTags.update',
      data: {
        challengeUUIDsList,
        tags: project.tags,
      },
    };
    await kafka.send(JSON.stringify(projectTagsUpdatedEvent));
  }

  return updatedProject;
}

update.schema = updateProjectSchema;

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
    const fetchedProjects = await dbHelper.scanAllWithParams(
      models.Project, condition);
    const projects = _.map(fetchedProjects, (project) => {
      if (!project.updatedAt) {
        project.updatedAt = 0;
      }
      return project;
    });
    const count = projects.length;
    if (!query.lastKey) {
      query.lastKey = 0;
    } else {
      query.lastKey = parseInt(query.lastKey, 10);
    }
    const slicedProjects = _.slice(projects, query.lastKey, query.lastKey + query.perPage);
    for (const project of slicedProjects) { // eslint-disable-line
      project.repoUrls = await dbHelper.populateRepoUrls(project.id);
    }
    const lastKey = query.lastKey + slicedProjects.length;
    return {
      lastKey : lastKey < count ? lastKey : undefined,
      docs: _.orderBy(slicedProjects, ['updatedAt', 'title'], ['desc', 'asc'])
    };
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

  const fetchedProjects = await dbHelper.scanAllWithParams(
    models.Project, filter);
  const projects = _.map(fetchedProjects, (project) => {
    if (!project.updatedAt) {
      project.updatedAt = 0;
    }
    return project;
  });
  const count = projects.length;
  if (!query.lastKey) {
    query.lastKey = 0;
  } else {
    query.lastKey = parseInt(query.lastKey, 10);
  }
  const slicedProjects = _.slice(projects, query.lastKey, query.lastKey + query.perPage);
  for (const project of slicedProjects) { // eslint-disable-line
    project.repoUrls = await dbHelper.populateRepoUrls(project.id);
  }
  const lastKey = query.lastKey + slicedProjects.length;
  return {
    lastKey : lastKey < count ? lastKey : undefined,
    docs: _.orderBy(slicedProjects, ['updatedAt', 'title'], ['desc', 'asc'])
  };
}

getAll.schema = Joi.object().keys({
  query: Joi.object().keys({
    status: Joi.string().required().allow('active', 'archived').default('active'),
    showAll: Joi.bool().optional().default(false),
    perPage: Joi.number().integer().min(1).required(),
    lastKey: Joi.string(),
  }),
  currentUser: currentUserSchema,
});

/**
 * search projects
 * @param {Object} query the query filter object
 * @param {String} currentUser the topcoder current user
 * @returns {Array} all projects
 */
async function search(query, currentUser) {
  const condition = {
    archived: 'false',
  };

  if (query.status === 'archived') {
    condition.archived = 'true';
  }
  // if show all is checked user must be admin
  if (query.showAll && await securityService.isAdminUser(currentUser.roles)) {
    const fetchedProjects = await dbHelper.scanAllWithParams(
      models.Project, condition);
    let projects = _.map(fetchedProjects, (project) => {
      if (!project.updatedAt) {
        project.updatedAt = 0;
      }
      return project;
    });
    projects = _.filter(projects, project => {
      return project.title.toLowerCase().indexOf(query.query.toLowerCase()) !== -1;  // eslint-disable-line lodash/prefer-includes
    });
    for (const project of projects) { // eslint-disable-line
      project.repoUrls = await dbHelper.populateRepoUrls(project.id);
    }  
    return {
      lastKey: (fetchedProjects.lastKey ? JSON.stringify(fetchedProjects.lastKey) : undefined), // eslint-disable-line
      docs: _.orderBy(projects, ['updatedAt', 'title'], ['desc', 'asc'])
    };
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

  const fetchedProjects = await dbHelper.scanAllWithParams(
    models.Project, filter);
  let projects = _.map(fetchedProjects, (project) => {
    if (!project.updatedAt) {
      project.updatedAt = 0;
    }
    return project;
  });
  projects = _.filter(projects, project => {
    return project.title.toLowerCase().indexOf(query.query.toLowerCase()) !== -1;  // eslint-disable-line lodash/prefer-includes
  });
  for (const project of projects) { // eslint-disable-line
    project.repoUrls = await dbHelper.populateRepoUrls(project.id);
  }
  return {
    lastKey: (fetchedProjects.lastKey ? JSON.stringify(fetchedProjects.lastKey) : undefined), // eslint-disable-line
    docs: _.orderBy(projects, ['updatedAt', 'title'], ['desc', 'asc'])
  }
}

search.schema = Joi.object().keys({
  query: Joi.object().keys({
    status: Joi.string().required().allow('active', 'archived').default('active'),
    showAll: Joi.bool().optional().default(false),
    perPage: Joi.number().integer().min(1).required(),
    query: Joi.string().required(),
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
      for (const currentHook of hooks) { // eslint-disable-line no-restricted-syntax
        if (currentHook.id !== parseInt(dbRepo.registeredWebhookId, 10) &&
          currentHook.url === `${config.HOOK_BASE_URL}/webhooks/gitlab`) {
            await client.ProjectHooks.remove(`${repoOwner}/${repoName}`, currentHook.id);
          }
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
  search,
};

helper.buildService(module.exports);
