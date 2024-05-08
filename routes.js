const passport = require('passport')
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt')

module.exports = function(app, myDataBase) {

  // Be sure to change the title
  app.route('/')
  .get((req, res) => {
    // Change the response to render the Pug template
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showSocialAuth: true
    });
  });

  app.post('/login', 
  passport.authenticate('local',{failureRedirect: '/' }),
  (err, res) => {
    res.redirect('/profile')
  })

  app
  .route('/profile')
  .get(ensureAuthenticated, (req, res) => {
    //console.log(req.user)
    res.render('profile',{username: req.user.username});
  });

  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect('/');
  });

//   app
//   .route('/logout')
//   .get((req, res, next)=>{
//     req.logout((err)=>{
//       if (err) {
//         return next(err)         
//       }
//       res.redirect('/');
//     });
//   })

  app.route('/register')
  .get((req, res) => {
    res.render('index', {showRegistration: true})
  })

  app.route('/register')
  .post(
    //post callback 1
    (req, res, next) => {
    myDataBase.findOne({ username: req.body.username },
    (err, user) => {
      if (err) {
        console.log(err)
        next(err);
      } else if (user) {
        res.redirect('/');
      } else {
        const hash = bcrypt.hashSync(req.body.password, 12);
        myDataBase.insertOne(
            {username: req.body.username, password: hash},  
            (err, doc) => {
                if (err) {
                    console.log(err)
                    res.redirect('/');
                } else {
                    // The inserted document is held within
                    // the ops property of the doc
                    next(null, doc.ops[0]);
                }
            }
        )
      }
    })
  }, 
  //post callback 2
  passport.authenticate('local', { failureRedirect: '/' }),
  //post callback 3
  (req, res, next) => {
    res.redirect('/profile');
  }
  ) //end register post;

  app.route('/auth/github')
  .get(
    passport.authenticate('github')
  )

  app.route('/auth/github/callback')
  .get(
    passport.authenticate('github',{failureRedirect: '/' }),
    (err, res) => {
        req.session.user_id = req.user.id;
        res.redirect('/chat');
    }
  )

  app.route('/chat')
  .get(ensureAuthenticated, (req, res) => {
    //console.log(req.user)
    res.render('chat',{user: req.user});
  })

   app.use((req, res, next)=>{
       res.status(404)
         .type('text')
         .send('Not Found')
   });

}

function ensureAuthenticated(req, res, next) {
    //console.log(req)
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
};
