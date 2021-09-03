'use strict';

angular.module('topcoderX')
  .controller('UserMappingsController', ['$scope', '$rootScope', '$state', 'UserMappingsService', '$filter', 'Alert', 'Dialog',
    function ($scope, $rootScope, $state, UserMappingsService, $filter, Alert, Dialog) {
      $scope.title = 'Github Personal Access Token';
      $scope.topcoderUrl = '';

      $scope.tableConfig = {
        pageNumber: 1,
        pageSize: 20,
        isLoading: false,
        sortBy: 'topcoderUsername',
        sortDir: 'asc',
        totalPages: 1,
        initialized: false,
        query: '',
        lastKey: [],
        pages: 1
      };

      $scope.addUserMapping = function () {
        $rootScope.userMapping = null;
        $state.go('app.addUserMapping');
      };

      $scope.editUserMapping = function (userMapping) {
        if (userMapping) {
          $rootScope.userMapping = userMapping;
        } else {
          $rootScope.userMapping = userMapping;
        }
        $state.go('app.addUserMapping');
      };

      /**
       * gets the user mappings
       */
      $scope.getUserMappings = function () {
        var config = $scope.tableConfig;
        config.isLoading = true;
        UserMappingsService.search(config.query, config.sortBy, config.sortDir, config.pageNumber, config.pageSize, config.lastKey[config.pageNumber]) // eslint-disable-line max-len
          .then(function (res) {
            if (config.query) {
              config.allItems = res.data.docs;
              config.items = config.allItems.slice(0, config.pageSize);
              config.pages = Math.ceil(config.allItems.length / config.pageSize);
            }
            else {
              config.items = res.data.docs;
            }
            if (res.data.lastKey && (res.data.lastKey.githubLastKey || res.data.lastKey.gitlabLastKey)) {
              config.lastKey[config.pageNumber + 1] = res.data.lastKey;
              if (!config.pages || config.pages <= config.pageNumber) {
                config.pages = config.pageNumber + 1;
              }
            }
            config.initialized = true;
            config.isLoading = false;
          }).catch(function (err) {
            config.isLoading = false;
            config.initialized = true;
            _handleError(err, 'An error occurred while getting the data for.');
          });
      };

      $scope.getUserMappings();

      // handle errors
      function _handleError(error, defaultMsg) {
        var errMsg = error.data ? error.data.message : defaultMsg;
        Alert.error(errMsg, $scope);
      }

      /**
       * delete a user mapping item
       * @param {String} topcoderUsername tc handle
       */
      function _handleDeleteUserMapping(topcoderUsername) {
        UserMappingsService.delete(topcoderUsername).then(function () {
          Alert.info('Successfully deleted User Mapping.', $scope);
          $rootScope.dialog = null;
          $scope.getUserMappings();
        }).catch(function (er) {
          _handleError(er, 'Error deleting user mapping.');
        });
      }

      $scope.deleteUserMapping = function (userMapping) {
        $rootScope.dialog = {
          topcoderUsername: userMapping.topcoderUsername,
          proceed: false,
        };

        // $log.warn(watcher, $scope);
        $scope.$on('dialog.finished', function (event, args) {
          if (args.proceed) {
            _handleDeleteUserMapping($rootScope.dialog.topcoderUsername);
          } else {
            $rootScope.dialog = {};
          }
        });
        Dialog.show('Are you sure you want to delete this User Mapping?', $scope);
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
        $scope.getUserMappings();
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
          $scope.tableConfig.items = $scope.tableConfig.allItems.slice(
            start, $scope.tableConfig.pageSize);
            $scope.tableConfig.initialized = true;
            $scope.tableConfig.isLoading = false;
        }
        else {
          $scope.getUserMappings();
        }
      };

      $scope.onSearchIconClicked = function () {
        $scope.tableConfig.pageNumber = 1;
        $scope.tableConfig.pages = 1;
        $scope.tableConfig.allItems = [];
        $scope.getUserMappings();
      };

      $scope.onSearchReset = function () {
        var config = $scope.tableConfig;
        config.query = '';
        $scope.tableConfig.pageNumber = 1;
        $scope.tableConfig.pages = 1;
        $scope.tableConfig.allItems = [];
        $scope.getUserMappings();
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
