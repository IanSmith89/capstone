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

// Instantiate a new instance of the ORM
var orm = new Waterline();

// Waterline Config

// Require any waterline compatible adapters here
var diskAdapter = require('sails-disk');
var postgresqlAdapter = require('sails-postgresql');

// Build A Config Object
var config = {

  // Setup Adapters
  // Creates named adapters that have been required
  adapters: {
    'default': diskAdapter,
    disk: diskAdapter,
    postgresql: postgresqlAdapter
  },

  // Build Connections Config
  // Setup connections using the named adapter configs
  connections: {
    myLocalDisk: {
      adapter: 'disk'
    },

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

  identity: 'user',
  connection: 'myLocalDisk',

  attributes: {
    role: 'string',
    organization: 'string',
    first_name: {
      type: 'string',
      required: true
    },
    last_name: {
      type: 'string',
      required: true
    },
    email: {
      type: 'email',
      required: true
    },
    password: {
      type: 'string',
      required: true
    },
    address: 'string',
    phone: 'string',
    city: 'string',
    state: 'string',
    zip: 'integer',
    donations: {
      collection: 'donation',
      via: 'donor'
    },
    received: {
      collection: 'donation',
      via: 'recipient'
    },
    fullName: function() {
      return this.first_name + ' ' + this.last_name;
    }
  },

  autoCreatedAt: true,
  autoUpdatedAt: true

});

var Donation = Waterline.Collection.extend({

  identity: 'donation',
  connection: 'myLocalPostgres',

  attributes: {
    type: {
      type: 'string',
      enum: ['donation', 'compost']
    },
    details: 'text',
    amount: 'integer',
    status: {
        type: 'string',
        defaultsTo: 'pending',
        enum: ['pending', 'en_route', 'dropped']
    },
    pickup_date: 'dateTime',
    donor: {
      model: 'user'
    },
    recipient: {
      model: 'user'
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
  origin: 'http://localhost:8100'
};
app.use(cors(corsOptions));

// CRUD routes

// GET '/users' shows admin page of all users
app.get('/users', function(req, res) {
  app.models.user.find().exec(function(err, users) {
    if (err) {
      return res.status(500).json({err: err});
    }
    res.json(users);
  });
});

// POST '/users' creates new user
app.post('/users', function(req, res) {
  var user = req.body;
  app.models.user.findOne({email: user.email}, function(err, model) {
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
        callback(user);
      });
    });
  }

  function createUser(user) {
    app.models.user.create(user, function(err, model) {
      if (err) {
        return res.status(500).json({err: err});
      }
      res.json(model);
    });
  }
});

// GET '/users/:id' finds one user
app.get('/users/:id', function(req, res) {
  app.models.user.findOne({id: req.params.id}, function(err, model) {
    if (err) {
      return res.status(500).json({err: err});
    }
    res.json(model);
  });
});

// DELETE '/users/:id' deletes user
app.delete('/users/:id', jwt({secret: process.env.JWTSECRET}), function(req, res) {
  if (req.user.role === 'admin' || req.user.id === req.params.id) {
    app.models.user.destroy({id: req.params.id}, function(err) {
      if (err) {
        return res.status(500).json({err: err});
      }
      res.json({status: 'User deleted'});
    });
  } else {
    return res.status(401).json({err: 'unauthorized'});
  }
});

// PUT '/users/:id' edits/updates one user
app.put('/users/:id', jwt({secret: process.env.JWTSECRET}), function(req, res) {
  if (req.user.role === 'admin' || req.user.id === req.params.id) {
    var user = req.body;
    // Don't pass ID to update
    delete user.id;
    app.models.user.update({id: req.params.id}, user, function(err, model) {
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
  app.models.user.findOne({email: req.body.email}, function(err, model) {
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
            res.json({token: token});
          });
        } else {
          return res.status(500).json({err: 'failed to authenticate'});
        }
      });
    }
  });
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
