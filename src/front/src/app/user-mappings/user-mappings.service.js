/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is a service to access the backend api.
 */
'use strict';

angular.module('topcoderX')
  .factory('UserMappingsService', ['$http', 'Helper', function ($http, Helper) {
    var baseUrl = Helper.baseUrl;
    var service = {};

    /**
     * searches user mapping items
     * @param {String} query the query string
     * @param {String} sortBy the sort by
     * @param {String} sortDir the sort direction
     * @param {Number} pageNo the page number
     * @param {Number} pageSize the page size
     */
    service.search = function (query, sortBy, sortDir, pageNo, pageSize) {
      if (query) return service.searchWithQuery(query, sortBy, sortDir, pageNo, pageSize);
      else return $http.get(baseUrl + '/api/v1/users/mappings?sortBy=' + sortBy + '&sortDir=' + sortDir + '&page=' + pageNo + '&perPage=' + pageSize)
        .then(function (response) {
          return response;
        });
    };

    /**
     * searches user mapping items with query
     * @param {String} query the query string
     * @param {String} sortBy the sort by
     * @param {String} sortDir the sort direction
     * @param {Number} pageNo the page number
     * @param {Number} pageSize the page size
     */
    service.searchWithQuery = function (query, sortBy, sortDir, pageNo, pageSize) {
      return $http.get(baseUrl + '/api/v1/users/mappings?query=' + query + '&sortBy=' + sortBy + '&sortDir=' + sortDir + '&page=' + pageNo + '&perPage=' + pageSize)
        .then(function (response) {
          return response;
        });
    };

    /**
     * create a new user mapping item
     *
     */
    service.create = function (bodyParam) {
      return $http.post(baseUrl + '/api/v1/users/mappings/', { userMapping: bodyParam }).then(function (response) {
        return response;
      });
    };

    /**
     * update pre-existing payment item
     *
     */
    service.update = function (bodyParam) {
      return $http.put(baseUrl + '/api/v1/users/mappings/', { userMapping: bodyParam }).then(function (response) {
        return response;
      });
    };

    /**
     * remove user mapping item
     *
     */
    service.delete = function (topcoderUsername) {
      return $http.delete(baseUrl + '/api/v1/users/mappings/' + topcoderUsername).then(function (response) {
        return response.data;
      });
    };

    return service;
  }]);
