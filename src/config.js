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
  WEBSITE: process.env.WEBSITE || 'http://topcoderx.topcoder.com',

  GITHUB_OWNER_CALLBACK_URL: '/api/v1/github/owneruser/callback',
  GITLAB_OWNER_CALLBACK_URL: '/api/v1/gitlab/owneruser/callback',

  OWNER_USER_LOGIN_SUCCESS_URL: '/#/app/settings',
  USER_ADDED_TO_TEAM_SUCCESS_URL: '/#/app/members',

  GITLAB_API_BASE_URL: process.env.GITLAB_API_BASE_URL || 'https://gitlab.com/api/v4',
  TC_LOGIN_URL: process.env.TC_LOGIN_URL || 'https://accounts.topcoder.com/member',
  TC_LOGIN_CALLBACK_URL: '/api/v1/tclogin',
  TC_USER_PROFILE_URL: process.env.TC_USER_PROFILE_URL || 'http://api.topcoder.com/v2/user/profile',

  // kafka configuration
  TOPIC: process.env.TOPIC || 'tc-x-events',
  KAFKA_OPTIONS: {
    kafkaHost: process.env.KAFKA_HOST || 'localhost:9092',
    sslOptions: {
      cert: process.env.KAFKA_CLIENT_CERT || fs.readFileSync('./kafka_client.cer'), // eslint-disable-line no-sync
      key: process.env.KAFKA_CLIENT_CERT_KEY || fs.readFileSync('./kafka_client.key'), // eslint-disable-line no-sync
    },
  },
};
