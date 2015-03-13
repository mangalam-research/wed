/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2015 Mangalam Research Center for Buddhist Languages
 */
'use strict';
var requirejs = require("requirejs");
var jsdomfw = require("../jsdomfw");
var chai = require("chai");
var assert = chai.assert;
var path = require("path");
var fs = require("fs");
var sinon = require("sinon");

function defined(x) {
    assert.isDefined(x);
    return x;
}

var substringMatcher = function(strs) {
    return function findMatches(q, cb) {
        var re = new RegExp(q, 'i');

        var matches = [];
        for (var i = 0, str; (str = strs[i]); ++i) {
            if (re.test(str))
                matches.push({ value: str });
        }

        cb(matches);
    };
};

var test_data = [];
for (var i = 0; i < 100; ++i)
    test_data.push("Test " + i);

describe("TypeaheadPopup", function () {
    var source = 'build/test-files/guiroot_test_data/source_converted.xml';
    var source_txt = fs.readFileSync(source).toString();
    var fw;
    var window;
    var typeahead_popup;
    var $;

    var ta;
    var cb;

    this.timeout(0);
    before(function (done) {
        fw = new jsdomfw.FW();
        fw.create(function () {
            window = fw.window;
            window.require(["wed/gui/typeahead_popup",
                            "jquery"], function (_typeahead_popup, _$) {
                try {
                    assert.isUndefined(window.document.errors);
                    typeahead_popup = _typeahead_popup;
                    $ = _$;
                    done();
                }
                catch (e) {
                    done(e);
                    throw e;
                }
            }, done);
        });
    });

    beforeEach(function () {
        cb = sinon.spy();
        ta = new typeahead_popup.TypeaheadPopup(
            window.document,
            0, 0,
            "Placeholder",
            {
                options: {
                    autoselect: true,
                        hint: true,
                    highlight: true,
                    minLength: 1
                },
                datasets: [{
                    source: substringMatcher(test_data)
                }]
            },
            cb
        );
    });

    afterEach(function () {
        ta.dismiss();
    });

    describe("setValue", function () {
        it("sets the value", function () {
            var tt_input =
                window.document.getElementsByClassName("tt-input")[0];
            assert.notEqual(tt_input.value, "foo");

            ta.setValue("foo");
            assert.equal(tt_input.value, "foo");
        });
    });

    describe("hideSpinner", function () {
        it("hides the spinner", function () {
            var spinner =
                window.document.querySelector(
                    ".wed-typeahead-popup .spinner");
            assert.notEqual(spinner.style.display, "none");

            ta.hideSpinner();
            assert.equal(spinner.style.display, "none");
        });
    });

    describe("dismiss", function () {
        it("calls the callback without a value if no value is given",
           function () {
            ta.dismiss();
            assert.isTrue(cb.calledWith(undefined));
        });

        it("calls the callback with the value passed", function () {
            ta.dismiss(test_data[0]);
            assert.isTrue(cb.calledWith(test_data[0]));
        });

        it("calls the callback with the value passed", function () {
            ta.dismiss(test_data[0]);
                assert.isTrue(cb.calledWith(test_data[0]));
        });

        it("calls the callback only once", function () {
            ta.dismiss();
            ta.dismiss();
            assert.isTrue(cb.calledOnce);
        });
    });
});
