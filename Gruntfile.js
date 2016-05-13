module.exports = function (grunt) {
    grunt.config.merge({
        plugin: {
            flow: {
                stylesheets: '<%= pluginDir %>/flow/web_external/stylesheets',
                tests: '<%= pluginDir %>/flow/web_external/tests',
                source: '<%= pluginDir %>/flow/web_external/js',
                templates: '<%= pluginDir %>/flow/web_external/templates',
                static: '<%= staticDir %>/built/plugins/flow'
            }
        },
        copy: {
            brands: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: '<%= pluginDir %>/flow/web_external/img/*',
                    dest: '<%= staticDir %>/img/'
                }]
            },
            extras: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: '<%= pluginDir %>/flow/web_external/js/extras/*',
                    dest: '<%= staticDir %>/built/plugins/flow/extras/'
                }]
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
        concat: {
            options: {
                stripBanners: {
                    block: true,
                    line: true
                }
            },
            flow: {
                files: {
                    '<%= staticDir %>/built/plugins/flow/flow.ext.min.css': [
                        '<%= pluginDir %>/flow/node_modules/select2/dist/css/select2.min.css',
                        '<%= pluginDir %>/flow/node_modules/select2-bootstrap-css/select2-bootstrap.min.css',
                        '<%= plugin.flow.stylesheets %>/d3.dependencyedgebundling.css',
                        '<%= plugin.flow.stylesheets %>/d3.edgebundling.css'
                    ]
                }
            }
        },
        stylus: {
            flow: {
                files: [
                    {
                        src: ['<%= plugin.flow.stylesheets %>/index.styl'],
                        dest: '<%= staticDir %>/built/plugins/flow/flow.min.css'
                    }
                ]
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
                            '<%= plugin.flow.source %>/lib/ace-builds/src-noconflict/ace.js',
                            '<%= plugin.flow.source %>/lib/ace-builds/src-noconflict/*.js'
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
                            '<%= pluginDir %>/flow/node_modules/select2/dist/js/select2.min.js',
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
                    },
                    {
                        src: [
                            '<%= plugin.flow.tests %>/lib/jasmine-1.3.1/jasmine.js',
                            '<%= pluginDir %>/flow/node_modules/blanket/dist/jasmine/blanket_jasmine.js',
                            '<%= plugin.flow.tests %>/lib/jasmine-1.3.1/ConsoleReporter.js',
                            '<%= plugin.flow.tests %>/lib/blob/Blob.js',
                            '<%= plugin.flow.tests %>/testUtils.js'
                        ],
                        dest: '<%= staticDir %>/built/plugins/flow/testing.js'
                    }
                ]
            }
        },
        default: {
            'jade:flow': {},
            'stylus:flow': {},
            'concat:flow': {},
            'copy:brands': {},
            'copy:extras': {},
            'uglify:flow': {
                depends: ['jade:flow']
            }
        }
    });

    grunt.registerTask('test-env-html:flow', 'Build the phantom test html page for Flow.', function () {
        var fs = require('fs'),
            jade = require('jade'),
            brand = grunt.option('brand') || 'Flow',
            buffer = fs.readFileSync(grunt.config.get('plugin.flow.tests') + '/testEnvFlow.jadehtml'),
            globs = grunt.config('uglify.flow.files')[0].src, // @todo rearranging list will cause this to fail
            inputs = [],
            fn;

        globs.forEach(function (glob) {
            var files = grunt.file.expand(glob);
            files.forEach(function (file) {
                inputs.push('/plugins/' + file.split('/').slice(1).join('/'));
            });
        });

        fn = jade.compile(buffer, {
            client: false,
            pretty: true
        });
        fs.writeFileSync(grunt.config.get('plugin.flow.static') + '/testEnvFlow.html', fn({
            brand: brand,
            stylesheets: [
                '/' + grunt.config('plugin.flow.tests') + '/lib/jasmine-1.3.1/jasmine.css',
                // 'lib/css/d3.dependencyedgebundling.css',
                // 'lib/css/d3.edgebundling.css', @todo
                '/clients/web/static/lib/bootstrap/css/bootstrap.min.css',
                '/clients/web/static/built/girder.app.min.css',
                '/' + grunt.config('staticDir') + '/built/plugins/flow/flow.min.css'
            ],
            scripts: [
                '/' + grunt.config('staticDir') + '/built/plugins/flow/testing.js',
                '/' + grunt.config('staticDir') + '/built/plugins/flow/libs.min.js',
                '/' + grunt.config('staticDir') + '/built/plugins/flow/ace.min.js',
                '/clients/web/static/built/girder.app.min.js'
            ],
            blanketScripts: inputs
        }));
    });

    grunt.config.merge({
        default: {
            'test-env-html:flow': {
                depends: ['uglify:flow']
            }
        }
    });
};
