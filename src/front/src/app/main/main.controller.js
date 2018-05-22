'use strict';

angular.module('topcoderX')
  .controller('MainController', ['$scope', '$rootScope', '$timeout', '$state', 'AuthService',
    function ($scope, $rootScope, $timeout, $state, AuthService) {
      $rootScope.currentUser = AuthService.getCurrentUser();

      $scope.logout = function () {
        AuthService.logout();
        $state.go('auth')
      };

      // auth
      $scope.authorized = function () {
        return AuthService.isLoggedIn();
      };
    }
  ]);
