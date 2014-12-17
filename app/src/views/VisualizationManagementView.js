/*jslint browser: true, nomen: true */

(function (flow, _, $, Backbone, d3) {
    "use strict";

    flow.VisualizationManagementView = Backbone.View.extend({

        events: {
            'change #visualization': 'changeVisualization',
            'click #show': function () {
                var options = {};
                if (this.visualization.get('mode') === 'preset') {
                    $.each(this.visualization.get('inputs'), function (name, value) {
                        options[name] = value.data;
                    });
                    this.show(options);
                } else {
                    this.loadInputs(_.values(this.inputsView.itemViews), {}, this.show);
                }
            }
        },

        initialize: function (settings) {
            this.datasets = settings.datasets;
            this.visualizations = settings.visualizations;

            this.inputsView = new flow.InputsView({
                collection: new Backbone.Collection(),
                el: this.$('.inputs'),
                datasets: this.datasets
            });

            this.visualizationsView = new flow.ItemsView({el: this.$('#visualization'), itemView: flow.ItemOptionView, collection: this.visualizations});
            this.visualizationsView.render();
            this.changeVisualization();
            _.bindAll(
                this,
                'changeVisualization',
                'loadInputsArray',
                'loadInputs',
                'show',
                'saveModifiedData'
            );
        },

        render: function () {
            if (this.visualization) {
                if (this.visualization.get('mode') === 'preset') {
                    this.inputsView.collection.set([]);
                } else {
                    this.inputsView.collection.set(this.visualization.get('inputs'));
                }
                this.inputsView.render();
            }
            return this;
        },

        changeVisualization: function () {
            this.visualization = this.visualizations.get($("#visualization").val());
            this.render();
        },

        loadInputsArray: function (inputsViews, optionsArray, done) {
            if (inputsViews.length === 0) {
                done(optionsArray);
                return;
            }
            var inputsView = inputsViews[0];
            inputsViews = inputsViews.slice(1);
            this.loadInputs(_.values(inputsView.itemViews), {}, _.bind(function (options) {
                optionsArray.push(options);
                this.loadInputsArray(inputsViews, optionsArray, done);
            }, this));
        },

        loadInputs: function (inputViews, options, done) {
            var input, inputView, dataset, value;
            if (inputViews.length === 0) {
                done(options);
                return;
            }

            // Just handle the first input, recurse to handle the rest
            inputView = inputViews[0];
            inputViews = inputViews.slice(1);
            input = inputView.model;

            // Sometimes the view is a Backbone view, sometimes it is a plain control, sometimes is is an array
            if (_.isArray(inputView.view)) {
                this.loadInputsArray(inputView.view, [], _.bind(function (optionsArray) {
                    options[input.get('name')] = optionsArray;
                    this.loadInputs(inputViews, options, done);
                }, this));
                return;
            } else if (inputView.view.$el) {
                value = inputView.view.$el.val();
            } else {
                value = inputView.view.val();
            }

            if (inputView.inputMode === 'dataset') {
                dataset = this.datasets.get(value);
                if (dataset.get('bindings')) {
                    d3.select("#prov")
                        .text(JSON.stringify(dataset.get('bindings').inputs, null, "    "));
                }
                flow.retrieveDatasetAsFormat(dataset, input.get('type'), input.get('format'), input.get('dataIsURI'), _.bind(function (error, converted) {
                    options[input.get('name')] = converted.get('data');

                    // Handle the rest once we're done taking care of this one
                    this.loadInputs(inputViews, options, done);
                }, this));
                return;
            }

            if (input.get('type') === 'string') {
                options[input.get('name')] = value;
            } else if (input.get('type') === 'number') {
                options[input.get('name')] = parseFloat(value);
            } else if (input.get('type') === 'json') {
                options[input.get('name')] = JSON.parse(value);
            } else if (input.get('type') === 'accessor') {
                options[input.get('name')] = function (d) { return d[value]; };
                options[input.get('name')].field = value;
            }
            this.loadInputs(inputViews, options, done);
        },

        show: function (options) {
            var inner = $('<div style="width:100%;height:100%"></div>');
            $("#vis").empty();
            $("#vis").append(inner);
            flow.setDisplay('vis');

            options.modified = _.bind(this.saveModifiedData, this);

            setTimeout(_.bind(function () {
                if (this.visualization.get('mode') === 'preset') {
                    inner[this.visualization.get('type')](options);
                } else {
                    inner[this.visualization.get('name')](options);
                }
            }, this), 1000);

            // Untoggle the show script button if active
            if (d3.select("#show-script").classed("active")) {
                $("#show-script").click();
                d3.select("#show-script").classed("active", false);
            }
        },

        saveModifiedData: function (inputName, newDataValue) {
            // Find the index of the input that we're saving a new version of.
            var found = false,
                inputIndex,
                visualizationInputs = this.visualization.get("inputs"),
                inputView,
                datasetIndex,
                dataset,
                blob;

            for (inputIndex = 0; inputIndex < visualizationInputs.length;
                 inputIndex += 1) {
                if (visualizationInputs[inputIndex].name === inputName) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.log("ERROR: could not find input named " + inputName);
                return;
            }

            // Now that we have that index, get the original dataset
            // so we can save the new version back to Girder.
            // dump from the other function where we do this:
            inputView = _.values(this.inputsView.itemViews)[inputIndex];
            datasetIndex = inputView.view.$el.val();
            dataset = this.datasets.get(datasetIndex);

            // Save the data locally
            dataset.set('data', newDataValue);
            // TODO: Do not require this step.
            dataset.set('format', 'csv');

            // If it is from a collection try to save it back
            // TODO: check for collection edit permission here before
            // attempting to save.
            if (dataset.get('collection')) {
                // Upload the new version of this dataset to Girder.
                // TODO: convert back to the dataset's original format.
                // (For now we just assume everything is CSV...)
                blob = new Blob([newDataValue]);
                flow.girderUpload(blob, dataset.get("name"), null, dataset.id);
                // Also TODO: check for confirmation from Girder that
                // this new version was actually saved successfully.
            }

        }

    });

}(window.flow, window._, window.$, window.Backbone, window.d3));
