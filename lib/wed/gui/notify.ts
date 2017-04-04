/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import "bootstrap-notify";
import * as $ from "jquery";
import * as mergeOptions from "merge-options";

export function notify(message: string,
                       options: mergeOptions.MergeOptionsConfig): void {
  const opts = mergeOptions({
                              element: "body",
                              type: "info",
                              placement: {
                                from: "top",
                                align: "center",
                              },
                              delay: 1000,
                            },
                            options);
  $.notify({
             message: message,
           },
           opts);
}
