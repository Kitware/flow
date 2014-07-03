/*jslint browser: true, nomen: true */

(function (flow) {
    "use strict";

    // View for displaying the set of collections and enabling
    // setting active collections and the save location
    flow.CollectionsView = flow.ItemsView.extend({
        add: function (item) {
            item.set('active', false);
            item.set('saveLocation', false);
            item.on('change:active', function () {
                this.trigger('flow:change-active', item);
            }, this);
            flow.ItemsView.prototype.add.apply(this, arguments);
        }
    });

}(window.flow));
