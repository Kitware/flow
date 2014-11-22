(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = '/girder/api/v1';
        girder.handleRouting = false;
        window.app = new flow.App();
        window.app.render();
    });
}(window.flow, window.$, window.girder));
