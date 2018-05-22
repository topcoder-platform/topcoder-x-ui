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
const gitLabAPI = require('node-gitlab-api');
const guid = require('guid');
const kafka = require('../utils/kafka');
const helper = require('../common/helper');
const errors = require('../common/errors');
const Project = require('../models').Project;

const projectSchema = {
  project: {
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
    username: Joi.string().required()
  }
};

/**
 * creates project
 * @param {Object} project the project detail
 * @returns {Object} created project
 */
async function create(project) {
  let dbProject = await Project.findOne({
    tcDirectId: project.tcDirectId
  });
  if (dbProject) {
    throw new errors.ValidationError(`Project already exists ${project.tcDirectId}`);
  }
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
  dbProject = new Project(project);
  return await dbProject.save();
}

create.schema = createProjectSchema;

/**
 * updates project
 * @param {Object} project the project detail
 * @returns {Object} updated project
 */
async function update(project) {
  const dbProject = await Project.findOne({
    tcDirectId: project.tcDirectId
  });
  if (!dbProject) {
    throw new errors.NotFoundError(`Project doesn't exist ${project.tcDirectId}`);
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
 */
async function createLabel(body) {
  if (body.repoType === 'github') {
    const client = gitHubApi.client(body.repoToken);
    const ghrepo = client.repo(`${body.repoOwner}/${body.repoName}`);
    await ghrepo.label({
      name: body.label,
      description: body.description,
      color: body.color,
    });
  } else {
    const client = gitLabAPI({
      url: 'https://gitlab.com',
      oauthToken: body.repoToken,
    });
    await client.projects.labels.create(`${body.repoOwner}/${body.repoName}`, {
      name: body.label,
      color: `#${body.color}`,
      description: body.description,
    });
  }
}

createLabel.schema = Joi.object().keys({
  repoType: Joi.string().required(),
  repoToken: Joi.string().required(),
  repoOwner: Joi.string().required(),
  repoName: Joi.string().required(),
  label: Joi.string().required(),
  description: Joi.string().required(),
  color: Joi.string().required(),
  baseUrl: Joi.string().required(),
});

/**
 * creates hook
 * @param {Object} body the request body
 */
async function createHook(body) {
  const projectDetail = await helper.ensureExists(Project, body.challengeId);
  if (body.repoType === 'github') {
    const client = gitHubApi.client(body.repoToken);
    const ghrepo = client.repo(`${body.repoOwner}/${body.repoName}`);
    await ghrepo.hook({
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
        url: `${body.baseUrl}/webhooks/github`,
        content_type: 'json',
        secret: projectDetail.secretWebhookKey,
      },
    });
  } else {
    const client = gitLabAPI({
      url: 'https://gitlab.com',
      oauthToken: body.repoToken,
    });
    await client.projects.hooks.add(`${body.repoOwner}/${body.repoName}`,
      `${body.baseUrl}/webhooks/gitlab`, {
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
  }
}

createHook.schema = Joi.object().keys({
  challengeId: Joi.string().required(),
  repoType: Joi.string().required(),
  repoOwner: Joi.string().required(),
  repoToken: Joi.string().required(),
  repoName: Joi.string().required(),
  baseUrl: Joi.string().required(),
});

module.exports = {
  create,
  update,
  getAll,
  createLabel,
  createHook,
};

helper.buildService(module.exports);
