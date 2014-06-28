/*jslint browser: true, nomen: true */

(function (flow, _, girder) {
    "use strict";

    flow.DatasetCollection = girder.collections.ItemCollection.extend({
        fetch: function (params, reset) {
            var extension;

            if (reset) {
                this.offset -= this.length;
            }

            this.params = params || {};
            girder.restRequest({
                path: this.altUrl || this.resourceName,
                data: _.extend({
                    'limit': this.pageLimit + 1,
                    'offset': this.offset,
                    'sort': this.sortField,
                    'sortdir': this.sortDir
                }, this.params)
            }).done(_.bind(function (list) {
                if (list.length > this.pageLimit) {
                    // This means we have more pages to display still. Pop off
                    // the extra that we fetched.
                    list.pop();
                    this._hasMorePages = true;
                } else {
                    this._hasMorePages = false;
                }

                this.offset += list.length;

                list.forEach(_.bind(function (item) {
                    item.id = item._id;
                    extension = item.name.split('.');
                    extension = extension[extension.length - 1];
                    _.extend(item, flow.extensionToType[extension]);
                }, this));

                if (list.length > 0 || reset) {
                    if (this.append) {
                        this.add(list);
                    } else {
                        this.set(list);
                    }
                }

                this.trigger('g:changed');
            }, this));
        }
    });

}(window.flow, window._, window.girder));
