var _          = require('lodash');
var config     = require('../common/config');
var logger     = require('../common/logger')(module);
var mediator   = require('../common/mediator');
var nodemailer = require('nodemailer');
var Q          = require('q');
var floorplanService = require('./floorplanService');


var TEMPLATES = {
	FROM : _.template("Front Desk <frontdesk-noreply@bluejeans.com>"),
	VISITOR_CREATED: {
		SUBJECT : _.template("<%= visit.visitorName %> from <%= visit.visitorCompany %> has arrived at the front desk"),
		BODY    : _.template("")
	}
};

var smtpTransport = nodemailer.createTransport({
	host: config.smtp.host,
	ignoreTLS: true
});	

connectEvents();

function connectEvents(){
	if(config.smtp.host){
		mediator.subscribe('visit:created', onVisitCreated);
	} else {
		logger.warn("Email notifications disabled because smtp.host is not specified in config.json");
	}
}

function onVisitCreated(visit){
	return floorplanService.getPeople(visit.hostId)
		.then(function(person){
			var recipients = [ person.email + '@bluejeansnet.com' ];
			var subject = TEMPLATES.VISITOR_CREATED.SUBJECT({ visit: visit });
			var body = TEMPLATES.VISITOR_CREATED.BODY({});

			sendMail(recipients, subject, body);
		});
}

function sendMail(recipients, subject, htmlBody){
	var deferred = Q.defer();
	recipients = _.flatten([recipients]);

	var to = recipients.join(', ');
	var mailOptions = {
		from    : TEMPLATES.FROM({}),
		to      : to,
		subject : subject,
		html    : htmlBody
	};

	smtpTransport.sendMail(mailOptions, deferred.makeNodeResolver());
/*	smtpTransport.sendMail(mailOptions, function(err, result){
		if(err){
			deferred.reject(err);
			logger.error({ err: err.message }, "sendMail returned error");
		} else {
			deferred.resolve(result);
		}
	});*/

	deferred.promise
		.then(function(){
			logger.info({ to: to, subject: subject }, "Emails sent.");
		}, function(err){
			logger.warn({ error: err.message }, "Email sending failed.");
		});

	return deferred.promise;
}
