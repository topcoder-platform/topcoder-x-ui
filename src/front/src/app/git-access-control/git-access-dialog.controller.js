// controller for transfer ownership dialog
'use strict';

angular.module('topcoderX').controller('GitAccessDialogController', [
  '$scope',
  '$uibModalInstance',
  'provider',
  function (
    $scope,
    $uibModalInstance,
    provider
  ) {
    $scope.provider = provider;
    $scope.accessLevel = '';
    $scope.expiredAt = '';
    if ($scope.provider === 'github') {
      $scope.accessLevel = 'member';
    } else {
      $scope.accessLevel = '30';
      $scope.dateLimit = new Date().toDateString();
    }

    /**
     * Update the access level
     */
    $scope.updateAccessLevel = function (accessLevel) {
      $scope.accessLevel = accessLevel;
    };

    /**
     * Update the expired at params
     */
    $scope.updateExpired = function (expiredAt) {
      $scope.expiredAt = expiredAt;
    };

    /**
     * Set changes to father controller
     */
    $scope.setChanges = function () {
      $uibModalInstance.close({
        accessLevel: $scope.accessLevel,
        expiredAt: $scope.expiredAt
      });
    };

    /**
    * Close dialog
    */
    $scope.close = function () {
      $uibModalInstance.close();
    };
  },
]);
