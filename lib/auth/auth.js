var _              = require('lodash');
var apiServer      = require('../api/apiServer');
var BasicStrategy  = require('passport-http').BasicStrategy;
var config         = require('../common/config');
var fs             = require('fs');
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var logger         = require('../common/logger')(module);
var passport       = require('passport');

module.exports.requireAdminUser = requireAdminUser;
module.exports.requireTabletUser = passport.authenticate('basic', { session: false });

passport.serializeUser(function(user, done){
	done(null, user);
});

passport.deserializeUser(function(obj, done){
	done(null, obj);
});

passport.use(new GoogleStrategy({
		clientID: config.auth.google.clientID,
		clientSecret: config.auth.google.clientSecret,
		callbackURL: config.auth.google.callbackURL,
		passReqToCallback: true

	}, function(req, accessToken, refreshToken, profile, done){
		var email = profile.emails[0].value;
		var user = {
			email: email,
			roles: {
				isAdmin: isAdmin(email)
			},
			googleId: profile.id
		};

		return done(null, user);
	}));

function requireAdminUser(req, res, next){
	var isAuthenticated = req.isAuthenticated();
	var isAuthorized = isAuthenticated && req.user && req.user.roles.isAdmin;

	if(!isAuthenticated){
		if(req.accepts('html')){
			req.session.afterLoginRedirect = req.originalUrl;
			res.redirect('/login');
		} else {
			res.send(401, "log in at /login to get a session cookie");
		}
	} else if(!isAuthorized){
		if(req.accepts('html')){
			req.setToastMessage("error", "auth.authenticated_but_not_authorized_for_admin");
			req.logout();
			res.redirect('/');
		} else {
			res.send(403, "you are not authorized to view this page");
		}
	} else {
		next();
	}
}

function isAdmin(email){
	return _.indexOf(config.auth.admins, email) !== -1;
}

passport.use(new BasicStrategy(function(username, password, done){
	var tabletUsers = config.auth.tabletUsers;

	if(!_.has(tabletUsers, username)){
		// missing user
		return done(null, false);
	} else if(tabletUsers[username] !== password){
		// password mismatch
		return done(null, false);
	} else {
		// success
		return done(null, {
			username: username,
			roles: {
				isAdmin: false,
				isTabletUser: true
			}
		});
	}
}));