(function (tangelo, $) {
    "use strict";

    var app = {key: null};

    function stop_vtkweb() {
        if (app.key) {
            tangelo.vtkweb.terminate(app.key);
            app.key = null;
        }
    }

    // When the page is closed, make sure to close any processes
    // that were running.
    $(window).on('unload', stop_vtkweb);
    $(window).bind('beforeunload', stop_vtkweb);

    if (!($ && $.widget)) {
        return;
    }

    tangelo.widget("tangelo.tanglegram", {
        options: {
            tree1: null,
            tree2: null,
            table: null
        },

        _create: function () {
            this.div = $('<div id="viewport"></div>');
            this.element.append(this.div);
        },

        _update: function () {
            stop_vtkweb();
            this.div.empty();

            var width = $(window).width(), height = $(window).height(),
                args = "--width " + width;
            args += " --height " + height;
            args += " --tree1 " + this.options.tree1;
            args += " --tree2 " + this.options.tree2;
            args += " --table " + this.options.table;
            args += " --baseURL " + window.location.protocol + "//" + window.location.host;

            tangelo.vtkweb.launch({
                url: "vtk_tanglegram.py",
                argstring: args,
                viewport: "#viewport",
                callback: function (key, error) {
                    if (error) {
                        console.warn("error!");
                        console.warn(error);
                        return;
                    }
                    app.key = key;
                }
            });
        }
    });
}(window.tangelo, window.jQuery));
