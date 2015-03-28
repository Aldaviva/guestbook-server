(function(scope){

    var VisitView = scope.VisitView = Backbone.View.extend({

        tagName: "li",

        initialize: function(){
            _.bindAll(this);

            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'remove', this.remove);
        },

        render: function(){
            if(this.$el.is(':empty')){
                this.$el.append(
                    $("<div>", { class: "visitorName subject" }),
                    $("<div>", { class: "minorProperties" }).append(
                        $("<div>", { class: "startDate" }),
                        $("<div>", { class: "startTime" })
                    ),
                    $("<div>", { class: "EmployeeView" })
                );

                var host = personCollection.get(this.model.get('hostId'));
                this.employeeView = new EmployeeView({ model: host });
                this.$(".EmployeeView").replaceWith(this.employeeView.render());
            }

            this.$(".visitorName")
                .text(this.model.get('visitorName'))
                .attr('title', this.model.get('visitorName'));

            this.$(".startDate").text(new moment(this.model.get('startTime')).format("MMMM D"));

            this.$(".startTime").text(new moment(this.model.get('startTime')).format("h:mm A"));

            return this.el;
        }

    });

})(this);