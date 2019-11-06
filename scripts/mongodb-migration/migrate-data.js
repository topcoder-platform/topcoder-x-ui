/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * Migrate data to dynamodb
 *
 * @author TCSCODER
 * @version 1.0
 */
const fs = require('fs');
const mongoModels = require('./mongodb/models');
const dynamoModels = require('./dynamodb/models');
const logger = require('./utils/logger');
const dynamoDBHelper = require('./dynamodb/db-helper');
const helper = require('./utils/helper');
const config = require('config');

const projectIdMapping = {};

/**
 * Wait to avoid throughput errors from DynamoDB
 */
async function waitSomeTime() {
  await new Promise((resolve, reject) => {
    setTimeout(() => resolve(), config.MIGRATION_DELAY_TIME);
  });
}

/**
 * Save data on a backup JSON file
 * @param {String} model the model name
 * @param {Object|Array} data The data to save
 */
async function saveBackup(model, data) {
  await fs.writeFile(`${__dirname}/backups/${model}.json`, JSON.stringify(data, null, 2));
}

let countRequests = 0;

/**
 * Migrate user data
 */
async function migrateUserData() {
  logger.info('*** migrate user data ***');
  const list = await mongoModels.User.find({});
  await saveBackup('User', list);
  for(const user of list) {
    if (countRequests === config.MIGRATION_DELAY_INTERVAL) {
      await waitSomeTime();
      countRequests = 0;
    }
    countRequests++;
    const data = user.toObject();
    data.id = helper.generateIdentifier();
    delete data._id;
    delete data.__v;
    await dynamoDBHelper.create(dynamoModels.User, data);
  }
}

/**
 * Migrate user mapping data
 */
async function migrateUserMappingData() {
  logger.info('*** migrate user mapping data ***');
  const list = await mongoModels.UserMapping.find({});
  await saveBackup('UserMapping', list);
  for(const mapping of list) {
    if (countRequests === config.MIGRATION_DELAY_INTERVAL) {
      await waitSomeTime();
      countRequests = 0;
    }
    countRequests++;
    const data = mapping.toObject();
    data.id = helper.generateIdentifier();
    delete data._id;
    delete data.__v;
    await dynamoDBHelper.create(dynamoModels.UserMapping, data);
  }
}

async function migrateProjectData() {
  logger.info('*** migrate project data ***');
  const list = await mongoModels.Project.find({});
  await saveBackup('Project', list);
  for(const project of list) {
    if (countRequests === config.MIGRATION_DELAY_INTERVAL) {
      await waitSomeTime();
      countRequests = 0;
    }
    countRequests++;
    const data = project.toObject();
    data.id = helper.generateIdentifier();
    projectIdMapping[data._id.toString()] = data.id;
    delete data._id;
    delete data.__v;
    await dynamoDBHelper.create(dynamoModels.Project, data);
  }
}

/**
 * Migrate issue data
 */
async function migrateIssueData() {
  logger.info('*** migrate issue data ***');
  const labelsToIgnore = [
    'Paid',
    'tcx_Paid',
    'tcx_OutOfScope'
  ]
  const list = await mongoModels.Issue.find({
    labels: {
      $nin: labelsToIgnore
    }
  });
  await saveBackup('Issue', list);
  for(const issue of list) {
    if (countRequests === config.MIGRATION_DELAY_INTERVAL) {
      await waitSomeTime();
      countRequests = 0;
    }
    countRequests++;
    const data = issue.toObject();
    data.id = helper.generateIdentifier();
    data.projectId = projectIdMapping[data.projectId.toString()];
    delete data._id;
    delete data.__v;
    await dynamoDBHelper.create(dynamoModels.Issue, data);
  }
}

/**
 * Migrate copilot payment data
 */
async function migrateCopilotPaymentData() {
  logger.info('*** migrate copilot payments data ***');
  const list = await mongoModels.CopilotPayment.find({});
  await saveBackup('CopilotPayment', list);
  for(const payment of list) {
    if (countRequests === config.MIGRATION_DELAY_INTERVAL) {
      await waitSomeTime();
      countRequests = 0;
    }
    countRequests++;
    const data = payment.toObject();
    data.id = helper.generateIdentifier();
    data.project = projectIdMapping[data.project.toString()];
    delete data._id;
    delete data.__v;
    await dynamoDBHelper.create(dynamoModels.CopilotPayment, data);
  }
}

/**
 * Migrate owner user team data
 */
async function migrateOwnerUserTeamData() {
  logger.info('*** migrate owner user team data ***');
  const list = await mongoModels.OwnerUserTeam.find({});
  await saveBackup('OwnerUserTeam', list);
  for(const team of list) {
    if (countRequests === config.MIGRATION_DELAY_INTERVAL) {
      await waitSomeTime();
      countRequests = 0;
    }
    countRequests++;
    const data = team.toObject();
    data.id = helper.generateIdentifier();
    delete data._id;
    delete data.__v;
    await dynamoDBHelper.create(dynamoModels.OwnerUserTeam, data);
  }
}

/**
 * Migrate owner user group data
 */
async function migrateOwnerUserGroupData() {
  logger.info('*** migrate owner user group data ***');
  const list = await mongoModels.OwnerUserGroup.find({});
  await saveBackup('OwnerUserGroup', list);
  for(const group of list) {
    if (countRequests === config.MIGRATION_DELAY_INTERVAL) {
      await waitSomeTime();
      countRequests = 0;
    }
    countRequests++;
    const data = group.toObject();
    data.id = helper.generateIdentifier();
    delete data._id;
    delete data.__v;
    await dynamoDBHelper.create(dynamoModels.OwnerUserGroup, data);
  }
}

/**
 * Clean dynamoDB database
 */
async function cleanup() {
  logger.info('*** Started cleanup ***');

  logger.info('*** cleaning up data from groups ***');
  const groups = await dynamoDBHelper.scan(dynamoModels.OwnerUserGroup);
  await dynamoDBHelper.removeAll(dynamoModels.OwnerUserGroup, groups);

  logger.info('*** cleaning up data from teams ***');
  const teams = await dynamoDBHelper.scan(dynamoModels.OwnerUserTeam);
  await dynamoDBHelper.removeAll(dynamoModels.OwnerUserTeam, teams);

  logger.info('*** cleaning up data from payments ***');
  const payments = await dynamoDBHelper.scan(dynamoModels.CopilotPayment);
  await dynamoDBHelper.removeAll(dynamoModels.CopilotPayment, payments);

  logger.info('*** cleaning up data from issues ***');
  const issues = await dynamoDBHelper.scan(dynamoModels.Issue);
  await dynamoDBHelper.removeAll(dynamoModels.Issue, issues);

  logger.info('*** cleaning up data from projects ***');
  const projects = await dynamoDBHelper.scan(dynamoModels.Project);
  await dynamoDBHelper.removeAll(dynamoModels.Project, projects);

  logger.info('*** cleaning up data from mappings ***');
  const mappings = await dynamoDBHelper.scan(dynamoModels.UserMapping);
  await dynamoDBHelper.removeAll(dynamoModels.UserMapping, mappings);

  logger.info('*** cleaning up data from users ***');
  const users = await dynamoDBHelper.scan(dynamoModels.User);
  await dynamoDBHelper.removeAll(dynamoModels.User, users);
}

async function start() {
  await cleanup();
  await migrateUserData();
  await migrateUserMappingData();
  await migrateProjectData();
  await migrateIssueData();
  await migrateCopilotPaymentData();
  await migrateOwnerUserTeamData();
  await migrateOwnerUserGroupData();

  logger.info('migrate data finish!');
  process.exit(0);
}

start();
