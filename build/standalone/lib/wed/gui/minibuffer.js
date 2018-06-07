var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "jquery", "rxjs", "../key-constants"], function (require, exports, jquery_1, rxjs_1, key_constants_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    jquery_1 = __importDefault(jquery_1);
    /**
     * A minibuffer is a kind of single line prompt that allows the user to enter
     * data. As the name suggests, this is inspired from Emacs.
     */
    var Minibuffer = /** @class */ (function () {
        function Minibuffer(top) {
            this._enabled = false;
            /**
             * The object on which this class and subclasses may push new events.
             */
            this._events = new rxjs_1.Subject();
            /**
             * The observable on which clients can listen for events.
             */
            this.events = this._events.asObservable();
            this.$top = jquery_1.default(top);
            this.$top.append("\
<label></label>&nbsp;<input type='text'>");
            this.promptEl = top.getElementsByTagName("label")[0];
            this.input = top.getElementsByTagName("input")[0];
            var $input = this.$input = jquery_1.default(this.input);
            $input.on("input", this.onInput.bind(this));
            $input.on("keypress", this.onKeypress.bind(this));
            $input.on("keydown", this.onKeydown.bind(this));
            this.disable();
        }
        Object.defineProperty(Minibuffer.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            enumerable: true,
            configurable: true
        });
        Minibuffer.prototype.enable = function () {
            this._enabled = true;
            this.input.disabled = false;
            this.input.style.display = "";
            this.input.focus();
        };
        Minibuffer.prototype.disable = function () {
            this._enabled = false;
            this.input.disabled = true;
            this.input.value = "";
            this.input.style.display = "none";
        };
        Minibuffer.prototype.installClient = function (client) {
            this.client = client;
            this.keydownHandler = client.onMinibufferKeydown.bind(client);
            this.clientSubscription =
                this.events.subscribe(client.onMinibufferChange.bind(client));
            this.enable();
        };
        Minibuffer.prototype.uninstallClient = function () {
            var client = this.client;
            if (client === undefined) {
                return;
            }
            this.client = undefined;
            this.keydownHandler = undefined;
            this.clientSubscription.unsubscribe();
            this.disable();
            this.prompt = "";
            this.previous = undefined;
            client.onUninstall();
        };
        Object.defineProperty(Minibuffer.prototype, "prompt", {
            get: function () {
                return this.promptEl.textContent;
            },
            set: function (value) {
                this.promptEl.textContent = value;
            },
            enumerable: true,
            configurable: true
        });
        Minibuffer.prototype.forwardEvent = function (ev) {
            // For keypress events, we have to fill the input ourselves.
            if (ev.type === "keypress") {
                this.input.value += String.fromCharCode(ev.which);
            }
            this.$input.trigger(ev);
        };
        Minibuffer.prototype.onKeydown = function (ev) {
            if (key_constants_1.ESCAPE.matchesEvent(ev)) {
                this.uninstallClient();
                return false;
            }
            if (this.keydownHandler != null && this.keydownHandler(ev) === false) {
                return false;
            }
            return undefined;
        };
        Minibuffer.prototype.onKeypress = function (_ev) {
            var value = this.input.value;
            if (value !== this.previous) {
                this.previous = value;
                this._events.next({ name: "ChangeEvent", value: value });
            }
        };
        Minibuffer.prototype.onInput = function (_ev) {
            var value = this.input.value;
            if (value !== this.previous) {
                this.previous = value;
                this._events.next({ name: "ChangeEvent", value: value });
            }
        };
        return Minibuffer;
    }());
    exports.Minibuffer = Minibuffer;
});
//# sourceMappingURL=minibuffer.js.map