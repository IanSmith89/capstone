'use strict';

angular.module('salvage')
.service('authService', ['$http', authService])
.service('userService', ['$http', '$location', userService])
.service('donationService', ['$http', '$location', donationService])
.factory('authInterceptor', ['$location', '$q', authInterceptor]);

function authService($http) {
  return {
    login: login,
    register: register,
    destroy: deleteUser
  };

  function login(user) {
    return $http.post('http://localhost:3000/login', user).then(function(response) {
      return response;
    }, function(err) {
      if (err) {throw err;}
    });
  }

  function register(user) {
    return $http.post('http://localhost:3000/users', user).then(function(response) {
      return response;
    }, function(err) {
      if (err) {throw err;}
    });
  }

  function deleteUser(user) {
    return $http.delete('http://localhost:3000/users/' + user.id).then(function(response) {
      return response;
    }, function(err) {
      if (err) {throw err;}
    });
  }
}

function userService($http, $location) {
  var userData = {
    user: {},
    handle: 'Users',
    loggedIn: false
  };

  return {
    User: dataFromServer,
    getUser: getUser,
    setUser: setUser,
    getLoginStatus: checkLogin,
    logout: logout
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
      if (err) {throw err;}
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

function donationService($http, $location) {
  return {
    get: getDonations,
    post: postDonation,
    getById: getDonationById,
    update: updateDonation,
    destroy: deleteDonation
  };

  function getDonations() {
    return $http.get('http://localhost:3000/donations').then(function(response) {
      return response;
    }, function(err) {
      if (err) {throw err;}
    });
  }

  function postDonation(donation) {
    return $http.post('http://localhost:3000/donations', donation).then(function(response) {
      return response;
    }, function(err) {
      if (err) {throw err;}
    });
  }

  function getDonationById(id) {
    return $http.get('http://localhost:3000/donations/' + id).then(function(response) {
      return response;
    }, function(err) {
      if (err) {throw err;}
    });
  }

  function updateDonation(id, donation) {
    return $http.put('http://localhost:3000/donations/' + id, donation).then(function(response) {
      return response;
    }, function(err) {
      if (err) {throw err;}
    });
  }

  function deleteDonation(id) {
    return $http.delete('http://localhost:3000/donations/' + id).then(function(response) {
      return response;
    }, function(err) {
      if (err) {throw err;}
    });
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
