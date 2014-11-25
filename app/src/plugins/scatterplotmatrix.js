(function (tangelo, $, d3) {
    "use strict";

    if (!($ && $.widget && d3)) {
        return;
    }

    tangelo.widget("tangelo.scatterplotmatrix", {
        options: {
            data: null,
            y: null
        },

        _create: function () {
            var div = $('<div id="matrix"></div>');
            this.element.append(div);
        },

        _update: function () {
            var matrix = d3.scatterplot.matrix(),
                data = this.options.data.rows,
                y = this.options.y.field;
            d3.select("#matrix")
                .datum(data)
                .call(matrix, y);
        }
    });
}(window.tangelo, window.jQuery, window.d3));
