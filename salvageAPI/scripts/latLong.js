'use strict';

require('dotenv').load();
var https = require('https');

module.exports = function(user, callback) {

  var noSpaceAddress = user.address.replace(/\s/g, '');
  var noSpaceCity = user.city.replace(/\s/g, '');
  var options = {
    host: 'maps.googleapis.com',
    path: '/maps/api/geocode/json?address=' + noSpaceAddress + noSpaceCity + user.zip + '&components=administrative_area:' + user.state + '&key=' + process.env.GoogleMapsAPIKEY
  };

  var req = https.get(options, function(res) {
    // console.log('STATUS: ' + res.statusCode);
    // console.log('HEADERS: ' + JSON.stringify(res.headers));

    // Buffer the body entirely for processing as a whole.
    var bodyData = [];
    res.on('data', function(resData) {
      // You can process streamed parts here...
      bodyData.push(resData);
    }).on('end', function() {
      var body = Buffer.concat(bodyData);
      // console.log('BODY: ' + body);
      var data = JSON.parse(body);
      var location = data.results[0].geometry.location;
      // ...and/or process the entire body here.
      user.lat = location.lat;
      user.lng = location.lng;
      callback(user);
    });
  });

  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
  });
};
