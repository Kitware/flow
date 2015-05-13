(function (flow, $, _, Backbone, console, d3, girder) {
    "use strict";

    flow.AnalysisSetupView = Backbone.View.extend({

        events: {
            'click .run': function () {
                var inputs, outputs = {};

                d3.select('.run')
                    .classed('btn-primary', false)
                    .classed('btn-default', true)
                    .attr('disabled', true);

                $('#analysis-output').empty();

                inputs = this.inputsView.values();

                this.model.get('meta').analysis.outputs.forEach(_.bind(function (output) {
                    var id = output.id || output.name;
                    outputs[id] = {type: output.type, format: flow.webFormat[output.type]};
                }, this));
                this.taskBindings = {inputs: inputs, outputs: outputs};

                d3.select('.success-message').classed('hidden', true);
                d3.select('.error-message').classed('hidden', true);
                d3.select('.info-message').classed('hidden', false).text('Running analysis ...');

                flow.performAnalysis(this.model.id, inputs, outputs,
                    _.bind(function (error, result) {
                        if (error) {
                            console.log(error);
                            d3.select('.run')
                                .classed('btn-primary', true)
                                .classed('btn-default', false)
                                .attr('disabled', null);
                            d3.select('.success-message').classed('hidden', true);
                            d3.select('.error-message').classed('hidden', false).text('Error: See console for details.');
                            d3.select('.info-message').classed('hidden', true);
                            return;
                        }
                        if (result.error) {
                            d3.select('.run')
                                .classed('btn-primary', true)
                                .classed('btn-default', false)
                                .attr('disabled', null);
                            d3.select('.success-message').classed('hidden', true);
                            d3.select('.error-message').classed('hidden', false).html('Error:\n' + result.message);
                            d3.select('.info-message').classed('hidden', true);
                            return;
                        }
                        this.taskId = result._id;
                        setTimeout(_.bind(this.checkTaskResult, this), 1000);

                        // Stream console output from this analysis.
                        this.eventSource = new window.EventSource(
                            girder.apiRoot + '/item/' + this.model.id + '/romanesco/' +
                            this.taskId + '/output?token=' +
                            girder.cookie.find('girderToken'));

                        this.eventSource.addEventListener('log', _.bind(function (e) {
                            $('#analysis-output').append(e.data + "\n");
                        }, this));
                        this.eventSource.addEventListener('eof', _.bind(function (e) {
                            console.log('Shutting down stream.');
                            this.eventSource.close();
                        }, this));
                        this.eventSource.addEventListener('past-end', _.bind(function (e) {
                            console.error('Should already be closed!');
                            console.log(e);
                        }, this));
                    }, this));
            },

            'click #show-output': function () {
                var hide = d3.select("#show-output").classed("active");
                d3.select('#analysis-output').classed("hidden", hide);
                d3.select("#show-output-icon").classed("glyphicon-eye-open", hide);
                d3.select("#show-output-icon").classed("glyphicon-eye-close", !hide);
                d3.select("#show-output-text").text(hide ? "Show output log" : "Hide output log");
            },

            'click #close-analysis-setup': function () {
                $('#analysis-output').empty();
            }
        },

        initialize: function (settings) {
            this.datasets = settings.datasets;
            this.visualizations = settings.visualizations;
            this.presets = settings.presets;
            this.inputsView = new flow.InputsView({
                collection: new Backbone.Collection(),
                idPrefix: 'input-',
                el: this.$('.inputs'),
                datasets: this.datasets
            });
        },

        render: function () {
            var analysis = this.model.get('meta').analysis;

            // Deep comparison
            if (!_.isEqual(this.inputsView.inputs, this.model.get('meta').analysis.inputs)) {
                // Deep copy
                this.inputsView.inputs = $.map(this.model.get('meta').analysis.inputs, function (value) {
                    return $.extend(true, {}, value);
                });
                this.inputsView.collection.set(this.model.get('meta').analysis.inputs);
            }
            this.inputsView.render({
                showInputInfo: true
            });

            this.$('.analysis-setup-title').text(analysis.name);
            this.$('.analysis-setup-description').text(analysis.description);
            this.$('.analysis-setup-outputs-container').html(jade.templates.outputsDescription({
                analysis: analysis
            }));
            this.$('.success-message').addClass('hidden');
            this.$('.info-message').addClass('hidden');
            this.$('.error-message').addClass('hidden');
            this.$el.modal('show');
            return this;
        },

        checkTaskResult: function () {
            girder.restRequest({
                path: 'item/' + this.model.id + '/romanesco/' + this.taskId + '/status',
                error: null
            }).done(_.bind(function (result) {
                console.log(result.status);

                if (result.status === 'SUCCESS') {
                    girder.restRequest({
                        path: 'item/' + this.model.id + '/romanesco/' + this.taskId + '/result',
                        error: null
                    }).done(_.bind(function (data) {
                        var result = data.result,
                            outputMessage = '<ul>',
                            outputIdToName = {};

                        this.model.get('meta').analysis.outputs.forEach(function (output) {
                            outputIdToName[output.id] = output.name;
                        });

                        // Put data into list
                        $.each(result, _.bind(function (outputId, output) {
                            if (outputId === '_visualizations') {
                                return;
                            }
                            var index = 1, outputName = outputIdToName[outputId];
                            output = new Backbone.Model(output);
                            output.set({name: this.model.get('name') + ' ' + outputName});
                            while (this.datasets.findWhere({name: output.get('name')})) {
                                output.set({name: this.model.get('name') + ' ' + outputName + ' (' + index + ')'});
                                index += 1;
                            }
                            output.set({bindings: this.taskBindings});
                            this.datasets.add(output);
                            outputMessage += '<li>' + output.get('name') + ' [' + output.get('type') + ']</li>';
                        }, this));

                        result._visualizations = result._visualizations || [];

                        $.each(result._visualizations, _.bind(function (i, visualization) {
                            var index = 1,
                                key,
                                output = new Backbone.Model({meta: {visualization: visualization}});
                            output.set({name: this.model.get('name') + ' ' + visualization.type});
                            for (key in visualization.inputs) {
                                if (visualization.inputs.hasOwnProperty(key)) {
                                    visualization.inputs[key] = visualization.inputs[key].data;
                                }
                            }
                            while (this.presets.findWhere({name: output.get('name')})) {
                                output.set({name: this.model.get('name') + ' ' + visualization.type + ' (' + index + ')'});
                                index += 1;
                            }
                            visualization.bindings = this.taskBindings;
                            visualization.preset = true;
                            this.presets.add(output);
                            outputMessage += '<li>' + output.get('name') + ' [visualization]</li>';
                        }, this));

                        outputMessage += '</ul>';
                        d3.select('.run')
                            .classed('btn-primary', true)
                            .classed('btn-default', false)
                            .attr('disabled', null);
                        d3.select('.error-message').classed('hidden', true);
                        d3.select('.info-message').classed('hidden', true);
                        d3.select('.success-message').classed('hidden', false).html('Success! Produced the following outputs: ' + outputMessage);
                        console.log(data);
                    }, this)).error(_.bind(function (error) {
                        // TODO report error
                    }, this));
                } else if (result.status === 'FAILURE') {
                    d3.select('.run')
                        .classed('btn-primary', true)
                        .classed('btn-default', false)
                        .attr('disabled', null);
                    console.log(result);
                    d3.select('.success-message').classed('hidden', true);
                    d3.select('.info-message').classed('hidden', true);
                    d3.select('.error-message').classed('hidden', false).html('Operation Failed.\n' + result.message);
                } else {
                    setTimeout(_.bind(this.checkTaskResult, this), 1000);
                }
            }, this)).error(_.bind(function (error) {
                // TODO report error
            }, this));
        }
    });

}(window.flow, window.$, window._, window.Backbone, window.console, window.d3, window.girder));
