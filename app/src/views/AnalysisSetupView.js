/*jslint browser: true, nomen: true */

(function (flow, $, _, Backbone, console, d3, girder) {
    "use strict";

    flow.AnalysisSetupView = Backbone.View.extend({

        webFormat: {
            table: 'rows',
            tree: 'nested',
            string: 'text',
            number: 'number',
            image: 'png.base64',
            r: 'serialized',
            geometry: 'vtkpolydata.serialized'
        },

        events: {
            'click .run': function () {
                var inputs = {}, outputs = {};

                d3.select('.run')
                    .classed('btn-primary', false)
                    .classed('btn-default', true)
                    .attr('disabled', true);

                _.each(this.inputsView.itemViews, _.bind(function (inputView) {
                    var input = inputView.model,

                        // Sometimes the view is a Backbone view, sometimes it is a plain control
                        value = inputView.view.$el ? inputView.view.$el.val() : inputView.view.val(),
                        dataset,
                        uri;

                    if (input.get('type') === 'geometry' || input.get('type') === 'table' || input.get('type') === 'tree' || input.get('type') === 'image' || input.get('type') === 'r') {
                        dataset = this.datasets.get(value);
                        uri = window.location.origin + girder.apiRoot + '/item/' + dataset.id + '/download';
                        if (girder.currentUser) {
                            uri += '?token=' + girder.currentUser.get('token');
                        }
                        inputs[input.get('name')] = _.extend(dataset.toJSON(), {uri: uri});
                    } else if (input.get('type') === 'string') {
                        inputs[input.get('name')] = {type: input.get('type'), format: 'text', data: value};
                    } else if (input.get('type') === 'number') {
                        inputs[input.get('name')] = {type: input.get('type'), format: 'number', data: parseFloat(value)};
                    }
                }, this));
                this.model.get('meta').analysis.outputs.forEach(_.bind(function (output) {
                    outputs[output.name] = {type: output.type, format: this.webFormat[output.type]};
                }, this));
                this.taskBindings = {'inputs': inputs, 'outputs': outputs};

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
                            d3.select('.error-message').classed('hidden', false).html('Error: <pre>' + result.message + '</pre>');
                            d3.select('.info-message').classed('hidden', true);
                            return;
                        }
                        this.taskId = result.id;
                        setTimeout(_.bind(this.checkTaskResult, this), 1000);
                    }, this));
            }
        },

        initialize: function (settings) {
            this.datasets = settings.datasets;
            this.inputsView = new flow.InputsView({
                collection: new Backbone.Collection(),
                idPrefix: 'input-',
                el: this.$('.inputs'),
                datasets: this.datasets
            });
        },

        render: function () {
            this.inputsView.collection.set(this.model.get('meta').analysis.inputs);
            this.inputsView.render();
            this.$('.analysis-setup-title').text(this.model.get('meta').analysis.name);
            this.$('.success-message').addClass('hidden');
            this.$('.info-message').addClass('hidden');
            this.$('.error-message').addClass('hidden');
            this.$el.modal('show');
            return this;
        },

        checkTaskResult: function () {
            d3.json(girder.apiRoot + '/item/' + this.model.id + '/romanesco/' + this.taskId + '/status', _.bind(function (error, result) {
                console.log(result.status);
                if (result.status === 'SUCCESS') {
                    d3.json(girder.apiRoot + '/item/' + this.model.id + '/romanesco/' + this.taskId + '/result', _.bind(function (error, data) {
                        var result = data.result,
                            outputMessage = '<ul>';
                        // Put data into list
                        $.each(result, _.bind(function (outputName, output) {
                            var index = 1;
                            output = new Backbone.Model(output);
                            output.set({name: this.model.get('name') + ' ' + outputName});
                            while (this.datasets.findWhere({name: output.get('name')})) {
                                output.set({name: this.model.get('name') + ' ' + outputName + ' (' + index + ')'});
                                index += 1;
                            }
                            output.set({bindings: this.taskBindings});
                            console.log(output);
                            this.datasets.off('add', null, 'set-collection').add(output);
                            outputMessage += '<li>' + output.get('name') + ' [' + output.get('type') + ']</li>';
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
                    }, this));
                } else if (result.status === 'FAILURE') {
                    d3.select('.run')
                        .classed('btn-primary', true)
                        .classed('btn-default', false)
                        .attr('disabled', null);
                    console.log(result);
                    d3.select('.success-message').classed('hidden', true);
                    d3.select('.info-message').classed('hidden', true);
                    d3.select('.error-message').classed('hidden', false).html('Operation Failed. <pre>' + result.message + '</pre>');
                } else {
                    setTimeout(_.bind(this.checkTaskResult, this), 1000);
                }
            }, this));
        }
    });

}(window.flow, window.$, window._, window.Backbone, window.console, window.d3, window.girder));
