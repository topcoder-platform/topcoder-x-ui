/**
 * This defines owner user group model. An owner user group is a group to add user to.
 */
const _ = require('lodash');
const dynamoose = require('dynamoose');
const constants = require('../common/constants');

const Schema = dynamoose.Schema;

const schema = new Schema({
  id: {
    type: String,
    hashKey: true,
    required: true,
  },
  ownerUsername: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: _.values(constants.USER_TYPES)
  },
  groupId: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'id',
      project: true,
      name: 'GroupIdIndex',
    },
  },
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
  accessLevel: {
    type: String,
    required: true
  },
  expiredAt: {
    type: String,
    required: false
  }
});


module.exports = schema;
