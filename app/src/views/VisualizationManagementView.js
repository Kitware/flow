/*jslint browser: true, nomen: true */

(function (flow, _, $, Backbone, d3) {
    "use strict";

    flow.VisualizationManagementView = Backbone.View.extend({

        visualizationDescriptors: [
            {
                name: "table",
                inputs: [
                    {name: "data", type: "table", format: "rows",
                     inputMode: "dataset"}
                ]
            },
            {
                name: "timeline",
                inputs: [
                    {name: "data", type: "table", format: "objectlist"},
                    {name: "x", type: "accessor", domain: {input: "data", format: "column.names"}},
                    {name: "y", type: "accessor", domain: {input: "data", format: "column.names"}}
                ]
            },
            {
                name: "scatterplot",
                inputs: [
                    {name: "data", type: "table", format: "objectlist"},
                    {name: "x", type: "accessor", domain: {input: "data", format: "column.names"}},
                    {name: "y", type: "accessor", domain: {input: "data", format: "column.names"}}
                ]
            },
            {
                name: "dendrogram",
                inputs: [
                    {name: "data", type: "tree", format: "nested"},
                    {name: "distance", type: "accessor", "default": {format: "text", data: "edge_data.weight"}},
                    {name: "label", type: "accessor", "default": {format: "text", data: "node_data.node name"}},
                    {name: "lineStyle", type: "string", domain: ["axisAligned", "curved"]},
                    {name: "orientation", type: "string", domain: ["horizontal", "vertical"]}
                ]
            },
            {
                name: "tablelink",
                inputs: [
                    {name: "data", type: "table", format: "rows"},
                    {name: "source", type: "string", domain: {input: "data", format: "column.names"}},
                    {name: "target", type: "string", domain: {input: "data", format: "column.names"}}
                ]
            },
            {
                name: "image",
                inputs: [
                    {name: "data", type: "image", format: "png.base64"}
                ]
            },
            {
                name: "string",
                inputs: [
                    {name: "data", type: "string", format: "text", inputMode: "dataset"}
                ]
            },
            {
                name: "treeHeatmap",
                inputs: [
                    {
                        name: "tree",
                        type: "tree",
                        format: "vtktree.serialized",
                        dataIsURI: true
                    },
                    {
                        name: "table",
                        type: "table",
                        format: "vtktable.serialized",
                        dataIsURI: true
                    }
                ]
            },
            {
                name: "tanglegram",
                inputs: [
                    {
                        name: "tree1",
                        type: "tree",
                        format: "vtktree.serialized",
                        dataIsURI: true
                    },
                    {
                        name: "tree2",
                        type: "tree",
                        format: "vtktree.serialized",
                        dataIsURI: true
                    },
                    {
                        name: "table",
                        type: "table",
                        format: "csv",
                        dataIsURI: true
                    }
                ]
            }
        ],

        events: {
            'change #visualization': 'changeVisualization',
            'save-modified-data': 'saveModifiedData',
            'click #show': function () {
                this.loadInputs(_.values(this.inputsView.itemViews), {}, _.bind(function (options) {
                    var inner = $('<div style="width:100%;height:100%"></div>');
                    $("#vis").empty();
                    $("#vis").append(inner);
                    flow.setDisplay('vis');
                    setTimeout(_.bind(function () {
                        inner[this.visualization.get('name')](options);
                    }, this), 1000);

                    // Untoggle the show script button if active
                    if (d3.select("#show-script").classed("active")) {
                        $("#show-script").click();
                        d3.select("#show-script").classed("active", false);
                    }
                }, this));
            }
        },

        initialize: function (settings) {
            this.datasets = settings.datasets;

            this.inputsView = new flow.InputsView({
                collection: new Backbone.Collection(),
                el: this.$('.inputs'),
                datasets: this.datasets
            });


            this.visualizations = new Backbone.Collection(this.visualizationDescriptors);
            this.visualizationsView = new flow.ItemsView({el: this.$('#visualization'), itemView: flow.ItemOptionView, collection: this.visualizations});
            this.visualizationsView.render();
            this.changeVisualization();
        },

        render: function () {
            if (this.visualization) {
                this.inputsView.collection.set(this.visualization.get('inputs'));
                this.inputsView.render();
            }
            return this;
        },

        changeVisualization: function () {
            this.visualization = this.visualizations.get($("#visualization").val());
            this.render();
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

            // Sometimes the view is a Backbone view, sometimes it is a plain control
            value = inputView.view.$el ? inputView.view.$el.val() : inputView.view.val();

            input = inputView.model;

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
                options[input.get('name')] = {field: value};
            }
            this.loadInputs(inputViews, options, done);
        },

        saveModifiedData: function (event, params) {

            // Unpack input parameters.
            var inputName = params.name;
            var newDataValue = params.data;

            // Find the index of the input that we're saving a new version of.
            var found = false;
            var inputIndex;
            var visualizationInputs = this.visualization.get("inputs");
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
            var inputView = _.values(this.inputsView.itemViews)[inputIndex];
            var datasetIndex = inputView.view.$el.val();
            var dataset = this.datasets.get(datasetIndex);

            /* Upload the new version of this dataset to Girder.    */
            /* TODO: convert back to the dataset's original format. */
            /* (For now we just assume everything is CSV...)        */
            var blob = new Blob([newDataValue]);
            flow.girderUpload(blob, dataset.get("name"),
                              flow.saveLocation.get('dataFolder'),
                              dataset.id);

            /* Also TODO: check for confirmation from Girder that   */
            /* this new version was actually saved successfully.    */
        }

    });

}(window.flow, window._, window.$, window.Backbone, window.d3));
