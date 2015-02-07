var _              = require('lodash');
var config         = require('../common/config');
var GoogleStrategy = require('passport-google').Strategy;
var logger         = require('../common/logger')(module);
var passport       = require('passport');
var apiServer      = require('../api/apiServer');
var BasicStrategy  = require('passport-http').BasicStrategy;

passport.serializeUser(function(user, done){
	// logger.trace({ user: user }, "serializing user -> obj");
	done(null, user);
});

passport.deserializeUser(function(obj, done){
	// logger.trace({ obj: obj }, "deserializing obj -> user");
	done(null, obj);
});

passport.use(new GoogleStrategy({
		returnURL: config.httpServer.baseUrl + '/auth/google/return',
		realm: config.httpServer.baseUrl
	}, function(identifier, profile, done){
		// logger.trace({ identifier: identifier, profile: profile }, "verifying user");

		var email = profile.emails[0].value;
		var user = {
			fullname: profile.displayName,
			email: email,
			roles: {
				isAdmin: _.contains(config.auth.admins, email),
				isTabletUser: false
			},
			googleId: identifier
		};

		done(null, user);
	}));

module.exports.requireAdminUser = function(req, res, next){
	var isAuthenticated = req.isAuthenticated();
	var isAuthorized = isAuthenticated && req.user && req.user.roles.isAdmin;

	// logger.trace({ isAuthenticated: isAuthenticated, user: req.user }, "checking if %s is an admin with access to %s", req.user, req.path);

	//TODO any express-specific req/res commands may need to be updated for restify
	if(!isAuthenticated){
		req.session.afterLoginRedirect = req.originalUrl;
		res.redirect('/login');
	} else if(!isAuthorized){
		req.logout();
		res.redirect('/dashboard');
	} else {
		next();
	}
};

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

module.exports.requireTabletUser = passport.authenticate('basic', {	session: false });
	
