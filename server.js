'use strict';
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const session = require('express-session')
const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);

const auth = require('./auth.js')
const routes = require('./routes.js')

// Use Session //
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));


fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine','pug');
app.set('views', './views/pug');

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  let currentUsers = 0;
  io.on('connection', socket => {
    ++ currentUsers;
    io.emit('user count', currentUsers);
    console.log('A user has connected');
  });

  io.on('disconnect', () => {
    -- currentUsers;
    io.emit('user count', currentUsers);
    console.log('A user has disconnectted');
  });

  auth(app, myDataBase);
  routes(app, myDataBase);
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});

// app.listen out here...
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});


