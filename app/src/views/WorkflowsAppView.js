(function (flow, $, Backbone) {
    "use strict";

    flow.WorkflowsAppView = Backbone.View.extend({
        template: jade.templates.workflowsApp,

        events: {
            'change .th-search': function () {
                this.findItems('analyses', this.workflows, this.$('.th-search').val());
            }
        },

        initialize: function () {
            this.workflows = new Backbone.Collection();
            this.datasets = new Backbone.Collection();
            this.findItems('analyses', this.workflows);
            this.findItems('data', this.datasets);
        },

        findItems: function (type, itemCollection, search) {
            girder.restRequest({
                path: 'collection',
                error: null
            }).done(_.bind(function (collections) {
                collections.forEach(_.bind(function (collection) {
                    var collectionModel = new Backbone.Model(collection);
                    collectionModel.id = collectionModel.get('_id');
                    girder.restRequest({
                        path: 'folder?parentType=collection&parentId=' + collection._id,
                        error: null
                    }).done(_.bind(function (folders) {
                        var folder;
                        folders.forEach(function (f) {
                            if (f.name.toLowerCase() === type) {
                                folder = f._id;
                            }
                        });

                        if (folder) {
                            girder.restRequest({
                                path: 'item?folderId=' + folder + (search === '' || search === undefined ? '' : '&text=' + search),
                                error: null
                            }).done(_.bind(function (items) {
                                var result = [];
                                items.forEach(_.bind(function (item) {
                                    var model = new Backbone.Model(item);
                                    model.id = model.get('_id');
                                    model.set('type', 'table');
                                    model.set('format', 'csv');
                                    model.set('collection', collectionModel);
                                    result.push(model);
                                }, this));
                                itemCollection.set(result);
                            }, this));
                        }
                    }, this));
                }, this));
            }, this));
        },

        render: function () {
            this.$el.html(this.template(this.model.attributes));
            this.workflowsView = new flow.WorkflowsView({el: this.$('.workflows'), collection: this.workflows, datasets: this.datasets});
            this.workflowsView.render();
            return this;
        }
    });

}(window.flow, window.$, window.Backbone));
