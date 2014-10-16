(function (tangelo, $, d3) {
    "use strict";

    if (!($ && $.widget && d3)) {
        return;
    }

    tangelo.widget("tangelo.edgebundling", {
        options: {
            data: null
        },

        _create: function () {
            var div1 = $('<div"> 0.0 <input id="edgebundle_slider" type="range" name="slider" min="0" max="1.0" value="0.95" step="0.005"/> 1.0</div>');
            var div2 = $('<div id="edgebundle"></div>');

            this.element.append(div1);
            this.element.append(div2);
        },

        _update: function () {
            var chart = d3.chart.edgebundling();
            var data = this.options.data;
            d3.select('#edgebundle')
                .datum(data)
                .call(chart);

            d3.select("#edgebundle_slider").on('change', function (d) {
                rerender(this.value);
            });
        }
    });
}(window.tangelo, window.jQuery, window.d3));
