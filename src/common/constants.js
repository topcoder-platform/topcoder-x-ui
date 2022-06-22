/* eslint-disable */
/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * Define constants.
 *
 * @author TCSCODER
 * @version 1.0
 */

// The default page size
const DEFAULT_PER_PAGE = 30;

// The max page size
const MAX_PER_PAGE = Number.MAX_SAFE_INTEGER;

// The service error
const SERVICE_ERROR = 'SERVICE_ERROR';

// The service error status
const SERVICE_ERROR_STATUS = 500;

// The user roles
const USER_ROLES = {
  OWNER: 'owner',
};

// The user types
const USER_TYPES = {
  GITHUB: 'github',
  GITLAB: 'gitlab'
};

// The default page size for Gitlab API
const GITLAB_DEFAULT_PER_PAGE = 20;

// The max page size for Gitlab API. Increased to max num for local search purpose.
const GITLAB_MAX_PER_PAGE = Number.MAX_SAFE_INTEGER;

// The gitlab default group member access level,
// the access level can be: 10 - GUEST, 20 - REPORTER, 30 - DEVELOPER, 40 - MASTER, 50 - OWNER
const GITLAB_DEFAULT_GROUP_ACCESS_LEVEL = 30;

// The Gitlab access token default expiration in seconds (2 hours expiration)
const GITLAB_ACCESS_TOKEN_DEFAULT_EXPIRATION = 3600 * 2;

// The Gitlab refresh token time in seconds before expiration (5 minute before expiration)
const GITLAB_REFRESH_TOKEN_BEFORE_EXPIRATION = 300;

const GITHUB_OWNER_CALLBACK_URL = '/api/v1/github/owneruser/callback';
const GITLAB_OWNER_CALLBACK_URL = '/api/v1/gitlab/owneruser/callback';

const OWNER_USER_LOGIN_SUCCESS_URL = '/#!/app/settings';
const USER_ADDED_TO_TEAM_SUCCESS_URL = '/#!/members';

const TC_LOGIN_CALLBACK_URL = '/api/v1/tclogin';
const JWT_V3_NAME = 'v3jwt';

module.exports = {
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  SERVICE_ERROR,
  SERVICE_ERROR_STATUS,
  USER_ROLES,
  USER_TYPES,
  GITLAB_DEFAULT_PER_PAGE,
  GITLAB_MAX_PER_PAGE,
  GITLAB_DEFAULT_GROUP_ACCESS_LEVEL,
  GITLAB_ACCESS_TOKEN_DEFAULT_EXPIRATION,
  GITLAB_REFRESH_TOKEN_BEFORE_EXPIRATION,
  GITHUB_OWNER_CALLBACK_URL,
  GITLAB_OWNER_CALLBACK_URL,
  OWNER_USER_LOGIN_SUCCESS_URL,
  USER_ADDED_TO_TEAM_SUCCESS_URL,
  TC_LOGIN_CALLBACK_URL,
  JWT_V3_NAME,
};
