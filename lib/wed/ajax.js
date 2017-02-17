define(function ajaxModule(require, _exports, _module) {
  "use strict";
  var $ = require("jquery");
  var bluejax = require("bluejax");
  require("bootstrap");

  /* eslint-disable no-multi-str */
  var $modal = $(
    "\
<div class='modal btw-fatal-modal' style='position: absolute' tabindex='1'>\
  <div class='modal-dialog'>\
    <div class='modal-content'>\
      <div class='modal-header'>\
        <button type='button' class='close' data-dismiss='modal'\
aria-hidden='true'>&times;</button>\
        <h3>Connectivity Problem</h3>\
      </div>\
      <div class='modal-body'>\
        <p>We have detected a connectivity problem: \
           <span class='reason'></span>.</p>\
        <p>When you click the Ok button, we will recheck the connectivity. \
           If there is still a problem, this dialog will remain. Otherwise, \
           the window will be reloaded. If you were modifying information \
           on the \
           site when the outage occurred, please verify that what you were \
           trying to do actually happened.</p>\
      </div>\
      <div class='modal-footer'>\
        <a href='#' class='btn btn-primary' data-dismiss='modal'>Ok</a>\
      </div>\
    </div>\
  </div>\
</div>");

  var modal = $modal[0];

  return function make(baseOpts) {
    var bajax = bluejax.make(baseOpts);

    var diagnose = bluejax.make({
      diagnose: {
        on: true,
        knownServers: baseOpts.diagnose.knownServers,
      },
    }, "promise");

    function ajax$(settings) {
      if (arguments.length > 1) {
        throw new Error(
          "we do not support passing the url as a separate argument; " +
            "please use a single settings argument");
      }

      var ret = bajax.call(this, settings);
      ret.promise = ret.promise.catch(
        bluejax.ConnectivityError,
        function handle(err) {
          document.body.appendChild(modal);
          var reason = modal.querySelector("span.reason");
          reason.textContent = err.message;
          $modal.on("hide.bs.modal.modal", function hide(ev) {
            ev.stopPropagation();
            ev.preventDefault();
            diagnose(baseOpts.diagnose.serverURL).then(
              function then() {
                window.location.reload();
              }).suppressUnhandledRejections();
          });
          $modal.modal();

          // Cancelling the promise is something that Bluebird
          // provides. It allows us to handle the exception here
          // while at the same time declaring that no future
          // handlers should be run.
          ret.promise.cancel();
        });
      return ret;
    }

    function ajax(settings) {
      return ajax$(settings).promise;
    }

    return {
      ajax: ajax,
      ajax$: ajax$,
    };
  };
});
