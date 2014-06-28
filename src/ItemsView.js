/*jslint browser: true, nomen: true */

(function (flow, _, Backbone) {
    "use strict";

    // Generic view of a collection that creates and manages
    // views for items based on the constructor passed as itemView.
    // An optional filter sets key/value pairs that must be matched
    // in models in the collection for it to be displayed in the
    // view, which is useful for example in selecting all datasets
    // of a certain type. The itemOptions option specifies additional
    // constructor options to be passed to generated itemView views.
    flow.ItemsView = Backbone.View.extend({
        initialize: function (options) {
            this.filter = options.filter;
            this.listenTo(this.collection, 'add', this.add);
            this.listenTo(this.collection, 'remove', this.remove);
            this.itemViews = {};
            if (!options.itemView) {
                console.error("Error: itemView required");
                return;
            }
            this.itemView = options.itemView;
            this.itemOptions = options.itemOptions;
            this.collection.forEach(_.bind(this.add, this));
        },

        matches: function (item) {
            var match = true;
            _.each(this.filter, function (value, key) {
                if (value !== item.get(key)) {
                    match = false;
                }
            });
            return match;
        },

        add: function (item) {
            if (this.matches(item)) {
                var view = new this.itemView(_.extend({model: item}, this.itemOptions));
                this.$el.append(view.render().$el);
                this.itemViews[item.cid] = view;
            }
        },

        remove: function (item) {
            if (this.itemViews[item.cid]) {
                this.itemViews[item.cid].$el.remove();
                delete this.itemViews[item.cid];
            }
        }
    });
}(window.flow, window._, window.Backbone));
