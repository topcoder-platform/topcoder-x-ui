'use strict';

/**
 * topcoder x
 */
angular.module('topcoderX', [
  'ngAnimate',
  'ngCookies',
  'ngTouch',
  'ngSanitize',
  'ngResource',
  'ui.router',
  'ui.bootstrap',
  'app.constants',
  'angular-clipboard',
  'angular-jwt'])
  // In the run phase of your Angular application
  .run(['AuthService', function (AuthService) {
    // init AuthService, it has to be done once, when app starts
    AuthService.init();
  }])
  .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$compileProvider',
    function ($stateProvider, $urlRouterProvider, $locationProvider, $compileProvider) {
      var authenticate = ['AuthService', '$q', '$state', function (AuthService, $q, $state) {
        return AuthService.authenticate().catch(function (err) {
          // if we get error that use doesn't have permissions
          // then go to auth page, which will show permissions denied error
          if (err === AuthService.ERROR.NO_PERMISSIONS) {
            $state.go('auth');
          }
          return $q.reject();
        });
      }];

      $stateProvider
        .state('auth', {
          url: '/auth',
          templateUrl: 'app/auth/auth.html',
          data: { pageTitle: 'Authentication' },
          resolve: {
            auth: ['AuthService', '$q', function (AuthService, $q) {
              // for auth state we use another resolver then all other states
              return AuthService.authenticate().catch(function (err) {
                // if we get error that use doesn't have permissions
                // we still resolve the promise and proceed to auth page
                // which will show permissions denied error
                // also we keep going if we are in loging out process
                if (err === AuthService.ERROR.NO_PERMISSIONS || AuthService.logginOut) {
                  return $q.resolve();
                }
                return $q.reject();
              });
            }],
            currentUser: ['AuthService', function (AuthService) {
              return AuthService.getAppConfig().then(function () {
                return AuthService.getCurrentUser();
              });
            }],

          }
        })
        .state('app', {
          abstract: true,
          url: '/app',
          templateUrl: 'components/common/content.html',
          resolve: {
            currentUser: ['AuthService', function (AuthService) {
              return AuthService.getAppConfig().then(function () {
                return AuthService.getCurrentUser();
              });
            }]
          },
        })
        .state('app.main', {
          url: '/main',
          controller: 'MainController',
          controllerAs: 'vm',
          templateUrl: 'app/main/main.html',
          data: { pageTitle: 'Dashboard' },
          resolve: { auth: authenticate }
        })
        .state('app.project', {
          url: '/upsertproject',
          controller: 'ProjectController',
          controllerAs: 'vm',
          templateUrl: 'app/upsertproject/upsertproject.html',
          data: { pageTitle: 'Project Management' },
          resolve: { auth: authenticate }
        })
        .state('app.projects', {
          url: '/projects',
          controller: 'ProjectsController',
          controllerAs: 'vm',
          templateUrl: 'app/projects/projects.html',
          data: { pageTitle: 'Project Management' },
          resolve: { auth: authenticate }
        })
        .state('app.issue', {
          url: '/upsertissue',
          controller: 'IssueController',
          controllerAs: 'vm',
          templateUrl: 'app/upsertissue/upsertissue.html',
          data: { pageTitle: 'Project Management' },
          resolve: { auth: authenticate }
        })
        // following code is commented to hide the menu
        // un comment this when pages are developed
        // .state('app.challenges', {
        //   url: '/challenges',
        //   templateUrl: 'app/challenges/challenges.html',
        //   data: { pageTitle: 'Topcoder Platform' },
        //   resolve: { auth: authenticate }
        // })
        // .state('app.tickets', {
        //   url: '/tickets',
        //   templateUrl: 'app/challenges/tickets.html',
        //   data: { pageTitle: 'Git Tickets' },
        //   resolve: { auth: authenticate }
        // })
        // .state('app.changelog', {
        //   url: '/changelog',
        //   templateUrl: 'app/changelog/changelog.html',
        //   data: { pageTitle: 'Changelog' },
        //   resolve: { auth: authenticate }
        // })
        .state('app.settings', {
          url: '/settings',
          templateUrl: 'app/settings/settings.html',
          controller: 'SettingController',
          controllerAs: 'vm',
          data: { pageTitle: 'Settings' },
          resolve: { auth: authenticate }
        })
        .state('app.gitAccessControl', {
          url: '/access-control',
          templateUrl: 'app/git-access-control/access-control.html',
          controller: 'GitAccessController',
          controllerAs: 'vm',
          resolve: { auth: authenticate }
        })
        .state('membersAdded', {
          url: '/members/:provider/:url',
          templateUrl: 'app/members/member.html',
          controller: 'MemberController',
          controllerAs: 'vm',
        })
        .state('app.copilotPayments', {
          url: '/copilot-payments',
          templateUrl: 'app/copilot-payments/copilot-payments.html',
          controller: 'CopilotPaymentsController',
          controllerAs: 'vm',
          resolve: { auth: authenticate }
        })
        .state('app.addPayment', {
          url: '/copilot-payment',
          templateUrl: 'app/add-copilot-payment/add-copilot-payment.html',
          controller: 'AddCopilotPaymentController',
          controllerAs: 'vm',
          resolve: { auth: authenticate }
        });


      $urlRouterProvider.otherwise('/app/main');
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
    }]);
