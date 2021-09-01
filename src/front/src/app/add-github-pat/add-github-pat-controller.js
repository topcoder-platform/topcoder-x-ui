'use strict';

angular.module('topcoderX')
    .controller('AddGithubPATController', ['$scope', '$state', 'GithubPATsService', 'Alert',
        function ($scope, $state, GithubPATsService, Alert) {
            $scope.pat = {
                name: '',
                owner: '',
                personalAccessToken: ''
            };

            // handle error output
            function _handleError(error, defaultMsg) {
                const errMsg = error.data ? error.data.message : defaultMsg;
                Alert.error(errMsg, $scope);
            }

            // create/update pat item
            $scope.save = function () {
                if (!$scope.editing) {
                    GithubPATsService.create($scope.pat).then(function (response) {
                        if (response.data.exist) {
                            Alert.error('Organisation is already exist with a PAT. Please delete first.', $scope);
                        }
                        else $state.go('app.githubPATs');
                    }).catch(function (error) {
                        _handleError(error, 'An error occurred while creating PAT.');
                    });
                }
            };
        }
    ]);
