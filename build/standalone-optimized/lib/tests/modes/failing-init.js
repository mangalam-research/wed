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
define(["require", "exports", "module", "wed/modes/test/test-mode"], function (require, exports, module, test_mode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:completed-docs
    var FakeMode = /** @class */ (function (_super) {
        __extends(FakeMode, _super);
        function FakeMode() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        FakeMode.prototype.init = function () {
            return Promise.reject(new Error("failed init"));
        };
        return FakeMode;
    }(test_mode_1.Mode));
    exports.Mode = FakeMode;
});

//# sourceMappingURL=failing-init.js.map
