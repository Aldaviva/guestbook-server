(function(scope){

	$.ajaxSetup({
		beforeSend: function(xhr, settings){
			if(settings.url.indexOf(Guestbook.config.catalyst.baseUrl) === 0){
				xhr.setRequestHeader("Authorization", "Basic " + window.btoa(Guestbook.config.catalyst.username+":"+Guestbook.config.catalyst.password));
			}
		}
	});


	var PromiseFetchingCollection = Backbone.Collection.extend({
		fetchPromise: function(opts){
			var deferred = Q.defer();

			opts = opts || {};
			var userSuccess = opts.success || _.noop;
			var userError = opts.error || _.noop;

			this.fetch(_.extend({}, opts, {
				success: function(coll, res, options){
					userSuccess.apply(this, arguments);
					deferred.resolve(res);
				},
				error: function(coll, res, options){
					userError.apply(this, arguments);
					deferred.reject(res);
				}
			}))

			return deferred.promise;
		}
	});


	var Visit = scope.Visit = Backbone.Model.extend({
		idAttribute: '_id'
	});

	var VisitCollection = scope.VisitCollection = PromiseFetchingCollection.extend({
		url        : 'cgi-bin/visits',
		model      : Visit,
		comparator : 'startTime'
	});


	var Meeting = scope.Meeting = Backbone.Model.extend({
		isNearbyAndSoon: function(){
			var minStartTime = new moment().subtract(30, 'minutes');
			var maxStartTime = new moment().add(30, 'minutes');

			if(maxStartTime.isBefore(this.get('startTime'))){
				return false;
			}

			if(minStartTime.isAfter(this.get('startTime'))){
				return false;
			}

			if(!_.intersection(Guestbook.config.catalyst.endpoints, this.get('endpointIds')).length){
				return false;
			}

			return true;
		}
	});

	var MeetingCollection = scope.MeetingCollection = PromiseFetchingCollection.extend({
		model      : Meeting,
		url        : function(){
			return Guestbook.config.catalyst.baseUrl + '/meetings';
		},
		comparator : 'startTime',
		parse: function(res, options){
			return _(res).map(function(attrs){
					return new Meeting(attrs);
				})
				.filter(function(meeting){
					return meeting.isNearbyAndSoon();
				})
				.value();
		}
	});


	var Person = scope.Person = Backbone.Model.extend({
		idAttribute: '_id',
		urlRoot: function(){
			return Guestbook.config.floorplan.baseUrl + "/people";
		},
		getPhotoUrl: function(){
			if(this.id !== "_unknown"){
				return this.url() + "/photo";
			} else {
				return Guestbook.config.floorplan.baseUrl + "/images/missing_photo.jpg";
			}
		},
		getFloorplanWebUrl: function(){
			return Guestbook.config.floorplan.baseUrl + "/" + this.get('office') + '#' + this.id + "/" + this.get("fullname").replace(/\s/g, '_');
		}
	});

	var PersonCollection = scope.PersonCollection = PromiseFetchingCollection.extend({
		model: Person,
		url: function(){
			return Person.prototype.urlRoot();
		},
		findByNameOrEmail: function(nameOrEmail){
			var isEmail = (nameOrEmail.indexOf('@') !== -1);
			nameOrEmail = nameOrEmail.replace(/@.*$/, '');
			var person;

			if(isEmail){
				person = this.findWhere({ email: nameOrEmail });
			} else {
				person = this.findWhere({ fullname: nameOrEmail });
			}

			if(!person){
				person = new Person({
					_id: "_unknown",
					fullname: nameOrEmail,
					email: nameOrEmail,
					office: 'mv'
				});
			}

			return person;
		}
	});


	var Endpoint = scope.Endpoint = Backbone.Model.extend({
				
	});

	var EndpointCollection = scope.EndpointCollection = PromiseFetchingCollection.extend({
		model : Endpoint,
		url   : function(){
			return Guestbook.config.catalyst.baseUrl + '/endpoints';
		}
	});

})(this);