/**
 * Initialize and exports all models.
 */
const Path = require('path');
const fs = require('fs');
const dynamoose = require('dynamoose');
const config = require('../config');

const dynamooseConfig = {
    region: config.DYNAMODB.AWS_REGION
}

if (config.DYNAMODB.AWS_ACCESS_KEY_ID) {
    dynamooseConfig.accessKeyId = config.DYNAMODB.AWS_ACCESS_KEY_ID;
    dynamooseConfig.secretAccessKey = config.DYNAMODB.AWS_SECRET_ACCESS_KEY;
}

dynamoose.AWS.config.update(dynamooseConfig);

if (config.DYNAMODB.IS_LOCAL === 'true') {
  dynamoose.local();
}

dynamoose.setDefaults({
  create: false,
  update: false,
});

if (process.env.CREATE_DB) {
  dynamoose.setDefaults({
    create: true,
    update: true,
  });
}

const models = {};

// Bootstrap models
fs.readdirSync(__dirname).forEach((file) => { // eslint-disable-line no-sync
  if (file !== 'index.js') {
    const filename = file.split('.')[0];
    const schema = require(Path.join(__dirname, filename)); // eslint-disable-line global-require
    const model = dynamoose.model('Topcoder_X.' + filename, schema);
    models[filename] = model;
  }
});

models.DynamoDB = dynamoose.ddb();

module.exports = models;
