'use strict';

angular.module('salvage')
.controller('IndexCtrl', [IndexCtrl])
.controller('MainCtrl', [MainCtrl])
.controller('AuthCtrl', ['authService', '$routeParams', AuthCtrl]);

function IndexCtrl() {
  var vm = this;
  vm.logout = logout;

  function logout() {
    localStorage.clear();
  }
}

function MainCtrl() {
  var vm = this;
}

function AuthCtrl(authService, $routeParams) {
  var vm = this;
  vm.userType = $routeParams.user;
  vm.stepOne = 'incomplete';
  vm.login = login;
  vm.register = register;

  function login(user) {
    authService.login(user).then(function(res) {
      if (res.status === 200) {
        localStorage.setItem('Authorization', res.data.token);
      }
    }).catch(function(err) {
      console.error(err);
    });
  }

  function register(user) {
    if (user.address2) {
      user.address = user.address1 + ', ' + user.address2;
    } else {
      user.address = user.address1;
    }
    delete user.address1;
    delete user.address2;
    if (vm.userType === 'donor') {
      user.role = 'donor';
    } else {
      user.role = 'recipient';
    }
    authService.register(user).then(function(res) {
      console.log(res);
    }).catch(function(err) {
      console.err(err);
    });
  }
}
