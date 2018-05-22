/**
 * This defines owner user group model. An owner user group is a group to add user to.
 */
const _ = require('lodash');
const mongoose = require('mongoose');
const constants = require('../common/constants');

const Schema = mongoose.Schema;

const schema = new Schema({
  ownerUsername: {type: String, required: true},
  type: {type: String, required: true, enum: _.values(constants.USER_TYPES)},
  groupId: {type: String, required: true},
  identifier: {type: String, required: true, unique: true},
});

schema.index({ownerUsername: 1});
schema.index({type: 1});
schema.index({groupId: 1});
schema.index({identifier: 1});

module.exports = schema;
