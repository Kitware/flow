(function (tangelo, $, d3) {
    "use strict";

    if (!($ && $.widget && d3)) {
        return;
    }

    $.widget("tangelo.edgebundling", {
        options: {
            data: null
        },

        _create: function () {
            var div = $('<div id="edgebundle"></div>');
            this.element.append(div);
            this._update();
        },

        _update: function () {
            var chart = d3.chart.edgebundling(),
                data = this.options.data;
            d3.select('#edgebundle')
                .datum(data)
                .call(chart);
        }
    });
}(window.tangelo, window.jQuery, window.d3));
