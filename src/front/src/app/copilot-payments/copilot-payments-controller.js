'use strict';

angular.module('topcoderX')
  .controller('CopilotPaymentsController', ['$scope', '$rootScope', '$state', 'PaymentService', '$filter', 'Alert', 'Dialog', '$log', '$timeout',
    function ($scope, $rootScope, $state, PaymentService, $filter, Alert, Dialog, $log, $timeout) {
      $scope.title = 'Copilot payment page';
      $scope.payments = [];
      $scope.isLoaded = false;
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
        PaymentService.updateAll().then(function () {
          $timeout(function () {
            $scope.getPayments($scope.status);
          }, 5000);
        }).catch(function (err) {
          $log.info(err);
          _handleError({ data: { error: err, message: 'Error updating payments list' } });
        });
      };

      $scope.getPayments = function (status) {
        $scope.isLoaded = false;
        PaymentService.getAll('project').then(function (res) {
            $log.info(res);

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
        }).catch(function (err) {
          $scope.isLoaded = true;
          _handleError({ data: { error: err, message: 'Error getting payments.' } });
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
        PaymentService.delete(id).then(function () {
          Alert.info('Successfully deleted payments.', $scope);
          $timeout(function () {
            $rootScope.dialog = null;
            $scope.getPayments($scope.status);
          }, 2000);
        }).catch(function (er) {
          $log.error(er, $scope);
          _handleError({ data: { error: er, message: 'Error deleting payment.' } });
        });
      }

      $scope.deletePayment = function (payment) {
        $rootScope.dialog = {
          paymentId: payment.id,
          proceed: false,
        };
        const watcher = $rootScope.$watch(function () {
          if ($rootScope.dialog) {
            return $rootScope.dialog.proceed;
          }
        }, function (newVal, oldVal) {
          $log.info('---- [watching $rootScope.dialog] new:' + newVal + '+ ,old:' + oldVal + '');
          if (newVal !== oldVal && $rootScope.dialog &&
            (angular.isDefined($rootScope.dialog.paymentId) ||
              $rootScope.dialog.paymentId != null ||
              angular.isString($rootScope.dialog.paymentId === 'string'))) {
            $log.warn('payment deletion', $scope);
            _handleDeletePayment($rootScope.dialog.paymentId);
          }
        });

        $log.warn(watcher, $scope);
        Dialog.show('Are you sure you want to delete this payment?', $scope);
      };

      $scope.sort = function (criteria) {
        PaymentService.getAll(criteria).then(function (res) {
          $log.info(res);
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
