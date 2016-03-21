'use strict';

angular.module('salvage')
  .service('authService', ['$http', authService]);

function authService($http) {
  this.login = login;

  function login(user) {
    return $http.post('http://localhost:3000/login', user).then(function(response) {
      return response;
    }, function(err) {
      throw err;
    });
  }
}
