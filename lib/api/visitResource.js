var _            = require('lodash');
var apiServer    = require('./apiServer');
var auth         = require('../auth/auth');
var logger       = require('../common/logger')(module);
var mediator     = require('../common/mediator');
var Moment       = require('moment');
var Visit        = require('../data/model/Visit');
var visitService = require('../service/visitService');

apiServer.get('/cgi-bin/visits', auth.requireAdminUser, function(req, res, next){
	visitService.find(req.query)
		.then(function(visits){
			res.send(visits);
		})
		.fail(next);
});

apiServer.post('/cgi-bin/visits', auth.requireTabletUser, function(req, res, next){
	var visit = new Visit(req.body);
	visitService.create(visit)
		.then(function(createdVisit){
			res.send(createdVisit);
		})
		.fail(next);
});

apiServer.get('/cgi-bin/visits/visits.csv', auth.requireAdminUser, function(req, res, next){
	var dateCriteria = _.defaults({
		minDate: req.query.min_date,
		maxDate: req.query.max_date
	}, {
		minDate: null,
		maxDate: null
	});

	visitService.findByDate(dateCriteria)
		.then(visitService.toCSV)
		.then(function(csvText){
			res.type('csv');
			res.header('Content-Disposition', 'attachment; filename=visits.csv');
			res.send(csvText);
		})
		.fail(next);
});

/*apiServer.get('/cgi-bin/visits/:id', auth.requireAdminUser, function(req, res){
	visitService.findById(req.params.id)
		.then(function(visit){
			if(!visit){
				throw new Error("No visit found with id = "+req.params.id);
			}
			res.send(visit);
		})
		.fail(function(err){
			res.send(404, { error: err.message });
		});
});

apiServer.put('/cgi-bin/visits/:id', auth.requireAdminUser, function(req, res, next){
	var visit = req.body;
	visit._id = req.params.id;
	visitService.updateFull(visit)
		.then(function(updatedVisit){
			res.send(updatedVisit);
		})
		.fail(next);
});

apiServer.patch('/cgi-bin/visits/:id', auth.requireAdminUser, function(req, res, next){
	var visit = req.body;
	visit._id = req.params.id;
	visitService.updateDelta(visit)
		.then(function(updatedVisit){
			res.send(updatedVisit);
		})
		.fail(next);
});*/
