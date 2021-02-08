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
      } else if (provider === 'gitlab') {
        // For gitlab subgroups we can't just pass encoded link to this route because anguler doesn't match %2F, so we use @!2F as a workaround
        $scope.link = $rootScope.appConfig.GITLAB_GROUP_URL + url.replace('@!2F', '/');
      }
    };
    _getUrl($scope.provider, $stateParams.url);
  }]);
