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

        /**
         * search for issues
         */
        service.search = function (label, sortBy, sortDir, pageNo, pageSize) {
            return $http.get(baseUrl + '/api/v1/issues?label=' + label + '&sortBy=' + sortBy + '&sortDir=' + sortDir + '&page=' + pageNo + '&perPage=' + pageSize).then(function (response) {
                return response;
            });
        };

        return service;
    }]);
