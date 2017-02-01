/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
'use strict';
var requirejs = require("requirejs");
var jsdomfw = require("./jsdomfw");
var chai = require("chai");
var assert = chai.assert;
var path = require("path");
var fs = require("fs");

function defined(x) {
    assert.isDefined(x);
    return x;
}

describe("guiroot", function () {
    var source = 'build/test-files/guiroot_test_data/source_converted.xml';
    var source_txt = fs.readFileSync(source).toString();
    var fw;
    var window;
    var $root;
    var root_obj;
    var guiroot;
    var dloc;
    var $;

    this.timeout(0);
    before(function (done) {
        fw = new jsdomfw.FW();
        fw.create(function () {
            window = fw.window;
            window.require(["wed/dloc", "wed/guiroot",
                            "jquery"], function (_dloc, _guiroot, _$) {
                try {
                    assert.isUndefined(window.document.errors);
                    guiroot = _guiroot;
                    dloc = _dloc;
                    $ = _$;
                    $root = $("#root");
                    defined($root[0]);
                    $root.html(source_txt);
                    root_obj = new guiroot.GUIRoot($root[0]);
                    done();
                }
                catch (e) {
                    done(e);
                    throw e;
                }
            }, done);
        });
    });

    describe("GUIRoot", function () {
        it("marks the root", function () {
            assert.equal(dloc.findRoot($root[0]), root_obj);
        });

        it("fails if the node is already marked", function () {
            assert.Throw(function () {
                new guiroot.GUIRoot($root[0]);
            },
                         window.Error,
                         "node already marked as root");
        });

        describe("nodeToPath", function () {
            beforeEach(function () {
                // Reset the tree.
                $root.html(source_txt);
            });
            it("returns an empty string on root", function () {
                assert.equal(root_obj.nodeToPath($root[0]), "");
            });

            it("returns a correct path on text node", function () {
                var node = defined($root.find(".title")[0].childNodes[0]);
                assert.equal(root_obj.nodeToPath(node), "0/0/0/0/0/0");
            });

            it("returns a correct path on phantom_wrap nodes", function () {

                $root.find(".p").wrap("<div class='_phantom_wrap'>");
                var node = defined($root.find(".p").get(-1));
                assert.equal(root_obj.nodeToPath(node), "0/1/0/1");
            });

            it("returns a correct path on later text node", function () {
                var node =
                    defined($root.find(".body>.p").get(-1).childNodes[2]);
                assert.equal(root_obj.nodeToPath(node), "0/1/0/1/2");
            });

            it("returns a correct path on attribute", function () {
                var node =
                    defined($root.find(".body>.p:last-of-type>.quote")[0]);
                // Decorate it.
                $(node).prepend(
                    '<span class="_gui _phantom __start_label _quote_label' +
                        ' _label_level_1 _label"><span class="_phantom">' +
                        '&nbsp; quote <span class="_phantom _attribute">' +
                        '<span class="_phantom _attribute_name">type</span>' +
                        '=<span class="_phantom _attribute_value">q</span>' +
                        '</span> >&nbsp;</span></span>');
                node = defined($(node).find("._attribute_value")[0]);
                assert.equal(root_obj.nodeToPath(node),
                             "0/1/0/1/1/@type");
            });

            it("returns a correct path on text node in attribute", function () {
                var node =
                    defined($root.find(".body>.p:last-of-type>.quote")[0]);
                // Decorate it.
                $(node).prepend(
                    '<span class="_gui _phantom __start_label _quote_label' +
                        ' _label_level_1 _label"><span class="_phantom">' +
                        '&nbsp; quote <span class="_phantom _attribute">' +
                        '<span class="_phantom _attribute_name">type</span>' +
                        '=<span class="_phantom _attribute_value">q</span>' +
                        '</span> >&nbsp;</span></span>');
                node = defined($(node).find("._attribute_value")[0]
                               .childNodes[0]);
                assert.equal(root_obj.nodeToPath(node),
                             "0/1/0/1/1/@type");
            });

            it("fails on a node which is not a descendant of its root",
               function () {
                var node = defined($("body")[0]);
                assert.Throw(root_obj.nodeToPath.bind(root_obj, node),
                             window.Error, "node is not a descendant of root");
            });

            it("fails on invalid node",
               function () {
                assert.Throw(root_obj.nodeToPath.bind(root_obj, null),
                             window.Error, "invalid node parameter");

                assert.Throw(root_obj.nodeToPath.bind(root_obj, undefined),
                             window.Error, "invalid node parameter");
            });
        });

        describe("pathToNode", function () {
            it("returns root when passed an empty string", function () {
                assert.equal(root_obj.pathToNode(""), $root[0]);
            });

            it("returns a correct node on a text path", function () {
                var node = defined($root.find(".title")[0].childNodes[0]);
                assert.equal(root_obj.pathToNode("0/0/0/0/0/0"), node);
            });

            it("returns a correct node on a later text path", function () {
                var node =
                    defined($root.find(".body>.p").get(-1).childNodes[2]);
                assert.equal(root_obj.pathToNode("0/1/0/1/2"), node);

            });

            it("returns a correct node on attribute path", function () {
                var node =
                    defined($root.find(".body>.p:last-of-type>.quote")[0]);
                // Decorate it.
                $(node).prepend(
                    '<span class="_gui _phantom __start_label _quote_label' +
                        ' _label_level_1 _label"><span class="_phantom">' +
                        '&nbsp; quote <span class="_phantom _attribute">' +
                        '<span class="_phantom _attribute_name">type</span>' +
                        '=<span class="_phantom _attribute_value">q</span>' +
                        '</span> >&nbsp;</span></span>');
                node = defined($(node).find("._attribute_value")[0]);
                assert.equal(root_obj.pathToNode("0/1/0/1/1/@type"),
                             node);
            });

            it("returns a correct node when path contains _phantom_wrap",
              function () {
               $root.find(".p").wrap("<div class='_phantom_wrap'>");
               var node = defined($root.find(".p").get(-1));
               assert.equal(root_obj.pathToNode("0/1/0/1"), node);
           });

            it("accepts more than one digit per path step",
               function () {
                var node = defined($root.find(".p").get(-1));
                // There was a stupid bug in an earlier version which
                // would make this fail with an exception complaining
                // that the path was malformed due to the presence of
                // "10". The null return value is fine since there is
                // no such element, but at least it should not
                // generate an exception.
                assert.equal(root_obj.pathToNode("0/10"), null);
            });

            it("fails on malformed path",
               function () {
                assert.Throw(root_obj.pathToNode.bind(root_obj, "+"),
                             window.Error, "malformed path expression");
            });
        });
    });
});
