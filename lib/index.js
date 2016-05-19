var startTime = new Date();

var fs = require('fs');
var Q = require('q');
fs.writeFile(".pid", process.pid);

var logger   = require('./common/logger')(module);

var userConfig = require('../config');
var config   = require('./common/config').init(userConfig);

var server = require('./api/apiServer');
var serverStartPromise = server.start();

var db = require('./data/db');
var dbStartPromise = db.start();

require('./api/visitResource');
require('./service/mailSenderService');
require('./service/hipchatSenderService');
require('./service/slackSenderService');

/**
 * Shutdown
 */
var shutdownPromise;
var shutdown = module.exports.shutdown = function(){
    if(!shutdownPromise){
        shutdownPromise = startedPromise
            .finally(function(){
                logger.info("Shutting down...");
                return Q()
                    .then(server.shutdown())
                    .then(db.shutdown())
                    .fail(function(err){
                        logger.error(err);
                        throw err;
                    })
                    .then(function(){
                        fs.unlinkSync(".pid");
                        logger.info("Shut down.");
                        process.exit(0);
                    })
                    .done();
            });
    }
    return shutdownPromise;
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

/**
 * Startup
 */
var startedPromise = module.exports.startedPromise = Q.all([ serverStartPromise, dbStartPromise ])
    .then(function(){
        logger.info("Startup complete in %d ms.", (new Date() - startTime));
    })
    .fail(function(err){
        logger.error(err, "Failed to start");
        process.exit(1);
    });
