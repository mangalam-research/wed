/**
 * The main module for the generic mode.
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
define(["require", "exports", "module", "bluebird", "salve", "wed/mode", "wed/object-check", "./generic-decorator", "./generic-tr", "./metadata-multiversion-reader"], function (require, exports, module, Promise, salve_1, mode_1, objectCheck, generic_decorator_1, generic_tr_1, metadata_multiversion_reader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This is the class that implements the generic mode. This mode decorates all
     * the elements of the file being edited. On the basis of the schema used by wed
     * for validation, it allows the addition of the elements authorized by the
     * schema.
     *
     * Recognized options:
     *
     * - ``metadata``: this option can be a path (a string) pointing to a module
     *   that implements the metadata needed by the mode.
     *
     * - ``autoinsert``: whether or not to fill newly inserted elements as much as
     *   possible. If this option is true, then when inserting a new element, the
     *   mode will try to detect whether the element has any mandatory children and
     *   if so will add these children to the element. For instance, if ``foo`` is
     *   invalid without the child ``baz`` then when inserting ``foo`` in the
     *   document, the following structure would be inserted
     *   ``<foo><baz></baz></foo>``. This automatic insertion of children happens
     *   only in non-ambiguous cases. Taking the same example as before, if ``foo``
     *   could contain ``a`` or ``b``, then the mode won't add any children. This
     *   option is ``true`` by default.
     */
    var GenericMode = (function (_super) {
        __extends(GenericMode, _super);
        /**
         * @param editor The editor with which the mode is being associated.
         *
         * @param options The options for the mode.
         */
        // tslint:disable-next-line:no-any
        function GenericMode(editor, options) {
            var _this = _super.call(this, editor, options) || this;
            /**
             * The template that [[checkOptions]] uses to check the options passed
             * to this mode. Consider this object to be immutable.
             */
            _this.optionTemplate = {
                metadata: true,
                autoinsert: false,
            };
            if (_this.constructor === GenericMode) {
                // Set our metadata.
                _this.wedOptions.metadata = {
                    name: "Generic",
                    authors: ["Louis-Dominique Dubeau"],
                    description: "This is a basic mode bundled with wed and which can, " +
                        "and probably should be used as the base for other modes.",
                    license: "MPL 2.0",
                    copyright: "Mangalam Research Center for Buddhist Languages",
                };
            }
            // else it is up to the derived class to set it.
            _this.wedOptions.attributes = "edit";
            return _this;
        }
        GenericMode.prototype.init = function () {
            var _this = this;
            this.checkOptions(this.options);
            if (this.options.autoinsert === undefined) {
                this.options.autoinsert = true;
            }
            return Promise.resolve()
                .then(function () {
                _this.tagTr = generic_tr_1.makeTagTr(_this.editor);
                return _this.makeMetadata().then(function (metadata) {
                    _this.metadata = metadata;
                });
            })
                .then(function () {
                _this.resolver = new salve_1.NameResolver();
                var mappings = _this.metadata.getNamespaceMappings();
                for (var _i = 0, _a = Object.keys(mappings); _i < _a.length; _i++) {
                    var key = _a[_i];
                    _this.resolver.definePrefix(key, mappings[key]);
                }
            });
        };
        /**
         * Check that the options are okay. This method will throw if there are any
         * unexpected options or mandatory options are missing.
         *
         * @param options The options to check.
         */
        GenericMode.prototype.checkOptions = function (options) {
            // tslint:disable-next-line:no-any
            var ret = objectCheck.check(this.optionTemplate, options);
            var errors = [];
            if (ret.missing !== undefined) {
                for (var _i = 0, _a = ret.missing; _i < _a.length; _i++) {
                    var name_1 = _a[_i];
                    errors.push("missing option: " + name_1);
                }
            }
            if (ret.extra !== undefined) {
                for (var _b = 0, _c = ret.extra; _b < _c.length; _b++) {
                    var name_2 = _c[_b];
                    errors.push("extra option: " + name_2);
                }
            }
            if (errors.length !== 0) {
                throw new Error("incorrect options: " + errors.join(", "));
            }
        };
        /**
         * Make a [[Metadata]] object for use with this mode. The default
         * implementation requires that there be a ``metadata`` option set and
         * uses that to load a metadata file. Derived classes can override
         * this as needed.
         */
        GenericMode.prototype.makeMetadata = function () {
            return this.editor.runtime.resolveToString(this.options.metadata)
                .then(function (data) {
                var obj = JSON.parse(data);
                return new metadata_multiversion_reader_1.MetadataMultiversionReader().read(obj);
            });
        };
        GenericMode.prototype.getAbsoluteResolver = function () {
            return this.resolver;
        };
        GenericMode.prototype.makeDecorator = function () {
            var obj = Object.create(generic_decorator_1.GenericDecorator.prototype);
            var args = Array.prototype.slice.call(arguments);
            args = [this, this.metadata, this.options].concat(args);
            generic_decorator_1.GenericDecorator.apply(obj, args);
            return obj;
        };
        /**
         * Returns a short description for an element. The element should be named
         * according to the mappings reported by the resolve returned by
         * [["mode".Mode.getAbsoluteResolver]]. The generic mode delegates the call to
         * the metadata.
         *
         * @param name The name of the element.
         *
         * @returns The description. If the value returned is ``undefined``, then the
         * description is not available. If the value returned is ``null``, the
         * description has not been loaded yet.
         */
        GenericMode.prototype.shortDescriptionFor = function (name) {
            var ename = this.resolver.resolveName(name);
            if (ename === undefined) {
                return undefined;
            }
            return this.metadata.shortDescriptionFor(ename);
        };
        /**
         * Returns a URL to the documentation for an element. The element should be
         * named according to the mappings reported by the resolve returned by
         * [["mode".Mode.getAbsoluteResolver]]. The generic mode delegates the call to
         * the metadata.
         *
         * @param name The name of the element.
         *
         * @returns The URL. If the value returned is ``undefined``, then URL is not
         * available. If the value returned is ``null``, the URL has not been loaded
         * yet.
         */
        GenericMode.prototype.documentationLinkFor = function (name) {
            var ename = this.resolver.resolveName(name);
            if (ename === undefined) {
                return undefined;
            }
            return this.metadata.documentationLinkFor(ename);
        };
        /**
         * The generic mode's implementation merely returns what it has stored in its
         * transformation registry.
         */
        GenericMode.prototype.getContextualActions = function (transformationType, tag, container, offset) {
            if (!(transformationType instanceof Array)) {
                transformationType = [transformationType];
            }
            var ret = [];
            for (var _i = 0, transformationType_1 = transformationType; _i < transformationType_1.length; _i++) {
                var ttype = transformationType_1[_i];
                var val = this.tagTr[ttype];
                if (val !== undefined) {
                    ret.push(val);
                }
            }
            return ret;
        };
        return GenericMode;
    }(mode_1.BaseMode));
    exports.Mode = GenericMode;
});
//  LocalWords:  gui jquery Mangalam MPL Dubeau

//# sourceMappingURL=generic.js.map
