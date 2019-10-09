/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * Create empty tables for DynamoDB
 *
 * @author TCSCODER
 * @version 1.0
 */

const Path = require('path');
const fs = require('fs');
const dynamoose = require('dynamoose');
const config = require('config');
const logger = require('./utils/logger');
const schemaPath = './dynamodb/models';

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
  update: true,
});

const Table = dynamoose.Table;

fs.readdirSync(schemaPath).forEach((file) => { // eslint-disable-line no-sync
  if (file !== 'index.js') {
    const filename = file.split('.')[0];
    const fileFullPath = Path.join(__dirname + schemaPath.replace('.', ''), filename);
    const schema = require(fileFullPath); // eslint-disable-line global-require
    const table_name = 'Topcoder_X.' + filename
    const table = new Table(table_name, schema, null, dynamoose);
    table.create((err) => {
      if(!err) {
        logger.info(`*** Table ${table_name} has been created ***`);
      } else {
        // if table exists, delete and re-create with empty
        table.delete((err) => {
          if (!err) {
            table.create((err) => {
              if (!err) {
                logger.info(`*** Table ${table_name} has been created ***`);
              } else
              {
                logger.info(`*** Table ${table_name} created failed -- ${err.message} ***`);
              }
            });
          } else {
            logger.info(`*** Delete exist Table ${table_name} failed -- ${err.message} ***`);
          }
        })
      }
    });
  }
});
