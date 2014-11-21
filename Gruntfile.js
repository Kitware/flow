/**
 * Copyright 2014 Kitware Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = function (grunt) {
    var fs = require('fs'),
        jade = require('jade'),
        path = require('path'),
        defaultTasks = ['stylus', 'build-js'],
        environment;

    require('colors');

    // Project configuration.
    grunt.config.init({
        pkg: grunt.file.readJSON('package.json'),

        jade: {
            options: {
                client: true,
                compileDebug: false,
                namespace: 'jade.templates',
                processName: function (filename) {
                    return path.basename(filename, '.jade');
                }
            },
            core: {
                files: {
                    'app/templates.js': [
                        'app/src/templates/**/*.jade'
                    ]
                }
            }
        },

        stylus: {
            core: {
                files: {
                    'app/app.min.css': [
                        'app/src/stylesheets/index.styl'
                    ],
                    'app/workflows/app.min.css': [
                        'app/src/stylesheets/workflowsApp.styl'
                    ]
                }
            }
        },

        shell: {
            sphinx: {
                command: [
                    'cd docs',
                    'make html'
                ].join('&&'),
                options: {
                    stdout: true
                }
            }
        },

        uglify: {
            options: {
                sourceMap: true,
                sourceMapIncludeSources: true,
                //report: 'min',
                mangle: false,
                compress: false,
                beautify: true
                //beautify: {
                //   ascii_only: true
                //}
            },
            app: {
                files: {
                    'app/app.min.js': [
                        'app/templates.js',
                        'app/src/util.js',
                        'app/src/workflow.js',
                        'app/src/collections/**/*.js',
                        'app/src/ItemsView.js',
                        'app/src/plugins/**/*.js',
                        'app/src/views/**/*.js',
                        'app/src/app.js'
                    ],
                    'app/main.min.js': [
                        'app/src/main.js'
                    ]
                }
            },
            workflows: {
                files: {
                    'app/workflows/main.min.js': [
                        'app/src/workflowsMain.js'
                    ]
                }
            },
            libs: {
                files: {
                    'app/libs.min.js': [
                        'node_modules/jquery-browser/lib/jquery.js',
                        'node_modules/jqueryui-browser/ui/jquery-ui.js',
                        'node_modules/jade/runtime.js',
                        'node_modules/underscore/underscore.js',
                        'node_modules/backbone/backbone.js',
                        'lib/js/d3.js',
                        'lib/js/bootstrap.js',
                        'lib/js/vega-1.3.3.min.js',
                        'lib/js/autobahn.min.js',
                        'lib/js/vtkweb-all.min.js',
                        'lib/js/tangelo.js'
                    ],
                    'app/testing.min.js': [
                        'test/lib/jasmine-1.3.1/jasmine.js',
                        'node_modules/blanket/dist/jasmine/blanket_jasmine.js',
                        'test/lib/jasmine-1.3.1/ConsoleReporter.js',
                        'test/lib/blob/Blob.js',
                        'test/testUtils.js'
                    ]
                }
            }
        },

        watch: {
            stylus: {
                files: ['app/src/stylesheets/**/*.styl'],
                tasks: ['stylus'],
                options: {failOnError: false}
            },
            js_core: {
                files: ['app/src/**/*.js'],
                tasks: ['build-js'],
                options: {failOnError: false}
            },
            jade: {
                files: ['app/src/templates/**/*.jade'],
                tasks: ['build-js'],
                options: {failOnError: false}
            },
            jade_index: {
                files: ['app/src/templates/index.jadehtml'],
                tasks: ['jade-index'],
                options: {failOnError: false}
            },
            workflows_index: {
                files: ['app/src/templates/workflows.jadehtml'],
                tasks: ['workflows-index'],
                options: {failOnError: false}
            },
            sphinx: {
                files: ['docs/*.rst'],
                tasks: ['docs'],
                options: {failOnError: false}
            }
        }
    });

    // Pass a "--env=<value>" argument to grunt. Default value is "dev".
    environment = grunt.option('env') || 'dev';

    if (['dev', 'prod'].indexOf(environment) === -1) {
        grunt.fatal('The "env" argument must be either "dev" or "prod".');
    }

    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('jade-index', 'Build index.html using jade', function () {
        var jade = require('jade'),
            buffer = fs.readFileSync('app/src/templates/index.jadehtml'),
            fn = jade.compile(buffer, {
                client: false,
                pretty: true
            }),
            html = fn({
                stylesheets: [
                    'lib/bootstrap/css/bootstrap.min.css',
                    'app.min.css'
                ],
                scripts: [
                    'libs.min.js',
                    'lib/ace-builds/src-noconflict/ace.js',
                    '/girder/static/built/app.min.js',
                    'app.min.js',
                    'main.min.js'
                ]
            });
        fs.writeFileSync('app/index.html', html);
        console.log('Built index.html.');
    });

    grunt.registerTask('workflows-index', 'Build workflows/index.html using jade', function () {
        var jade = require('jade'),
            buffer = fs.readFileSync('app/src/templates/workflows.jadehtml'),
            fn = jade.compile(buffer, {
                client: false,
                pretty: true
            }),
            html = fn({
                stylesheets: [
                    '../lib/bootstrap/css/bootstrap.min.css',
                    '../lib/material/css/ripples.min.css',
                    '../lib/material/css/material-wfont.min.css',
                    'app.min.css'
                ],
                scripts: [
                    '../libs.min.js',
                    '/girder/static/built/app.min.js',
                    '../lib/material/js/ripples.min.js',
                    '../lib/material/js/material.min.js',
                    '../app.min.js',
                    'main.min.js'
                ]
            });
        fs.writeFileSync('app/workflows/index.html', html);
        console.log('Built workflows/index.html.');
    });

    grunt.registerTask('test-env-html', 'Build the phantom test html page.', function () {
        var buffer = fs.readFileSync('test/testEnv.jadehtml'),
            globs = grunt.config('uglify.app.files')['app/app.min.js'],
            inputs = [],
            fn;

        globs.forEach(function (glob) {
            var files = grunt.file.expand(glob);
            files.forEach(function (file) {
                inputs.push('/' + file.split('/').slice(1).join('/'));
            });
        });

        fn = jade.compile(buffer, {
            client: false,
            pretty: true
        });
        fs.writeFileSync('app/testEnv.html', fn({
            stylesheets: [
                '../../test/lib/jasmine-1.3.1/jasmine.css',
                'lib/bootstrap/css/bootstrap.min.css',
                'app.min.css'
            ],
            scripts: [
                'testing.min.js',
                'libs.min.js',
                'lib/ace-builds/src-noconflict/ace.js',
                '/girder/static/built/app.min.js'
            ],
            blanketScripts: inputs
        }));
    });

    grunt.registerTask('build-js', [
        'jade',
        'jade-index',
        'uglify:app',
        'workflows-index',
        'uglify:workflows',
        'test-env-html'
    ]);

    grunt.registerTask('init', [
        'uglify:libs'
    ]);

    grunt.registerTask('docs', ['shell:sphinx']);

    grunt.registerTask('default', defaultTasks);
};
