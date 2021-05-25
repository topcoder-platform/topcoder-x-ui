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
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  // MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/topcoderx',
  SESSION_SECRET: process.env.SESSION_SECRET || 'kjsdfkj34857',
  // Github and gitlab client id and secret
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID,
  GITLAB_CLIENT_SECRET: process.env.GITLAB_CLIENT_SECRET,

  // used as base to construct various URLs
  WEBSITE: process.env.WEBSITE || 'http://topcoderx.topcoder-dev.com',
  GITLAB_API_BASE_URL: process.env.GITLAB_API_BASE_URL || 'https://gitlab.com',

  // kafka configuration
  TOPIC: process.env.TOPIC || 'tc-x-events',
  KAFKA_OPTIONS: {
    connectionString: process.env.KAFKA_URL || 'localhost:9092',
    ssl: {
      cert: process.env.KAFKA_CLIENT_CERT || fs.readFileSync('./kafka_client.cer'), // eslint-disable-line no-sync
      key: process.env.KAFKA_CLIENT_CERT_KEY || fs.readFileSync('./kafka_client.key'), // eslint-disable-line no-sync
      passphrase: 'secret', // NOTE:* This configuration specifies the private key passphrase used while creating it.
    },
  },
  HOOK_BASE_URL: process.env.HOOK_BASE_URL || 'http://topcoderx.topcoder-dev.com',
  TOPCODER_ENV: process.env.TOPCODER_ENV || 'dev',
  LABELS: process.env.LABELS || [
    {name: 'tcx_OpenForPickup', color: '428BCA'},
    {name: 'tcx_Assigned', color: '004E00'},
    {name: 'tcx_ReadyForReview', color: 'D1D100'},
    {name: 'tcx_Paid', color: '7F8C8D'},
    {name: 'tcx_Feedback', color: 'FF0000'},
    {name: 'tcx_FixAccepted', color: '69D100'},
    {name: 'tcx_NotReady', color: '000000'},
    {name: 'tcx_Canceled', color: '000000'},
  ],
  OPEN_FOR_PICKUP_ISSUE_LABEL: process.env.OPEN_FOR_PICKUP_ISSUE_LABEL || 'tcx_OpenForPickup',
  ALLOWED_TOPCODER_ROLES: process.env.ALLOWED_TOPCODER_ROLES || ['administrator', 'admin', 'connect manager', 'connect admin', 'copilot', 'connect copilot'],
  COPILOT_ROLE: process.env.COPILOT_ROLE || 'copilot',
  ADMINISTRATOR_ROLES: process.env.ADMINISTRATOR_ROLES || ['administrator', 'admin'],
  DYNAMODB: {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    IS_LOCAL: process.env.IS_LOCAL,
    TIMEOUT: process.env.AWS_CONNECTION_TIMEOUT || 10000, // eslint-disable-line no-magic-numbers
  },
  TOPCODER_VALUES: {
    dev: {
      TC_LOGIN_URL: process.env.TC_LOGIN_URL || 'https://accounts-auth0.topcoder-dev.com/',
    },
    prod: {
      TC_LOGIN_URL: process.env.TC_LOGIN_URL || 'https://accounts.topcoder.com/member',
    },
  },
  DYNAMODB_WAIT_TABLE_FOR_ACTIVE_TIMEOUT: process.env.DYNAMODB_WAIT_TABLE_FOR_ACTIVE_TIMEOUT || 1000 * 60 * 10 // eslint-disable-line no-magic-numbers
};

module.exports.frontendConfigs = {
  copilotRole: module.exports.COPILOT_ROLE,
  administratorRoles: module.exports.ADMINISTRATOR_ROLES,
  helpLink: process.env.HELP_LINK || 'https://github.com/topcoder-platform/topcoder-x-ui/wiki',
  JWT_V3_NAME: process.env.JWT_V3_NAME || 'v3jwt',
  JWT_V2_NAME: process.env.JWT_V2_NAME || 'tcjwt',
  COOKIES_SECURE: process.env.COOKIES_SECURE || false,
  TC_LOGIN_URL: process.env.TC_LOGIN_URL || 'https://accounts-auth0.topcoder-dev.com/',
  ADMIN_TOOL_URL: process.env.ADMIN_TOOL_URL || 'https://api.topcoder-dev.com/v2',
  ACCOUNTS_CONNECTOR_URL: process.env.ACCOUNTS_CONNECTOR_URL || 'https://accounts.topcoder-dev.com/connector.html',
  CONNECT_URL_BASE: process.env.CONNECT_URL_BASE || 'https://connect.topcoder-dev.com/projects/',
  OWNER_LOGIN_GITHUB_URL: process.env.OWNER_LOGIN_GITHUB_URL || '/api/v1/github/owneruser/login',
  OWNER_LOGIN_GITLAB_URL: process.env.OWNER_LOGIN_GITLAB_URL || '/api/v1/gitlab/owneruser/login',
  TOPCODER_URL: process.env.TOPCODER_URL || 'https://topcoder-dev.com',
  GITHUB_TEAM_URL: process.env.GITHUB_TEAM_URL || 'https://github.com/orgs/',
  GITLAB_GROUP_URL: process.env.GITLAB_GROUP_URL || 'https://gitlab.com/groups/',
};
