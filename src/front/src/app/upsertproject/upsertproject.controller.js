/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is the upsertproject controller.
 */
'use strict';

angular.module('topcoderX').controller('ProjectController', ['currentUser', '$scope', '$timeout', 'ProjectService',
  '$rootScope', '$state', 'Alert', '$uibModal', 'Helper', 'Tutorial', '$window',
  function (currentUser, $scope, $timeout, ProjectService, $rootScope, $state,
    Alert, $uibModal, Helper, Tutorial, $window) {
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
      createCopilotPayments: false
    };
    $scope.connectProjects = [];
    if ($rootScope.project) {
      $scope.title = 'Manage a Project';
      $scope.project = $rootScope.project;
      $scope.project.id = $rootScope.project.id;
      $scope.project.copilot = $rootScope.project.copilot;
      $scope.project.owner = $rootScope.project.owner;
      $scope.project.repoUrl = $rootScope.project.repoUrls.join(',');
      $scope.editing = true;
      if ($rootScope.project.tcDirectId) {
        ProjectService.getConnectProject($rootScope.project.tcDirectId).then(function (resp) {
          var connectProject = {
            id: resp.data.id,
            name: resp.data.name
          };
          $scope.connectProjects.unshift(connectProject);
        });
      }
    } else {
      $scope.title = 'Add a Project';
      $scope.editing = false;
    }

    $scope.isAdminUser = Helper.isAdminUser(currentUser);
    $scope.loadingConnectProjects = true;

    $scope.fetchConnectProjects = function($event) {
      if (!$event) {
        $scope.page = 1;
        $scope.connectProjects = [];
      } else {
        $event.stopPropagation();
        $event.preventDefault();
        $scope.page++;
      }
      if ($scope.page === 500) {
        $scope.loadingConnectProjects = false;
        return;
      }
      $scope.loadingConnectProjects = true;
      ProjectService.getConnectProjects(20, $scope.page).then(function(resp) {
        var projects = resp.data.filter(function (p) {
          return $rootScope.project && $rootScope.project.tcDirectId ? p.id !== $rootScope.project.tcDirectId : true;
        });
        $scope.connectProjects = $scope.connectProjects.concat(projects);
      })['finally'](function() {
        $scope.loadingConnectProjects = false;
      });
    };
    $scope.fetchConnectProjects();

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

    var tutorial = $window.localStorage.getItem('tutorial');

    // save the project info to database, and go back to project list view.
    $scope.save = function () {
      if (tutorial) {
        $window.localStorage.removeItem('tutorial');
      }
      if ($scope.project.copilot === '') {
        $scope.project.copilot = null;
      }
      if ($scope.editing) {
        ProjectService.update($scope.project).then(function () {
          Alert.info('Project Updated Successfully', $scope);
          setTimeout(function() {
            $state.go('app.projects');
          }, 3000);
        }).catch(function (error) {
          Alert.error(error.data.message, $scope);
          setTimeout(function() {
            $state.go('app.projects');
          }, 3000);
        });
      } else {
        ProjectService.create($scope.project).then(function () {
          Alert.info('Project has been added successfully, and Topcoder X issue labels, webhook, and wiki rules have been added to the repository', $scope);
          setTimeout(function() {
            $state.go('app.projects');
          }, 3000);
        }).catch(function (error) {
          Alert.error(error.data.message, $scope);
          setTimeout(function() {
            $state.go('app.projects');
          }, 3000);
        });
      }
    };

    $scope.openRecreateDialog = function () {
      $uibModal.open({
        size: 'md',
        templateUrl: 'app/upsertproject/recreate-dialog.html',
        controller: 'RecreateDialogController',
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

    if (tutorial) {
        setTimeout(function() {
            var dialog = {
                message: 'Add your first project. Fill the project name, Direct ID, Repo URL of your Gitlab/Github Repository and the copilot.',
                action: 'close'
            };
            Tutorial.show(dialog, $scope);
        }, 2500);
    }

  }]);
