/*jslint browser: true, nomen: true */

(function (flow, $, Backbone, d3, tangelo) {
    "use strict";

    // The view for a setting a single input to an analysis or
    // visualization based on its type
    flow.InputView = Backbone.View.extend({
        typeMetadata: {
            table: {inputMode: "dataset"},
            tree: {inputMode: "dataset"},
            image: {inputMode: "dataset"},
            r: {inputMode: "dataset"},
            string: {inputMode: "line"},
            number: {inputMode: "line"},
            json: {inputMode: "line"},
            geometry: {inputMode: "dataset"}
        },

        initialize: function (settings) {
            var div;

            this.datasets = settings.datasets;
            this.idPrefix = settings.idPrefix;
            this.inputMode = this.model.get('inputMode');
            if (!this.inputMode) {
                this.inputMode = this.typeMetadata[this.model.get('type')].inputMode;
            }

            div = d3.select(this.el).append('div')
                .classed('form-group', true);
            div.append('label')
                .attr('for', this.idPrefix + this.model.get('name'))
                .text(this.model.get('name'));
            if (this.inputMode === 'dataset') {
                this.view = new flow.ItemsView({
                    el: $('<select class="form-control"/>').appendTo(div.node()),
                    collection: this.datasets,
                    itemView: flow.ItemOptionView,
                    filter: {type: this.model.get('type')}
                });
            } else {
                if (this.model.get('domain')) {
                    if (tangelo.isArray(this.model.get('domain'))) {
                        this.domainArray = new Backbone.Collection(this.model.get('domain'));
                    } else {
                        this.domainArray = new Backbone.Collection([]);
                    }
                    this.view = new flow.ItemsView({
                        el: $('<select class="form-control"/>').appendTo(div.node()),
                        collection: this.domainArray,
                        itemView: flow.StringOptionView
                    });
                    if (this.model.get('default')) {
                        this.view.$el.val(this.model.get('default').data);
                    }
                } else {
                    this.view = div.append('input')
                        .classed('form-control', true)
                        .attr('type', 'text')
                        .attr('id', this.idPrefix + this.model.get('name'));
                    this.view = $(this.view.node());
                    if (this.model.get('default')) {
                        if (this.model.get('type') === 'json' && this.model.get('default').format === 'inline') {
                            this.view.val(JSON.stringify(this.model.get('default').data));
                        } else {
                            this.view.val(this.model.get('default').data);
                        }
                    }
                }
            }
        },

        render: function () {
            return this;
        }
    });

}(window.flow, window.$, window.Backbone, window.d3, window.tangelo));
