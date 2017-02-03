/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(function f(require, exports) {
  "use strict";
  var chai = require("chai");
  var $ = require("jquery");

  var assert = chai.assert;

  function control(command, additional, errmsg, done) {
    var params = $.extend({ command: command }, additional);
    $.post("/build/ajax/control", params, function success(data) {
      assert.deepEqual(data, {});
      done();
    }).fail(function fail() {
      throw new Error(errmsg);
    });
  }

  function reset(done) {
    control("reset", undefined, "failed to reset", done);
  }

  exports.reset = reset;

  function set(name, done) {
    control(name, { value: 1 }, "failed to set " + name, done);
  }

  function fail_on_save(done) {
    set("fail_on_save", done);
  }

  exports.fail_on_save = fail_on_save;

  function no_response_on_save(done) {
    set("no_response_on_save", done);
  }

  exports.no_response_on_save = no_response_on_save;

  function precondition_fail_on_save(done) {
    set("precondition_fail_on_save", done);
  }

  exports.precondition_fail_on_save = precondition_fail_on_save;

  function too_old_on_save(done) {
    set("too_old_on_save", done);
  }

  exports.too_old_on_save = too_old_on_save;

  function makeFakePasteEvent(clipboardData) {
    var event = new $.Event("paste");
    event.originalEvent = {
      clipboardData: clipboardData,
      stopImmediatePropagation: function stopImmediatePropagation() {},
      preventDefault: function preventDefault() {},
      stopPropagation: function stopPropagation() {},
    };
    return event;
  }

  exports.makeFakePasteEvent = makeFakePasteEvent;
});

//  LocalWords:  Mangalam MPL Dubeau jQuery jquery ajax chai
