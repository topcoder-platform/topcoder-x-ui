'use strict';


angular.module('topcoderX') // eslint-disable-line angular/no-services
    .controller('NavController', ['$scope', '$log', '$state', '$cookies', '$http', function ($scope, $log, $state, $cookies, $http) {
    $scope.$state = $state;
    $scope.menuList = false;
    $scope.user = {};

    /**
     * detect env and get relevant api domain
     *
     * @returns {String} api domain
     */
    function domain () {
        const dev = window.location.origin.includes('.topcoder-dev.com');
        if (dev) {
            return 'topcoder-dev';
        } else {
            return 'topcoder';
        }
    };


    const token = $cookies.get('tcjwt');
    const req = {
        url: 'http://api.' + domain() + '.com/v2/user/profile',
        method: 'Get',
        headers: {
            Authorization: 'Bearer ' + token,
        },
    };
    $http(req).then(function (tcUser) {
        $scope.user = tcUser.data;
        if (tcUser.data.copilot) {
            $log.info('Success - user is a copilot');
        } else {
            $log.warn('Warning - User isn\'t a a copilot');
        }
    });

    $scope.forceStateProjects = function () {
      $state.go('app.projects');
    };

    $scope.menuOpen = function () {
      $scope.menuList = !$scope.menuList;
    }

    // Click menu item go to another page will close the menu as well
    angular.element(document.querySelectorAll("a[ui-sref]")).bind('click', $scope.menuOpen);
  }]);
