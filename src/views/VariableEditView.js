/*jslint browser: true, nomen: true */

(function (flow, $, _, Backbone, console, d3, tangelo) {
    "use strict";

    flow.VariableEditView = Backbone.View.extend({

        variableProperties: {
            name: {name: "Name", type: "string", format: "text"},
            type: {name: "Type", type: "string", format: "text", domain: [
                'table:rows',
                'table:objectlist',
                'table:r.dataframe',
                'table:csv',
                'table:tsv',
                'table:vtktable',
                'tree:nested',
                'tree:newick',
                'tree:r.apetree',
                'tree:vtktree',
                'string:text',
                'number:number',
                'image:png.base64',
                'r:object',
                'geometry:vtkpolydata'
            ]},
            description: {name: "Description", type: "string", format: "text"},
            default: {name: "Default", type: "string", format: "text"},
            values: {name: "Comma-separated list of values", type: "string", format: "text"},
            columnNamesInput: {name: "Input for column names", type: "string", format: "text"}
        },

        inputProperties: ['name', 'type', 'description', 'default', 'values', 'columnNamesInput'],

        outputProperties: ['name', 'type', 'description'],

        events: {
            'click .update': function () {
                var values = this.inputsView.values();
                var model = {
                    name: values.Name.data,
                    type: values.Type.data.split(':')[0],
                    format: values.Type.data.split(':')[1]
                };
                if (values.Description.data !== '') {
                    model.description = values.Description.data;
                }
                if (values.Default && values.Default.data !== '') {
                    model.default = values.Default.data;
                }
                var list = values['Comma-separated list of values'];
                if (list && list.data !== '') {
                    model.domain = _.map(list.data.split(','), function (d) { return d.trim(); });
                }
                var columnNamesInput = values['Input for column names'];
                if (columnNamesInput && columnNamesInput.data !== '') {
                    model.domain = {format: 'column.names', input: columnNamesInput.data};
                }
                this.model.set(model);
                this.$el.modal('hide');
            }
        },

        initialize: function(settings) {
            this.model = settings.model;
            this.input = settings.input;
            this.inputsView = new flow.InputsView({
                collection: new Backbone.Collection(_.values(_.pick(this.variableProperties, this.input ? this.inputProperties : this.outputProperties))),
                idPrefix: 'variable-',
                el: this.$('.properties')
            });
        },

        render: function () {
            // Load model properties into variable properties
            this.variableProperties.name.default = {data: this.model.get('name')};
            this.variableProperties.type.default = {data: this.model.get('type') + ':' + this.model.get('format')};
            this.variableProperties.description.default = {data: this.model.get('description')};
            this.variableProperties.default.default = {data: this.model.get('default')};

            // Set the domain-specific fields
            this.variableProperties.values.default = {data: ''};
            this.variableProperties.columnNamesInput.default = {data: ''};
            var domain = this.model.get('domain');
            if (domain) {
                if (tangelo.isArray(domain)) {
                    this.variableProperties.values.default = {data: domain.join(',')};
                } else {
                    this.variableProperties.columnNamesInput.default = {data: domain.input};
                }
            }

            this.inputsView.collection.set(_.values(_.pick(this.variableProperties, this.input ? this.inputProperties : this.outputProperties)));

            // Show the model dialog
            this.inputsView.render();
            this.$el.modal('show');
            return this;
        },

    });

}(window.flow, window.$, window._, window.Backbone, window.console, window.d3, window.tangelo));
