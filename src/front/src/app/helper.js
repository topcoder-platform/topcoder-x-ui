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

