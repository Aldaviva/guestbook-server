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

        this.initEventing();
    };

    Guestbook.prototype.renderAuthStatus = function(){
        var currentPerson = personCollection.findWhere({ email: Guestbook.user.email.replace(/@.*$/, '') });  

        $('.auth')
            .attr('title', "Logged in as " + currentPerson.get('fullname'))
            .find('.userProfilePhoto')
                .attr('src', currentPerson.getPhotoUrl());
    };

    Guestbook.prototype.initEventing = function() {
        var socket = scope.socket = io.connect(window.location.protocol+'//'+window.location.hostname);

        socket.on('connect', function(){
            console.info('Socket.IO connected.');
        });

        socket.on('disconnect', function(){
            console.warn('Socket.IO disconnected.');
        });

        socket.on('visit:created', function(){
            scope.visitCollection.fetch();
        });

        setInterval(function(){
            scope.visitCollection.fetch();
        }, 5*1000);
    };

})(this);