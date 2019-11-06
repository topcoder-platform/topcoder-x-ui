/**
 * This defines owner user team model. An owner user team is a team to add user to.
 */
const _ = require('lodash');
const dynamoose = require('dynamoose');
const constants = require('../../constants');

const Schema = dynamoose.Schema;

const schema = new Schema({
  id: {
    type: String,
    hashKey: true,
    required: true,
  },
  ownerUsername: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'OwnerUsernameIndex',
    },
  },
  type: {
    type: String,
    required: true,
    enum: _.values(constants.USER_TYPES),
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'TypeIndex',
    },
  },
  teamId: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'TeamIdIndex',
    },
  },
  ownerToken: {type: String, required: true},
  identifier: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'IdentifierIndex',
    },
  },
});

module.exports = schema;
