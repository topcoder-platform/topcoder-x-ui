/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This module contains the schema of a project registered with TC-X.
 *
 * @author TCSCODER
 * @version 1.0
 */

const dynamoose = require('dynamoose');

const Schema = dynamoose.Schema;

const schema = new Schema({
  id: {
    type: String,
    hashKey: true,
    required: true,
  },
  title: {type: String, required: true},
  tcDirectId: {
    type: Number,
    required: true,
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'TcDirectIdIndex',
    },
  },
  repoUrl: {type: String, required: true},
  rocketChatWebhook: {type: String, required: false},
  rocketChatChannelName: {type: String, required: false},
  archived: {type: String, required: true},
  owner: {type: String, required: true},
  secretWebhookKey: {type: String, required: true},
  copilot: {type: String, required: true},
});

module.exports = schema;
