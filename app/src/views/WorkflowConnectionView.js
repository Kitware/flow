(function (flow, $, Backbone) {
    "use strict";

    flow.WorkflowConnectionView = flow.SVGView.extend({
        tagName: 'g',

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
