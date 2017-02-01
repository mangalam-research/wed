/**
 * @module modes/generic/metas/docbook_meta
 * @desc The main module for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/generic/metas/docbook_meta */
function (require, exports, module) {
'use strict';

var oop = require("wed/oop");
var util = require("wed/util");
var GenericMeta = require("wed/modes/generic/generic_meta").Meta;

/**
 * @classdesc Meta-information for a generic DocBook schema.
 *
 * @extends module:modes/generic/generic_meta~Meta
 *
 * @constructor
 * @param {Object} options The options to pass to the Meta.
 */
function DocBookMeta(options) {
    GenericMeta.apply(this, arguments);

    // Provide a default mapping if there is no mapping loaded.
    if (!this._namespace_mappings) {
        this._namespace_mappings = Object.create(null);
        this._namespace_mappings.xml =
            "http://www.w3.org/XML/1998/namespace";
        this._namespace_mappings[""] = "http://docbook.org/ns/docbook";
        this._namespace_mappings.svg = "http://www.w3.org/2000/svg";
        this._namespace_mappings.mml = "http://www.w3.org/1998/Math/MathML";
        this._namespace_mappings.xlink = "http://www.w3.org/1999/xlink";
   }
}

oop.inherit(DocBookMeta, GenericMeta);

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
