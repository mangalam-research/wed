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
define(["require", "exports", "module", "wed/decorator", "wed/domtypeguards", "wed/util"], function (require, exports, module, decorator_1, domtypeguards_1, util) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A decorator for the generic mode.
     */
    var GenericDecorator = (function (_super) {
        __extends(GenericDecorator, _super);
        /**
         * @param mode The mode object.
         *
         * @param metadata Meta-information about the schema.
         *
         * @param options The options object passed to the mode which uses this
         * decorator.
         *
         * @param listener The DOM listener that will listen to changes on the
         * document.
         *
         * @param editor The wed editor to which the mode is applied.
         *
         * @param guiUpdater The updater to use to modify the GUI tree. All
         * modifications to the GUI must go through this updater.
         */
        // tslint:disable-next-line:no-any
        function GenericDecorator(mode, metadata, 
            // tslint:disable-next-line:no-any
            options, domlistener, editor, guiUpdater) {
            var _this = _super.call(this, domlistener, editor, guiUpdater) || this;
            _this.mode = mode;
            _this.metadata = metadata;
            _this.options = options;
            return _this;
        }
        GenericDecorator.prototype.addHandlers = function () {
            var _this = this;
            this.domlistener.addHandler("included-element", util.classFromOriginalName("*"), function (root, tree, parent, prev, next, el) {
                // Skip elements which would already have been removed from the
                // tree. Unlikely but...
                if (!root.contains(el)) {
                    return;
                }
                _this.elementDecorator(root, el);
                var klass = _this.getAdditionalClasses(el);
                if (klass.length > 0) {
                    el.className += " " + klass;
                }
            });
            this.domlistener.addHandler("children-changed", util.classFromOriginalName("*"), function (root, added, removed, previousSibling, nextSibling, el) {
                for (var _i = 0, _a = added.concat(removed); _i < _a.length; _i++) {
                    var child = _a[_i];
                    if (domtypeguards_1.isText(child) || (domtypeguards_1.isElement(child) &&
                        (child.classList.contains("_real") ||
                            child.classList.contains("_phantom_wrap")))) {
                        _this.elementDecorator(root, el);
                        break;
                    }
                }
            });
            this.domlistener.addHandler("text-changed", util.classFromOriginalName("*"), function (root, node) {
                _this.elementDecorator(root, node.parentNode);
            });
            this.domlistener.addHandler("attribute-changed", util.classFromOriginalName("*"), function (root, el) {
                _this.elementDecorator(root, el);
            });
            _super.prototype.addHandlers.call(this);
        };
        GenericDecorator.prototype.elementDecorator = function (root, el) {
            _super.prototype.elementDecorator.call(this, root, el, 1, this.contextMenuHandler.bind(this, true), this.contextMenuHandler.bind(this, false));
        };
        /**
         * Returns additional classes that should apply to a node.
         *
         * @param node The node to check.
         *
         * @returns A string that contains all the class names separated by spaces. In
         * other words, a string that could be put as the value of the ``class``
         * attribute in an HTML tree.
         */
        GenericDecorator.prototype.getAdditionalClasses = function (node) {
            var ret = [];
            if (this.metadata.isInline(node)) {
                ret.push("_inline");
            }
            return ret.join(" ");
        };
        return GenericDecorator;
    }(decorator_1.Decorator));
    exports.GenericDecorator = GenericDecorator;
});
//  LocalWords:  DOM util oop Mangalam MPL Dubeau

//# sourceMappingURL=generic-decorator.js.map
