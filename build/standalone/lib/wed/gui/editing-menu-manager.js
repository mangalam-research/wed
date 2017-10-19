define(["require", "exports", "module", "../dloc", "../domtypeguards", "../domutil", "../transformation", "./action-context-menu", "./completion-menu", "./icon"], function (require, exports, module, dloc_1, domtypeguards_1, domutil_1, transformation_1, action_context_menu_1, completion_menu_1, icon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var atStartToTxt = {
        undefined: "",
        true: " before this element",
        false: " after this element",
    };
    /**
     * Manages the editing menus for a specific editing view. An "editing menu" is a
     * menu that appears in the editing pane. The context menu and completion menu
     * are editing menus.
     *
     * Only one editing menu may be shown at any given time.
     */
    var EditingMenuManager = /** @class */ (function () {
        /**
         * @param editor The editor for which the manager is created.
         */
        function EditingMenuManager(editor) {
            this.editor = editor;
            this.caretManager = editor.caretManager;
            this.modeTree = editor.modeTree;
            this.guiRoot = editor.guiRoot;
            this.dataRoot = editor.dataRoot;
            this.doc = this.guiRoot.ownerDocument;
        }
        /**
         * This is the default menu handler called when the user right-clicks in the
         * contents of a document or uses the keyboard shortcut.
         *
         * The menu handler which is invoked when a user right-clicks on an element
         * start or end label is defined by the decorator that the mode is using.
         */
        EditingMenuManager.prototype.contextMenuHandler = function (e) {
            var sel = this.caretManager.sel;
            if (sel === undefined || (!sel.collapsed && !sel.wellFormed)) {
                return false;
            }
            var node = sel.focus.node;
            var offset = sel.focus.offset;
            if (!domtypeguards_1.isElement(node)) {
                var parent_1 = node.parentNode;
                if (parent_1 === null) {
                    throw new Error("contextMenuHandler invoked on detached node");
                }
                offset = domutil_1.indexOf(parent_1.childNodes, node);
                node = parent_1;
            }
            // Move out of any placeholder
            var ph = domutil_1.closestByClass(node, "_placeholder", this.guiRoot);
            if (ph !== null) {
                var parent_2 = ph.parentNode;
                if (parent_2 === null) {
                    throw new Error("contextMenuHandler invoked on detached node");
                }
                offset = domutil_1.indexOf(parent_2.childNodes, ph);
                node = parent_2;
            }
            var real = domutil_1.closestByClass(node, "_real", this.guiRoot);
            var readonly = real !== null && real.classList.contains("_readonly");
            var method = domutil_1.closestByClass(node, "_attribute_value", this.guiRoot) !== null ?
                this.getMenuItemsForAttribute :
                this.getMenuItemsForElement;
            var menuItems = method.call(this, node, offset, !sel.collapsed);
            // There's no menu to display, so let the event bubble up.
            if (menuItems.length === 0) {
                return true;
            }
            var pos = this.computeMenuPosition(e);
            this.displayContextMenu(action_context_menu_1.ActionContextMenu, pos.left, pos.top, menuItems, readonly);
            return false;
        };
        /**
         * Dismiss the menu currently shown. If there is no menu currently shown, does
         * nothing.
         */
        EditingMenuManager.prototype.dismiss = function () {
            // We may be called when there is no menu active.
            if (this.currentDropdown !== undefined) {
                this.currentDropdown.dismiss();
            }
        };
        EditingMenuManager.prototype.displayContextMenu = function (cmClass, x, y, items, readonly) {
            var _this = this;
            // Eliminate duplicate items. We perform a check only in the description of
            // the action, and on ``data.name``.
            var seen = Object.create(null);
            items = items.filter(function (item) {
                // "\0" not a legitimate value in descriptions.
                var actionKey = (item.action !== null ?
                    item.action.getDescription() : "") + "\0";
                if (item.data !== null) {
                    actionKey += item.data.name;
                }
                var keep = !seen[actionKey];
                seen[actionKey] = true;
                if (!keep || !readonly) {
                    return keep;
                }
                // If we get here, then we need to filter out anything that transforms the
                // tree.
                return !(item.action instanceof transformation_1.Transformation);
            });
            this.dismiss();
            this.caretManager.pushSelection();
            this.currentDropdown = new cmClass(this.doc, x, y, items, function () {
                _this.currentDropdown = undefined;
                _this.caretManager.popSelection();
            });
        };
        EditingMenuManager.prototype.getMenuItemsForAttribute = function () {
            return [];
        };
        EditingMenuManager.prototype.getMenuItemsForElement = function (node, offset, wrap) {
            var _this = this;
            var actualNode = node;
            // If we are in a phantom, we want to get to the first parent which is not
            // phantom.
            var lastPhantomChild;
            while (actualNode !== null && actualNode.classList.contains("_phantom")) {
                lastPhantomChild = actualNode;
                actualNode = actualNode.parentNode;
            }
            if (actualNode === null || !this.guiRoot.contains(actualNode)) {
                return [];
            }
            if (lastPhantomChild !== undefined) {
                // The actualNode exists and is in our GUI tree. If the offset is outside
                // editable contents, move it into editable contents.
                (offset = this.caretManager
                    .normalizeToEditableRange(dloc_1.DLoc.mustMakeDLoc(this.guiRoot, lastPhantomChild)).offset);
            }
            var menuItems = [];
            var pushItem = function (data, tr) {
                var li = _this.makeMenuItemForAction(tr, data);
                menuItems.push({ action: tr, item: li, data: data });
            };
            if (!actualNode.parentNode.classList.contains("_gui")) {
                // We want the data node, not the gui node.
                var treeCaret = this.caretManager.toDataLocation(actualNode, offset);
                if (treeCaret === undefined) {
                    throw new Error("cannot find tree caret");
                }
                // We are cheating a bit here. treeCaret.node cannot be a text node
                // because of the way this method is invoked. It cannot be an attribute
                // either. However, it could be a Document, which happens if the edited
                // document is empty.
                var dataNode = treeCaret.node;
                var tagName = dataNode.tagName;
                var mode = this.modeTree.getMode(dataNode);
                if (tagName != null) {
                    var docURL = mode.documentationLinkFor(tagName);
                    if (docURL != null) {
                        var li = this.makeDocumentationMenuItem(docURL);
                        menuItems.push({ action: null, item: li, data: null });
                    }
                }
                var trs = this.editor.getElementTransformationsAt(treeCaret, wrap ? "wrap" : "insert");
                for (var _i = 0, trs_1 = trs; _i < trs_1.length; _i++) {
                    var tr = trs_1[_i];
                    // If tr.name is not undefined we have a real transformation.
                    // Otherwise, it is an action.
                    pushItem((tr.name !== undefined) ? { name: tr.name } : null, tr.tr);
                }
                if (dataNode !== this.dataRoot.firstChild && dataNode !== this.dataRoot) {
                    var actions = mode.getContextualActions(["unwrap", "delete-parent", "split"], tagName, dataNode, 0);
                    for (var _a = 0, actions_1 = actions; _a < actions_1.length; _a++) {
                        var action = actions_1[_a];
                        pushItem({ node: dataNode, name: tagName }, action);
                    }
                }
            }
            var $sep = $(actualNode).parents().addBack()
                .siblings("[data-wed--separator-for]").first();
            var sepFor = $sep[0] !== undefined ?
                $sep[0].getAttribute("data-wed--separator-for") : null;
            if (sepFor !== null) {
                var transformationNode = $sep.siblings()
                    .filter(function filter() {
                    // Node.contains() will return true if this === node, whereas
                    // jQuery.has() only looks at descendants, so this can't be replaced
                    // with .has().
                    return this.contains(actualNode);
                })[0];
                var mode = this.modeTree.getMode(transformationNode);
                var actions = mode.getContextualActions(["merge-with-next", "merge-with-previous", "append", "prepend"], sepFor, $.data(transformationNode, "wed_mirror_node"), 0);
                for (var _b = 0, actions_2 = actions; _b < actions_2.length; _b++) {
                    var action = actions_2[_b];
                    pushItem({ node: transformationNode, name: sepFor }, action);
                }
            }
            return menuItems;
        };
        /**
         * Make a standardized menu item for a specific action. This method formats
         * the menu item and sets an even handler appropriate to invoke the action's
         * event handler.
         *
         * @param action The action for which we make a menu item.
         *
         * @param data The data that accompanies the action.
         *
         * @param start This parameter determines whether we are creating an item for
         *              a start label (``true``) an end label (``false``) or
         *              something which is neither a start or end label
         *              (``undefined``).
         *
         * @returns A HTML element which is fit to serve as a menu item.
         */
        EditingMenuManager.prototype.makeMenuItemForAction = function (action, data, start) {
            var icon = action.getIcon();
            var li = domutil_1.htmlToElements("<li><a tabindex='0' href='#'>" + (icon !== undefined ? icon + " " : "") + "</a></li>", this.doc)[0];
            if (action instanceof transformation_1.Transformation && action.kind !== undefined) {
                li.setAttribute("data-kind", action.kind);
            }
            var a = li.firstElementChild;
            // We do it this way so that to avoid an HTML interpretation of
            // action.getDescriptionFor()`s return value.
            var text = this.doc.createTextNode(action.getDescriptionFor(data) +
                atStartToTxt[String(start)]);
            a.appendChild(text);
            a.normalize();
            $(a).click(data, action.boundTerminalHandler);
            return li;
        };
        /**
         * Makes an HTML link to open the documentation of an element.
         *
         * @param docUrl The URL to the documentation to open.
         *
         * @returns A ``&lt;a>`` element that links to the documentation.
         */
        EditingMenuManager.prototype.makeDocumentationMenuItem = function (docURL) {
            var _this = this;
            var iconHtml = icon_1.makeHTML("documentation");
            var li = domutil_1.htmlToElements("<li><a tabindex='0' href='#'>" + iconHtml + " Element's documentation.</a></li>", this.doc)[0];
            var a = li.firstElementChild;
            $(a).click(function () {
                _this.editor.openDocumentationLink(docURL);
            });
            return li;
        };
        EditingMenuManager.prototype.setupCompletionMenu = function () {
            var _this = this;
            this.dismiss();
            var sel = this.caretManager.sel;
            // We must not have an actual range in effect
            if (sel === undefined || !sel.collapsed) {
                return;
            }
            // If we have a selection, we necessarily have a caret.
            var caret = this.caretManager.getNormalizedCaret();
            var node = caret.node;
            var attrVal = domutil_1.closestByClass(node, "_attribute_value", this.guiRoot);
            if (attrVal !== null) {
                if (domutil_1.isNotDisplayed(attrVal, this.guiRoot)) {
                    return;
                }
                var doc = node.ownerDocument;
                // If we have a selection, we necessarily have a caret.
                var dataCaret = this.caretManager.getDataCaret();
                // The node is necessarily an attribute.
                var dataNode = dataCaret.node;
                // We complete only at the end of an attribute value.
                if (dataCaret.offset !== dataNode.value.length) {
                    return;
                }
                // First see if the mode has something to say.
                var mode = this.modeTree.getMode(dataNode);
                var possible_1 = mode.getAttributeCompletions(dataNode);
                if (possible_1.length === 0) {
                    // Nothing from the mode, use the validator.
                    this.editor.validator.possibleAt(dataCaret.node, 0)
                        .forEach(function (ev) {
                        if (ev.params[0] !== "attributeValue") {
                            return;
                        }
                        var text = ev.params[1];
                        if (text instanceof RegExp) {
                            return;
                        }
                        possible_1.push(text);
                    });
                }
                // Nothing to complete.
                if (possible_1.length === 0) {
                    return;
                }
                var narrowed = [];
                for (var _i = 0, possible_2 = possible_1; _i < possible_2.length; _i++) {
                    var possibility = possible_2[_i];
                    if (possibility.lastIndexOf(dataNode.value, 0) === 0) {
                        narrowed.push(possibility);
                    }
                }
                // The current value in the attribute is not one that can be
                // completed.
                if (narrowed.length === 0 ||
                    (narrowed.length === 1 && narrowed[0] === dataNode.value)) {
                    return;
                }
                var pos = this.computeMenuPosition(undefined, true);
                this.caretManager.pushSelection();
                var menu_1 = this.currentDropdown = new completion_menu_1.CompletionMenu(this.editor, doc, pos.left, pos.top, dataNode.value, possible_1, function () {
                    _this.currentDropdown = undefined;
                    // If the focus moved from the document to the completion menu, we
                    // want to restore the caret. Otherwise, leave it as is.
                    if (menu_1.focused) {
                        _this.caretManager.popSelection();
                    }
                    else {
                        _this.caretManager.popSelectionAndDiscard();
                    }
                });
            }
        };
        /**
         * Computes where a menu should show up, depending on the event that triggered
         * it.
         *
         * @param e The event that triggered the menu. If no event is passed, it is
         * assumed that the menu was not triggered by a mouse event.
         *
         * @param bottom If the event was not triggered by a mouse event, then use the
         * bottom of the DOM entity used to compute the position, rather than its
         * middle to determine the ``y`` coordinate of the context menu.
         *
         * @returns The top and left coordinates where the menu should appear.
         */
        EditingMenuManager.prototype.computeMenuPosition = function (e, bottom) {
            if (bottom === void 0) { bottom = false; }
            if (e === undefined) {
                e = {};
            }
            // Take care of cases where the user is using the mouse.
            if (e.type === "mousedown" || e.type === "mouseup" || e.type === "click" ||
                e.type === "contextmenu") {
                return { left: e.clientX, top: e.clientY };
            }
            // The next conditions happen only if the user is using the keyboard
            var mark = this.caretManager.mark;
            if (mark.inDOM) {
                mark.scrollIntoView();
                // We need to refresh immediately and acquire the client rectangle of the
                // caret.
                mark.refresh();
                var rect = mark.getBoundingClientRect();
                return {
                    top: bottom ? rect.bottom : (rect.top + (rect.height / 2)),
                    left: rect.left,
                };
            }
            var gui = domutil_1.closestByClass(this.caretManager.caret.node, "_gui", this.guiRoot);
            if (gui !== null) {
                var rect = gui.getBoundingClientRect();
                // Middle of the region.
                return {
                    top: bottom ? rect.bottom : (rect.top + (rect.height / 2)),
                    left: rect.left + (rect.width / 2),
                };
            }
            throw new Error("no position for displaying the menu");
        };
        return EditingMenuManager;
    }());
    exports.EditingMenuManager = EditingMenuManager;
});
//  LocalWords:  MPL contextMenuHandler readonly actualNode treeCaret jQuery li
//  LocalWords:  prepend tabindex href getDescriptionFor iconHtml mousedown
//  LocalWords:  attributeValue mouseup contextmenu

//# sourceMappingURL=editing-menu-manager.js.map
