var _              = require('lodash');
var config         = require('../common/config');
var GoogleStrategy = require('passport-google').Strategy;
var logger         = require('../common/logger')(module);
var passport       = require('passport');
var apiServer      = require('../api/apiServer');


module.exports.requireAdminUser = requireAdminUser;
module.exports.requireTabletUser = requireTabletUser;

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
				isAdmin: _.contains(config.auth.admins, email)
			},
			googleId: identifier
		};

		done(null, user);
	}));

function requireAdminUser(req, res, next){
	var isAuthenticated = req.isAuthenticated();
	var isAuthorized = isAuthenticated && req.user && req.user.roles.isAdmin;

	// logger.trace({ isAuthenticated: isAuthenticated, user: req.user }, "checking if %s is an admin with access to %s", req.user, req.path);

	if(!isAuthenticated){
		req.session.afterLoginRedirect = req.originalUrl;
		res.redirect('/login');
	} else if(!isAuthorized){
		req.setToastMessage("error", "auth.authenticated_but_not_authorized_for_admin");
		req.logout();
		res.redirect('/dashboard');
	} else {
		next();
	}
}

function requireTabletUser(req, res, next){
	var isAuthenticated = req.isAuthenticated();
	var isAuthorized = isAuthenticated && req.user && req.user.roles.isTablet;

	// logger.trace({ isAuthenticated: isAuthenticated, user: req.user }, "checking if %s is a tablet with access to %s", req.user, req.path);

	if(!isAuthenticated){
		res.send(401, { err: "Authentication is required to access this resource." });
	} else if(!isAuthorized){
		res.send(403, { err: "You are not authorized to access this resource." });
	} else {
		next();
	}
}
