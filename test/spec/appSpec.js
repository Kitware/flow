/**
 * Start the Tangelo Hub backbone app.
 */
var app;
$(function () {
    girder.apiRoot = '/girder/api/v1';
    girder.handleRouting = false;
    app = new flow.App();
    app.render();
});

describe('App is running', function () {
    it('app had rendered', function () {
        runs(function () {
            expect($('#control-panel').length).toBe(1);
        });
    });
});

describe('Able to upload data', function () {
    it('data uploaded', function () {
        runs(function () {
            var file = new Blob(['a,b,c\n1,2,3']);
            file.name = 'test.csv';
            app.datasetsView.upload(file);
        });
        waitsFor(function () {
            return app.datasetsView.datasets.length === 1;
        });
        runs(function () {
            var table = app.datasetsView.datasets.at(0);
            expect(table.get('data')).toBe('a,b,c\n1,2,3');
            expect(table.get('type')).toBe('table');
            expect(table.get('format')).toBe('csv');
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
