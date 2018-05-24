'use strict';

angular.module('topcoderX')
    .controller('MemberController', ['$scope', '$stateParams', function ($scope, $stateParams) {
        $scope.title = 'Members';
        $scope.provider = $stateParams.provider;
    }]);
