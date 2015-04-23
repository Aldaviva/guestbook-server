(function(scope){

    var VisitListView = scope.VisitListView = ListView.extend({

        initialize: function(){
            _.bindAll(this);
            
            this.listEl = null;

            this.collection.on('reset', this.addAll);
            this.collection.on('add', this.addOne);
            this.collection.on('sync', _.partial(this.sortViews, "visitView"));

            this.scrollToBottom = _.throttle(this.scrollToBottom, 250);
        },

        render: function(){
            if(this.$el.is(':empty')){
                this.$el.append(
                    $('<h2>').text('Visitors'),
                    $('<a>', { href: 'cgi-bin/visits/visits.csv', class: 'csvDownload' }).text("Download CSV"),
                    this.listEl = $('<ol>', { class: 'visits' })
                );
            }

            return this.el;
        },

        addOne: function(model){
            var visitView = new VisitView({ model: model });
            this.listEl.append(visitView.render());
            this.scrollToBottom();
        },

        addAll: function(collection){
            collection.forEach(this.addOne);
        },

        scrollToBottom: function(){
            var olEl = this.listEl[0];
            olEl.scrollTop = olEl.scrollHeight - olEl.clientHeight;
        }
    });

})(this);