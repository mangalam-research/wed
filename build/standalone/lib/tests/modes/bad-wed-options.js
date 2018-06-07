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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "merge-options", "wed/modes/test/test-mode"], function (require, exports, merge_options_1, test_mode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    merge_options_1 = __importDefault(merge_options_1);
    // tslint:disable-next-line:completed-docs
    var FakeMode = /** @class */ (function (_super) {
        __extends(FakeMode, _super);
        function FakeMode(editor, options) {
            var _this = _super.call(this, editor, options) || this;
            _this.wedOptions = merge_options_1.default({}, _this.wedOptions);
            // Oh god, that as "hide" bit is funny as hell. Anyway we need it to
            // purposely put a crap value there.
            _this.wedOptions.attributes = "moo";
            return _this;
        }
        return FakeMode;
    }(test_mode_1.Mode));
    exports.Mode = FakeMode;
});
//# sourceMappingURL=bad-wed-options.js.map