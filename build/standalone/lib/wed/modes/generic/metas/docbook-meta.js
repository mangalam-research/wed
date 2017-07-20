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
define(["require", "exports", "module", "wed/modes/generic/generic-meta"], function (require, exports, module, generic_meta_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Meta-information for a generic DocBook schema.
     */
    var DocBookMeta = (function (_super) {
        __extends(DocBookMeta, _super);
        /**
         * @param runtime The runtime in which this meta is executing.
         *
         * @param options The options to pass to the Meta.
         */
        // tslint:disable-next-line:no-any
        function DocBookMeta(runtime, options) {
            var _this = _super.call(this, runtime, options) || this;
            // Provide a default mapping if there is no mapping loaded.
            if (_this.namespaceMappings == null) {
                _this.namespaceMappings = Object.create(null);
                // tslint:disable:no-http-string
                _this.namespaceMappings.xml = "http://www.w3.org/XML/1998/namespace";
                _this.namespaceMappings[""] = "http://docbook.org/ns/docbook";
                _this.namespaceMappings.svg = "http://www.w3.org/2000/svg";
                _this.namespaceMappings.mml = "http://www.w3.org/1998/Math/MathML";
                _this.namespaceMappings.xlink = "http://www.w3.org/1999/xlink";
                // tslint:enable:no-http-string
            }
            return _this;
        }
        return DocBookMeta;
    }(generic_meta_1.Meta));
    exports.Meta = DocBookMeta;
});
//  LocalWords:  oMath dynamicContent textLang soCalled roleName seg
//  LocalWords:  pubPlace ptr placeName persName pc origPlace orgName
//  LocalWords:  origDate num msName monogr Mangalam metas tei Dubeau
//  LocalWords:  MPL oop util namespace stylesheets isEndNote
//  LocalWords:  isFootNote xsl biblStruct titlePage floatingText sp
//  LocalWords:  bibl docAuthor mml altIdentifier listBibl biblScope
//  LocalWords:  editionStmt att br del emph expan genName geogName
//  LocalWords:  gi ident idno

//# sourceMappingURL=docbook-meta.js.map
