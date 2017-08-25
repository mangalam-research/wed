/**
 * Ajax utilities for wed.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as bluejax from "bluejax";
import "bootstrap";
import * as $ from "jquery";

import { suppressUnhandledRejections } from "./util";

// tslint:disable-next-line:no-jquery-raw-elements
const $modal = $("\
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

const modal = $modal[0];

// tslint:disable:no-any
export function make(baseOpts: any):
{ ajax: bluejax.AjaxCall, ajax$: bluejax.AjaxCall$ } {
  const bajax = bluejax.make(baseOpts);

  const diagnose = bluejax.make({
    diagnose: {
      on: true,
      knownServers: baseOpts.diagnose.knownServers,
    },
  },
                                "promise");

  function ajax$(settings: any): bluejax.Pair {
    if (arguments.length > 1) {
      throw new Error(
        "we do not support passing the URL as a separate argument; " +
          "please use a single settings argument");
    }

    const ret = bajax.call(undefined, settings);
    ret.promise = ret.promise.catch(
      bluejax.ConnectivityError,
      (err: Error) => {
        document.body.appendChild(modal);
        const reason = modal.querySelector("span.reason")!;
        reason.textContent = err.message;
        $modal.on("hide.bs.modal.modal", (ev: JQueryEventObject) => {
          ev.stopPropagation();
          ev.preventDefault();
          // tslint:disable-next-line:no-floating-promises
          suppressUnhandledRejections(
            diagnose(baseOpts.diagnose.serverURL).then(
              () => {
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

  function ajax(settings: any): Promise<any> {
    return ajax$(settings).promise;
  }

  return {
    ajax: ajax,
    ajax$: ajax$,
  };
}

//  LocalWords:  btw tabindex href btn MPL
