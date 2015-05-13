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
