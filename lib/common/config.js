var _      = require('lodash');
var logger = require('./logger')(module);

var isInitialized = false;

module.exports = {};

module.exports.init = function(userConfig){
	if(!isInitialized){
		isInitialized = true;
		return _.merge(module.exports, userConfig);
	} else {
		return module.exports;
	}
};
