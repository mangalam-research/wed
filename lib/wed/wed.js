/**
 * @module wed
 * @desc The main module for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:wed */function f(require, exports) {
  "use strict";

  var core = require("./wed_core");
  require("./wed_init");
  require("./wed_caret");
  require("./wed_gui");

  exports.version = core.version;
  exports.Editor = core.Editor;
});

//  LocalWords:  unclick saveSelection rethrown focusNode setGUICaret ns
//  LocalWords:  caretChangeEmitter caretchange toDataLocation RTL keyup
//  LocalWords:  compositionstart keypress keydown TextUndoGroup Yay
//  LocalWords:  getCaret endContainer startContainer uneditable prev
//  LocalWords:  CapsLock insertIntoText prepend
//  LocalWords:  offscreen validthis jshint enterStartTag xmlns xml
//  LocalWords:  namespace mousedown mouseup mousemove compositionend
//  LocalWords:  compositionupdate revalidate tabindex hoc stylesheet
//  LocalWords:  SimpleEventEmitter minified css Ctrl
//  LocalWords:  Ok contenteditable namespaces errorlist navlist li
//  LocalWords:  ul nav sb href jQuery DOM html mixins onerror gui
//  LocalWords:  wundo domlistener oop domutil util validator
//  LocalWords:  jquery Mangalam MPL Dubeau
