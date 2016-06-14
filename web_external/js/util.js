(function ($, _, atob, Backbone, d3, girder, Uint8Array) {
    'use strict';

    window.flow = {
        events: _.clone(Backbone.Events),

        saveLocation: null,

        webFormat: {
            table: 'rows',
            tree: 'nested',
            string: 'text',
            number: 'number',
            image: 'png.base64',
            r: 'serialized',
            geometry: 'vtkpolydata.serialized'
        },

        validatorNiceName: function (validator) {
            return validator.type + ':' + validator.format;
        },

        // entities should be key val
        // with the key being a UI friendly string
        // val being the actual object - which is passed to done
        resolveEntities: function (entities, done) {
            done = (_.isFunction(done)) ? done : function () {};

            if (_.isEmpty(entities)) {
                this.bootstrapAlert("danger", "files are unsupported.", 15);
            } else if (_.size(entities) == 1) {
                done(_.first(_.values(entities)));
            } else {
                $('#th-dialog-container').html(jade.templates.prompt({
                    prompt: 'What type of data is this?',
                    choices: _.keys(entities)
                })).modal();

                $('#th-dialog-container').on('shown.bs.modal', function () {
                    $('#th-dialog-container').off('shown');
                });

                $('#th-dialog-container .th-confirm-button').click(function () {
                    $('#th-dialog-container').modal('hide');
                    done(entities[$('#prompt-choice').val()]);
                });
            }
        },

        resolveTypeFormats: function (typeFormats, done) {
            this.resolveEntities(_.object(_.map(typeFormats, flow.validatorNiceName),
                                          typeFormats), done);
        },

        resolveExtensions: function (extensions, done) {
            this.resolveEntities(_.object(extensions, extensions), done);
        },

        setDisplay: function (mode) {
            ["intro", "vis", "editor"].forEach(function (d) {
                d3.select("#" + d).classed("hidden", mode !== d);
            });
        },

        // @todo should this be renamed? It actually returns "validators"
        // Given an extension, like "csv", return the types/formats
        // that can be associated with it
        getTypeFormatsFromExtension: function (extension) {
            return _.filter(this.validators, function (validator) {
                return (_.has(validator, 'validator') &&
                        _.has(validator.validator, 'extensions') &&
                        _.contains(validator.validator.extensions, extension.toLowerCase()));
            });
        },

        // Returns the extensions a given type/format could be stored as.
        // Both parameters are optional, so called with 0 arguments would
        // return all extensions registered to any type/format.
        getExtensionsFromTypeFormat: function (type, format) {
            var typeFormats = _.filter(this.validators, function (typeFormat) {
                    return ((_.isUndefined(type) || typeFormat.type === type) &&
                            (_.isUndefined(format) || typeFormat.format === format));
                }),
                validators = _.pluck(typeFormats, 'validator'),
                extensions = _.filter(_.flatten(_.pluck(validators, 'extensions')),
                                      function (ext) {
                                          return ext !== undefined;
                                      });

            return extensions;
        },

        /**
         * Given a type, return all formats that can be stored on disk (in other words, have
         * at least 1 extension).
         **/
        getFormatStringsFromType: function (type) {
            return _.pluck(_.filter(this.validators, function (typeFormat) {
                return (typeFormat.type === type &&
                        _.has(typeFormat, 'validator') &&
                        _.has(typeFormat.validator, 'extensions') &&
                        _.size(typeFormat.validator.extensions) > 0);
            }), 'format');
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
            dataset.id = dataset.get('_id');

            if (dataIsURI && dataset.id) {
                dataset.set({
                    data: girder.apiRoot + '/item/' + dataset.id + '/flow/' + type + '/' + dataset.get('format') + '/' + format
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
                uri = 'item/flow/' + type + '/' + dataset.get('format') + '/' + format;

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
                uri = 'item/' + dataset.id + '/flow/' + type + '/' + dataset.get('format') + '/' + format;
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
                path: 'item/' + analysisId + '/flow',
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

        accessor: function (spec) {
            var func,
                field,
                fieldMap = {};

            if (spec.field !== undefined) {
                func = function (d) {
                    var path = spec.field.split('.'),
                        obj = d;
                    path.slice(0, -1).forEach(function (field) {
                        if (obj[field] !== undefined) {
                            obj = obj[field];
                        }
                    });
                    return obj[path[path.length - 1]];
                };
            } else if (spec.value !== undefined) {
                func = function (d) { return spec.value; };
            } else if (spec.object !== undefined) {
                for (field in spec.object) {
                    if (spec.object.hasOwnProperty(field) && field !== '_accessor') {
                        fieldMap[field] = window.flow.accessor(spec.object[field]);
                    }
                }
                func = function (d) {
                    var value = {}, field;
                    for (field in fieldMap) {
                        if (fieldMap.hasOwnProperty(field)) {
                            value[field] = fieldMap[field](d);
                        }
                    }
                    return value;
                };
            }

            func.spec = spec;
            spec._accessor = true;
            return func;
        },

        accessorify: function (spec) {
            var out,
                field;

            if (_.isArray(spec)) {
                out = [];
                spec.forEach(function (d) {
                    out.push(window.flow.accessorify(d));
                });
            } else if (_.isFunction(spec)) {
                out = spec;
            } else if (_.isObject(spec)) {
                if (spec._accessor) {
                    out = window.flow.accessor(spec);
                } else {
                    out = {};
                    for (field in spec) {
                        if (spec.hasOwnProperty(field)) {
                            out[field] = window.flow.accessorify(spec[field]);
                        }
                    }
                }
            } else {
                out = spec;
            }
            return out;
        },

        girderUpload: function (data, name, folderId, itemToOverwrite, success, error) {
            success = success || function () {};
            error = error || function () {};

            var file, bindEvents = function (file) {
                file.on('g:upload.complete', function () {
                    success(arguments);
                    window.flow.bootstrapAlert("success", "Upload complete!", 5);
                }).on('g:upload.error', function () {
                }).on('g:upload.error g:upload.errorStarting', function () {
                    error(arguments);
                    window.flow.bootstrapAlert("danger", "Upload failed: " + arguments[0].response.statusText);
                });
                return file;
            };

            if (itemToOverwrite) {
                // We have the dataset's itemid, but we need its fileid.
                var files = new girder.collections.FileCollection();
                files.altUrl = 'item/' + itemToOverwrite + '/files';

                files.on('g:changed', function () {
                    file = bindEvents(files.models[0]);
                    file.updateContents(data);
                }).fetch();
            } else {
                var folder = new girder.models.FolderModel({_id: folderId});
                file = bindEvents(new girder.models.FileModel());
                file.uploadToFolder(folder, data, name);
            }

            return file;
        },

        // Display a bootstrap-style alert message to the user.
        // Type should be success, info, warning, or danger.
        // Timeout is how long the alert should be display.  Defaults to 5 seconds.
        // If timeout is false, the alert persists.
        bootstrapAlert: function (type, message, timeout) {
            if (timeout !== false) {
                timeout = typeof timeout !== 'undefined' ? timeout : 5;
                timeout *= 1000; // convert to milliseconds
            }

            $('#alert_placeholder').html('<div id="alert" class="alert alert-' + type + ' alert-dismissable fade in"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><span id="alert_message"></span></div>');
            $('#alert_message').text(message);
            $('#alert_placeholder').removeClass("hidden");
            $('#alert').on('closed.bs.alert', function () {
                $('#alert_placeholder').addClass("hidden");
            });
            $('#alert_placeholder').show();

            if (timeout !== false) {
                window.setTimeout(function () {
                    $('#alert').alert('close');
                }, timeout);
            }
        },

        girderItemInput: function (itemId) {
            return {
                mode: 'http',
                url: window.location.origin + girder.apiRoot + '/item/' + itemId + '/download',
                method: 'GET',
                headers: girder.currentUser ? {
                    'Girder-Token': girder.currentUser.get('token')
                } : {}
            };
        }
    };

}(window.$, window._, window.atob, window.Backbone, window.d3, window.girder, window.Uint8Array));
