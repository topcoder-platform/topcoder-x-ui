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
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || ' ',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || ' ',
  GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID || ' ',
  GITLAB_CLIENT_SECRET: process.env.GITLAB_CLIENT_SECRET || ' ',

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
  HELP_LINK: process.env.HELP_LINK || 'https://github.com/topcoder-platform/topcoder-x-ui/wiki',
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
      TC_LOGIN_URL: process.env.TC_LOGIN_URL || 'https://accounts.topcoder-dev.com/member',
      TC_USER_PROFILE_URL: process.env.TC_USER_PROFILE_URL || 'https://api.topcoder-dev.com/v2/user/profile',
    },
    prod: {
      TC_LOGIN_URL: process.env.TC_LOGIN_URL || 'https://accounts.topcoder.com/member',
      TC_USER_PROFILE_URL: process.env.TC_USER_PROFILE_URL || 'https://api.topcoder.com/v2/user/profile',
    },
  },
};

const frontendConfigs = {
  "local":{
      "JWT_V3_NAME":"v3jwt",
      "JWT_V2_NAME":"tcjwt",
      "COOKIES_SECURE":false,
      "TC_LOGIN_URL": "https://accounts.topcoder-dev.com/member",
      "TC_USER_PROFILE_URL": "http://api.topcoder-dev.com/v2/user/profile",
      "API_URL": "https://127.0.0.1:8443",
      "ADMIN_TOOL_URL": "http://localhost:8080/api/v2",
      "ACCOUNTS_CONNECTOR_URL": "https://accounts.topcoder-dev.com/connector.html",
      "DIRECT_URL_BASE": "https://www.topcoder-dev/direct/projectOverview?formData.projectId=",
      "OWNER_LOGIN_GITHUB_URL":"/api/v1/github/owneruser/login",
      "OWNER_LOGIN_GITLAB_URL":"/api/v1/gitlab/owneruser/login",
      "TOPCODER_URL": "https://topcoder-dev.com",
      "GITHUB_TEAM_URL": "https://github.com/orgs/",
      "GITLAB_GROUP_URL": "https://gitlab.com/groups/"

  },
  "heroku":{
      "JWT_V3_NAME":"v3jwt",
      "JWT_V2_NAME":"tcjwt",
      "COOKIES_SECURE":false,
      "TC_LOGIN_URL": "https://accounts.topcoder-dev.com/member",
      "TC_USER_PROFILE_URL": "https://api.topcoder-dev.com/v2/user/profile",
      "API_URL": "https://api.topcoder-dev.com",
      "ADMIN_TOOL_URL": "https://api.topcoder-dev.com/v2",
      "ACCOUNTS_CONNECTOR_URL": "https://accounts.topcoder-dev.com/connector.html",
      "DIRECT_URL_BASE": "https://www.topcoder-dev.com/direct/projectOverview?formData.projectId=",
      "OWNER_LOGIN_GITHUB_URL":"/api/v1/github/owneruser/login",
      "OWNER_LOGIN_GITLAB_URL":"/api/v1/gitlab/owneruser/login",
      "TOPCODER_URL": "https://topcoder-dev.com",
      "GITHUB_TEAM_URL": "https://github.com/orgs/",
      "GITLAB_GROUP_URL": "https://gitlab.com/groups/"
  },
  "dev":{
      "JWT_V3_NAME":"v3jwt",
      "JWT_V2_NAME":"tcjwt",
      "COOKIES_SECURE":false,
      "TC_LOGIN_URL": "https://accounts.topcoder-dev.com/member",
      "TC_USER_PROFILE_URL": "https://api.topcoder-dev.com/v2/user/profile",
      "API_URL": "https://api.topcoder-dev.com",
      "ADMIN_TOOL_URL": "https://api.topcoder-dev.com/v2",
      "ACCOUNTS_CONNECTOR_URL": "https://accounts.topcoder-dev.com/connector.html",
      "DIRECT_URL_BASE": "https://www.topcoder-dev.com/direct/projectOverview?formData.projectId=",
      "OWNER_LOGIN_GITHUB_URL":"/api/v1/github/owneruser/login",
      "OWNER_LOGIN_GITLAB_URL":"/api/v1/gitlab/owneruser/login",
      "TOPCODER_URL": "https://topcoder-dev.com",
      "GITHUB_TEAM_URL": "https://github.com/orgs/",
      "GITLAB_GROUP_URL": "https://gitlab.com/groups/"
  },
  "qa":{
      "JWT_V3_NAME":"v3jwt",
      "JWT_V2_NAME":"tcjwt",
      "COOKIES_SECURE":false,
      "TC_LOGIN_URL": "https://accounts.topcoder-dev.com/member",
      "TC_USER_PROFILE_URL": "https://api.topcoder-dev.com/v2/user/profile",
      "API_URL": "https://api.topcoder-qa.com",
      "ADMIN_TOOL_URL": "https://api.topcoder-qa.com/v2",
      "ACCOUNTS_CONNECTOR_URL": "https://accounts.topcoder-qa.com/connector.html",
      "DIRECT_URL_BASE": "https://www.topcoder-dev.com/direct/projectOverview?formData.projectId=",
      "OWNER_LOGIN_GITHUB_URL":"/api/v1/github/owneruser/login",
      "OWNER_LOGIN_GITLAB_URL":"/api/v1/gitlab/owneruser/login",
      "TOPCODER_URL": "https://topcoder-dev.com",
      "GITHUB_TEAM_URL": "https://github.com/orgs/",
      "GITLAB_GROUP_URL": "https://gitlab.com/groups/"
  },
  "prod":{
      "JWT_V3_NAME":"v3jwt",
      "JWT_V2_NAME":"tcjwt",
      "COOKIES_SECURE":false,
      "TC_LOGIN_URL": "https://accounts.topcoder.com/member",
      "TC_USER_PROFILE_URL": "https://api.topcoder.com/v2/user/profile",
      "API_URL": "https://api.topcoder.com",
      "ADMIN_TOOL_URL": "https://api.topcoder.com/v2",
      "ACCOUNTS_CONNECTOR_URL": "https://accounts.topcoder.com/connector.html",
      "DIRECT_URL_BASE": "https://www.topcoder.com/direct/projectOverview?formData.projectId=",
      "OWNER_LOGIN_GITHUB_URL":"/api/v1/github/owneruser/login",
      "OWNER_LOGIN_GITLAB_URL":"/api/v1/gitlab/owneruser/login",
      "TOPCODER_URL": "https://topcoder-dev.com",
      "GITHUB_TEAM_URL": "https://github.com/orgs/",
      "GITLAB_GROUP_URL": "https://gitlab.com/groups/"
  }
};

const activeEnv = module.exports.TOPCODER_ENV;
module.exports.frontendConfigs = {
  helpLink: module.exports.HELP_LINK,
  copilotRole: module.exports.COPILOT_ROLE,
  administratorRoles: module.exports.ADMINISTRATOR_ROLES,
  JWT_V3_NAME: process.env.JWT_V3_NAME || frontendConfigs[activeEnv].JWT_V3_NAME,
  JWT_V2_NAME: process.env.JWT_V2_NAME || frontendConfigs[activeEnv].JWT_V2_NAME,
  COOKIES_SECURE: process.env.COOKIES_SECURE || frontendConfigs[activeEnv].COOKIES_SECURE,
  TC_LOGIN_URL: process.env.TC_LOGIN_URL || frontendConfigs[activeEnv].TC_LOGIN_URL,
  TC_USER_PROFILE_URL: process.env.TC_USER_PROFILE_URL || frontendConfigs[activeEnv].TC_USER_PROFILE_URL,
  API_URL: process.env.API_URL || frontendConfigs[activeEnv].API_URL,
  ADMIN_TOOL_URL: process.env.ADMIN_TOOL_URL || frontendConfigs[activeEnv].ADMIN_TOOL_URL,
  ACCOUNTS_CONNECTOR_URL: process.env.ACCOUNTS_CONNECTOR_URL || frontendConfigs[activeEnv].ACCOUNTS_CONNECTOR_URL,
  DIRECT_URL_BASE: process.env.DIRECT_URL_BASE || frontendConfigs[activeEnv].DIRECT_URL_BASE,
  OWNER_LOGIN_GITHUB_URL: process.env.OWNER_LOGIN_GITHUB_URL || frontendConfigs[activeEnv].OWNER_LOGIN_GITHUB_URL,
  OWNER_LOGIN_GITLAB_URL: process.env.OWNER_LOGIN_GITLAB_URL || frontendConfigs[activeEnv].OWNER_LOGIN_GITLAB_URL,
  TOPCODER_URL: process.env.TOPCODER_URL || frontendConfigs[activeEnv].TOPCODER_URL,
  GITHUB_TEAM_URL: process.env.GITHUB_TEAM_URL || frontendConfigs[activeEnv].GITHUB_TEAM_URL,
  GITLAB_GROUP_URL: process.env.GITLAB_GROUP_URL || frontendConfigs[activeEnv].GITLAB_GROUP_URL
};