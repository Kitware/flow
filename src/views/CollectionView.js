/*jslint browser: true, nomen: true */

(function (flow, $, d3, Backbone) {
    "use strict";

    // View for displaying a collection that enables
    // setting it as active and/or the save location
    // for analyses and datasets
    flow.CollectionView = Backbone.View.extend({
        tagName: 'li',
        className: 'list-group-item',

        events: {
            'click .save-location': function () {
                if (this.model.get('_accessLevel') > 0) {
                    if (flow.saveLocation) {
                        flow.saveLocation.set({saveLocation: false});
                    }
                    flow.saveLocation = this.model;
                    flow.events.trigger('flow:change-save-location');
                    this.model.set({active: true, saveLocation: true});
                }
            },
            'click .active-state': function () {
                this.model.set({active: !this.model.get('active')});
                if (!this.model.get('active')) {
                    this.model.set({saveLocation: false});
                    flow.saveLocation = null;
                    flow.events.trigger('flow:change-save-location');
                    d3.select("#new-analysis-form").classed("hidden", true);
                    d3.select("#dataset-save").classed("hidden", true);
                }
            }
        },

        initialize: function () {
            this.model.on('change', this.render, this);
        },

        render: function () {
            this.$el.html($('#collection-template').html());
            this.$('.active-state').toggleClass('disabled-icon', !this.model.get('active'));
            this.$('.save-location').toggleClass('disabled-icon', !this.model.get('saveLocation'));
            this.$('.save-location').toggleClass('hidden', this.model.get('_accessLevel') <= 0);
            this.$('.name').text(this.model.get('name'));
            return this;
        }
    });

}(window.flow, window.$, window.d3, window.Backbone));
