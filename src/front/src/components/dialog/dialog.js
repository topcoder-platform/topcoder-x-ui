'use strict';

angular.module('topcoderX')
  .factory('Dialog', ['$log', '$rootScope', function ($log, $rootScope) {
    var Dialog = function (message) {
      this.message = message;
    };

    Dialog.display = function (dialog, $scope) {
      Dialog.clear($scope);
      $log.debug('Dialog#dialog::message:' + dialog.message);
      var scope = $scope || $rootScope;
      scope.$broadcast('dialog.DialogIssued', dialog);
    };
    // show confirmation dialog
    Dialog.show = function (message, $scope) {
      Dialog.display(new Dialog(message), $scope);
    };

    Dialog.clear = function ($scope) {
      var scope = $scope || $rootScope;
      scope.$broadcast('dialog.Clear', {});
    };

    return Dialog;
  }
  ]);

