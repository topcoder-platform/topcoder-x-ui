'use strict';

angular.module('topcoderX')
  .controller('AlertController', ['$scope', function ($scope) {
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
      $scope.alerts.splice(index, 1);
    };

    $scope.addAlert = function (alert) {
      $scope.alert = [];
      $scope.alerts.push(alert);
    };

    $scope.$on('alert.AlertIssued', function (event, alert) {
      $scope.addAlert(alert);
    });

    $scope.$on('alert.ClearAll', function (event, alert) { /*eslint-disable-line no-unused-vars*/
      $scope.alerts.length = 0;
    });
  }]);
