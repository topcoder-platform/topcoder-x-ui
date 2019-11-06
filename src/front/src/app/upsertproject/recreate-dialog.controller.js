// controller for transfer ownership dialog
'use strict';

angular.module('topcoderX')
  .controller('RecreateDialogController', [
    '$scope', '$rootScope', '$state', '$uibModalInstance', 'IssueService', 'Alert', 'appConfig', 'project',
    function ($scope, $rootScope, $state, $uibModalInstance, IssueService, Alert, appConfig, project) {
      // The user list
      $scope.project = project;
      $scope.appConfig = appConfig;

      /**
       * transfer the ownership
       */
      $scope.recreate = function () {
        if (!$scope.url) {
          Alert.error('The ticket URL is required', $scope);
          return;
        }
        var issueNumber;
        var ticketURL = new URL($scope.url);
        if (ticketURL.pathname) {
          var paths = ticketURL.pathname.split('/');
          if (paths && paths.length > 0) {
            issueNumber = parseInt(paths[paths.length - 1], 10);
          }
        } 
        if (!issueNumber) {
          Alert.error('The ticket URL is not valid', $scope);
          return;
        }
        var issue = {
          projectId: $scope.project.id,
          url: $scope.url,
          number: issueNumber,
          recreate: $scope.isRecreate === 1
        };
        IssueService.recreate(issue).then(function () {
          Alert.info('<a href="' + $scope.url+ '" target="_blank"><b><u>Issue #' + issue.number + '</u></b></a> has been recreated', $scope);
          $rootScope.project = project;
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
