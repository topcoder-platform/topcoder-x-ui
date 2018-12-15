/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is a service providers the common helper methods.
 */
'use strict';

angular.module('topcoderX')
  .factory('Helper', ['$rootScope', '$location', function ($rootScope, $location) {
    var baseUrl = $location.protocol() + '://' + $location.host();

    var service = {};

    service.baseUrl = baseUrl;

    /**
     * gets the config based on host env
     */
    service.config = function () {
      var tcDomain = baseUrl.indexOf('topcoder.com') > -1 ? 'topcoder.com' : 'topcoder-dev.com';
      return {
        TC_LOGIN_URL: 'https://accounts.' + tcDomain + '/member',
        TC_USER_PROFILE_URL: 'https://api.' + tcDomain + '/v2/user/profile',
        API_URL: 'https://api.' + tcDomain + '',
        ADMIN_TOOL_URL: 'https://api.' + tcDomain + '/v2',
        ACCOUNTS_CONNECTOR_URL: 'https://accounts.' + tcDomain + '/connector.html',
        DIRECT_URL_BASE: 'https://www.' + tcDomain + '/direct/projectOverview?formData.projectId='
      }
    }

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

