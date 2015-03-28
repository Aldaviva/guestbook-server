(function(scope){

    var EmployeeView = scope.EmployeeView = Backbone.View.extend({

        className: 'EmployeeView',

        initialize: function(){
            _.bindAll(this);
        },

        render: function(){
            if(this.$el.is(':empty')){
                this.$el.append(
                    $('<a>', {
                        target: '_blank',
                    }).append(
                        $('<img>'),
                        $('<span>')
                    )
                );
            }

            this.$('a').attr({
                href: this.model.getFloorplanWebUrl(),
                title: this.model.get('fullname') + " on Floorplan"
            });

            this.$('img').attr({
                src: this.model.getPhotoUrl()
            });

            this.$('span').text(this.model.get('fullname'));

            return this.el;
        }

    });

})(this);