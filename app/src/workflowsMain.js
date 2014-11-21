/*jslint browser: true, nomen: true */

(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = '/girder/api/v1';
        girder.handleRouting = false;
        window.app = new flow.WorkflowsAppView({
            el: '.app',
            model: new Backbone.Model({
                brand: 'Arbor'
            })
        });
        window.app.render();
        $.material.init();
    });

}(window.flow, window.$, window.girder));
