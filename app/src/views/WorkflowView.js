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
                d.isInput = true;
                d.id = d.id || d.name;
                d.task = {
                    inputs: [],
                    outputs: [d],
                    outputScale: function (d) { return 50; }
                }
                newSteps.push(d);
            });
            this.model.get('outputs').forEach(function (d) {
                d.isOutput = true;
                d.id = d.id || d.name;
                d.task = {
                    inputs: [d],
                    outputs: [],
                    inputScale: function (d) { return 50; }
                }
                newSteps.push(d);
            });
            this.steps.set(newSteps);

            this.model.get('connections').forEach(_.bind(function (d) {
                var inName = d.input_step || d.name,
                    outName = d.output_step || d.name;
                d.inStep = this.steps.get(inName);
                d.outStep = this.steps.get(outName);
                d.inStep.get('task').inputs.forEach(function (input, index) {
                    if ((input.id || input.name) === (d.input || d.name)) {
                        d.inputPos = d.inStep.get('task').inputScale(index);
                    }
                });
                d.outStep.get('task').outputs.forEach(function (output, index) {
                    if ((output.id || output.name) === (d.output || d.name)) {
                        d.outputPos = d.outStep.get('task').outputScale(index);
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
            step.task = task;
            step.task.outputScale = d3.scale.linear().domain([0, step.task.outputs.length - 1]).range([10, 90]);
            step.task.inputScale = d3.scale.linear().domain([0, step.task.inputs.length - 1]).range([10, 90]);
            step.girderId = girderId;
            step.modified = modified;
            step.x = step.x || 200;
            step.y = step.y || 200;
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

        removeTooltips: function () {
            this.$('.tooltip').remove();
        },

        connectionPath: function (d) {
            var dist,
                delta,
                offset,
                portOffset = 20,
                inPos = {x: d.get('inStep').get('x'), y: d.get('inStep').get('y')},
                outPos = {x: d.get('outStep').get('x'), y: d.get('outStep').get('y')},
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
                outStep: step,
                outputPos: step.get('task').outputScale(index),
                inStep: new Backbone.Model({x: step.get('x') + 150 + portOffset + 20, y: step.get('y') + step.get('task').outputScale(index)}),
                inputPos: 0
            });
            this.$('.drag-connection').attr('visibility', 'visible');
            this.$('.drag-connection').attr('d', this.connectionPath(this.dragConnection));
        },

        updateConnectionDrag: function (dx, dy) {
            this.dragConnection.get('inStep').set('x', this.dragConnection.get('inStep').get('x') + dx);
            this.dragConnection.get('inStep').set('y', this.dragConnection.get('inStep').get('y') + dy);
            this.$('.drag-connection').attr('d', this.connectionPath(this.dragConnection));
        },

        endConnectionDrag: function () {
            this.$('.drag-connection').attr('visibility', 'hidden');
        }
    });

}(window.flow, window.$, window.d3, window.Backbone));
