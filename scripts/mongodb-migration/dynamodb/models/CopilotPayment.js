/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This module contains the schema of copilot payment with TC-X.
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
  project: {
    type: String,
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'ProjectIndex',
    },
  },
  amount: {type: Number, required: true},
  description: {type: String, required: true},
  challengeId: {
    type: Number,
    required: false,
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'ChallengeIdIndex',
    },
  },
  closed: {
    type: String,
    required: true,
    default: 'false',
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'ClosedIndex',
    },
  },
  username: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'UsernameIndex',
    },
  },
  status: {
    type: String,
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'StatusIndex',
    },
  },
});

module.exports = schema;
