(function(scope){

    var VisitView = scope.VisitView = Backbone.View.extend({

        tagName: "li",

        events: {
            "mouseenter": "onHover",
            "mouseleave": "offHover"
        },

        initialize: function(){
            _.bindAll(this);
            
            _.extend(this.model, { visitView: this });

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

                var host = personCollection.get(this.model.get('hostId')) || Person.getUnknownPerson(this.model.get('hostName'));
                this.employeeView = new EmployeeView({ model: host });
                this.$(".EmployeeView").replaceWith(this.employeeView.render());
            }

            var visitorName = this.model.get('visitorName') + " (" + this.model.get('visitorCompany')+")";
            this.$(".visitorName")
                .text(visitorName)
                .attr('title', visitorName);

            this.$(".startDate").text(new moment(this.model.get('startTime')).format("MMMM D"));

            this.$(".startTime").text(new moment(this.model.get('startTime')).format("h:mm A"));

            return this.el;
        },

        onHover: function(event){
            event && event.preventDefault();

            mediator.publish("highlightMeetings", { visit: this.model });
        },

        offHover: function(event){
            event && event.preventDefault();

            mediator.publish("highlightMeetings", { visit: null });
        }

    });

})(this);