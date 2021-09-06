'use strict';

angular.module('topcoderX')
  .controller('ProjectsController', ['currentUser', '$scope', '$state', 'ProjectService', '$filter', '$rootScope', 'Alert', 'Helper',
    function (currentUser, $scope, $state, ProjectService, $filter, $rootScope, Alert, Helper) {
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
      $scope.tableConfig = {
        pageNumber: 1,
        pageSize: 10,
        isLoading: false,
        initialized: false,
        query: '',
        lastKey: [],
        pages: 1
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
        ProjectService.getProjects(
          status, $scope.filter.showAll, 
          $scope.tableConfig.pageSize, $scope.tableConfig.lastKey[$scope.tableConfig.pageNumber],
          $scope.tableConfig.query).then(function (response) {
          var config = $scope.tableConfig;

          if (config.query) {
            config.allItems = response.data.docs;
            $scope.projects = config.allItems.slice(0, config.pageSize);
            config.pages = Math.ceil(config.allItems.length / config.pageSize);
          }
          else {
            $scope.projects = response.data.docs;
          }
          if (response.data.lastKey) {
            config.lastKey[config.pageNumber + 1] = response.data.lastKey;
            if (!config.pages || config.pages <= config.pageNumber) {
              config.pages = config.pageNumber + 1;
            }
          }
          $scope.isLoaded = true;
        }).catch(function (error) {
          $scope.isLoaded = true;
          if (error.data) {
            Alert.error(error.data.message, $scope);
          } else {
            Alert.error('An error occurred while getting project data', $scope);
          }
        });
      };

      /**
       * get the number array that shows the pagination bar
       */
      $scope.getPageArray = function () {
        var res = [];

        var pageNo = $scope.tableConfig.pageNumber;
        var i = pageNo - 5;
        for (i; i <= pageNo; i++) {
          if (i > 0) {
            res.push(i);
          }
        }
        var j = pageNo + 1;
        for (j; j <= $scope.tableConfig.pages && j <= pageNo + 5; j++) {
          res.push(j);
        }
        return res;
      };
      
      /**
       * handles the change page click
       * @param {Number} pageNumber the page number
       */
      $scope.changePage = function (pageNumber) {
        if (pageNumber === 0 || pageNumber > $scope.tableConfig.pages ||
          (pageNumber === $scope.tableConfig.pages &&
            $scope.tableConfig.pageNumber === pageNumber)) {
              return false;
        }
        $scope.tableConfig.pageNumber = pageNumber;
        if ($scope.tableConfig.query && $scope.tableConfig.allItems) {
          var start = ($scope.tableConfig.pageNumber - 1) * $scope.tableConfig.pageSize - 1;
          if (pageNumber === 1) {
            start = 0;
          }
          $scope.projects = $scope.tableConfig.allItems.slice(
            start, $scope.tableConfig.pageSize);
          $scope.isLoaded = true;
        }
        else {
          $scope.getProjects($scope.state.status);
        }
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

      $scope.onSearchIconClicked = function () {
        $scope.tableConfig.pageNumber = 1;
        $scope.tableConfig.pages = 1;
        $scope.tableConfig.allItems = [];
        $scope.getProjects($scope.state.status);
      };

      $scope.onSearchReset = function () {
        var config = $scope.tableConfig;
        config.query = '';
        config.pageNumber = 1;
        config.pages = 1;
        config.allItems = [];
        $scope.getProjects($scope.state.status);
      };
  }]);
