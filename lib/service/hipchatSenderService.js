var Q					 = require('q');
var _					 = require('lodash');
var config				 = require('../common/config');
var floorplanService	 = require('./floorplanService');
var Hipchatter			 = require('hipchatter');
var logger				 = require('../common/logger')(module);
var mediator			 = require('../common/mediator');

var TEMPLATES = {
	VISITOR_CREATED: {
		MESSAGE: _.template("<%= visit.visitorName %> from <%= visit.visitorCompany %> has arrived at the front desk.")
	}
};

var hipchatter = new Hipchatter(config.hipchat.authToken);

connectEvents();

function connectEvents(){
	if(config.hipchat.authToken){
		mediator.subscribe('visit:created', onVisitCreated);
	} else {
		logger.warn("HipChat notifications disabled because hipchat.authToken is not specified in config.json");
	}
}

function onVisitCreated(visit){
	return floorplanService.getPeople(visit.hostId)
		.then(function(person){
			var message = TEMPLATES.VISITOR_CREATED.MESSAGE({ visit: visit });

			sendNotification(person.email, message);
		});
}

function sendNotification(recipientEmailLocalPart, message){
	var deferred = Q.defer();

	var sendPrivateMessage = Q.nbind(hipchatter.send_private_message, hipchatter);

	Q.allSettled(_.map(['bluejeans.com', 'bluejeansnet.com'], function(recipientEmailDomain){

		var recipientEmail = recipientEmailLocalPart + '@' + recipientEmailDomain;

		return sendPrivateMessage(recipientEmail, { message: message })
			.then(deferred.resolve);

	})).then(function(settled){
		deferred.reject(settled[0].reason);
	});
	
	deferred.promise
		.then(function(){
			logger.info({ to: recipientEmailLocalPart, message: message }, "HipChat notification sent.");
		}, function(err){
			logger.warn({ to: recipientEmailLocalPart, error: err }, "HipChat notification sending failed.");
		});

	return deferred.promise;
}
