/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is the upsertproject controller.
 */
'use strict';

angular.module('topcoderX').controller('ProjectController', ['currentUser', '$scope', '$timeout', 'ProjectService',
  '$rootScope', '$state', 'Alert', '$uibModal', 'Helper',
  function (currentUser, $scope, $timeout, ProjectService, $rootScope, $state,
    Alert, $uibModal, Helper) {
    // Maintain the navigation state.
    $timeout(function () {
      angular.element('#projectsManagement').addClass('active');
    }, 0);

    // below logic is trying to identify whether we are editing a project
    $scope.editing = true;
    $scope.project = {
      title: '',
      tcDirectId: '',
      repoUrl: '',
      copilot: currentUser.roles.indexOf($rootScope.appConfig.copilotRole) > -1 ? currentUser.handle : '',
      rocketChatWebhook: null,
      rocketChatChannelName: null,
      archived: false,
    };
    if ($rootScope.project) {
      $scope.title = 'Edit a Project';
      $scope.project = $rootScope.project;
      $scope.project.id = $rootScope.project.id;
      $scope.project.copilot = $rootScope.project.copilot;
      $scope.project.owner = $rootScope.project.owner;
      $scope.editing = true;
    } else {
      $scope.title = 'Add a Project';
      $scope.editing = false;
    }

    $scope.isAdminUser = Helper.isAdminUser(currentUser);

    // function to add labels to the current project.
    $scope.addLabels = function () {
      ProjectService.createLabel({ projectId: $scope.project.id }).then(function () {
        Alert.info('Label Added Successfully', $scope);
      }).catch(function (error) {
        Alert.error(error.data.message, $scope);
      });
    };

    // function to add hooks to the current project.
    $scope.addHooks = function () {
      ProjectService.createHooks({ projectId: $scope.project.id }).then(function (result) {
        if (result && result.data.updated === true) {
            Alert.info('Existing Webhook Updated Successfully', $scope);
        }
        else {
          Alert.info('Webhook Added Successfully', $scope);
        }

      }).catch(function (error) {
        Alert.error(error.data.message, $scope);
      });
    };

    // function to add wiki rules to the current project
    $scope.addWikiRules = function () {
      ProjectService.addWikiRules({ projectId: $scope.project.id }).then(function () {
        Alert.info('Wiki Rules Added Successfully', $scope);
      }).catch(function (error) {
        Alert.error(error.data.message, $scope);
      });
    };

    // save the project info to database, and go back to project list view.
    $scope.save = function () {
      if ($scope.project.copilot === '') {
        $scope.project.copilot = null;
      }
      if ($scope.editing) {
        ProjectService.update($scope.project).then(function () {
          Alert.info('Project Updated Successfully', $scope);
          $state.go('app.projects');
        }).catch(function (error) {
          Alert.error(error.data.message, $scope);
        });
      } else {
        ProjectService.create($scope.project).then(function () {
          Alert.info('Project Created Successfully', $scope);
          $state.go('app.projects');
        }).catch(function (error) {
          Alert.error(error.data.message, $scope);
        });
      }
    };

    $scope.openTransferOwnershipDialog = function () {
      $uibModal.open({
        size: 'md',
        templateUrl: 'app/upsertproject/transfer-ownership-dialog.html',
        controller: 'TransferOwnershipDialogController',
        resolve: {
          currentUser: function () {
            return currentUser;
          },
          appConfig: function () {
            return $rootScope.appConfig;
          },
          project: function () {
            return $scope.project;
          },
        },
      });
    };
  }]);
