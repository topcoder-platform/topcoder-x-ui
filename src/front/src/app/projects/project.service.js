/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is a service to access the backend api.
 */


angular.module('topcoderX')
  .factory('ProjectService', ['Helper', '$http', '$rootScope', 'AuthService', function (Helper, $http, $rootScope, AuthService) {
    // object we will return
    var ProjectService = {};
    var projectsDataPromise = {};
    var projectsGetLock = {};

    /**
     * Create a project
     * @param project  the project to be created
     */
    ProjectService.create = function (project) {
      return $http.post(Helper.baseUrl + '/api/v1/projects', project);
    };

    /**
     * Get projects
     */
    ProjectService.getProjects = function (status, showAll, perPage, lastKey, query) {
      var url = Helper.baseUrl + '/api/v1/projects?status=' + status + '&showAll=' + showAll + '&perPage=' + perPage +
        (lastKey ? '&lastKey=' + lastKey : '');
      if (query) {
        url = Helper.baseUrl + '/api/v1/projects/search?status=' + status + '&showAll=' + showAll + '&perPage=' + perPage +
           '&query=' + query;
      }
      if (projectsGetLock[url]) {
        return projectsDataPromise[url];
      }

      projectsGetLock[url] = true;
      projectsDataPromise[url] = $http.get(url).then(function (response) {
        projectsGetLock[url] = false;
        return response;
      });
      return projectsDataPromise[url];
    };

    /**
     * Update a project
     * @param project the project to be updated
     */
    ProjectService.update = function (project) {
      return $http.put(Helper.baseUrl + '/api/v1/projects', project).then(function (response) {
        return response;
      });
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
      });
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
        data: objc,
      };
      return $http(req).then(function (response) {
        return response;
      });
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
        data: objc,
      };
      return $http(req).then(function (response) {
        return response;
      });
    };

    /**
     * Add wiki rules to the repository
     * @param objc object containing the projectId property
     */
    ProjectService.addWikiRules = function (objc) {
      var req = {
        method: 'POST',
        url: Helper.baseUrl + '/api/v1/projects/wikiRules',
        data: objc,
      };
      return $http(req).then(function (response) {
        return response;
      });
    };

    /**
     * transfers the ownership of project
     * @param {String} projectId the project id
     * @param {String} owner the topcoder handle of owner user
     */
    ProjectService.transferOwnership = function (pId, ownerHandle) {
      var req = {
        method: 'POST',
        url: Helper.baseUrl + '/api/v1/projects/transferOwnership',
        data: {
          projectId: pId,
          owner: ownerHandle,
        },
      };
      return $http(req).then(function (response) {
        return response;
      });
    };

    /**
     * Get associated connect projects that the current user has access to
     * @param perPage the items to retrieve per page
     * @param page the page index
     */
    ProjectService.getConnectProjects = function (perPage, page) {
      return $http({
        method: 'GET',
        url: $rootScope.appConfig.TC_API_V5_URL + '/projects/',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + AuthService.getTokenV3(),
        },
        params: {
          fields: 'id,name',
          sort: 'lastActivityAt desc',
          perPage,
          page,
          status: 'active',
        },
      });
    };

    /**
     * Get connect project by id
     * @param id the id
     */
    ProjectService.getConnectProject = function (id) {
      return $http({
        method: 'GET',
        url: $rootScope.appConfig.TC_API_V5_URL + '/projects/' + id,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + AuthService.getTokenV3(),
        },
      });
    };

    /**
     * Get technology tags
     */
    ProjectService.searchTags = function (searchQuery) {
      if (!searchQuery || searchQuery.length === 0) {
        return Promise.resolve({data: []});
      }
      return $http({
        method: 'GET',
        url: $rootScope.appConfig.TOPCODER_VALUES[$rootScope.appConfig.TOPCODER_ENV].TC_API_V5_URL + '/standardized-skills/skills/autocomplete',
        params: {
          term: searchQuery,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + AuthService.getTokenV3(),
        },
      })
      .then((response) => {
        response.data = response.data.map((item) => ({id: item.id, name: item.name}));
        return response;
      });
    };
    return ProjectService;
  }]);
