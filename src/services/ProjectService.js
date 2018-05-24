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
const Project = require('../models').Project;
const config = require('../config');

const projectSchema = {
  project: {
    id: Joi.string().required(),
    title: Joi.string().required(),
    tcDirectId: Joi.number().required(),
    repoUrl: Joi.string().required(),
    rocketChatWebhook: Joi.string().required(),
    rocketChatChannelName: Joi.string().required(),
    archived: Joi.boolean().required(),
    username: Joi.string().required(),
    secretWebhookKey: Joi.string().required()
  }
};

const createProjectSchema = {
  project: {
    title: Joi.string().required(),
    tcDirectId: Joi.number().required(),
    repoUrl: Joi.string().required(),
    rocketChatWebhook: Joi.string().required(),
    rocketChatChannelName: Joi.string().required(),
    archived: Joi.boolean().required(),
    username: Joi.string().required(),
  }
};

/**
 * creates project
 * @param {Object} project the project detail
 * @returns {Object} created project
 */
async function create(project) {
  /**
     * Uncomment below code to enable the function of raising event when 'project was created'
     *
     * var projectCreateEvent = {
     *  "event":"project created"
     * }
     * await kafka.send(JSON.stringify(JSON.stringify(projectCreateEvent)));
     */
  project.username = project.username.toLowerCase();
  project.secretWebhookKey = guid.raw();
  const dbProject = new Project(project);
  return await dbProject.save();
}

create.schema = createProjectSchema;

/**
 * updates project
 * @param {Object} project the project detail
 * @returns {Object} updated project
 */
async function update(project) {
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
  project.username = project.username.toLowerCase();
  Object.entries(project).map((item) => {
    dbProject[item[0]] = item[1];
    return item;
  });
  return await dbProject.save();
}

update.schema = projectSchema;

/**
 * gets all projects
 * @returns {Array} all projects
 */
async function getAll() {
  return await Project.find({});
}

/**
 * creates label
 * @param {Object} body the request body
 * @returns {Object} result
 */
async function createLabel(body) {
  if (body.repoType === 'github') {
    try {
      const client = gitHubApi.client(body.repoToken);
      const ghrepo = client.repo(`${body.repoOwner}/${body.repoName}`);
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
        oauthToken: body.repoToken,
      });
      await Promise.all(config.LABELS.map(async (label) => {
        await client.Labels.create(`${body.repoOwner}/${body.repoName}`, {
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
    repoType: Joi.string().required(),
    repoToken: Joi.string().required(),
    repoOwner: Joi.string().required(),
    repoName: Joi.string().required(),
  }),
});

/**
 * creates hook
 * @param {Object} body the request body
 * @returns {Object} result
 */
async function createHook(body) {
  const projectDetail = await helper.ensureExists(Project, body.projectId);
  if (body.repoType === 'github') {
    try {
      const client = gitHubApi.client(body.repoToken);
      const ghrepo = client.repo(`${body.repoOwner}/${body.repoName}`);
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
            secret: projectDetail.secretWebhookKey,
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
        oauthToken: body.repoToken,
      });
      await client.ProjectHooks.add(`${body.repoOwner}/${body.repoName}`,
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
          token: projectDetail.secretWebhookKey,
        }
      );
    } catch (err) {
      throw helper.convertGitLabError(err, 'Failed to create webhook.');
    }
  }
  return { success: true }
}

createHook.schema = Joi.object().keys({
  body: Joi.object().keys({
    projectId: Joi.string().required(),
    repoType: Joi.string().required(),
    repoOwner: Joi.string().required(),
    repoToken: Joi.string().required(),
    repoName: Joi.string().required(),
  }),
});

module.exports = {
  create,
  update,
  getAll,
  createLabel,
  createHook,
};

helper.buildService(module.exports);
