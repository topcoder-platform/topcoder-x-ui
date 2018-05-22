'use strict';

angular.module('topcoderX').controller('SettingController', ['currentUser', '$scope', 'OWNER_LOGIN_GITHUB_URL',
    'OWNER_LOGIN_GITLAB_URL', 'SettingService', '$rootScope', 'Alert', '$location',
    function (currentUser, $scope, OWNER_LOGIN_GITHUB_URL,
        OWNER_LOGIN_GITLAB_URL, SettingService, $rootScope, Alert, $location) {
        $scope.settings = {};
        $scope.isLoaded = false;

        function _getSetting() {
            SettingService.userSetting(currentUser.handle).then(function (response) {
                $scope.settings = response.data;
                $scope.isLoaded = true;
            }).catch(function (error) {
                $scope.isLoaded = true;
                var errMsg = error.data ? error.data.message : "An error occurred while checking the setup."
                Alert.error(errMsg, $scope);
            });
        };
        _getSetting();

        const baseUrl = $location.protocol() + '://' + $location.host();

        $scope.loginUrl = {
            github: baseUrl + OWNER_LOGIN_GITHUB_URL,
            gitlab: baseUrl + OWNER_LOGIN_GITLAB_URL,
        }
        
    }]);
