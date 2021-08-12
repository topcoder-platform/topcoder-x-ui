'use strict';

angular.module('topcoderX')
    .controller('AddUserMappingController', ['$scope', '$state', 'UserMappingsService', 'Alert', '$rootScope',
        function ($scope, $state, UserMappingsService, Alert, $rootScope) {
            $scope.userMapping = {
                topcoderUsername: '',
                githubUsername: '',
                gitlabUsername: ''
            };
            $scope.editing = true;
            if ($rootScope.userMapping) {
                $scope.title = 'Edit User Mapping';
                $scope.userMapping.topcoderUsername = $rootScope.userMapping.topcoderUsername;
                $scope.userMapping.githubUsername = $rootScope.userMapping.githubUsername;
                $scope.userMapping.gitlabUsername = $rootScope.userMapping.gitlabUsername;
                $scope.editing = true;
            } else {
                $scope.title = 'Add User Mapping';
                $scope.editing = false;
            }

            // handle error output
            function _handleError(error, defaultMsg) {
                const errMsg = error.data ? error.data.message : defaultMsg;
                Alert.error(errMsg, $scope);
            }

            // create/update pat item
            $scope.save = function () {
                if (!$scope.editing) {
                    if (!$scope.userMapping.githubUsername && !$scope.userMapping.gitlabUsername) {
                        Alert.error('Cannot create with empty mappings.');
                        return;
                    }
                    const userMapping = {
                        topcoderUsername: $scope.userMapping.topcoderUsername
                    };
                    if ($scope.userMapping.githubUsername) {
                        userMapping.githubUsername = $scope.userMapping.githubUsername;
                    }
                    if ($scope.userMapping.gitlabUsername) {
                        userMapping.gitlabUsername = $scope.userMapping.gitlabUsername;
                    }
                    UserMappingsService.create(userMapping).then(function (response) {
                        if (response.data.exist) {
                            Alert.error('User Mapping for ' + response.data.provider + ' is already exist.', $scope);
                        }
                        else $state.go('app.userMappings');
                    }).catch(function (error) {
                        _handleError(error, 'An error occurred while creating User Mapping.');
                    });
                } else {
                    if (!$scope.userMapping.githubUsername && !$scope.userMapping.gitlabUsername) {
                        Alert.error('Cannot update with empty mappings.');
                        return;
                    }
                    const userMapping = {
                        topcoderUsername: $scope.userMapping.topcoderUsername
                    };
                    if ($scope.userMapping.githubUsername) {
                        userMapping.githubUsername = $scope.userMapping.githubUsername;
                    }
                    if ($scope.userMapping.gitlabUsername) {
                        userMapping.gitlabUsername = $scope.userMapping.gitlabUsername;
                    }
                    UserMappingsService.update(userMapping).then(function (response) {
                        if (response.data.exist) {
                            Alert.error('User Mapping for ' + response.data.provider + ' is already exist.', $scope);
                        }
                        else $state.go('app.userMappings');
                    }).catch(function (error) {
                        _handleError(error, 'An error occurred while creating User Mapping.');
                    });
                }
            };
        }
    ]);
