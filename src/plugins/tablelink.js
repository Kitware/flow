/*jslint browser: true, unparam: true */

(function ($, d3, tangelo, vg) {
    "use strict";

    $.fn.tablelink = function (spec) {
        var nodes = [],
            links = [],
            nodeMap = {},
            linkMap = {},
            source = tangelo.accessor({field: spec.source}),
            target = tangelo.accessor({field: spec.target}),
            that = this[0],
            filteredNodes = [],
            filteredNodeMap = {},
            filteredLinks = [];

        spec.data.rows.forEach(function (link) {
            var s = String(source(link)),
                t = String(target(link));
            if (!nodeMap[s]) {
                nodeMap[s] = {id: s, degree: 0, type: spec.source};
                nodes.push(nodeMap[s]);
            }
            if (!nodeMap[t]) {
                nodeMap[t] = {id: t, degree: 0, type: spec.target};
                nodes.push(nodeMap[t]);
            }
            nodeMap[s].degree += 1;
            nodeMap[t].degree += 1;
            if (!linkMap[s]) {
                linkMap[s] = {};
            }
            if (!linkMap[s][t]) {
                linkMap[s][t] = {source: s, target: t, count: 0};
                links.push(linkMap[s][t]);
            }
            linkMap[s][t].count += 1;
        });

        links.sort(function (a, b) { return d3.descending(a.count, b.count); });
        // filteredLinks = links.slice(0, 200);
        filteredLinks = links;

        filteredLinks.forEach(function (link) {
            if (!filteredNodeMap[link.source]) {
                filteredNodeMap[link.source] = nodeMap[link.source];
                filteredNodes.push(nodeMap[link.source]);
            }
            if (!filteredNodeMap[link.target]) {
                filteredNodeMap[link.target] = nodeMap[link.target];
                filteredNodes.push(nodeMap[link.target]);
            }
        });

        return $(that).nodeLink({
            data: {nodes: filteredNodes, links: filteredLinks},
            nodeId: {field: "id"},
            nodeSize: {field: "degree"},
            nodeLabel: {field: "id"},
            nodeColor: {field: "type"},
            nodeCharge: {value: -300},
            linkSource: {field: "source"},
            linkTarget: {field: "target"},
            linkOpacity: {field: "count"},
            linkDistance: {value: 75}
        });
    };

}(window.jQuery, window.d3, window.tangelo, window.vg));
