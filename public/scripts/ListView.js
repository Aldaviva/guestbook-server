(function(scope){

    var ListView = scope.ListView = Backbone.View.extend({

        sortViews: function(viewKey){
            var prevView, currExpectedView, currActualView;
            for(var i=0, l=this.collection.length; i < l; i++){
                currExpectedView = this.collection.at(i)[viewKey].el;
                currActualView = this.listEl.children().eq(i).el;

                if(currActualView !== currExpectedView){ //model in collection has no view in list, insert el
                    if(prevView){ //append to previous el
                        $(prevView).after(currExpectedView);
                    } else { //no previous el, add as first list child
                        this.listEl.prepend(currExpectedView);
                    }
                    prevView = currExpectedView;
                }
            }
        }

    });

})(this);