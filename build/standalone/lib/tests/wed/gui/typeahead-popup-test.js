define(["require", "exports", "module", "sinon", "wed/gui/typeahead-popup"], function (require, exports, module, sinon, typeahead_popup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    function substringMatcher(strs) {
        return function findMatches(q, cb) {
            var re = new RegExp(q, "i");
            var matches = [];
            for (var _i = 0, strs_1 = strs; _i < strs_1.length; _i++) {
                var str = strs_1[_i];
                if (re.test(str)) {
                    matches.push({ value: str });
                }
            }
            cb(matches);
        };
    }
    var testData = [];
    for (var i = 0; i < 100; ++i) {
        testData.push("Test " + i);
    }
    describe("TypeaheadPopup", function () {
        var ta;
        var cb;
        beforeEach(function () {
            cb = sinon.spy();
            ta = new typeahead_popup_1.TypeaheadPopup(window.document, 0, 0, 300, "Placeholder", {
                options: {
                    autoselect: true,
                    hint: true,
                    highlight: true,
                    minLength: 1,
                },
                datasets: [{
                        source: substringMatcher(testData),
                    }],
            }, cb);
        });
        afterEach(function () {
            if (ta !== undefined) {
                ta.dismiss();
            }
        });
        describe("setValue", function () {
            it("sets the value", function () {
                var ttInput = document.getElementsByClassName("tt-input")[0];
                assert.notEqual(ttInput.value, "foo");
                ta.setValue("foo");
                assert.equal(ttInput.value, "foo");
            });
        });
        describe("hideSpinner", function () {
            it("hides the spinner", function () {
                var spinner = document.querySelector(".wed-typeahead-popup .spinner");
                assert.notEqual(spinner.style.display, "none");
                ta.hideSpinner();
                assert.equal(spinner.style.display, "none");
            });
        });
        describe("dismiss", function () {
            it("calls the callback without a value if no value is given", function () {
                ta.dismiss();
                assert.isTrue(cb.calledWith(undefined));
            });
            it("calls the callback with the value passed", function () {
                ta.dismiss(testData[0]);
                assert.isTrue(cb.calledWith(testData[0]));
            });
            it("calls the callback with the value passed", function () {
                ta.dismiss(testData[0]);
                assert.isTrue(cb.calledWith(testData[0]));
            });
            it("calls the callback only once", function () {
                ta.dismiss();
                ta.dismiss();
                assert.isTrue(cb.calledOnce);
            });
        });
    });
});

//# sourceMappingURL=typeahead-popup-test.js.map
