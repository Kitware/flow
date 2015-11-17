(function (flow, _, girder) {
    "use strict";

    flow.DatasetCollection = girder.collections.ItemCollection.extend({
        model: flow.DatasetModel
    });
}(window.flow, window._, window.girder));
