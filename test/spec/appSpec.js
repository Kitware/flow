/**
 * Start the Tangelo Hub backbone app.
 */
$(function () {
    girder.apiRoot = '/girder/api/v1';
    var app = new flow.App();
    app.render();
});

describe('App is running', function () {
    it('app had rendered', function () {
        runs(function () {
            expect($('#control-panel').length).toBe(1);
        });
    });
});
