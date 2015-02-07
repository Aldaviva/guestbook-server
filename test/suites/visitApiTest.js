var mongo       = require('mongodb');
var testConfig  = require('../config');

require('../../lib/common/logger')().level("warn");

var config      = require('../../lib/common/config').init(testConfig);
var app         = require('../../lib');
var request     = require('pr-request2');
var chai        = require('chai');

var logger      = require('../../lib/common/logger')(module);
var expect      = chai.expect;
var baseUrl     = config.httpServer.baseUrl + "/cgi-bin/";
var ObjectId    = mongo.ObjectId;

var db;
var visitsCollection;

describe("Visit API", function(){

	before(function(done){
		app.startedPromise
			.then(function(){
				mongo.MongoClient.connect(config.db.url, function(err, _db){
					db = _db;

					db.collection('visits', function(err, coll){
						visitsCollection = coll;
						visitsCollection.remove({}, function(err){
							logger.info("app started, database empty");
							done(err);
						});
					});
				});
			});
	});

	describe("insertVisit", function(){
		it("returns successfully", function(done){
			var url = baseUrl + "visits";
			logger.debug("POST "+url);
			request.post({
				url: url,
				json: {
					"visitorName": "John Chambers",
					"visitorCompany": "Cisco",
					"hostName": "Krish Ramakrishnan",
					"hostId": "52000fdc0ae92a67ee80f902",
				}
			})
				.then(function(res){
					expect(res.statusCode).to.equal(200);
					expect(res.body).to.have.property("_id").that.is.a('string');
					expect(res.body).to.have.property("visitorName", "John Chambers");
					expect(res.body).to.have.property("visitorCompany", "Cisco");
					expect(res.body).to.have.property("hostName", "Krish Ramakrishnan");
					expect(res.body).to.have.property("hostId", "52000fdc0ae92a67ee80f902");
					expect(res.body).to.have.property("startTime").that.is.closeTo(+new Date(), 2000);
					done();
				})
				.fail(done);
		});

		it("updates the database", function(done){
			visitsCollection.find().toArray(function(err, docs){
				expect(docs).to.have.length(1);
				var doc = docs[0];
				expect(doc).to.have.property("_id");
				expect(doc).to.have.property("visitorName", "John Chambers");
				expect(doc).to.have.property("visitorCompany", "Cisco");
				expect(doc).to.have.property("hostName", "Krish Ramakrishnan");
				expect(doc).to.have.property("hostId", "52000fdc0ae92a67ee80f902");
				expect(doc).to.have.property("startTime").that.is.closeTo(+new Date(), 2000);
				done(err);
			});
		});

		after(function(done){
			visitsCollection.remove({}, function(err){
				done(err);
			});
		});
	});
});
