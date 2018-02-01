define(["require", "exports", "jquery", "wed/convert", "wed/dloc", "wed/domutil", "wed/guiroot", "../util"], function (require, exports, $, convert, dloc_1, domutil_1, guiroot, util_1) {
    /**
     * @author Louis-Dominique Dubeau
     * @license MPL 2.0
     * @copyright Mangalam Research Center for Buddhist Languages
     */
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var assert = chai.assert;
    function defined(x) {
        assert.isDefined(x);
        // The assertion above already excludes null and undefined, but TypeScript
        // does not know this.
        return x;
    }
    describe("guiroot", function () {
        var $root;
        var root;
        var rootObj;
        var htmlTree;
        var xmlDoc;
        before(function () {
            return new util_1.DataProvider("/base/build/standalone/lib/tests/guiroot_test_data/")
                .getText("source_converted.xml")
                .then(function (sourceXML) {
                root = document.createElement("div");
                document.body.appendChild(root);
                $root = $(root);
                var parser = new window.DOMParser();
                xmlDoc = parser.parseFromString(sourceXML, "text/xml");
                htmlTree = convert.toHTMLTree(window.document, xmlDoc.firstElementChild);
                root.appendChild(htmlTree.cloneNode(true));
                rootObj = new guiroot.GUIRoot(root);
            });
        });
        after(function () {
            document.body.removeChild(root);
        });
        describe("GUIRoot", function () {
            it("marks the root", function () {
                assert.equal(dloc_1.findRoot(root), rootObj);
            });
            it("fails if the node is already marked", function () {
                assert.throws(function () {
                    new guiroot.GUIRoot(root);
                }, Error, "node already marked as root");
            });
            describe("nodeToPath", function () {
                afterEach(function () {
                    // Reset the tree.
                    $root.empty();
                    root.appendChild(htmlTree.cloneNode(true));
                });
                it("returns an empty string on root", function () {
                    assert.equal(rootObj.nodeToPath(root), "");
                });
                it("returns a correct path on text node", function () {
                    var node = defined($root.find(".title")[0].childNodes[0]);
                    assert.equal(rootObj.nodeToPath(node), "0/0/0/0/0/0");
                });
                it("returns a correct path on phantom_wrap nodes", function () {
                    $root.find(".p").wrap("<div class='_phantom_wrap'>");
                    var node = defined($root.find(".p").get(-1));
                    assert.equal(rootObj.nodeToPath(node), "0/1/0/1");
                });
                it("returns a correct path on later text node", function () {
                    var node = defined($root.find(".body>.p").get(-1).childNodes[2]);
                    assert.equal(rootObj.nodeToPath(node), "0/1/0/1/2");
                });
                it("returns a correct path on attribute", function () {
                    var node = defined($root.find(".body>.p:last-of-type>.quote")[0]);
                    // Decorate it.
                    $(node).prepend("<span class=\"_gui _phantom __start_label _quote_label" +
                        " _label_level_1 _label\"><span class=\"_phantom\">" +
                        "&nbsp; quote <span class=\"_phantom _attribute\">" +
                        "<span class=\"_phantom _attribute_name\">type</span>" +
                        "=<span class=\"_phantom _attribute_value\">q</span>" +
                        "</span> >&nbsp;</span></span>");
                    node = defined($(node).find("._attribute_value")[0]);
                    assert.equal(rootObj.nodeToPath(node), "0/1/0/1/1/@type");
                });
                it("returns a correct path on text node in attribute", function () {
                    var node = defined($root.find(".body>.p:last-of-type>.quote")[0]);
                    // Decorate it.
                    $(node).prepend("<span class=\"_gui _phantom __start_label _quote_label" +
                        " _label_level_1 _label\"><span class=\"_phantom\">" +
                        "&nbsp; quote <span class=\"_phantom _attribute\">" +
                        "<span class=\"_phantom _attribute_name\">type</span>" +
                        "=<span class=\"_phantom _attribute_value\">q</span>" +
                        "</span> >&nbsp;</span></span>");
                    node = defined($(node).find("._attribute_value")[0].childNodes[0]);
                    assert.equal(rootObj.nodeToPath(node), "0/1/0/1/1/@type");
                });
                it("fails on a node which is not a descendant of its root", function () {
                    var node = defined($("body")[0]);
                    assert.throws(rootObj.nodeToPath.bind(rootObj, node), Error, "node is not a descendant of root");
                });
                it("fails on invalid node", function () {
                    assert.throws(rootObj.nodeToPath.bind(rootObj, null), Error, "node is not a descendant of root");
                    assert.throws(rootObj.nodeToPath.bind(rootObj, undefined), Error, "node is not a descendant of root");
                });
                it("is equivalent to nodeToPath on a data tree", function () {
                    var dataRootObj = new dloc_1.DLocRoot(xmlDoc);
                    domutil_1.linkTrees(xmlDoc.firstElementChild, root.firstElementChild);
                    var targetDataNode = xmlDoc.getElementsByTagName("quote")[0];
                    var phantomWrapTemplate = "<span class='_phantom_wrap'></span>";
                    $($.data(targetDataNode, "wed_mirror_node"))
                        .wrap(phantomWrapTemplate)
                        .after("<span class='_phantom'>Boo</span>Blip")
                        .wrap(phantomWrapTemplate);
                    var dataNode = targetDataNode.parentNode;
                    // Wrap twice for good measure.
                    $($.data(dataNode, "wed_mirror_node"))
                        .wrap(phantomWrapTemplate)
                        .wrap(phantomWrapTemplate);
                    targetDataNode = xmlDoc.getElementsByTagName("quote")[1];
                    var targetGuiNode = $.data(targetDataNode, "wed_mirror_node");
                    var guiPath = rootObj.nodeToPath(targetGuiNode);
                    var dataPath = dataRootObj.nodeToPath(targetDataNode);
                    // Both paths should be equal.
                    assert.equal(guiPath, dataPath);
                    // It should also be reversible.
                    assert.equal(rootObj.pathToNode(guiPath), targetGuiNode);
                });
            });
            describe("pathToNode", function () {
                it("returns root when passed an empty string", function () {
                    assert.equal(rootObj.pathToNode(""), root);
                });
                it("returns a correct node on a text path", function () {
                    var node = defined($root.find(".title")[0].childNodes[0]);
                    assert.equal(rootObj.pathToNode("0/0/0/0/0/0"), node);
                });
                it("returns a correct node on a later text path", function () {
                    var node = defined($root.find(".body>.p").get(-1).childNodes[2]);
                    assert.equal(rootObj.pathToNode("0/1/0/1/2"), node);
                });
                it("returns a correct node on attribute path", function () {
                    var node = defined($root.find(".body>.p:last-of-type>.quote")[0]);
                    // Decorate it.
                    $(node).prepend("<span class=\"_gui _phantom __start_label _quote_label" +
                        " _label_level_1 _label\"><span class=\"_phantom\">" +
                        "&nbsp; quote <span class=\"_phantom _attribute\">" +
                        "<span class=\"_phantom _attribute_name\">type</span>" +
                        "=<span class=\"_phantom _attribute_value\">q</span>" +
                        "</span> >&nbsp;</span></span>");
                    node = defined($(node).find("._attribute_value")[0]);
                    assert.equal(rootObj.pathToNode("0/1/0/1/1/@type"), node);
                });
                it("returns a correct node when path contains _phantom_wrap", function () {
                    $root.find(".p").wrap("<div class='_phantom_wrap'>");
                    var node = defined($root.find(".p").get(-1));
                    assert.equal(rootObj.pathToNode("0/1/0/1"), node);
                });
                it("accepts more than one digit per path step", function () {
                    // There was a stupid bug in an earlier version which would make this
                    // fail with an exception complaining that the path was malformed due to
                    // the presence of "10". The null return value is fine since there is no
                    // such element, but at least it should not generate an exception.
                    assert.equal(rootObj.pathToNode("0/10"), null);
                });
                it("fails on malformed path", function () {
                    assert.throws(rootObj.pathToNode.bind(rootObj, "+"), Error, "malformed path expression");
                });
            });
        });
    });
});
//# sourceMappingURL=guiroot-test.js.map