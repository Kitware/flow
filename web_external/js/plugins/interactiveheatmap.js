(function (tangelo, $, d3) {
    "use strict";

    if (!($ && $.widget && d3)) {
        return;
    }

    $.widget("tangelo.interactiveheatmap", {
        options: {
            data: null
        },

        _create: function () {
            var div = $('<div id="heatmap"></div>');
            this.element.append(div);
            this._update();
        },

        _update: function () {
            var heatmap = d3.chart.heatmap(),
                data = this.options.data.rows,
                columnHeaders = this.options.data.fields;

            d3.select("#heatmap")
                .datum(data)
                .call(heatmap, columnHeaders);
        }
    });
}(window.tangelo, window.jQuery, window.d3));
