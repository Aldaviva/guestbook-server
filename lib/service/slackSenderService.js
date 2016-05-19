var _                = require('lodash');
var config           = require('../common/config');
var floorplanService = require('./floorplanService');
var logger           = require('../common/logger')(module);
var mediator         = require('../common/mediator');
var Q                = require('q');
var request          = require('pr-request2');


var TEMPLATES = {
	VISITOR_CREATED: {
		MESSAGE: _.template("<%= visit.visitorName %> from <%= visit.visitorCompany %> has arrived at the front desk.")
	}
};

connectEvents();

function connectEvents(){
	if(config.slack.accessToken){
		mediator.subscribe('visit:created', onVisitCreated);
	} else {
		logger.warn("Slack notifications disabled because slack.accessToken is not specified in config.json");
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
	return request({
			url: 'https://slack.com/api/chat.postMessage',
			method: 'POST',
			form: {
				token: config.slack.accessToken,
				channel: '@'+recipientEmailLocalPart,
				text: message,
				as_user: true
			}
		})
		.then(function(res){
			if(res.statusCode === 200 && res.body.ok === false){
				var err = new Error();
				err.message = "Slack refused to chat.postMessage";
				err.cause = res.body.error;
				throw err;
			}
		})
		.then(function(){
			logger.info({ to: recipientEmailLocalPart, message: message }, "Slack notification sent.");
		}, function(err){
			logger.warn({ to: recipientEmailLocalPart, error: err }, "Slack notification sending failed.");
		});
}
