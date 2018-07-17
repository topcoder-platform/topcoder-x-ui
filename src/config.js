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
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID || '',
  GITLAB_CLIENT_SECRET: process.env.GITLAB_CLIENT_SECRET || '',

  // used as base to construct various URLs
  WEBSITE: process.env.WEBSITE || 'http://topcoderx.topcoder-dev.com',
  GITLAB_API_BASE_URL: process.env.GITLAB_API_BASE_URL || 'https://gitlab.com',
  // kafka configuration
  TOPIC: process.env.TOPIC || 'tc-x-events',
  KAFKA_OPTIONS: {
    connectionString: process.env.KAFKA_HOST || 'localhost:9092',
    ssl: {
      cert: process.env.KAFKA_CLIENT_CERT || fs.readFileSync('./kafka_client.cer'), // eslint-disable-line no-sync
      key: process.env.KAFKA_CLIENT_CERT_KEY || fs.readFileSync('./kafka_client.key'), // eslint-disable-line no-sync
    },
  },
  HOOK_BASE_URL: process.env.HOOK_BASE_URL || 'http://x.topcoder-dev.com',
  TOPCODER_ENV: process.env.TOPCODER_ENV || 'dev',
  LABELS: process.env.LABELS || [{ name: 'Open for pickup', color: '112233' }, { name: 'Assigned', color: '445566' }, { name: 'Ready for review', color: '123123' }, { name: 'Paid', color: '456456' }, { name: 'Feedback', color: 'ff0011' }, { name: 'Fix accepted', color: 'aabb11' }],
  ALLOWED_TOPCODER_ROLES: process.env.ALLOWED_TOPCODER_ROLES || ['administrator', 'admin', 'connect manager', 'connect admin', 'copilot', 'connect copilot'],
};
