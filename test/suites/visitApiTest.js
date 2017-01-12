var _               = require('lodash');
var Cookie          = require('tough-cookie').Cookie;
var cookieSignature = require('cookie-signature');
var Moment          = require('moment');
var mongo           = require('mongodb');
var Q               = require('q');
var testConfig      = require('../config');

require('../../lib/common/logger')().level("warn");

var config          = require('../../lib/common/config').init(testConfig);
var app             = require('../../lib');
var request         = require('pr-request2');
var chai            = require('chai');
var Visit           = require('../../lib/data/model/Visit');

var logger          = require('../../lib/common/logger')(module);
var expect          = chai.expect;
var baseUrl         = config.httpServer.baseUrl + "/cgi-bin/";
var ObjectId        = mongo.ObjectId;
var cookieJar       = request.jar();
var apiServer       = require('../../lib/api/apiServer');

var db;
var visitsCollection;

var tabletAuth = { username: 'tabletUser', password: 'tabletPassword', sendImmediately: true };
var userSessionId = "abcdef";

describe("Visit API", function(){

	before(function(done){
		app.startedPromise
			.then(function(){
				mongo.MongoClient.connect(config.db.url, function(err, _db){
					db = _db;

					db.collection('visits', function(err, coll){
						visitsCollection = coll;
						visitsCollection.remove({}, function(err){
							logger.warn("app started, database emptied");
							done(err);
						});
					});
				});
			});
	});

	before(function(done){
		var session = {
			cookie: {
				originalMaxAge: null,
				expires: null,
				httpOnly: true,
				path: "/"
			},
			passport: {
				user: {
					email: "test@bjn.mobi",
					roles: {
						isAdmin: true
					},
					googleId: "123456"
				}
			}
		};
		apiServer.sessionStore.set(userSessionId, session, function(err){
			var cookie = new Cookie({ key: "connect.sid", value: 's:'+cookieSignature.sign(userSessionId, 'WyWS9MF3xxRH9W2HZBkp') });
			cookieJar.setCookie(cookie, config.httpServer.baseUrl, function(err, cookie){
				done(err);
			});
		});
	});

	describe("log in page", function(){
		it("loads", function(done){
			request.get({
				url: config.httpServer.baseUrl,
				jar: cookieJar
			})
				.then(function(res){
					expect(res.statusCode).to.equal(200);
					expect(res.headers["content-type"]).to.equal('text/html; charset=utf-8');
					done();
				})
				.fail(done);
		});
	});

	describe("insertVisit", function(){
		describe("Basic authentication", function(){
			it("is denied on missing credentials", function(done){
				request.post({
					url: baseUrl + "visits",
					json: {}
				})
					.then(function(res){
						expect(res.statusCode).to.equal(401);
						done();
					})
					.fail(done);
			});

			it("is denied on incorrect username", function(done){
				request.post({
					url: baseUrl + "visits",
					auth: { username: "wrongUsername", password: "tabletPassword", sendImmediately: true },
					json: {}
				})
					.then(function(res){
						expect(res.statusCode).to.equal(401);
						done();
					})
					.fail(done);
			});

			it("is denied on incorrect password", function(done){
				request.post({
					url: baseUrl + "visits",
					auth: { username: "tabletUsername", password: "wrongPassword", sendImmediately: true },
					json: {}
				})
					.then(function(res){
						expect(res.statusCode).to.equal(401);
						done();
					})
					.fail(done);
			});
		});

		describe("with valid auth and entity", function(){
			it("returns successfully", function(done){
				request.post({
					url: baseUrl + "visits",
					auth: tabletAuth,
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
		});
	});

	describe("getVisits", function(){
		describe("with an empty database", function(){
			before(function(done){
				visitsCollection.remove({}, function(err){
					logger.info("database emptied");
					done(err);
				});
			});

			it("returns an empty array", function(done){
				request.get({
					url: baseUrl + "visits",
					jar: cookieJar,
					json: true
				})
					.then(function(res){
						expect(res.statusCode).to.equal(200);
						expect(res.body).to.be.an('array');
						expect(res.body).to.be.empty;
						done();
					})
					.fail(done);
			});
		});

		describe("with a non-empty database", function(){
			before(function(done){
				// oldest to newest is A, B, C
				var fixtures = [
					new Visit({
						visitorName: "Visitor B",
						visitorCompany: "Company B",
						hostName: "Host B",
						hostId: "00000000000000000000000b",
						startTime: new Moment().subtract(5, 'days')
					}),
					new Visit({
						visitorName: "Visitor C",
						visitorCompany: "Company C",
						hostName: "Host C",
						hostId: "00000000000000000000000c",
						startTime: new Moment().subtract(4, 'days')
					}),
					new Visit({
						visitorName: "Visitor A",
						visitorCompany: "Company A",
						hostName: "Host A",
						hostId: "00000000000000000000000a",
						startTime: new Moment().subtract(6, 'days')
					})
				];
				Q.all(_.invoke(fixtures, 'savePromise'))
					.then(function(){
						done();
					})
					.fail(function(err){
						done(err);
					});
			});

			it("returns all results with no filtering params", function(done){
				request.get({
					url: baseUrl + "visits",
					jar: cookieJar,
					json: true
				})
					.then(function(res){
						expect(res.statusCode).to.equal(200);
						expect(res.body).to.have.lengthOf(3);
						expect(res.body[0]).to.have.property('visitorName', 'Visitor C');
						expect(res.body[1]).to.have.property('visitorName', 'Visitor B');
						expect(res.body[2]).to.have.property('visitorName', 'Visitor A');
						done();
					})
					.fail(done);
			});

			it("supports custom page sizes", function(done){
				request.get({
					url: baseUrl + "visits",
					qs: { pageSize: 1 },
					jar: cookieJar,
					json: true
				})
					.then(function(res){
						expect(res.statusCode).to.equal(200);
						expect(res.body).to.have.lengthOf(1);
						expect(res.body[0]).to.have.property('visitorName', 'Visitor C');
						done();
					})
					.fail(done);
			});

			it("supports custom page numbers", function(done){
				request.get({
					url: baseUrl + "visits",
					qs: { pageNum: 1 },
					jar: cookieJar,
					json: true
				})
					.then(function(res){
						expect(res.statusCode).to.equal(200);
						expect(res.body).to.be.empty;
						done();
					})
					.fail(done);
			});

			it("supports custom page sizes and page numbers", function(done){
				request.get({
					url: baseUrl + "visits",
					qs: { pageSize: 1, pageNum: 1 },
					jar: cookieJar,
					json: true
				})
					.then(function(res){
						expect(res.statusCode).to.equal(200);
						expect(res.body).to.have.lengthOf(1);
						expect(res.body[0]).to.have.property('visitorName', 'Visitor B');
						done();
					})
					.fail(done);
			});
		});
	});

	after(function(done){
		visitsCollection.remove({}, function(err){
			done(err);
		});
	});
});
