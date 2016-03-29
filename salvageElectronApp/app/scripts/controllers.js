'use strict';

angular.module('salvage')
  .controller('IndexCtrl', ['$location', 'userService', IndexCtrl])
  .controller('MapCtrl', ['donationService', 'userService', MapCtrl])
  .controller('DonationCtrl', ['$location', 'donationService', DonationCtrl])
  .controller('LogCtrl', ['userService', 'donationService', LogCtrl])
  .controller('MainCtrl', [MainCtrl])
  .controller('AuthCtrl', ['$routeParams', '$location', 'authService', 'userService', 'coordService', AuthCtrl])
  .controller('ProfileCtrl', ['$location', 'userService', ProfileCtrl]);

function IndexCtrl($location, userService) {
  var vm = this;
  vm.logout = logout;
  vm.user = userService.getUser();

  if (userService.getLoginStatus()) {
    userService.User().then(function(res) {
      // console.log(res);
    });
  } else if (!userService.getLoginStatus()) {
    userService.setUser({}, false);
  }

  function logout() {
    userService.logout();
    vm.user = userService.getUser();
  }
}

function MapCtrl(donationService, userService) {
  var vm = this;
  var markers;
  var map;
  var info;
  vm.initMap = initMap;
  vm.donations = getDonations();
  vm.recipients = getRecipients();
  vm.user = userService.getUser();

  function initMap() {
    var lat, lng;
    if (vm.user.loggedIn) {
      lat = Number(vm.user.user.lat);
      lng = Number(vm.user.user.lng);
    } else {
      lat = 40.5852778;
      lng = -105.0838889;
    }
    markers = [];
    var styleArray = [{
      "featureType": "landscape",
      "stylers": [{
        "saturation": -100
      }, {
        "lightness": 65
      }, {
        "visibility": "on"
      }]
    }, {
      "featureType": "poi",
      "stylers": [{
        "saturation": -100
      }, {
        "lightness": 51
      }, {
        "visibility": "simplified"
      }]
    }, {
      "featureType": "road.highway",
      "stylers": [{
        "saturation": -100
      }, {
        "visibility": "simplified"
      }]
    }, {
      "featureType": "road.arterial",
      "stylers": [{
        "saturation": -100
      }, {
        "lightness": 30
      }, {
        "visibility": "on"
      }]
    }, {
      "featureType": "road.local",
      "stylers": [{
        "saturation": -100
      }, {
        "lightness": 40
      }, {
        "visibility": "on"
      }]
    }, {
      "featureType": "transit",
      "stylers": [{
        "saturation": -100
      }, {
        "visibility": "simplified"
      }]
    }, {
      "featureType": "administrative.province",
      "stylers": [{
        "visibility": "off"
      }]
    }, {
      "featureType": "water",
      "elementType": "labels",
      "stylers": [{
        "visibility": "on"
      }, {
        "lightness": -25
      }, {
        "saturation": -100
      }]
    }, {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{
        "hue": "#ffff00"
      }, {
        "lightness": -25
      }, {
        "saturation": -97
      }]
    }];
    // Create a map object and specify the DOM element for display.
    map = new google.maps.Map(document.getElementById('map'), {
      styles: styleArray,
      center: {
        lat: lat,
        lng: lng
      },
      scrollwheel: false,
      zoom: 14
    });

    info = new google.maps.InfoWindow();
  }

  function getDonations() {
    donationService.getAll().then(function(res) {
      if (res.status === 200) {
        vm.donations = res.data;
        drop(vm.donations, 'donations');
      }
    }).catch(function(err) {
      console.error(err);
    });
  }

  function drop(arr, category) {
    if (category === 'donations') {
      arr.forEach(function(post, idx) {
        userService.getById(post.donor).then(function(res) {
          var position = {
            lat: res.data.lat,
            lng: res.data.lng
          };
          var title = post.details;
          var id = post.id;
          var timeout = idx * 75;
          var icon;
          if (post.category === 'Food') {
            icon = '../images/marker_green_outline.png';
          } else if (post.category === 'Compost') {
            icon = '../images/marker_orange_outline.png';
          }
          addMarkerWithTimeout(position, title, id, timeout, icon);
        }).catch(function(err) {
          console.error(err);
        });
      });
    } else if (category === 'recipients') {
      arr.forEach(function(recipient, idx) {
        var position = {
          lat: recipient.lat,
          lng: recipient.lng
        };
        var title = recipient.organization;
        var id = recipient.id;
        var timeout = idx * 75;
        var icon;
        if (recipient.donation_type === 'food') {
          icon = '../images/marker_green.png';
        } else if (recipient.donation_type === 'compost') {
          icon = '../images/marker_orange.png';
        }
        addMarkerWithTimeout(position, title, id, timeout, icon);
      });
    }
  }

  function addMarkerWithTimeout(position, title, id, timeout, icon) {
    window.setTimeout(function() {
      var marker = new google.maps.Marker({
        position: position,
        map: map,
        animation: google.maps.Animation.DROP,
        title: title,
        id: id,
        icon: icon
      });
      marker.addListener('click', function() {
        map.panTo(position);
        // map.setZoom(15); Need to figure out a smooth zoom function
        info.setContent(title);
        info.open(map, marker);
      });
      markers.push(marker);
    }, timeout);
  }

  function getRecipients() {
    userService.getById('recipient').then(function(res) {
      if (res.status === 200) {
        vm.recipients = res.data;
        drop(vm.recipients, 'recipients');
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

function LogCtrl(userService, donationService) {
  var vm = this;
  vm.donations = getById();
  vm.remove = remove;

  function getById() {
    vm.user = userService.User().then(function(res) {
      vm.user = userService.getUser();
      var userId = res.data.id;
      userService.getById(userId).then(function(res) {
        vm.donations = res.data.donations;
      });
    }).catch(function(err) {
      console.error(err);
    });
  }

  function remove(donationId) {
    donationService.destroy(donationId).then(function(res) {
      vm.donations = getById();
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
      if (form.organization.$modelValue) {
        user.organization = form.organization.$modelValue;
      } else {
        user.organization = 'Individual Donor';
      }
      user.donation_type = 'none';
      user.notes = '';

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

function ProfileCtrl($location, userService) {
  var vm = this;
  vm.user = userService.userData;
  vm.update = update;
  vm.destroy = destroy;

  function update(form) {
    var user = {};
    user.role = vm.user.user.role;
    user.first_name = form.first_name.$modelValue;
    user.last_name = form.last_name.$modelValue;
    user.email = form.email.$modelValue;
    user.phone = form.phone.$modelValue;
    user.address = form.address1.$modelValue;
    user.city = form.city.$modelValue;
    user.state = form.state.$modelValue;
    user.zip = form.zip.$modelValue;
    if (form.organization.$modelValue) {
      user.organization = form.organization.$modelValue;
    } else {
      user.organization = 'Individual Donor';
    }
    userService.update(vm.user.user.id, user).then(function(res) {
      userService.setUser(res.data[0], true);
      userService.logout();
      $location.path('/login');

      // userService.User().then(function(res) {
      //
      // });
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
