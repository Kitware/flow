/**
 * Start the Tangelo Hub backbone app.
 */
$(function () {
    girder.apiRoot = '/girder/api/v1';
    girder.handleRouting = false;
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

describe('Able to create account', function () {
    it('account created',
        tangeloHubTest.createUser(
            'admin',
            'admin@email.com',
            'Admin',
            'Admin',
            'adminpassword!'
        )
    );
});
