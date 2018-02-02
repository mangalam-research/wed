/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import "bootstrap-notify";
import $ from "jquery";
import mergeOptions from "merge-options";

const defaultSettings = {
  element: "body",
  type: "info",
  placement: {
    from: "top",
    align: "center",
  },
  delay: 1000,
};

export function notify(message: string, settings?: NotifySettings): void {
  const s = settings === undefined ? defaultSettings :
    mergeOptions(defaultSettings, settings);
  $.notify({ message }, s);
}

//  LocalWords:  MPL
