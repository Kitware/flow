/*jslint browser: true, nomen: true */

(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = '/girder/api/v1';
        girder.handleRouting = false;
        var app = new flow.App();
        app.render();
    });
}(window.flow, window.$, window.girder));
