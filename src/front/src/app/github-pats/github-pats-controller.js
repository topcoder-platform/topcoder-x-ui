'use strict';

angular.module('topcoderX')
  .controller('GithubPATsController', ['$scope', '$rootScope', '$state', 'GithubPATsService', '$filter', 'Alert', 'Dialog',
    function ($scope, $rootScope, $state, GithubPATsService, $filter, Alert, Dialog) {
      $scope.title = 'Github Personal Access Token';
      $scope.topcoderUrl = '';

      $scope.tableConfig = {
        pageNumber: 1,
        pageSize: 20,
        isLoading: false,
        sortBy: 'name',
        sortDir: 'desc',
        totalPages: 1,
        initialized: false
      };

      $scope.addPAT = function () {
        $state.go('app.addPAT');
      };

      /**
       * gets the pat
       */
      $scope.getPATs = function () {
        var config = $scope.tableConfig;
        config.isLoading = true;
        GithubPATsService.search(config.sortBy, config.sortDir, config.pageNumber, config.pageSize)
          .then(function (res) {
            config.items = res.data.docs;
            config.pages = res.data.pages;
            config.initialized = true;
            config.isLoading = false;
          }).catch(function (err) {
            config.isLoading = false;
            config.initialized = true;
            _handleError(err, 'An error occurred while getting the data for.');
          });
      };

      $scope.getPATs();

      // handle errors
      function _handleError(error, defaultMsg) {
        var errMsg = error.data ? error.data.message : defaultMsg;
        Alert.error(errMsg, $scope);
      }

      /**
       * delete a pat item byId
       * @param {Number} id pat id
       */
      function _handleDeletePAT(id) {
        GithubPATsService.delete(id).then(function () {
          Alert.info('Successfully deleted PAT.', $scope);
          $rootScope.dialog = null;
          $scope.getPATs();
        }).catch(function (er) {
          _handleError(er, 'Error deleting pat.');
        });
      }

      $scope.deletePAT = function (pat) {
        $rootScope.dialog = {
          patId: pat.id,
          proceed: false,
        };

        // $log.warn(watcher, $scope);
        $scope.$on('dialog.finished', function (event, args) {
          if (args.proceed) {
            _handleDeletePAT($rootScope.dialog.patId);
          } else {
            $rootScope.dialog = {};
          }
        });
        Dialog.show('Are you sure you want to delete this PAT?', $scope);
      };

      /**
       * handles the sort click
       * @param criteria the criteria
       */
      $scope.sort = function (criteria) {
        if (criteria === $scope.tableConfig.sortBy) {
          if ($scope.tableConfig.sortDir === 'asc') {
            $scope.tableConfig.sortDir = 'desc';
          } else {
            $scope.tableConfig.sortDir = 'asc';
          }
        } else {
          $scope.tableConfig.sortDir = 'asc';
        }
        $scope.tableConfig.sortBy = criteria;
        $scope.tableConfig.pageNumber = 1;
        $scope.getPATs();
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
        $scope.getPATs();
      };

      /**
       * handles the tab change click
       */
      $scope.tabChanged = function () {
        $scope.tableConfig.sortBy = 'project';
        $scope.tableConfig.sortDir = 'desc';
        $scope.tableConfig.pageNumber = 1;
        $scope.tableConfig.initialized = false;
        $scope.getPATs();
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

      function onInit() {
        const domain = window.location.origin;
        if (domain.includes('.topcoder-dev.com')) {
          $scope.topcoderUrl = 'https://topcoder-dev.com';
        } else {
          $scope.topcoderUrl = 'https://topcoder.com';
        }
      }

      onInit();
    }
  ]);
