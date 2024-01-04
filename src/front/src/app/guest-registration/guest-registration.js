angular.module('topcoderX')
  .controller('GuestRegistrationController', ['$scope', '$stateParams', '$log', function ($scope, $stateParams, $log) {
    $scope.title = 'TopcoderX Registration';
    $log.log($stateParams);
    $scope.success = $stateParams.success === 'true';
    $scope.error = $stateParams.error;
    $log.log($scope);
  }]);
