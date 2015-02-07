var _             = require('lodash');
var cache_manager = require('cache-manager');
var config        = require('./config');
var Q             = require('q');

var cache = module.exports = cache_manager.caching({
	store: 'memory',
	max: 128,
	ttl: config.cache.ttl //seconds
});

_.extend(module.exports, {
	wrapPromise: wrapPromise
});

/**
 * @param key the cache key, subsequent invocations of the returned function will use this key to hit the cache
 * @param promiseReturningFunc a function that, when run, will return a promise or value to be placed in the cache. To pass arguments, consider _.partial or closures
 * @return a promise that will be resolved with the return value of promiseReturningFunc or its cached return value, if available
 */
function wrapPromise(key, promiseReturningFunc){
	return function(){
		var deferred = Q.defer();
		var userArgs = arguments;
		var keyWithArgs = key + '('+JSON.stringify(_.toArray(userArgs))+')';

		cache.wrap(keyWithArgs, function(cb){
			Q(promiseReturningFunc.apply(null, userArgs)).nodeify(cb);
		}, deferred.makeNodeResolver());

		return deferred.promise;
	};
}
/* 
function wrapFunction(keyPrefix, realFunction){
    return function(){
        var cacheKey = keyPrefix + JSON.stringify(arguments);
        var userArgs = arguments;
        wrapPromise(cacheKey, function(){
            return realFunction.apply(null, userArgs);
        });
    };
}
*/
