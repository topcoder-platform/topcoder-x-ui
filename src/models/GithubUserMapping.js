/**
 * This defines github user mapping model.
 */
'use strict';

const dynamoose = require('dynamoose');

const Schema = dynamoose.Schema;

const schema = new Schema({
  id: {
    type: String,
    required: true,
    hashKey: true
  },
  topcoderUsername: {
    type: String,
    required: true,
    index: {
      global: true,
      project: true,
      rangKey: 'id',
      name: 'TopcoderUsernameIndex'
    }
  },
  githubUsername: {
    type: String,
    index: {
      global: true,
      project: true,
      rangKey: 'id',
      name: 'GithubUsernameIndex'
    }
  },
  githubUserId: {
    type: Number,
    index: {
      global: true,
      project: true,
      rangKey: 'id',
      name: 'GithubUserIdIndex'
    }
  }
});

module.exports = schema;
