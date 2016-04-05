(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = '/girder/api/v1';
        girder.router.enabled(false);
        window.app = new flow.App({
            el: 'body'
        });
    });
}(window.flow, window.$, window.girder));
