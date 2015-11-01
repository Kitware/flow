(function (flow, $, _, Backbone, Blob, d3, FileReader, girder, URL) {
    "use strict";

    // The view for managing data saving and downloading
    flow.DatasetManagementView = Backbone.View.extend({
        defaultViews: {
            table: "table",
            string: "string",
            tree: "dendrogram",
            image: "image",
            graph: "graph"
        },

        events: {
            'change .datasets': 'updateDataset',

            'click .dataset-quick-view': function () {
                var dataset = this.datasets.get(this.$('.datasets').val()),
                    viewName = this.defaultViews[dataset.get('type')],
                    vis = window.app.visualizationsView.visualizations.findWhere({name: viewName});
                $('#visualization-management .visualizations').val(vis.cid).change();
                $('#visualization-management .inputs select').first().val(dataset.cid);
                $('#visualization-management .show-visualization').click();
            },

            'click .dataset-save': function () {
                var name = this.$('.dataset-name').val(),
                    format = this.$('.dataset-format-select').val(),
                    dataset = this.datasets.get(this.$('.datasets').val());
                flow.retrieveDatasetAsFormat(dataset, dataset.get('type'), format, false, _.bind(function (error, converted) {
                    var blob = new Blob([converted.get('data')]),
                        // @todo resolution
                        extension = _.first(flow.getExtensionsFromTypeFormat(dataset.get('type'), format)),
                        parts = name.split('.'),
                        nameWithExtension = parts[parts.length - 1] === extension ? name : name + '.' + extension,
                    file = flow.girderUpload(blob, nameWithExtension, flow.saveLocation.get('dataFolder'), false, function () {
                        dataset.set({id: file.get('itemId')});
                    });
                    dataset.set({collection: flow.saveLocation});
                }, this));
            },

            'click .dataset-download': function () {
                var name = this.$('.dataset-name').val(),
                    format = this.$('.dataset-format-select').val(),
                    dataset = this.datasets.get(this.$('.datasets').val());
                flow.retrieveDatasetAsFormat(dataset, dataset.get('type'), format, false, _.bind(function (error, converted) {
                    if (error) {
                        console.log(error.responseText);
                        console.log(error.statusText);
                        return;
                    }
                    var blob = new Blob([converted.get('data')]),
                        // @todo resolution
                        extension = _.first(flow.getExtensionsFromTypeFormat(dataset.get('type'), format)),
                        parts = name.split('.'),
                        nameWithExtension = parts[parts.length - 1] === extension ? name : name + '.' + extension,
                        anchor = $('<a href="' + URL.createObjectURL(blob) + '" download="' + nameWithExtension + '" class="hidden"></a>');
                    $('body').append(anchor);
                    anchor[0].click();
                }, this));
            },

            'click .dataset-delete': function () {
                var dataset = this.datasets.get(this.$('.datasets').val());
                if (!dataset) {
                    return;
                }
                if (dataset.get('collection')) {
                    dataset.once('g:deleted', function () {
                        this.$('.dataset-name').val('');
                        this.datasets.remove(dataset);
                        this.$('.datasets').change();
                        this.$('.dataset-name').val('');
                        flow.bootstrapAlert("success", dataset.get('name') + " successfully deleted!", 5);
                    }, this).once('g:error', function () {
                        flow.bootstrapAlert("danger", "You do not have permission to delete this item.", 5);
                    }).destroy();
                } else {
                    this.datasets.remove(dataset);
                    this.$('.datasets').change();
                    this.$('.dataset-name').val('');
                }
            },

            'change #g-files': function () {
                var files = $('#g-files')[0].files;
                _.each(files, function (file) {
                    this.upload(file);
                }, this);
            },

            'click #upload': function () {
                $('#g-files').click();
            },

            'dragenter #upload': function (e) {
                e.stopPropagation();
                e.preventDefault();
                e.originalEvent.dataTransfer.dropEffect = 'copy';
                d3.select('#upload')
                    .classed('btn-success', true)
                    .classed('btn-primary', false)
                    .html('<i class="glyphicon glyphicon-upload"></i> Drop files here');
            },

            'dragleave #upload': function (e) {
                e.stopPropagation();
                e.preventDefault();
                d3.select('#upload')
                    .classed('btn-success', false)
                    .classed('btn-primary', true)
                    .html('<i class="glyphicon glyphicon-file"/></i> Browse or drop files');
            },

            'dragover #upload': function (e) {
                e.preventDefault();
            },

            'drop #upload': function (e) {
                var files = e.originalEvent.dataTransfer.files;
                e.stopPropagation();
                e.preventDefault();
                d3.select('#upload')
                    .classed('btn-success', false)
                    .classed('btn-primary', true)
                    .html('<i class="glyphicon glyphicon-file"></i> Browse or drop files');
                _.each(files, function (file) {
                    this.upload(file);
                }, this);
            }
        },

        initialize: function (settings) {
            this.datasets = settings.datasets;
            this.datasetsView = new flow.ItemsView({el: this.$('.datasets'), itemView: flow.ItemOptionView, collection: this.datasets});
            this.datasetsView.render();
            flow.events.on('flow:change-save-location', this.saveLocationChange, this);
            this.saveLocationChange();

            // Once the first dataset is added, make it the active dataset
            this.datasets.on('add', _.bind(function () {
                if (!this.dataset) {
                    this.updateDataset();
                }
            }, this));
        },

        upload: function (file) {
            var reader = new FileReader();

            reader.onload = _.bind(function (e) {
                var dataset = {
                        name: file.name,
                        data: e.target.result
                    },
                    extension = _.last(file.name.split('.')),
                    typeFormats = flow.getTypeFormatsFromExtension(extension);

                if (_.isEmpty(typeFormats)) {
                    flow.bootstrapAlert("danger", extension + " files are unsupported.", 15);
                } else {
                    flow.resolveTypeFormats(typeFormats, _.bind(function (typeFormat) {
                        _.extend(dataset, typeFormat);
                        dataset = new Backbone.Model(dataset);
                        this.datasets.add(dataset);
                        flow.bootstrapAlert(
                            "success",
                            file.name + "(" + typeFormat.type + ") loaded successfully!",
                            5);
                    }, this));
                }
            }, this);

            reader.readAsText(file);
        },

        updateDataset: function () {
            var options, valid, format, canQuickView;
            this.dataset = this.datasets.get(this.$('.datasets').val());
            format = this.dataset.get("format");

            if (this.dataset) {
                // If we don't know the format, don't let them download it
                valid = this.dataset.get('type') !== undefined && this.dataset.get('format') !== undefined;
                canQuickView = valid && _.has(this.defaultViews, this.dataset.get('type'));

                this.$('.dataset-save-form').toggleClass('hidden', !valid);
                $('#dataset-management button.dataset-quick-view').attr('disabled', !canQuickView);

                if (valid) {
                    this.$('.dataset-name').val(this.dataset.get('name'));
                    options = d3.select('.dataset-format-select').selectAll('option')
                        .data(flow.getFormatStringsFromType(this.dataset.get('type')));
                    options.enter().append('option')
                        .text(function (d) { return d; })
                        .attr('value', function (d) { return d; })
                        .attr('selected', function (d) { if (d === format) { return "selected"; } });
                    options.exit().remove();
                }
            }
        },

        saveLocationChange: function () {
            this.$('.dataset-save').toggleClass('hidden', flow.saveLocation === null);
        }
    });

}(window.flow, window.$, window._, window.Backbone, window.Blob, window.d3, window.FileReader, window.girder, window.URL || window.webkitURL));
