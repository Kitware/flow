/*jslint browser: true, nomen: true */

(function (flow) {
    "use strict";

    // View for displaying the set of collections and enabling
    // setting active collections and the save location
    flow.VariablesView = flow.ItemsView.extend({
        add: function (item) {
            flow.ItemsView.prototype.add.apply(this, arguments);
        }
    });

}(window.flow));
