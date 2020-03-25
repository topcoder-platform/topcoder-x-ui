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
      rangKey: 'id',
      name: 'TopcoderTeamIdIndex',
    },
  },
  githubOrgId: {
    type: String,
    required: true,
    index: {
      global: true,
      project: true,
      rangKey: 'id',
      name: 'GithubOrgIdIndex',
    },
  },
  githubUserName: {
    type: String,
    required: true,
    index: {
      global: true,
      project: true,
      rangKey: 'id',
      name: 'GithubUserNameIndex',
    },
  },
});

module.exports = schema;
