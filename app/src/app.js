(function (flow, _, Backbone, d3, girder) {
    "use strict";

    // The main app view
    flow.App = Backbone.View.extend({
        el: 'body',

        visualizationDescriptors: [
            {
                name: "graph",
                inputs: [{name: "data", id: "data", type: "graph", format: "networkx.json", inputMode: "dataset"}]
            },
            {
                name: "table",
                inputs: [
                    {name: "data", id: "data", type: "table", format: "rows", inputMode: "dataset"}
                ]
            },
            {
                name: "timeline",
                inputs: [
                    {name: "data", id: "data", type: "table", format: "objectlist"},
                    {name: "x", id: "x", type: "accessor", format: "text", domain: {input: "data", format: "column.names"}},
                    {name: "y", id: "x", type: "accessor", format: "text", domain: {input: "data", format: "column.names"}}
                ]
            },
            {
                name: "scatterplot",
                inputs: [
                    {name: "data", id: "data", type: "table", format: "objectlist"},
                    {name: "x", id: "x", type: "accessor", format: "text", domain: {input: "data", format: "column.names"}},
                    {name: "y", id: "y", type: "accessor", format: "text", domain: {input: "data", format: "column.names"}}
                ]
            },
            {
                name: "dendrogram",
                inputs: [
                    {name: "data", id: "data", type: "tree", format: "nested"},
                    {name: "distance", id: "distance", type: "accessor", format: "text", default: {format: "text", data: "edge_data.weight"}},
                    {name: "label", id: "label", type: "accessor", format: "text", default: {format: "text", data: "node_data.node name"}},
                    {name: "lineStyle", id: "lineStyle", type: "string", format: "text", domain: ["axisAligned", "curved"]},
                    {name: "orientation", id: "orientation", type: "string", format: "text", domain: ["horizontal", "vertical"]}
                ]
            },
            {
                name: "tablelink",
                inputs: [
                    {name: "data", id: "data", type: "table", format: "rows"},
                    {name: "source", id: "source", type: "string", format: "text", domain: {input: "data", format: "column.names"}},
                    {name: "target", id: "target", type: "string", format: "text", domain: {input: "data", format: "column.names"}}
                ]
            },
            {
                name: "image",
                inputs: [
                    {name: "data", id: "data", type: "image", format: "png.base64"}
                ]
            },
            {
                name: "string",
                inputs: [
                    {name: "data", id: "data", type: "string", format: "text", inputMode: "dataset"}
                ]
            },
            {
                name: "treeHeatmap",
                inputs: [
                    {
                        name: "tree",
                        id: "tree",
                        type: "tree",
                        format: "vtktree.serialized",
                        dataIsURI: true
                    },
                    {
                        name: "table",
                        id: "table",
                        type: "table",
                        format: "vtktable.serialized",
                        dataIsURI: true
                    }
                ]
            },
            {
                name: "tanglegram",
                inputs: [
                    {
                        name: "tree1",
                        id: "tree1",
                        type: "tree",
                        format: "vtktree.serialized",
                        dataIsURI: true
                    },
                    {
                        name: "tree2",
                        id: "tree2",
                        type: "tree",
                        format: "vtktree.serialized",
                        dataIsURI: true
                    },
                    {
                        name: "table",
                        id: "table",
                        type: "table",
                        format: "csv",
                        dataIsURI: true
                    }
                ]
            },
            {
                name: "edgebundling",
                inputs: [
                    {name: "data", id: "data", type: "table", format: "rows"}
                ]
            },
            {
                name: "interactiveheatmap",
                inputs: [
                    {name: "data", id: "data", type: "table", format: "rows"}
                ]
            },
            {
                name: "scatterplotmatrix",
                inputs: [
                    {
                        name: "data",
                        id: "data",
                        type: "table",
                        format: "rows"
                    },
                    {
                        name: "y",
                        id: "y",
                        type: "accessor",
                        domain: {input: "data", format: "column.names"}
                    }
                ]
            },
            {
                name: "spaceMap",
                inputs: [
                    {
                        name: "data",
                        id: "data",
                        type: "table",
                        format: "objectlist"
                    },
                    {
                        name: "charge",
                        id: "charge",
                        type: "number",
                        format: "number",
                        default: {format: "number", data: -30}
                    },
                    {
                        name: "gravity",
                        id: "gravity",
                        type: "number",
                        format: "number",
                        default: {format: "number", data: 0.1}
                    },
                    {
                        name: "constraints",
                        id: "constraints",
                        type: "array",
                        components: [
                            {
                                name: "accessor",
                                id: "accessor",
                                type: "accessor",
                                domain: {input: "data", format: "column.names"}
                            },
                            {
                                name: "type",
                                id: "type",
                                type: "string",
                                domain: [
                                    'link-bin',
                                    'link',
                                    'link-closest',
                                    'x',
                                    'y',
                                    'ordinalx',
                                    'ordinaly',
                                    'xy',
                                    'map',
                                    'binx',
                                    'biny',
                                    'linex',
                                    'liney',
                                    'radius'
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                name: "geojsMap",
                inputs: [
                    {
                        name: "data",
                        type: "table",
                        format: "objectlist"
                    },
                    {
                        name: "tileUrl",
                        type: "string",
                        domain: [
                            'http://otile1.mqcdn.com/tiles/1.0.0/map/<zoom>/<x>/<y>.png',
                            'http://otile1.mqcdn.com/tiles/1.0.0/sat/<zoom>/<x>/<y>.png',
                            'http://tile.openstreetmap.org/<zoom>/<x>/<y>.png',
                            'http://tile.stamen.com/toner-lite/<zoom>/<x>/<y>.png'
                        ]
                    },
                    {
                        name: "layers",
                        type: "array",
                        components: [
                            {
                                name: "renderer",
                                type: "string",
                                domain: ["d3", "vgl"]
                            },
                            {
                                name: "features",
                                type: "array",
                                components: [
                                    {
                                        name: "type",
                                        type: "string",
                                        domain: ["point"]
                                    },
                                    {
                                        name: "position",
                                        type: "coordinate",
                                        domain: {input: "data", format: "column.names"}
                                    },
                                    {
                                        name: "size",
                                        type: "accessor",
                                        domain: {input: "data", format: "column.names"}
                                    },
                                    {
                                        name: "fillColor",
                                        type: "accessor",
                                        domain: {input: "data", format: "column.names"}
                                    },
                                    {
                                        name: "strokeColor",
                                        type: "accessor",
                                        domain: {input: "data", format: "column.names"}
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],

        events: {
            'click #login': function () {
                girder.events.trigger('g:loginUi');
            },

            'click #logout': function () {
                girder.logout();
            },

            'click #register': function () {
                girder.events.trigger('g:registerUi');
            },

            'click .new-collection': function () {
                var name = $('.new-collection-name').val(),
                    isPublic = $('.new-collection-public').is(':checked'),
                    collection = new girder.models.CollectionModel({
                        name: name,
                        public: isPublic
                    }).on('g:saved', function () {
                        $('.new-collection-name').val('');
                        this.collection.fetch({}, true);

                        _.each(['Data', 'Analyses', 'Visualizations'], function (name) {
                            new girder.models.FolderModel({
                                parentType: 'collection',
                                parentId: collection.get('_id'),
                                name: name,
                                public: isPublic
                            }).save();
                        }, this);
                    }, this).on('g:error', function (error) {
                        $('.new-collection-name').val('');

                        if ('message' in error.responseJSON) {
                            console.error(error.responseJSON.message);
                        }
                    }).save();
            }
        },

        initialize: function () {
            var timer;

            girder.fetchCurrentUser().success(_.bind(function (user) {
                if (user) {
                    girder.currentUser = new girder.models.UserModel(_.extend(user, {
                        token: girder.cookie.find('girderToken')
                    }));
                }
                this.render();
            }, this)).error(_.bind(function () {
                this.render();
            }, this));

            timer = setTimeout(function () {
                flow.bootstrapAlert('warning',
                                    'The Romanesco worker is taking a long time to respond..',
                                    false);
            }, 3000);

            girder.restRequest({
                path: 'romanesco_validator'
            }).done(_.bind(function (data) {
                clearTimeout(timer);
                $('#alert').alert('close');

                flow.validators = data;
                flow.events.trigger('flow:validators-loaded');
            }, this)).error(_.bind(function (error) {
                console.log(error);
            }));

            this.$("#control-panel").controlPanel();

            // Keep a mapping from folders to collections
            flow.collectionForFolder = {};

            this.collection = new girder.collections.CollectionCollection();
            this.collection.append = false;
            this.collection.pageLimit = 100;

            this.view = new flow.CollectionsView({
                el: this.$('#collections'),
                itemView: flow.CollectionView,
                itemOptions: {collection: this.collection},
                collection: this.collection
            });
            this.view.on('flow:change-active', this.collectionVisibilityChange, this);
            this.view.render();
            this.collection.fetch();

            this.datasets = new flow.DatasetCollection();
            this.datasets.append = true;
            this.datasets.pageLimit = 100;
            this.datasets.on('add', function (item) {
                item.set(_.first(flow.getTypeFormatsFromExtension(_.last(item.get('name').split('.')))));
                item.id = item._id;
                item.set({collection: flow.collectionForFolder[item.get('folderId')]});
            });

            flow.events.once('flow:validators-loaded', function () {
                this.datasetsView = new flow.DatasetManagementView({
                    el: this.$('#dataset-management'),
                    datasets: this.datasets
                });
                this.datasetsView.render();
            }, this);

            this.visualizations = new Backbone.Collection();
            this.visualizationDescriptors.forEach(_.bind(function (vis) {
                vis.visualization = true;
                vis.outputs = [];
                this.visualizations.add({
                    name: vis.name,
                    meta: {
                        visualization: vis
                    }
                });
            }, this));

            this.presets = new girder.collections.ItemCollection();
            this.presets.append = true;
            this.presets.pageLimit = 100;
            this.presets.on('add', function (item) {
                item.set({collection: flow.collectionForFolder[item.get('folderId')]});
            });

            this.analyses = new girder.collections.ItemCollection();
            this.analyses.append = true;
            this.analyses.pageLimit = 100;
            this.analyses.on('add', function (item) {
                item.set({collection: flow.collectionForFolder[item.get('folderId')]});
            });

            flow.events.once('flow:validators-loaded', function () {
                this.analysesView = new flow.AnalysisManagementView({
                    el: this.$('#analysis-management'),
                    analyses: this.analyses,
                    datasets: this.datasets,
                    visualizations: this.visualizations,
                    presets: this.presets
                });
                this.analysesView.render();
            }, this);

            this.visualizationsView = new flow.VisualizationManagementView({
                el: this.$('#visualization-management'),
                datasets: this.datasets,
                visualizations: this.visualizations,
                presets: this.presets
            });
            this.visualizationsView.render();

            girder.events.on('g:loginUi', this.loginDialog, this);
            girder.events.on('g:registerUi', this.registerDialog, this);
            girder.events.on('g:login', this.login, this);
        },

        render: function () {
            if (girder.currentUser) {
                this.$("#logged-in").removeClass("hidden");
                this.$("#logged-out").addClass("hidden");
                this.$("#name").text("Logged in as " + girder.currentUser.get('firstName') + " " + girder.currentUser.get('lastName'));
            } else {
                this.$("#logged-in").addClass("hidden");
                this.$("#logged-out").removeClass("hidden");
            }
            this.$('.new-collection-form').toggleClass('hidden', girder.currentUser === null);
        },

        /**
         * Show a dialog allowing a user to login or register.
         */
        loginDialog: function () {
            if (!this.loginView) {
                this.loginView = new girder.views.LoginView({
                    el: this.$('#g-dialog-container'),
                    parentView: null
                });
            }
            this.loginView.render();
        },

        registerDialog: function () {
            if (!this.registerView) {
                this.registerView = new girder.views.RegisterView({
                    el: this.$('#g-dialog-container'),
                    parentView: null
                });
            }
            this.registerView.render();
        },

        collectionVisibilityChange: function (collection) {
            if (collection.get('active')) {
                var folders = new girder.collections.FolderCollection();
                folders.once('g:changed', function () {
                    folders.forEach(function (f) {
                        var id = f.get('_id');
                        if (f.get('name') === "Analyses") {
                            collection.set({analysisFolder: id});
                        } else if (f.get('name') === "Data") {
                            collection.set({dataFolder: id});
                        } else if (f.get('name') === "Visualizations") {
                            collection.set({visualizationFolder: id});
                        }
                    });

                    if (collection.get('analysisFolder')) {
                        flow.collectionForFolder[collection.get('analysisFolder')] = collection;
                        this.analyses.offset = 0;
                        this.analyses.fetch({
                            folderId: collection.get('analysisFolder')
                        });
                    }

                    if (collection.get('dataFolder')) {
                        flow.collectionForFolder[collection.get('dataFolder')] = collection;
                        this.datasets.offset = 0;
                        this.datasets.fetch({
                            folderId: collection.get('dataFolder')
                        });
                    }

                    if (collection.get('visualizationFolder')) {
                        flow.collectionForFolder[collection.get('visualizationFolder')] = collection;
                        this.presets.offset = 0;
                        this.presets.fetch({
                            folderId: collection.get('visualizationFolder')
                        });
                    }
                }, this).fetch({
                    parentType: 'collection',
                    parentId: collection.id
                });

            } else {
                this.analyses.remove(this.analyses.where({collection: collection}));
                this.datasets.remove(this.datasets.where({collection: collection}));
            }
        },

        login: function () {
            if (girder.currentUser) {
                girder.currentUser.set('token', girder.cookie.find('girderToken'));
            }
            this.render();
            this.collection.fetch({}, true);
        }
    });

}(window.flow, window._, window.Backbone, window.d3, window.girder));
