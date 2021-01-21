'use strict';

/**
 * Inject JWT token into http requests
 *
 * It inject token V2 for requests to API V2
 * and token V3 for requests to API V3
 */

angular.module('topcoderX')
  .config(['$httpProvider', 'jwtInterceptorProvider', function ($httpProvider, jwtInterceptorProvider) {
    jwtInterceptorProvider.tokenGetter = [
      'AuthService', '$http', 'Helper', '$rootScope', 'config',
      function (AuthService, $http, Helper, $rootScope, config) {
        if (!$rootScope.appConfig) return;
        // token V2 for API V2
        if (config.url.indexOf($rootScope.appConfig.ADMIN_TOOL_URL) > -1) {
          if (AuthService.getTokenV2()) {
            return AuthService.getTokenV2();
          }
          AuthService.login();
          // token V3 for API V3
        } else {
          var currentToken = AuthService.getTokenV3();

          if (AuthService.getTokenV3() && AuthService.isTokenV3Expired()) {
            var token = AuthService.getToken('v3jwt')
            if (token) return token
            else AuthService.login()
          } else {
            return currentToken;
          }
        }
      }];

    return $httpProvider.interceptors.push('jwtInterceptor');
  }]);
