var _          = require('lodash');
var config     = require('../common/config');
var logger     = require('../common/logger')(module);
var mediator   = require('../common/mediator');
var nodemailer = require('nodemailer');
var Q          = require('q');
var request    = require('pr-request2');


var TEMPLATES = {
	FROM    : _.template("Guestbook <guestbook@bluejeansnet.com>"),
	VISITOR_CREATED: {
		SUBJECT : _.template("<%= visit.visitorName => has arrived at the front desk"),
		BODY    : _.template("")
	}
};

var smtpTransport = nodemailer.createTransport("SMTP", {
	host: config.smtp.host
});	

connectEvents();


function connectEvents(){
	mediator.subscribe('visit:created', onVisitCreated);
}

function onVisitCreated(visit){
	return request({
		url: config.floorplan.baseUrl+'/people/'+visit.hostId,
		method: 'GET',
		json: true
	}).then(function(res){
		var recipients = [ res.body.email + '@bluejeansnet.com' ];

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

	deferred.promise
		.then(function(){
			logger.info({ to: to, subject: subject }, "Emails sent.");
		}, function(err){
			logger.warn({ error: err }, "Email sending failed.");
		});

	return deferred.promise;
}
