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
    if ($scope.provider === 'github') {
      $scope.accessLevel = 'member';
    } else {
      $scope.accessLevel = '30';
    }

    /**
     * Update the access level
     */
    $scope.updateAccessLevel = function (accessLevel) {
      $scope.accessLevel = accessLevel;
    };

    /**
     * Set changes to father controller
     */
    $scope.setChanges = function () {
      $uibModalInstance.close({
        accessLevel: $scope.accessLevel,
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
