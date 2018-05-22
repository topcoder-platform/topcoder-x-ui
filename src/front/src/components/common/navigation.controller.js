'use strict';

angular.module('topcoderX')
  .controller('NavController', ['$scope', '$state', function ($scope, $state) {
    $scope.$state = $state;
    $scope.menuList = false;

    $scope.forceStateProjects = function () {
      $state.go('app.projects');
    };

    $scope.menuOpen = function () {
      $scope.menuList = !$scope.menuList;
    }

    // Click menu item go to another page will close the menu as well
    angular.element(document.querySelectorAll("a[ui-sref]")).bind('click', $scope.menuOpen);
  }]);
