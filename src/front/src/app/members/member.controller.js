'use strict';

angular.module('topcoderX')
  .controller('MemberController', ['$scope', '$stateParams', 'GITHUB_TEAM_URL', 'GITLAB_GROUP_URL', function ($scope, $stateParams, GITHUB_TEAM_URL, GITLAB_GROUP_URL) {
    $scope.title = 'Members';
    $scope.provider = $stateParams.provider;

    var _getUrl = function (provider, url) {
      if (provider === 'github') {
        const params = url.split('_');
        const org = params[0];
        const team = url.replace(org, '').substring(1);
        $scope.link = GITHUB_TEAM_URL + org + '/teams/' + team;
      } else {
        $scope.link = GITLAB_GROUP_URL + url;
      }
    };
    _getUrl($scope.provider, $stateParams.url);
  }]);
