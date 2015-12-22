(function (flow, girder) {
    "use strict";

    flow.DatasetModel = girder.models.ItemModel.extend({
        get: function (attribute) {
            // Revert to meta/flow/attribute if possible
            if ((!_.has(this.attributes, attribute) &&
                 _.has(this.attributes, 'meta') &&
                 _.has(this.get('meta'), 'flow'))) {
                return this.get('meta').flow[attribute];
            }

            return girder.models.ItemModel.prototype.get.call(this, attribute);
        }
    });
}(window.flow, window.girder));
