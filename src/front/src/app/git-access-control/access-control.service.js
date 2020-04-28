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
        service.getGitlabShareableLink = function (groupId, accessLevel, expiredAt) {
            if (expiredAt) {
                return $http.get(baseUrl + '/api/v1/gitlab/groups/' + groupId + '/registrationurl/' + accessLevel + '/' + expiredAt).then(function (response) {
                    return response;
                });
            }
            return $http.get(baseUrl + '/api/v1/gitlab/groups/' + groupId + '/registrationurl/' + accessLevel).then(function (response) {
                return response;
            });
        };

        /**
         * get azure owner teams
         *
         */
        service.getAzureOwnerTeams = function (pageNo, pageSize) {
            return $http.get(baseUrl + '/api/v1/azure/owneruser/teams?page=' + pageNo + '&perPage=' + pageSize).then(function (response) {
                return response;
            });
        };

        /**
         * get azure shareable link
         *
         */
        service.getAzureShareableLink = function (teamId, orgname, projectId) {
            return $http.get(baseUrl + '/api/v1/azure/teams/' + teamId + '/registrationurl/' + orgname + '/' + projectId).then(function (response) {
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
        service.getGithubShareableLink = function (teamId, accessLevel) {
            return $http.get(baseUrl + '/api/v1/github/teams/' + teamId + '/registrationurl/' + accessLevel).then(function (response) {
                return response;
            });
        };

        /**
         * remove all users from a github team
         *
         */
        service.removeAllGithubUsers = function (teamId) {
            return $http.delete(baseUrl + '/api/v1/github/teams/' + teamId + '/users').then(function (response) {
                return response;
            });
        };

        /**
         * remove all users from a gitlab group
         *
         */
        service.removeAllGitlabUsers = function (groupId) {
            return $http.delete(baseUrl + '/api/v1/gitlab/groups/' + groupId + '/users').then(function (response) {
                return response;
            });
        };

        /**
         * remove all users from a azure team
         *
         */
        service.removeAllAzureUsers = function (teamId) {
            return $http.delete(baseUrl + '/api/v1/azure/teams/' + teamId + '/users').then(function (response) {
                return response;
            });
        };

        return service;
    }]);
