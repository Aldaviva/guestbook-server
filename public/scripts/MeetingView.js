(function(scope){

    var MeetingView = scope.MeetingView = Backbone.View.extend({

        tagName: "li",

        initialize: function(){
            _.bindAll(this);

            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'remove', this.remove);
        },

        render: function(){
            if(this.$el.is(':empty')){
                this.$el.append(
                    $("<div>", { class: "title subject" }),
                    $("<div>", { class: "minorProperties" }).append(
                        $("<div>", { class: "endpointName" }),
                        $("<div>", { class: "startTime" })
                    ),
                    $("<div>", { class: "EmployeeView" })
                );

                var organizer = personCollection.findByNameOrEmail(this.model.get('organizer'));
                this.employeeView = new EmployeeView({ model: organizer });
                this.$(".EmployeeView").replaceWith(this.employeeView.render());
            }

            this.$(".title")
                .text(this.model.get('title') || "(no title)")
                .attr('title', this.model.get('title'));

            var endpointNames = _(this.model.get('endpointIds'))
                .map(function(endpointId){
                    return endpointCollection.get(endpointId).get('name');
                })
                .value()
                .join(', ');
            this.$(".endpointName").text(endpointNames);

            this.$(".startTime").text(new moment(this.model.get('startTime')).format("h:mm A"));

            return this.el;
        },

        remove: function(){
            this.employeeView && this.employeeView.remove();

            return MeetingView.__super__.remove.apply(this, arguments);
        }

    });

})(this);