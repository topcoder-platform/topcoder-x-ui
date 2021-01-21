'use strict';

angular.module('topcoderX')
  .factory('AuthService', [
    '$q', '$log', 'jwtHelper', '$cookies', '$window', '$state', '$rootScope', '$http', 'Helper',
    function ($q, $log, jwtHelper, $cookies, $window, $state, $rootScope, $http, Helper) {

      // local variables
      var connectorIFrame, loading; 

      /**
       * Create invisible iframe and append it to the body
       *
       * @param  {String} id    iframe tag id
       * @param  {String} src   iframe source
       * @return {HTMLElement}  dom element of the iframe
       */
      function createFrame(id, src) {

        var iframe = document.createElement('iframe');

        iframe.id = id;
        iframe.src = src;
        iframe.width = 0;
        iframe.height = 0;
        iframe.frameborder = 0;
        iframe.crossorigin = 'anonymous';

        // set inline style cross-browser way to make iframe completely invisible
        angular.element(iframe).css({
          display: 'block',
          border: '0'
        })

        document.body.appendChild(iframe);

        return iframe;
      }

      /**
       * Proxies calls to the iframe from main window
       *
       * @return {Promise}        promise of the request
       */
      function proxyCall() {
        if (!connectorIFrame) {
          throw new Error('connector has not yet been configured.')
        }

        function request() {
          return $q(function (resolve, reject) {
            var token = AuthService.getToken('v3jwt')
            token ? resolve({ token: token }) : reject("v3jwt cookie not found") // eslint-disable-line no-unused-expressions
          })
        }

        return loading.then(request)
      }

      /**
       * Create invisible iframe which will be used to retrieve token v3
       *
       * @param  {Object} options frameId and connectorUrl for the iframe
       * @return {Promise}        promise on iframe load
       */
      function configureConnector(options) {
        if (connectorIFrame) {
          $log.warn('iframe connector can only be configured once, this request has been ignored.')
        } else {
          connectorIFrame = createFrame(options.frameId, options.connectorUrl)

          loading = $q(function (resolve) {
            connectorIFrame.onload = function () {
              resolve()
            }
          })
        }
      }

      function fromPairs(arr) {
        return arr.reduce(function(accumulator, value) {
          accumulator[value[0]] = value[1];
          return accumulator;
        }, {})
      }

      /**
       * parse cookie to find a key data.
       *
       * @param  {String} cookie    cookie data
       * @return {Object}  parsed cookie
       */
      function parseCookie(cookie) {
        return fromPairs(
          cookie
            .split(';')
            .map(
              function (pair) { return pair.split('=').map(function(part) { return part.trim() }) }
            )
        )
      }

      var AuthService = {
        ERROR: {
          NO_PERMISSIONS: 'Current user doesn\'t have permissions.',
        },
        PermissionDenied: false,
      };

      /**
       * Get token in cookie based on key.
       *
       * @param  {String} key    the key
       * @return {Object}  token data object
       */
      AuthService.getToken = function(key) {
        return parseCookie(document.cookie)[key]
      }

      /**
       * Returns promise which is resolved when connector iframe is loaded
       *
       * @return {Promise}
       */
      AuthService.ready = function () {
        if (!connectorIFrame) {
          throw new Error('AuthService.init() has to be called once when app run before any other methods of AuthService.');
        }

        return loading;
      }

      /**
       * Retrieves new token v3 using hidden iframe
       * check that user has administrator credentials and save it to the cookies
       *
       * @return {Promise} promise to get token v3
       */
      AuthService.retriveFreshToken = function () {
        return proxyCall()
          .then(function (data) {
            AuthService.setTokenV3(data.token);
            return AuthService.isAuthorized();
          });
      }

      /**
       * Log out user
       * Clear cookies and send request to the server for log out
       *
       * @return {Promise} promise which is resolved when user is logged out on the server
       */
      AuthService.logout = function () {
        $cookies.remove($rootScope.appConfig.JWT_V3_NAME, { path: '/' });
        $window.location.href = $rootScope.appConfig.TC_LOGIN_URL + '?logout=true&retUrl=' + encodeURIComponent($window.location.href);
        // return AuthService.logginOut;
      }

      AuthService.login = function () {
        $window.location.href = $rootScope.appConfig.TC_LOGIN_URL + '?retUrl=' + encodeURIComponent($window.location.href);
      }

      /**
       * Init auth service
       * This has to called once when app starts
       */
      AuthService.init = function () {
        AuthService.getAppConfig().then(function (data) {
          // add hidden iframe which is used to get refresh token
          configureConnector({
            connectorUrl: data.TC_LOGIN_URL,
            frameId: 'tc-accounts-iframe',
          });
        });
      }

      /**
       * Checks if user is already login or not
       * If usr is not login, then redirect to TopCoder login form
       *
       * @return {Promise} promise to authenticate
       */
      AuthService.authenticate = function () {
        return AuthService.ready().then(function () {
          if (AuthService.isLoggedIn()) {
            return AuthService.isAuthorized();
          } else {
            if (AuthService.getTokenV2()) {
              return AuthService.retriveFreshToken();
            } else {
              AuthService.login();
              return $q.reject();
            }
          }
        });
      }

      /**
       * checks if current user is allowed to use the app or not
       */
      AuthService.isAuthorized = function () {
        return $http.get(Helper.baseUrl + '/api/v1/security/isAuthorized').then(function (res) {
          if (res.data === true) {
            return $q.resolve();
          }
          AuthService.PermissionDenied = true;
          return $q.reject(AuthService.ERROR.NO_PERMISSIONS);
        }).catch(function (err) {
          AuthService.logout();
          $state.go('auth');
          return $q.reject(err);
        });
      }

      /**
       * Returns token v3 or null
       *
       * @return {String} token v3
       */
      AuthService.getTokenV3 = function () {
        return $cookies.get($rootScope.appConfig.JWT_V3_NAME);
      }

      /**
       * Save token V3 to cookies
       */
      AuthService.setTokenV3 = function (token) {
        return $cookies.put($rootScope.appConfig.JWT_V3_NAME, token, {
          secure: $rootScope.appConfig.COOKIES_SECURE,
        });
      }

      /**
       * Check if token V3 is expired or no
       *
       * @return {Boolean} true if token V3 is expired
       */
      AuthService.isTokenV3Expired = function () {
        return !AuthService.getTokenV3() || jwtHelper.isTokenExpired(AuthService.getTokenV3(), 300);
      }

      /**
       * Returns token v2 or null
       *
       * @return {String} token v2
       */
      AuthService.getTokenV2 = function () {
        return $cookies.get($rootScope.appConfig.JWT_V2_NAME);
      }

      /**
       * Check if user is fully logged in
       *
       * @return {Boolean}  true if user is logged in
       */
      AuthService.isLoggedIn = function () {
        // we have to check only for token v3, as if have this one, it means we have and v2 also
        return !!AuthService.getTokenV3();
      }

      /**
       * Returns information of the current user, which is retrieved from token v3
       *
       * @return {Object} current user object
       */
      AuthService.getCurrentUser = function () {
        var tctV3 = AuthService.getTokenV3();

        if (!tctV3) {
          return null;
        }

        var currentUser = jwtHelper.decodeToken(tctV3);

        Object.keys(currentUser).findIndex(function (key) {
          if (key.includes('roles')) {
            currentUser.roles = currentUser[key];
            return true;
          }
          return false;
        });
        Object.keys(currentUser).findIndex(function (key) {
          if (key.includes('handle')) {
            currentUser.handle = currentUser[key];
            return true;
          }
          return false;
        });
        Object.keys(currentUser).findIndex(function (key) {
          if (key.includes('userId')) {
            currentUser.userId = parseInt(currentUser[key], 10);
            return true;
          }
          return false;
        });

        currentUser.id = currentUser.userId;
        currentUser.token = tctV3;

        return currentUser;
      };

      /**
       * gets the application configurations
       */
      AuthService.getAppConfig = function () {
        if ($rootScope.appConfig) {
          return $q.resolve($rootScope.appConfig);
        }
        return $http.get(Helper.baseUrl + '/api/v1/appConfig')
          .then(function (res) {
            $rootScope.appConfig = res.data;
            if (connectorIFrame && !connectorIFrame.src) {
              connectorIFrame.src = $rootScope.appConfig.ACCOUNTS_CONNECTOR_URL;
            }
            return $q.resolve(res.data);
          }).catch(function (err) {
            return $q.reject(err);
          });
      };

      return AuthService;

    }]);
