'use strict';

angular.module('topcoderX')
  .controller('CopilotPaymentsController', ['$scope', '$rootScope', '$state', 'CopilotPaymentService', '$filter', 'Alert', 'Dialog', '$log', '$timeout',
    function ($scope, $rootScope, $state, CopilotPaymentService, $filter, Alert, Dialog, $log, $timeout) {
      $scope.title = 'Copilot payment page';
      $scope.payments = [];
      $scope.isLoaded = false;
      $scope.totalPendingAmounts = 0;
      $scope.topcoderUrl = '';
      $scope.status = '';
      $scope.goPayment = function (payment) {
        if (payment) {
          $rootScope.payment = payment;
        } else {
          $rootScope.payment = null;
        }
        $state.go('app.addPayment');
      };

      $scope.updateAll = function () {
        CopilotPaymentService.updateAll().then(function () {
          $timeout(function () {
            $scope.getPayments($scope.status);
          }, 15000);
        }).catch(function (err) {
          _handleError(err, 'Error updating payments list');
        });
      };

      $scope.getPayments = function (status) {
        $scope.isLoaded = false;
        CopilotPaymentService.getAll('project').then(function (res) {
          if (status === 'active') {
            $scope.payments = res.data.activePayments;
            $scope.totalPendingAmounts = 0;
            for (var i = 0; i < $scope.payments.length; i++) {
              $scope.totalPendingAmounts += $scope.payments[i].amount;
            }
            $scope.isLoaded = true;
            $scope.status = 'active';
          }
          if (status === 'closed') {
            $scope.payments = res.data.closedPayments;
            $scope.isLoaded = true;
            $scope.status = 'closed';
          }
        }).catch(function (err) {
          $scope.isLoaded = true;
          _handleError(err, 'Error getting payments.');
        });
      };

      $scope.getPayments('active');

      // handle errors
      function _handleError(error, defaultMsg) {
        var errMsg = error.data ? error.data.message : defaultMsg;
        Alert.error(errMsg, $scope);
      }

      /**
       * delete a payment item byId
       * @param {Number} id payment id
       */
      function _handleDeletePayment(id) {
        CopilotPaymentService.delete(id).then(function () {
          Alert.info('Successfully deleted payments.', $scope);
          $rootScope.dialog = null;
          $scope.getPayments($scope.status);
        }).catch(function (er) {
          _handleError(er, 'Error deleting payment.');
        });
      }

      $scope.deletePayment = function (payment) {
        $rootScope.dialog = {
          paymentId: payment.id,
          proceed: false,
        };

        // $log.warn(watcher, $scope);
        $scope.$on('dialog.finished', function (event, args) {
          if (args.proceed) {
            _handleDeletePayment($rootScope.dialog.paymentId);
          } else {
            $rootScope.dialog = {};
          }
        });
        Dialog.show('Are you sure you want to delete this payment?', $scope);
      };

      $scope.sort = function (criteria) {
        CopilotPaymentService.getAll(criteria).then(function (res) {
          if (status === 'active') {
            $scope.payments = res.data.activePayments;
            $scope.isLoaded = true;
            $scope.status = 'active';
          }
          if (status === 'closed') {
            $scope.payments = res.data.closedPayments;
            $scope.isLoaded = true;
            $scope.status = 'closed';
          }
        });
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

      $scope.init = function () {
        $('.footable').footable();
      };
    }
  ]);
