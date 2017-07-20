define(["require", "exports", "module", "bluebird", "jquery"], function (require, exports, module, Promise, $) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Meta-information for the generic mode. This is information that cannot be
     * simply derived from the schema.
     *
     * Objects of this class take the following options:
     *
     * + ``metadata``: a URL to a JSON file that contains metadata that
     * this meta should read.
     *
     * It is illegal to use the meta before the value from ``init`` has resolved.
     */
    var Meta = (function () {
        /**
         * @param runtime The runtime in which this meta is executing.
         *
         * @param options The options to pass to the Meta.
         */
        function Meta(runtime, 
            // tslint:disable-next-line:no-any
            options) {
            if (options === void 0) { options = {}; }
            this.runtime = runtime;
            this.options = options;
            this.descMap = null;
        }
        /**
         * Initialize the meta.
         *
         * @returns A promise that resolves when the meta is ready.
         */
        Meta.prototype.init = function () {
            var _this = this;
            return Promise.resolve()
                .then(function () {
                var options = _this.options;
                var resolved = $.extend(true, {}, options);
                if (options != null && options.metadata != null) {
                    return _this.runtime.resolveToString(options.metadata)
                        .then(function (data) {
                        data = JSON.parse(data);
                        resolved.metadata = data;
                        _this.options = resolved;
                    });
                }
                return undefined;
            })
                .then(function () {
                _this.metadata = _this.options.metadata;
                if (_this.metadata != null) {
                    if (_this.metadata.version !== "1") {
                        throw new Error("unexpected version number: " + _this.metadata.version);
                    }
                    _this.namespaceMappings = _this.metadata.namespaces;
                    if ("xml" in _this.namespaceMappings) {
                        throw new Error("xml mapping already defined");
                    }
                    // tslint:disable-next-line:no-http-string
                    _this.namespaceMappings.xml = "http://www.w3.org/XML/1998/namespace";
                    _this.reverseMapping = Object.create(null);
                    // tslint:disable-next-line:forin
                    for (var prefix in _this.namespaceMappings) {
                        var ns = _this.namespaceMappings[prefix];
                        // If prefix foo resolves to http://bar and bar resolves to the same
                        // URI and foo is before bar, then foo wins.
                        if (_this.reverseMapping[ns] === undefined) {
                            _this.reverseMapping[ns] = prefix;
                        }
                    }
                    _this.reverseMapping[_this.namespaceMappings[""]] = "";
                    var elements = _this.metadata.elements;
                    var descMap = Object.create(null);
                    for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
                        var el = elements_1[_i];
                        // Here, an undefined namespace is the tei namespace.
                        var elNs = el.ns !== undefined ? el.ns :
                            // tslint:disable-next-line:no-http-string
                            "http://www.tei-c.org/ns/1.0";
                        var elPrefix = _this.reverseMapping[elNs];
                        if (elPrefix === undefined) {
                            throw new Error("undefined namespace: " + elNs);
                        }
                        var name_1 = elPrefix === "" ? el.name : elPrefix + ":" + el.name;
                        descMap[name_1] = el.desc;
                    }
                    _this.descMap = descMap;
                }
            });
        };
        /**
         * This method determines whether a node needs to be represented inline.
         *
         * @param node The node to examine.
         *
         * @return True if the node should be inline, false otherwise.
         */
        Meta.prototype.isInline = function (node) {
            return false;
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
        Meta.prototype.getAdditionalClasses = function (node) {
            var ret = [];
            if (this.isInline(node)) {
                ret.push("_inline");
            }
            return ret.join(" ");
        };
        /**
         * Returns absolute namespace mappings. The default implementation returns an
         * empty mapping.
         *
         * @returns An object whose keys are namespace prefixes and values are
         * namespace URIs. The object returned by this method should not be modified.
         */
        Meta.prototype.getNamespaceMappings = function () {
            return this.namespaceMappings;
        };
        /**
         * Returns a short description for an element. The element should be named
         * according to the mappings reported by [[Meta.getNamespaceMappings]]. The
         * default implementation returns the description provided by the metadata
         * file loaded when the Meta object was created.
         *
         * While this API provides for the case where descriptions have not been
         * loaded yet or cannot be loaded, this class does not allow such eventuality
         * to occur. Derived classes could allow it.
         *
         * @param name The name of the element.
         *
         * @returns The description. If the value returned is ``undefined``, then the
         * description is not available. If the value returned is ``null``, the
         * description has not been loaded yet.
         */
        Meta.prototype.shortDescriptionFor = function (name) {
            return this.descMap != null ? this.descMap[name] : null;
        };
        /**
         * Returns a URL to the documentation for an element. The element should be
         * named according to the mappings reported by the resolve returned by
         * [["mode".Mode.getAbsoluteResolver]].
         *
         * While this API provides for the case such URL have not been loaded yet or
         * cannot be loaded, this class does not allow such eventuality to
         * occur. Derived classes could allow it.
         *
         * @param name The name of the element.
         *
         * @returns The URL. If the value returned is ``undefined``, then the URL is
         * not available. If the value returned is ``null``, the URL has not been
         * loaded yet.
         */
        Meta.prototype.documentationLinkFor = function (name) {
            if (this.metadata == null) {
                return undefined;
            }
            var root = this.metadata.dochtml;
            // The TEI odd2html stylesheet creates file names of the form
            // prefix_local-name.html. So replace the colon with an underscore.
            name = name.replace(":", "_");
            return root + "ref-" + name + ".html";
        };
        return Meta;
    }());
    exports.Meta = Meta;
});
//  LocalWords:  classdesc Mangalam MPL Dubeau

//# sourceMappingURL=generic-meta.js.map
