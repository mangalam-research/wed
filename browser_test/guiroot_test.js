/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(function (require, exports, _module) {
'use strict';
var chai = require("chai");
var $ = require("jquery");
var domutil = require("wed/domutil");
var convert = require("wed/convert");
var dloc = require("wed/dloc");
var guiroot = require("wed/guiroot");
var source_txt = require("text!browser_test/guiroot_test_data/source.xml");

var assert = chai.assert;

var dataRoot = window.parent.document.getElementById("domroot");

describe("guiroot.nodeToPath", function () {
    it("is equivalent to nodeToPath on a data tree", function () {
        var parser = new window.DOMParser();
        var dataDoc = parser.parseFromString(source_txt, "text/xml");
        dataRoot.innerHTML = '';
        dataRoot.appendChild(dataDoc.firstChild);
        var dataRootObj = new dloc.DLocRoot(dataRoot);

        var guiRoot = $("<div></div>")[0];
        guiRoot.appendChild(convert.toHTMLTree(dataRoot.ownerDocument,
                                               dataRoot.firstChild));
        domutil.linkTrees(dataRoot, guiRoot);
        var guiRootObj = new guiroot.GUIRoot(guiRoot);
        var targetDataNode = dataRoot.getElementsByTagName("quote")[0];
        var targetGuiNode = $.data(targetDataNode, "wed_mirror_node");
        var phantomWrapTemplate = "<span class='_phantom_wrap'></span>";
        $(targetGuiNode).wrap(phantomWrapTemplate);
        $(targetGuiNode).after("<span class='_phantom'>Boo</span>Blip");
        $(targetGuiNode).wrap(phantomWrapTemplate);

        var dataNode = targetDataNode.parentNode;
        var guiNode = $.data(dataNode, "wed_mirror_node");
        // Wrap twice for good measure.
        $(guiNode).wrap(phantomWrapTemplate);
        $(guiNode).wrap(phantomWrapTemplate);

        targetDataNode = dataRoot.getElementsByTagName("quote")[1];
        targetGuiNode = $.data(targetDataNode, "wed_mirror_node");
        var guiPath = guiRootObj.nodeToPath(targetGuiNode);
        var dataPath = dataRootObj.nodeToPath(targetDataNode);
        console.log(dataRoot.innerHTML);

        // Both paths should be equal.
        assert.equal(guiPath, dataPath);

        // It should also be reversible.
        assert.equal(guiRootObj.pathToNode(guiPath), targetGuiNode);
    });
});


});
