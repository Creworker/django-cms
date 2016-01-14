'use strict';

// #############################################################################
// Page permissions

var globals = require('./settings/globals');
var casperjs = require('casper');
var cms = require('./helpers/cms')(casperjs);
var xPath = casperjs.selectXPath;

casper.test.setUp(function (done) {
    casper.start()
        .then(cms.login())
        .then(cms.addPage({ title: 'First page' }))
        .then(cms.addPlugin({
            type: 'TextPlugin',
            content: {
                id_body: 'Login required to view this page'
            }
        }))
        .run(done);
});

casper.test.tearDown(function (done) {
    casper.start()
        .then(cms.removePage())
        .then(cms.logout())
        .run(done);
});

// For this test CMS_PERMISSION has to be True,
// and urls has to be adapted to have own auth system
// for this case LOGIN_URL is '/admin/login/?user-login=test'
casper.test.begin('Can set / unset "login required" for the page', function (test) {
    casper.start(globals.editUrl)
        .waitUntilVisible('.cms-toolbar-expanded')
        .then(function () {
            test.assertSelectorHasText(
                '.cms-plugin',
                'Login required to view this page',
                'The new page has been created and its content is correct'
            );
        })
        .then(function () {
            // click on "Page" menu item
            this.click('.cms-toolbar-item-navigation > li:nth-child(2) > a');
        })
        // opening "Permissions" menu item
        .waitForSelector('.cms-toolbar-item-navigation-hover', function () {
            this.click(
                xPath('//a[.//span[text()[contains(.,"Permissions")]]]')
            );
        })
        .waitUntilVisible('.cms-modal')
        // check login required checkbox
        .withFrame(0, function () {
            casper.waitUntilVisible('#page_form', function () {
                this.fill('#page_form', {
                    login_required: true
                }, true);
            });
        })
        // wait until it succeeds
        .waitForResource(/permission-settings/)
        // publish the page
        .waitForSelector('.cms-ready', function () {
            this.click('.cms-btn-publish');
        })
        .waitForResource(/publish/)
        .then(cms.logout())
        .thenOpen(globals.baseUrl)
        // wait till we are redirected
        .waitForUrl(/user-login=test/)
        .then(function () {
            test.assertDoesntExist('.cms-plugin', 'Cannot see the content of page');
            test.assertExists('#login-form', 'See login form instead');
            test.assertUrlMatch(/user-login=test/, 'Url is not the default one');
        })
        .then(function () {
            this.fill('#login-form', globals.credentials, true);
        })
        // wait till the form submits
        .waitForResource(/admin\/login/)
        // wait till we are redirected
        .waitUntilVisible('.cms-toolbar-expanded', function () {
            // check for body, because we see published page (no .cms-plugin)
            test.assertSelectorHasText(
                'body',
                'Login required to view this page',
                'The page has correct content'
            );
        })
        .then(function () {
            // click on Edit button to edit the page
            this.click('.cms-btn-switch-edit');
        })
        .waitUntilVisible('.cms-toolbar-expanded')
        // now backwards
        .then(function () {
            // click on "Page" menu item
            this.click('.cms-toolbar-item-navigation > li:nth-child(2) > a');
        })
        // opening "Permissions" menu item
        .waitForSelector('.cms-toolbar-item-navigation-hover', function () {
            this.click(
                xPath('//a[.//span[text()[contains(.,"Permissions")]]]')
            );
        })
        .waitUntilVisible('.cms-modal')
        // uncheck login required checkbox
        .withFrame(0, function () {
            casper.waitUntilVisible('#page_form', function () {
                this.fill('#page_form', {
                    login_required: false
                }, true);
            });
        })
        // wait until it succeeds
        .waitForResource(/permission-settings/)
        // publish the page
        .waitForSelector('.cms-ready', function () {
            this.click('.cms-btn-publish');
        })
        .waitForResource(/publish/)
        .then(cms.logout())
        .thenOpen(globals.baseUrl)
        .then(function () {
            test.assertSelectorHasText(
                'body',
                'Login required to view this page',
                'The page no longer requires to be logged in'
            );
        })
        .run(function () {
            test.done();
        });
});
