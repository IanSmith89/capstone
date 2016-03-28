'use strict';

require('dotenv').load();
var express = require('express');
var app = express();

var _ = require('lodash');
var Waterline = require('waterline');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cors = require('cors');
var jwt = require('express-jwt');
var jsonWebToken = require('jsonWebToken');
var bcrypt = require('bcrypt');
var getLatLong = require('./scripts/latLong');

// Instantiate a new instance of the ORM
var orm = new Waterline();

// Waterline Config

// Require any waterline compatible adapters here
var postgresqlAdapter = require('sails-postgresql');

// Build A Config Object
var config = {

  // Setup Adapters
  // Creates named adapters that have been required
  adapters: {
    'default': postgresqlAdapter,
    postgresql: postgresqlAdapter
  },

  // Build Connections Config
  // Setup connections using the named adapter configs
  connections: {

    myLocalPostgres: {
      adapter: 'postgresql',
      host: process.env.PGHOST,
      database: process.env.PGDB
    }
  },

  defaults: {
    migrate: 'alter'
  }

};

// Waterline models

var User = Waterline.Collection.extend({

  identity: 'users',
  connection: 'myLocalPostgres',

  attributes: {
    role: 'string',
    organization: {
      type: 'string',
      defaultsTo: 'Individual Donor'
    },
    first_name: 'string',
    last_name: 'string',
    email: 'email',
    password: 'string',
    address: 'string',
    phone: 'string',
    city: 'string',
    state: 'string',
    zip: 'integer',
    lat: 'float',
    lng: 'float',
    donations: {
      collection: 'donations',
      via: 'donor'
    },
    received: {
      collection: 'donations',
      via: 'recipient'
    }
  },

  autoCreatedAt: true,
  autoUpdatedAt: true

});

var Donation = Waterline.Collection.extend({

  identity: 'donations',
  connection: 'myLocalPostgres',

  attributes: {
    category: 'string',
    details: 'text',
    amount: 'integer',
    pickup_date: 'dateTime',
    pickup_address: 'string',
    donor: {
      model: 'users'
    },
    recipient: {
      model: 'users'
    }
  },

  autoCreatedAt: true,
  autoUpdatedAt: true

});

// Load the Models into the ORM
orm.loadCollection(User);
orm.loadCollection(Donation);

// Express Setup

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(methodOverride());

var corsOptions = {
  origin: 'http://localhost:8080'
};
app.use(cors(corsOptions));

// CRUD routes

// GET '/users' shows admin page of all users
app.get('/users', function(req, res) {
  app.models.users.find().exec(function(err, users) {
    if (err) {
      return res.status(500).json({err: err});
    }
    res.json(users);
  });
});

// POST '/users' creates new user
app.post('/users', function(req, res) {
  var user = req.body;
  app.models.users.findOne({email: user.email}, function(err, model) {
    if (err) {
      return res.status(500).json({err: err});
    }
    if (model) {
      return res.status(500).json({err: 'email already exists'});
    } else {
      hashPassword(user, createUser);
    }
  });

  function hashPassword(user, callback){
    bcrypt.genSalt(10, function(err, salt){
      bcrypt.hash(user.password, salt, function(err, hash){
        user.password = hash;
        getLatLong(user, callback);
      });
    });
  }

  function createUser(user) {
    app.models.users.create(user, function(err, model) {
      if (err) {
        return res.status(500).json({err: err});
      }
      res.json(model);
    });
  }
});

// GET '/users/:id' finds one user
app.get('/users/:id', function(req, res) {
  if (req.params.id === 'recipient') {
    app.models.users.find({role: req.params.id}).exec(function(err, users) {
      if (err) {
        return res.status(500).json({err: err});
      }
      res.json(users);
    });
  } else {
    app.models.users.findOne({id: req.params.id}).populate('donations').exec(function(err, model) {
      if (err) {
        return res.status(500).json({err: err});
      }
      res.json(model);
    });
  }
});

// DELETE '/users/:id' deletes user
app.delete('/users/:id', jwt({secret: process.env.JWTSECRET}), function(req, res) {
  if (req.user.role === 'admin' || req.user.id === Number(req.params.id)) {
    app.models.users.destroy({id: Number(req.params.id)}, function(err) {
      if (err) {
        return res.status(500).json({err: err});
      }
      app.models.donations.destroy({donor: Number(req.params.id)}, function(err) {
        if (err) {
          return res.status(500).json({err: err});
        }
        res.json({status: 'User and donations deleted'});
      });
    });
  } else {
    return res.status(401).json({err: 'unauthorized'});
  }
});

// PUT '/users/:id' edits/updates one user
app.put('/users/:id', jwt({secret: process.env.JWTSECRET}), function(req, res) {
  if (req.user.role === 'admin' || req.user.id === Number(req.params.id)) {
    var user = req.body;
    // Don't pass ID to update
    delete user.id;
    getLatLong(user, updateUser);
  } else {
    return res.status(401).json({err: 'unauthorized'});
  }

  function updateUser(user) {
    app.models.users.update({id: req.params.id}, user, function(err, model) {
      if (err) {
        return res.status(500).json({err: err});
      }
      res.json(model);
    });
  }
});

// GET '/donations' shows all donations
app.get('/donations', function(req, res) {
  app.models.donations.find().exec(function(err, donations) {
    if (err) {
      return res.status(500).json({err: err});
    }
    // app.models.donations.add(donations.id);
    // app.models.donations.save(function(err){});
    res.json(donations);
  });
});

// POST '/donations' creates new donation
app.post('/donations', jwt({secret: process.env.JWTSECRET}), function(req, res) {
  var donation = req.body;
  donation.donor = req.user.id;
  donation.pickup_address = req.user.address + ', ' + req.user.city + ', ' + req.user.state + ', ' + req.user.zip;
  donation.recipient = 0;
  app.models.donations.create(donation, function(err, model) {
    if (err) {
      return res.status(500).json({err: err});
    }
    // app.models.donations.query('SELECT * FROM users WHERE id = ' + donation.donor, function(err, results) {
    //   console.log(results.rows[0]);
    // });
    res.json(model);
  });
});

// GET '/donations/:id' finds one donation
app.get('/donations/:id', function(req, res) {
  app.models.donations.findOne({id: req.params.id}, function(err, model) {
    if (err) {
      return res.status(500).json({err: err});
    }
    res.json(model);
  });
});

// DELETE '/donations/:id' deletes donation
app.delete('/donations/:id', jwt({secret: process.env.JWTSECRET}), function(req, res) {
  app.models.donations.findOne({id: req.params.id}, function(err, model) {
    if (err) {
      return res.status(500).json({err: err});
    }
    if (model.donor === req.user.id || req.user.role === 'admin') {
      app.models.donations.destroy({id: req.params.id}, function(err) {
        if (err) {
          return res.status(500).json({err: err});
        }
        res.json({status: 'donation deleted'});
      });
    } else {
      return res.status(401).json({err: 'unauthorized'});
    }
  });
});

// PUT '/donations/:id' edits/updates one donation
app.put('/donations/:id', jwt({secret: process.env.JWTSECRET}), function(req, res) {
  if (req.user.role === 'admin') {
    var donation = req.body;
    // Don't pass ID to update
    delete donation.id;
    app.models.donations.update({id: req.params.id}, donation, function(err, model) {
      if (err) {
        return res.status(500).json({err: err});
      }
      res.json(model);
    });
  } else {
    return res.status(401).json({err: 'unauthorized'});
  }
});

// POST '/login' authenticates user and sends JWT
app.post('/login', function(req, res) {
  app.models.users.findOne({email: req.body.email}, function(err, model) {
    if (err) {
      return res.status(500).json({err: 'failed to authenticate'});
    } else {
      bcrypt.compare(req.body.password, model.password, function(err, match){
        if (match) {
          var user = model;
          delete user.password;
          var secret = process.env.JWTSECRET;
          var options = {
            expiresIn: 14400
          };
          jsonWebToken.sign(user, secret, options, function(token) {
            res.json({token: token, user: user});
          });
        } else {
          return res.status(500).json({err: 'failed to authenticate'});
        }
      });
    }
  });
});

// GET '/user_info' returns user info
app.get('/user_info', jwt({secret: process.env.JWTSECRET}), function(req, res) {
  res.json(req.user);
});

// Start Waterline passing adapters in

orm.initialize(config, function(err, models) {
  if (err) {
    throw err;
  }

  app.models = models.collections;
  app.connections = models.connections;

  // Start Server
  app.listen(3000);

  console.log("Up and running on 3000");
});
