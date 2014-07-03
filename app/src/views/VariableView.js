/*jslint browser: true, nomen: true */

(function (flow, $, d3, Backbone) {
    "use strict";

    // View for displaying a collection that enables
    // setting it as active and/or the save location
    // for analyses and datasets
    flow.VariableView = Backbone.View.extend({
        tagName: 'li',
        className: 'list-group-item',

        events: {
            'click .edit': function () {
                this.editView.model = this.model;
                this.editView.render();
            },

            'click .delete': function () {
                this.collection.remove(this.model);
            }
        },

        initialize: function (settings) {
            this.editView = settings.editView;
            this.collection = settings.collection;
            this.model.on('change', this.render, this);
        },

        render: function () {
            this.$el.html($('#variable-template').html());
            this.$('.name').text(this.model.get('name') + ' [' + this.model.get('type') + ':' + this.model.get('format') + ']');
            return this;
        }
    });

}(window.flow, window.$, window.d3, window.Backbone));
