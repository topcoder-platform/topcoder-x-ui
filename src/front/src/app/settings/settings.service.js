/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is a service to access the backend api related to user setting.
 */
'use strict';

angular.module('topcoderX')
    .factory('SettingService', ['$location', '$http', function ($location, $http) {
        var baseUrl = $location.protocol() + '://' + $location.host();
        //object we will return
        var service = {};

        /**
         * Get user's setting state
         */
        service.userSetting = function (handle) {
            return $http.get(baseUrl + '/api/v1/users/setting?topcoderUsername=' + handle).then(function (response) {
                return response;
            });
        };

        /**
        * tryAuth Try to authenticate the user based on code & state params
        * @param {string} code  from github oAuth
        * @param {string} state from github oAuth
        */
        service.githubOwnerCallback = function (code, state, handle) {
            return $http.get(baseUrl + '/api/v1/github/owneruser/callback?code=' + code + '&state=' + state + '&topcoderUsername=' + handle).then(function (response) {
                return response;
            });
        };
        return service;
    }]);
