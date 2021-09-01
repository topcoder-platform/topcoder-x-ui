/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */
'use strict';

/**
 * Schema for project and repository mapping.
 * @author TCSCODER
 * @version 1.0
 */
const dynamoose = require('dynamoose');

const Schema = dynamoose.Schema;

const schema = new Schema({
  id: {
    type: String,
    hashKey: true,
    required: true
  },
  projectId: {
    type: String,
    required: true,
    index: {
      global: true,
      project: true,
      name: 'ProjectIdIndex'
    },
  },
  url: {
    type: String, 
    required: true,
    index: {
      global: true,
      project: true,
      rangKey: 'archived',
      name: 'URLIndex'
    }
  },
  archived: {type: String, required: true},
  repoId: {type: String, required: false},
  registeredWebhookId: {type: String, required: false}
});

module.exports = schema;
