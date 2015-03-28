(function(scope){

    var Guestbook = scope.Guestbook = function(){
        scope.endpointCollection = new EndpointCollection();
        scope.personCollection = new PersonCollection();
        scope.meetingCollection = new MeetingCollection();
        scope.visitCollection = new VisitCollection();

        var meetingListView = new MeetingListView({ collection: meetingCollection, el: $('.MeetingListView')[0] });
        var visitListView = new VisitListView({ collection: visitCollection, el: $('.VisitListView')[0] });

        meetingListView.render();
        visitListView.render();


        Q.all([
            endpointCollection.fetchPromise(),
            personCollection.fetchPromise()
        ]).then(_.bind(function(){
            this.renderAuthStatus();

            return Q.all([
                meetingCollection.fetchPromise(),
                visitCollection.fetchPromise({ reset: true })
            ]);
        }, this))
        .done();
    };

    Guestbook.prototype.renderAuthStatus = function(){
        var currentPerson = personCollection.findWhere({ email: Guestbook.user.email.replace(/@.*$/, '') });  

        $('.auth')
            .attr('title', "Logged in as " + currentPerson.get('fullname'))
            .find('.userProfilePhoto')
                .attr('src', currentPerson.getPhotoUrl());
    };

})(this);