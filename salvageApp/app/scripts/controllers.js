'use strict';

angular.module('salvage')
.controller('IndexCtrl', ['$location', 'userService', IndexCtrl])
.controller('MapCtrl', ['donationService', 'userService', MapCtrl])
.controller('DonationCtrl', ['$location', 'donationService', DonationCtrl])
.controller('LogCtrl', ['$routeParams', 'userService', LogCtrl])
.controller('MainCtrl', [MainCtrl])
.controller('AuthCtrl', ['$routeParams', '$location', 'authService', 'userService', 'coordService', AuthCtrl])
.controller('ProfileCtrl', ['userService', ProfileCtrl]);

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

function MapCtrl(donationService, userService) {
  var vm = this;
  vm.initMap = initMap;
  vm.donations = getDonations();
  vm.recipients = getRecipients();

  function initMap() {
    var styleArray = [{
      featureType: "all",
      stylers: [{
        saturation: -80
      }]
    }, {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{
        hue: "#00ffee"
      }, {
        saturation: 50
      }]
    }, {
      featureType: "poi.business",
      elementType: "labels",
      stylers: [{
        visibility: "off"
      }]
    }];
    // Create a map object and specify the DOM element for display.
    var map = new google.maps.Map(document.getElementById('map'), {
      styles: styleArray,
      center: {
        lat: -34.397,
        lng: 150.644
      },
      scrollwheel: false,
      zoom: 8
    });
  }

  function getDonations() {
    donationService.getAll().then(function(res) {
      if (res.status === 200) {
        vm.donations = res.data;
      }
    }).catch(function(err) {
      console.error(err);
    });
  }

  function getRecipients() {
    userService.getById('recipient').then(function(res) {
      if (res.status === 200) {
        vm.recipients = res.data;
      }
    }).catch(function(err) {
      console.error(err);
    });
  }
}

function DonationCtrl($location, donationService) {
  var vm = this;
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
  vm.events = [{
    date: tomorrow,
    status: 'full'
  }, {
    date: afterTomorrow,
    status: 'partially'
  }];

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

function LogCtrl($routeParams, userService) {
  var vm = this;
  vm.$routeParams = $routeParams;
  vm.donations = getById();

  function getById() {
    var user = userService.User().then(function(res) {
      user = userService.getUser();
      var userId = res.data.id;
      userService.getById(userId).then(function(res) {
        vm.handle = user.handle;
        vm.donations = res.data.donations;
      });
    }).catch(function(err) {
      console.error(err);
    });
  }
}

function MainCtrl() {
  var vm = this;
}

function AuthCtrl($routeParams, $location, authService, userService, coordService) {
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
      // user.lat and user.long
      // var coordinates = coordService.getLatLong(user.city, user.state).then(function(res) {
      //   console.log(res);
      // }).catch(function(err) {
      //   console.error(err);
      // });
      if (form.organization.$modelValue) {
        user.organization = form.organization.$modelValue;
      } else {
        user.organization = 'Individual Donor';
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

function ProfileCtrl(userService) {
  var vm = this;
  vm.user = userService.getUser();
  vm.handle = vm.user.handle;
  vm.update = update;
  vm.destroy = destroy;

  function update(userId, newData) {
    userService.update(userId, newData).then(function(res) {
      console.log(res);
    }).catch(function(err) {
      console.error(err);
    });
  }

  function destroy(userId) {
    if (confirm('Are you sure you want to delete your profile?')) {
      userService.destroy(userId).then(function(res) {
        userService.logout();
        // TODO change user handle in menu bar back to "Users"
      }).catch(function(err) {
        console.error(err);
      });
    }
  }
}
