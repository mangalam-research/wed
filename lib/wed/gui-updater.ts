/**
 * Listens to changes on a tree and updates the GUI tree in response to changes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import $ from "jquery";

import * as convert from "./convert";
import { DLoc } from "./dloc";
import { isElement, isText } from "./domtypeguards";
import { isAttr, linkTrees, unlinkTree} from "./domutil";
import { BeforeDeleteNodeEvent, InsertNodeAtEvent, SetAttributeNSEvent,
         SetTextNodeValueEvent, TreeUpdater } from "./tree-updater";
import * as util from "./util";

/**
 * Updates a GUI tree so that its data nodes (those nodes that are not
 * decorations) mirror a data tree.
 */
export class GUIUpdater extends TreeUpdater {
  /**
   * @param guiTree The DOM tree to update.
   *
   * @param treeUpdater A tree updater that updates the data tree. It serves as
   * a source of modification events which the object being created will listen
   * on.
   */
  constructor(guiTree: Element, private readonly treeUpdater: TreeUpdater) {
    super(guiTree);
    this.treeUpdater.events.subscribe((ev) => {
      switch (ev.name) {
      case "InsertNodeAt":
        this._insertNodeAtHandler(ev);
        break;
      case "SetTextNodeValue":
        this._setTextNodeValueHandler(ev);
        break;
      case "BeforeDeleteNode":
        this._beforeDeleteNodeHandler(ev);
        break;
      case "SetAttributeNS":
        this._setAttributeNSHandler(ev);
        break;
      default:
        // Do nothing...
      }
    });
  }

  /**
   * Handles "InsertNodeAt" events.
   *
   * @param ev The event.
   */
  private _insertNodeAtHandler(ev: InsertNodeAtEvent): void {
    const guiCaret = this.fromDataLocation(ev.parent, ev.index);
    if (guiCaret === null) {
      throw new Error("cannot find gui tree position");
    }
    const clone = convert.toHTMLTree(this.tree.ownerDocument, ev.node);
    if (isElement(ev.node)) {
      // If ev.node is an element, then the clone is an element too.
      linkTrees(ev.node, clone as Element);
    }
    this.insertNodeAt(guiCaret, clone);
  }

  /**
   * Handles "SetTextNodeValue" events.
   *
   * @param ev The event.
   */
  private _setTextNodeValueHandler(ev: SetTextNodeValueEvent):
  void {
    const guiCaret = this.fromDataLocation(ev.node, 0);
    if (guiCaret === null) {
      throw new Error("cannot find gui tree position");
    }
    this.setTextNodeValue(guiCaret.node as Text, ev.value);
  }

  /**
   * Handles "BeforeDeleteNode" events.
   *
   * @param ev The event.
   */
  private _beforeDeleteNodeHandler(ev: BeforeDeleteNodeEvent):
  void {
    const dataNode = ev.node;
    let toRemove;
    let element = false;
    switch (dataNode.nodeType) {
    case Node.TEXT_NODE:
      const guiCaret = this.fromDataLocation(dataNode, 0);
      if (guiCaret === null) {
        throw new Error("cannot find gui tree position");
      }
      toRemove = guiCaret.node;
      break;
    case Node.ELEMENT_NODE:
      toRemove = $.data(dataNode as Element, "wed_mirror_node");
      element = true;
      break;
    default:
    }
    this.deleteNode(toRemove);

    // We have to do this **after** we delete the node.
    if (element) {
      unlinkTree(dataNode as Element);
      unlinkTree(toRemove);
    }
  }

  /**
   * Handles "SetAttributeNS" events.
   *
   * @param ev The event.
   */
  private _setAttributeNSHandler(ev: SetAttributeNSEvent): void {
    const guiCaret = this.fromDataLocation(ev.node, 0);
    if (guiCaret === null) {
      throw new Error("cannot find gui tree position");
    }
    this.setAttributeNS(guiCaret.node as Element, "",
                        util.encodeAttrName(ev.attribute), ev.newValue);
  }

  /**
   * Converts a data location to a GUI location.
   *
   * @param loc The location.
   *
   * @returns The GUI location.
   */
  fromDataLocation(loc: DLoc): DLoc | null;
  fromDataLocation(node: Node, offset: number): DLoc | null;
  fromDataLocation(loc: DLoc | Node, offset?: number): DLoc |null {
    let node;
    if (loc instanceof DLoc) {
      node = loc.node;
      offset = loc.offset;
    }
    else {
      node = loc;
      if (offset === undefined) {
        throw new Error("must specify an offset");
      }
    }

    let guiNode = this.pathToNode(this.treeUpdater.nodeToPath(node));
    if (guiNode === null) {
      return null;
    }

    if (isText(node)) {
      return DLoc.mustMakeDLoc(this.tree, guiNode, offset);
    }

    if (isAttr(node)) {
      // The check for the node type is to avoid getting a location inside a
      // placeholder.
      if (isText(guiNode.firstChild)) {
        guiNode = guiNode.firstChild;
      }
      return DLoc.mustMakeDLoc(this.tree, guiNode, offset);
    }

    if (offset === 0) {
      return DLoc.mustMakeDLoc(this.tree, guiNode, 0);
    }

    if (offset >= node.childNodes.length) {
      return DLoc.mustMakeDLoc(this.tree, guiNode, guiNode.childNodes.length);
    }

    const guiChild = this.pathToNode(
      this.treeUpdater.nodeToPath(node.childNodes[offset]));
    if (guiChild === null) {
      // This happens if for instance node has X children but the
      // corresponding node in tree has X-1 children.
      return DLoc.mustMakeDLoc(this.tree, guiNode, guiNode.childNodes.length);
    }

    return DLoc.mustMakeDLoc(this.tree, guiChild);
  }
}

//  LocalWords:  domutil jquery pathToNode nodeToPath jQuery deleteNode Dubeau
//  LocalWords:  insertNodeAt MPL Mangalam gui setTextNodeValue TreeUpdater ev
//  LocalWords:  BeforeDeleteNode SetAttributeNS
