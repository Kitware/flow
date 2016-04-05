(function (flow, $, _, Backbone, console, d3, tangelo) {
    "use strict";

    flow.VariableEditView = Backbone.View.extend({

        variableProperties: {
            name: {name: "Name", id: "name", type: "string", format: "text"},
            id: {name: "Id", id: "id", type: "string", format: "text"},
            type: {name: "Type", id: "type", type: "string", format: "text"},
            description: {name: "Description", id: "description", type: "string", format: "text"},
            default: {name: "Default", id: "default", type: "string", format: "text"},
            constant: {name: "Fixed", id: "constant", type: "string", format: "text", domain: ["yes", "no"], default: "no"},
            values: {name: "Comma-separated list of values", id: "values", type: "string", format: "text"},
            columnNamesInput: {name: "Input for column names", id: "columnNamesInput", type: "string", format: "text"}
        },

        properties: {
            input: ['name', 'id', 'type', 'description', 'default', 'values', 'columnNamesInput'],
            output: ['name', 'id', 'type', 'description'],
            workflowInput: ['name', 'id', 'description', 'constant', 'default', 'values', 'columnNamesInput'],
            workflowOutput: ['name', 'id', 'description'],
            workflowTask: ['name']
        },

        events: {
            'click .update': function () {
                var model, list, columnNamesInput, values = this.inputsView.values();
                model = {
                    name: values.name.data
                };
                if (values.type) {
                    model.type = values.type.data.split(':')[0];
                    model.format = values.type.data.split(':')[1];
                }
                if (values.id && values.id.data.length > 0) {
                    model.id = values.id.data;
                }
                if (values.description && values.description.data !== '') {
                    model.description = values.description.data;
                }
                if (values.default && values.default.data !== '') {
                    model['default'] = values.default;
                }
                if (values.constant) {
                    model.constant = values.constant.data === 'yes';
                }
                list = values.values;
                if (list && list.data !== '') {
                    model.domain = _.map(list.data.split(','), function (d) { return d.trim(); });
                }
                columnNamesInput = values.columnNamesInput;
                if (columnNamesInput && columnNamesInput.data !== '') {
                    model.domain = {format: 'column.names', input: columnNamesInput.data};
                }
                this.model.set(model);
                this.$el.modal('hide');
            }
        },

        initialize: function (settings) {
            this.variableProperties.type.domain = _.map(flow.validators,
                                                        flow.validatorNiceName)
                .sort(function (a, b) {
                    return a.localeCompare(b);
                });
            this.properties = this.properties[settings.mode];
            this.workflow = settings.workflow;
            this.$('.properties').empty();
            this.inputsView = new flow.InputsView({
                collection: new Backbone.Collection(_.values(_.pick(this.variableProperties, this.properties))),
                idPrefix: 'variable-',
                el: this.$('.properties')
            });
        },

        render: function () {
            var properties;

            // Load model properties into variable properties
            this.variableProperties.name['default'] = {data: this.model.get('name')};
            this.variableProperties.id['default'] = {data: this.model.get('id')};
            this.variableProperties.constant['default'] = {data: this.model.get('constant') ? 'yes' : 'no'};
            this.variableProperties.type['default'] = {data: this.model.get('type') + ':' + this.model.get('format')};
            this.variableProperties.description['default'] = {data: this.model.get('description')};
            if (this.model.get('default') && this.model.get('default').hasOwnProperty('data')) {
                this.variableProperties['default']['default'] = {data: this.model.get('default').data};
            } else {
                this.variableProperties['default']['default'] = {data: ''};
            }

            // Set the domain-specific fields
            this.variableProperties.values['default'] = {data: ''};
            this.variableProperties.columnNamesInput['default'] = {data: ''};
            var domain = this.model.get('domain');
            if (domain) {
                if (_.isArray(domain)) {
                    this.variableProperties.values['default'] = {data: domain.join(',')};
                } else {
                    this.variableProperties.columnNamesInput['default'] = {data: domain.input};
                }
            }

            this.inputsView.collection.set([]);
            this.inputsView.collection.set(_.values(_.pick(this.variableProperties, this.properties)));

            // Show the model dialog
            this.inputsView.render();
            this.$el.modal('show');
            return this;
        }

    });

}(window.flow, window.$, window._, window.Backbone, window.console, window.d3, window.tangelo));
