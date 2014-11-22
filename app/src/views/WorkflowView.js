/*jslint browser: true, nomen: true */

(function (flow, $, Backbone) {
    "use strict";

    flow.WorkflowView = Backbone.View.extend({
        template: jade.templates.workflow,

        events: {
            'click .panel-body': function () {
                // If we're already selected, carry on.
                if (this.$('.panel').hasClass('active')) {
                    return;
                }

                this.$el.parent().find('.panel').removeClass('active').removeClass('active-prev');
                this.$el.parent().find('.th-details').addClass('hidden');
                if (this.$el.prev()) {
                    this.$el.prev().find('.panel').addClass('active-prev');
                }
                this.$('.panel').addClass('active');
                this.$('.th-details').removeClass('hidden');
                if (!this.inputsViewRendered) {
                    this.inputsView = new flow.WorkflowInputsView({
                        collection: new Backbone.Collection(this.model.get('meta').analysis.inputs),
                        idPrefix: this.model.id + '-',
                        el: this.$('.th-inputs'),
                        datasets: this.datasets
                    });
                    this.inputsView.render();
                    this.inputsViewRendered = true;
                }
            },

            'click .th-go': function () {
                var inputs = {},
                    outputs = {};

                this.$('.th-go')
                    .attr('disabled', 'disabled');

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
                    outputs[output.name] = {type: output.type, format: flow.webFormat[output.type]};
                }, this));
                flow.performAnalysis(this.model.id, inputs, outputs,
                    _.bind(function (error, result) {
                        // if (error) {
                        //     console.log(error);
                        //     d3.select('.run')
                        //         .classed('btn-primary', true)
                        //         .classed('btn-default', false)
                        //         .attr('disabled', null);
                        //     d3.select('.success-message').classed('hidden', true);
                        //     d3.select('.error-message').classed('hidden', false).text('Error: See console for details.');
                        //     d3.select('.info-message').classed('hidden', true);
                        //     return;
                        // }
                        // if (result.error) {
                        //     d3.select('.run')
                        //         .classed('btn-primary', true)
                        //         .classed('btn-default', false)
                        //         .attr('disabled', null);
                        //     d3.select('.success-message').classed('hidden', true);
                        //     d3.select('.error-message').classed('hidden', false).html('Error: <pre>' + result.message + '</pre>');
                        //     d3.select('.info-message').classed('hidden', true);
                        //     return;
                        // }
                        this.taskId = result.id;
                        setTimeout(_.bind(this.checkTaskResult, this), 1000);
                    }, this));
            }
        },

        initialize: function (settings) {
            this.datasets = settings.datasets;
            this.model.on('change', this.render, this);
        },

        render: function () {
            this.$el.html(this.template(this.model.attributes));
            this.inputsViewRendered = false;
            return this;
        },

        checkTaskResult: function () {
            girder.restRequest({
                path: 'item/' + this.model.id + '/romanesco/' + this.taskId + '/status',
                error: null
            }).done(_.bind(function (result) {
                console.log(result.status);
                if (result.status === 'SUCCESS' || result.status === 'FAILURE') {
                    // Very strange - order of CSS class names seems to be important here
                    this.$('.th-go')
                        .removeAttr('disabled');
                } else {
                    setTimeout(_.bind(this.checkTaskResult, this), 1000);
                }
                if (result.status === 'SUCCESS') {
                    girder.restRequest({
                        path: 'item/' + this.model.id + '/romanesco/' + this.taskId + '/result',
                        error: null
                    }).done(_.bind(function (data) {
                        var result = data.result,
                            visualizations = result._visualizations || [],
                            outputs = [];

                        $.each(result, _.bind(function (outputName, output) {
                            if (outputName === '_visualizations') {
                                return;
                            }
                            output.name = outputName;
                            outputs.push(output);
                        }, this));

                        this.$('.th-results').removeClass('hidden').empty();
                        $.each(visualizations, _.bind(function (i, visualization) {
                            var options = {},
                                $div;

                            $('<h4/>').text(visualization.type).appendTo(this.$('.th-results'));
                            $div = $('<div/>').addClass('th-visualization').appendTo(this.$('.th-results'));

                            $.each(visualization.inputs, function (name, value) {
                                options[name] = value.data;
                            });

                            $div[visualization.type](options);

                        }, this));

                        console.log(data);
                    }, this)).error(_.bind(function (error) {
                        // TODO report error
                    }, this));
                }
                // TODO report error if FAILURE
            }, this)).error(_.bind(function (error) {
                // TODO report error
            }, this));
        }
    });

}(window.flow, window.$, window.Backbone));
