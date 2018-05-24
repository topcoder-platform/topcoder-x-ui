'use strict';

angular.module('topcoderX')
  .controller('LoginController', ['$scope', '$q', '$state', 'AuthService', function ($scope, $q, $state, AuthService) {
    $scope.logginOut = false;
    $scope.errorMessage = '';

    function onLogOut() {
      AuthService.login();
      // we could stop loggin out indicator but we don't do it, because redirecting doesn't happen immediately
      // so we keep showing loging out indicator even if log out already complete
      // anyway we go from this page
    }

    // if we come to this page and user is logged in, and we are not loggin out
    // then we shouldn't be on this page so we redirect to index
    if (AuthService.isLoggedIn() && !AuthService.logginOut) {
      $state.go('app.main');

      // if we are loggin out currently, then show "loggin out..." message
    } else if (AuthService.logginOut) {
      $scope.logginOut = true;
      AuthService.logginOut.then(onLogOut);

      // as we come to this page after AuthService.authenticate()
      // the only one case when we can come to this page now if access was denied for current user
      // so we show permissions denied error
    } else {
      $scope.errorMessage = AuthService.ERROR.NO_PERMISSIONS;
    }

    $scope.logout = function () {
      $scope.errorMessage = '';
      $scope.logginOut = true;
      AuthService.logout().then(onLogOut);
    }

  }]);
