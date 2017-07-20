/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module", "jquery", "merge-options", "bootstrap-notify"], function (require, exports, module, $, mergeOptions) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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

//# sourceMappingURL=notify.js.map
