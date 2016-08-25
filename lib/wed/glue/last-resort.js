define(["last-resort", "bluebird"], function (lr) {

// This ensures that Bluebird is loaded when last-resort is used. Bluebird is
// necessary to get onunhandledrejection on some platforms.

return lr;

});
