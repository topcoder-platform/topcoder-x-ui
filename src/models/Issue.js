/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * This module contains the schema of a issue with TC-X.
 * @author TCSCODER
 * @version 1.0
 */
const dynamoose = require('dynamoose');

const Schema = dynamoose.Schema;

const schema = new Schema({
  id: {type: String, hashKey: true, required: true},
  // From the receiver service
  number: {
    type: Number,
    required: true,
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'NumberIndex',
    },
  },
  title: {type: String, required: true},
  body: {type: String},
  prizes: {type: [Number], required: true}, // extracted from title
  provider: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'ProviderIndex',
    },
  }, // github or gitlab
  repositoryId: {
    type: Number,
    required: true,
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'RepositoryIdIndex',
    },
  },
  labels: {
    type: Array,
    required: false,
  },
  assignee: {type: String, required: false},
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // From topcoder api
  challengeId: {type: Number, required: false},
  projectId: {type: String},
  status: {type: String},
  assignedAt: {type: Date, required: false},
});

module.exports = schema;
