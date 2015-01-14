/*jslint browser: true, nomen: true */

(function (flow, _, $, Backbone, d3) {
    "use strict";

    flow.VisualizationManagementView = Backbone.View.extend({

        events: {
            'change .visualizations': 'changeVisualization',
            'click .show-visualization': function () {
                this.loadInputs(_.values(this.inputsView.itemViews), {}, this.show);
            },
            'click .add-to-presets': function () {
                var vis = this.visualizations.get($('.visualizations').val());
                this.loadInputs(_.values(this.inputsView.itemViews), {}, _.bind(function (inputs) {
                    var index = 1,
                        preset = vis.toJSON().meta.visualization;
                    preset.type = vis.get('name');
                    while (this.presets.findWhere({name: preset.name})) {
                        preset.name = vis.get('name') + ' (' + index + ')';
                        index += 1;
                    }
                    preset.preset = true;
                    preset.inputs = inputs;
                    flow.lineInput({
                        title: 'Enter a name for the preset',
                        initialValue: preset.name,
                        confirmCallback: _.bind(function (name) {
                            this.presets.add({
                                name: name,
                                meta: {
                                    visualization: preset
                                }
                            });
                        }, this)
                    });
                }, this));
            },
            'click .save': function () {
                var preset = this.presets.get($('.presets').val()),
                    vis = preset.get('meta').visualization;
                girder.restRequest({
                    path: 'item/?name=' + encodeURIComponent(preset.get('name')) + '&folderId=' + flow.saveLocation.get('visualizationFolder'),
                    type: 'POST',
                    error: null
                }).done(_.bind(function (result) {
                    var analysisUri = 'item/' + result._id;
                    girder.restRequest({
                        path: analysisUri + '/metadata',
                        type: 'PUT',
                        contentType: 'application/json',
                        data: JSON.stringify(preset.get('meta')),
                        error: null
                    }).done(_.bind(function (result) {
                        preset.id = result._id;
                        preset.set({collection: flow.saveLocation});
                    }, this)).error(_.bind(function (error) {
                        // TODO report error
                    }, this));
                }, this)).error(_.bind(function (error) {
                    console.log(JSON.stringify(JSON.parse(error.responseText), null, "  "));
                }, this));
            },
            'click .show-preset': function () {
                this.visualization = this.presets.get($('.presets').val());
                console.log(this.visualization.get('meta'));
                this.show(this.visualization.get('meta').visualization.inputs);
            }
        },

        initialize: function (settings) {
            this.datasets = settings.datasets;
            this.visualizations = settings.visualizations;
            this.presets = settings.presets;

            this.inputsView = new flow.InputsView({
                collection: new Backbone.Collection(),
                el: this.$('.inputs'),
                datasets: this.datasets
            });

            this.visualizationsView = new flow.ItemsView({el: this.$('.visualizations'), itemView: flow.ItemOptionView, collection: this.visualizations});
            this.visualizationsView.render();
            this.presetsView = new flow.ItemsView({el: this.$('.presets'), itemView: flow.ItemOptionView, collection: this.presets});
            this.presetsView.render();
            this.changeVisualization();
            _.bindAll(
                this,
                'changeVisualization',
                'loadInputsArray',
                'loadInputs',
                'show',
                'saveModifiedData'
            );

            flow.events.on('flow:change-save-location', _.bind(function () {
                this.$('.save').toggleClass('hidden', flow.saveLocation === null);
            }, this));
        },

        render: function () {
            if (this.visualization) {
                this.inputsView.collection.set(this.visualization.get('meta').visualization.inputs);
                this.inputsView.render();
            }
            return this;
        },

        changeVisualization: function () {
            this.visualization = this.visualizations.get($(".visualizations").val());
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
                var vis = this.visualization.get('meta').visualization;
                if (vis.preset) {
                    inner[vis.type](options);
                } else {
                    inner[vis.name](options);
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
