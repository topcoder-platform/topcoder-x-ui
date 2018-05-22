/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */

/**
 * Contains all routes.
 *
 * @author TCSCODER
 * @version 1.0
 */
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
      tcLogin: true,
    },
  },
  '/github/normaluser/callback': {
    get: {
      controller: 'GithubController',
      method: 'addUserToTeamCallback',
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
      tcLogin: true,
    },
  },
  '/gitlab/normaluser/callback': {
    get: {
      controller: 'GitlabController',
      method: 'addUserToGroupCallback',
    },
  },

  '/tclogin': {
    get: {
      controller: 'TCUserController',
      method: 'login',
    },
  },
  '/admin/tcuser': {
    get: {
      controller: 'TCUserController',
      method: 'getUserMapping',
      isAdmin: true,
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
};
