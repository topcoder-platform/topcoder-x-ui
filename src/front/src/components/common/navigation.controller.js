'use strict';

angular.module('topcoderX') // eslint-disable-line angular/no-services
  .controller('NavController', ['$scope', '$log', '$state', '$cookies', 'jwtHelper', '$rootScope',
    function ($scope, $log, $state, $cookies, jwtHelper, $rootScope) {
      $scope.$state = $state;
      $scope.menuList = false;
      $scope.user = {};
      $scope.appConfig = $rootScope.appConfig;

      const token = $cookies.get('tcjwt');
      const decodedToken = jwtHelper.decodeToken(token);
      $scope.user = {};
      $scope.user['copilot'] = false;
      $scope.user['admin'] = false;
      Object.keys(decodedToken).findIndex(function (key) {
        if (key.includes('roles')) {
          if (key.indexOf('copilot') > -1 || decodedToken[key].includes('copilot')) {
            $scope.user['copilot'] = true;
            $log.info('User is a copilot');
          } else {
            $log.info('user is not a copilot');
          }

          var administratorRoles = $rootScope.appConfig.administratorRoles.map(function (x) {
            return x.toLowerCase();
          });
          administratorRoles.forEach(function (administratorRole) {
            if (decodedToken[key].includes(administratorRole)) {
              $scope.user['admin'] = true;
              $log.info('User is an admin');
            }
          });
          return true;
        }
        return false;
      });

      $scope.forceStateProjects = function () {
        $state.go('app.projects');
      };

      $scope.menuOpen = function () {
        $scope.menuList = !$scope.menuList;
      };

      // Click menu item go to another page will close the menu as well
      angular.element(document.querySelectorAll("a[ui-sref]")).bind('click', $scope.menuOpen);
    }]);
