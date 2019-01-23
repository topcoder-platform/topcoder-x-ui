/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is a service to access the backend api.
 */
'use strict';

angular.module('topcoderX')
    .factory('GitAccessControlService', ['$http', 'Helper', function ($http, Helper) {
        var baseUrl = Helper.baseUrl;
        var service = {};

        /**
         * get gitlab owner groups
         *
         */
        service.getGitlabOwnerGroups = function (pageNo, pageSize, getAll) {
            return $http.get(baseUrl + '/api/v1/gitlab/owneruser/groups?page=' + pageNo + '&perPage=' + pageSize + '&getAll=' + getAll).then(function (response) {
                return response;
            });
        };

        /**
         * get gitlab shareable link
         *
         */
        service.getGitlabShareableLink = function (groupId) {
            return $http.get(baseUrl + '/api/v1/gitlab/groups/' + groupId + '/registrationurl').then(function (response) {
                return response;
            });
        };

        /**
         * get github owner teams
         *
         */
        service.getGithubOwnerTeams = function (pageNo, pageSize) {
            return $http.get(baseUrl + '/api/v1/github/owneruser/teams?page=' + pageNo + '&perPage=' + pageSize).then(function (response) {
                return response;
            });
        };

        /**
         * get github shareable link
         *
         */
        service.getGithubShareableLink = function (teamId) {
            return $http.get(baseUrl + '/api/v1/github/teams/' + teamId + '/registrationurl').then(function (response) {
                return response;
            });
        };

        return service;
    }]);
