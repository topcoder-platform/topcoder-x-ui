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
    $scope.invalidExpiredAt = false;
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
      if ($scope.expiredAt && !isValidDate($scope.expiredAt)) {
        $scope.invalidExpiredAt = true
      }
      else {
        $uibModalInstance.close({
          accessLevel: $scope.accessLevel,
          expiredAt: $scope.expiredAt
        });
      }
    };

    /**
    * Close dialog
    */
    $scope.close = function () {
      $uibModalInstance.close();
    };

    // Validates that the input string is a valid date formatted as "yyyy-MM-dd"
    function isValidDate(dateString) {
      return /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/.test(dateString)
    };
  },
]);
