(function(scope){

    var MeetingListView = scope.MeetingListView = ListView.extend({

        initialize: function(){
            _.bindAll(this);
            
            this.listEl = null;

            this.collection.on('add', this.addOne);
            this.collection.on('sync', _.partial(this.sortViews, "meetingView"));

            mediator.subscribe("highlightMeetings", this.highlightMeetings);
        },

        render: function(){
            if(this.$el.is(':empty')){
                this.$el.append(
                    $('<h2>').text('Meetings'),
                    this.listEl = $('<ol>', { class: 'meetings' })
                );
            }

            return this.el;
        },

        addOne: function(model, collection, opts){
            var meetingView = new MeetingView({ model: model });
            this.listEl.append(meetingView.render());
        },

        highlightMeetings: function(opts){
            var visit = opts.visit;
            if(visit !== null){
                var modelsToHighlight = this.collection.filter(function(meetingCandidate){
                    var meetingOrganizer = personCollection.findByNameOrEmail(meetingCandidate.get('organizer'));
                    if((meetingOrganizer.id !== '_unknown') && (visit.get('hostId') === meetingOrganizer.id)){
                        return true;
                    }

                    var visitorNameTokens = visit.get('visitorName').split(/\s+/).concat(visit.get('visitorCompany').split(/\s+/));
                    var meetingTitleTokens = meetingCandidate.get('title').split(/\s+/);
                    if(_.intersection(visitorNameTokens, meetingTitleTokens).length){
                        return true;
                    }

                    return false;
                });

                modelsToHighlight.forEach(function(modelToHighlight){
                    modelToHighlight.trigger('highlight');
                });
            } else {
                this.listEl.children().removeClass('highlight');
            }
        }
    });

})(this);