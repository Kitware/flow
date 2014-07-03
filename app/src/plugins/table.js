/*jslint browser: true, unparam: true, nomen: true */

(function (tangelo, $) {
    "use strict";

    if (!($ && $.widget)) {
        return;
    }

    tangelo.widget("tangelo.table", {
        options: {
            data: null
        },

        _create: function () {
            this.div = $('<table class="table table-bordered table-striped"></table>');
            this.element.append(this.div);
        },

        _update: function () {
            var header = "<thead>",
                body = "<tbody>",
                headerSet = false,
                fields = this.options.data.fields,
                rows = this.options.data.rows || this.options.data;

            this.div.empty();

            if (fields) {
                $.each(fields, function(index, value) {
                    header += "<th>" + value + "</th>";
                });
                $.each(rows, function(index, value) {
                    if (index >= 200) {
                        return;
                    }
                    var row = "<tr>";
                    $.each(fields, function(index, field) {
                        row += "<td>" + value[field] + "</td>";
                    });
                    row += "</tr>";
                    body += row;
                });
            } else {
                $.each(rows, function(key, value) {
                    if (key >= 200) {
                        return;
                    }
                    var row = "<tr>";
                    $.each(value, function(key, value) {
                        row += "<td>" + value + "</td>";
                        if (!headerSet) {
                            header += "<th>" + key + "</th>";
                        }
                    });
                    headerSet = true;
                    row += "</tr>";
                    body += row;
                });
            }
            header += "</thead>";
            body += "</tbody>";
            this.div.append(header);
            this.div.append(body);
        }
    });
}(window.tangelo, window.jQuery));
