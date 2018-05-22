'use strict';

/**
 * Inject JWT token into http requests
 *
 * It inject token V2 for requests to API V2
 * and token V3 for requests to API V3
 */

angular.module('topcoderX')
  .config(['$httpProvider', 'jwtInterceptorProvider', function ($httpProvider, jwtInterceptorProvider) {
    var refreshingToken = null;

    function handleRefreshResponse(res, $authService) {
      var ref;
      var ref1;
      var ref2;

      const newToken = (ref = res.data) != null ? (ref1 = ref.result) != null ?
        (ref2 = ref1.content) != null ? ref2.token : void 0 : void 0 : void 0;

      $authService.setTokenV3(newToken);

      return newToken;
    };

    function refreshingTokenComplete() {
      refreshingToken = null;
    };

    jwtInterceptorProvider.tokenGetter = [
      'AuthService', '$http', 'API_URL', 'ADMIN_TOOL_URL', 'config',
      function (AuthService, $http, API_URL, ADMIN_TOOL_URL, config) {
        // token V2 for API V2
        if (config.url.indexOf(ADMIN_TOOL_URL) > -1) {
          if (AuthService.getTokenV2()) {
            return AuthService.getTokenV2();
          } else {
            AuthService.login();
          }

          // token V3 for API V3
        } else {
          var currentToken = AuthService.getTokenV3();

          if (AuthService.getTokenV3() && AuthService.isTokenV3Expired()) {
            if (refreshingToken === null) {
              refreshingToken = $http({
                method: 'GET',
                url: API_URL + "/v3/authorizations/1",
                headers: {
                  'Authorization': "Bearer " + currentToken
                }
              }).then(function (res) { handleRefreshResponse(res, AuthService) })["finally"](refreshingTokenComplete).catch(function () {
                AuthService.login();
              });
            }
            return refreshingToken;
          } else {
            return currentToken;
          }
        }
      }];

    return $httpProvider.interceptors.push('jwtInterceptor');
  }]);
