'use strict';

angular.module('topcoderX')
  .controller('CopilotPaymentsController', ['$scope', '$rootScope', '$state', 'CopilotPaymentService', '$filter', 'Alert', 'Dialog', '$log', '$timeout',
    function ($scope, $rootScope, $state, CopilotPaymentService, $filter, Alert, Dialog, $log, $timeout) {
      $scope.title = 'Copilot payment page';
      $scope.totalPendingAmounts = 0;
      $scope.topcoderUrl = '';
      $scope.status = '';

      $scope.tableConfig = {
        active: {
          pageNumber: 1,
          pageSize: 20,
          isLoading: false,
          sortBy: 'project',
          sortDir: 'desc',
          totalPages: 1,
          initialized: false,
          closed: false,
        },
        inactive: {
          pageNumber: 1,
          pageSize: 20,
          isLoading: false,
          sortBy: 'project',
          sortDir: 'desc',
          totalPages: 1,
          initialized: false,
          closed: true,
        },
      };

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

      /**
       * gets the payment
       * @param {String} provider the provider
       */
      $scope.getPayments = function (provider) {
        $scope.totalPendingAmounts = 0;
        $scope.status = provider;
        var config = $scope.tableConfig[provider];
        config.isLoading = true;
        CopilotPaymentService.search(config.closed, config.sortBy, config.sortDir, config.pageNumber, config.pageSize)
          .then(function (res) {
            if (provider === 'active') {
              for (var i = 0; i < res.data.docs.length; i++) {
                $scope.totalPendingAmounts += res.data.docs[i].amount;
              }
            }
            config.items = res.data.docs;
            config.pages = res.data.pages;
            config.initialized = true;
            config.isLoading = false;
          }).catch(function (err) {
            config.isLoading = false;
            config.initialized = true;
            _handleError(err, 'An error occurred while getting the data for ' + provider + '.');
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

      /**
       * handles the sort click
       * @param criteria the criteria
       * @param provider the provider
       */
      $scope.sort = function (criteria, provider) {
        if (criteria === $scope.tableConfig[provider].sortBy) {
          if ($scope.tableConfig[provider].sortDir === 'asc') {
            $scope.tableConfig[provider].sortDir = 'desc';
          } else {
            $scope.tableConfig[provider].sortDir = 'asc';
          }
        } else {
          $scope.tableConfig[provider].sortDir = 'asc';
        }
        $scope.tableConfig[provider].sortBy = criteria;
        $scope.tableConfig[provider].pageNumber = 1;
        $scope.getPayments(provider);
      };

      /**
       * handles the change page click
       * @param {Number} pageNumber the page number
       * @param {String} provider the selected provider
       */
      $scope.changePage = function (pageNumber, provider) {
        if (pageNumber === 0 || pageNumber > $scope.tableConfig[provider].pages ||
          (pageNumber === $scope.tableConfig[provider].pages &&
            $scope.tableConfig[provider].pageNumber === pageNumber)) {
          return false;
        }
        $scope.tableConfig[provider].pageNumber = pageNumber;
        $scope.getPayments(provider);
      };

      /**
       * handles the tab change click
       * @param {String} provider the selected provider
       */
      $scope.tabChanged = function (provider) {
        $scope.tableConfig[provider].sortBy = 'project';
        $scope.tableConfig[provider].sortDir = 'desc';
        $scope.tableConfig[provider].pageNumber = 1;
        $scope.tableConfig[provider].initialized = false;
        $scope.getPayments(provider);
      };

      /**
       * get the number array that shows the pagination bar
       * @param {String} provider the provider
       */
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
        for (j; j <= $scope.tableConfig[provider].pages && j <= pageNo + 5; j++) {
          res.push(j);
        }
        return res;
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
    }
  ]);
