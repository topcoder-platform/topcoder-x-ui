/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * Contains all routes.
 *
 * @author TCSCODER
 * @version 1.0
 */

const config = require('./config');

module.exports = {
  '/github/owneruser/login': {
    get: {
      controller: 'GithubController',
      method: 'ownerUserLogin',
    },
  },
  '/github/owneruser/callback': {
    get: {
      controller: 'GithubController',
      method: 'ownerUserLoginCallback',
    },
  },

  '/github/owneruser/teams': {
    get: {
      controller: 'GithubController',
      method: 'listOwnerUserTeams',
    },
  },
  '/github/teams/:id/registrationurl': {
    get: {
      controller: 'GithubController',
      method: 'getTeamRegistrationUrl',
    },
  },
  '/github/teams/registration/:identifier': {
    get: {
      controller: 'GithubController',
      method: 'addUserToTeam',
      allowNormalUser: true,
      tcLogin: true,
    },
  },
  '/github/normaluser/callback': {
    get: {
      controller: 'GithubController',
      method: 'addUserToTeamCallback',
      allowNormalUser: true,
    },
  },

  '/gitlab/owneruser/login': {
    get: {
      controller: 'GitlabController',
      method: 'ownerUserLogin',
    },
  },
  '/gitlab/owneruser/callback': {
    get: {
      controller: 'GitlabController',
      method: 'ownerUserLoginCallback',
    },
  },

  '/gitlab/owneruser/groups': {
    get: {
      controller: 'GitlabController',
      method: 'listOwnerUserGroups',
    },
  },
  '/gitlab/groups/:id/registrationurl': {
    get: {
      controller: 'GitlabController',
      method: 'getGroupRegistrationUrl',
    },
  },
  '/gitlab/groups/registration/:identifier': {
    get: {
      controller: 'GitlabController',
      method: 'addUserToGroup',
      allowNormalUser: true,
      tcLogin: true,
    },
  },
  '/gitlab/normaluser/callback': {
    get: {
      controller: 'GitlabController',
      method: 'addUserToGroupCallback',
      allowNormalUser: true,
    },
  },

  '/tclogin': {
    get: {
      controller: 'TCUserController',
      method: 'login',
      allowNormalUser: true,
    },
  },
  '/admin/tcuser': {
    get: {
      controller: 'TCUserController',
      method: 'getUserMapping',
    },
  },
  '/projects': {
    get: {
      controller: 'ProjectController',
      method: 'getAll',
    },
    post: {
      controller: 'ProjectController',
      method: 'create',
    },
    put: {
      controller: 'ProjectController',
      method: 'update',
    },
  },
  '/projects/label': {
    post: {
      controller: 'ProjectController',
      method: 'createLabel',
    },
  },
  '/projects/hook': {
    post: {
      controller: 'ProjectController',
      method: 'createHook',
    },
  },
  '/projects/wikiRules': {
    post: {
      controller: 'ProjectController',
      method: 'addWikiRules',
    },
  },
  '/payments/copilot': {
    get: {
      controller: 'CopilotPaymentController',
      method: 'getAll',
      allowedRoles: [config.COPILOT_ROLE],
    },
    post: {
      controller: 'CopilotPaymentController',
      method: 'create',
      allowedRoles: [config.COPILOT_ROLE],
    },
    put: {
      controller: 'CopilotPaymentController',
      method: 'update',
      allowedRoles: [config.COPILOT_ROLE],
    },
  },
  '/payments/copilot/:id': {
    delete: {
      controller: 'CopilotPaymentController',
      method: 'remove',
      allowedRoles: [config.COPILOT_ROLE],
    },
  },
  '/payments/copilot/updates': {
    post: {
      controller: 'CopilotPaymentController',
      method: 'updateAll',
      allowedRoles: [config.COPILOT_ROLE],
    },
  },
  '/users/setting': {
    get: {
      controller: 'UserController',
      method: 'getUserSetting',
    },
  },
  '/users/accessToken': {
    get: {
      controller: 'UserController',
      method: 'getUserToken',
    },
  },
  '/security/isAuthorized': {
    get: {
      controller: 'SecurityController',
      method: 'isAuthorized',
      allowNormalUser: true,
    },
  },
  '/issues': {
    get: {
      controller: 'IssueController',
      method: 'search',
    },
  },
  '/appConfig': {
    get: {
      controller: 'AppConfigController',
      method: 'getAppConfig',
    },
  },
};
