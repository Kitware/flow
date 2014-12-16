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
            geometry: {inputMode: "dataset"},
            accessor: {inputMode: "line"},
            array: {inputMode: "array"}
        },

        initialize: function (settings) {
            var div;

            this.datasets = settings.datasets;
            this.parentView = settings.parentView;
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
            if (this.model.get('type') === 'array') {
                this.view = [];
                this.containers = [];
                this.addButton = div.append('button')
                    .attr('class', 'indent btn btn-default');
                this.addButton.append('span').attr('class', 'glyphicon glyphicon-plus');
                this.componentsList = d3.select(this.el).append('div').classed('indent', true);
                this.addButton.on('click', _.bind(function (d) {
                    var container = this.componentsList.append('div');

                    container.append('button').attr('class', 'btn btn-default')
                        .on('click', _.bind(function (d) {
                            var viewIndex = this.containers.indexOf(container);
                            this.view.splice(viewIndex, 1);
                            this.containers.splice(viewIndex, 1)[0].remove();
                        }, this))
                        .append('span').attr('class', 'glyphicon glyphicon-trash');

                    this.containers.push(container);
                    this.view.push(new flow.InputsView({
                        collection: new Backbone.Collection(this.model.get('components')),
                        el: container[0],
                        datasets: this.datasets,
                        parentView: this
                    }).render());
                }, this));
            } else if (this.inputMode === 'dataset') {
                this.view = new flow.ItemsView({
                    el: $('<select class="form-control"/>').appendTo(div.node()),
                    collection: this.datasets,
                    itemView: flow.ItemOptionView,
                    filter: {type: this.model.get('type')}
                });
            } else {
                if (this.model.get('domain')) {
                    if (_.isArray(this.model.get('domain'))) {
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
