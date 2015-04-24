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

describe('Logo is present', function () {
    it("Make an AJAX request to load arbor.jpg", function () {
        var callback = jasmine.createSpy();
        getLogo(callback);
        waitsFor(function() {
            return callback.callCount > 0;
        });
        runs(function() {
            expect(callback).toHaveBeenCalled();
        });

        function getLogo(callback) {
            $.get("/arbor.jpg", function() {
                callback();
            })
        }
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

        if (!HTMLElement.prototype.click) {
            HTMLElement.prototype.click = function () {
                var ev = document.createEvent('MouseEvent');
                ev.initMouseEvent('click', true, true);
                this.dispatchEvent(ev);
            };
        }

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

            reader.onerror = function (event) {
                console.log("File could not be read! Code " + event.target.error.code);
            };

            reader.onload = function (event) {
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

describe('Able to create collection', function () {
    it('collection created', function () {
        runs(function () {
            $('.new-collection-name').val('Collection');
            $('.new-collection').click();
        });

        waitsFor(function () {
            return $('#collections .name').text() === 'Collection';
        }, 'collection to be available');

        runs(function () {
            expect(app.collection.length).toBe(1);
            expect(app.collection.at(0).get('name')).toBe('Collection');
        });
    });
});

describe('Able to create analysis', function () {
    it('analysis created', function () {
        runs(function () {
            $('.save-location').first().click();
        });

        waitsFor(function () {
            return flow.saveLocation !== null && flow.saveLocation.get('analysisFolder') !== undefined;
        }, 'save location to be updated');

        runs(function () {
            $('#analysis-name').val('Test');
            $('#analysis-new').click();
        });

        waitsFor(function () {
            return app.analysesView.analyses.findWhere({name: 'Test'}) !== undefined;
        }, 'test analysis to be created');

        runs(function () {
            $('#show-script').click();
            $('#edit').click();
            app.analysesView.editor.setValue('output = 2 + 2');
            $('.add-output-variable').click();
            var controls = $('#output-variable-edit-dialog .form-control');
            controls.eq(0).val('output');
            controls.eq(1).val('number:number');
            $('#output-variable-edit-dialog .update').click();
            $('#save').click();
        });

        waitsFor(function () {
            return !$('#save').hasClass('disabled');
        }, 'save to complete');

        runs(function () {
            $('#setup').click();
            $('#analysis-setup-dialog .run').click();
        });

        waitsFor(function () {
            return !$('#analysis-setup-dialog .success-message').hasClass("hidden");
        }, 'success message');

        runs(function () {
            expect(app.datasetsView.datasets.findWhere({type: 'number'}).get('data')).toBe(4);
        });
    });
});

describe('Able to delete collection', function () {
    it('collection deleted', function () {
        runs(function () {
            $('#collections .delete').click();
        });

        waitsFor(function () {
            return $('#g-confirm-button').length > 0;
        }, 'confirm dialog to appear');

        runs(function () {
            $('#g-confirm-button').click();
        });

        waitsFor(function () {
            return $('#collections .name').text() === '';
        }, 'collection to be deleted');

        runs(function () {
            expect(app.collection.length).toBe(0);
        });
    });
});
