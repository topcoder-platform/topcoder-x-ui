/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */
const fs = require('fs');
/**
 * Define config.
 *
 * @author TCSCODER
 * @version 1.0
 */
module.exports = {
  PORT: process.env.PORT || 80, // eslint-disable-line no-magic-numbers
  API_VERSION: process.env.API_VERSION || 'v1',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/topcoderx',
  SESSION_SECRET: process.env.SESSION_SECRET || 'kjsdfkj34857',
  // Github and gitlab client id and secret
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '2ff38c01886428c6d5de',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '863105ac658fa63c7154ece28a9af8ce4f61c605',
  GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID || '721c2e0f6f39a5aed3ea55b895320a93f2719c4bc2d8927a11120f14407a3656',
  GITLAB_CLIENT_SECRET: process.env.GITLAB_CLIENT_SECRET || '467eeb05e2e4ac8efb5bec8124c1d252b6f74a8d28098f189b6acc4106570cae',

  // used as base to construct various URLs
  WEBSITE: process.env.WEBSITE || 'http://topcoderx.topcoder-dev.com',
  GITLAB_API_BASE_URL: process.env.GITLAB_API_BASE_URL || 'https://gitlab.com',
  // kafka configuration
  TOPIC: process.env.TOPIC || 'tc-x-events',
  KAFKA_OPTIONS: {
    kafkaHost: process.env.KAFKA_HOST || 'localhost:9092',
    sslOptions: {
      cert: process.env.KAFKA_CLIENT_CERT || fs.readFileSync('./kafka_client.cer'), // eslint-disable-line no-sync
      key: process.env.KAFKA_CLIENT_CERT_KEY || fs.readFileSync('./kafka_client.key'), // eslint-disable-line no-sync
    },
  },
  HOOK_BASE_URL: process.env.HOOK_BASE_URL || 'http://x.topcoder-dev.com/',
  TOPCODER_ENV: process.env.TOPCODER_ENV || 'dev',
  LABELS: process.env.LABELS || [{ name: 'Open for pickup', color: '112233' }, { name: 'Assigned', color: '445566' }, { name: 'Ready for review', color: '123123' }, { name: 'Paid', color: '456456' }, { name: 'Feedback', color: 'ff0011' }, { name: 'Fix accepted', color: 'aabb11' },]
};
