'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const { ObjectID } = require('mongodb');
const passport = require('passport')
const LocalStrategy = require('passport-local');
const session = require('express-session')


const app = express();

// Use Session //
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Passpord Initialization //
app.use(passport.initialize())
app.use(passport.session())

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine','pug');
app.set('views', './views/pug');

myDB(async client => {

  const myDataBase = await client.db('database').collection('users');
 
  // Be sure to change the title
  app.route('/').get((req, res) => {
    // Change the response to render the Pug template

    res.render('index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true 
    });
  });
  // Serialization and deserialization here...
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });
  
  // Passport Authenticate using Local Strategy
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) return done(err);
      if (!user) return done(null, false);
      if (password !== user.password) return done(null, false);
      return done(null, user);
    });
  }));


  app.post('/login', 
  passport.authenticate('local',{failureRedirect: '/' }),
  (err, res) => {
    res.redirect('/profile')
  }) 

  app
    .route('/profile')
    .get(ensureAuthenticated, (req, res) => {
      console.log(req.user)
      res.render('profile',{username: req.user.username});
  });


}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});

function ensureAuthenticated(req, res, next) {
  //console.log(req)
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

// app.listen out here...
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});


