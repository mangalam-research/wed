define(["last-resort", "bluebird"], function f(lr) {
  "use strict";
  // This ensures that Bluebird is loaded when last-resort is used. Bluebird is
  // necessary to get onunhandledrejection on some platforms.

  return lr;
});
