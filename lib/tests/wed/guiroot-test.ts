/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import $ from "jquery";

import * as convert from "wed/convert";
import { DLocRoot, findRoot } from "wed/dloc";
import { linkTrees } from "wed/domutil";
import * as guiroot from "wed/guiroot";

import { DataProvider } from "../util";

const assert = chai.assert;

function defined<T>(x: T | null | undefined): T {
  assert.isDefined(x);
  // The assertion above already excludes null and undefined, but TypeScript
  // does not know this.
  return x as T;
}

describe("guiroot", () => {
  let $root: JQuery;
  let root: HTMLElement;
  let rootObj: guiroot.GUIRoot;
  let htmlTree: Node;
  let xmlDoc: Document;

  before(() =>
         new DataProvider("/base/build/standalone/lib/tests/guiroot_test_data/")
         .getText("source_converted.xml")
         .then((sourceXML) => {
           root = document.createElement("div");
           document.body.appendChild(root);
           $root = $(root);
           const parser = new window.DOMParser();
           xmlDoc = parser.parseFromString(sourceXML, "text/xml");
           htmlTree = convert.toHTMLTree(window.document,
                                         xmlDoc.firstElementChild!);
           root.appendChild(htmlTree.cloneNode(true));
           rootObj = new guiroot.GUIRoot(root);
         }));

  after(() => {
    document.body.removeChild(root);
  });

  describe("GUIRoot", () => {
    it("marks the root", () => {
      assert.equal(findRoot(root), rootObj);
    });

    it("fails if the node is already marked", () => {
      assert.throws(() => {
        new guiroot.GUIRoot(root);
      },
                    Error, "node already marked as root");
    });

    describe("nodeToPath", () => {
      afterEach(() => {
        // Reset the tree.
        $root.empty();
        root.appendChild(htmlTree.cloneNode(true));
      });

      it("returns an empty string on root", () => {
        assert.equal(rootObj.nodeToPath(root), "");
      });

      it("returns a correct path on text node", () => {
        const node = defined($root.find(".title")[0].childNodes[0]);
        assert.equal(rootObj.nodeToPath(node), "0/0/0/0/0/0");
      });

      it("returns a correct path on phantom_wrap nodes", () => {
        $root.find(".p").wrap("<div class='_phantom_wrap'>");
        const node = defined($root.find(".p").get(-1));
        assert.equal(rootObj.nodeToPath(node), "0/1/0/1");
      });

      it("returns a correct path on later text node", () => {
        const node = defined($root.find(".body>.p").get(-1).childNodes[2]);
        assert.equal(rootObj.nodeToPath(node), "0/1/0/1/2");
      });

      it("returns a correct path on attribute", () => {
        let node = defined($root.find(".body>.p:last-of-type>.quote")[0]);
        // Decorate it.
        $(node).prepend(
          "<span class=\"_gui _phantom __start_label _quote_label" +
            " _label_level_1 _label\"><span class=\"_phantom\">" +
            "&nbsp; quote <span class=\"_phantom _attribute\">" +
            "<span class=\"_phantom _attribute_name\">type</span>" +
            "=<span class=\"_phantom _attribute_value\">q</span>" +
            "</span> >&nbsp;</span></span>");
        node = defined($(node).find("._attribute_value")[0]);
        assert.equal(rootObj.nodeToPath(node), "0/1/0/1/1/@type");
      });

      it("returns a correct path on text node in attribute", () => {
        let node: Node =
          defined($root.find(".body>.p:last-of-type>.quote")[0]);
        // Decorate it.
        $(node).prepend(
          "<span class=\"_gui _phantom __start_label _quote_label" +
            " _label_level_1 _label\"><span class=\"_phantom\">" +
            "&nbsp; quote <span class=\"_phantom _attribute\">" +
            "<span class=\"_phantom _attribute_name\">type</span>" +
            "=<span class=\"_phantom _attribute_value\">q</span>" +
            "</span> >&nbsp;</span></span>");
        node = defined($(node).find("._attribute_value")[0].childNodes[0]);
        assert.equal(rootObj.nodeToPath(node), "0/1/0/1/1/@type");
      });

      it("fails on a node which is not a descendant of its root", () => {
        const node = defined($("body")[0]);
        assert.throws(rootObj.nodeToPath.bind(rootObj, node),
                      Error, "node is not a descendant of root");
      });

      it("fails on invalid node", () => {
        assert.throws(rootObj.nodeToPath.bind(rootObj, null),
                      Error, "node is not a descendant of root");

        assert.throws(rootObj.nodeToPath.bind(rootObj, undefined),
                      Error, "node is not a descendant of root");
      });

      it("is equivalent to nodeToPath on a data tree", () => {
        const dataRootObj = new DLocRoot(xmlDoc);

        linkTrees(xmlDoc.firstElementChild!, root.firstElementChild!);
        let targetDataNode = xmlDoc.getElementsByTagName("quote")[0];
        const phantomWrapTemplate = "<span class='_phantom_wrap'></span>";
        $($.data(targetDataNode, "wed_mirror_node"))
          .wrap(phantomWrapTemplate)
          .after("<span class='_phantom'>Boo</span>Blip")
          .wrap(phantomWrapTemplate);

        const dataNode = targetDataNode.parentNode as Element;
        // Wrap twice for good measure.
        $($.data(dataNode, "wed_mirror_node"))
          .wrap(phantomWrapTemplate)
          .wrap(phantomWrapTemplate);

        targetDataNode = xmlDoc.getElementsByTagName("quote")[1];
        const targetGuiNode = $.data(targetDataNode, "wed_mirror_node");
        const guiPath = rootObj.nodeToPath(targetGuiNode);
        const dataPath = dataRootObj.nodeToPath(targetDataNode);

        // Both paths should be equal.
        assert.equal(guiPath, dataPath);

        // It should also be reversible.
        assert.equal(rootObj.pathToNode(guiPath), targetGuiNode);
      });
    });

    describe("pathToNode", () => {
      it("returns root when passed an empty string", () => {
        assert.equal(rootObj.pathToNode(""), root);
      });

      it("returns a correct node on a text path", () => {
        const node = defined($root.find(".title")[0].childNodes[0]);
        assert.equal(rootObj.pathToNode("0/0/0/0/0/0"), node);
      });

      it("returns a correct node on a later text path", () => {
        const node = defined($root.find(".body>.p").get(-1).childNodes[2]);
        assert.equal(rootObj.pathToNode("0/1/0/1/2"), node);
      });

      it("returns a correct node on attribute path", () => {
        let node = defined($root.find(".body>.p:last-of-type>.quote")[0]);
        // Decorate it.
        $(node).prepend(
          "<span class=\"_gui _phantom __start_label _quote_label" +
            " _label_level_1 _label\"><span class=\"_phantom\">" +
            "&nbsp; quote <span class=\"_phantom _attribute\">" +
            "<span class=\"_phantom _attribute_name\">type</span>" +
            "=<span class=\"_phantom _attribute_value\">q</span>" +
            "</span> >&nbsp;</span></span>");
        node = defined($(node).find("._attribute_value")[0]);
        assert.equal(rootObj.pathToNode("0/1/0/1/1/@type"), node);
      });

      it("returns a correct node when path contains _phantom_wrap",
         () => {
           $root.find(".p").wrap("<div class='_phantom_wrap'>");
           const node = defined($root.find(".p").get(-1));
           assert.equal(rootObj.pathToNode("0/1/0/1"), node);
         });

      it("accepts more than one digit per path step", () => {
        // There was a stupid bug in an earlier version which would make this
        // fail with an exception complaining that the path was malformed due to
        // the presence of "10". The null return value is fine since there is no
        // such element, but at least it should not generate an exception.
        assert.equal(rootObj.pathToNode("0/10"), null);
      });

      it("fails on malformed path", () => {
        assert.throws(rootObj.pathToNode.bind(rootObj, "+"),
                      Error, "malformed path expression");
      });
    });
  });
});
