/**
 * Initialize and exports all models.
 */
const Path = require('path');
const fs = require('fs');
const dynamoose = require('dynamoose');
const config = require('../config');

dynamoose.AWS.config.update({
  accessKeyId: config.DYNAMODB.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.DYNAMODB.AWS_SECRET_ACCESS_KEY,
  region: config.DYNAMODB.AWS_REGION,
});

if (config.DYNAMODB.IS_LOCAL === 'true') {
  dynamoose.local();
}

dynamoose.setDefaults({
  create: true,
  update: false,
});

const models = {};

// Bootstrap models
fs.readdirSync(__dirname).forEach((file) => { // eslint-disable-line no-sync
  if (file !== 'index.js') {
    const filename = file.split('.')[0];
    const schema = require(Path.join(__dirname, filename)); // eslint-disable-line global-require
    const model = dynamoose.model(filename, schema);
    models[filename] = model;
  }
});

module.exports = models;
