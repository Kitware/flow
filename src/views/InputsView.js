/*jslint browser: true, nomen: true */

(function (flow, _, tangelo) {
    "use strict";

    // The view representing the form for a set of inputs to populate
    // for an analysis or visualization
    flow.InputsView = flow.ItemsView.extend({
        initialize: function (settings) {
            this.datasets = settings.datasets;
            flow.ItemsView.prototype.initialize.apply(this, [_.extend(settings, {itemView: flow.InputView, itemOptions: {datasets: this.datasets}})]);
        },

        render: function () {
            // For fancy domains such as column names, we need changes in an input dataset
            // dropdown to trigger pulling the data in a certain format (like column headers)
            // as the domain of another input
            this.collection.forEach(_.bind(function (input) {
                var view, referredInput;
                if (input.get('type') === 'string' || input.get('type') === 'number' || input.get('type') === 'json') {
                    if (input.get('domain') && tangelo.isObject(input.get('domain'))) {
                        referredInput = this.collection.findWhere({name: input.get('domain').input});
                        view = this.itemViews[referredInput.cid];
                        view.$el.change(_.bind(function () {
                            var dataset = this.datasets.get(view.view.$el.val());
                            flow.retrieveDatasetAsFormat(dataset, view.model.get('type'), input.get('domain').format, false, _.bind(function (error, dataset) {
                                dataset.get('data').sort();
                                this.itemViews[input.cid].view.collection.set(dataset.get('data'));
                            }, this));
                        }, this));
                    }
                }
            }, this));

            // Trigger a change event on each dataset dropdown so dependent inputs
            // can be initially populated
            this.collection.forEach(_.bind(function (input) {
                if (this.itemViews[input.cid].inputMode === "dataset") {
                    this.itemViews[input.cid].$el.change();
                }
            }, this));
        },

        values: function () {
            var result = {};
            _.each(this.itemViews, _.bind(function (inputView) {
                var input = inputView.model,

                    // Sometimes the view is a Backbone view, sometimes it is a plain control
                    value = inputView.view.$el ? inputView.view.$el.val() : inputView.view.val(),
                    dataset,
                    uri;

                if (input.get('type') === 'table' || input.get('type') === 'tree' || input.get('type') === 'image' || input.get('type') === 'r') {
                    dataset = this.datasets.get(value);
                    uri = window.location.origin + girder.apiRoot + '/item/' + dataset.id + '/download';
                    if (girder.currentUser) {
                        dataset.uri += '?token=' + girder.currentUser.get('token');
                    }
                    result[input.get('name')] = _.extend(dataset.toJSON(), {uri: uri});
                } else if (input.get('type') === 'string') {
                    result[input.get('name')] = {type: input.get('type'), format: 'text', data: value};
                } else if (input.get('type') === 'number') {
                    result[input.get('name')] = {type: input.get('type'), format: 'number', data: parseFloat(value)};
                }
            }, this));
            return result;
        }
    });

}(window.flow, window._, window.tangelo));
