/*jslint browser: true, nomen: true, unparam: true */

(function (flow, _, Backbone, d3, girder) {
    "use strict";

    // The main app view
    flow.App = Backbone.View.extend({
        el: 'body',

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
            }
        },

        initialize: function () {
            girder.restRequest({
                path: 'user/authentication',
                error: null
            }).done(_.bind(function (resp) {
                resp.user.token = resp.authToken.token;
                girder.currentUser = new girder.models.UserModel(resp.user);
                this.render();
            }, this)).error(_.bind(function () {
                this.render();
            }, this));

            this.$("#control-panel").controlPanel();

            this.collection = new girder.collections.CollectionCollection();
            this.collection.append = false;
            this.collection.pageLimit = 100;
            this.collection.fetch();

            this.view = new flow.CollectionsView({el: this.$('#collections'), itemView: flow.CollectionView, collection: this.collection});
            this.view.on('flow:change-active', this.collectionVisibilityChange, this);
            this.view.render();

            this.datasets = new flow.DatasetCollection();
            this.datasets.append = true;
            this.datasets.pageLimit = 100;
            this.datasetsView = new flow.DatasetManagementView({el: this.$('#dataset-management'), datasets: this.datasets});
            this.datasetsView.render();

            this.analyses = new girder.collections.ItemCollection();
            this.analyses.append = true;
            this.analyses.pageLimit = 100;
            this.analysesView = new flow.AnalysisManagementView({el: this.$('#analysis-management'), analyses: this.analyses, datasets: this.datasets});
            this.analysesView.render();

            this.visualizationsView = new flow.VisualizationManagementView({el: this.$('#visualization-management'), datasets: this.datasets});
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
                d3.json(girder.apiRoot + '/folder?parentType=collection&parentId=' + collection.id, _.bind(function (error, folders) {
                    folders.forEach(function (f) {
                        if (f.name === "Analyses") {
                            collection.set({analysisFolder: f._id});
                        } else if (f.name === "Data") {
                            collection.set({dataFolder: f._id});
                        }
                    });

                    if (collection.get('analysisFolder')) {
                        this.analyses.offset = 0;
                        this.analyses.off('add', null, this).on('add', function (analysis) {
                            analysis.set({collection: collection});
                        }, this).fetch({
                            folderId: collection.get('analysisFolder')
                        });
                    }

                    if (collection.get('dataFolder')) {
                        this.datasets.offset = 0;
                        this.datasets.off('add', null, 'set-collection').on('add', function (dataset) {
                            dataset.set({collection: collection});
                        }, 'set-collection').fetch({
                            folderId: collection.get('dataFolder')
                        });
                    }
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
