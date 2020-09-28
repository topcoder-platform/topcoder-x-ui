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
      Object.keys(decodedToken).findIndex(function (key) {
        if (key.includes('roles')) {
          if (key.indexOf('copilot') > -1) {
            $scope.user['copilot'] = true;
            $log.info('User is a copilot');
          } else {
            $log.info('user is not a copilot');
          }
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
