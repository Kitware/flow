(function (tangelo, $, d3) {
    "use strict";

    if (!($ && $.widget && d3)) {
        return;
    }

    tangelo.widget("tangelo.interactiveheatmap", {
        options: {
            data: null
        },

        _create: function () {
            var div = $('<div id="heatmap"></div>');
            this.element.append(div);
        },

        _update: function () {
            var heatmap = d3.chart.heatmap();
            var data = this.options.data.rows;
            var columnHeaders = this.options.data.fields;
            d3.select("#heatmap")
                .datum(data)
                .call(heatmap, columnHeaders);
        }
    });
}(window.tangelo, window.jQuery, window.d3));
