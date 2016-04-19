/**
 * Contains utility functions used in the girder jasmine tests.
 */
var flowTest = flowTest || {};

window.alert = function (msg) {
    // alerts block phantomjs and will destroy us.
    console.log(msg);
};

// Timeout to wait for asynchronous actions
flowTest.TIMEOUT = 5000;

flowTest.createUser = function (login, email, firstName, lastName, password) {

    return function () {
        runs(function () {
            expect(girder.currentUser).toBe(null);
        });

        waitsFor(function () {
            return $('#logged-in').hasClass('hidden');
        }, 'app to render');

        runs(function () {
            $('#register').click();
        });

        flowTest.waitForDialog();
        waitsFor(function () {
            return $('input#g-email').length > 0;
        }, 'register dialog to appear');

        runs(function () {
            $('#g-login').val(login);
            $('#g-email').val(email);
            $('#g-firstName').val(firstName);
            $('#g-lastName').val(lastName);
            $('#g-password,#g-password2').val(password);
            $('#g-register-button').click();
        });
        flowTest.waitForLoad();
        waitsFor(function () {
            return $('#name').text() === 'Logged in as ' + firstName + ' ' + lastName;
        }, 'user to be logged in');

        runs(function () {
            expect(girder.currentUser).not.toBe(null);
            expect(girder.currentUser.name()).toBe(firstName + ' ' + lastName);
            expect(girder.currentUser.get('login')).toBe(login);
        });
    };
};

flowTest.logout = function () {

    return function () {
        runs(function () {
            expect(girder.currentUser).not.toBe(null);
        });

        waitsFor(function () {
            return $('.g-logout').length > 0;
        }, 'logout link to render');

        runs(function () {
            $('.g-logout').click();
        });

        waitsFor(function () {
            return $('.g-login').length > 0;
        }, 'login link to appear');
    };
};

// This assumes that you're logged into the system and on the create collection
// page.
flowTest.createCollection = function (collName, collDesc) {

    return function () {

        waitsFor(function () {
            return $('li.active .g-page-number').text() === 'Page 1' &&
                   $('.g-collection-create-button').is(':enabled');
        }, 'create collection button to appear');

        runs(function () {
            $('.g-collection-create-button').click();
        });

        waitsFor(function () {
            return Backbone.history.fragment.slice(-14) === '?dialog=create';
        }, 'url state to change indicating a creation dialog');

        waitsFor(function () {
            return $('input#g-name').length > 0 &&
                   $('.g-save-collection:visible').is(':enabled');
        }, 'create collection dialog to appear');

        runs(function () {
            $('#g-name').val(collName);
            $('#g-description').val(collDesc);
            $('.g-save-collection').click();
        });

        waitsFor(function () {
            return $('.g-collection-name').text() === collName &&
                   $('.g-collection-description').text() === collDesc;
        }, 'new collection page to load');
    };
};

/**
 * Wait for a dialog to be visible.
 */
flowTest.waitForDialog = function (desc) {
    desc = desc ? ' (' + desc + ')' : '';
    waitsFor(function () {
        return $('#g-dialog-container').data('bs.modal') &&
               $('#g-dialog-container').data('bs.modal').isShown === true &&
               $('#g-dialog-container:visible').length > 0;
    }, 'a dialog to fully render' + desc);
};

/**
 * Wait for all loading blocks to be fully loaded.  Also, remove the dialog
 * backdrop, since it isn't properly removed on phantomJS.  This should not be
 * called on dialogs.
 */
flowTest.waitForLoad = function (desc) {
    desc = desc ? ' (' + desc + ')' : '';
    waitsFor(function () {
        return $('#g-dialog-container:visible').length === 0;
    }, 'for the dialog container to be hidden' + desc);
    waitsFor(function () {
        return $('#g-dialog-container').data('bs.modal') === undefined ||
               $('#g-dialog-container').data('bs.modal').isShown === false;
    }, 'for any modal dialog to be hidden' + desc);
};
