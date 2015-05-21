(function (flow, $, _, ace, Backbone, Blob, d3, FileReader, girder, tangelo, URL, workflow) {
    "use strict";

   // The view for selecting, running, and editing analyses
    flow.AnalysisManagementView = Backbone.View.extend({

        events: {
            'click #show-script': function () {
                var hide = d3.select("#show-script").classed("active");
                flow.setDisplay(hide ? "vis" : "editor");
                this.editor.resize();
                d3.select("#show-script-icon").classed("glyphicon-eye-open", hide);
                d3.select("#show-script-icon").classed("glyphicon-eye-close", !hide);
                d3.select("#show-script-text").text(hide ? "Show script" : "Hide script");

                if (this.workflowView) {
                    this.workflowView.render();
                }
            },

            'click #edit': function () {
                var edit = d3.select("#edit").classed("active");
                this.editor.setReadOnly(edit);
                this.editor.renderer.$cursorLayer.element.style.opacity = edit ? 0 : 1;
                if (this.workflowView) {
                    this.workflowView.editable(!edit);
                }
                d3.selectAll(".edit-controls").classed("hidden", edit);
            },

            'change #mode': function () {
                if (this.analysis) {
                    this.analysis.get('meta').analysis.mode = $("#mode").val();
                    this.editor.getSession().setMode("ace/mode/" + this.analysis.get('meta').analysis.mode);
                }
            },

            'click #save': function () {
                var info, curWorkflow;
                if (this.analysis) {
                    $("#save").addClass("disabled");
                    info = this.analysis.get('meta').analysis;
                    info.name = this.$(".analysis-edit-name").val();
                    info.description = this.$('#analysis-edit-description').val();
                    if (info.mode === "workflow") {
                        curWorkflow = this.workflowView.serialize();
                        info.inputs = curWorkflow.inputs;
                        info.outputs = curWorkflow.outputs;
                        info.steps = curWorkflow.steps;
                        info.connections = curWorkflow.connections;
                    } else {
                        info.script = this.editor.getValue().replace(/(?:\r\n|\r)/g, '\n');
                        info.inputs = this.inputVariables.toJSON();
                        info.outputs = this.outputVariables.toJSON();
                    }

                    this.analysis._sendMetadata(this.analysis.get('meta'), _.bind(function () {
                        this.analysis.set({name: info.name}).once('g:saved', function () {
                            $("#analysis").change();
                            $("#save").removeClass("disabled");
                            this.editor.savedVersion = this.analysis.get('meta').analysis.script;
                            flow.bootstrapAlert("success", info.name + " saved!");
                        }, this).once('g:error', function (error) {
                            flow.bootstrapAlert("danger", "Failed to save " + info.name + ": " + error.statusText, 30);
                        }).save();
                    }, this), function (error) {
                        flow.bootstrapAlert("danger", "Failed to save " + info.name + ": " + error, 30);
                    });
                }
            },

            'click .delete-analysis': function () {
                $('#confirm-delete').modal('show');
            },

            'change #analysis': function () {
                this.changeAnalysis(this.analyses.get($("#analysis").val()));
            },

            'click #setup': function () {
                if (this.analysis) {
                    this.analysisSetupView.model = this.analysis;
                    this.analysisSetupView.render();
                }
            },

            'click .add-input-variable': function () {
                var model = new Backbone.Model();
                this.inputVariableEditView.model = model;
                this.inputVariables.add(model);
                this.inputVariableEditView.render();
            },

            'click .add-output-variable': function () {
                var model = new Backbone.Model();
                this.outputVariableEditView.model = model;
                this.outputVariables.add(model);
                this.outputVariableEditView.render();
            },

            'click #analysis-new': function () {
                var analysis = {
                    name: $("#analysis-name").val(),
                    inputs: [],
                    outputs: [],
                    mode: "python",
                    script: ""
                };
                this.createAnalysis(analysis);
            },

            'click #workflow-new': function () {
                var analysis = {
                    name: $("#analysis-name").val(),
                    inputs: [],
                    outputs: [],
                    mode: "workflow",
                    steps: [],
                    connections: []
                };
                this.createAnalysis(analysis);
            },

            'click #add-workstep': function () {
                var analysis = this.analyses.get($("#workstep").val());
                this.workflowView.addStep(analysis.get("meta").analysis, analysis.id, analysis.get("updated"));
            },

            'click #add-workvis': function () {
                var vis = this.visualizations.get($("#workvis").val());
                this.workflowView.addStep(vis.get("meta").visualization);
            },

            'click #analysis-download': function () {
                var blob = new Blob([JSON.stringify(this.analysis.get('meta').analysis, null, "    ")]),
                    filename = this.analysis.get('meta').analysis.name + '.json',
                    anchor = $('<a href="' + URL.createObjectURL(blob) + '" download="' + filename + '" class="hidden"></a>');
                $("body").append(anchor);
                anchor[0].click();
            },

            'change #analysis-files': function () {
                var files = $('#analysis-files')[0].files;
                _.each(files, function (file) {
                    this.upload(file);
                }, this);
            },

            'click #analysis-upload': function () {
                $('#analysis-files').click();
            }

        },

        initialize: function (settings) {
            this.analysis = null;
            this.datasets = settings.datasets;
            this.visualizations = settings.visualizations;
            this.presets = settings.presets;
            this.analysisSetupView = new flow.AnalysisSetupView({
                el: $('#analysis-setup-dialog'),
                model: this.analysis,
                datasets: this.datasets,
                visualizations: this.visualizations,
                presets: this.presets
            });

            this.editor = ace.edit("code-editor");
            this.editor.setTheme("ace/theme/chrome");
            this.editor.setHighlightActiveLine(false);
            this.editor.setHighlightGutterLine(false);
            this.editor.setShowPrintMargin(false);
            this.editor.setReadOnly(true);
            this.editor.setFontSize(14);
            this.editor.renderer.$cursorLayer.element.style.opacity = 0;

            // 'input' instead of 'change' because it's behind a timeout so
            // it gets fired less frequently.
            this.editor.on('input', _.bind(function () {
                if (this.editor.savedVersion !== this.editor.getValue()) {
                    $("#save").addClass("btn-primary");
                    if (window.onbeforeunload === null) {
                        window.onbeforeunload = function (e) {
                            return "You have unsaved changes in the editor.";
                        };
                    }
                } else {
                    window.onbeforeunload = null;
                    $("#save").removeClass("btn-primary");
                }
            }, this));

            this.workflowView = null;

            this.analyses = settings.analyses;
            this.analysesView = new flow.ItemsView({el: this.$('#analysis'), itemView: flow.ItemOptionView, collection: this.analyses});
            this.analysesView.render();

            this.workstepsView = new flow.ItemsView({el: this.$('#workstep'), itemView: flow.ItemOptionView, collection: this.analyses});
            this.workstepsView.render();

            this.workvisView = new flow.ItemsView({el: this.$('#workvis'), itemView: flow.ItemOptionView, collection: this.visualizations});
            this.workvisView.render();

            this.inputVariables = new Backbone.Collection();
            this.outputVariables = new Backbone.Collection();
            this.inputVariableEditView = new flow.VariableEditView({el: $('#input-variable-edit-dialog'), mode: 'input'});
            this.inputVariablesView = new flow.VariablesView({
                el: this.$('.input-variables'),
                itemView: flow.VariableView,
                itemOptions: {editView: this.inputVariableEditView, collection: this.inputVariables},
                collection: this.inputVariables
            });
            this.outputVariableEditView = new flow.VariableEditView({el: $('#output-variable-edit-dialog'), mode: 'output'});
            this.outputVariablesView = new flow.VariablesView({
                el: this.$('.output-variables'),
                itemView: flow.VariableView,
                itemOptions: {editView: this.outputVariableEditView, collection: this.outputVariables},
                collection: this.outputVariables
            });

            // Once the first analysis is added, make it the active analysis
            this.analyses.on('add', _.bind(function (item) {
                if (!this.analysis) {
                    this.changeAnalysis(item);
                }
            }, this));

            flow.events.on('flow:change-save-location', this.saveLocationChange, this);

            $('.really-delete-analysis').click(_.bind(function () {
                if (this.analysis) {
                    this.analysis.once('g:deleted', function () {
                        this.analyses.remove(this.analysis);
                        // Trigger recreating the analysis UI
                        $("#analysis").change();
                        $('#confirm-delete').modal('hide');
                    }, this).destroy();
                }
            }, this));
        },

        changeAnalysis: function (analysis) {
            var checkCanEdit = function () {
                if (!this.analysis.get('collection') || this.analysis.get('collection').get('_accessLevel') > 0) {
                    d3.select("#edit").classed("hidden", false);
                    d3.selectAll(".edit-controls").classed("hidden", !d3.select("#edit").classed("active"));
                }
            };

            if (this.analysis) {
                this.analysis.off('change:collection', null, this);
            }

            this.analysis = analysis;
            if (this.analysis) {
                this.$('.description-container').removeClass('hide');
                var desc = analysis.get('meta').analysis.description || '';
                this.$('#analysis-description').text(desc);
                this.$('#analysis-edit-description').val(desc);

                if (this.analysis.get('meta').analysis.mode === "workflow") {
                    d3.select("#code-editor").classed("hidden", true);
                    d3.select("#workflow-editor").classed("hidden", false);
                    d3.selectAll(".analysis-edit-controls").classed("hidden", true);
                    d3.selectAll(".workflow-edit-controls").classed("hidden", false);
                    this.workflowView = new flow.WorkflowView({el: '#workflow-editor', model: new Backbone.Model($.extend(true, {}, this.analysis.get('meta').analysis))});
                    this.workflowView.editable(d3.select("#edit").classed("active"));
                    this.workflowView.render();
                } else {
                    d3.select("#code-editor").classed("hidden", false);
                    d3.select("#workflow-editor").classed("hidden", true);
                    d3.selectAll(".analysis-edit-controls").classed("hidden", false);
                    d3.selectAll(".workflow-edit-controls").classed("hidden", true);

                    // So we can detect whether or not the text was changed.
                    this.editor.savedVersion = this.analysis.get('meta').analysis.script;
                    this.editor.setValue(this.analysis.get('meta').analysis.script);
                    this.editor.clearSelection();
                    this.$('#mode').val(this.analysis.get('meta').analysis.mode);
                    this.$('#mode').change();
                    this.inputVariables.set(this.analysis.get('meta').analysis.inputs);
                    this.outputVariables.set(this.analysis.get('meta').analysis.outputs);
                }
                this.$('.analysis-edit-name').val(this.analysis.get('meta').analysis.name);

                this.analysis.on('change:collection', checkCanEdit, this);
                _.bind(checkCanEdit, this)();
            } else {
                this.editor.savedVersion = '';
                this.editor.setValue('');
                this.inputVariables.set([]);
                this.outputVariables.set([]);
                this.$('.description-container').addClass('hide');
            }
        },

        upload: function (file) {
            var reader = new FileReader();

            reader.onload = _.bind(function (e) {
                this.createAnalysis(JSON.parse(e.target.result));
            }, this);

            reader.readAsText(file);
        },

        createAnalysis: function (analysis) {
            var item = new girder.models.ItemModel({
                name: analysis.name,
                folderId: flow.saveLocation.get('analysisFolder')
            });

            item.once('g:saved', function () {
                item.addMetadata('analysis', analysis, _.bind(function () {
                    item.id = item.get('_id');
                    this.analyses.add(item);
                    $("#analysis").val(item.cid).change();
                    $("#analysis-name").val("");
                }, this), function (error) {
                    // TODO report error
                });
            }, this).once('g:error', function (error) {
                console.log(error);
            }).save();
        },

        saveLocationChange: function () {
            this.$('#new-analysis-form').toggleClass('hidden', flow.saveLocation === null);
        }

    });
}(window.flow, window.$, window._, window.ace, window.Backbone, window.Blob, window.d3, window.FileReader, window.girder, window.tangelo, window.URL, window.workflow));
