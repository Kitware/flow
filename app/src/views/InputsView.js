(function (flow, _, tangelo) {
    "use strict";

    // The view representing the form for a set of inputs to populate
    // for an analysis or visualization
    flow.InputsView = flow.ItemsView.extend({
        initialize: function (settings) {
            this.datasets = settings.datasets;
            this.parentView = settings.parentView;
            this.analysisName = "";
            flow.ItemsView.prototype.initialize.apply(
                this,
                [
                    _.extend(
                        settings,
                        {
                            itemView: flow.InputView,
                            itemOptions: {
                                datasets: settings.datasets,
                                parentView: this
                            }
                        }
                    )
                ]
            );
        },

        render: function () {
            var registerChangeEvents = _.bind(function (view) {
                // For fancy domains such as column names, we need changes in an input dataset
                // dropdown to trigger pulling the data in a certain format (like column headers)
                // as the domain of another input
                view.collection.forEach(_.bind(this.addChangeEvent, this));

                // Trigger a change event on each dataset dropdown so dependent inputs
                // can be initially populated
                view.collection.forEach(_.bind(view.triggerChangeEvent, view));

                // If there is a parent view, add change events up the chain
                if (view.parentView && view.parentView.parentView) {
                    registerChangeEvents(view.parentView.parentView);
                }
            }, this);

            registerChangeEvents(this);
            return this;
        },

        addChangeEvent: function (input) {
            var referredInputView,
                findReferredInputView = _.bind(function (view) {
                    var referredInput = view.collection.findWhere({name: input.get('domain').input});
                    if (!referredInput && view.parentView && view.parentView.parentView) {
                        return findReferredInputView(view.parentView.parentView);
                    }
                    return view.itemViews[referredInput.cid];
                }, this);

            if (input.get('type') === 'string' || input.get('type') === 'accessor' || input.get('type') === 'number' || input.get('type') === 'json') {
                if (input.get('domain') && (_.isObject(input.get('domain')) && !_.isArray(input.get('domain')))) {
                    referredInputView = findReferredInputView(this);
                    if (!referredInputView) {
                        console.error('Referred input not found!');
                        return;
                    }
                    referredInputView.$el.change(_.bind(function () {
                        var dataset = this.datasets.get(referredInputView.view.$el.val());
                        flow.retrieveDatasetAsFormat(dataset, referredInputView.model.get('type'), input.get('domain').format, false, _.bind(function (error, dataset) {
                            var value = this.itemViews[input.cid].view.$el.val();
                            dataset.get('data').sort();
                            this.itemViews[input.cid].view.collection.set(dataset.get('data'));
                            this.itemViews[input.cid].view.$el.val(value);
                        }, this));
                    }, this));
                }
            }
        },

        triggerChangeEvent: function (input) {
            if (this.itemViews[input.cid].inputMode === "dataset") {
                this.itemViews[input.cid].$el.change();
            }
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
