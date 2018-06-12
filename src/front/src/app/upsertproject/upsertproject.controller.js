/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is the upsertproject controller.
 */
'use strict';

angular.module('topcoderX').controller('ProjectController', ['currentUser', '$scope', '$timeout', 'ProjectService',
  '$rootScope', '$state', 'Alert', function (currentUser, $scope, $timeout, ProjectService, $rootScope, $state, Alert) {

    //Maintain the navigation state.
    $timeout(function () {
      angular.element('#projectsManagement').addClass('active');
    }, 0);

    //below logic is trying to identify whether we are editing a project
    $scope.editing = true;
    $scope.project = {
      'title': '',
      'tcDirectId': '',
      'repoUrl': '',
      'rocketChatWebhook': null,
      'rocketChatChannelName': null,
      'archived': false
    };
    if ($rootScope.project) {
      $scope.title = 'Edit a Project';
      $scope.project = $rootScope.project;
      $scope.project.id = $rootScope.project.id;
      $scope.editing = true;
    } else {
      $scope.title = 'Add a Project';
      $scope.editing = false;
    }

    //represents the repo owner
    $scope.repoOwner = '';

    //represents the repo name
    $scope.repoName = '';

    //represents the repo is located at github or gitlab
    $scope.repoType = '';

    //function to get the repo's owner and the repo's name based on repoUrl
    const getRepoDetail = function (repoUrl, callback, errorCallBack) {
      $scope.$broadcast('alert.ClearAll', {});
      if (repoUrl.endsWith('/')) {
        repoUrl = repoUrl.slice(0, -1);
      }
      const results = repoUrl.split('/');
      $scope.repoName = results[results.length - 1];
      $scope.repoOwner = results[results.length - 2];
      $scope.repoType = results[results.length - 3].split('.')[0];
      ProjectService.getUserToken($scope.repoOwner, $scope.repoType).then(function (response) {
        if (angular.isDefined(response.data.token)) {
          $scope.token = response.data.token;
          return callback();
        } else {
          const erroMessage = 'Token not found for the user ' + $scope.repoOwner + ' of type ' + $scope.repoType + ' please complete profile setting';
          Alert.error(erroMessage, $scope);
        }
      }, function (error) {
        errorCallBack(error);
      });
    };

    //function to add labels to the current project.
    $scope.addLabels = function () {
      getRepoDetail($scope.project.repoUrl, function () {
        // for (var i = 0; i < $rootScope.config.LABELS.length; i++) {
        var objc = {
          'repoOwner': $scope.repoOwner,
          'repoName': $scope.repoName,
          'repoToken': $scope.token,
         
          'repoType': $scope.repoType
        };
        ProjectService.createLabel(objc).then(function () {
          Alert.info('Label Added Successfully', $scope);
        }).catch(function (error) {
          Alert.error(error.data.message, $scope);
        });
        // }
      }, function (error) {
        Alert.error(error.data.message, $scope);
      });
    };

    //function to add hooks to the current project.
    $scope.addHooks = function () {
      getRepoDetail($scope.project.repoUrl, function () {
        var objc = {
          'repoOwner': $scope.repoOwner,
          'repoName': $scope.repoName,
          'repoToken': $scope.token,
          'repoType': $scope.repoType,
          'projectId': $scope.project.id
        };
        ProjectService.createHooks(objc).then(function () {
          Alert.info('Webhook Added Successfully', $scope);
        }).catch(function (error) {
          Alert.error(error.data.message, $scope);
        });
      }, function (error) {
        Alert.error(error.data.message, $scope);
      });
    };

    //save the project info to database, and go back to project list view.
    $scope.save = function () {
      $scope.project.username = $rootScope.currentUser.handle;
      if ($scope.editing) {
        ProjectService.update($scope.project).then(function () {
          Alert.info('Project Updated Successfully', $scope);
          $state.go('app.projects');
        }).catch((function (error) {
          Alert.error(error.data.message, $scope);
        }))
      } else {
        ProjectService.create($scope.project).then(function () {
          Alert.info('Project Created Successfully', $scope);
          $state.go('app.projects');
        }).catch(function (error) {
          Alert.error(error.data.message, $scope);
        })
      }
    }
  }]);
