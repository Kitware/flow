/*jslint browser: true, nomen: true */

(function ($, _, atob, Backbone, d3, girder, Uint8Array) {
    'use strict';

    window.flow = {
        events: _.clone(Backbone.Events),

        saveLocation: null,

        extensionToType: {
            phy: {type: 'tree', format: 'newick'},
            nex: {type: 'tree', format: 'nexus'},
            csv: {type: 'table', format: 'csv'},
            tsv: {type: 'table', format: 'tsv'},
            png: {type: 'image', format: 'png'},
            rds: {type: 'r', format: 'serialized'},
            'objectlist-json': {type: 'table', format: 'objectlist.json'},
            'rows-json': {type: 'table', format: 'rows.json'},
            'number-json': {type: 'number', format: 'json'}
        },

        setDisplay: function (mode) {
            ["intro", "vis", "editor"].forEach(function (d) {
                d3.select("#" + d).classed("hidden", mode !== d);
            });
        },

        // Converts a dataset (either a Girder-backed dataset or dataset
        // stored in the browser) into another format and returns the result
        // to the done function.
        retrieveDatasetAsFormat: function (dataset, type, format, dataIsURI, done) {
            var uri,
                byteCharacters,
                byteNumbers,
                byteArray,
                i;
            if (dataIsURI && dataset.id) {
                dataset.set({
                    data: girder.apiRoot + '/item/' + dataset.id + '/romanesco/' + type + '/' + dataset.get('format') + '/' + format
                });
                if (girder.currentUser) {
                    dataset.set({data: dataset.get('data') + '?token=' + girder.currentUser.get('token')});
                }
                done(null, dataset);
                return;
            }
            if (dataset.has('data')) {
                if (dataset.get('format') === format) {
                    done(null, dataset);
                    return;
                }
                if (dataset.get('type') === 'table' && dataset.get('format') === 'rows') {
                    dataset = new Backbone.Model({type: 'table', format: 'rows.json', data: JSON.stringify(dataset.get('data'))});
                }
                if (dataset.get('type') === 'tree' && dataset.get('format') === 'nested') {
                    dataset = new Backbone.Model({type: 'tree', format: 'nested.json', data: JSON.stringify(dataset.get('data'))});
                }
                if (dataset.get('type') === 'number' && dataset.get('format') === 'number') {
                    dataset = new Backbone.Model({type: 'number', format: 'json', data: JSON.stringify(dataset.get('data'))});
                }
                if (dataset.get('format') === format) {
                    done(null, dataset);
                    return;
                }
                if (dataset.get('type') === 'image' && dataset.get('format') === 'png.base64' && format === 'png') {
                    byteCharacters = atob(dataset.get('data'));
                    byteNumbers = [];
                    byteNumbers.length = byteCharacters.length;
                    for (i = 0; i < byteCharacters.length; i += 1) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    byteArray = new Uint8Array(byteNumbers);
                    done(null, new Backbone.Model({type: 'image', format: 'png', data: byteArray}));
                    return;
                }
                uri = girder.apiRoot + '/item/romanesco/' + type + '/' + dataset.get('format') + '/' + format;
                d3.json(uri).post(dataset.get('data'), function (error, converted) {
                    done(error, new Backbone.Model(converted));
                });
            } else {
                uri = girder.apiRoot + '/item/' + dataset.id + '/romanesco/' + type + '/' + dataset.get('format') + '/' + format;
                d3.json(uri, function (error, converted) {
                    done(error, new Backbone.Model(converted));
                });
            }
        },

        // Run an analysis.
        performAnalysis: function (analysisId, inputs, outputs, done) {
            var bindings = {inputs: inputs, outputs: outputs};
            d3.json(girder.apiRoot + '/item/' + analysisId + '/romanesco').post(JSON.stringify(bindings), done);
        },

        girderUpload: function (data, name, folder, itemToOverwrite) {
            var startByte;

            /**
             * Reads and uploads a chunk of the file starting at startByte. Pass
             * the uploadId generated in _uploadNextFile.
             */
            function uploadChunk(uploadId) {
                var endByte = Math.min(startByte + 1024 * 1024 * 64, data.size),
                    // chunkLength = endByte - startByte,
                    blob = data.slice(startByte, endByte),
                    fd = new FormData();

                fd.append('offset', startByte);
                fd.append('uploadId', uploadId);
                fd.append('chunk', blob);

                $.ajax({
                    url: '/girder/api/v1/file/chunk',
                    type: 'POST',
                    dataType: 'json',
                    data: fd,
                    contentType: false,
                    processData: false,
                    success: function () {
                        // overallProgress += endByte - startByte;
                        if (endByte !== data.size) {
                            startByte = endByte;
                            uploadChunk(uploadId);
                        }
                    }
                });
            }

            // Authenticate and generate the upload token for this file
            if (itemToOverwrite) {
                // We have the dataset's itemid, but we need its fileid.
                $.get(
                    '/girder/api/v1/item/' + itemToOverwrite + '/files',
                    function (response, status) {
                        // Use fileid to begin the upload of the new contents.
                        var fileid = response[0]._id;
                        $.ajax({
                            url: '/girder/api/v1/file/' + fileid + '/contents',
                            dataType: 'json',
                            type: 'PUT',
                            data: {
                                size: data.size,
                                id: fileid
                            },
                            success: function (upload) {
                                if (data.size > 0) {
                                    // Begin uploading chunks of this file
                                    startByte = 0;
                                    uploadChunk(upload._id);
                                }
                            }
                        });
                    }
                );
            } else {
                $.ajax({
                    url: '/girder/api/v1/file',
                    dataType: 'json',
                    type: 'POST',
                    data: {
                        parentType: 'folder',
                        parentId: folder,
                        name: name,
                        size: data.size,
                        mimeType: "text/plain"
                    },
                    success: function (upload) {
                        if (data.size > 0) {
                            // Begin uploading chunks of this file
                            startByte = 0;
                            uploadChunk(upload._id);
                        }
                    }
                });
            }
        }
    };

}(window.$, window._, window.atob, window.Backbone, window.d3, window.girder, window.Uint8Array));
