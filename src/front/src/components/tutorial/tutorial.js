'use strict';

angular.module('topcoderX')
  .factory('Tutorial', ['$state', '$window', function ($state, $window) {
    var Dialog = function (message) {
      this.message = message;
    };

    Dialog.display = function (dialog, $scope) {

      $scope.body = dialog.message.message;
      $scope.action = dialog.message.action;
      $scope.button = dialog.message.action === 'close' ? 'Close': 'Next';

      $scope.next = function() {
        $('#myModal').modal('hide');
        if ($scope.action === 'close') {
          $window.localStorage.removeItem('tutorial');
        }
        else {
          $window.localStorage.setItem('tutorial', true);
          $state.go($scope.action, {}, {reload: true});
        }
      }

      $scope.close = function() {
        $window.localStorage.removeItem('tutorial', true);
      }

      $("#myModal").draggable({
        handle: ".modal-header"
      });

      $('#myModal').modal('show');
    };

    // show confirmation dialog
    Dialog.show = function (message, $scope) {
      Dialog.display(new Dialog(message), $scope);
    };

    return Dialog;
  }
  ]);

