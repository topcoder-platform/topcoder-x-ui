/**
 * This defines user mapping model.
 */
const dynamoose = require('dynamoose');

const Schema = dynamoose.Schema;

const schema = new Schema({
  id: {
    type: String,
    required: true,
    hashKey: true,
  },
  topcoderUsername: {
    type: String,
    required: true,
    index: {
      global: true,
      project: true,
      rangKey: 'id',
      name: 'TopcoderUsernameIndex',
    },
  },
  githubUsername: String,
  gitlabUsername: String,
  githubUserId: Number,
  gitlabUserId: Number,
});

module.exports = schema;
