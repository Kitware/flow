(function ($) {
    "use strict";

    $.fn.graph = function (spec) {
        var that = this[0];
        spec.data = JSON.parse(spec.data);

        return $(that).nodelink({
            data: {
                nodes: spec.data.nodes,
                links: spec.data.links
            },
            nodeLabel: function (d) { return d.id; },
            linkDistance: 75
        });
    };

}(window.jQuery));
