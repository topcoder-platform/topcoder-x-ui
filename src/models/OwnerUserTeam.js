/**
 * This defines owner user team model. An owner user team is a team to add user to.
 */
const _ = require('lodash');
const mongoose = require('mongoose');
const constants = require('../common/constants');

const Schema = mongoose.Schema;

const schema = new Schema({
  ownerUsername: {type: String, required: true},
  type: {type: String, required: true, enum: _.values(constants.USER_TYPES)},
  teamId: {type: String, required: true},
  ownerToken: {type: String, required: true},
  identifier: {type: String, required: true, unique: true},
});

schema.index({ownerUsername: 1});
schema.index({type: 1});
schema.index({teamId: 1});
schema.index({identifier: 1});

module.exports = schema;
