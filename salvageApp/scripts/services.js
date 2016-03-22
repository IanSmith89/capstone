'use strict';

angular.module('salvage')
.service('authService', ['$http', authService])
.service('userService', ['$http', '$location', userService])
.factory('authInterceptor', ['$location', '$q', authInterceptor]);

function authService($http) {
  this.name = '';
  this.login = login;
  this.register = register;
  this.destroy = destroy;

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

  function destroy(user) {
    return $http.delete('http://localhost:3000/users/' + user.id).then(function(response) {
      return response;
    }, function(err) {
      throw err;
    });
  }
}

function userService($http, $location) {
  this.User = dataFromServer;
  this.getUser = getUser;
  this.setUser = setUser;
  this.getLoginStatus = checkLogin;
  this.logout = logout;

  var userData = {
    user: {},
    handle: 'Users',
    loggedIn: false
  };

  function dataFromServer() {
    return $http.get('http://localhost:3000/user_info').then(function(response) {
      userData.user = response.data;
      userData.loggedIn = true;
      if (response.data.organization !== 'Individual Donor') {
        userData.handle = response.data.organization;
      } else {
        userData.handle = response.data.first_name + ' ' + response.data.last_name;
      }
      return response;
    }, function(err) {
      throw err;
    });
  }

  function getUser() {
    return userData;
  }

  function setUser(user) {
    userData = user;
  }

  function checkLogin() {
    if (localStorage.getItem('Authorization')) {
      userData.loggedIn = true;
    } else {
      userData.loggedIn = false;
    }
    return userData.loggedIn;
  }

  function logout() {
    localStorage.clear();
    userData = {
      user: {},
      handle: 'Users',
      loggedIn: false
    };
    $location.path('/');
  }
}

function authInterceptor($location, $q) {
  return {
    request: function(config) {
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      var token = localStorage.getItem('Authorization');
      if (token) {
        config.headers.Authorization = token;
      }
      return $q.resolve(config);
    },
    responseError: function(err) {
      if (err.data === 'invalid token' || err.data === 'invalid signature' || err.data === 'jwt malformed' || err.status === 401) {
        localStorage.clear();
        $location.path('#/login');
        return $q.reject(err);
      }
      return $q.reject(err);
    }
  };
}
