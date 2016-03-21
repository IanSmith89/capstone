'use strict';

angular.module('salvage')
  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'templates/main.html',
        controller: 'MainCtrl as MC'
      })
      .when('/login', {
        templateUrl: 'templates/login.html',
        controller: 'AuthCtrl as AC'
      });
  });
