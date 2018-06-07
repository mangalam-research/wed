var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "bluejax", "jquery", "./util", "bootstrap"], function (require, exports, bluejax, jquery_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    bluejax = __importStar(bluejax);
    jquery_1 = __importDefault(jquery_1);
    // tslint:disable-next-line:no-jquery-raw-elements
    var $modal = jquery_1.default("\
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
    // tslint:disable:no-any
    function make(baseOpts) {
        var bajax = bluejax.make(baseOpts);
        var diagnose = bluejax.make({
            diagnose: {
                on: true,
                knownServers: baseOpts.diagnose.knownServers,
            },
        }, "promise");
        function ajax$(settings) {
            if (arguments.length > 1) {
                throw new Error("we do not support passing the URL as a separate argument; " +
                    "please use a single settings argument");
            }
            var ret = bajax.call(undefined, settings);
            ret.promise = ret.promise.catch(bluejax.ConnectivityError, function (err) {
                document.body.appendChild(modal);
                var reason = modal.querySelector("span.reason");
                reason.textContent = err.message;
                $modal.on("hide.bs.modal.modal", function (ev) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    // tslint:disable-next-line:no-floating-promises
                    util_1.suppressUnhandledRejections(diagnose(baseOpts.diagnose.serverURL).then(function () {
                        window.location.reload();
                    }));
                });
                $modal.modal();
                // Canceling the promise is something that Bluebird provides. It allows
                // us to handle the exception here while at the same time declaring that
                // no future handlers should be run.
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
    }
    exports.make = make;
});
//  LocalWords:  btw tabindex href btn MPL
//# sourceMappingURL=ajax.js.map