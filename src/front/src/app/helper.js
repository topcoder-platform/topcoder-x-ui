/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is a service providers the common helper methods.
 */
'use strict';

angular.module('topcoderX')
  .factory('Helper', ['$rootScope', '$location', 'TC_LOGIN_URL', 'TC_USER_PROFILE_URL', 'API_URL', 'ADMIN_TOOL_URL', 'ACCOUNTS_CONNECTOR_URL', 'DIRECT_URL_BASE', function ($rootScope, $location, TC_LOGIN_URL, TC_USER_PROFILE_URL, API_URL, ADMIN_TOOL_URL, ACCOUNTS_CONNECTOR_URL, DIRECT_URL_BASE) {
    var baseUrl = $location.protocol() + '://' + $location.host();

    var service = {};

    service.baseUrl = baseUrl;

    /**
     * gets the config based on host env
     */
    service.config = function () {
      return {
        TC_LOGIN_URL: TC_LOGIN_URL, // eslint-disable-line object-shorthand
        TC_USER_PROFILE_URL: TC_USER_PROFILE_URL, // eslint-disable-line object-shorthand
        API_URL: API_URL, // eslint-disable-line object-shorthand
        ADMIN_TOOL_URL: ADMIN_TOOL_URL, // eslint-disable-line object-shorthand
        ACCOUNTS_CONNECTOR_URL: ACCOUNTS_CONNECTOR_URL, // eslint-disable-line object-shorthand
        DIRECT_URL_BASE: DIRECT_URL_BASE, // eslint-disable-line object-shorthand
      };
    };

    service.isAdminUser = function (currentUser) {
      var userRoles = currentUser.roles.map(function (x) {
        return x.toUpperCase();
      });
      var administratorRoles = $rootScope.appConfig.administratorRoles.map(function (x) {
        return x.toUpperCase();
      });
      var t;
      if (administratorRoles.length > userRoles.length) {
        t = administratorRoles;
        administratorRoles = userRoles;
        userRoles = t; // indexOf to loop over shorter
      }
      var matchedRoles = userRoles.filter(function (e) {
        return administratorRoles.indexOf(e.toUpperCase()) > -1;
      });
      return matchedRoles.length > 0;
    };
    return service;
  }]);

