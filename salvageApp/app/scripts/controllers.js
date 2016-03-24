'use strict';

angular.module('salvage')
.controller('IndexCtrl', ['$location', 'userService', IndexCtrl])
.controller('MapCtrl', [MapCtrl])
.controller('DonationCtrl', ['$location', 'donationService', DonationCtrl])
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
  vm.initMap = initMap();

  function initMap() {
    // Create a map object and specify the DOM element for display.
    var map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: -34.397, lng: 150.644},
      scrollwheel: false,
      zoom: 8
    });
  }
}

function DonationCtrl($location, donationService) {
  var vm = this;
  vm.donations = get();
  vm.post = post;

  // DatePicker
  vm.today = today;
  vm.today();
  vm.clear = clear;
  vm.dateOptions = {
    // dateDisabled: disabled, // Uncomment to allow for disabling certain days
    formatYear: 'yy',
    maxDate: new Date(2020, 5, 22),
    minDate: new Date(),
    startingDay: 0
  };
  vm.open = open;
  vm.setDate = setDate;
  vm.altInputFormats = ['M!/d!/yyyy'];
  vm.popup = {
    opened: false
  };
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var afterTomorrow = new Date();
  afterTomorrow.setDate(tomorrow.getDate() + 1);
  vm.events = [
    {
      date: tomorrow,
      status: 'full'
    },
    {
      date: afterTomorrow,
      status: 'partially'
    }
  ];

  function get() {
    donationService.getAll().then(function(res) {
      if (res.status === 200) {
        vm.donations = res.data;
        // console.log(res);
      }
    }).catch(function(err) {
      console.error(err);
    });
  }

  function post(form, isValid) {
    if (isValid) {
      var donation = {};
      donation.category = form.category.$modelValue;
      donation.details = form.details.$modelValue;
      donation.amount = form.amount.$modelValue;
      donation.pickup_date = form.pickup_date.$modelValue;
      donationService.post(donation).then(function(res) {
        if (res.status === 200) {
          $location.path('/map');
        }
      }).catch(function(err) {
        console.error(err);
      });
    }
  }

  function today() {
    vm.pickup_date = new Date();
  }

  function clear() {
    vm.pickup_date = null;
  }

  function open() {
    vm.popup.opened = true;
  }

  function setDate(year, month, day) {
    vm.pickup_date = new Date(year, month, day);
  }

  // Disable weekend selection
  // function disabled(data) {
  //   var date = data.date,
  //     mode = data.mode;
  //   return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
  // }
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
      user.phone = form.phone.$modelValue;
      user.address = form.address1.$modelValue;
      user.city = form.city.$modelValue;
      user.state = form.state.$modelValue;
      user.zip = form.zip.$modelValue;
      if (form.organization) {
        user.organization = form.organization.$modelValue;
      }

      authService.register(user).then(function(res) {
        if (res.status === 200) {
          $location.path('/login');
        }
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
