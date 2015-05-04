(function (flow, _, Backbone, d3, girder) {
    "use strict";

    // The main app view
    flow.App = Backbone.View.extend({
        el: 'body',

        visualizationDescriptors: [
            {
                name: "table",
                inputs: [
                    {name: "data", type: "table", format: "rows", inputMode: "dataset"}
                ]
            },
            {
                name: "timeline",
                inputs: [
                    {name: "data", type: "table", format: "objectlist"},
                    {name: "x", type: "accessor", format: "text", domain: {input: "data", format: "column.names"}},
                    {name: "y", type: "accessor", format: "text", domain: {input: "data", format: "column.names"}}
                ]
            },
            {
                name: "scatterplot",
                inputs: [
                    {name: "data", type: "table", format: "objectlist"},
                    {name: "x", type: "accessor", format: "text", domain: {input: "data", format: "column.names"}},
                    {name: "y", type: "accessor", format: "text", domain: {input: "data", format: "column.names"}}
                ]
            },
            {
                name: "dendrogram",
                inputs: [
                    {name: "data", type: "tree", format: "nested"},
                    {name: "distance", type: "accessor", format: "text", default: {format: "text", data: "edge_data.weight"}},
                    {name: "label", type: "accessor", format: "text", default: {format: "text", data: "node_data.node name"}},
                    {name: "lineStyle", type: "string", format: "text", domain: ["axisAligned", "curved"]},
                    {name: "orientation", type: "string", format: "text", domain: ["horizontal", "vertical"]}
                ]
            },
            {
                name: "tablelink",
                inputs: [
                    {name: "data", type: "table", format: "rows"},
                    {name: "source", type: "string", format: "text", domain: {input: "data", format: "column.names"}},
                    {name: "target", type: "string", format: "text", domain: {input: "data", format: "column.names"}}
                ]
            },
            {
                name: "image",
                inputs: [
                    {name: "data", type: "image", format: "png.base64"}
                ]
            },
            {
                name: "string",
                inputs: [
                    {name: "data", type: "string", format: "text", inputMode: "dataset"}
                ]
            },
            {
                name: "treeHeatmap",
                inputs: [
                    {
                        name: "tree",
                        type: "tree",
                        format: "vtktree.serialized",
                        dataIsURI: true
                    },
                    {
                        name: "table",
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
                        type: "tree",
                        format: "vtktree.serialized",
                        dataIsURI: true
                    },
                    {
                        name: "tree2",
                        type: "tree",
                        format: "vtktree.serialized",
                        dataIsURI: true
                    },
                    {
                        name: "table",
                        type: "table",
                        format: "csv",
                        dataIsURI: true
                    }
                ]
            },
            {
                name: "edgebundling",
                inputs: [
                    {name: "data", type: "table", format: "rows"}
                ]
            },
            {
                name: "interactiveheatmap",
                inputs: [
                    {name: "data", type: "table", format: "rows"}
                ]
            },
            {
                name: "scatterplotmatrix",
                inputs: [
                    {
                        name: "data",
                        type: "table",
                        format: "rows"
                    },
                    {
                        name: "y",
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
                        type: "table",
                        format: "objectlist"
                    },
                    {
                        name: "charge",
                        type: "number",
                        format: "number",
                        default: {format: "number", data: -30}
                    },
                    {
                        name: "gravity",
                        type: "number",
                        format: "number",
                        default: {format: "number", data: 0.1}
                    },
                    {
                        name: "constraints",
                        type: "array",
                        components: [
                            {
                                name: "accessor",
                                type: "accessor",
                                domain: {input: "data", format: "column.names"}
                            },
                            {
                                name: "type",
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
            }
        ],

        events: {
            'click #login': function () {
                girder.events.trigger('g:loginUi');
            },

            'click #logout': function () {
                girder.restRequest({
                    path: 'user/authentication',
                    type: 'DELETE'
                }).done(_.bind(function () {
                    girder.currentUser = null;
                    girder.events.trigger('g:login');
                }, this));
            },

            'click #register': function () {
                girder.events.trigger('g:registerUi');
            },

            'click .new-collection': function () {
                var name = $('.new-collection-name').val(),
                    isPublic = $('.new-collection-public').is(':checked');

                girder.restRequest({
                    path: 'collection/romanesco/module',
                    type: 'post',
                    data: {
                        name: name,
                        description: '',
                        public: isPublic
                    }
                }).done(_.bind(function (collection) {
                    $('.new-collection-name').val('');
                    this.collection.fetch({}, true);
                }, this)).error(_.bind(function (xhr, status, message) {
                    $('.new-collection-name').val('');
                    console.error(message);
                }, this));
            }
        },

        initialize: function () {
            girder.restRequest({
                path: 'user/authentication',
                error: null
            }).done(_.bind(function (resp) {
                if (resp) {
                    resp.user.token = resp.authToken.token;
                    girder.currentUser = new girder.models.UserModel(resp.user);
                }
                this.render();
            }, this)).error(_.bind(function () {
                this.render();
            }, this));

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
                item.set({collection: flow.collectionForFolder[item.get('folderId')]});
            });

            this.datasetsView = new flow.DatasetManagementView({
                el: this.$('#dataset-management'),
                datasets: this.datasets
            });
            this.datasetsView.render();

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

            this.analysesView = new flow.AnalysisManagementView({
                el: this.$('#analysis-management'),
                analyses: this.analyses,
                datasets: this.datasets,
                visualizations: this.visualizations,
                presets: this.presets
            });
            this.analysesView.render();

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
                    el: this.$('#g-dialog-container')
                });
            }
            this.loginView.render();
        },

        registerDialog: function () {
            if (!this.registerView) {
                this.registerView = new girder.views.RegisterView({
                    el: this.$('#g-dialog-container')
                });
            }
            this.registerView.render();
        },

        collectionVisibilityChange: function (collection) {
            if (collection.get('active')) {

                girder.restRequest({
                    path: 'folder?parentType=collection&parentId=' + collection.id,
                    error: null
                }).done(_.bind(function (folders) {
                    folders.forEach(function (f) {
                        if (f.name === "Analyses") {
                            collection.set({analysisFolder: f._id});
                        } else if (f.name === "Data") {
                            collection.set({dataFolder: f._id});
                        } else if (f.name === "Visualizations") {
                            collection.set({visualizationFolder: f._id});
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
                }, this)).error(_.bind(function () {
                    // TODO error message
                }, this));
            } else {
                this.analyses.remove(this.analyses.where({collection: collection}));
                this.datasets.remove(this.datasets.where({collection: collection}));
            }
        },

        login: function () {
            this.render();
            this.collection.fetch({}, true);
        }
    });

}(window.flow, window._, window.Backbone, window.d3, window.girder));
