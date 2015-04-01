(function(scope){

    var EmployeeView = scope.EmployeeView = Backbone.View.extend({

        className: 'EmployeeView',

        initialize: function(){
            _.bindAll(this);
        },

        render: function(){
            if(this.$el.is(':empty')){
                var isModelInFloorplan = (this.model.id !== '_unknown');
                var tagName = isModelInFloorplan ? 'a' : 'span';

                this.$el.append(
                    $('<'+tagName+'>').append(
                        $('<img>'),
                        $('<span>', { class: 'name' })
                    )
                );
                if(isModelInFloorplan){
                    this.$('a').attr('target', "_blank");
                }
            }

            this.$('a').attr({
                href: this.model.getFloorplanWebUrl(),
                title: this.model.get('fullname') + " on Floorplan"
            });

            this.$('img').attr({
                src: this.model.getPhotoUrl()
            });

            this.$('.name').text(this.model.get('fullname'));

            return this.el;
        }

    });

})(this);