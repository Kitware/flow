module.exports = function (grunt) {
    grunt.config.merge({
        plugin: {
            flow: {
                source: '<%= pluginDir %>/flow/web_client/js',
                templates: '<%= pluginDir %>/flow/web_client/templates'
            }
        },
        jade: {
            flow: {
                files: [{
                    src: ['<%= plugin.flow.templates %>/*.jade'],
                    dest: '<%= plugin.flow.source %>/templates.js'
                }],
                options: {
                    client: true,
                    compileDebug: false,
                    namespace: 'jade.templates'
                }
            }
        },
        uglify: {
            options: {
                sourceMap: true,
                sourceMapIncludeSources: true,
                mangle: false,
                compress: false,
                beautify: true
            },
            flow: {
                files: [
                    {
                        src: [
                            '<%= plugin.flow.source %>/templates.js',
                            '<%= plugin.flow.source %>/util.js',
                            '<%= plugin.flow.source %>/models/**/*.js',
                            '<%= plugin.flow.source %>/collections/**/*.js',
                            '<%= plugin.flow.source %>/ItemsView.js',
                            '<%= plugin.flow.source %>/SVGView.js',
                            '<%= plugin.flow.source %>/plugins/**/*.js',
                            '<%= plugin.flow.source %>/views/**/*.js',
                            '<%= plugin.flow.source %>/app.js'
                        ],
                        dest: '<%= staticDir %>/built/plugins/flow/app.min.js'
                    },
                    {
                        src: [
                            '<%= plugin.flow.source %>/main.js'
                        ],
                        dest: '<%= staticDir %>/built/plugins/flow/main.min.js'
                    },
                    {
                        src: [
                            // @todo get this through npm or something
                            '<%= plugin.flow.source %>/lib/ace-builds/src-noconflict/ace.js'
                        ],
                        dest: '<%= staticDir %>/built/plugins/flow/ace.min.js'
                    },
                    {
                        src: [
                            '<%= pluginDir %>/flow/node_modules/jquery-browser/lib/jquery.js',
                            '<%= pluginDir %>/flow/node_modules/jqueryui-browser/ui/jquery-ui.js',
                            '<%= pluginDir %>/flow/node_modules/jade/runtime.js',
                            '<%= pluginDir %>/flow/node_modules/underscore/underscore.js',
                            '<%= pluginDir %>/flow/node_modules/backbone/backbone.js',
                            '<%= pluginDir %>/flow/node_modules/jquery-mousewheel/jquery.mousewheel.js',
                            '<%= pluginDir %>/flow/node_modules/proj4/dist/proj4.js',
                            '<%= pluginDir %>/flow/node_modules/gl-matrix/dist/gl-matrix.js',
                            '<%= pluginDir %>/flow/lib/js/d3.js',
                            '<%= pluginDir %>/flow/lib/js/d3.interactiveheatmap.js',
                            '<%= pluginDir %>/flow/lib/js/d3.scatterplotmatrix.js',
                            '<%= pluginDir %>/flow/lib/js/d3.edgebundling.js',
                            '<%= pluginDir %>/flow/node_modules/geojs/dist/built/geo.js',
                            '<%= pluginDir %>/flow/lib/js/bootstrap.js',
                            '<%= pluginDir %>/flow/lib/js/vega-1.3.3.min.js',
                            '<%= pluginDir %>/flow/lib/js/autobahn.min.js',
                            '<%= pluginDir %>/flow/lib/js/vtkweb-all.min.js',
                            '<%= pluginDir %>/flow/lib/js/tangelo.js',
                            '<%= pluginDir %>/flow/lib/js/controlPanel.js'
                        ],
                        dest: '<%= staticDir %>/built/plugins/flow/libs.min.js'
                    }
                ]
            }
        },
        default: {
            'jade:flow': {},
            'uglify:flow': {
                depends: ['jade:flow']
            }
        }
    });
};
