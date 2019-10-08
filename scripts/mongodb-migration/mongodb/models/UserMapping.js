/**
 * This defines user mapping model.
 */
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schema = new Schema({
  topcoderUsername: {type: String, required: true, unique: true},
  githubUsername: String,
  gitlabUsername: String,
  githubUserId: Number,
  gitlabUserId: Number,
});

schema.index({topcoderUsername: 1}, {unique: true});

module.exports = schema;
