(function (tangelo, $, flow) {
    "use strict";

    if (!($ && $.widget)) {
        return;
    }

    tangelo.widget("tangelo.table", {
        options: {
            data: null
        },

        _create: function () {
            if (flow.saveLocation) {

                // create editable table
                this.table = $('<table contenteditable class="table table-bordered table-striped"></table>');

                // create save button
                var save_button = $('<button id="table-save" class="btn btn-primary save-button">Save</button>');
                save_button.click(function () {
                    // grab the current table data and format it as CSV
                    var csv =
                    $(this.nextSibling).map(function () {
                        return $(this).find('tr').map(function () {
                            return $(this).find('th,td').map(function () {
                                return $(this).html();
                            }).get().join(',');
                        }).get().join('\n');
                    }).get().join();

                    // trigger the save event in TangeloHub
                    $(window.app.visualizationsView.el).trigger(
                        "save-modified-data", {name: "data", "data": csv});

                    // give the user some visual feedback
                    $(this).removeClass("btn-primary");
                    $(this).text("Saved!");
                    $(this).addClass("btn-success").delay(3000).queue(function (next) {
                        $(this).removeClass("btn-success");
                        $(this).addClass("btn-primary");
                        $(this).text("Save");
                        next();
                    });

                });
                this.element.append(save_button);
            }
            else {
                // Read-only mode.
                this.table = $('<table class="table table-bordered table-striped"></table>');
            }
            this.element.append(this.table);
        },

        _update: function () {
            var header = "<thead>",
                body = "<tbody>",
                headerSet = false,
                fields = this.options.data.fields,
                rows = this.options.data.rows || this.options.data;

            this.table.empty();

            if (fields) {
                $.each(fields, function (index, value) {
                    header += "<th>" + value + "</th>";
                });
                $.each(rows, function (index, value) {
                    if (index >= 200) {
                        return;
                    }
                    var row = "<tr>";
                    $.each(fields, function (index, field) {
                        row += "<td>" + value[field] + "</td>";
                    });
                    row += "</tr>";
                    body += row;
                });
            } else {
                $.each(rows, function (key, value) {
                    if (key >= 200) {
                        return;
                    }
                    var row = "<tr>";
                    $.each(value, function (key, value) {
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
            this.table.append(header);
            this.table.append(body);
        }
    });
}(window.tangelo, window.jQuery, window.flow));
