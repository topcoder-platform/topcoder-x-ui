'use strict';

/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 */

/**
 * This module contains the configurations of the app.
 * Changes in 1.1:
 * @author TCSCODER
 * @version 1.1
 */

module.exports = {
  MONGODB_URL: process.env.MONGODB_URL || 'mongodb://heroku_k1wxfs2j:4h8gp5g1v3gcj67rknku4ggaoq@ds125556.mlab.com:25556/heroku_k1wxfs2j',
  COLLECTION_COUNTS: process.env.COLLECTION_COUNTS || 100,
  DYNAMODB: {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'AKIAIX4I6NIIRCHU6C2Q',
    // AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'AKIAJWC5XB77DCERVO4A',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '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',
    // AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'jfzfEbBJ6F+AHW3JM0a4iiVlJKDBiBMDRxKEXdsH',
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    IS_LOCAL: process.env.IS_LOCAL || 'false',
  },
  MIGRATION_DELAY_TIME: 5 * 1000, // 5 sec
  MIGRATION_DELAY_INTERVAL: 50
};
