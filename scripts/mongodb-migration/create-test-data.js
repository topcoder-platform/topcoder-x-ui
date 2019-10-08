/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This create test data
 *
 * @author TCSCODER
 * @version 1.0
 */


const config = require('config');
const models = require('./mongodb/models');
const logger = require('./utils/logger');
const helper = require('./utils/helper');

const projectIds = [];

/**
 * Create user data
 */
async function createBulkUserData() {
  logger.info('*** create user testing data ***');
  for (let i = 0; i < config.COLLECTION_COUNTS; i += 1) {
    const data = {
      role: 'owner',
      type: i % 2 === 0 ? 'github' : 'gitlab',
      userProviderId:i + 1,
      accessToken: helper.generateIdentifier(),
      accessTokenExpiration: new Date(),
      refreshToken: helper.generateIdentifier(),
      username: `username#${i+1}`,
    };

    const user = new models.User(data);
    await user.save();
  }

}

/**
 * Create usermapping data
 */
async function createBulkUserMappingData() {
  logger.info('*** create usermapping testing data ***');
  for (let i = 0; i < config.COLLECTION_COUNTS; i += 1) {
    const data = {
      topcoderUsername: `topcoderUsername${i+1}`,
      githubUsername: `githubUsername${i+1}`,
      gitlabUsername: `gitlabUsername${i+1}`,
      githubUserId: i + 1,
      gitlabUserId: i + 1,
    };

    const usermapping = new models.UserMapping(data);
    await usermapping.save();
  }
}

/**
 * Create project data
 */
async function createBulkProjectData() {
  logger.info('*** create project testing data ***');
  for (let i = 0; i < config.COLLECTION_COUNTS; i += 1) {
    const data = {
      title: `title#${i}`,
      tcDirectId: i + 1,
      repoUrl: `http://repoUrl${i+1}.com`,
      archived: i % 2 === 0 ?'false' : 'true',
      owner: `username#${i+1}`,
      secretWebhookKey: helper.generateIdentifier(),
      copilot: `username#${i+1}`,
    };

    const project = new models.Project(data);
    await project.save();
    projectIds.push(project.id);
  }
}

/**
 * Create issue data
 */
async function createBulkIssueData() {
  logger.info('*** create issue testing data ***');
  for (let i = 0; i < config.COLLECTION_COUNTS; i += 1) {
    const data = {
      number: i + 1,
      title: `issue title #${i}`,
      body: `This #${i} issue body`,
      prizes: [i+1],
      repositoryId: i + 1,
      labels: ['tcx_Assigned', 'tcx_ReadyForReview'],
      assignee: `assignee#${i}`,
      challengeId: i + 1,
      projectId: projectIds[i % 2 + 1],
      assignedAt: new Date(),
      provider: i % 2 === 0 ? 'github' : 'gitlab',
    };

    const issue = new models.Issue(data);
    await issue.save();
  }
}

/**
 * Create copilotpayment data
 */
async function createBulkCopilotPaymentData() {
  logger.info('*** create copilot payment testing data ***');
  for (let i = 0; i < config.COLLECTION_COUNTS; i += 1) {
    const data = {
      project: projectIds[i % 2 + 1],
      amount: (i + 1) * 20,
      description: `payment description #${i}`,
      challengeId: i + 1,
      closed: i % 2 === 0 ? 'false' : 'true',
      username: `username#${i+1}`,
      status: 'challenge_create_successful',
    };

    const payment = new models.CopilotPayment(data);
    await payment.save();
  }
}

/**
 * Create owner user team data
 */
async function createBulkOwnerUserTeamData() {
  logger.info('*** create OwnerUserTeam testing data ***');
  for (let i = 0; i < config.COLLECTION_COUNTS; i += 1) {
    const data = {
      ownerUsername: `owner username #${i+1}`,
      type: i % 2 === 0 ? 'gitlab' : 'github',
      teamId: `teamId#${i+1}`,
      ownerToken: helper.generateIdentifier(),
      identifier: helper.generateIdentifier(),
    };

    const team = new models.OwnerUserTeam(data);
    await team.save();
  }
}

/**
 * Create owner user group data
 */
async function createBulkOwnerUserGroupData() {
  logger.info('*** create OwnerUserGroup testing data ***');
  for (let i = 0; i < config.COLLECTION_COUNTS; i += 1) {
    const data = {
      ownerUsername: `owner username #${i+1}`,
      type: i % 2 === 0 ? 'gitlab' : 'github',
      groupId: `groupId#${i+1}`,
      identifier: helper.generateIdentifier(),
    };

    const group = new models.OwnerUserGroup(data);
    await group.save();
  }
}

/**
 * Clean mongoDB database
 */
async function cleanup() {
  await models.OwnerUserGroup.remove({});
  await models.OwnerUserTeam.remove({});
  await models.CopilotPayment.remove({});
  await models.Issue.remove({});
  await models.Project.remove({});
  await models.UserMapping.remove({});
  await models.User.remove({});
}

async function start() {
  await cleanup();
  await createBulkUserData();
  await createBulkUserMappingData();
  await createBulkProjectData();
  await createBulkIssueData();
  await createBulkCopilotPaymentData();
  await createBulkOwnerUserTeamData();
  await createBulkOwnerUserGroupData();

  logger.info('create testing data finish!');
  process.exit(0);
}


start();
