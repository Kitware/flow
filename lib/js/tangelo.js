window.tangelo = {};

(function(tangelo) {
    "use strict";
    tangelo.version = function() {
        return "0.7dev";
    };
    tangelo.error = function(code, message, jqxhr) {
        var error = {};
        error.code = code;
        if (!message || tangelo.isObject(message)) {
            if (!jqxhr) {
                jqxhr = message;
            }
            message = tangelo.error.string(code);
        }
        error.message = message;
        if (jqxhr) {
            error.jqxhr = jqxhr;
        }
        return error;
    };
    tangelo.error.message = [];
    tangelo.error.string = function(code) {
        return tangelo.error.message[code] || "unrecognized error, code " + code;
    };
    tangelo.error.AJAX_FAILURE = 0;
    tangelo.error.APPLICATION_ERROR = 1;
    tangelo.error.message[tangelo.error.AJAX_FAILURE] = "ajax failure";
    tangelo.error.message[tangelo.error.APPLICATION_ERROR] = "application error";
    tangelo.fatalError = function(module, msg) {
        if (msg === undefined) {
            msg = module;
            throw new Error(msg);
        }
        throw new Error("[" + module + "] " + msg);
    };
    tangelo.unavailable = function(cfg) {
        var plugin = cfg.plugin, required = cfg.required, i, t;
        if (Object.prototype.toString.call(required) === "[object Array]") {
            if (required.length === 1) {
                required = required[0];
            } else if (required.length === 2) {
                required = required[0] + " and " + required[1];
            } else {
                t = "";
                for (i = 0; i < required.length - 1; i += 1) {
                    t += required[i] + ", ";
                }
                t += "and " + required[required.length - 1];
                required = t;
            }
        }
        return function() {
            tangelo.fatalError("JavaScript include error: " + plugin + " requires " + required);
        };
    };
    tangelo.requireCompatibleVersion = function(reqvstr) {
        var reqv, tanv, compatible, parse;
        parse = function(s) {
            var parts, ver, tag, i, components;
            parts = s.split("-");
            if (parts.length > 1) {
                ver = parts.slice(0, -1).join("-");
                tag = parts.slice(-1)[0];
            } else {
                ver = parts[0];
                tag = parts[1];
            }
            if (!ver) {
                return null;
            }
            if (tag !== undefined && (tag.length === 0 || tag.indexOf(" ") !== -1)) {
                return null;
            }
            ver = ver.split(".").map(function(x) {
                return +x;
            });
            if (ver.length === 0) {
                return null;
            }
            for (i = 0; i < ver.length; i += 1) {
                if (isNaN(ver[i]) || ver[i] < 0) {
                    return null;
                }
            }
            components = ver[0] === 0 ? 2 : 3;
            if (ver.length > components) {
                return null;
            }
            for (i = ver.length; i < components; i += 1) {
                ver[i] = 0;
            }
            return {
                version: ver,
                tag: tag
            };
        };
        reqv = parse(reqvstr);
        tanv = parse(tangelo.version());
        if (!tanv) {
            tangelo.fatalError("tangelo.requireCompatibleVersion()", "tangelo version number is invalid: " + tangelo.version());
        } else if (!reqv) {
            tangelo.fatalError("tangelo.requireCompatibleVersion()", "invalid version string: " + reqvstr);
        }
        if (reqv.tag || tanv.tag || reqv.version[0] === 0 || tanv.version[0] === 0) {
            compatible = reqv.tag === tanv.tag && reqv.version[0] === tanv.version[0] && reqv.version[1] === tanv.version[1] && reqv.version[2] === tanv.version[2];
        } else {
            compatible = reqv.version[0] === tanv.version[0] && (reqv.version[1] < tanv.version[1] || reqv.version[1] === tanv.version[1] && reqv.version[2] <= tanv.version[2]);
        }
        return compatible;
    };
})(window.tangelo);

(function(tangelo, $) {
    "use strict";
    if (!$) {
        tangelo.config = tangelo.unavailable({
            plugin: "tangelo.config",
            required: "JQuery"
        });
    } else {
        tangelo.config = function(inputfile, callback) {
            var path = window.location.pathname;
            if (path.slice(-1) !== "/") {
                path = window.location.pathname.split("/").slice(0, -1).join("/");
            }
            if (inputfile.length > 0) {
                if (inputfile[0] !== "/" && inputfile[0] !== "~") {
                    inputfile = path + "/" + inputfile;
                }
            }
            $.ajax({
                url: "/service/config",
                data: {
                    path: inputfile
                },
                dataType: "json",
                error: function(jqxhr) {
                    callback(undefined, undefined, jqxhr);
                },
                success: function(data) {
                    if (data.error) {
                        callback(undefined, undefined, tangelo.error(tangelo.error.APPLICATION_ERROR, data.error));
                    } else {
                        callback(data.result, data.status);
                    }
                }
            });
        };
    }
    tangelo.uniqueID = function() {
        var ids = {
            "": true
        }, letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return function(n) {
            var id = "", i;
            n = n || 6;
            while (ids.hasOwnProperty(id)) {
                id = "";
                for (i = 0; i < n; i += 1) {
                    id += letters[Math.floor(Math.random() * 52)];
                }
            }
            ids[id] = true;
            return id;
        };
    }();
    tangelo.queryArguments = function() {
        var oGetVars = {}, aItKey, nKeyId, aCouples;
        if (window.location.search.length > 1) {
            for (nKeyId = 0, aCouples = window.location.search.substr(1).split("&"); nKeyId < aCouples.length; nKeyId += 1) {
                aItKey = aCouples[nKeyId].split("=");
                oGetVars[decodeURI(aItKey[0])] = aItKey.length > 1 ? decodeURI(aItKey[1]) : "";
            }
        }
        return oGetVars;
    };
    tangelo.isNumber = function(value) {
        return typeof value === "number";
    };
    tangelo.isBoolean = function(value) {
        return typeof value === "boolean";
    };
    tangelo.isArray = function(value) {
        return Object.prototype.toString.call(value) === "[object Array]";
    };
    tangelo.isObject = function(value) {
        return Object.prototype.toString.call(value) === "[object Object]";
    };
    tangelo.isString = function(value) {
        return Object.prototype.toString.call(value) === "[object String]";
    };
    tangelo.isFunction = function(value) {
        return Object.prototype.toString.call(value) === "[object Function]";
    };
    tangelo.absoluteUrl = function(path) {
        var trailing_slash = window.location.pathname[window.location.pathname.length - 1] === "/";
        if (path.length > 0) {
            if (path[0] !== "/" && path[0] !== "~") {
                path = window.location.pathname + (trailing_slash ? "" : "/") + path;
            }
        }
        return path;
    };
    tangelo.accessor = function(spec) {
        var parts, func;
        Function.prototype.clone = function() {
            var cloneObj = this, temp, key;
            if (this.__isClone) {
                cloneObj = this.__clonedFrom;
            }
            temp = function() {
                return cloneObj.apply(this, arguments);
            };
            for (key in this) {
                if (this.hasOwnProperty(key)) {
                    temp[key] = this[key];
                }
            }
            temp.__isClone = true;
            temp.__clonedFrom = cloneObj;
            return temp;
        };
        if (spec === undefined || tangelo.isObject(spec) && Object.keys(spec).length === 0) {
            func = function() {
                tangelo.fatalError("tangelo.accessor()", "I am an undefined accessor - you shouldn't be calling me!");
            };
            func.undefined = true;
        } else if (tangelo.isFunction(spec)) {
            func = spec.clone();
        } else if (spec.hasOwnProperty("value")) {
            func = function() {
                return spec.value;
            };
        } else if (spec.hasOwnProperty("index")) {
            func = function(d, i) {
                return i;
            };
        } else if (spec.hasOwnProperty("field")) {
            if (spec.field === ".") {
                func = function(d) {
                    return d;
                };
            } else {
                parts = spec.field.split(".");
                func = function(d) {
                    var i;
                    for (i = 0; i < parts.length; i += 1) {
                        d = d[parts[i]];
                        if (d === undefined) {
                            return undefined;
                        }
                    }
                    return d;
                };
            }
        } else {
            tangelo.fatalError("tangelo.accessor()", "unknown accessor spec " + spec);
        }
        func.accessor = true;
        return func;
    };
})(window.tangelo, window.jQuery);

(function(tangelo, $) {
    "use strict";
    var unavailable = tangelo.unavailable({
        plugin: "tangelo.widget",
        required: [ "JQuery", "JQuery UI" ]
    });
    if (!$) {
        tangelo.widget = unavailable;
    } else if (!$.widget) {
        tangelo.widget = $.fn.widget = unavailable;
    } else {
        $.widget("tangelo.widget", {
            _setOption: function(key, value) {
                if (this._defaults[key] && this._defaults[key].accessor) {
                    this._super(key, tangelo.accessor(value));
                } else {
                    this._super(key, value);
                }
            },
            _setOptions: function(options) {
                var that = this;
                $.each(options, function(key, value) {
                    that._setOption(key, value);
                });
                this._update();
            },
            _update: $.noop
        });
        tangelo.widget = function(name, spec1, spec2) {
            var key, ptype, spec, superWidget;
            if (spec1.prototype instanceof $.tangelo.widget) {
                spec = spec2;
                superWidget = spec1;
            } else {
                spec = spec1;
                superWidget = $.tangelo.widget;
            }
            ptype = {
                _defaults: spec.options || {},
                _create: function() {
                    this.options = $.extend({}, this._defaults, this.options);
                    if (spec._create) {
                        spec._create.apply(this, arguments);
                    }
                    this._setOptions(this.options);
                }
            };
            for (key in spec) {
                if (spec.hasOwnProperty(key)) {
                    if (key === "_defaults") {
                        tangelo.fatalError('tangelo.widget("' + name + '")', "You cannot use '_defaults' as a field name in your Tangelo widget");
                    } else if (key !== "_create") {
                        ptype[key] = spec[key];
                    }
                }
            }
            $.widget(name, superWidget, ptype);
        };
    }
})(window.tangelo, window.jQuery);

window.tangelo.vegaspec = {};

(function(tangelo) {
    "use strict";
    tangelo.vegaspec.geovis = function(worldGeometryFile) {
        var spec = {
            width: 800,
            height: 800,
            data: [ {
                name: "countries",
                url: null,
                format: {
                    type: "topojson",
                    feature: "countries"
                }
            }, {
                name: "links",
                transform: [ {
                    type: "copy",
                    from: "data",
                    fields: [ "source", "target" ]
                } ]
            }, {
                name: "filter"
            }, {
                name: "table",
                transform: [ {
                    type: "force",
                    links: "links",
                    iterations: 0
                }, {
                    type: "geo",
                    lat: "data.latitude",
                    lon: "data.longitude",
                    projection: "azimuthalEqualArea",
                    clipAngle: 179.99,
                    scale: 200,
                    translate: [ 400, 400 ],
                    precision: .1
                } ]
            } ],
            scales: [ {
                name: "color",
                type: "ordinal",
                range: "category10"
            }, {
                name: "size",
                type: "linear",
                range: [ 100, 400 ],
                zero: false,
                domain: {
                    data: "table",
                    field: "data.size"
                }
            } ],
            legends: [ {
                fill: "color",
                orient: "left",
                properties: {
                    labels: {
                        fontSize: {
                            value: 18
                        }
                    },
                    symbols: {
                        size: {
                            value: 100
                        },
                        stroke: {
                            value: "#fff"
                        }
                    }
                }
            } ],
            marks: [ {
                type: "path",
                from: {
                    data: "countries",
                    transform: [ {
                        type: "geopath",
                        value: "data",
                        projection: "azimuthalEqualArea",
                        clipAngle: 179.99,
                        scale: 200,
                        translate: [ 400, 400 ],
                        precision: .1
                    } ]
                },
                properties: {
                    enter: {
                        stroke: {
                            value: "#fff"
                        },
                        path: {
                            field: "path"
                        }
                    },
                    update: {
                        fill: {
                            value: "#ccc"
                        }
                    }
                }
            }, {
                type: "path",
                from: {
                    data: "links",
                    transform: [ {
                        type: "link",
                        shape: "curve"
                    } ]
                },
                properties: {
                    update: {
                        path: {
                            field: "path"
                        },
                        stroke: {
                            value: "black"
                        },
                        strokeOpacity: {
                            value: 1
                        },
                        strokeWidth: {
                            value: 1
                        }
                    }
                }
            }, {
                type: "symbol",
                from: {
                    data: "table"
                },
                properties: {
                    enter: {
                        x: {
                            field: "x"
                        },
                        y: {
                            field: "y"
                        }
                    },
                    update: {
                        stroke: {
                            value: "#fff"
                        },
                        fill: {
                            scale: "color",
                            field: "data.color"
                        },
                        size: {
                            scale: "size",
                            field: "data.size"
                        }
                    }
                }
            } ]
        };
        spec.data[0].url = worldGeometryFile;
        return spec;
    };
})(window.tangelo);

window.tangelo.vtkweb = {};

(function(tangelo, $, vtkWeb) {
    "use strict";
    tangelo.vtkweb.processes = function(callback) {
        $.ajax({
            url: "/vtkweb",
            dataType: "json",
            error: function(jqxhr) {
                callback(undefined, jqxhr);
            },
            success: function(keys) {
                if (keys.error) {
                    tangelo.fatalError("tangelo.vtkweb.processes()", keys.error);
                }
                callback(keys);
            }
        });
    };
    tangelo.vtkweb.info = function(key, callback) {
        $.ajax({
            url: "/vtkweb/" + key,
            dataType: "json",
            error: function(jqxhr) {
                callback(undefined, jqxhr);
            },
            success: function(report) {
                callback(report);
            }
        });
    };
    (function() {
        var table = {};
        tangelo.vtkweb.launch = function(cfg) {
            var data, url = tangelo.absoluteUrl(cfg.url), callback = cfg.callback, argstring = cfg.argstring, timeout = cfg.timeout, viewport = cfg.viewport;
            if (timeout !== undefined) {
                console.warn("[tangelo.vtkweb.launch] warning: timeout argument has no effect");
            }
            if (url === undefined) {
                tangelo.fatalError("tangelo.vtkweb.launch()", "argument 'url' required");
            }
            if (viewport === undefined) {
                tangelo.fatalError("tangelo.vtkweb.launch()", "argument 'viewport' required");
            }
            data = {
                program: url
            };
            if (argstring) {
                data.args = argstring;
            }
            $.ajax({
                url: "/vtkweb",
                type: "POST",
                data: data,
                dataType: "json",
                error: function(jqxhr) {
                    callback(undefined, jqxhr);
                },
                success: function(report) {
                    var connection, vp;
                    if (report.status === "failed" || report.status === "incomplete") {
                        callback(undefined, tangelo.error(tangelo.error.APPLICATION_ERROR, report.reason));
                    } else if (report.status === "complete") {
                        connection = {
                            sessionURL: report.url
                        };
                        vtkWeb.connect(connection, function(connection) {
                            vp = vtkWeb.createViewport({
                                session: connection.session
                            });
                            vp.bind(viewport);
                            $(window).resize(function() {
                                if (vp) {
                                    vp.render();
                                }
                            });
                            vp.render();
                            table[report.key] = {
                                element: $(viewport).get(0),
                                viewport: vp
                            };
                        }, function(code, reason) {
                            tangelo.fatalError("could not connect to VTKWeb server [code " + code + "]: " + reason);
                        });
                        callback(report.key);
                    } else {
                        tangelo.fatalError("tangelo.vtkweb.launch()", "unexpected report status '" + report.status + "'");
                    }
                }
            });
        };
        tangelo.vtkweb.terminate = function(key, callback) {
            $.ajax({
                url: "/vtkweb/" + key,
                type: "DELETE",
                dataType: "json",
                error: function(jqxhr) {
                    if (callback) {
                        callback(undefined, undefined, jqxhr);
                    }
                },
                success: function(response) {
                    var element;
                    if (!response.reason) {
                        table[key].viewport.unbind();
                        element = table[key].element;
                        delete table[key];
                    }
                    if (callback) {
                        callback(key, element, tangelo.error(tangelo.error.APPLICATION_ERROR, response.reason));
                    } else if (element) {
                        $(element).empty();
                    }
                }
            });
        };
    })();
})(window.tangelo, window.jQuery, window.vtkWeb);

(function(tangelo, $, d3) {
    "use strict";
    if (!($ && d3)) {
        tangelo.unavailable({
            plugin: "controlPanel",
            required: [ "JQuery", "d3" ]
        });
        return;
    }
    function drawerToggle(divsel, buttonsel) {
        var div, button, state, iconheight;
        div = d3.select(divsel);
        button = d3.select(buttonsel);
        state = "uncollapsed";
        iconheight = "20px";
        function getFullHeight() {
            var styleheight = div.style("height"), fullheight;
            div.style("height", null);
            fullheight = $(div.node()).height() + "px";
            div.style("height", styleheight);
            return fullheight;
        }
        return function() {
            if (state === "uncollapsed") {
                div.transition().duration(500).style("height", iconheight);
                button.classed("glyphicon-chevron-down", false).classed("glyphicon-chevron-up", true);
                state = "collapsed";
            } else if (state === "collapsed") {
                div.transition().duration(500).style("height", getFullHeight()).each("end", function() {
                    div.style("height", null);
                });
                button.classed("glyphicon-chevron-down", true).classed("glyphicon-chevron-up", false);
                state = "uncollapsed";
            } else {
                tangelo.fatalError("drawerToggle()", "illegal state: " + state);
            }
        };
    }
    $.fn.controlPanel = function() {
        var toggle, s, id, tag;
        s = d3.select(this[0]);
        if (s.empty()) {
            return;
        }
        tag = tangelo.uniqueID();
        id = s.attr("id");
        if (!id) {
            id = "tangelo-control-panel-" + tag;
            s.attr("id", id);
        }
        s.style("position", "fixed").style("bottom", "0px").style("width", "100%").insert("div", ":first-child").attr("id", "tangelo-drawer-handle-" + tag).style("text-align", "center").style("cursor", "pointer").on("mouseenter", function() {
            d3.select(this).style("background", "gray");
        }).on("mouseleave", function() {
            d3.select(this).style("background", null);
        }).append("span").attr("id", "tangelo-drawer-icon-" + tag).classed("glyphicon", true).classed("glyphicon-chevron-down", true);
        toggle = drawerToggle("#" + id, "#tangelo-drawer-icon-" + tag);
        d3.select("#tangelo-drawer-handle-" + tag).on("click", toggle);
    };
})(window.tangelo, window.jQuery, window.d3);

(function(tangelo, $, google, d3) {
    "use strict";
    if (!($ && google && d3)) {
        tangelo.GoogleMapSVG = tangelo.unavailable({
            plugin: "GoogleMapSVG",
            required: [ "JQuery", "Google Maps API", "d3" ]
        });
        return;
    }
    tangelo.GoogleMapSVG = function(elem, mapoptions, cfg, cont) {
        var that;
        this.id = "gmsvg-" + tangelo.uniqueID();
        this.mapdiv = d3.select(elem).append("div").attr("id", this.id).style("width", $(elem).width() + "px").style("height", $(elem).height() + "px").node();
        this.map = new google.maps.Map(this.mapdiv, mapoptions);
        this.setMap(this.map);
        this.size = {
            width: $(this.mapdiv).width(),
            height: $(this.mapdiv).height()
        };
        that = this;
        $(this.mapdiv).resize(function() {
            google.maps.event.trigger(this.map, "resize");
        });
        this.cfg = cfg || {};
        if (cont) {
            google.maps.event.addListenerOnce(this.map, "idle", function() {
                cont(that);
            });
        }
    };
    tangelo.GoogleMapSVG.prototype = new google.maps.OverlayView();
    tangelo.GoogleMapSVG.prototype.getSVG = function() {
        return this.svg.node();
    };
    tangelo.GoogleMapSVG.prototype.getMap = function() {
        return this.map;
    };
    tangelo.GoogleMapSVG.prototype.computeCBArgs = function() {
        var el, mattrans, transtext;
        el = d3.selectAll("#" + this.id + " [style~='cursor:']");
        transtext = el.style("transform") || el.style("-webkit-transform") || el.style("-o-transform") || el.style("-moz-transform");
        if (!transtext || transtext === "none") {
            transtext = "matrix(1, 0, 0, 1, " + el.style("left").slice(0, -2) + ", " + el.style("top").slice(0, -2) + ")";
        }
        mattrans = transtext.split(" ").map(function(v, i) {
            var retval;
            if (i === 0) {
                retval = v.slice("matrix(".length, -1);
            } else {
                retval = v.slice(0, -1);
            }
            return retval;
        });
        return {
            svg: this.svg.node(),
            projection: this.getProjection(),
            zoom: this.map.getZoom(),
            translation: {
                x: mattrans[4],
                y: mattrans[5]
            },
            transform: mattrans,
            zooming: mattrans[0] !== "1" || mattrans[3] !== "1"
        };
    };
    tangelo.GoogleMapSVG.prototype.attachListener = function(eventType, callback, how) {
        var that = this, attacher;
        if (Object.prototype.toString.call(eventType) === "[object Array]") {
            $.each(eventType, function(i, v) {
                that.attachListener(v, callback, how);
            });
            return;
        }
        if (how === "once") {
            attacher = google.maps.event.addListenerOnce;
        } else if (how === "always") {
            attacher = google.maps.event.addListener;
        } else {
            tangelo.fatalError("GoogleMapSVG.attachListener()", "illegal value for argument 'how'");
        }
        attacher(this.map, eventType, function() {
            var args = that.computeCBArgs();
            if (eventType === "draw") {
                if (args.zooming) {
                    window.setTimeout(google.maps.event.trigger, 100, that.map, "draw");
                }
            }
            callback.call(that, args);
        });
    };
    tangelo.GoogleMapSVG.prototype.on = function(eventType, callback) {
        this.attachListener(eventType, callback, "always");
    };
    tangelo.GoogleMapSVG.prototype.onceOn = function(eventType, callback) {
        this.attachListener(eventType, callback, "once");
    };
    tangelo.GoogleMapSVG.prototype.trigger = function(eventType) {
        google.maps.event.trigger(this.map, eventType);
    };
    tangelo.GoogleMapSVG.prototype.shift = function(what, x, y) {
        d3.select(what).style("-webkit-transform", "translate(" + x + "px, " + y + "px)").style("-moz-transform", "translate(" + x + "px, " + y + "px)").style("-o-transform", "translate(" + x + "px, " + y + "px)").style("transform", "translate(" + x + "px, " + y + "px)");
    };
    tangelo.GoogleMapSVG.prototype.onAdd = function() {
        this.svg = d3.select(this.getPanes().overlayMouseTarget).append("svg").attr("width", this.size.width).attr("height", this.size.height);
        if (this.cfg.initialize) {
            this.cfg.initialize.call(this, this.svg.node(), this.getProjection(), this.map.getZoom());
        }
    };
    tangelo.GoogleMapSVG.prototype.draw = $.noop;
})(window.tangelo, window.jQuery, window.google, window.d3);

(function($, d3) {
    "use strict";
    if (!($ && d3)) {
        return;
    }
    $.fn.svgColorLegend = function(cfg) {
        var bbox, bg, bottom, height, heightfunc, left, maxheight, maxwidth, right, text, top, totalheight, totalwidth, width, legend, cmap_func, xoffset, yoffset, categories, height_padding, width_padding, text_spacing, legend_margins, clear;
        cmap_func = cfg.cmap_func;
        xoffset = cfg.xoffset;
        yoffset = cfg.yoffset;
        categories = cfg.categories;
        height_padding = cfg.height_padding;
        width_padding = cfg.width_padding;
        text_spacing = cfg.text_spacing;
        legend_margins = cfg.legend_margins;
        clear = cfg.clear;
        legend = d3.select(this[0]);
        clear = clear || false;
        if (clear) {
            legend.selectAll("*").remove();
        }
        maxwidth = 0;
        maxheight = 0;
        bg = legend.append("rect").style("fill", "white").style("opacity", .7);
        $.each(categories, function(i, d) {
            legend.append("rect").classed("colorbox", true).attr("x", xoffset).style("fill", cmap_func(d));
            text = legend.append("text").classed("legendtext", true).text(d);
            bbox = text[0][0].getBBox();
            if (bbox.width > maxwidth) {
                maxwidth = bbox.width;
            }
            if (bbox.height > maxheight) {
                maxheight = bbox.height;
            }
        });
        height = maxheight + height_padding;
        width = height;
        totalheight = height * categories.length;
        totalwidth = width + width_padding + maxwidth;
        left = legend_margins.left || 0;
        top = legend_margins.top || 0;
        right = legend_margins.right || 0;
        bottom = legend_margins.bottom || 0;
        bg.attr("x", xoffset - left || 0).attr("y", yoffset - top || 0).attr("width", left + totalwidth + right).attr("height", top + totalheight + bottom);
        heightfunc = function(d, i) {
            return yoffset + i * height;
        };
        legend.selectAll(".colorbox").attr("width", height).attr("height", height).attr("y", heightfunc);
        legend.selectAll(".legendtext").attr("x", xoffset + width + width_padding).attr("y", function(d, i) {
            return text_spacing + heightfunc(d, i);
        });
    };
})(window.jQuery, window.d3);

(function(tangelo, $, d3) {
    "use strict";
    if (!($ && $.widget && d3)) {
        return;
    }
    if (!d3.selection.prototype.moveToFront) {
        d3.selection.prototype.moveToFront = function() {
            return this.each(function() {
                this.parentNode.appendChild(this);
            });
        };
    }
    var _id = 0, toggleExpand = function(d) {
        d.collapse = !d.collapse;
    }, getChildren = function(d) {
        if (!d.collapse) {
            return d._children;
        }
        return [];
    }, getID = function(d) {
        if (!d._treeID) {
            _id += 1;
            d._treeID = _id;
        }
        return d._treeID;
    };
    function findSource(d) {
        if (!d.parent || !d._treeNew) {
            return d;
        }
        return findSource(d.parent);
    }
    function findSink(d) {
        if (!d.parent || !d._treeOld) {
            return d;
        }
        return findSink(d.parent);
    }
    tangelo.widget("tangelo.dendrogram", {
        options: {
            label: tangelo.accessor({
                value: ""
            }),
            id: getID,
            margin: {
                top: 35,
                right: 25,
                bottom: 25,
                left: 25
            },
            width: null,
            height: null,
            duration: 750,
            data: {},
            nodeColor: tangelo.accessor({
                value: "lightsteelblue"
            }),
            labelSize: tangelo.accessor({
                value: "14px"
            }),
            lineWidth: tangelo.accessor({
                value: 1
            }),
            lineColor: tangelo.accessor({
                value: "black"
            }),
            lineStyle: "curved",
            nodeSize: tangelo.accessor({
                value: 5
            }),
            on: {
                click: function() {
                    return true;
                }
            },
            expanded: function(d) {
                return !d.collapse;
            },
            labelPosition: tangelo.accessor({
                value: "above"
            }),
            orientation: "vertical"
        },
        walk: function(f, root, all) {
            var children, that = this;
            root = root || this.options.data;
            f(root);
            children = all ? root._children : root.children;
            children.forEach(function(c) {
                if (c) {
                    that.walk(f, c, all);
                }
            });
        },
        _create: function() {
            this.svg = d3.select(this.element.get(0)).append("svg");
            this.group = this.svg.append("g");
            this._update();
        },
        _destroy: function() {
            this.svg.remove();
        },
        _transition: function(selection) {
            if (this.options.duration) {
                selection = selection.transition().duration(this.options.duration);
            }
            return selection;
        },
        resize: function() {
            var duration = this.options.duration;
            this.options.duration = null;
            this._update();
            this.options.duration = duration;
        },
        _update: function() {
            var that = this, width, height, sw, sh, tree = d3.layout.tree(), line, id = tangelo.accessor(this.options.id), selection, enter, exit, nodes, vert = this.options.orientation === "vertical", rotString = "", tmp, h, ml = this.options.margin.left, mt = this.options.margin.top, mr = this.options.margin.right, mb = this.options.margin.bottom;
            width = this.options.width || this.element.width();
            height = this.options.height || this.element.height();
            sw = width;
            sh = height;
            if (!vert) {
                h = height - mb;
                tmp = width;
                width = height;
                height = tmp;
                rotString = "translate(" + ml + "," + h + ") " + "rotate(-90) ";
                mt = this.options.margin.right;
                mb = this.options.margin.left;
                ml = this.options.margin.top;
                mr = this.options.margin.bottom;
            } else {
                rotString = "translate(" + ml + "," + mt + ")";
            }
            this.svg.attr("width", sw).attr("height", sh);
            width -= ml + mr;
            height -= mt + mb;
            this.group.attr("transform", rotString);
            this.walk(function(d) {
                d._children = d._children || d.children || [];
                d.x0 = d.x === undefined ? width / 2 : d.x;
                d.y0 = d.y === undefined ? height / 2 : d.y;
            }, this.options.data, true);
            tree.size([ width, height ]).children(getChildren);
            nodes = tree(this.options.data);
            selection = this.group.selectAll(".line").data(tree.links(nodes), function(d) {
                return id(d.target);
            });
            enter = selection.enter();
            exit = selection.exit();
            selection.each(function(d) {
                d.target._treeOld = false;
                d.target._treeNew = false;
            });
            exit.each(function(d) {
                d.target._treeOld = true;
            });
            if (this.options.lineStyle === "curved") {
                line = d3.svg.diagonal();
            } else if (this.options.lineStyle === "axisAligned") {
                line = function(obj) {
                    var l = d3.svg.line().interpolate("step-before").x(tangelo.accessor({
                        field: "x"
                    })).y(tangelo.accessor({
                        field: "y"
                    }));
                    return l([ obj.source, obj.target ]);
                };
            } else {
                tangelo.fatalError("$.dendrogram()", "illegal option for lineStyle: " + this.options.lineStyle);
            }
            enter.append("path").attr("class", "line tree").each(function(d) {
                d.target._treeNew = true;
            }).attr("d", function(d) {
                var s = findSource(d.target), t = {
                    x: s.x0,
                    y: s.y0
                };
                return line({
                    source: t,
                    target: t
                });
            }).style("stroke-opacity", 1e-6).style("stroke", this.options.lineColor).style("stroke-width", this.options.lineWidth).style("fill", "none");
            exit = this._transition(exit);
            exit.attr("d", function(d) {
                var s = findSink(d.target);
                return line({
                    source: s,
                    target: s
                });
            }).style("stroke-opacity", 1e-6).remove();
            selection = this._transition(selection);
            selection.attr("d", line).style("stroke-opacity", 1).style("stroke", this.options.lineColor).style("stroke-width", this.options.lineWidth);
            rotString = "";
            if (!vert) {
                rotString = "rotate(90)";
            }
            selection = this.group.selectAll(".label").data(nodes, id);
            enter = selection.enter();
            exit = selection.exit();
            enter.append("text").attr("class", "label tree").attr("dy", function(d, i) {
                var pos = that.options.labelPosition(d, i), val;
                if (pos === "above") {
                    val = "-0.8em";
                } else if (pos === "below") {
                    val = "1.35em";
                } else {
                    tangelo.fatalError("$.dendrogram()", "Invalid labelPosition");
                }
                return val;
            }).attr("transform", function(d) {
                var s = findSource(d);
                return "translate(" + s.x0 + "," + s.y0 + ")" + rotString;
            }).attr("text-anchor", "middle").attr("font-size", this.options.labelSize).style("fill-opacity", 1e-6).text(this.options.label);
            exit = this._transition(exit);
            exit.attr("transform", function(d) {
                var s = findSink(d);
                return "translate(" + s.x + "," + s.y + ")" + rotString;
            }).style("fill-opacity", 1e-6).attr("font-size", this.options.labelSize).text(this.options.label).remove();
            selection = this._transition(selection);
            selection.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")" + rotString;
            }).attr("font-size", this.options.labelSize).style("fill-opacity", 1).text(this.options.label);
            selection = this.group.selectAll(".node").data(nodes, id);
            enter = selection.enter();
            exit = selection.exit();
            enter.append("circle").attr("class", "node tree").attr("cx", function(d) {
                return findSource(d).x0;
            }).attr("cy", function(d) {
                return findSource(d).y0;
            }).attr("r", this.options.nodeSize).style("fill", this.options.nodeColor).style("fill-opacity", 1e-6).style("stroke-opacity", 1e-6).on("click", function(d) {
                that.options.sinkNode = {
                    value: d
                };
                that.options.sourceNode = {
                    value: d
                };
                if (that.options.on.click.apply(this, arguments)) {
                    toggleExpand.apply(this, arguments);
                }
                that._update();
            });
            exit = this._transition(exit);
            exit.attr("cx", function(d) {
                return findSink(d).x;
            }).attr("cy", function(d) {
                return findSink(d).y;
            }).attr("r", this.options.nodeSize).style("fill-opacity", 1e-6).style("stroke-opacity", 1e-6).remove();
            selection.moveToFront();
            selection = this._transition(selection);
            selection.attr("cx", function(d) {
                return d.x;
            }).attr("cy", function(d) {
                return d.y;
            }).attr("r", this.options.nodeSize).style("fill-opacity", 1).style("stroke-opacity", 1).style("fill", this.options.nodeColor);
        }
    });
})(window.tangelo, window.jQuery, window.d3);

(function(tangelo, $, vg) {
    "use strict";
    if (!($ && $.widget && vg)) {
        return;
    }
    tangelo.widget("tangelo.geodots", {
        options: {
            latitude: tangelo.accessor({
                value: 0
            }),
            longitude: tangelo.accessor({
                value: 0
            }),
            size: tangelo.accessor({
                value: 20
            }),
            color: tangelo.accessor({
                value: 0
            }),
            worldGeometry: null,
            data: null
        },
        _create: function() {
            var that = this, vegaspec = tangelo.vegaspec.geovis(that.options.worldGeometry);
            this.options = $.extend(true, {}, this._defaults, this.options);
            vg.parse.spec(vegaspec, function(chart) {
                that.vis = chart;
                that._update();
            });
        },
        _update: function() {
            var that = this;
            if (this.options.data) {
                this.options.data.forEach(function(d) {
                    d.latitude = that.options.latitude(d);
                    d.longitude = that.options.longitude(d);
                    d.size = that.options.size(d);
                    d.color = that.options.color(d);
                });
                if (this.vis) {
                    this.vis({
                        el: that.element.get(0),
                        data: {
                            table: that.options.data,
                            links: []
                        }
                    }).update();
                }
            }
        }
    });
})(window.tangelo, window.jQuery, window.vg);

(function(tangelo, $, vg) {
    "use strict";
    if (!($ && $.widget && vg)) {
        return;
    }
    tangelo.widget("tangelo.geonodelink", {
        options: {
            nodeLatitude: tangelo.accessor({
                value: 0
            }),
            nodeLongitude: tangelo.accessor({
                value: 0
            }),
            nodeSize: tangelo.accessor({
                value: 20
            }),
            nodeColor: tangelo.accessor({
                value: 0
            }),
            linkColor: tangelo.accessor({
                value: 0
            }),
            linkSource: tangelo.accessor({
                value: 0
            }),
            linkTarget: tangelo.accessor({
                value: 0
            }),
            data: null
        },
        _create: function() {
            var that = this, vegaspec = tangelo.vegaspec.geovis(that.options.worldGeometry);
            vg.parse.spec(vegaspec, function(chart) {
                that.vis = chart;
                that._update();
            });
        },
        _update: function() {
            var that = this;
            $.each(this.options.data.nodes, function(i, v) {
                var d = that.options.data.nodes[i];
                d.latitude = that.options.nodeLatitude(d);
                d.longitude = that.options.nodeLongitude(d);
                d.size = that.options.nodeSize(d);
                d.color = that.options.nodeColor(d);
            });
            $.each(this.options.data.links, function(i, v) {
                var d = that.options.data.links[i];
                d.color = that.options.linkColor(d);
                d.source = that.options.linkSource(d);
                d.target = that.options.linkTarget(d);
            });
            if (that.vis) {
                that.vis({
                    el: this.element.get(0),
                    data: {
                        table: that.options.data.nodes,
                        links: that.options.data.links
                    }
                }).update();
            }
        }
    });
})(window.tangelo, window.jQuery, window.vg);

(function($, d3, tangelo) {
    "use strict";
    if (!($ && d3)) {
        return;
    }
    $.fn.girderBrowser = function(cfg) {
        var me, menu, item, caret, label, api, selectItem, selectFolder, selectSearchResult, findItems, findFolders, search, input, wait;
        cfg = cfg || {};
        caret = cfg.caret === undefined ? "true" : cfg.caret;
        label = (cfg.label || "") + (caret ? "<b class=caret></b>" : "");
        api = cfg.api || "/girder/api/v1";
        selectItem = cfg.selectItem || $.noop;
        selectFolder = cfg.selectFolder || $.noop;
        selectSearchResult = cfg.selectSearchResult || $.noop;
        search = cfg.search;
        findItems = function(el, folderId) {
            var data;
            wait = el.append("li").append("a").text("Loading items...");
            data = {
                folderId: folderId
            };
            d3.json(api + "/item?" + $.param(data), function(error, items) {
                var anchor;
                if (error) {
                    console.warn(error);
                    tangelo.fatalError("girderBrowser", "could not retrieve items");
                }
                wait.remove();
                if (items.length > 0) {
                    $.each(items, function(i, item) {
                        anchor = el.append("li").append("a").attr("href", "#").text(item.name + " (" + item.size + "B)");
                        anchor.on("click", function() {
                            selectItem(item, api);
                        });
                    });
                }
            });
        };
        findFolders = function(el, parentType, parentId) {
            var data;
            el.append("li").append("a").text("Loading folders...");
            data = {
                parentType: parentType,
                parentId: parentId
            };
            d3.json(api + "/folder?" + $.param(data), function(error, folders) {
                var elem;
                if (error) {
                    console.warn(error);
                    tangelo.fatalError("girderBrowser", "could not retrieve folders");
                }
                $(el.node()).empty();
                $.each(folders, function(i, f) {
                    elem = el.append("li").classed("dropdown-submenu", true);
                    elem.append("a").attr("href", "#").text(f.name).on("click", function() {
                        selectFolder(f, api);
                    });
                    elem = elem.append("ul").classed("dropdown-menu", true);
                    findFolders(elem, "folder", f._id);
                    elem.append("li").classed("divider", true);
                    findItems(elem, f._id);
                });
            });
        };
        $(this[0]).empty();
        me = d3.select(this[0]);
        me.classed("dropdown", true);
        me.append("a").attr("href", "#").attr("role", "button").classed("dropdown-toggle", true).attr("data-toggle", "dropdown").html(label);
        menu = me.append("ul").classed("dropdown-menu", true);
        if (search) {
            input = menu.append("li").append("input").attr("type", "text").attr("placeholder", "Quick search...");
            input.on("click", function() {
                d3.event.stopPropagation();
            }).on("keyup", function() {
                var xhr = null, delayHandle = null, doSearch;
                doSearch = function(text, menu) {
                    var data;
                    if (xhr) {
                        xhr.abort();
                    }
                    if (text.length === 0) {
                        menu.selectAll(".search-result").remove();
                        return;
                    }
                    data = {
                        q: text,
                        types: JSON.stringify([ "item" ])
                    };
                    xhr = d3.json([ api, "resource", "search" ].join("/") + "?" + $.param(data), function(error, results) {
                        xhr = null;
                        if (error) {
                            console.warn(error);
                            tangelo.fatalError("girderBrowser", "could not perform search");
                        }
                        menu.selectAll(".search-result").remove();
                        if (results.item.length === 0) {
                            menu.append("li").classed("search-result", true).html("<em>No search results.</em>");
                        }
                        menu.selectAll(".search-result").data(results.item).enter().append("li").classed("search-result", true).append("a").attr("href", "#").text(function(d) {
                            return d.name;
                        }).on("click", function(d) {
                            selectSearchResult(d, api);
                        });
                    });
                };
                return function() {
                    var text = d3.select(this).property("value");
                    window.clearTimeout(delayHandle);
                    delayHandle = window.setTimeout(doSearch, 200, text, menu);
                };
            }());
        }
        wait = menu.append("li").append("a").text("Loading...");
        d3.json(api + "/user", function(error, users) {
            if (error) {
                console.warn(error);
                tangelo.fatalError("girderBrowser", "could not retrieve users");
            }
            wait.remove();
            if (users.length > 0) {
                menu.append("li").html("<strong>Users</strong>");
                $.each(users, function(i, user) {
                    item = menu.append("li").classed("dropdown-submenu", true);
                    item.append("a").attr("href", "#").text([ user.firstName, user.lastName ].join(" "));
                    item = item.append("ul").classed("dropdown-menu", true);
                    findFolders(item, "user", user._id);
                });
            }
            d3.json(api + "/collection", function(error, collections) {
                if (error) {
                    console.warn(error);
                    tangelo.fatalError("girderBrowser", "could not retrieve collections");
                }
                if (collections.length > 0) {
                    menu.append("li").html("<strong>Collections</strong>");
                    $.each(collections, function(i, collection) {
                        item = menu.append("li").classed("dropdown-submenu", true);
                        item.append("a").attr("href", "#").text(collection.name);
                        item = item.append("ul").classed("dropdown-menu", true);
                        findFolders(item, "collection", collection._id);
                    });
                }
            });
        });
        $(me.select("a").node()).dropdown();
    };
})(window.jQuery, window.d3, window.tangelo);

(function(tangelo, google, d3, $) {
    "use strict";
    if (!(google && $ && $.widget && d3)) {
        return;
    }
    tangelo.widget("tangelo.mapdots", {
        options: {
            hoverContent: tangelo.accessor({
                value: ""
            }),
            size: tangelo.accessor({
                value: 1
            }),
            color: tangelo.accessor({
                value: ""
            }),
            latitude: tangelo.accessor({
                value: 0
            }),
            longitude: tangelo.accessor({
                value: 0
            }),
            opacity: tangelo.accessor({
                value: 1
            }),
            data: null
        },
        _create: function() {
            var el = this.element.get(0), that = this;
            this.map = new google.maps.Map(el, {
                zoom: 2,
                center: new google.maps.LatLng(0, 0),
                mapTypeId: google.maps.MapTypeId.TERRAIN
            });
            d3.select(el).style("width", "100%").style("height", "100%");
            $(el).resize(function() {
                google.maps.event.trigger(that.map, "resize");
            });
            this.overlay = new google.maps.OverlayView();
            this.overlay.onAdd = function() {
                that.layer = d3.select(this.getPanes().overlayMouseTarget).append("div").style("position", "absolute");
                that.colorScale = d3.scale.category10();
                this.draw = function() {
                    var marker, ptransform = that.transform(this.getProjection());
                    marker = that.layer.selectAll("svg").data(that.options.data).each(ptransform);
                    marker.enter().append("svg").each(ptransform).attr("class", "marker").style("cursor", "crosshair").style("position", "absolute").append("circle");
                    d3.selectAll("svg > circle").data(that.options.data).attr("r", function(d) {
                        return that.sizeScale(that.options.size(d));
                    }).attr("cx", function(d) {
                        return that.sizeScale(that.options.size(d)) + 2;
                    }).attr("cy", function(d) {
                        return that.sizeScale(that.options.size(d)) + 2;
                    }).style("fill", function(d) {
                        return that.colorScale(that.options.color(d));
                    }).style("opacity", function(d) {
                        return that.options.opacity(d);
                    }).each(function(d) {
                        var cfg, content = that.options.hoverContent(d);
                        if (!content) {
                            return;
                        }
                        cfg = {
                            html: true,
                            container: "body",
                            placement: "top",
                            trigger: "hover",
                            content: that.options.hoverContent(d),
                            delay: {
                                show: 0,
                                hide: 0
                            }
                        };
                        $(this).popover(cfg);
                    });
                    marker.exit().remove();
                };
                this.onRemove = $.noop;
            };
            this.overlay.setMap(this.map);
        },
        _update: function() {
            var that = this;
            this.sizeScale = d3.scale.sqrt().domain(d3.extent(this.options.data, this.options.size)).range([ 5, 15 ]);
            this.transform = function(projection) {
                return function(d) {
                    var s = that.sizeScale(that.options.size(d));
                    d = new google.maps.LatLng(that.options.latitude(d), that.options.longitude(d));
                    d = projection.fromLatLngToDivPixel(d);
                    return d3.select(this).style("left", d.x - s - 2 + "px").style("top", d.y - s - 2 + "px").style("width", 2 * s + 4 + "px").style("height", 2 * s + 4 + "px");
                };
            };
            if (this.overlay.draw) {
                this.overlay.draw();
            }
        }
    });
})(window.tangelo, window.google, window.d3, window.jQuery);

(function(tangelo, $, d3) {
    "use strict";
    if (!($ && $.widget && d3)) {
        return;
    }
    tangelo.widget("tangelo.nodelink", {
        options: {
            nodeCharge: tangelo.accessor({
                value: -130
            }),
            nodeColor: tangelo.accessor({
                value: "steelblue"
            }),
            nodeSize: tangelo.accessor({
                value: 10
            }),
            nodeLabel: tangelo.accessor({
                value: ""
            }),
            nodeOpacity: tangelo.accessor({
                value: 1
            }),
            nodeId: tangelo.accessor({
                index: true
            }),
            linkSource: tangelo.accessor({
                field: "source"
            }),
            linkTarget: tangelo.accessor({
                field: "target"
            }),
            linkDistance: tangelo.accessor({
                value: 30
            }),
            linkOpacity: tangelo.accessor({
                value: .2
            }),
            nodeX: tangelo.accessor(),
            nodeY: tangelo.accessor(),
            width: 1e3,
            height: 1e3,
            dynamicLabels: false,
            data: null
        },
        _create: function() {
            this.colorScale = d3.scale.category10();
            this.force = d3.layout.force();
            this.svg = d3.select(this.element.get(0)).append("svg");
        },
        _update: function() {
            var that = this, nodeIdMap = {};
            if (this.options.nodeX && !this.options.nodeX.undefined) {
                this.xScale = d3.scale.linear().domain(d3.extent(this.options.data.nodes, this.options.nodeX)).range([ 50, this.options.width - 100 ]);
            }
            if (this.options.nodeY && !this.options.nodeY.undefined) {
                this.yScale = d3.scale.linear().domain(d3.extent(this.options.data.nodes, this.options.nodeY)).range([ this.options.height - 100, 50 ]);
            }
            this.force.linkDistance(this.options.linkDistance).charge(this.options.nodeCharge).size([ this.options.width, this.options.height ]);
            this.options.data.nodes.forEach(function(d, i) {
                nodeIdMap[that.options.nodeId(d, i)] = d;
                d.degree = 0;
                d.outgoing = [];
                d.incoming = [];
            });
            this.options.data.links.forEach(function(d, i) {
                d.source = nodeIdMap[that.options.linkSource(d, i)];
                d.target = nodeIdMap[that.options.linkTarget(d, i)];
                d.source.degree += 1;
                d.target.degree += 1;
                d.source.outgoing.push(d.target);
                d.target.incoming.push(d.source);
            });
            this.options.data.nodes.sort(function(a, b) {
                return d3.descending(a.degree, b.degree);
            });
            this.sizeScale = d3.scale.sqrt().domain(d3.extent(this.options.data.nodes, that.options.nodeSize)).range([ 5, 15 ]);
            this.force.size([ this.options.width, this.options.height ]).nodes(this.options.data.nodes).links(this.options.data.links).start();
            this.link = this.svg.selectAll(".link").data(this.options.data.links);
            this.link.enter().append("line").classed("link", true).style("opacity", this.options.linkOpacity).style("stroke", "black").style("stroke-width", 1);
            this.node = this.svg.selectAll(".node").data(this.options.data.nodes);
            this.node.enter().append("circle").classed("node", true).call(this.force.drag).append("title");
            this.node.attr("r", function(d, i) {
                return that.sizeScale(that.options.nodeSize(d, i));
            }).style("fill", function(d, i) {
                return that.colorScale(that.options.nodeColor(d, i));
            }).style("opacity", this.options.nodeOpacity);
            this.node.selectAll("title").text(this.options.nodeLabel);
            if (!that.options.dynamicLabels) {
                this.label = this.svg.selectAll("text").data(this.options.data.nodes);
                this.label.enter().append("text").text(this.options.nodeLabel);
            }
            this.force.on("tick", function() {
                that._tick(that);
            });
            this.force.resume();
        },
        _tick: function() {
            var that = this, nodeLabels;
            if (this.options.nodeX && !that.options.nodeX.undefined) {
                that.options.data.nodes.forEach(function(d, i) {
                    d.x = that.xScale(that.options.nodeX(d, i));
                });
            }
            if (this.options.nodeY && !that.options.nodeY.undefined) {
                that.options.data.nodes.forEach(function(d, i) {
                    d.y = that.yScale(that.options.nodeY(d, i));
                });
            }
            if (that.options.dynamicLabels) {
                nodeLabels = that._nodeLabels();
                that.svg.selectAll("text").remove();
                that.svg.selectAll("text").data(nodeLabels).enter().append("text").attr("x", function(d) {
                    return d.x;
                }).attr("y", function(d) {
                    return d.y;
                }).style("font-size", function(d) {
                    return d.count + 8;
                }).text(function(d) {
                    return d.label;
                });
            } else {
                that.label.attr("x", function(d) {
                    return d.x;
                }).attr("y", function(d) {
                    return d.y;
                });
            }
            that.link.attr("x1", function(d) {
                return d.source.x;
            }).attr("y1", function(d) {
                return d.source.y;
            }).attr("x2", function(d) {
                return d.target.x;
            }).attr("y2", function(d) {
                return d.target.y;
            });
            that.node.attr("cx", function(d) {
                return d.x;
            }).attr("cy", function(d) {
                return d.y;
            });
        },
        _nodeLabels: function() {
            var that = this, nodeLabels = [];
            that.options.data.nodes.forEach(function(d) {
                d.visited = false;
            });
            that.options.data.nodes.forEach(function(d, i) {
                var count = 0, labels = [], label;
                function visit(dd) {
                    if (dd.visited) {
                        return;
                    }
                    if (Math.abs(dd.x - d.x) < 50 && Math.abs(dd.y - d.y) < 50) {
                        count += 1;
                        labels.push(that.options.nodeLabel(dd, i));
                        dd.visited = true;
                        dd.incoming.forEach(visit);
                        dd.outgoing.forEach(visit);
                    }
                }
                visit(d);
                if (count > 1) {
                    label = that._reduceLabels(labels);
                    nodeLabels.push({
                        count: count,
                        label: label,
                        x: d.x,
                        y: d.y
                    });
                }
            });
            return nodeLabels;
        },
        _reduceLabels: function(labels) {
            var label = "", prefixTree = {}, word, maxCount, maxWord;
            labels.forEach(function(d) {
                var words, subtree = prefixTree;
                words = d.split(" ");
                while (words.length > 0) {
                    if (!subtree[words[0]]) {
                        subtree[words[0]] = {
                            count: 0,
                            next: {}
                        };
                    }
                    subtree[words[0]].count += 1;
                    subtree = subtree[words[0]].next;
                    words = words.slice(1);
                }
            });
            while (true) {
                maxCount = 0;
                maxWord = 0;
                for (word in prefixTree) {
                    if (prefixTree.hasOwnProperty(word)) {
                        if (prefixTree[word].count > maxCount) {
                            maxCount = prefixTree[word].count;
                            maxWord = word;
                        }
                    }
                }
                if (maxCount < 2) {
                    break;
                }
                label += " " + maxWord;
                prefixTree = prefixTree[maxWord].next;
            }
            return label;
        }
    });
})(window.tangelo, window.jQuery, window.d3);

(function(tangelo, d3, $) {
    "use strict";
    function CorrelationSubPlot(options) {
        options = options || {};
        var that = this, node = options.node, svg = d3.select(options.node).append("g"), rect = svg.append("rect").attr("class", "axis").attr("x", 0).attr("y", 0).style("fill", "none");
        this.x = options.x;
        this.y = options.y;
        this.width = options.width;
        this.height = options.height;
        this.data = options.data || [];
        this.idx = options.idx || undefined;
        this.radius = options.radius || "3pt";
        this.color = options.color || undefined;
        this.draw = function() {
            if (!(that.x && that.y)) {
                throw "x and y accessors are not set";
            }
            var padding = options.padding || 7.5, width = Math.max((that.width || $(node).width()) - 2 * padding, 0), height = Math.max((that.height || $(node).height()) - 2 * padding, 0), xAx = d3.scale.linear().range([ 0, width ]).domain([ 0, 1 ]), yAx = d3.scale.linear().range([ height, 0 ]).domain([ 0, 1 ]), opacity = options.opacity || 1, duration = options.duration || 0, selection;
            svg.attr("transform", "translate(" + padding + "," + padding + ")");
            rect.attr("width", width).attr("height", height);
            selection = svg.selectAll(".point").data(that.data, that.idx);
            selection.enter().append("circle").attr("class", "point").attr("cx", function(d) {
                return xAx(that.x(d));
            }).attr("cy", function(d) {
                return yAx(that.y(d));
            }).attr("r", that.radius).style({
                "fill-opacity": 0,
                "stroke-opacity": 0
            });
            selection.exit().remove();
            if (duration) {
                selection = selection.transition().duration(duration);
            }
            if (that.color) {
                selection.style("fill", that.color);
            }
            selection.attr("cx", function(d) {
                return xAx(that.x(d));
            }).attr("cy", function(d) {
                return yAx(that.y(d));
            }).attr("r", that.radius).style({
                "fill-opacity": opacity,
                "stroke-opacity": opacity
            });
            return this;
        };
    }
    function CorrelationPlotter(options) {
        options = options || {};
        var that = this, node = options.node, svgC = d3.select(node).append("svg").attr("class", "correlationPlot"), svg = svgC.append("g");
        this.variables = options.variables || [];
        this.data = options.data || [];
        this.width = options.width;
        this.height = options.height;
        this.plots = {};
        this.draw = function() {
            if (!that.variables.length) {
                return;
            }
            var full = options.full, padding = options.padding || 10, offset = 15, oWidth = that.width || $(node).width(), oHeight = that.height || $(node).height(), rWidth = Math.min(oWidth, oHeight), width = rWidth - 2 * padding - offset, height = rWidth - 2 * padding - offset, eWidth = (oWidth - rWidth) / 2, eHeight = (oHeight - rWidth) / 2, nvars = that.variables.length, nblocks = nvars - (full ? 0 : 1), sWidth = width / nblocks, sHeight = height / nblocks, plotSelection, table = [], xlabels, ylabels;
            svgC.attr("width", oWidth).attr("height", oHeight);
            svg.attr("transform", "translate(" + (padding + eWidth + offset) + "," + (padding + eHeight + offset) + ")");
            that.variables.forEach(function(d, i) {
                that.variables.forEach(function(e, j) {
                    table.push({
                        x: e,
                        y: d,
                        id: e.label + "-" + d.label
                    });
                });
            });
            xlabels = svg.selectAll(".xlabel").data(that.variables.slice(0, nblocks));
            xlabels.enter().append("text").attr("class", "xlabel").attr("text-anchor", "middle");
            xlabels.exit().remove();
            xlabels.attr("x", function(d, i) {
                return (i + .5) * sWidth;
            }).attr("y", -offset / 2).text(function(d) {
                return d.label;
            });
            ylabels = svg.selectAll(".ylabel").data(full ? that.variables : that.variables.slice(1));
            ylabels.enter().append("text").attr("class", "ylabel").attr("x", 0).attr("y", 0).attr("text-anchor", "middle");
            ylabels.exit().remove();
            ylabels.attr("transform", function(d, i) {
                var cx = -offset / 2, cy = (nblocks - i - .5) * sWidth;
                return "translate(" + cx + "," + cy + ") rotate(-90)";
            }).text(function(d) {
                return d.label;
            });
            plotSelection = svg.selectAll(".subPlot").data(table, function(d) {
                return d.id;
            });
            plotSelection.enter().append("g").attr("class", "subPlot").each(function(d, i) {
                var x = i % nvars, y = nvars - 1 - Math.floor(i / nvars);
                if (full || x + y < nvars - 1) {
                    that.plots[d.id] = new CorrelationSubPlot({
                        width: sWidth,
                        height: sHeight,
                        node: this,
                        x: d.x,
                        y: d.y,
                        color: options.color
                    });
                } else {
                    that.plots[d.id] = {
                        draw: function() {
                            return null;
                        }
                    };
                }
            });
            plotSelection.exit().remove();
            plotSelection.attr("transform", function(d, i) {
                var x = i % nvars, y = nvars - 1 - Math.floor(i / nvars);
                return "translate(" + x * sWidth + "," + y * sHeight + ")";
            });
            plotSelection.each(function(d) {
                var plot = that.plots[d.id];
                plot.width = sWidth;
                plot.height = sHeight;
                plot.data = that.data;
                plot.draw();
            });
        };
    }
    if (!$ || !$.widget) {
        return;
    }
    tangelo.widget("tangelo.correlationPlot", {
        options: {
            variables: [],
            data: [],
            padding: 10,
            color: tangelo.accessor({
                value: "steelblue"
            }),
            full: false,
            width: null,
            height: null
        },
        _create: function() {
            this.obj = new CorrelationPlotter($.extend({
                node: this.element.get(0)
            }, this.options));
            this.element.on("draw", this.obj.draw);
        },
        _update: function() {
            $.extend(this.obj, this.options);
            this.obj.draw();
        },
        variables: function(v) {
            this.obj.variables = v;
        },
        data: function(d) {
            this.obj.data = d;
        }
    });
})(window.tangelo, window.d3, window.jQuery);

(function(tangelo, $, d3) {
    "use strict";
    if (!($ && $.widget && d3)) {
        return;
    }
    function applyTransition(s, t) {
        if (t) {
            s = s.transition(t);
        }
        return s;
    }
    tangelo.widget("tangelo.timeline", {
        options: {
            data: [],
            x: tangelo.accessor({
                field: "time"
            }),
            y: tangelo.accessor({
                field: "value"
            }),
            margin: {
                top: 10,
                bottom: 30,
                left: 30,
                right: 30
            },
            transition: 0,
            width: null,
            height: null,
            xTicks: 10,
            yTicks: 10
        },
        _create: function() {
            this.svg = d3.select(this.element.get(0)).append("svg").attr("class", "timeline");
            this.main = this.svg.append("g");
            this.plot = this.main.append("g").attr("class", "plot");
            this.xaxis = this.main.append("g").style("font-family", "sans-serif").style("font-size", "11px");
            this.yaxis = this.main.append("g").style("font-family", "sans-serif").style("font-size", "11px");
            this.path = this.plot.append("path").style("fill", "none").style("stroke", "steelblue").style("stroke-width", "1.5px");
            this._x = null;
            this._y = null;
            $(window).resize(this._update.bind(this));
        },
        _update: function() {
            var that = this, axisPadding = 15, margin = this.options.margin, xAcc = tangelo.accessor(this.options.x), yAcc = tangelo.accessor(this.options.y), width = (this.options.width || this.element.width()) - margin.left - margin.right - axisPadding, height = (this.options.height || this.element.height()) - margin.top - margin.bottom - axisPadding, data = this.options.data, xaxis, yaxis, line;
            this._x = d3.time.scale().domain(d3.extent(data, function(d) {
                return new Date(xAcc(d));
            })).range([ 0, width ]).nice();
            this._y = d3.scale.linear().domain(d3.extent(data, function(d) {
                var val = yAcc(d);
                if (tangelo.isNumber(val) && !isNaN(val)) {
                    return val;
                }
                return undefined;
            })).range([ height, 0 ]).nice();
            xaxis = d3.svg.axis().scale(this._x).orient("bottom");
            xaxis.ticks(this.options.xTicks);
            yaxis = d3.svg.axis().scale(this._y).orient("left");
            yaxis.ticks(this.options.yTicks);
            line = d3.svg.line().x(function(d) {
                return that._x(new Date(xAcc(d)));
            }).y(function(d) {
                return that._y(yAcc(d));
            }).defined(function(d) {
                var val = that._y(yAcc(d));
                return tangelo.isNumber(val) && !isNaN(val);
            });
            this.svg.attr("width", width + margin.left + margin.right + axisPadding).attr("height", height + margin.top + margin.bottom + axisPadding);
            this.main.attr("transform", "translate(" + (margin.left + axisPadding) + "," + margin.top + ")");
            applyTransition(this.xaxis, this.options.transition).attr("transform", "translate(0," + height + ")").call(xaxis);
            applyTransition(this.yaxis, this.options.transition).call(yaxis);
            function styleLine(selection) {
                selection.style("fill", "none").style("stroke", "black").style("stroke-width", "1px").style("shape-rendering", "crispEdges");
            }
            this.xaxis.selectAll("path").call(styleLine);
            this.xaxis.selectAll("line").call(styleLine);
            this.yaxis.selectAll("path").call(styleLine);
            this.yaxis.selectAll("line").call(styleLine);
            applyTransition(this.path, this.options.transition).attr("d", line(this.options.data));
        },
        xScale: function() {
            return this._x;
        },
        yScale: function() {
            return this._y;
        }
    });
})(window.tangelo, window.jQuery, window.d3);

(function(tangelo, geo, d3, $) {
    "use strict";
    if (!($ && $.widget && d3 && geo)) {
        return;
    }
    tangelo.widget("tangelo.geojsMap", {
        options: {
            zoom: 3,
            width: null,
            height: null
        },
        latlng2display: function(pt) {
            return this.svgLayer.renderer().worldToDisplay(pt);
        },
        display2latlng: function(pt) {
            return this.svgLayer.renderer().displayToWorld(pt);
        },
        svg: function() {
            return this.svgGroup.node();
        },
        legend: function() {
            throw "Legend layer not yet implemented";
        },
        map: function() {
            return this._map;
        },
        scale: function() {
            return this.svgLayer.renderer().scaleFactor();
        },
        _create: function() {
            var node = this.element.get(0), opts = {
                zoom: this.options.zoom,
                node: node,
                width: this.options.width,
                height: this.options.height
            }, that = this;
            this._map = geo.map(opts);
            this._map.createLayer("osm");
            this.svgLayer = this._map.createLayer("feature", {
                renderer: "d3Renderer"
            });
            this.svgGroup = this.svgLayer.renderer().canvas();
            this._resize();
            $(window).resize(function() {
                that._resize();
            });
            this.svgLayer.on(geo.event.d3Rescale, function(arg) {
                $(node).trigger("rescale", arg.scale);
            });
        },
        _update: $.noop,
        _resize: function() {
            var w = this.options.width || this.element.width(), h = this.options.height || this.element.height();
            if (!this._map) {
                return;
            }
            this._map.resize(0, 0, w, h);
        },
        _setOption: function(key, value) {
            this.options[key] = value;
            if (key === "width" || key === "height") {
                this._resize();
            }
            this._update();
        }
    });
})(window.tangelo, window.geo, window.d3, window.jQuery);

(function(tangelo, $, d3, geo) {
    "use strict";
    if (!($ && $.widget && d3 && geo)) {
        return;
    }
    tangelo.widget("tangelo.geojsdots", $.tangelo.geojsMap, {
        options: {
            latitude: tangelo.accessor({
                value: 0
            }),
            longitude: tangelo.accessor({
                value: 0
            }),
            size: tangelo.accessor({
                value: 20
            }),
            color: tangelo.accessor({
                value: 0
            }),
            data: null
        },
        _create: function() {
            var that = this;
            this.colorScale = d3.scale.category10();
            this._super();
            this.element.on("rescale", function() {
                that._rescale();
            });
        },
        _rescale: function() {
            var that = this, scale;
            if (this.options.data && this.map()) {
                scale = this.scale();
                d3.select(this.svg()).selectAll(".point").data(this.options.data).attr("r", function(d) {
                    return tangelo.accessor(that.options.size)(d) / scale;
                });
            }
        },
        _update: function() {
            var svg = this.svg(), that = this, lat = tangelo.accessor(this.options.latitude), lng = tangelo.accessor(this.options.longitude), pt, selection, enter, exit;
            if (this.options.data && this.map()) {
                this.options.data.forEach(function(d) {
                    pt = geo.latlng(lat(d), lng(d));
                    d._georef = that.latlng2display(pt);
                });
                selection = d3.select(svg).selectAll(".point").data(this.options.data);
                enter = selection.enter();
                exit = selection.exit();
                enter.append("circle").attr("class", "point");
                selection.attr("cx", tangelo.accessor({
                    field: "_georef.x"
                })).attr("cy", tangelo.accessor({
                    field: "_georef.y"
                })).style("fill", function(d) {
                    return that.colorScale(tangelo.accessor(that.options.color)(d));
                });
                exit.remove();
                this._rescale();
            }
        }
    });
})(window.tangelo, window.jQuery, window.d3, window.geo);

window.tangelo.stream = {};

(function(tangelo, $) {
    "use strict";
    tangelo.stream.streams = function(callback) {
        $.ajax({
            url: "/stream",
            dataType: "json",
            error: function(jqxhr) {
                callback(undefined, jqxhr);
            },
            success: function(data) {
                callback(data);
            }
        });
    };
    tangelo.stream.start = function(url, callback) {
        url = tangelo.absoluteUrl(url);
        $.ajax({
            url: url,
            dataType: "json",
            error: function(jqxhr) {
                callback(undefined, jqxhr);
            },
            success: function(data) {
                callback(data.key);
            }
        });
    };
    tangelo.stream.query = function(key, callback) {
        $.ajax({
            url: "/stream/" + key,
            dataType: "json",
            error: function(jqxhr) {
                callback(undefined, undefined, jqxhr);
            },
            success: function(result) {
                if (result.error) {
                    console.warn("[tangelo.stream.query()] error: " + result.error);
                    callback(undefined, undefined, tangelo.error(tangelo.APPLICATION_ERROR, result.error));
                } else {
                    callback(result.data, result.finished);
                }
            }
        });
    };
    tangelo.stream.run = function(key, callback, delay) {
        if (delay === undefined) {
            delay = 100;
        }
        $.ajax({
            url: "/stream/" + key,
            dataType: "json",
            error: function(jqxhr) {
                console.warn("[tangelo.stream.run()] error: ajax call failed; aborting stream run");
                callback(undefined, jqxhr);
            },
            success: function(result) {
                var flag, keepgoing = true;
                if (result.error) {
                    console.warn("[tangelo.stream.run()] error: " + result.error + "; aborting stream run");
                } else if (result.finished) {
                    callback(undefined, true);
                } else {
                    flag = callback(result.data, false);
                    if (flag !== undefined) {
                        if (tangelo.isFunction(flag)) {
                            callback = flag;
                        } else if (tangelo.isBoolean(flag)) {
                            keepgoing = flag;
                        } else if (tangelo.isNumber(flag)) {
                            delay = flag;
                        }
                    }
                    if (keepgoing) {
                        window.setTimeout(tangelo.stream.run, delay, key, callback, delay);
                    }
                }
            }
        });
    };
    tangelo.stream.delete = function(key, callback) {
        $.ajax({
            url: "/stream/" + key,
            dataType: "json",
            type: "DELETE",
            error: function(jqxhr) {
                if (callback) {
                    callback(undefined, jqxhr);
                }
            },
            success: function(result) {
                if (callback) {
                    callback(result);
                }
            }
        });
    };
})(window.tangelo, window.$);

window.tangelo.data = {};

(function(tangelo) {
    "use strict";
    tangelo.data.tree = function(spec) {
        var id = tangelo.accessor(spec.id || {
            value: ""
        }), idChild = tangelo.accessor(spec.idChild || {
            value: ""
        }), children = tangelo.accessor(spec.children), data = spec.data, nodeMap = {}, root;
        if (children.undefined) {
            tangelo.fatalError("tangelo.data.tree()", "A 'children' accessor is required");
        }
        data.forEach(function(d) {
            nodeMap[id(d)] = d;
        });
        data.forEach(function(d) {
            if (children(d)) {
                d.children = [];
                children(d).forEach(function(c) {
                    var child = nodeMap[idChild(c)];
                    child.hasParent = true;
                    d.children.push(child);
                });
            }
        });
        data.forEach(function(d) {
            if (!d.hasParent) {
                root = d;
            }
            delete d.hasParent;
        });
        return root;
    };
})(window.tangelo);

(function(tangelo) {
    "use strict";
    function defaultMetric(xAcc, yAcc) {
        return function(a, b) {
            var ax = xAcc(a), ay = yAcc(a), bx = xAcc(b), by = yAcc(b), x = ax - bx, y = ay - by;
            return Math.sqrt(x * x + y * y);
        };
    }
    function createNewCluster() {
        var c = [];
        c.center = function() {
            return c[0];
        };
        c.id = tangelo.uniqueID();
        c.children = [];
        return c;
    }
    function cluster(spec) {
        var xAcc, yAcc, metric, data, dist, clusters = [], c = [], i, j, added, singlets = [], groups = [];
        spec = spec || {};
        xAcc = spec.x || tangelo.accessor({
            field: "x"
        });
        yAcc = spec.y || tangelo.accessor({
            field: "y"
        });
        metric = spec.metric || defaultMetric(xAcc, yAcc);
        dist = spec.clusterDistance || 20;
        data = spec.data || [];
        if (dist < 0) {
            return {
                singlets: data.slice(),
                clusters: []
            };
        }
        for (i = 0; i < data.length; i += 1) {
            added = false;
            for (j = 0; j < clusters.length; j += 1) {
                c = clusters[j];
                if (metric(data[i], c.center()) < dist) {
                    c.push(data[i]);
                    added = true;
                    break;
                }
            }
            if (!added) {
                c = createNewCluster();
                c.push(data[i]);
                clusters.push(c);
            }
        }
        clusters.forEach(function(d) {
            if (d.length === 1) {
                d[0].cluster = d;
                singlets.push(d[0]);
            } else {
                d.forEach(function(e) {
                    e.cluster = d;
                });
                groups.push(d);
            }
        });
        return {
            singlets: singlets,
            clusters: groups
        };
    }
    tangelo.data.distanceCluster = cluster;
})(window.tangelo);

(function(tangelo) {
    "use strict";
    var kernels = {
        box: function() {
            return function boxKernel() {
                return 1;
            };
        },
        gaussian: function(radius) {
            var sigma = radius / 3, c = 1 / (sigma * Math.sqrt(2 * Math.PI)), s2 = sigma * sigma;
            return function(xi, xj) {
                var x = xi - xj;
                return c * Math.exp(-.5 * x * x / s2);
            };
        }
    };
    tangelo.data.smooth = function(spec) {
        var x = tangelo.accessor(spec.x || {
            field: "x"
        }), y = tangelo.accessor(spec.y || {
            field: "y"
        }), set = spec.set, kernel = spec.kernel || "box", radius = spec.radius !== undefined ? spec.radius : .05, absolute = spec.absolute !== undefined ? spec.absolute : false, sorted = spec.sorted !== undefined ? spec.sorted : true, normalize = spec.normalize !== undefined ? spec.normalize : true, data = spec.data || [], N = data.length, copy, i, iStart, j, xi, xj, yi, yj, w, wSum = [], values = [];
        values.length = N;
        if (N === 0) {
            return [];
        }
        if (!sorted) {
            data.sort(function(a, b) {
                return x(a) - x(b);
            });
        }
        if (!absolute) {
            w = x(data[N - 1]) - x(data[0]);
            if (w < 0) {
                tangelo.fatalError("Unsorted input detected.  Try spec.sorted=false");
            }
            radius = radius * w;
        }
        if (typeof kernel === "string") {
            kernel = kernels[kernel](radius);
            if (!kernel) {
                tangelo.fatalError('Unknown kernel "' + kernel + '"');
            }
        }
        if (radius < 0) {
            data.forEach(function(d, i) {
                values[i] = y(d);
                if (set) {
                    set.call(data, y(d), d, i);
                }
            });
            return values;
        }
        copy = [];
        copy.length = N;
        data.forEach(function(d, i) {
            copy[i] = y(d);
            wSum.push(0);
        });
        iStart = 0;
        for (i = 0; i < N; i += 1) {
            xi = x(data[i]);
            yi = 0;
            for (j = iStart; j < N; j += 1) {
                xj = x(data[j]);
                yj = copy[j];
                if (xj > xi + radius) {
                    break;
                }
                if (xj < xi - radius) {
                    iStart = j + 1;
                } else {
                    w = kernel.call(data, xi, xj, i, j);
                    wSum[j] += w;
                    yi += w * yj;
                }
            }
            values[i] = yi;
        }
        for (i = 0; i < N; i += 1) {
            yi = values[i];
            if (normalize) {
                yi = yi / wSum[i];
                values[i] = yi;
            }
            if (set) {
                set.call(data, yi, data[i], i);
            }
        }
        return values;
    };
})(window.tangelo);

(function(tangelo) {
    "use strict";
    function makeBins(data, value, min, max, nBins) {
        var _min = Number.POSITIVE_INFINITY, _max = Number.NEGATIVE_INFINITY, bins = [], dx, i;
        min = Number(min);
        max = Number(max);
        if (!isFinite(min) || !isFinite(max)) {
            data.forEach(function(d) {
                var v = Number(value(d));
                if (!isFinite(v)) {
                    tangelo.error("Invalid numeric value in data array: " + v.toString());
                } else {
                    if (v < _min) {
                        _min = v;
                    }
                    if (v > _max) {
                        _max = v;
                    }
                }
            });
            if (!isFinite(min)) {
                min = _min;
            }
            if (!isFinite(max)) {
                max = _max;
            }
        }
        if (max === min) {
            min = min - .5;
            max = max + .5;
        }
        dx = (max - min) / nBins;
        for (i = 0; i < nBins; i += 1) {
            bins.push({
                min: min + i * dx,
                max: min + (i + 1) * dx,
                count: 0
            });
        }
        return bins;
    }
    tangelo.data.bin = function(spec) {
        var maxBinValue;
        spec = spec || {};
        spec.data = spec.data || [];
        spec.nBins = spec.nBins || 25;
        spec.value = tangelo.accessor(spec.value || {
            field: "value"
        });
        if (!spec.data.length) {
            return [];
        }
        if (!spec.bins) {
            spec.bins = makeBins(spec.data, spec.value, spec.min, spec.max, spec.nBins);
        }
        maxBinValue = Number.NEGATIVE_INFINITY;
        spec.bins.forEach(function(b) {
            maxBinValue = Math.max(maxBinValue, b.max);
        });
        spec.data.forEach(function(d) {
            var v = Number(spec.value(d));
            if (!isFinite(v)) {
                tangelo.error("Invalid numeric value in data array: " + v.toString());
            }
            spec.bins.forEach(function(b, iBin) {
                if (b.min <= v && (b.max > v || b.max === maxBinValue && b.max === v)) {
                    b.count = (b.count || 0) + 1;
                }
            });
        });
        return spec.bins;
    };
})(window.tangelo);