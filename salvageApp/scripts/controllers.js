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

  function register(form, isValid) {
    if (isValid) {
      var user = {};
      if (vm.userType === 'donor') {
        user.role = 'donor';
      } else {
        user.role = 'recipient';
      }
      user.first_name = form.first_name.$modelValue;
      user.last_name = form.last_name.$modelValue;
      user.email = form.email.$modelValue;
      user.password = form.password.$modelValue;
      if (form.address2.$modelValue) {
        user.address = form.address1.$modelValue + ', ' + form.address2.$modelValue;
      } else {
        user.address = form.address1.$modelValue;
      }
      user.city = form.city.$modelValue;
      user.state = form.state.$modelValue;
      user.zip = form.zip.$modelValue;
      if (form.organization) {
        user.organization = form.organization.$modelValue;
      }

      authService.register(user).then(function(res) {
        console.log(res);
      }).catch(function(err) {
        console.err(err);
      });
    }
  }
}
