(function (flow, $, d3, Backbone) {
    'use strict';

    flow.WorkflowStepView = flow.SVGView.extend({
        tagName: 'g',

        events: {
            'click .delete-step': function () {
                girder.confirm({
                    text: 'Remove the step "' + this.model.id + '" from this workflow?',
                    yesText: 'Delete',
                    confirmCallback: _.bind(function () {
                        this.workflowView.connections.set(
                            this.workflowView.connections.filter(_.bind(function (d) {
                                return d.get('inputStep').id !== this.model.id &&
                                    d.get('outputStep').id !== this.model.id;
                            }, this))
                        );
                        this.workflowView.steps.remove(this.model);
                    }, this)
                });
            },

            'click .edit-step': function () {
                var view;
                if (this.model.get('isInput')) {
                    view = new window.flow.VariableEditView({
                        model: this.model,
                        el: $('#workflow-input-variable-edit-dialog'),
                        mode: 'workflowInput'
                    });
                } else if (this.model.get('isOutput')) {
                    view = new window.flow.VariableEditView({
                        model: this.model,
                        el: $('#workflow-output-variable-edit-dialog'),
                        mode: 'workflowOutput'
                    });
                } else {
                    view = new window.flow.VariableEditView({
                        model: this.model,
                        el: $('#workflow-task-edit-dialog'),
                        mode: 'workflowTask'
                    });
                }
                view.render();
            },

            'click .refresh-step': function() {
                girder.confirm({
                    text: 'Refresh the workflow step "' + this.model.id + '" ?',
                    yesText: 'Refresh',
                    confirmCallback: _.bind(function () {
                        if (!this.model.get('girderId')) {
                            flow.bootstrapAlert("danger", "Unable to refresh " + this.model.get('name') + " because it does not have a database ID set.  It was probably created before this feature was added.  Sorry about that.", 20);
                            return;
                        }

                        girder.restRequest({
                            path: '/item/' + this.model.get('girderId'),
                            type: 'GET',
                            error: null
                        }).done(_.bind(function (result) {
                            var d1, d2;
                            d1 = Date.parse(this.model.get('modified'));
                            d2 = Date.parse(result.updated);

                            if (d2 <= d1) {
                                flow.bootstrapAlert("info", this.model.get('name') + " is already up-to-date.");
                                return;
                            }

                            if (!_.isEqual(this.model.get('task').inputs, result.meta.analysis.inputs)) {
                                flow.bootstrapAlert("warning", this.model.get('name') + " cannot be updated because its inputs have changed.  If you still wish to update this step, please delete & recreate it.", 15);
                                return;
                            }

                            if (!_.isEqual(this.model.get('task').outputs, result.meta.analysis.outputs)) {
                                flow.bootstrapAlert("warning", this.model.get('name') + " cannot be updated because its outputs have changed.  If you still wish to update this step, please delete & recreate it.", 15);
                                return;
                            }

                            this.model.set('task', result.meta.analysis);
                            this.model.set('modified', result.updated);
                            flow.bootstrapAlert("success", this.model.get('name') + " successfully updated!");
                        }, this)).error(_.bind(function (error) {
                            flow.bootstrapAlert("danger", "Unable to refresh " + this.model.get('name') + " because it does not appear in the database.  Perhaps somebody deleted it.", 15);
                            return;
                        }, this));
                    }, this)
                });
            },

            'mouseenter .step': function () {
                if (this.workflowView.edit) {
                    this.$('.delete-step').attr('visibility', 'visible');
                    this.$('.edit-step').attr('visibility', 'visible');
                    this.$('.refresh-step').attr('visibility', 'visible');
                }
            },

            'mouseleave .step': function () {
                this.$('.delete-step').attr('visibility', 'hidden');
                this.$('.edit-step').attr('visibility', 'hidden');
                this.$('.refresh-step').attr('visibility', 'hidden');
            },

            'click .output': function (event) {
                var index = $(event.target).index(),
                    outputPort = _.clone(this.model.get('task').outputs[index]),
                    output = {
                        name: outputPort.name,
                        isOutput: true,
                        inputs: [_.clone(outputPort)],
                        outputs: [],
                        x: this.model.get('x') + 300,
                        y: this.model.get('y')
                    },
                    outputStep;

                ['description'].forEach(function (key) {
                    if (outputPort[key]) {
                        output[key] = outputPort[key];
                    }
                });
                outputStep = this.workflowView.addStep(output);

                this.workflowView.connections.add(new Backbone.Model({
                    outputStep: this.model,
                    outputIndex: index,
                    outputPos: this.model.get('task').outputScale(index),
                    inputStep: outputStep,
                    inputIndex: 0,
                    inputPos: outputStep.get('task').inputScale(0)
                }));
            },

            'click .input': function (event) {
                var index = $(event.target).index(),
                    inputPort = _.clone(this.model.get('task').inputs[index]),
                    input = {
                        name: inputPort.name,
                        isInput: true,
                        outputs: [_.clone(inputPort)],
                        inputs: [],
                        x: this.model.get('x') - 300,
                        y: this.model.get('y')
                    },
                    inputStep;

                ['mode', 'domain', 'default', 'constant', 'description'].forEach(function (key) {
                    if (inputPort[key]) {
                        input[key] = inputPort[key];
                    }
                });
                inputStep = this.workflowView.addStep(input);

                this.workflowView.connections.add(new Backbone.Model({
                    inputStep: this.model,
                    inputIndex: index,
                    inputPos: this.model.get('task').inputScale(index),
                    outputStep: inputStep,
                    outputIndex: 0,
                    outputPos: inputStep.get('task').outputScale(0)
                }));
            },

            'mouseup .input': function (event) {
                this.workflowView.checkConnectionComplete(this.model, $(event.target).index());
            }

        },

        initialize: function (settings) {
            this.workflowView = settings.workflowView;
            this.model.on('change:x change:y', this.move, this);
            this.model.on('change:name', this.rename, this);
        },

        move: function () {
            this.$('.step').attr('transform', 'translate(' + this.model.get('x') + ',' + this.model.get('y') + ')');
        },

        rename: function () {
            this.$('.step-name').text(this.model.get('name'));
        },

        render: function () {
            var portShape = function (type, x, y) {
                    if (type === 'table') {
                        return 'M ' + x + ' ' + y +
                            'm -10, -10' +
                            'l 20, 0' +
                            'l 0, 20' +
                            'l -20, 0' +
                            'Z';
                    }
                    if (type === 'tree') {
                        return 'M ' + x + ' ' + y +
                            'm -10, 10' +
                            'l 20, 0' +
                            'l -10, -20' +
                            'Z';
                    }
                    return 'M ' + x + ' ' + y +
                        ' m -10,0' +
                        ' a 10,10 0 1,0 20,0' +
                        ' a 10,10 0 1,0 -20,0';
                },
                drag = d3.behavior.drag()
                    .origin(function (d) {
                        return {x: d.get('x'), y: d.get('y')};
                    })
                    .on('drag', _.bind(function (d) {
                        d.set('x', d.get('x') + d3.event.dx);
                        d.set('y', d.get('y') + d3.event.dy);

                        this.workflowView.connections.forEach(function (conn) {
                            conn.trigger('change', conn);
                        });
                    }, this)),
                dragPort = d3.behavior.drag()
                    .on('dragstart', _.bind(function (d) {
                        this.workflowView.startConnectionDrag(this.model, $(event.target).index());
                        d3.event.sourceEvent.stopPropagation();
                    }, this))
                    .on('drag', _.bind(function (d) {
                        this.workflowView.updateConnectionDrag(d3.event.dx, d3.event.dy);
                    }, this))
                    .on('dragend', _.bind(function (d) {
                        this.workflowView.endConnectionDrag();
                    }, this));

            this.workflowView.removeTooltips();
            this.$el.html(jade.templates.workflowStep({
                edit: this.workflowView.edit,
                portShape: portShape,
                step: this.model.toJSON()
            }));
            this.$('[data-toggle="tooltip"]').tooltip({container: '#workflow-editor'});
            if (this.workflowView.edit) {
                d3.select(this.el).select('.step')
                    .datum(this.model)
                    .call(drag);
                d3.select(this.el).selectAll('.output')
                    .data(this.model.get('task').outputs)
                    .call(dragPort);
            }
            return this;
        }
    });

}(window.flow, window.$, window.d3, window.Backbone));
