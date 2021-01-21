'use strict';

angular.module('topcoderX')
  .controller('ProjectsController', ['currentUser', '$scope', '$state', 'ProjectService', '$filter', '$rootScope', 'Alert', 'Helper', '$timeout',
    function (currentUser, $scope, $state, ProjectService, $filter, $rootScope, Alert, Helper, $timeout) {
      //Current title
      $scope.title = 'Project Management';

      //direct base
      $scope.connectUrlBase = $rootScope.appConfig.CONNECT_URL_BASE;
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
          $scope.allProjects = angular.copy($scope.projects);
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

      $scope.repoType = function (repo) {
        if (repo.toLocaleLowerCase().indexOf("github") >= 0) {
          return "Github";
        }
        else if (repo.toLocaleLowerCase().indexOf("gitlab") >= 0) {
          return "Gitlab";
        }
        else {
          return "Other";
        }
      };

      $scope.init = function () {
        $('.footable').footable();
      };
      $scope.init();
      $scope.toggleShowAll = function () {
        $scope.filter.showAll = !$scope.filter.showAll;
        $scope.getProjects($scope.state.status);
      };


      $scope.onSearchChange = function (obj) {
        $scope.searchText = obj.searchText;
        if (!obj.searchText || obj.searchText.length === 0) {
          $scope.getProjects($scope.state.status);
        }

        if ($scope.allProjects.length > 0) {
            _searchLocal(obj.searchText);
        }
      };

      $scope.onSearchIconClicked = function () {
        if ($scope.allProjects.length > 0 && $scope.searchText) {
            _searchLocal($scope.searchText);
        }
      };

      function _searchLocal(query) {
        $scope.projects = $scope.allProjects.filter(function(value) {
          return value['title'].toLowerCase().includes(query.toLowerCase());
        })
        $timeout(function () {
          $('.footable').filter('[data-page="0"]').trigger('click');
        }, 1000);
      }

  }]);
