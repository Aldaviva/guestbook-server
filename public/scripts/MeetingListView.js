(function(scope){

    var MeetingListView = scope.MeetingListView = Backbone.View.extend({

        initialize: function(){
            _.bindAll(this);
            
            this.listEl = null;

            this.collection.on('add', this.addOne);
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
        }
    });

})(this);