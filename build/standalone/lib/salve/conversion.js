/**
 * @module conversion
 * @desc This module contains utilities used for converting Relax NG
 * files to the format required by salve.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:conversion */ function (require, exports, module) {
'use strict';

var parser = require("./conversion/parser");
var walker = require("./conversion/walker");

exports.Element = parser.Element;
exports.ConversionParser = parser.ConversionParser;
exports.ConversionWalkerV2 = walker.ConversionWalkerV2;
exports.NameGatherer = walker.NameGatherer;
exports.Renamer = walker.Renamer;
exports.DatatypeProcessor = walker.DatatypeProcessor;

});
