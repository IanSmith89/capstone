'use strict';

angular.module('salvage')
  .service('authService', ['$http', authService]);

function authService($http) {
  this.login = login;
  this.register = register;

  function login(user) {
    return $http.post('http://localhost:3000/login', user).then(function(response) {
      return response;
    }, function(err) {
      throw err;
    });
  }

  function register(user) {
    return $http.post('http://localhost:3000/users', user).then(function(response) {
      return response;
    }, function(err) {
      throw err;
    });
  }
}
