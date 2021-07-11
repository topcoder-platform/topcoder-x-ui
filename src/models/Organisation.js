/**
 * This defines organisation model.
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
  name: {
    type: String,
    required: true,
    index: {
      global: true,
      project: true,
      rangKey: 'id',
      name: 'NameIndex'
    }
  },
  owner: {
    type: String,
    required: true
  },
  personalAccessToken: {
    type: String,
    required: true
  }
});

module.exports = schema;
