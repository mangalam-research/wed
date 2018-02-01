/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "jquery", "merge-options", "bootstrap-notify"], function (require, exports, $, mergeOptions) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var defaultSettings = {
        element: "body",
        type: "info",
        placement: {
            from: "top",
            align: "center",
        },
        delay: 1000,
    };
    function notify(message, settings) {
        var s = settings === undefined ? defaultSettings :
            mergeOptions(defaultSettings, settings);
        $.notify({ message: message }, s);
    }
    exports.notify = notify;
});
//  LocalWords:  MPL
//# sourceMappingURL=notify.js.map