/* EXPRESS SETUP */
const express = require('express');
const app = express();
const cors = require('cors');

// Enable CORS for all routes
app.use(cors());

app.use(express.static(__dirname));

const bodyParser = require('body-parser');
const expressSession = require('express-session')({
    secret:'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 60000
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSession);


/* PASSPORT SETUP */
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

/* MONGOOSE SETUP */
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect('mongodb://localhost/MyDatabase',
{useNewUrlParser: true, useUnifiedTopology: true});

const Schema = mongoose.Schema;
const UserDetail = new Schema({
    username: String,
    password: String
})
UserDetail.plugin(passportLocalMongoose);
const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo');

/* PASSPORT LOCAL AUTHENTICATION */
passport.use(UserDetails.createStrategy());

passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());

/* ROUTES */
const connectEnsureLogin = require('connect-ensure-login');
app.post('/login', (req, res, next) => {
    passport.authenticate('local',
        (err,user,info)=>{
            if(err){
                return next(err);
            }

            if(!user){
                return res.redirect('/login?info=' + info);
            }

            req.logIn(user, function(err){
            if(err){
                console.log(err)
                return next(err);
            }
            return res.redirect('/');
            });

        })(req,res,next);
});

app.get('/login',
    (req, res) => res.sendFile('html/login.html',
    {root:__dirname})
);

app.get('/',
    connectEnsureLogin.ensureLoggedIn(),
    (req, res) => res.sendFile( 'html/index.html',{root:__dirname})
);

app.get('/private',
    connectEnsureLogin.ensureLoggedIn(),
    (req, res) => res.sendFile( 'html/private.html',{root:__dirname})
);

// app.get('/user',
//     connectEnsureLogin.ensureLoggedIn(),
//     (req, res) => res.send({user: req.user})
// );
app.get('/user', (req, res) => {
    console.log('Accessing /user route');
    console.log('req.user:', req.user);
    console.log('req.session:', req.session);
    console.log('req.isAuthenticated():', req.isAuthenticated());

    if (req.isAuthenticated() && req.user) {
        res.json({user: req.user});
    } else {
        res.status(401).json({error: 'User not authenticated'});
    }
});

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.sendFile('html/logout.html', { root: __dirname });
    });
});
/* REGISTER SOME USERS */
// UserDetails.register({username: 'paul', active: false},'paul');
// UserDetails.register({username:'joy', active: false},'joy');
// UserDetails.register({username: 'ray',active: false},'ray');



const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('App Listening on port ' + port));

