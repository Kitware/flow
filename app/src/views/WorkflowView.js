(function (flow, $, d3, Backbone) {
    'use strict';

    flow.WorkflowView = Backbone.View.extend({

        initialize: function (settings) {
            this.steps = new Backbone.Collection();
            this.connections = new Backbone.Collection();
            this.edit = settings.edit || false;
        },

        render: function () {
            var newSteps = [], newConnections = [];
            this.model.get('steps').forEach(function (d) {
                d.id = d.id || d.name;
                d.task.outputScale = d3.scale.linear().domain([0, d.task.outputs.length - 1]).range([10, 90]);
                d.task.inputScale = d3.scale.linear().domain([0, d.task.inputs.length - 1]).range([10, 90]);
                newSteps.push(d);
            });
            this.model.get('inputs').forEach(function (d) {
                var input = $.extend(true, {}, d);
                input.isInput = true;
                input.id = d.id || d.name;
                input.task = {
                    inputs: [],
                    outputs: [d],
                    outputScale: function (d) { return 50; }
                }
                newSteps.push(input);
            });
            this.model.get('outputs').forEach(function (d) {
                var output = $.extend(true, {}, d);
                output.isOutput = true;
                output.id = d.id || d.name;
                output.task = {
                    inputs: [d],
                    outputs: [],
                    inputScale: function (d) { return 50; }
                }
                newSteps.push(output);
            });
            this.steps.set(newSteps);

            this.model.get('connections').forEach(_.bind(function (d) {
                var inName = d.input_step || d.name,
                    outName = d.output_step || d.name;
                d.inputStep = this.steps.get(inName);
                d.outputStep = this.steps.get(outName);
                d.inputStep.get('task').inputs.forEach(function (input, index) {
                    if ((input.id || input.name) === (d.input || d.name)) {
                        d.inputIndex = index;
                        d.inputPos = d.inputStep.get('task').inputScale(index);
                    }
                });
                d.outputStep.get('task').outputs.forEach(function (output, index) {
                    if ((output.id || output.name) === (d.output || d.name)) {
                        d.outputIndex = index;
                        d.outputPos = d.outputStep.get('task').outputScale(index);
                    }
                });
                newConnections.push(d);
            }, this));
            this.connections.set(newConnections);

            this.$el.html(jade.templates.workflow(this.model.toJSON()));

            this.stepsView = new flow.ItemsView({
                el: this.$('.steps'),
                collection: this.steps,
                itemView: flow.WorkflowStepView,
                itemOptions: {workflowView: this}
            });
            this.stepsView.render();
            this.connectionsView = new flow.ItemsView({
                el: this.$('.connections'),
                collection: this.connections,
                itemView: flow.WorkflowConnectionView,
                itemOptions: {workflowView: this}
            });
            this.connectionsView.render();
            return this;
        },

        addStep: function(task, girderId, modified) {
            var step = {}, index = 1, model;
            step.id = task.id || task.name;
            step.name = step.id;
            step.isOutput = task.isOutput;
            step.isInput = task.isInput;
            step.visualization = task.visualization || false;
            step.task = task;
            step.task.outputScale = d3.scale.linear().domain([0, step.task.outputs.length - 1]).range([10, 90]);
            step.task.inputScale = d3.scale.linear().domain([0, step.task.inputs.length - 1]).range([10, 90]);
            step.girderId = girderId;
            step.modified = modified;
            step.x = task.x || 200;
            step.y = task.y || 200;
            while (this.steps.get(step.id)) {
                step.id = (task.id || task.name) + ' ' + index;
                step.name = step.id;
                index += 1;
            }
            model = new Backbone.Model(step);
            this.steps.add(model);
            return model;
        },

        editable: function (edit) {
            this.edit = edit;
            this.render();
        },

        serialize: function () {
            var task = {
                inputs: [],
                outputs: [],
                steps: [],
                connections: []
            };

            this.steps.forEach(function (step) {
                var input, output;
                if (step.get('isInput')) {
                    input = {
                        id: step.id,
                        name: step.get('name'),
                        type: step.get('task').outputs[0].type,
                        format: step.get('task').outputs[0].format,
                        x: step.get('x'),
                        y: step.get('y')
                    };
                    ['mode', 'domain', 'default', 'constant', 'description'].forEach(function (key) {
                        if (step.get(key)) {
                            input[key] = step.get(key);
                        }
                    });
                    task.inputs.push(input);
                } else if (step.get('isOutput')) {
                    output ={
                        id: step.id,
                        name: step.get('name'),
                        type: step.get('task').inputs[0].type,
                        format: step.get('task').inputs[0].format,
                        x: step.get('x'),
                        y: step.get('y')
                    };
                    ['description'].forEach(function (key) {
                        if (step.get(key)) {
                            output[key] = step.get(key);
                        }
                    });
                    task.outputs.push(output);
                } else {
                    task.steps.push({
                        x: step.get('x'),
                        y: step.get('y'),
                        id: step.id,
                        name: step.get('name'),
                        visualization: step.get('visualization'),
                        girderId: step.get('girderId'),
                        modified: step.get('modified'),
                        task: step.get('task')
                    });
                }
            });

            this.connections.forEach(function (c) {
                if (c.get('outputStep').get('isInput')) {
                    task.connections.push({
                        name: c.get('outputStep').id,
                        input_step: c.get('inputStep').id,
                        input: c.get('inputStep').get('task').inputs[c.get('inputIndex')].name
                    });
                } else if (c.get('inputStep').get('isOutput')) {
                    task.connections.push({
                        name: c.get('inputStep').id,
                        output_step: c.get('outputStep').id,
                        output: c.get('outputStep').get('task').outputs[c.get('outputIndex')].name
                    });
                } else {
                    task.connections.push({
                        output_step: c.get('outputStep').id,
                        output: c.get('outputStep').get('task').outputs[c.get('outputIndex')].name,
                        input_step: c.get('inputStep').id,
                        input: c.get('inputStep').get('task').inputs[c.get('inputIndex')].name
                    });
                }
            });

            return task;
        },

        removeTooltips: function () {
            this.$('.tooltip').remove();
        },

        connectionPath: function (d) {
            var dist,
                delta,
                offset,
                portOffset = 20,
                inPos = {x: d.get('inputStep').get('x'), y: d.get('inputStep').get('y')},
                outPos = {x: d.get('outputStep').get('x'), y: d.get('outputStep').get('y')},
                inputPos = d.get('inputPos'),
                outputPos = d.get('outputPos');
            delta = [outPos.x- inPos.x, outPos.y - inPos.y];
            dist = Math.sqrt(delta[0] * delta[0] + delta[1] * delta[1]);
            offset = 0.4 * dist - 50;
            offset = offset < 0 ? 0 : offset;
            return 'M ' + (outPos.x + 150 + portOffset) + ' ' + (outPos.y + outputPos) +
                ' C ' + (outPos.x + 150 + portOffset + offset) + ' ' + (outPos.y + outputPos) +
                ' ' + (inPos.x  - portOffset - offset) + ' ' + (inPos.y + inputPos) +
                ' ' + (inPos.x - portOffset) + ' ' + (inPos.y + inputPos);
        },

        startConnectionDrag: function (step, index) {
            var portOffset = 20;
            this.dragOutput = step;
            this.dragOutputIndex = index;
            this.dragConnection = new Backbone.Model({
                outputStep: step,
                outputPos: step.get('task').outputScale(index),
                inputStep: new Backbone.Model({x: step.get('x') + 150 + portOffset + 20, y: step.get('y') + step.get('task').outputScale(index)}),
                inputPos: 0
            });
            this.$('.drag-connection').attr('visibility', 'visible');
            this.$('.drag-connection').attr('d', this.connectionPath(this.dragConnection));
        },

        updateConnectionDrag: function (dx, dy) {
            this.dragConnection.get('inputStep').set('x', this.dragConnection.get('inputStep').get('x') + dx);
            this.dragConnection.get('inputStep').set('y', this.dragConnection.get('inputStep').get('y') + dy);
            this.$('.drag-connection').attr('d', this.connectionPath(this.dragConnection));
        },

        endConnectionDrag: function () {
            this.$('.drag-connection').attr('visibility', 'hidden');
            this.dragOutput = undefined;
            this.dragOutputIndex = undefined;
        },

        checkConnectionComplete: function (step, index) {
            var existing;
            if (this.dragOutput !== undefined &&
                this.dragOutput.get('task').outputs[this.dragOutputIndex].type === step.get('task').inputs[index].type) {

                // Remove any existing connection to this input
                this.connections.remove(this.connections.filter(function (conn) {
                    return conn.get('inputStep') === step && conn.get('inputIndex') === index;
                }));

                // Add the new connection
                this.connections.add({
                    outputStep: this.dragOutput,
                    outputIndex: this.dragOutputIndex,
                    outputPos: this.dragOutput.get('task').outputScale(this.dragOutputIndex),
                    inputStep: step,
                    inputIndex: index,
                    inputPos: step.get('task').inputScale(index)
                });

                this.dragOutput = undefined;
                this.dragOutputIndex = undefined;
            }
        }
    });

}(window.flow, window.$, window.d3, window.Backbone));
