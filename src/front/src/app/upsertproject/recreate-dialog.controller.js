// controller for transfer ownership dialog
'use strict';

angular.module('topcoderX')
  .controller('RecreateDialogController', [
    '$scope', '$rootScope', '$state', '$uibModalInstance', 'IssueService', 'Alert', 'appConfig', 'project', '$log',
    function ($scope, $rootScope, $state, $uibModalInstance, IssueService, Alert, appConfig, project, $log) {
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
        $log.log($scope.url);
        var ticketURL = new URL($scope.url);
        $log.log(ticketURL);
        if (ticketURL.pathname) {
          $log.log('asda');
          var paths = ticketURL.pathname.split('/');
          $log.log(paths);
          if (paths && paths.length > 0) {
            $log.log('fafa');
            issueNumber = parseInt(paths[paths.length - 1], 10);
            $log.log(issueNumber);
          }
        } 
        if (!issueNumber) {
          Alert.error('The ticket URL is not valid', $scope);
          return;
        }
        var issue = {
          projectId: $scope.project.id,
          url: $scope.url,
          number: issueNumber
        };
        IssueService.recreate(issue).then(function () {
          Alert.info('<a href="' + $scope.url+ '" target="_blank"><b><u>Issue #' + issue.number + '</u></b></a> has been recreated', $scope);
          $rootScope.project = project;
          $uibModalInstance.close();
        }).catch(function (error) {
          Alert.error(error.data.message, $scope);
        });
  
        // ProjectService.transferOwnership($scope.project.id, $scope.owner).then(function () {
        //   Alert.info('Project ownership is transferred Successfully', $rootScope);
        //   $rootScope.project = project;
        //   $rootScope.project.owner = $scope.owner;
        //   $state.go('app.project');
        //   $uibModalInstance.close();
        // }).catch(function (error) {
        //   Alert.error(error.data.message, $scope);
        // });
      };

      /**
       * Close dialog
       */
      $scope.close = function () {
        $uibModalInstance.close();
      };
    },
  ]);
