// import with type defitions
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as passport from 'passport';

// no type definitions available
let sslRootCas = require('ssl-root-cas');
let passportGithub = require('passport-github');
let merge = require('merge');
let expressSession = require('express-session');
let githubApi = require('github');

// constants
const SRC = '../../src/client';
const DIST = '../../dist/client';
const NPM = '../../node_modules';
const CERT = '../../certs';

// init express
let app = express();
app.use(bodyParser.json());
app.use(cookieParser());
let cookieSession = expressSession({
    secret: 'SECRET',
    saveUninitialized: true,
    resave: false,
    cookie: {
        maxAge: 20 * 365 * 24 * 60 * 60 * 1000
    }
});
app.use(cookieSession);
app.use(passport.initialize());
app.use(passport.session());


// serve static files
app.use('/client', express.static(path.join(__dirname, DIST)));
app.use('/client', express.static(path.join(__dirname, SRC)));
app.use('/node_modules', express.static(path.join(__dirname, NPM)));

// add certificates if needed
let certs = fs.readdirSync(path.join(__dirname, CERT));
certs.forEach(function (cert) {
    if (path.extname(cert) === '.crt') {
        sslRootCas.inject().addFile(path.join(__dirname, CERT, cert));
    }
});

// passport setup
let passportOptions = {
    clientID: process.env.GITHUB_CLIENT,
    clientSecret: process.env.GITHUB_SECRET,
    authorizationURL: process.env.GITHUB_PROTOCOL + '://' + process.env.GITHUB_HOST + '/login/oauth/authorize',
    tokenURL: process.env.GITHUB_PROTOCOL + '://' + process.env.GITHUB_HOST + '/login/oauth/access_token',
    userProfileURL: process.env.GITHUB_PROTOCOL + '://' + process.env.GITHUB_API_BASE + process.env.GITHUB_API_PATH + '/user'
};

passport.use( new passportGithub.Strategy(passportOptions, function(accessToken, refreshToken, profile, done) {
    done(null, merge(profile._json, { token: accessToken }));
}));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

// login and logout callback using oauth flow
let checkReturnTo = function(req, res, next) {
    let returnTo = req.query.redirect;
    if (returnTo) {
        req.session.returnTo = returnTo;
    }
    next();
};

app.get('/auth/github', checkReturnTo, passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/callback', passport.authenticate('github', { successReturnToOrRedirect: '/' }));

app.get('/logout', function(req, res, next) {
        req.logout();
        if (!req.query.noredirect) {
            res.redirect('/');
        } else {
            next();
        }
    }
);

// serve page if user is logged in or not
app.get('/', function(req, res, next) {
    let filePath;
    if (req.user) {
        filePath = path.join(__dirname, SRC, 'main.html');
    }
    else {
        filePath = path.join(__dirname, SRC, 'login.html');
    }
    res.status(200).sendFile(filePath);
});

app.get('/following', function(req, res){

    let github = new githubApi({
        version: '3.0.0',
        protocol: process.env.GITHUB_PROTOCOL,
        host: process.env.GITHUB_API_BASE,
        pathPrefix: process.env.GITHUB_API_PATH,
        timeout: 5000
    });
    github.authenticate({
        type: 'oauth',
        token: req.user.token
    });

    github.user.getFollowing({ }, function(err, ghRes) {
        res.status(200).send(ghRes);
    });
});

// start server
let server = http.createServer(app);
server.listen(4000);
