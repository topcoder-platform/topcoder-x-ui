/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is a service to access the backend api.
 */
'use strict';

angular.module('topcoderX')
  .factory('CopilotPaymentService', ['$http', 'Helper', function ($http, Helper) {
    var baseUrl = Helper.baseUrl;
    var service = {};

    /**
     * updates payment status
     *
     */
    service.updateAll = function () {
      return $http.post(baseUrl + '/api/v1/payments/copilot/updates/').then(function (response) {
        return response;
      });
    };

    /**
     * searches copilot payment items
     * @param {String} status the status
     * @param {String} sortBy the sort by
     * @param {String} sortDir the sort direction
     * @param {Number} pageNo the page number
     * @param {Number} pageSize the page size
     */
    service.search = function (status, sortBy, sortDir, pageNo, pageSize) {
      return $http.get(baseUrl + '/api/v1/payments/copilot?status=' + status + '&sortBy=' + sortBy + '&sortDir=' + sortDir + '&page=' + pageNo + '&perPage=' + pageSize)
        .then(function (response) {
          return response;
        });
    };

    /**
     * create a new payment item
     *
     */
    service.create = function (bodyParam) {
      return $http.post(baseUrl + '/api/v1/payments/copilot/', { payment: bodyParam }).then(function (response) {
        return response;
      });
    };

    /**
     * update pre-existing payment item
     *
     */
    service.update = function (bodyParam) {
      return $http.put(baseUrl + '/api/v1/payments/copilot/', { payment: bodyParam }).then(function (response) {
        return response;
      });
    };

    /**
     * remove payment item
     *
     */
    service.delete = function (id) {
      return $http.delete(baseUrl + '/api/v1/payments/copilot/' + id).then(function (response) {
        return response.data;
      });
    };

    return service;
  }]);
