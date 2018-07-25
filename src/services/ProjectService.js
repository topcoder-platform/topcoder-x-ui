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
const gitHubApi = require('octonode');
const Gitlab = require('gitlab/dist/es5').default;
const _ = require('lodash');
const guid = require('guid');
const kafka = require('../utils/kafka');
const helper = require('../common/helper');
const models = require('../models');
const config = require('../config');

const Project = models.Project;
const projectSchema = {
  project: {
    id: Joi.string().required(),
    title: Joi.string().required(),
    tcDirectId: Joi.number().required(),
    repoUrl: Joi.string().required(),
    rocketChatWebhook: Joi.string().allow(null),
    rocketChatChannelName: Joi.string().allow(null),
    archived: Joi.boolean().required(),
    username: Joi.string().required(),
    secretWebhookKey: Joi.string().required(),
  },
  currentUserTopcoderHandle: Joi.string().required(),
};

const createProjectSchema = {
  project: {
    title: Joi.string().required(),
    tcDirectId: Joi.number().required(),
    repoUrl: Joi.string().required(),
    rocketChatWebhook: Joi.string().allow(null),
    rocketChatChannelName: Joi.string().allow(null),
    archived: Joi.boolean().required(),
  },
  currentUserTopcoderHandle: Joi.string().required(),
};

/**
 * creates project
 * @param {Object} project the project detail
 * @param {String} currentUserTopcoderHandle the topcoder handle of current user
 * @returns {Object} created project
 */
async function create(project, currentUserTopcoderHandle) {
  await helper.getProviderType(project.repoUrl);
  /**
     * Uncomment below code to enable the function of raising event when 'project was created'
     *
     * var projectCreateEvent = {
     *  "event":"project created"
     * }
     * await kafka.send(JSON.stringify(JSON.stringify(projectCreateEvent)));
     */
  project.username = currentUserTopcoderHandle;
  project.secretWebhookKey = guid.raw();
  const dbProject = new Project(project);
  return await dbProject.save();
}

create.schema = createProjectSchema;

/**
 * updates project
 * @param {Object} project the project detail
 * @param {String} currentUserTopcoderHandle the topcoder handle of current user
 * @returns {Object} updated project
 */
async function update(project, currentUserTopcoderHandle) {
  await helper.getProviderType(project.repoUrl);
  const dbProject = await helper.ensureExists(Project, project.id);
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
  project.username = currentUserTopcoderHandle;
  Object.entries(project).map((item) => {
    dbProject[item[0]] = item[1];
    return item;
  });
  return await dbProject.save();
}

update.schema = projectSchema;

/**
 * gets all projects
 * @param {String} status the status of project
 * @param {String} currentUserTopcoderHandle the topcoder handle of current user
 * @returns {Array} all projects
 */
async function getAll(status, currentUserTopcoderHandle) {
  if (status === 'archived') {
    return await Project.find({ archived: true, username: currentUserTopcoderHandle });
  }
  return await Project.find({ archived: false, username: currentUserTopcoderHandle });
}

getAll.schema = Joi.object().keys({
  status: Joi.string().required().allow('active', 'archived').default('active'),
  currentUserTopcoderHandle: Joi.string().required(),
});

/**
 * creates label
 * @param {Object} body the request body
 * @param {String} currentUserTopcoderHandle the topcoder handle of current user
 * @returns {Object} result
 */
async function createLabel(body, currentUserTopcoderHandle) {
  const dbProject = await helper.ensureExists(Project, body.projectId);
  if (dbProject.username !== currentUserTopcoderHandle) {
    dbProject.username = currentUserTopcoderHandle;
    await dbProject.save();
  }
  const provider = await helper.getProviderType(dbProject.repoUrl);
  const copilot = await helper.getProjectOwner(models, dbProject, provider);
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
      if (_.chain(err).get('body.errors').countBy({ code: 'already_exists' }).get('true').isUndefined().value()) {
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
  return { success: true };
}

createLabel.schema = Joi.object().keys({
  body: Joi.object().keys({
    projectId: Joi.string().required(),
  }),
  currentUserTopcoderHandle: Joi.string().required(),
});

/**
 * creates hook
 * @param {Object} body the request body
 * @param {String} currentUserTopcoderHandle the topcoder handle of current user
 * @returns {Object} result
 */
async function createHook(body, currentUserTopcoderHandle) {
  const dbProject = await helper.ensureExists(Project, body.projectId);
  if (dbProject.username !== currentUserTopcoderHandle) {
    dbProject.username = currentUserTopcoderHandle;
    await dbProject.save();
  }
  const provider = await helper.getProviderType(dbProject.repoUrl);
  const copilot = await helper.getProjectOwner(models, dbProject, provider);
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
      if (_.chain(err).get('body.errors').countBy({ message: 'Hook already exists on this repository' }).get('true').isUndefined().value()) {
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
  return { success: true }
}

createHook.schema = createLabel.schema;

module.exports = {
  create,
  update,
  getAll,
  createLabel,
  createHook,
};

helper.buildService(module.exports);
