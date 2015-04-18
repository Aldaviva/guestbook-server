var _         = require('lodash');
var apiServer = require('./apiServer');
var config    = require('../common/config');
var fs        = require('fs');
var logger    = require('../common/logger')(module);
var Moment    = require('moment');
var path      = require('path');

var greetings = config.greetings;

apiServer.get('/cgi-bin/greetings/now', function(req, res, next){
    var now = new Moment();
    var greetingKey = now.format('YYYY-MM-DD');

    getAbsoluteImageUrl(greetingKey+".png", function(absoluteImageUrl){
        var greeting = {
            greetingText: greetings[greetingKey] || greetings["default"],
            greetingImageUrl: absoluteImageUrl
        };

        res.send(greeting);
    });
});

function getAbsoluteImageUrl(basename, callback){
    fs.exists(path.join('public', 'images', 'greetings', basename), function(doesFileExist){
        if(!doesFileExist){
            basename = 'default.png';
        }

        callback(config.httpServer.baseUrl + '/images/greetings/' + encodeURI(basename));
    });
}