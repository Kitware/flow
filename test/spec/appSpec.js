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
        }, 'dataset model to be available');

        runs(function () {
            var table = app.datasetsView.datasets.at(0);
            expect(table.get('data')).toBe('a,b,c\n1,2,3');
            expect(table.get('type')).toBe('table');
            expect(table.get('format')).toBe('csv');
        });
    });

    it('data downloaded', function () {
        var blob = null,
            data = null,
            URL = window.URL || window.webkitURL;

        URL.createObjectURL = function (b) {
            blob = b;
            return "blob:";
        };

        runs(function () {
            $('.dataset-format-select').val('rows.json');
            $('.dataset-download').trigger('click');
        });

        waitsFor(function () {
            return $(':last').attr('download') === 'test.csv.rows-json';
        }, 'converted data to be stored');

        runs(function () {
            var reader = new window.FileReader();

            reader.onerror = function(event) {
                console.log("File could not be read! Code " + event.target.error.code);
            };

            reader.onload = function(event) {
                data = JSON.parse(reader.result);
            };
            reader.readAsText(blob);
        });

        waitsFor(function () {
            return data !== null;
        });

        runs(function () {
            expect(data).toEqual({
                fields: ['a', 'b', 'c'],
                rows: [{a: 1, b: 2, c: 3}]
            });
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
