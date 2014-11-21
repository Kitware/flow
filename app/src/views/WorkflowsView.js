(function (flow, $, _, Backbone) {
    "use strict";

    flow.WorkflowsView = flow.ItemsView.extend({
        template: jade.templates.workflows,

        initialize: function (settings) {
            this.datasets = settings.datasets;
            flow.ItemsView.prototype.initialize.apply(this, [_.extend(settings, {itemView: flow.WorkflowView, itemOptions: {datasets: this.datasets}})]);
        }
    });

}(window.flow, window.$, window._, window.Backbone));
