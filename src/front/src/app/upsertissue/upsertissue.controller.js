/*
 * Copyright (c) 2018 TopCoder, Inc. All rights reserved.
 *
 * This is the upsertproject controller.
 */
'use strict';

angular.module('topcoderX').controller('IssueController', ['currentUser', '$scope', '$timeout', 'ProjectService', 'IssueService',
  '$rootScope', '$state', 'Alert',
  function (currentUser, $scope, $timeout, ProjectService, IssueService, $rootScope, $state,
    Alert) {
    // Maintain the navigation state.
    $timeout(function () {
      angular.element('#projectsManagement').addClass('active');
    }, 0);

    // get topcoderx projects
    $scope.getProjects = function () {
      ProjectService.getProjects('active', false).then(function (response) {
        $scope.projects = response.data;
        if ($scope.projects.length === 0) {
          _handleError({}, 'There are no projects in Topcoder-X. Please <a href="/#/app/upsertproject">Create a project</a> first.');
        }
      }).catch(function (error) {
        _handleError(error, 'There are no projects in Topcoder-X. Please <a href="/#/app/upsertproject">Create a project</a> first.');
      });
    };
    $scope.getProjects();

    // handle error output
    function _handleError(error, defaultMsg) {
      const errMsg = error.data ? error.data.message : defaultMsg;
      Alert.error(errMsg, $scope);
    }

    $scope.selectedProject = null;
    $scope.issue = {
      projectId: '',
      prize: null,
      title: '',
      comment: '',
      repoUrl: ''
    };
    $scope.title = 'Add an Issue';

    // save the issue info.
    $scope.save = function () {
      const selectedProject = angular.fromJson($scope.selectedProject);
      $scope.issue.projectId = selectedProject.id;
      $scope.issue.repoUrl = selectedProject.repoUrl;

      IssueService.create($scope.issue).then(function (response) {
        $scope.selectedProject = null;
        $scope.issue = {
          projectId: '',
          prize: null,
          title: '',
          comment: '',
          repoUrl: ''
        };
        Alert.info('<a href="' + response.data.url+ '" target="_blank"><b><u>Issue #' + response.data.number + '</u></b></a> has been created', $scope);
      }).catch(function (error) {
        Alert.error(error.data.message, $scope);
      });
    };
  }]);
