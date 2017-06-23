/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:wed */function f(require) {
  "use strict";

  var core = require("./wed_core");
  var wed_util = require("./wed-util");
  var log = require("./log");
  var util = require("./util");
  var domutil = require("./domutil");
  require("bootstrap");

  var Editor = core.Editor;
  var closestByClass = domutil.closestByClass;
  var closest = domutil.closest;
  var indexOf = domutil.indexOf;

  var EditorP = Editor.prototype;

  /**
   * Registers elements that are outside wed's editing pane but should
   * be considered to be part of the editor. These would typically be
   * menus or toolbars that a larger application that uses wed for
   * editing adds around the editing pane.
   *
   * @param {Node|jQuery|Array.<Node>} elements The elements to
   * register.
   */
  EditorP.excludeFromBlur = function excludeFromBlur(elements) {
    this._$excluded_from_blur.add(elements);
  };

  /**
   * Finds the location of the character closest to the ``x, y``
   * coordinates. Very often this will be the character whose bounding
   * client rect encloses the coordinates. However, if no such character
   * exists the algorithm will return the closest character. If multiple
   * characters are at the same distance, then the first one found will
   * be returned.
   *
   * @private
   * @param {number} x The x coordinate in client coordinates.
   * @param {number} y The y coordinate in client coordinates.
   * @returns {module:dloc~DLoc|undefined} The location of the boundary
   * character. The value return is ``undefined`` if the coordinates are
   * outside the client or if the element in which the click occurred is
   * not inside the editor pane (a descendant of ``this.gui_root``).
   */
  EditorP._findLocationAt = function _findLocationAt(x, y) {
    var element_at_mouse = this.doc.elementFromPoint(x, y);
    // This could happen if x, y is outside our screen.
    if (!element_at_mouse) {
      return undefined;
    }

    // The element_at_mouse is not in the editing pane.
    if (!this.gui_root.contains(element_at_mouse)) {
      return undefined;
    }

    return this._findLocationInElementAt(element_at_mouse, x, y);
  };


  EditorP._findLocationInElementAt = function _findLocationInElementAt(node, x,
                                                                       y,
                                                                       text_ok) {
    if (text_ok !== false) {
      text_ok = true;
    }

    var range = this.doc.createRange();

    var min;

    //
    // This function works only in cases where a space that is
    // effectively rendered as a line break on the screen has a height
    // and width of zero. (Logically this makes sense, there is no
    // part of the screen which really belongs to the space.)
    //
    function checkRange(checkNode, start) {
      var rects;
      if (checkNode.nodeType === Node.TEXT_NODE) {
        range.setStart(checkNode, start);
        range.setEnd(checkNode, start + 1);
        rects = range.getClientRects();
      }
      else {
        rects = checkNode.childNodes[start].getClientRects();
      }

      for (var rect_ix = 0; rect_ix < rects.length; ++rect_ix) {
        var rect = rects[rect_ix];
        // Not a contender...
        if (rect.height === 0 || rect.width === 0) {
          continue;
        }

        var dist = util.distsFromRect(x, y, rect.left, rect.top,
                                      rect.right, rect.bottom);
        if (!min || min.dist.y > dist.y ||
            (min.dist.y === dist.y && min.dist.x > dist.x)) {
          min = {
            dist: dist,
            node: checkNode,
            start: start,
          };

          // Returning true means the search can end.
          return (dist.y === 0 && dist.x === 0);
        }
      }

      return false;
    }

    var child = node.firstChild;
    var child_ix = 0;
    /* eslint-disable no-restricted-syntax, no-labels */
    main_loop:
    while (child) {
      if (text_ok && child.nodeType === Node.TEXT_NODE) {
        for (var i = 0; i < child.length; ++i) {
          if (checkRange(child, i)) {
            // Can't get any better than this.
            break main_loop;
          }
        }
      }
      else if (checkRange(node, child_ix)) {
          // Can't get any better than this.
        break;
      }
      child = child.nextSibling;
      child_ix++;
    }
    /* eslint-enable */

    if (!min) {
      return this.caretManager.makeCaret(node, 0);
    }

    return this.caretManager.makeCaret(min.node, min.start);
  };

  EditorP._pointToCharBoundary = function _pointToCharBoundary(x, y) {
    // This obviously won't work for top to bottom scripts.
    // Probably does not work with RTL scripts either.
    var boundary = this._findLocationAt(x, y);
    if (boundary) {
      var node = boundary.node;
      var offset = boundary.offset;
      var node_type = node.nodeType;

      if (((node_type === Node.ELEMENT_NODE) &&
           (offset < node.childNodes.length)) ||
          ((node_type === Node.TEXT_NODE) && (offset < node.length))) {
        // Adjust the value we return so that the location returned is
        // the one closest to the x, y coordinates.

        var range = this.doc.createRange();
        range.setStart(node, offset);
        range.setEnd(node, offset + 1);
        var rect = range.getBoundingClientRect();
        switch (node_type) {
        case Node.TEXT_NODE:
          // We use newPosition to adjust the position so that the caret ends up
          // in a location that makes sense from an editing standpoint.
          var right = this.caretManager.newPosition(boundary, "right");
          var left = this.caretManager.newPosition(boundary.make(node,
                                                                 offset + 1),
                                                   "left");
          if (right && !left) {
            boundary = right;
          }
          else if (left && !right) {
            boundary = left;
          }
          else if (right && left) {
            boundary = (Math.abs(wed_util.boundaryXY(right).left - x) >=
                        Math.abs(wed_util.boundaryXY(left).left - x) ?
                        left : right);
          }
          break;
        case Node.ELEMENT_NODE:
          // We don't use newPosition here because we want to skip over the
          // *whole* element.
          var before;
          var pointed_node = node.childNodes[offset];
          if (pointed_node.nodeType === Node.ELEMENT_NODE) {
            var closestPos = this._findLocationInElementAt(pointed_node,
                                                           x, y);
            var limit = (closestPos.node.nodeType === Node.ELEMENT_NODE) ?
                  closestPos.node.childNodes.length - 1 : -1;
            switch (closestPos.offset) {
            case 0:
              before = true;
              break;
            case limit:
              before = false;
              break;
            default:
              break;
            }
          }

          if (before === undefined) {
            before = Math.abs(rect.left - x) < Math.abs(rect.right - x);
          }

          if (!before) {
            boundary = boundary.make(node, offset + 1);
          }

          break;
        default:
          throw new Error("unexpected node type: " + node_type);
        }
      }
    }
    return boundary;
  };

  /**
   * @private
   * @param {Object} ev The CaretChange event.
   */
  EditorP._caretChange = log.wrap(function _caretChange(ev) {
    var options = ev && ev.options ? ev.options : {};
    var textEdit = options.textEdit;
    var focus = options.focus;

    var caret = this.caretManager.caret;
    if (!caret) {
      return;
    }

    // End here if there is no change to the caret.
    if (!(this._old_sel_focus === undefined ||
          !this._old_sel_focus.equals(caret))) {
      return;
    }

    // We don't want to do this on regaining focus.
    if (!focus) {
      this._setupCompletionMenu();
    }

    var old_caret = this._old_sel_focus;
    this._old_sel_focus = caret;

    // Caret movement terminates a text undo, unless the caret is moved by a
    // text edit.
    if (!textEdit) {
      this._terminateTextUndo();
    }

    // The class owns_caret can be on more than one element. The classic case is
    // if the caret is at an element label.
    var el;
    /* eslint-disable no-cond-assign */
    while ((el = this._caret_owners[0]) !== undefined) {
      el.classList.remove("_owns_caret");
    }
    while ((el = this._clicked_labels[0]) !== undefined) {
      el.classList.remove("_label_clicked");
    }
    /* eslint-enable */

    if (old_caret) {
      var old_tp = closest(old_caret.node, "._placeholder._transient",
                           old_caret.root);
      if (old_tp && caret.root.contains(old_tp)) {
        this._gui_updater.removeNode(old_tp);
      }
    }

    var node = (caret.node.nodeType === Node.ELEMENT_NODE) ?
          caret.node : caret.node.parentNode;
    var root = caret.root;

    // This caret is no longer in the gui tree. It is probably an intermediary
    // state so don't do anything with it.
    if (!this.gui_root.contains(node)) {
      return;
    }

    var real = closestByClass(node, "_real", root);
    if (real) {
      real.classList.add("_owns_caret");
    }

    var gui = closestByClass(node, "_gui", root);
    // Make sure that the caret is in view.
    if (gui) {
      if (!this.caretManager.anchor ||
          closestByClass(this.caretManager.anchor.node, "_gui", root) === gui) {
        var children = domutil.childrenByClass(gui.parentNode, "_gui");
        for (var i = 0; i < children.length; ++i) {
          children[i].classList.add("_label_clicked");
        }
      }
    }
    else {
      node.classList.add("_owns_caret");
    }

    if (!focus) {
      var pos = this._caretMark.getPositionFromGUIRoot();
      var rect = this._caretMark.getBoundingClientRect();
      this.scrollIntoView(pos.left, pos.top, pos.left + rect.width,
                          pos.top + rect.height);
    }

    var steps = [];
    while (node !== this.gui_root) {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        throw new Error("unexpected node type: " + node.nodeType);
      }

      if (!node.classList.contains("_placeholder") &&
          !closestByClass(node, "_phantom", root)) {
        steps.unshift("<span class='_gui _label'><span>&nbsp;" +
                      util.getOriginalName(node) + "&nbsp;</span></span>");
      }
      node = node.parentNode;
    }
    this._wed_location_bar.innerHTML = steps.length ? steps.join("/") :
      "<span>&nbsp;</span>";
  });

  EditorP._normalizeCaretToEditableRange =
    function _normalizeCaretToEditableRange(loc) {
      if (loc.root !== this.gui_root) {
        throw new Error("DLoc object must be for the GUI tree");
      }
      var offset = loc.offset;
      var container = loc.node;

      if (container.nodeType === Node.ELEMENT_NODE) {
        // Normalize to a range within the editable nodes. We could be
        // outside of them in an element which is empty, for instance.
        var pair = this.mode.nodesAroundEditableContents(container);
        var first_index = pair[0] ? indexOf(container.childNodes, pair[0]) : -1;
        if (offset <= first_index) {
          offset = first_index + 1;
        }
        else {
          var second_index = pair[1] ? indexOf(container.childNodes, pair[1]) :
                container.childNodes.length;
          if (offset >= second_index) {
            offset = second_index;
          }
        }

        return loc.makeWithOffset(offset);
      }

      return loc;
    };
});

//  LocalWords:  unclick saveSelection rethrown focusNode setGUICaret ns
//  LocalWords:  caretChangeEmitter caretchange RTL keyup
//  LocalWords:  compositionstart keypress keydown TextUndoGroup Yay
//  LocalWords:  getCaret endContainer startContainer uneditable prev
//  LocalWords:  CapsLock insertIntoText prepend
//  LocalWords:  offscreen validthis jshint enterStartTag xmlns xml
//  LocalWords:  namespace mousedown mouseup mousemove compositionend
//  LocalWords:  compositionupdate revalidate tabindex hoc stylesheet
//  LocalWords:  SimpleEventEmitter minified css Ctrl
//  LocalWords:  Ok contenteditable namespaces errorlist navlist li
//  LocalWords:  ul nav sb href jQuery DOM html mixins onerror gui
//  LocalWords:  wundo domlistener oop domutil util validator
//  LocalWords:  jquery Mangalam MPL Dubeau
