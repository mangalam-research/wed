/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "jquery", "merge-options", "bootstrap-notify"], function (require, exports, jquery_1, merge_options_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    jquery_1 = __importDefault(jquery_1);
    merge_options_1 = __importDefault(merge_options_1);
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
            merge_options_1.default(defaultSettings, settings);
        jquery_1.default.notify({ message: message }, s);
    }
    exports.notify = notify;
});
//  LocalWords:  MPL
//# sourceMappingURL=notify.js.map