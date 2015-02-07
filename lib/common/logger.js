var bunyan = require('bunyan');
var path = require('path');

var rootLogger = bunyan.createLogger({ name: "guestbook-server" });
rootLogger.level("trace");

module.exports = function(module){
	if(module){
		return rootLogger.child({ module: path.basename(module.filename, '.js') });
	} else {
		return rootLogger;
	}
};