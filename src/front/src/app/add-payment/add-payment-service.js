/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is a service to access the backend api.
 */
'use strict';

angular.module('topcoderX')
  .factory('PaymentServices', ['$http', 'Helper', function ($http, Helper) {
    var baseUrl = Helper.baseUrl;
    var service = {};


    /**
     * get copilot payment items
     *
     */
    service.getAll = function (query) {
      return $http.get(baseUrl + '/api/v1/payments/' + query).then(function (response) {
        return response;
      });
    };

    /**
     * create a new payment item
     *
     */
    service.create = function (bodyParam) {
      return $http.post(baseUrl + '/api/v1/payments/', { payment: bodyParam }).then(function (response) {
        return response;
      });
    };

    /**
     * update pre-existing payment item
     *
     */
    service.update = function (bodyParam) {
      return $http.put(baseUrl + '/api/v1/payments/', { payment: bodyParam }).then(function (response) {
        return response;
      });
    };

    /**
     * remove payment item
     *
     */
    service.delete = function (id) {
      return $http.delete(baseUrl + '/api/v1/payments/' + (id || '')).then(function (response) {
        return response;
      });
    };

    return service;
  }]);
