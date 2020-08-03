'use strict';

angular.module('topcoderX')
  .controller('MemberController', ['$scope', '$rootScope', '$stateParams', function ($scope, $rootScope, $stateParams) {
    $scope.title = 'Members';
    $scope.provider = $stateParams.provider;

    var _getUrl = function (provider, url) {
      if (provider === 'github') {
        const params = url.split('_');
        const org = params[0];
        const team = url.replace(org, '').substring(1);
        $scope.link = $rootScope.appConfig.GITHUB_TEAM_URL + org + '/teams/' + team;
      } else if (provider === 'github') {
        $scope.link = $rootScope.appConfig.GITLAB_GROUP_URL + url;
      }
    };
    _getUrl($scope.provider, $stateParams.url);
  }]);
