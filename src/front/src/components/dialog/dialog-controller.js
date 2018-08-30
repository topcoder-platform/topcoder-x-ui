'use strict';

angular.module('topcoderX')
  .controller('DialogController', ['$scope', '$rootScope', function ($scope, $rootScope) {
    $scope.dialog = null;

    $scope.proceed = function () {
      $scope.dialog = null;
      $rootScope.dialog.proceed = true;
      $rootScope.$broadcast('dialog.finished', { proceed: true });
    };
    $scope.close = function () {
      $scope.dialog = null;
      $rootScope.$broadcast('dialog.finished', { proceed: false });
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
