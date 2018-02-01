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
define(["require", "exports", "rxjs/Subject", "./action", "./gui/button", "./gui/icon"], function (require, exports, Subject_1, action_1, button_1, icon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function makeAction(desc, abbreviatedDesc, icon, needsInput, fn) {
        var actualAbbreviatedDesc;
        var actualIcon;
        var actualNeedsInput;
        var actualFn;
        if (typeof icon === "boolean") {
            actualAbbreviatedDesc = undefined;
            actualIcon = abbreviatedDesc;
            actualNeedsInput = icon;
            actualFn = needsInput;
        }
        else {
            actualAbbreviatedDesc = abbreviatedDesc;
            actualIcon = icon;
            actualNeedsInput = needsInput;
            actualFn = fn;
        }
        return /** @class */ (function (_super) {
            __extends(class_1, _super);
            function class_1(editor) {
                return _super.call(this, editor, desc, actualAbbreviatedDesc, actualIcon, actualNeedsInput) || this;
            }
            class_1.prototype.execute = function () {
                actualFn(this.editor);
            };
            return class_1;
        }(action_1.Action));
    }
    exports.makeAction = makeAction;
    // tslint:disable-next-line:variable-name
    exports.Save = makeAction("Save", icon_1.makeHTML("upload"), false, function (editor) {
        // tslint:disable-next-line:no-floating-promises
        editor.save();
    });
    // tslint:disable-next-line:variable-name
    exports.Undo = makeAction("Undo", icon_1.makeHTML("undo"), false, function (editor) {
        editor.undo();
    });
    // tslint:disable-next-line:variable-name
    exports.Redo = makeAction("Redo", icon_1.makeHTML("redo"), false, function (editor) {
        editor.redo();
    });
    // tslint:disable-next-line:variable-name
    exports.DecreaseLabelVisibilityLevel = makeAction("Decrease label visibility level", "Decrease label visibility", icon_1.makeHTML("arrow-down"), false, function (editor) {
        editor.decreaseLabelVisiblityLevel();
    });
    // tslint:disable-next-line:variable-name
    exports.IncreaseLabelVisibilityLevel = makeAction("Increase label visibility level", "Increase label visibility", icon_1.makeHTML("arrow-up"), false, function (editor) {
        editor.increaseLabelVisibilityLevel();
    });
    /**
     * An action that toggles the editors attribute hiding.
     */
    var ToggleAttributeHiding = /** @class */ (function (_super) {
        __extends(ToggleAttributeHiding, _super);
        function ToggleAttributeHiding(editor) {
            var _this = _super.call(this, editor, "Toggle attribute hiding", "AH", undefined, false) || this;
            _this.pressed = true;
            /**
             * The object on which this class and subclasses may push new events.
             */
            _this._events = new Subject_1.Subject();
            /**
             * The observable on which clients can listen for events.
             */
            _this.events = _this._events.asObservable();
            return _this;
        }
        ToggleAttributeHiding.prototype.execute = function (data) {
            if (this.pressed !== data) {
                this.pressed = data;
                this.editor.toggleAttributeHiding();
                this._events.next({ name: "Pressed", action: this });
            }
        };
        ToggleAttributeHiding.prototype.makeButton = function (data) {
            var _this = this;
            var button = new button_1.ToggleButton(this.pressed, data !== undefined ? this.getDescriptionFor(data) : this.getDescription(), this.getAbbreviatedDescription(), this.getIcon());
            button.events.subscribe(function () {
                _this.execute(button.pressed);
            });
            this.events.subscribe(function () {
                button.pressed = _this.pressed;
            });
            return button;
        };
        return ToggleAttributeHiding;
    }(action_1.Action));
    exports.ToggleAttributeHiding = ToggleAttributeHiding;
});
//# sourceMappingURL=editor-actions.js.map