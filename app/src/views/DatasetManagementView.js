(function (flow, $, _, Backbone, Blob, d3, FileReader, girder, URL) {
    "use strict";

    // The view for managing data saving and downloading
    flow.DatasetManagementView = Backbone.View.extend({
        saveFormats: {
            table: ['csv', 'tsv', 'rows.json', 'objectlist.json', 'vtktable.serialized'],
            tree: ['nested.json', 'nexus', 'newick', 'vtktree.serialized'],
            image: ['png'],
            r: ['serialized'],
            geometry: ['vtkpolydata.serialized'],
            number: ['json']
        },

        extensions: {
            "table:csv": "csv",
            "table:tsv": "tsv",
            "table:rows.json": "rows-json",
            "table:objectlist.json": "objectlist-json",
            "table:vtktable.serialized": "vtk",
            "tree:nested.json": "nested-json",
            "tree:nexus": "nex",
            "tree:newick": "phy",
            "tree:vtktree.serialized": "vtk",
            "image:png": "png",
            "r:serialized": "rds",
            "geometry:vtkpolydata.serialized": "vtk",
            "number:json": "number-json"
        },

        defaultViews: {
            table: "table",
            string: "string",
            tree: "dendrogram",
            image: "image"
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
                        extension = this.extensions[dataset.get('type') + ":" + format],
                        parts = name.split('.'),
                        nameWithExtension = parts[parts.length - 1] === extension ? name : name + '.' + extension;
                    var file = flow.girderUpload(blob, nameWithExtension, flow.saveLocation.get('dataFolder'), false, function () {
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
                        extension = this.extensions[dataset.get('type') + ":" + format],
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
                    girder.restRequest({
                        path: '/item/' + dataset.id,
                        type: 'DELETE',
                        error: null
                    }).done(_.bind(function () {
                        this.datasets.remove(dataset);
                        this.$('.datasets').change();
                        this.$('.dataset-name').val('');
                    }, this)).error(_.bind(function (error) {
                        window.alert('You do not have permission to delete this item.');
                    }, this));
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
                    extension = file.name.split('.').slice(-1);

                _.extend(dataset, flow.extensionToType[extension]);
                dataset = new Backbone.Model(dataset);

                this.datasets.add(dataset);
            }, this);

            reader.readAsText(file);
        },

        updateDataset: function () {
            var options, valid;
            this.dataset = this.datasets.get(this.$('.datasets').val());

            // If we don't know the format, don't let them download it
            valid = this.dataset.get('type') !== undefined && this.dataset.get('format') !== undefined;
            this.$('.dataset-save-form').toggleClass('hidden', !valid);

            if (valid) {
                this.$('.dataset-name').val(this.dataset.get('name'));
                options = d3.select('.dataset-format-select').selectAll('option')
                    .data(this.saveFormats[this.dataset.get('type')], function (d) { return d; });
                options.enter().append('option')
                    .text(function (d) { return d; })
                    .attr('value', function (d) { return d; });
                options.exit().remove();
            }
        },

        saveLocationChange: function () {
            this.$('.dataset-save').toggleClass('hidden', flow.saveLocation === null);
        }
    });

}(window.flow, window.$, window._, window.Backbone, window.Blob, window.d3, window.FileReader, window.girder, window.URL || window.webkitURL));
