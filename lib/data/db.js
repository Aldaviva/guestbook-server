var config         = require('../common/config');
var logger         = require('../common/logger')(module);
var mongooseMoment = require('mongoose-moment');
var Q              = require('q');

var mongoose = require('mongoose-q')(require('mongoose'), {
	suffix: 'Promise'
});

module.exports = mongoose;
mongoose.start = start;
mongoose.shutdown = shutdown;
mongooseMoment(mongoose);

function start(){
	var deferred = Q.defer();

	mongoose.connect(config.db.url);
	mongoose.connection.on('error', deferred.reject);
	mongoose.connection.once('open', deferred.resolve);

	return deferred.promise.then(function(){
		logger.info("Connected to %s", config.db.url);
	}, function(err){
		logger.error(err);
	});
}

function shutdown(){
	var deferred = Q.defer();

	mongoose.disconnect(deferred.resolve);

	return deferred.promise;
}