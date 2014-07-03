/*jslint browser: true, unparam: true */

(function ($, tangelo, vg) {
    "use strict";

    $.fn.timeline = function (spec) {
        var y,
            date = tangelo.accessor({field: spec.date}),
            data = spec.data,
            dt = [],
            opt = {
                data: {table: dt},
                renderer: "svg",
                el: this[0]
            },
            that = this[0];

        spec.y = tangelo.isArray(spec.y) ? spec.y : [spec.y];
        y = [];
        spec.y.forEach(function (row) {
            var accessor = tangelo.accessor({field: row}, undefined);
            accessor.field = row.field;
            y.push(accessor);
        });
        data.rows.forEach(function (row) {
            y.forEach(function (yy) {
                dt.push({
                    date: new Date(date(row)),
                    group: yy.field,
                    y: tangelo.isNumber(yy(row)) ? yy(row) : NaN,
                    orig: row
                });
            });
        });

        function resize() {
            vg.parse.spec("timeline.json", function(chart) {
                console.log($(that).width() + "," + $(that).height());
                if ($(that).width() > 0 && $(that).height() > 0) {
                    chart(opt).width($(that).width() - 70).height($(that).height() - 70).update();
                }
            });
        }
        $(window).resize(resize);
        resize();

                // .on("mouseover", function (event, d) {
                //     // if (on.mouseover) {
                //     //     on.mouseover(d);
                //     // }
                // })
                // .on("mouseout", function (event, d) {
                //     // if (on.mouseout) {
                //     //     on.mouseout(d);
                //     // }
                // })
                // .on("click", function (event, d) {
                //     // if (on.click) {
                //     //     on.click(d);
                //     // }
                // })

        return that;
    };

}(window.jQuery, window.tangelo, window.vg));
