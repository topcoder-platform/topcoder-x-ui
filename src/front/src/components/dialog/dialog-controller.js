'use strict';

angular.module('topcoderX')
  .controller('DialogController', ['$scope', '$rootScope', function ($scope, $rootScope) {
    $scope.dialog = null;

    $scope.proceed = function () {
      $scope.dialog = null;
      $rootScope.dialog.proceed = true;
    };
    $scope.close = function () {
      $scope.dialog = null;
    };
    $scope.addDialog = function (dialog) {
      $scope.dialog = dialog;
    };
    $scope.$on('dialog.DialogIssued', function (event, dialog) { /*eslint-disable-line no-unused-vars*/
      $scope.addDialog(dialog);
    });
    $scope.$on('dialog.Clear', function (event, dialog) { /*eslint-disable-line no-unused-vars*/
      $scope.currentEvent = event;
      $scope.dialog = null;
    });
  }
  ]);
