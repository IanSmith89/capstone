'use strict';

angular.module('salvage')
  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'templates/main.html',
        controller: 'MainCtrl as MC'
      });
  });
