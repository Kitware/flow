/*jslint browser: true, nomen: true */

(function (flow, _, $, Backbone, d3) {
    "use strict";

    flow.VisualizationManagementView = Backbone.View.extend({

        events: {
            'change .visualizations': 'changeVisualization',

            'click .show-visualization': function () {
                var vis = this.visualizations.get($('.visualizations').val());
                this.loadInputs(_.values(this.inputsView.itemViews), {}, _.bind(function (inputs) {
                    this.show(vis, inputs);
                }, this));
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
                    vis = preset.get('meta').visualization,
                    item = new girder.models.ItemModel({
                        name: preset.get('name'),
                        folderId: flow.saveLocation.get('visualizationFolder')
                    });

                item.on('g:saved', function () {
                    item._sendMetadata(preset.get('meta'), function () {
                        preset.id = item.get('_id');
                        preset.set({collection: flow.saveLocation});
                    }, function (error) {
                        console.error(error);
                    });
                }, this).on('g:error', function (error) {
                    console.error(error);
                }).save();
            },

            'click .show-preset': function () {
                var vis = this.presets.get($('.presets').val());
                this.show(vis, vis.get('meta').visualization.inputs);
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
                this.inputsView.collection.set([]);
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
            var input,
                inputView,
                dataset,
                value,
                accessor,
                // Add an option that may be nested with dots
                addOption = function (options, name, value) {
                    var path = name.split('.'),
                        obj = options;
                    path.slice(0, -1).forEach(function (f) {
                        if (!obj.hasOwnProperty(f)) {
                            obj[f] = {};
                        }
                        obj = obj[f];
                    });
                    obj[path[path.length - 1]] = value;
                };

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
                    addOption(options, input.get('name'), optionsArray);
                    this.loadInputs(inputViews, options, done);
                }, this));
                return;
            } else if (input.get('type') === 'coordinate') {
                this.loadInputs(_.values(inputView.view.itemViews), {}, _.bind(function (coordOptions) {
                    addOption(options, input.get('name'), {
                        object: {
                            x: coordOptions.longitude,
                            y: coordOptions.latitude
                        },
                        _accessor: true
                    });
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
                    addOption(options, input.get('name'), converted.get('data'));

                    // Handle the rest once we're done taking care of this one
                    this.loadInputs(inputViews, options, done);
                }, this));
                return;
            }

            if (input.get('type') === 'string') {
                addOption(options, input.get('name'), value);
            } else if (input.get('type') === 'number') {
                addOption(options, input.get('name'), parseFloat(value));
            } else if (input.get('type') === 'json') {
                addOption(options, input.get('name'), JSON.parse(value));
            } else if (input.get('type') === 'accessor') {
                if (value !== null) {
                    addOption(options, input.get('name'), {
                        field: value,
                        _accessor: true
                    });
                }
            }
            this.loadInputs(inputViews, options, done);
        },

        show: function (vis, options) {
            var inner = $('<div style="width:100%;height:100%"></div>');
            $("#vis").empty();
            $("#vis").append(inner);
            flow.setDisplay('vis');

            if (flow.saveLocation) {
                options.saveChanges = _.bind(function (inputName, newDataValue) {
                    this.saveModifiedData(vis, inputName, newDataValue);
                }, this);
            }

            setTimeout(_.bind(function () {
                var visualization = vis.get('meta').visualization,
                    convertedOptions = flow.accessorify(options);
                if (visualization.preset) {
                    inner[visualization.type](convertedOptions);
                } else {
                    inner[visualization.name](convertedOptions);
                }
            }, this), 1000);

            // Untoggle the show script button if active
            if (d3.select("#show-script").classed("active")) {
                $("#show-script").click();
                d3.select("#show-script").classed("active", false);
            }
        },

        saveModifiedData: function (vis, inputName, newDataValue) {
            // Find the index of the input that we're saving a new version of.
            var found = false,
                inputIndex,
                visualizationInputs = vis.get("meta").visualization.inputs,
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
                flow.girderUpload(blob, dataset.get("name"), null, dataset.id || dataset.get('id'));
                // Also TODO: check for confirmation from Girder that
                // this new version was actually saved successfully.
            }

        }

    });

}(window.flow, window._, window.$, window.Backbone, window.d3));
