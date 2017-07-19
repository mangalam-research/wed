/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";
var jsdomfw = require("../jsdomfw");
var chai = require("chai");
var sinon = require("sinon");

var assert = chai.assert;

var substringMatcher = function substringMatcher(strs) {
  return function findMatches(q, cb) {
    var re = new RegExp(q, "i");

    var matches = [];
    for (var i = 0; i < strs.length; ++i) {
      var str = strs[i];
      if (re.test(str)) {
        matches.push({ value: str });
      }
    }

    cb(matches);
  };
};

var test_data = [];
for (var i = 0; i < 100; ++i) {
  test_data.push("Test " + i);
}

describe("TypeaheadPopup", function TypeaheadPopup() {
  var fw;
  var window;
  var typeahead_popup;

  var ta;
  var cb;

  this.timeout(0);
  before(function before(done) {
    fw = new jsdomfw.FW();
    fw.create(function created() {
      window = fw.window;
      window.require(["wed/gui/typeahead_popup"],
                     function loaded(_typeahead_popup) {
                       try {
                         assert.isUndefined(window.document.errors);
                         typeahead_popup = _typeahead_popup;
                         done();
                       }
                       catch (e) {
                         done(e);
                         throw e;
                       }
                     }, done);
    });
  });

  beforeEach(function beforeEach() {
    cb = sinon.spy();
    ta = new typeahead_popup.TypeaheadPopup(
      window.document, 0, 0, 300, "Placeholder",
      {
        options: {
          autoselect: true,
          hint: true,
          highlight: true,
          minLength: 1,
        },
        datasets: [{
          source: substringMatcher(test_data),
        }],
      },
      cb
    );
  });

  afterEach(function afterEach() {
    if (ta) {
      ta.dismiss();
    }
  });

  describe("setValue", function setValue() {
    it("sets the value", function test() {
      var tt_input = window.document.getElementsByClassName("tt-input")[0];
      assert.notEqual(tt_input.value, "foo");

      ta.setValue("foo");
      assert.equal(tt_input.value, "foo");
    });
  });

  describe("hideSpinner", function hideSpinner() {
    it("hides the spinner", function test() {
      var spinner = window.document.querySelector(
        ".wed-typeahead-popup .spinner");
      assert.notEqual(spinner.style.display, "none");

      ta.hideSpinner();
      assert.equal(spinner.style.display, "none");
    });
  });

  describe("dismiss", function dismiss() {
    it("calls the callback without a value if no value is given",
       function test() {
         ta.dismiss();
         assert.isTrue(cb.calledWith(undefined));
       });

    it("calls the callback with the value passed", function test() {
      ta.dismiss(test_data[0]);
      assert.isTrue(cb.calledWith(test_data[0]));
    });

    it("calls the callback with the value passed", function test() {
      ta.dismiss(test_data[0]);
      assert.isTrue(cb.calledWith(test_data[0]));
    });

    it("calls the callback only once", function test() {
      ta.dismiss();
      ta.dismiss();
      assert.isTrue(cb.calledOnce);
    });
  });
});
