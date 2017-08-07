/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import "bootstrap-notify";
import * as $ from "jquery";
import * as mergeOptions from "merge-options";

export function notify(message: string, settings: NotifySettings): void {
  const s = mergeOptions({
                              element: "body",
                              type: "info",
                              placement: {
                                from: "top",
                                align: "center",
                              },
                              delay: 1000,
                            },
                            settings);
  $.notify({ message }, s);
}
