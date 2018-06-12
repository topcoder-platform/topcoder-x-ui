/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is a service to access the backend api.
 */
'use strict';

angular.module('topcoderX')
  .factory('ProjectService', ['Helper', '$http', function (Helper, $http) {
    //object we will return
    var ProjectService = {};
    /**
     * Create a project
     * @param project  the project to be created
     */
    ProjectService.create = function (project) {
      return $http.post(Helper.baseUrl + '/api/v1/projects', project).then(function (response) {
        return response;
      });
    };

    /**
     * Get all projects
     */
    ProjectService.getProjects = function (status) {
      return $http.get(Helper.baseUrl + '/api/v1/projects?status=' + status).then(function (response) {
        return response;
      });
    };

    /**
     * Update a project
     * @param project the project to be updated
     */
    ProjectService.update = function (project) {
      return $http.put(Helper.baseUrl + '/api/v1/projects', project).then(function (response) {
        return response;
      })
    };

    /**
     * Get user's oauth token
     *
     * @param username the code repository username
     * @param tokenType  the code repository provider: its either gitlab or github
     */
    ProjectService.getUserToken = function (username, tokenType) {
      return $http.get(Helper.baseUrl + '/api/v1/users/accessToken?username=' + username + '&tokenType=' + tokenType).then(function (response) {
        return response;
      })
    };

    /**
     * Add label to the repository
     * @param repoOwner the repository's owner
     * @param repoName  the repository's name
     * @param token     the oauth token
     * @param label     the label to be added
     * @param color     the color for the label
     * @param description  the label's description
     * @param repoType the repository provider
     */
    ProjectService.createLabel = function (objc) {
      var req = {
        method: 'POST',
        url: Helper.baseUrl + '/api/v1/projects/label',
        data: objc
      };
      return $http(req).then(function (response) { return response; })
    };

    /**
     * Add hooks to the repository
     * @param repoOwner  the repository's owner
     * @param repoName   the repository's name
     * @param token      the oauth token
     * @param HOOK_BASE_URL  the receiver's base url.
     * @param personalToken  the personal token used by the webhook.
     */
    ProjectService.createHooks = function (objc) {
      var req = {
        method: 'POST',
        url: Helper.baseUrl + '/api/v1/projects/hook',
        data: objc
      };
      return $http(req).then(function (response) {
        return response;
      });
    };
    return ProjectService;
  }]);
