'use strict';

angular.module('topcoderX').controller('SettingController', ['currentUser', '$scope', 'OWNER_LOGIN_GITHUB_URL',
    'OWNER_LOGIN_GITLAB_URL', 'SettingService', '$rootScope', 'Dialog', 'Alert', 'Helper', '$window',
    'Tutorial',
    function (currentUser, $scope, OWNER_LOGIN_GITHUB_URL,
        OWNER_LOGIN_GITLAB_URL, SettingService, $rootScope, Dialog, Alert, Helper, $window, Tutorial) {
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

        $scope.loginUrl = {
            github: Helper.baseUrl + OWNER_LOGIN_GITHUB_URL,
            gitlab: Helper.baseUrl + OWNER_LOGIN_GITLAB_URL,
        }

        $scope.$on('dialog.finished', function (event, args) {
            if (args.proceed) {
                SettingService.revokeUserSetting(currentUser.handle, $rootScope.dialog.provider).then(function () {
                    _getSetting();
                }).catch(function (error) {
                    var errMsg = error.data ? error.data.message : "An error occurred while revoking the account."
                    Alert.error(errMsg, $scope);
                });
            } else {
                $rootScope.dialog = {};
            }
        });

        // Revoke gitlab or github account
        $scope.revoke = function(provider) {
            $rootScope.dialog = {
                proceed: false,
                provider: provider
            };
            Dialog.show('Are you sure you want to revoke the authorization token for ' + provider + '?', $scope);
        }

        // Renew gitlab or github account token
        $scope.renew = function(provider) {
            SettingService.revokeUserSetting(currentUser.handle, provider).then(function () {
                $window.location.href = $scope.loginUrl[provider];
            }).catch(function (error) {
                var errMsg = error.data ? error.data.message : "An error occurred while renewing the token."
                Alert.error(errMsg, $scope);
            });
        }

        var tutorial = $window.localStorage.getItem('tutorial');
        if (tutorial) {
            setTimeout(function() {
                var dialog = {
                    message: 'Connect your Gitlab or Github account into Topcoder-X by pressing "Setup" button',
                    action: 'app.project'
                };
                $rootScope.tutorial = dialog;
                Tutorial.show(dialog, $scope);
            }, 2500);
        }

    }]);
