/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is a service providers the common helper methods.
 */
'use strict';

angular.module('topcoderX')
    .factory('Helper', ['$location', function ($location) {
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
                TC_USER_PROFILE_URL: 'http://api.' + tcDomain + '/v2/user/profile',
                API_URL: 'https://api.' + tcDomain + '',
                ADMIN_TOOL_URL: 'https://api.' + tcDomain + '/v2',
                ACCOUNTS_CONNECTOR_URL: 'https://accounts.' + tcDomain + '/connector.html',
                DIRECT_URL_BASE: 'https://www.' + tcDomain + '/direct/projectOverview?formData.projectId='
            }
        }
        return service;

    }]);
