'use strict';

angular.module('topcoderX').controller('GitAccessController', ['currentUser', '$scope', '$log', 'SettingService',
    'GitAccessControlService', 'Alert', function (currentUser, $scope, $log, SettingService, GitAccessControlService, Alert) {
        $scope.settings = {};
        var vm = this;
        $scope.isLoaded = false;
        $scope.tableConfig = {
            github: {
                pageNumber: 1,
                pageSize: 10,
                isLoading: false,
                items: [],
                totalPages: 1,
                searchMethod: GitAccessControlService.getGithubOwnerTeams,
                initialized: false,
                accessLinkMethod: GitAccessControlService.getGithubShareableLink,
            },
            gitlab: {
                pageNumber: 1,
                pageSize: 10,
                isLoading: false,
                items: [],
                totalPages: 1,
                searchMethod: GitAccessControlService.getGitlabOwnerGroups,
                initialized: false,
                accessLinkMethod: GitAccessControlService.getGitlabShareableLink,
            }
        }

        var _getOwnerList = function (provider) {
            var config = $scope.tableConfig[provider];
            config.isLoading = true;
            config.searchMethod.apply(vm, [config.pageNumber, config.pageSize, false]).then(function (res) {
                config.items = provider === 'github' ? res.data.teams : res.data.groups;
                if (!config.initialized) {
                    config.totalPages = res.data.lastPage;
                }
                config.isLoading = false;
                config.initialized = true;
            }).catch(function (err) {
                config.isLoading = false;
                config.initialized = true;
                _handleError(err, 'An error occurred while getting the data for ' + provider + '.');
            });
        };

        _getSetting();

        // get user setup first and then owner list
        function _getSetting() {
            SettingService.userSetting(currentUser.handle).then(function (response) {
                $scope.settings = response.data;
                if ($scope.settings.github) {
                    _getOwnerList('github');
                }
                $scope.isLoaded = true;
            }).catch(function (error) {
                $scope.isLoaded = true;
                _handleError(error, 'An error occurred while checking the setup.')
            });
        };

        /**
         * getSharableLink Get the register url for a team
         */
        $scope.getSharableLink = function (team, provider) {
            team.gettingLink = true;
            var config = $scope.tableConfig[provider];
            config.accessLinkMethod.apply(vm, [team.id]).then(function (response) {
                team.accessLink = response.data.url;
                team.showLink = true;
                team.gettingLink = false;
            }).catch(function (err) {
                team.gettingLink = false;
                _handleError(err);
            });
        }

        // handle errors
        function _handleError(error, defaultMsg) {
            var errMsg = error.data ? error.data.message : defaultMsg;
            Alert.error(errMsg, $scope);
        }

        // change to a specific page
        $scope.changePage = function (pageNumber, provider) {
            if (pageNumber === 0 || pageNumber > $scope.getLastPage(provider)) {
                return false;
            }
            $scope.tableConfig[provider].pageNumber = pageNumber;
            _getOwnerList(provider);
        };
        // get the number array that shows the pagination bar
        $scope.getPageArray = function (provider) {
            var res = [];

            var pageNo = $scope.tableConfig[provider].pageNumber;
            var i = pageNo - 5;
            for (i; i <= pageNo; i++) {
                if (i > 0) {
                    res.push(i);
                }
            }
            var j = pageNo + 1;
            for (j; j <= $scope.getLastPage(provider) && j <= pageNo + 5; j++) {
                res.push(j);
            }
            return res;
        };
        // move to the last page
        $scope.getLastPage = function (provider) {
            return $scope.tableConfig[provider].totalPages;
        };

        $scope.tabChanged = function (provider) {
            $scope.tableConfig[provider].pageNumber = 1;
            $scope.tableConfig[provider].initialized = false;
            if ($scope.settings[provider]) {
                _getOwnerList(provider);
            }
        }
    }]);
