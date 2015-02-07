var _       = require('lodash');
var config  = require('../common/config');
var logger  = require('../common/logger')(module);
var Q       = require('q');
var request = require('pr-request2');
var cache   = require('../common/cache');

function fetchPeople(params){
    var peopleUrl = config.floorplan.baseUrl + "/people/";
    if(_.isString(params)){
        peopleUrl += params;
    } else {
        peopleUrl += "?" + _.map(params, function(paramVal, paramKey){
            return encodeURIComponent(paramKey) + "=" + encodeURIComponent(paramVal);
        }).join("&");
    }

    logger.trace({ url: peopleUrl }, "fetching people from Floorplan");
    
    return request({
        url: peopleUrl,
        method: 'GET',
        json: true
    }).get('body');
}

var getPeople = module.exports.getPeople = cache.wrapPromise("floorplan.people.", fetchPeople);
