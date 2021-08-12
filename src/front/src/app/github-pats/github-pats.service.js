/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is a service to access the backend api.
 */
'use strict';

angular.module('topcoderX')
  .factory('GithubPATsService', ['$http', 'Helper', function ($http, Helper) {
    var baseUrl = Helper.baseUrl;
    var service = {};

    /**
     * searches PATitems
     * @param {String} sortBy the sort by
     * @param {String} sortDir the sort direction
     * @param {Number} pageNo the page number
     * @param {Number} pageSize the page size
     */
    service.search = function (sortBy, sortDir, pageNo, pageSize) {
      return $http.get(baseUrl + '/api/v1/github/pat?sortBy=' + sortBy + '&sortDir=' + sortDir + '&page=' + pageNo + '&perPage=' + pageSize)
        .then(function (response) {
          return response;
        });
    };

    /**
     * create a new PAT item
     *
     */
    service.create = function (bodyParam) {
      return $http.post(baseUrl + '/api/v1/github/pat/', { pat: bodyParam }).then(function (response) {
        return response;
      });
    };

    /**
     * remove PAT item
     *
     */
    service.delete = function (id) {
      return $http.delete(baseUrl + '/api/v1/github/pat/' + id).then(function (response) {
        return response.data;
      });
    };

    return service;
  }]);
