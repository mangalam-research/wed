/**
 * Exceptions for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "module", "./util"], function (require, exports, module, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This exception is thrown when **voluntarily** aborting a transformation, like
     * if the user is trying to do something which is not allowed in this
     * context. Only transformations can throw this.
     */
    var AbortTransformationException = /** @class */ (function (_super) {
        __extends(AbortTransformationException, _super);
        function AbortTransformationException(message) {
            var _this = _super.call(this, message) || this;
            util_1.fixPrototype(_this, AbortTransformationException);
            return _this;
        }
        return AbortTransformationException;
    }(Error));
    exports.AbortTransformationException = AbortTransformationException;
});
// LocalWords:  Dubeau MPL Mangalam classdesc

//# sourceMappingURL=exceptions.js.map
