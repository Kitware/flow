/*jslint browser: true, nomen: true */

(function (flow, Backbone) {
    "use strict";

    // An <option> tag in a <select> tag collection view defined
    // by an array of strings
    flow.StringOptionView = Backbone.View.extend({
        tagName: 'option',

        initialize: function () {
            this.model.on('change', this.render, this);
        },

        render: function () {
            // Attributes of a string model are {string: [object Object]},
            // so retrieve string with the first (and only) key name
            var text = this.model.keys()[0];
            this.$el.attr('value', text)
                .text(text);
            return this;
        }
    });

}(window.flow, window.Backbone));
