// controller for transfer ownership dialog
'use strict';

angular.module('topcoderX')
  .controller('TransferOwnershipDialogController', [
    '$scope', '$rootScope', '$state', '$uibModalInstance', 'ProjectService', 'Alert', 'currentUser', 'appConfig', 'project',
    function ($scope, $rootScope, $state, $uibModalInstance, ProjectService, Alert, currentUser, appConfig, project) {
      // The user list
      $scope.project = project;
      $scope.appConfig = appConfig;
      $scope.owner = angular.copy(project.owner);
      /**
       * transfer the ownership
       */
      $scope.transferOwnership = function () {
        if (!$scope.owner) {
          Alert.error('Topcoder handle is required', $scope);
          return;
        }
        ProjectService.transferOwnership($scope.project.id, $scope.owner).then(function () {
          Alert.info('Project ownership is transferred Successfully', $scope);
          $rootScope.project = project;
          $rootScope.project.owner = $scope.owner;
          $state.go('app.project');
          $uibModalInstance.close();
        }).catch(function (error) {
          Alert.error(error.data.message, $scope);
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
