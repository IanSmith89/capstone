'use strict';

angular.module('salvage')
.config(['$routeProvider', routes])
.config(['$httpProvider', interceptor]);

function routes($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'templates/main.html',
      controller: 'MainCtrl as MC'
    })
    .when('/map', {
      templateUrl: 'templates/map.html',
      controller: 'MapCtrl as MapCtrl'
    })
    .when('/donation', {
      templateUrl: 'templates/donation.html',
      controller: 'DonationCtrl as DC'
    })
    .when('/about', {
      templateUrl: 'templates/about.html',
      controller: 'AboutCtrl as AC'
    })
    .when('/donations/:id', {
      templateUrl: 'templates/posts.html',
      controller: 'LogCtrl as LC'
    })
    .when('/login', {
      templateUrl: 'templates/login.html',
      controller: 'AuthCtrl as AC'
    })
    .when('/register/:user', {
      templateUrl: 'templates/register.html',
      controller: 'AuthCtrl as AC'
    })
    .when('/user/:id', {
      templateUrl: 'templates/profile.html',
      controller: 'ProfileCtrl as PC'
    })
    .otherwise({
      redirectTo: '/'
    });
}

function interceptor($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
}
