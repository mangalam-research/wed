/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:wed/gui/notify */function f(require, exports) {
  "use strict";

  var $ = require("jquery");
  var mergeOptions = require("merge-options");
  require("bootstrap-notify");

  function notify(message, options) {
    var opts = mergeOptions({
      element: "body",
      type: "info",
      placement: {
        from: "top",
        align: "center",
      },
      delay: 1000,
    }, options);
    $.notify({
      message: message,
    }, opts);
  }

  exports.notify = notify;
});
