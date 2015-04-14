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

        webFormat: {
            table: 'rows',
            tree: 'nested',
            string: 'text',
            number: 'number',
            image: 'png.base64',
            r: 'serialized',
            geometry: 'vtkpolydata.serialized'
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
                uri = 'item/romanesco/' + type + '/' + dataset.get('format') + '/' + format;

                girder.restRequest({
                    path: uri,
                    type: 'POST',
                    data: dataset.get('data'),
                    contentType: false,
                    processData: false,
                    error: null
                }).done(_.bind(function (converted) {
                    done(null, new Backbone.Model(converted));
                }, this)).error(_.bind(function (error) {
                    done(error);
                }, this));
            } else {
                uri = 'item/' + dataset.id + '/romanesco/' + type + '/' + dataset.get('format') + '/' + format;
                girder.restRequest({
                    path: uri,
                    error: null
                }).done(_.bind(function (converted) {
                    done(null, new Backbone.Model(converted));
                }, this)).error(_.bind(function (error) {
                    done(error);
                }, this));
            }
        },

        // Run an analysis.
        performAnalysis: function (analysisId, inputs, outputs, done) {
            var bindings = {inputs: inputs, outputs: outputs};
            girder.restRequest({
                path: 'item/' + analysisId + '/romanesco',
                type: 'POST',
                data: JSON.stringify(bindings),
                contentType: 'application/json',
                error: null
            }).done(_.bind(function (result) {
                done(null, result);
            }), this).error(_.bind(function (error) {
                console.log("Error encountered: " + error.responseText);
                done(error);
            }, this));
        },

        lineInput: function (params) {
            params = _.extend({
                title: 'Enter a name',
                initialValue: 'Untitled',
                yesText: 'Save',
                yesClass: 'btn-primary',
                noText: 'Cancel'
            }, params);

            $('#th-dialog-container').html(jade.templates.lineInput({
                params: params
            })).modal();

            $('#th-dialog-container').on('shown.bs.modal', function () {
                $('#th-dialog-container .th-line-input').focus().select();
                $('#th-dialog-container').off('shown');
            });

            $("#th-dialog-container .th-line-input").keyup(function (event) {
                if (event.keyCode === 13) {
                    $("#th-dialog-container .th-confirm-button").click();
                }
            });

            $('#th-dialog-container .th-confirm-button').click(function () {
                $('#th-dialog-container').modal('hide');
                params.confirmCallback($('#th-dialog-container .th-line-input').val());
            });
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

                girder.restRequest({
                    path: 'file/chunk',
                    type: 'POST',
                    dataType: 'json',
                    data: fd,
                    contentType: false,
                    processData: false,
                    error: null
                }).done(function () {
                    // overallProgress += endByte - startByte;
                    if (endByte !== data.size) {
                        startByte = endByte;
                        uploadChunk(uploadId);
                    }
                }).error(function () {
                    // TODO report error
                });
            }

            // Authenticate and generate the upload token for this file
            if (itemToOverwrite) {
                // We have the dataset's itemid, but we need its fileid.
                girder.restRequest({
                    path: 'v1/item/' + itemToOverwrite + '/files',
                    error: null
                }).done(_.bind(function (response) {
                    // Use fileid to begin the upload of the new contents.
                    var fileid = response[0]._id;
                    girder.restRequest({
                        path: 'file/' + fileid + '/contents',
                        type: 'PUT',
                        data: JSON.stringify({
                            size: data.size,
                            id: fileid
                        }),
                        contentType: 'application/json',
                        error: null
                    }).done(_.bind(function (upload) {
                        if (data.size > 0) {
                            // Begin uploading chunks of this file
                            startByte = 0;
                            uploadChunk(upload._id);
                        }
                    }, this)).error(_.bind(function () {
                        // TODO report error
                    }, this));
                }, this)).error(_.bind(function () {
                    // TODO report error
                }, this));
            } else {
                girder.restRequest({
                    path: 'file',
                    type: 'POST',
                    data: {
                        parentType: 'folder',
                        parentId: folder,
                        name: name,
                        size: data.size,
                        mimeType: "text/plain"
                    },
                    error: null
                }).done(_.bind(function (upload) {
                    if (data.size > 0) {
                        // Begin uploading chunks of this file
                        startByte = 0;
                        uploadChunk(upload._id);
                    }
                }, this)).error(_.bind(function () {
                    // TODO report error
                }, this));
            }
        },

        // Display a bootstrap-style alert message to the user.
        // Type should be success, info, warning, or danger.
        // Timeout is how long the alert should be display.  Defaults to 5 seconds.
        bootstrapAlert: function (type, message, timeout) {
            timeout = typeof timeout !== 'undefined' ? timeout : 5;
            timeout *= 1000; // convert to milliseconds

            $('#alert_placeholder').html('<div id="alert" class="alert alert-' + type + ' alert-dismissable fade in"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><span id="alert_message"></span></div>');
            $('#alert_message').text(message);
            $('#alert_placeholder').removeClass("hidden");
            $('#alert').on('closed.bs.alert', function () {
                $('#alert_placeholder').addClass("hidden");
            });
            $('#alert_placeholder').show();
            window.setTimeout(function () {
                $('#alert').alert('close');
            }, timeout);
        }

    };

}(window.$, window._, window.atob, window.Backbone, window.d3, window.girder, window.Uint8Array));
