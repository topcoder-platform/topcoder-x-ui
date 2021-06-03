/**
 * This defines user to team mapping model for Gitlab.
 */
const dynamoose = require('dynamoose');

const Schema = dynamoose.Schema;

const schema = new Schema({
  id: {
    type: String,
    required: true,
    hashKey: true,
  },
  groupId: {
    type: String,
    required: true,
    index: {
      global: true,
      project: true,
      rangKey: 'gitlabUserId',
      name: 'GroupIdIndex',
    },
  },
  gitlabUserId: {
    type: String,
    required: true
  },
});

module.exports = schema;
