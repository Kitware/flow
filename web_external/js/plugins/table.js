(function (tangelo, $) {
    "use strict";

    if (!($ && $.widget)) {
        return;
    }

    $.widget("tangelo.table", {
        options: {
            data: null
        },

        _create: function () {
            var that = this, saveButton;

            if ('saveChanges' in this.options && this.options.saveChanges) {

                // create editable table
                this.table = $('<table contenteditable class="table table-bordered table-striped"></table>');

                // create save button
                saveButton = $('<button id="table-save" class="btn btn-primary save-button">Save</button>');
                saveButton.click(function () {
                    // grab the current table data and format it as CSV
                    var csv = $(this.nextSibling).map(function () {
                        return $(this).find('tr').map(function () {
                            return $(this).find('th,td').map(function () {
                                return $(this).html();
                            }).get().join(',');
                        }).get().join('\n');
                    }).get().join();

                    // trigger the save event
                    if ('saveChanges' in that.options && that.options.saveChanges) {
                        that.options.saveChanges('data', csv);
                    }

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
                this.element.append(saveButton);
            } else {
                // Read-only mode.
                this.table = $('<table class="table table-bordered table-striped"></table>');
            }
            this.element.append(this.table);
            this._update();
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
}(window.tangelo, window.jQuery));
