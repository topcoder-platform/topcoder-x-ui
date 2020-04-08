'use strict';

angular.module('topcoderX').controller('GitAccessController', ['currentUser', '$scope', '$log', 'SettingService',
    'GitAccessControlService', 'Alert', '$uibModal', function (currentUser, $scope, $log,
        SettingService, GitAccessControlService, Alert, $uibModal) {
        $scope.settings = {};
        var vm = this;
        $scope.isLoaded = false;
        $scope.isLoadingSearchData = false;
        $scope.tableConfig = {
            github: {
                pageNumber: 1,
                pageSize: 10,
                isLoading: false,
                items: [],
                allItems: [],
                totalPages: 1,
                searchMethod: GitAccessControlService.getGithubOwnerTeams,
                initialized: false,
                accessLinkMethod: GitAccessControlService.getGithubShareableLink,
                removeAllUsersMethod: GitAccessControlService.removeAllGithubUsers,
                query: '',
            },
            gitlab: {
                pageNumber: 1,
                pageSize: 10,
                isLoading: false,
                items: [],
                allItems: [],
                totalPages: 1,
                searchMethod: GitAccessControlService.getGitlabOwnerGroups,
                initialized: false,
                accessLinkMethod: GitAccessControlService.getGitlabShareableLink,
                removeAllUsersMethod: GitAccessControlService.removeAllGitlabUsers,
                query: '',
            },
            azure: {
                pageNumber: 1,
                pageSize: 10,
                isLoading: false,
                items: [],
                allItems: [],
                totalPages: 1,
                searchMethod: GitAccessControlService.getAzureOwnerTeams,
                initialized: false,
                accessLinkMethod: GitAccessControlService.getAzureShareableLink,
                removeAllUsersMethod: GitAccessControlService.removeAllAzureUsers,
                query: '',
            }
        }

        var _getOwnerList = function (provider) {
            var config = $scope.tableConfig[provider];
            config.isLoading = true;
            config.searchMethod.apply(vm, [config.pageNumber, config.pageSize, false]).then(function (res) {
                config.items = provider === 'gitlab' ? res.data.groups : res.data.teams;
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
            if (provider === 'azure') {
                var azconfig = $scope.tableConfig[provider];
                var azparams = [team.id, team.orgName, team.projectId];
                azconfig.accessLinkMethod.apply(vm, azparams).then(function (response) {
                    team.accessLink = response.data.url;
                    team.showLink = true;
                    team.gettingLink = false;
                }).catch(function (err) {
                    team.gettingLink = false;
                    _handleError(err);
                });
                return;
            }
            const modalInstance = $uibModal.open({
                size: 'md',
                templateUrl: 'app/git-access-control/git-access-dialog.html',
                controller: 'GitAccessDialogController',
                resolve: {
                    provider: function () {
                        return provider;
                    }
                },
            });
            modalInstance.result.then(
                function (data) {
                    if (data) {
                        const accessLevel = data.accessLevel;
                        const expiredAt = data.expiredAt;
                        var config = $scope.tableConfig[provider];
                        var params = [team.id, accessLevel];
                        if (expiredAt) {
                            params.push(expiredAt);
                        }
                        config.accessLinkMethod.apply(vm, params).then(function (response) {
                            team.accessLink = response.data.url;
                            team.showLink = true;
                            team.gettingLink = false;
                        }).catch(function (err) {
                            team.gettingLink = false;
                            _handleError(err);
                        });
                    }
                }
            );
        }

        /**
         * removeAllUsers Remove users of a team
         */
        $scope.removeAllUsers = function (team, provider) {
            team.removingUsers = true;
            var config = $scope.tableConfig[provider];
            config.removeAllUsersMethod.apply(vm, [team.id]).then(function () {
                team.removingUsers = false;
                _handleMessage('Users are deleted from team:' + team.name + '!');
            }).catch(function (err) {
                team.removingUsers = false;
                _handleError(err);
            });
        }

        // handle errors
        function _handleError(error, defaultMsg) {
            var errMsg = error.data ? error.data.message : defaultMsg;
            Alert.error(errMsg, $scope);
        }

        // handle messages
        function _handleMessage(message) {
            Alert.info(message, $scope);
        }

        // change to a specific page
        $scope.changePage = function (pageNumber, provider) {
            if (pageNumber === 0 || pageNumber > $scope.getLastPage(provider)) {
                return false;
            }
            $scope.tableConfig[provider].pageNumber = pageNumber;

            var config = $scope.tableConfig[provider];
            if (config.query.length === 0) {
                _getOwnerList(provider);
            }
            else {
                _searchLocal(config, config.query, provider);
            }
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

        $scope.onSearchChange = function (provider, obj) {
            var config = $scope.tableConfig[provider];
            config.query = obj.searchText;
            if (config.allItems.length === 0 && !$scope.isLoadingSearchData) {
                $scope.isLoadingSearchData = true;
                config.searchMethod.apply(vm, [1, Number.MAX_SAFE_INTEGER, true]).then(function (res) {
                    config.allItems = provider === 'github' ? res.data.teams : res.data.groups;
                    $log.log(config.allItems);
                    $scope.isLoadingSearchData = false;
                    _searchLocal(config, obj.searchText, provider);
                    if (config.pageNumber > 1) {
                        $scope.changePage(1, provider);
                    }
                }).catch(function (err) {
                    _handleError(err, 'An error occurred while getting the data for ' + provider + '.');
                    $scope.isLoadingSearchData = false;
                });
            }
            else if (config.allItems.length > 0) {
                _searchLocal(config, obj.searchText, provider);
                if (config.pageNumber > 1) {
                    $scope.changePage(1, provider);
                }
            }

            if (config.query.length === 0) {
                $scope.changePage(1, provider);
            }
        };

        $scope.onSearchIconClicked = function (provider) {
            var config = $scope.tableConfig[provider];
            if (config.pageNumber > 1) {
                $scope.changePage(1, provider);
            }
            if (config.query.length > 0) {
                _searchLocal(config, config.query, provider);
            }
        };

        function _searchLocal(config, query, provider) {
            config.items = config.allItems.filter(function(value) {
                if (provider === 'github') {
                    return value['name'].toLowerCase().includes(query.toLowerCase());
                }
                return value['full_name'].toLowerCase().includes(query.toLowerCase());
            })
            config.totalPages = Math.ceil(config.items.length / config.pageSize);
            config.items = config.items
                .slice((config.pageNumber - 1)*config.pageSize, (config.pageNumber - 1)*config.pageSize + config.pageSize);
        }
    }]);
