'use strict';

angular.module('topcoderX')
  .controller('ProjectsController', ['$scope', '$state', 'ProjectService', '$filter', '$rootScope', 'Alert', 'Helper',
    function ($scope, $state, ProjectService, $filter, $rootScope, Alert, Helper) {
      //Current title
      $scope.title = 'Project Management';

      //direct base
      $scope.directUrlBase = Helper.config().DIRECT_URL_BASE;

      //go to a project detail
      $scope.goProject = function (project) {
        if (project) {
          $rootScope.project = project;
        } else {
          $rootScope.project = null;
        }
        $state.go('app.project');
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
        $scope.isLoaded = false;
        $scope.projects = [];
        ProjectService.getProjects(status).then(function (response) {
          $scope.isLoaded = true;
          $scope.projects = response.data;
          $('.footable').trigger('footable_initialize');
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
    }]);
