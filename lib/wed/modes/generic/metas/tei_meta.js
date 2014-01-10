/**
 * @module modes/generic/metas/tei_meta
 * @desc The main module for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/generic/metas/tei_meta */
function (require, exports, module) {
'use strict';

var $ = require("jquery");
var oop = require("wed/oop");
var util = require("wed/util");
var GenericMeta = require("wed/modes/generic/generic_meta").Meta;

/**
 * @classdesc Meta-information for a generic TEI schema.
 *
 * @extends module:modes/generic/generic_meta~Meta
 *
 * @constructor
 * @param {Object} options The options to pass to the Meta.
 */
function TeiMeta(options) {
    GenericMeta.apply(this, arguments);

    // Provide a default mapping if there is no mapping loaded.
    if (!this._namespace_mappings) {
        this._namespace_mappings = Object.create(null);
        this._namespace_mappings.xml =
            "http://www.w3.org/XML/1998/namespace";
        this._namespace_mappings[""] = "http://www.tei-c.org/ns/1.0";
    }
}

oop.inherit(TeiMeta, GenericMeta);

TeiMeta.prototype.isInline = function (node) {
    var $node = $(node);
    // We need to normalize the name to fit the names we have below.
    var original_name = util.getOriginalName(node);
    var parts = original_name.split(":");
    // XXX this is taking a shortcut. We should instead find the
    // namespace of the node and convert it to an appropriate prefix
    // to use below.
    if (parts.length === 1) {
        parts[1] = parts[0];
        parts[0] = "tei";
    }
    var name = parts.join(":");

    // The implementation here is a partial implementation of the
    // function found in common2/functions.xsl among the TEI
    // stylesheets.

    // Not implemented: <xsl:when test="not(self::*)">true</xsl:when>
    // <xsl:when test="contains(@rend,'inline') and not(tei:p or
    // tei:l)">true</xsl:when> <xsl:when
    // test="self::tei:note[@place='display']">false</xsl:when>
    // <xsl:when
    // test="self::tei:note[tei:isEndNote(.)]">true</xsl:when>
    // <xsl:when
    // test="self::tei:note[tei:isFootNote(.)]">true</xsl:when>
    // <xsl:when test="@rend='display'
    // or @rend='block'">false</xsl:when> <xsl:when test="tei:table or
    // tei:figure or tei:list or tei:lg or tei:q/tei:l or tei:l or
    // tei:p or tei:biblStruct or tei:sp or
    // tei:floatingText">false</xsl:when> <xsl:when
    // test="parent::tei:div">false</xsl:when> <xsl:when
    // test="parent::tei:titlePage">false</xsl:when> <xsl:when
    // test="self::tei:cit[not(@rend)]">true</xsl:when> <xsl:when
    // test="parent::tei:cit[@rend='display']">false</xsl:when>
    // <xsl:when test="parent::tei:cit and (tei:p or
    // tei:l)">false</xsl:when> <xsl:when test="parent::tei:cit and
    // parent::cit/tei:bibl">false</xsl:when> <xsl:when
    // test="parent::tei:body">false</xsl:when> <xsl:when
    // test="parent::tei:titlePage">false</xsl:when> <xsl:when
    // test="self::tei:docAuthor and
    // parent::tei:byline">true</xsl:when> <xsl:when
    // test="self::tei:note[tei:cit/tei:bibl]">false</xsl:when>
    // <xsl:when
    // test="self::tei:note[parent::tei:biblStruct]">true</xsl:when>
    // <xsl:when
    // test="self::tei:note[parent::tei:bibl]">true</xsl:when> End not
    // implemented.


    // <xsl:when test="self::tei:note">true</xsl:when>
    // <xsl:when test="self::mml:math">true</xsl:when>
    // <xsl:when test="self::tei:abbr">true</xsl:when>
    // <xsl:when test="self::tei:affiliation">true</xsl:when>
    // <xsl:when test="self::tei:altIdentifier">true</xsl:when>
    // <xsl:when test="self::tei:analytic">true</xsl:when>
    // <xsl:when test="self::tei:add">true</xsl:when>
    // <xsl:when test="self::tei:am">true</xsl:when>
    // <xsl:when test="self::tei:att">true</xsl:when>
    // <xsl:when test="self::tei:author">true</xsl:when>
    switch (name) {
    case "tei:note":
    case "mml:math":
    case "tei:abbr":
    case "tei:affiliation":
    case "tei:altIdentifier":
    case "tei:analytic":
    case "tei:add":
    case "tei:am":
    case "tei:att":
    case "tei:author":
        return true;
    }

    // Not implemented: <xsl:when test="self::tei:bibl and not
    // (tei:is-inline(preceding-sibling::*[1]))">false</xsl:when>
    // <xsl:when test="self::tei:bibl and not
    // (parent::tei:listBibl)">true</xsl:when> End not implemented.

    // <xsl:when test="self::tei:biblScope">true</xsl:when>
    // <xsl:when test="self::tei:br">true</xsl:when>
    // <xsl:when test="self::tei:byline">true</xsl:when>
    // <xsl:when test="self::tei:c">true</xsl:when>
    // <xsl:when test="self::tei:caesura">true</xsl:when>
    // <xsl:when test="self::tei:choice">true</xsl:when>
    // <xsl:when test="self::tei:code">true</xsl:when>
    // <xsl:when test="self::tei:collection">true</xsl:when>
    // <xsl:when test="self::tei:country">true</xsl:when>
    // <xsl:when test="self::tei:damage">true</xsl:when>
    // <xsl:when test="self::tei:date">true</xsl:when>
    // <xsl:when test="self::tei:del">true</xsl:when>
    // <xsl:when test="self::tei:depth">true</xsl:when>
    // <xsl:when test="self::tei:dim">true</xsl:when>
    // <xsl:when test="self::tei:dimensions">true</xsl:when>
    // <xsl:when test="self::tei:editor">true</xsl:when>
    // <xsl:when test="self::tei:editionStmt">true</xsl:when>
    // <xsl:when test="self::tei:emph">true</xsl:when>
    // <xsl:when test="self::tei:ex">true</xsl:when>
    // <xsl:when test="self::tei:expan">true</xsl:when>
    switch(name) {
    case "tei:biblScope":
    case "tei:br":
    case "tei:byline":
    case "tei:c":
    case "tei:caesura":
    case "tei:choice":
    case "tei:code":
    case "tei:collection":
    case "tei:country":
    case "tei:damage":
    case "tei:date":
    case "tei:del":
    case "tei:depth":
    case "tei:dim":
    case "tei:dimensions":
    case "tei:editor":
    case "tei:editionStmt":
    case "tei:emph":
    case "tei:ex":
    case "tei:expan":
        return true;
    }

    // Not implemented:
    // <xsl:when test="self::tei:figure[@place='inline']">true</xsl:when>
    // End Not implemented.

    // <xsl:when test="self::tei:figure">false</xsl:when>
    // <xsl:when test="self::tei:floatingText">false</xsl:when>
    // <xsl:when test="self::tei:foreign">true</xsl:when>
    // <xsl:when test="self::tei:forename">true</xsl:when>
    // <xsl:when test="self::tei:gap">true</xsl:when>
    // <xsl:when test="self::tei:genName">true</xsl:when>
    // <xsl:when test="self::tei:geogName">true</xsl:when>
    // <xsl:when test="self::tei:gi">true</xsl:when>
    // <xsl:when test="self::tei:gloss">true</xsl:when>
    // <xsl:when test="self::tei:graphic">true</xsl:when>
    // <xsl:when test="self::tei:height">true</xsl:when>
    // <xsl:when test="self::tei:hi[not(w:*)]">true</xsl:when>
    // <xsl:when test="self::tei:ident">true</xsl:when>
    // <xsl:when test="self::tei:idno">true</xsl:when>
    // <xsl:when test="self::tei:imprint">true</xsl:when>
    // <xsl:when test="self::tei:institution">true</xsl:when>
    switch(name) {
    case "tei:figure":
    case "tei:floatingText":
        return false;
    case "tei:foreign":
    case "tei:forename":
    case "tei:gap":
    case "tei:genName":
    case "tei:geogName":
    case "tei:gi":
    case "tei:gloss":
    case "tei:graphic":
    case "tei:height":
    case "tei:hi":
        // The original test was:
        // <xsl:when test="self::tei:hi[not(w:*)]">true</xsl:when>
    case "tei:ident":
    case "tei:idno":
    case "tei:imprint":
    case "tei:institution":
        return true;
    }

    // <xsl:when test="self::tei:list">false</xsl:when>
    // <xsl:when test="self::tei:locus">true</xsl:when>
    // <xsl:when test="self::tei:mentioned">true</xsl:when>
    // <xsl:when test="self::tei:monogr">true</xsl:when>
    // <xsl:when test="self::tei:series">true</xsl:when>
    // <xsl:when test="self::tei:msName">true</xsl:when>
    // <xsl:when test="self::tei:name">true</xsl:when>
    // <xsl:when test="self::tei:num">true</xsl:when>
    // <xsl:when test="self::tei:orgName">true</xsl:when>
    // <xsl:when test="self::tei:orig">true</xsl:when>
    // <xsl:when test="self::tei:origDate">true</xsl:when>
    // <xsl:when test="self::tei:origPlace">true</xsl:when>
    // <xsl:when test="self::tei:pc">true</xsl:when>
    // <xsl:when test="self::tei:persName">true</xsl:when>
    // <xsl:when test="self::tei:placeName">true</xsl:when>
    // <xsl:when test="self::tei:ptr">true</xsl:when>
    // <xsl:when test="self::tei:publisher">true</xsl:when>
    // <xsl:when test="self::tei:pubPlace">true</xsl:when>

    switch(name) {
    case "tei:list":
        return false;
    case "tei:locus":
    case "tei:mentioned":
    case "tei:monogr":
    case "tei:series":
    case "tei:msName":
    case "tei:name":
    case "tei:num":
    case "tei:orgName":
    case "tei:orig":
    case "tei:origDate":
    case "tei:origPlace":
    case "tei:pc":
    case "tei:persName":
    case "tei:placeName":
    case "tei:ptr":
    case "tei:publisher":
    case "tei:pubPlace":
        return true;
    }

    // Not implemented: <xsl:when test="self::tei:lb or
    // self::pb">true</xsl:when> <xsl:when test="self::tei:quote and
    // tei:lb">false</xsl:when> <xsl:when test="self::tei:quote and
    // $autoBlockQuote='true' and
    // string-length(.)&gt;$autoBlockQuoteLength">false</xsl:when> End
    // not implemented.

    // <xsl:when test="self::tei:q">true</xsl:when>
    // <xsl:when test="self::tei:quote">true</xsl:when>
    // <xsl:when test="self::tei:ref">true</xsl:when>
    // <xsl:when test="self::tei:region">true</xsl:when>
    // <xsl:when test="self::tei:repository">true</xsl:when>
    // <xsl:when test="self::tei:roleName">true</xsl:when>
    // <xsl:when test="self::tei:rubric">true</xsl:when>
    // <xsl:when test="self::tei:said">true</xsl:when>
    // <xsl:when test="self::tei:seg">true</xsl:when>
    // <xsl:when test="self::tei:sic">true</xsl:when>
    // <xsl:when test="self::tei:settlement">true</xsl:when>
    // <xsl:when test="self::tei:soCalled">true</xsl:when>
    // <xsl:when test="self::tei:summary">true</xsl:when>
    // <xsl:when test="self::tei:supplied">true</xsl:when>
    // <xsl:when test="self::tei:surname">true</xsl:when>
    // <xsl:when test="self::tei:tag">true</xsl:when>
    // <xsl:when test="self::tei:term">true</xsl:when>
    // <xsl:when test="self::tei:textLang">true</xsl:when>
    // <xsl:when test="self::tei:title">true</xsl:when>
    // <xsl:when test="self::tei:unclear">true</xsl:when>
    // <xsl:when test="self::tei:val">true</xsl:when>
    // <xsl:when test="self::tei:width">true</xsl:when>
    // <xsl:when test="self::tei:dynamicContent">true</xsl:when>
    // <xsl:when test="self::w:drawing">true</xsl:when>
    // <xsl:when test="self::m:oMath">true</xsl:when>
    switch(name) {
    case "tei:q":
    case "tei:quote":
    case "tei:ref":
    case "tei:region":
    case "tei:repository":
    case "tei:roleName":
    case "tei:rubric":
    case "tei:said":
    case "tei:seg":
    case "tei:sic":
    case "tei:settlement":
    case "tei:soCalled":
    case "tei:summary":
    case "tei:supplied":
    case "tei:surname":
    case "tei:tag":
    case "tei:term":
    case "tei:textLang":
    case "tei:title":
    case "tei:unclear":
    case "tei:val":
    case "tei:width":
    case "tei:dynamicContent":
    case "w:drawing":
    case "m:oMath":
        return true;
    }

    // Not implemented: <xsl:when
    // test="parent::tei:note[tei:isEndNote(.)]">false</xsl:when>
    // <xsl:when test="empty($element/..)">false</xsl:when> <xsl:when
    // test="not(self::tei:p) and
    // tei:is-inline($element/..)">true</xsl:when> End not
    // implemented.
    return false;
};

exports.Meta = TeiMeta;

});

//  LocalWords:  oMath dynamicContent textLang soCalled roleName seg
//  LocalWords:  pubPlace ptr placeName persName pc origPlace orgName
//  LocalWords:  origDate num msName monogr Mangalam metas tei Dubeau
//  LocalWords:  MPL jquery oop util namespace stylesheets isEndNote
//  LocalWords:  isFootNote xsl biblStruct titlePage floatingText sp
//  LocalWords:  bibl docAuthor mml altIdentifier listBibl biblScope
//  LocalWords:  editionStmt att br del emph expan genName geogName
//  LocalWords:  gi ident idno
