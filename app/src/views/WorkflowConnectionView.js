(function (flow, $, Backbone) {
    "use strict";

    flow.WorkflowConnectionView = flow.SVGView.extend({
        tagName: 'g',

        events: {
            'mouseover .connection': function() {
                if (this.workflowView.edit) {
                    $(event.target).attr('stroke', 'crimson').attr('opacity', '1.0');
                }
            },

            'mouseout .connection': function() {
                if (this.workflowView.edit) {
                    $(event.target).attr('stroke', '#333').attr('opacity', '0.75');
                }
            },

            'click .connection': function() {
                if (this.workflowView.edit) {
                    girder.confirm({
                        text: 'Remove this connection from the workflow?',
                        yesText: 'Delete',
                        confirmCallback: _.bind(function () {
                            this.workflowView.connections.remove(this.model);
                        }, this)
                    });
                }
            }
        },

        initialize: function (settings) {
            this.workflowView = settings.workflowView;
            this.model.on('change', this.render, this);
        },

        render: function () {
            this.$el.html(jade.templates.workflowConnection({
                connectionPath: this.workflowView.connectionPath(this.model)
            }));
            return this;
        }
    });

}(window.flow, window.$, window.Backbone));
