/*jslint browser: true, nomen: true */

(function (flow, Backbone) {
    "use strict";

    // An <option> tag in a <select> tag collection view defined
    // by an array of Girder items that represent analyses or datasets
    flow.ItemOptionView = Backbone.View.extend({
        tagName: 'option',

        initialize: function () {
            this.model.on('change', this.render, this);
        },

        render: function () {
            this.$el.attr('value', this.model.cid)
                .text(this.model.get('name') + (this.model.get('collection') ? ' (' +  this.model.get('collection').get('name') + ')' : ''));
            return this;
        }
    });

}(window.flow, window.Backbone));
