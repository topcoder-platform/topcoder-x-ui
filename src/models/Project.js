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
  },
  tags: {
    type: 'list',
    list: [{
      type: 'map',
      map: {
        id: {type: String, required: true},
        name: {type: String, required: true},
      },
    }],
    required: true,
    default: [],
    fromDynamo(value) {
      if (value.S) {
        return value.S;
      }
      if (value.L) {
        return value.L.map((item) => {
          if (item.M && item.M.name && item.M.id) {
            return {
              id: item.M.id.S,
              name: item.M.name.S,
            };
          }
          return null;
        });
      }
      return [];
    },
  },
  rocketChatWebhook: {type: String, required: false},
  rocketChatChannelName: {type: String, required: false},
  archived: {type: String, required: true},
  owner: {type: String, required: true},
  secretWebhookKey: {type: String, required: true},
  copilot: {type: String, required: false},
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createCopilotPayments: {type: String, required: false},
  isConnect: {type: Boolean, required: false, default: true},
});

module.exports = schema;
