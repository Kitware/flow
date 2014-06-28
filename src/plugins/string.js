/*jslint browser: true, nomen: true */

(function ($, d3) {
    "use strict";

    $.fn.string = function (options) {
        var data = options.data;
        d3.select(this.get(0)).append("pre")
            .text(options.data);
    };

}(window.$, window.d3));
