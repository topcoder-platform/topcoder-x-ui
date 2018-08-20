'use strict';

angular.module('topcoderX')
    .controller('AddPaymentController', ['$scope', '$log', '$state', 'PaymentService', 'ProjectService', '$filter', '$rootScope', '$timeout', 'Alert',
        function ($scope, $log, $state, PaymentService, ProjectService, $filter, $rootScope, $timeout, Alert) {
            // below logic is trying to identify whether we are editing a payment
            $scope.editing = true;
            $scope.projects = [];
            $scope.payment = {
                project: null,
                amount: null,
                description: '',
                challenge: '',
            };
            if ($rootScope.payment) {
                $scope.title = 'Edit a Payment';
                $scope.payment = $rootScope.payment;
                $scope.payment.id = $rootScope.payment.id;
                $scope.editing = true;
            } else {
                $scope.title = 'Add a Payment';
                $scope.editing = false;
            }

            // get topcoderx projects
            $scope.getProjects = function () {
                ProjectService.getProjects().then(function (response) {
                    $scope.projects = response.data;
                }).catch(function (error) {
                    _handleError({
                        data:
                            { error: error, message: 'There are not projects in Topcoder-X. Please create a project first.' }
                    });
                });
            };

            $scope.getProjects();

            // handle error output
            function _handleError(error, defualtMsg) {
                const errMsg = error.data ? error.data.message : defualtMsg;
                Alert(errMsg, $scope);
            }

            // create/update payment item
            $scope.save = function () {
                if (!$scope.editing) {
                    PaymentService.create($scope.payment).then(function (res) {
                        $log.info(res);
                        $state.go('app.copilotPayments');
                    }).catch(function () {
                        Alert.error('Error Creating Payment', $scope);
                    });
                }
                if ($scope.editing) {
                    PaymentService.update({
                        id: $scope.payment.id,
                        project: $scope.payment.project,
                        amount: $scope.payment.amount,
                        description: $scope.payment.description,
                        challenge: $scope.payment.challenge,
                        closed: $scope.payment.closed
                    }).then(function (res) {
                        $timeout(function () {
                            $log.info(res);
                            $rootScope.payment = null;
                            $state.go('app.copilotPayments');
                        }, 6000);
                    }).catch(function () {
                        Alert.error('Error Updating Payment', $scope);
                    });
                }
            };
        }
    ]);
