/**
 * This defines user to team mapping model for Github.
 */
const dynamoose = require('dynamoose');

const Schema = dynamoose.Schema;

const schema = new Schema({
  id: {
    type: String,
    required: true,
    hashKey: true,
  },
  teamId: {
    type: String,
    required: true,
    index: {
      global: true,
      project: true,
      rangKey: 'githubUserName',
      name: 'TopcoderTeamIdIndex',
    },
  },
  githubOrgId: {
    type: String,
    required: false
  },
  githubUserName: {
    type: String,
    required: false
  }
});

module.exports = schema;
