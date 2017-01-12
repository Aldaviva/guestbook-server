var _                = require('lodash');
var bodyParser       = require('body-parser');
var bunyanMiddleware = require('bunyan-middleware');
var config           = require('../common/config');
var cookieParser     = require('cookie-parser');
var db               = require('../data/db');
var express          = require('express');
var hbs              = require('hbs');
var hbs_json         = require('hbs-json');
var http             = require('http');
var lessMiddleware   = require('less-middleware');
var passport         = require('passport');
var path             = require('path');
var Q                = require('q');
var rootLogger       = require('../common/logger');
var slash            = require('express-slash');
var socketio         = require('socket.io');
var url              = require('url');

process.env.NODE_ENV = process.env.NODE_ENV || (config.httpServer.isProductionMode ? 'production' : 'development');

var server = module.exports = express();

var logger         = rootLogger(module);
// var mountPath      = server.mountPath = url.parse(config.httpServer.baseUrl).pathname.replace(/([^\/])\/+$/, '$1');
var publicDir      = path.join(__dirname, '../../public');
var closableServer = null;
var serverLogger   = rootLogger().child({ module: 'express' });
server.apiRouter   = new express.Router();
serverLogger.level("warn");

server.set   ('port', config.httpServer.port);
server.set   ('json spaces', 0);
server.enable('trust proxy');
// server.enable('strict routing');
server.set   ('views', path.join(__dirname, '../../views'));
server.set   ('view engine', 'html');
server.engine('html', hbs.__express);
server.use   (bodyParser.json());
server.use   (bodyParser.urlencoded());
server.use   (cookieParser());
server.use   (express.session({
	secret: 'WyWS9MF3xxRH9W2HZBkp',
	store: (server.sessionStore = new express.session.MemoryStore())
}));
server.use   (passport.initialize());
server.use   (passport.session());
server.use   (bunyanMiddleware(serverLogger));
server.use   (lessMiddleware(publicDir));
server.use   (express.static(publicDir));
server.use   ('api', server.apiRouter.middleware);
server.use   (server.router);
// server.use   (slash());

hbs.registerHelper('json', hbs_json);

require('./routes');

/*
 * W3C Cross-Origin Resource Sharing Candidate Recommendation 29 January 2013 (http://www.w3.org/TR/2013/CR-cors-20130129/) specifies that successful CORS preflight responses should must use the status code 200.
 * None of the Node CORS modules follow this spec, returning 204 on success.
 * The spec was changed to allow any 2xx status code on 05 December 2013, 154 days after Opera 12.16 was released. Therefore, Opera 12.16 expects 200.
 * Fix: tell corser to not terminate the OPTIONS response so we can specify a custom status code ourselves.
 * Other solutions: fork cors or corser.
 */
server.use(function(req, res, next){
	if(req.method === 'OPTIONS'){
		res.end(200);
	}
	next();
});

server.use(function(req, res, next){
	res.send(404, { error: "Not found" });
});

server.use(function(err, req, res, next){
	serverLogger.error(err.stack || err.message);
	res.send(500, { error: err.message });
});

server.get('/ruok', function(req, res, next){
	db.ping()
		.then(function(){
			res.send(204);
		})
		.fail(function(err){
			res.send(503, {
				message: "Database failed to respond to ping",
				code: "ENODB"
			});
		});
});

server.start = function(){
	var deferred = Q.defer();
	var port = server.get('port');

	closableServer = server.listen(port, deferred.makeNodeResolver());

	closableServer.once('error', deferred.reject);

	return deferred.promise
		.then(function(){
			server.io = socketio.listen(closableServer, {
				'log level': 0 // 0 - error, 1 - warn, 2 - info, 3 - debug
			});
			server.io.disable('browser client');
		})
		.then(function(){
				var address = closableServer.address();
				logger.info("Listening on http://%s:%d/", address.address, address.port);
			},
			function(err){ 
				if(err.code == 'EACCES'){
					logger.error("No access to port "+port);
				} else if(err.code == 'EADDRINUSE'){
					logger.error("Port "+port+" already in use.");
				} else {
					logger.error("Error starting server: "+err.message); 
				}
				throw err;
			});
};

server.shutdown = function(){
	var deferred = Q.defer();
	if(closableServer){
		try {
			closableServer.close(function(err){
				if(err != null){
					logger.error("Unable to close: %s", err);
					deferred.reject(err);
				} else {
					logger.info("Shut down.");
					deferred.resolve();
				}
				closableServer = null;
			});
		} catch (e){
			logger.error(e);
			deferred.reject(e);
		}
	} else {
		logger.info("Shut down.");
		deferred.resolve();
	}
	return deferred.promise;
};

/**
 * @param level String: one of ["error", "warning", "info"]
 * @param message String: unique string that the frontend should transform into a user-facing string
 * 
 * If any of the arguments are omitted, no toast message will be set and any existing toast message for the user will be cleared.
 */
server.request.setToastMessage = function(level, message){
	var req = this;
	if(req.session && level && message){
		req.session.toastMessage = {
			level: level,
			message: message
		};
	} else {
		req.session.toastMessage = null;
	}
};