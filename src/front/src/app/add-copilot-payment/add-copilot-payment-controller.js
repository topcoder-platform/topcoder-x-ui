'use strict';

angular.module('topcoderX')
    .controller('AddCopilotPaymentController', ['$scope', '$log', '$state', 'CopilotPaymentService', 'ProjectService', '$filter', '$rootScope', '$timeout', 'Alert',
        function ($scope, $log, $state, CopilotPaymentService, ProjectService, $filter, $rootScope, $timeout, Alert) {
            // below logic is trying to identify whether we are editing a payment
            $scope.editing = true;
            $scope.projects = [];
            $scope.payment = {
                project: null,
                amount: null,
                description: '',
            };
            if ($rootScope.payment) {
                $scope.title = 'Edit a Payment';
                $scope.payment = angular.copy($rootScope.payment);
                $scope.payment.id = $rootScope.payment.id;
                $scope.payment.project = $rootScope.payment.project.id;
                $scope.editing = true;
            } else {
                $scope.title = 'Add a Payment';
                $scope.editing = false;
            }

            // get topcoderx projects
            $scope.getProjects = function () {
                ProjectService.getProjects('active', false).then(function (response) {
                    $scope.projects = response.data;
                }).catch(function (error) {
                    _handleError(error, 'There are no projects in Topcoder-X. Please create a project first.');
                });
            };

            $scope.getProjects();

            // handle error output
            function _handleError(error, defaultMsg) {
                const errMsg = error.data ? error.data.message : defaultMsg;
                Alert.error(errMsg, $scope);
            }

            // create/update payment item
            $scope.save = function () {
                if (!$scope.editing) {
                    CopilotPaymentService.create($scope.payment).then(function () {
                        $state.go('app.copilotPayments');
                    }).catch(function (error) {
                        _handleError(error, 'An error occurred while creating Payment.');
                    });
                }
                if ($scope.editing) {
                    CopilotPaymentService.update({
                        id: $scope.payment.id,
                        project: $scope.payment.project,
                        amount: $scope.payment.amount,
                        description: $scope.payment.description,
                    }).then(function () {
                        $rootScope.payment = null;
                        $state.go('app.copilotPayments');
                    }).catch(function (error) {
                        _handleError(error, 'An error occurred while updating Payment.');
                    });
                }
            };
        }
    ]);
