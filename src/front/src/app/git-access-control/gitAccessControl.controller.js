'use strict';

angular.module('topcoderX').controller('GitAccessController', ['currentUser', '$scope', '$log', 'SettingService',
    'GitAccessControlService', 'Alert', function (currentUser, $scope, $log, SettingService, GitAccessControlService, Alert) {
        $scope.settings = {};
        $scope.isLoaded = false;
        $scope.settings = {};
        $scope.isLoaded = false;
        $scope.gitlabItems = {};
        $scope.githubItems = {};
        $scope.githubItemLoaded = false;
        $scope.gitlabItemLoaded = false;
        $scope.gitLinks = {
            gitlab: {}, github: {},
        };
        $scope.githubPageSize = 10;
        $scope.githubPageNo = 1;
        $scope.gitlabPageSize = 10;
        $scope.gitlabPageNo = 1;
        $scope.init = function () {
            $('.footable').footable(
                {
                    "sorting": {
                        "enabled": true
                    }
                }
            );
            $(window).trigger('resize');
        }
        var _getOwnerList = function (provider) {
            if (provider === 'github') {
                GitAccessControlService.getGithubOwnerTeams($scope.githubPageNo, $scope.githubPageSize).then(function (response) {
                    $scope.githubItems = response.data;
                    $scope.githubItemLoaded = false;
                    $log.debug($scope.githubItems)
                }).catch(_handleError);
            } else {
                GitAccessControlService.getGitlabOwnerGroups($scope.gitlabPageNo, $scope.gitlabPageSize).then(function (response) {
                    $scope.gitlabItems = response.data;
                    $log.debug($scope.gitlabItems)
                    $scope.gitlabItemLoaded = false;
                }).catch(_handleError);
            }
        };

        _getSetting();

        // get user setup first and then owner list
        function _getSetting() {
            SettingService.userSetting(currentUser.handle).then(function (response) {
                $scope.settings = response.data;
                $log.debug($scope.githubItems)
                if ($scope.settings.github) {
                    _getOwnerList('github');
                }
                if ($scope.settings.gitlab) {
                    _getOwnerList('gitlab');
                }
                $scope.isLoaded = true;
            }).catch(function (error) {
                $scope.isLoaded = true;
                _handleError(error)
            });
        };

        /**
         * getSharableLink Get the register url for a team
         */
        $scope.getSharableLink = function (team, provider) {
            // if url already available return it
            if ($scope.gitLinks[provider][team.id]) {
                return $scope.gitLinks[provider][team.id];
            }
            if (provider === 'github') {
                GitAccessControlService.getGithubShareableLink(team.id).then(function (response) {
                    team.accessLink = response.data.url;
                    team.showLink = true;
                    $scope.gitLinks[provider][team.id] = response.data.url;
                }).catch(_handleError);
            } else {
                GitAccessControlService.getGitlabShareableLink(team.id).then(function (response) {
                    team.accessLink = response.data.url;
                    $scope.gitLinks[provider][team.id] = response.data.url;
                    team.showLink = true;
                }).catch(_handleError);
            }
        }

        $scope.pageChanged = function (pageNo, provider) {
            if (provider === 'github') {
                $scope.githubPageNo = pageNo;
            } else {
                $scope.gitlabPageNo = pageNo;
            }
            _getOwnerList(provider)
        }

        // handle errors
        function _handleError(error) {
            var errMsg = error.data ? error.data.message : "An error occurred while checking the setup."
            Alert.error(errMsg, $scope);
        }



    }]);
