(function (flow, $, girder) {
    'use strict';

    $(document).ready(function () {
        girder.apiRoot = $('#g-global-info-apiroot').text();
        girder.router.enabled(false);
        window.app = new flow.App({
            el: 'body'
        });
    });
}(window.flow, window.$, window.girder));
