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
                    if (flow.saveLocation === this.model) {
                        flow.saveLocation = null;
                        flow.events.trigger('flow:change-save-location');
                    }
                }
            },
            'click .delete': function () {
                girder.confirm({
                    text: 'All data and analyses in this collection will be deleted forever. Continue?',
                    yesText: 'Delete',
                    confirmCallback: _.bind(function () {
                        girder.restRequest({
                            path: 'collection/' + this.model.get('id'),
                            type: 'delete'
                        }).done(_.bind(function (collection) {
                            this.model.set({active: false});
                            this.model.set({saveLocation: false});
                            if (flow.saveLocation === this.model) {
                                flow.saveLocation = null;
                                flow.events.trigger('flow:change-save-location');
                            }
                            this.collection.fetch({}, true);
                        }, this)).error(_.bind(function (xhr, status, message) {
                            console.error(message);
                        }, this));
                    }, this)
                });
            }
        },

        initialize: function (settings) {
            this.collection = settings.collection;
            this.model.on('change', this.render, this);
        },

        render: function () {
            this.$el.html(jade.templates.collection({
                model: this.model
            }));
            return this;
        }
    });

}(window.flow, window.$, window.d3, window.Backbone));
