/*jslint browser: true, nomen: true */

(function ($, d3) {
    "use strict";

    $.fn.image = function (options) {
        var data = options.data;
        if (options.data.indexOf("data:image/png;base64,") !== 0) {
            data = "data:image/png;base64," + options.data;
        }
        d3.select(this.get(0)).append("img")
            .attr("src", data);
    };

}(window.$, window.d3));