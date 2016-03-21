'use strict';

angular.module('salvage')
.controller('IndexCtrl', [IndexCtrl])
.controller('MainCtrl', [MainCtrl])
.controller('AuthCtrl', ['authService', AuthCtrl]);

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

function AuthCtrl(authService) {
  var vm = this;
  vm.login = login;

  function login(user) {
    authService.login(user).then(function(res) {
      if (res.status === 200) {
        localStorage.setItem('Authorization', res.data.token);
      }
    }).catch(function(err) {
      console.error(err);
    });
  }
}
