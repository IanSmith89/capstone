'use strict';

angular.module('salvage')
.controller('IndexCtrl', ['$location', 'userService', IndexCtrl])
.controller('MapCtrl', [MapCtrl])
.controller('MainCtrl', [MainCtrl])
.controller('AuthCtrl', ['$routeParams', '$location', 'authService', 'userService', AuthCtrl])
.controller('ProfileCtrl', ['authService', ProfileCtrl]);

function IndexCtrl($location, userService) {
  var vm = this;
  vm.logout = logout;

  vm.user = userService.getUser();

  if (userService.getLoginStatus()) {
    userService.User().then(function(res) {
      // console.log(res);
    });
  }

  if (vm.user.loggedIn) {
    userService.User().then(function(res) {
      // console.log(res);
    });
  }

  function logout() {
    userService.logout();
    vm.user = userService.getUser();
  }
}

function MapCtrl() {
  var vm = this;
  vm.center = {
    latitude: 45,
    longitude: 72
  };
  vm.zoom = 8;
}

function MainCtrl() {
  var vm = this;
}

function AuthCtrl($routeParams, $location, authService, userService) {
  var vm = this;
  vm.userType = $routeParams.user;
  vm.stepOne = 'incomplete';
  vm.login = login;
  vm.register = register;

  function login(user) {
    authService.login(user).then(function(res) {
      if (res.status === 200) {
        localStorage.setItem('Authorization', 'Bearer ' + res.data.token);
        $location.path('/');
        userService.User().then(function(res) {
          // console.log(res);
        });
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
        console.error(err);
      });
    }
  }
}

function ProfileCtrl(authService) {
  var vm = this;
  vm.destroy = destroy;

  function destroy(user) {
    authService.destroy(user).then(function(res) {
      console.log(res);
    }).catch(function(err) {
      console.error(err);
    });
  }
}
