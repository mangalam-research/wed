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
define(["require", "exports", "wed"], function (require, exports, wed_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var isElement = wed_1.domtypeguards.isElement, isText = wed_1.domtypeguards.isText;
    /**
     * A decorator for the generic mode.
     */
    var GenericDecorator = /** @class */ (function (_super) {
        __extends(GenericDecorator, _super);
        /**
         * @param mode The mode object.
         *
         * @param editor The wed editor to which the mode is applied.
         *
         * @param metadata Meta-information about the schema.
         *
         * @param options The options object passed to the mode which uses this
         * decorator.
         *
         */
        // tslint:disable-next-line:no-any
        function GenericDecorator(mode, editor, metadata, 
        // tslint:disable-next-line:no-any
        options) {
            var _this = _super.call(this, mode, editor) || this;
            _this.metadata = metadata;
            _this.options = options;
            return _this;
        }
        GenericDecorator.prototype.addHandlers = function () {
            var _this = this;
            this.domlistener.addHandler("included-element", wed_1.util.classFromOriginalName("*", {}), function (root, _tree, _parent, _prev, _next, el) {
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
            this.domlistener.addHandler("children-changed", wed_1.util.classFromOriginalName("*", {}), function (root, added, removed, _previousSibling, _nextSibling, el) {
                for (var _i = 0, _a = added.concat(removed); _i < _a.length; _i++) {
                    var child = _a[_i];
                    if (isText(child) || (isElement(child) &&
                        (child.classList.contains("_real") ||
                            child.classList.contains("_phantom_wrap")))) {
                        _this.elementDecorator(root, el);
                        break;
                    }
                }
            });
            this.domlistener.addHandler("text-changed", wed_1.util.classFromOriginalName("*", {}), function (root, node) {
                _this.elementDecorator(root, node.parentNode);
            });
            this.domlistener.addHandler("attribute-changed", wed_1.util.classFromOriginalName("*", {}), function (root, el) {
                _this.elementDecorator(root, el);
            });
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
    }(wed_1.Decorator));
    exports.GenericDecorator = GenericDecorator;
});
//  LocalWords:  Dubeau MPL Mangalam util klass
//# sourceMappingURL=generic-decorator.js.map