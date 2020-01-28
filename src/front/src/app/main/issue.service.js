/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is a service to access the backend api for issue related operation.
 */
'use strict';

angular.module('topcoderX')
    .factory('IssueService', ['$http', 'Helper', function ($http, Helper) {
        var baseUrl = Helper.baseUrl;
        var service = {};
        var issuesDataPromise = {};
        var issuesGetLock = {};

        /**
         * search for issues
         */
        service.search = function (label, sortBy, sortDir, pageNo, pageSize) {
            var url = baseUrl + '/api/v1/issues?label=' + label + '&sortBy=' + sortBy + '&sortDir=' + sortDir + '&page=' + pageNo + '&perPage=' + pageSize;

            if (issuesGetLock[url]) {
                return issuesDataPromise[url];
            }

            issuesGetLock[url] = true;
            issuesDataPromise[url] = $http.get(url).then(function (response) {
                issuesGetLock[url] = false;
                return response;
            });
            return issuesDataPromise[url];
        };

        /**
         * Create an Issue
         * @param issue  the issue to be created
         */
        service.create = function (issue) {
            return $http.post(Helper.baseUrl + '/api/v1/issues', issue).then(function (response) {
                return response;
            });
        };

        /**
         * Recreate an Issue
         * @param issue  the issue to be created
         */
        service.recreate = function (issue) {
            return $http.post(Helper.baseUrl + '/api/v1/issues/recreate', issue).then(function (response) {
                return response;
            });
        };

        return service;
    }]);
