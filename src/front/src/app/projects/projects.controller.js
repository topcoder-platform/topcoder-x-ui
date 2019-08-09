'use strict';

angular.module('topcoderX')
  .controller('ProjectsController', ['currentUser', '$scope', '$state', 'ProjectService', '$filter', '$rootScope', 'Alert', 'Helper', '$timeout',
    function (currentUser, $scope, $state, ProjectService, $filter, $rootScope, Alert, Helper, $timeout) {
      //Current title
      $scope.title = 'Project Management';

      //direct base
      $scope.directUrlBase = Helper.config().DIRECT_URL_BASE;
      $scope.isAdminUser = Helper.isAdminUser(currentUser);
      $scope.filter = {
        showAll: $scope.isAdminUser,
      };
      $scope.state = {
        status: 'active',
      };

      //go to a project detail
      $scope.goProject = function (project) {
        if (project) {
          $rootScope.project = project;
        } else {
          $rootScope.project = null;
        }
        $state.go('app.project');
      };

      //go to a add issue page
      $scope.goIssue = function () {
        $state.go('app.issue');
      };

      //the actived project list
      $scope.projects = [];
      //the archived project list
      $scope.archivedProjects = [];

      //private function to hide all areas of ui.
      var hideAll = function () {
        $scope.archiveShow = false;
        $scope.isLoaded = false;
        $scope.errorShow = false;
      };
      hideAll();

      //private function to get projects.
      $scope.getProjects = function (status) {
        $scope.state.status = status;
        $scope.isLoaded = false;
        $scope.projects = [];
        ProjectService.getProjects(status, $scope.filter.showAll).then(function (response) {
          $scope.isLoaded = true;
          $scope.projects = response.data;
          $timeout(function () {
            $scope.init();
          }, 1000);
        }).catch(function (error) {
          $scope.isLoaded = true;
          if (error.data) {
            Alert.error(error.data.message, $scope);
          } else {
            Alert.error('An error occurred while getting project data', $scope);
          }
        });
      };
      $scope.getProjects('active');

      $scope.repoType = function (repo) {
        return (repo.toLocaleLowerCase().indexOf("gitlab") >= 0 ? "Gitlab" : "Github");
      };

      $scope.init = function () {
        $('.footable').footable();
      };
      $scope.init();
      $scope.toggleShowAll = function () {
        $scope.filter.showAll = !$scope.filter.showAll;
        $scope.getProjects($scope.state.status);
      };
    }]);
