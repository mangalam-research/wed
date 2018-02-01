var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define(["require", "exports", "ajv", "jquery", "rxjs/operators/filter", "rxjs/Subject", "salve", "salve-dom", "./action", "./caret-manager", "./dloc", "./domlistener", "./domtypeguards", "./domutil", "./domutil", "./editor-actions", "./exceptions", "./gui-updater", "./gui/dialog-search-replace", "./gui/editing-menu-manager", "./gui/error-layer", "./gui/icon", "./gui/layer", "./gui/minibuffer", "./gui/modal", "./gui/notify", "./gui/quick-search", "./gui/scroller", "./gui/toolbar", "./gui/tooltip", "./guiroot", "./key", "./key-constants", "./log", "./mode-tree", "./onbeforeunload", "./onerror", "./options-schema.json", "./preferences", "./runtime", "./saver", "./stock-modals", "./task-runner", "./transformation", "./tree-updater", "./undo", "./undo-recorder", "./util", "./validation-controller", "./validator", "./wed-util", "./wundo", "bootstrap"], function (require, exports, Ajv, $, filter_1, Subject_1, salve, salve_dom_1, action_1, caret_manager_1, dloc_1, domlistener, domtypeguards_1, domutil, domutil_1, editorActions, exceptions_1, gui_updater_1, dialog_search_replace_1, editing_menu_manager_1, error_layer_1, icon, layer_1, minibuffer_1, modal_1, notify_1, quick_search_1, scroller_1, toolbar_1, tooltip_1, guiroot_1, key_1, keyConstants, log, mode_tree_1, onbeforeunload, onerror, optionsSchema, preferences, runtime_1, saver_1, stock_modals_1, task_runner_1, transformation_1, tree_updater_1, undo_1, undo_recorder_1, util, validation_controller_1, validator_1, wed_util_1, wundo) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.version = "1.0.0";
    // We don't put this in keyConstants because ESCAPE_KEYPRESS should never be
    // seen elsewhere.
    var ESCAPE_KEYPRESS = key_1.makeKey(27);
    function filterSaveEvents(name, ev) {
        return ev.name === name;
    }
    /**
     * An action for bringing up the complex pattern modal.
     */
    var ComplexPatternAction = /** @class */ (function (_super) {
        __extends(ComplexPatternAction, _super);
        function ComplexPatternAction() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(ComplexPatternAction.prototype, "modal", {
            get: function () {
                if (this._modal === undefined) {
                    var modal = this._modal = this.editor.makeModal();
                    modal.setTitle("Complex Name Pattern Encountered");
                    modal.setBody("<p>The schema contains here a complex name pattern modal. While wed \
has no problem validating such cases. It does not currently have facilities to \
add elements or attributes that match such patterns. You can continue editing \
your document but you will not be able to take advantage of the possibilities \
provided by the complex pattern here.</p>");
                    modal.addButton("Ok", true);
                }
                return this._modal;
            },
            enumerable: true,
            configurable: true
        });
        ComplexPatternAction.prototype.execute = function () {
            this.modal.modal();
        };
        return ComplexPatternAction;
    }(action_1.Action));
    /**
     * The possible targets for some wed operations that generate events. It is
     * currently used to determine where to type keys when calling [[Editor.type]].
     */
    var WedEventTarget;
    (function (WedEventTarget) {
        /** The default target is the main editing panel. */
        WedEventTarget[WedEventTarget["DEFAULT"] = 0] = "DEFAULT";
        /** Target the minibuffer. */
        WedEventTarget[WedEventTarget["MINIBUFFER"] = 1] = "MINIBUFFER";
    })(WedEventTarget = exports.WedEventTarget || (exports.WedEventTarget = {}));
    var FRAMEWORK_TEMPLATE = "\
<div class='row'>\
 <div class='toolbar'></div>\
 <div class='wed-frame col-sm-push-2 col-lg-10 col-md-10 col-sm-10'>\
  <div class='row'>\
   <div class='progress'>\
    <span></span>\
    <div class='wed-validation-progress progress-bar' style='width: 0%'></div>\
   </div>\
  </div>\
  <div class='row'>\
   <div class='wed-cut-buffer' contenteditable='true'></div>\
   <div class='wed-document-constrainer'>\
    <input class='wed-comp-field' type='text'></input>\
    <div class='wed-scroller'>\
     <div class='wed-caret-layer'></div>\
     <div class='wed-error-layer'></div>\
     <div class='wed-document'><span class='root-here'></span></div>\
    </div>\
   </div>\
   <div class='wed-minibuffer'></div>\
   <div class='wed-location-bar'>@&nbsp;<span>&nbsp;</span></div>\
  </div>\
 </div>\
 <div class='wed-sidebar col-sm-pull-10 col-lg-2 col-md-2 col-sm-2'>\
  <div class='wed-save-and-modification-status'>\
   <span class='wed-modification-status label label-success' \
         title='Modification status'>\
    <i class='fa fa-asterisk'></i>\
   </span>\
   <span class='wed-save-status label label-default'>\
    <i class='fa fa-cloud-upload'></i> <span></span>\
   </span>\
  </div>\
  <div id='sidebar-panel' class='panel-group wed-sidebar-panel'>\
   <div class='panel panel-info wed-navigation-panel'>\
    <div class='panel-heading'>\
     <div class='panel-title'>\
      <a class='accordion-toggle' data-toggle='collapse' \
         data-parent='#sidebar-panel' href='#sb-nav-collapse'>Navigation</a>\
     </div>\
    </div>\
   <div id='sb-nav-collapse' data-parent='#sidebar-panel' \
        class='panel-collapse collapse in'>\
     <div id='sb-nav' class='panel-body'>\
      <ul id='navlist' class='nav nav-list'>\
       <li class='inactive'>A list of navigation links will appear here</li>\
      </ul>\
     </div>\
    </div>\
   </div>\
   <div class='panel panel-danger'>\
    <div class='panel-heading'>\
     <div class='panel-title'>\
      <a class='accordion-toggle' data-toggle='collapse'\
         data-parent='#sidebar-panel' href='#sb-errors-collapse'>Errors</a>\
     </div>\
    </div>\
    <div id='sb-errors-collapse' data-parent='#sidebar-panel'\
         class='panel-collapse collapse'>\
     <div id='sb-errors' class='panel-body'>\
      <ul id='sb-errorlist' class='nav nav-list wed-errorlist'>\
       <li class='inactive'></li>\
      </ul>\
     </div>\
    </div>\
   </div>\
  </div>\
 </div>\
</div>";
    /**
     * This is the class to instantiate for editing.
     */
    var Editor = /** @class */ (function () {
        // tslint:disable-next-line:max-func-body-length
        function Editor(widget, options) {
            var _this = this;
            this._firstValidationComplete = false;
            // tslint:disable-next-line:no-any
            this.modeData = {};
            this.developmentMode = false;
            this.textUndoMaxLength = 10;
            this.taskRunners = [];
            this.taskSuspension = 0;
            // We may want to make this configurable in the future.
            this.normalizeEnteredSpaces = true;
            this.strippedSpaces = /\u200B/g;
            this.replacedSpaces = /\s+/g;
            this.destroying = false;
            this.destroyed = false;
            this.globalKeydownHandlers = [];
            this.updatingPlaceholder = 0;
            this.composing = false;
            this._transformations = new Subject_1.Subject();
            this.name = "";
            this.saveAction = new editorActions.Save(this);
            this.decreaseLabelVisibilityLevelAction = new editorActions.DecreaseLabelVisibilityLevel(this);
            this.increaseLabelVisibilityLevelAction = new editorActions.IncreaseLabelVisibilityLevel(this);
            this.undoAction = new editorActions.Undo(this);
            this.redoAction = new editorActions.Redo(this);
            this.toggleAttributeHidingAction = new editorActions.ToggleAttributeHiding(this);
            this.transformations = this._transformations.asObservable();
            // tslint:disable-next-line:promise-must-complete
            this.firstValidationComplete = new Promise(function (resolve) {
                _this.firstValidationCompleteResolve = resolve;
            });
            // tslint:disable-next-line:promise-must-complete
            this.initialized = new Promise(function (resolve) {
                _this.initializedResolve = resolve;
            });
            onerror.editors.push(this);
            this.widget = widget;
            this.$widget = $(this.widget);
            // We could be loaded in a frame in which case we should not alter anything
            // outside our frame.
            this.$frame = $(domutil_1.closest(this.widget, "html"));
            var doc = this.doc = this.$frame[0].ownerDocument;
            this.window = doc.defaultView;
            // It is possible to pass a runtime as "options" but if the user passed
            // actual options, then make a runtime from them.
            this.runtime = (options instanceof runtime_1.Runtime) ? options :
                new runtime_1.Runtime(options);
            options = this.runtime.options;
            this.modals = new stock_modals_1.StockModals(this);
            // ignore_module_config allows us to completely ignore the module config. In
            // some case, it may be difficult to just override individual values.
            // tslint:disable-next-line:no-any strict-boolean-expressions
            if (options.ignore_module_config) {
                console.warn("the option ignore_module_config is no longer useful");
            }
            var ajv = new Ajv();
            var optionsValidator = ajv.compile(optionsSchema);
            if (!optionsValidator(options)) {
                // tslint:disable-next-line:prefer-template
                throw new Error("the options passed to wed are not valid: " +
                    // We need "as string" due to:
                    // https://github.com/palantir/tslint/issues/2736
                    ajv.errorsText(optionsValidator.errors, {
                        dataVar: "options",
                    }));
            }
            if (options.ajaxlog !== undefined) {
                this.appender = log.addURL(options.ajaxlog.url, options.ajaxlog.headers);
            }
            this.name = options.name !== undefined ? options.name : "";
            this.options = options;
            var docURL = this.options.docURL;
            this.docURL = docURL == null ? "./doc/index.html" : docURL;
            this.preferences = new preferences.Preferences({
                tooltips: true,
            });
            // This structure will wrap around the document to be edited.
            //
            // We duplicate data-parent on the toggles and on the collapsible
            // elements due to a bug in Bootstrap 3.0.0. See
            // https://github.com/twbs/bootstrap/issues/9933.
            //
            var framework = domutil_1.htmlToElements(FRAMEWORK_TEMPLATE, doc)[0];
            //
            // Grab all the references we need while framework does not yet contain the
            // document to be edited. (Faster!)
            //
            var guiRoot = this.guiRoot =
                framework.getElementsByClassName("wed-document")[0];
            this.$guiRoot = $(guiRoot);
            this.scroller =
                new scroller_1.Scroller(framework.getElementsByClassName("wed-scroller")[0]);
            this.constrainer =
                framework
                    .getElementsByClassName("wed-document-constrainer")[0];
            var toolbar = this.toolbar = new toolbar_1.Toolbar();
            var toolbarPlaceholder = framework.getElementsByClassName("toolbar")[0];
            toolbarPlaceholder.parentNode.insertBefore(toolbar.top, toolbarPlaceholder);
            toolbarPlaceholder.parentNode.removeChild(toolbarPlaceholder);
            this.inputField =
                framework.getElementsByClassName("wed-comp-field")[0];
            this.$inputField = $(this.inputField);
            this.cutBuffer =
                framework.getElementsByClassName("wed-cut-buffer")[0];
            this.caretLayer = new layer_1.Layer(framework.getElementsByClassName("wed-caret-layer")[0]);
            this.errorLayer = new error_layer_1.ErrorLayer(framework.getElementsByClassName("wed-error-layer")[0]);
            this.wedLocationBar =
                framework.getElementsByClassName("wed-location-bar")[0];
            this.minibuffer = new minibuffer_1.Minibuffer(framework.getElementsByClassName("wed-minibuffer")[0]);
            var sidebar = this.sidebar =
                framework.getElementsByClassName("wed-sidebar")[0];
            this.validationProgress =
                framework
                    .getElementsByClassName("wed-validation-progress")[0];
            this.validationMessage =
                this.validationProgress.previousElementSibling;
            // Insert the framework and put the document in its proper place.
            var rootPlaceholder = framework.getElementsByClassName("root-here")[0];
            if (this.widget.firstChild !== null) {
                // tslint:disable-next-line:no-any
                if (!(this.widget.firstChild instanceof this.window.Element)) {
                    throw new Error("the data is populated with DOM elements constructed " +
                        "from another window");
                }
                rootPlaceholder.parentNode.insertBefore(this.widget.firstChild, rootPlaceholder);
            }
            rootPlaceholder.parentNode.removeChild(rootPlaceholder);
            this.widget.appendChild(framework);
            this.caretOwners = guiRoot.getElementsByClassName("_owns_caret");
            this.clickedLabels = guiRoot.getElementsByClassName("_label_clicked");
            this.withCaret = guiRoot.getElementsByClassName("_with_caret");
            this.$modificationStatus =
                $(sidebar.getElementsByClassName("wed-modification-status")[0]);
            this.$saveStatus =
                $(sidebar.getElementsByClassName("wed-save-status")[0]);
            this.$navigationPanel =
                $(sidebar.getElementsByClassName("wed-navigation-panel")[0]);
            this.$navigationPanel.css("display", "none");
            this.$navigationList = $(doc.getElementById("navlist"));
            this.$errorList = $(doc.getElementById("sb-errorlist"));
            this.$excludedFromBlur = $();
            this.errorItemHandlerBound = this.errorItemHandler.bind(this);
            this._undo = new undo_1.UndoList();
            this.complexPatternAction = new ComplexPatternAction(this, "Complex name pattern", undefined, icon.makeHTML("exclamation"), true);
            this.pasteTr = new transformation_1.Transformation(this, "add", "Paste", this.paste.bind(this));
            this.cutTr = new transformation_1.Transformation(this, "delete", "Cut", this.cut.bind(this));
            this.replaceRangeTr =
                new transformation_1.Transformation(this, "transform", "Replace Range", this.replaceRange.bind(this));
            this.splitNodeTr =
                new transformation_1.Transformation(this, "split", "Split <name>", function (editor, data) {
                    transformation_1.splitNode(editor, data.node);
                });
            this.mergeWithPreviousHomogeneousSiblingTr =
                new transformation_1.Transformation(this, "merge-with-previous", "Merge <name> with previous", function (editor, data) {
                    transformation_1.mergeWithPreviousHomogeneousSibling(editor, data.node);
                });
            this.mergeWithNextHomogeneousSiblingTr =
                new transformation_1.Transformation(this, "merge-with-next", "Merge <name> with next", function (editor, data) {
                    transformation_1.mergeWithNextHomogeneousSibling(editor, data.node);
                });
            this.removeMarkupTr =
                new transformation_1.Transformation(this, "delete", "Remove mixed-content markup", "Remove mixed-content markup", "<i class='fa fa-eraser'></i>", true, transformation_1.removeMarkup);
            toolbar.addButton([this.saveAction.makeButton(),
                this.undoAction.makeButton(),
                this.redoAction.makeButton(),
                this.decreaseLabelVisibilityLevelAction.makeButton(),
                this.increaseLabelVisibilityLevelAction.makeButton(),
                this.removeMarkupTr.makeButton(),
                this.toggleAttributeHidingAction.makeButton()]);
            // Setup the cleanup code.
            $(this.window).on("unload.wed", { editor: this }, function (e) {
                e.data.editor.destroy();
            });
            $(this.window).on("popstate.wed", function () {
                if (document.location.hash === "") {
                    _this.guiRoot.scrollTop = 0;
                }
            });
        }
        Object.defineProperty(Editor.prototype, "undoEvents", {
            get: function () {
                return this._undo.events;
            },
            enumerable: true,
            configurable: true
        });
        Editor.prototype.fireTransformation = function (tr, data) {
            // This is necessary because our context menu saves/restores the selection
            // using rangy. If we move on without this call, then the transformation
            // could destroy the markers that rangy put in and rangy will complain.
            this.editingMenuManager.dismiss();
            var currentGroup = this._undo.getGroup();
            if (currentGroup instanceof wundo.TextUndoGroup) {
                this._undo.endGroup();
            }
            var newGroup = new wundo.UndoGroup("Undo " + tr.getDescriptionFor(data), this);
            this._undo.startGroup(newGroup);
            this.caretManager.mark.suspend();
            this.enterTaskSuspension();
            try {
                try {
                    // We've separated the core of the work into a another method so that it
                    // can be optimized.
                    this._fireTransformation(tr, data);
                }
                catch (ex) {
                    // We want to log it before we attempt to do anything else.
                    if (!(ex instanceof exceptions_1.AbortTransformationException)) {
                        log.handle(ex);
                    }
                    throw ex;
                }
                finally {
                    // It is possible for a transformation to create new subgroups without
                    // going through fireTransformation. So we terminate all groups until
                    // the last one we terminated is the one we created.
                    do {
                        currentGroup = this._undo.getGroup();
                        this._undo.endGroup();
                    } while (currentGroup !== newGroup);
                }
            }
            catch (ex) {
                this.undo();
                if (!(ex instanceof exceptions_1.AbortTransformationException)) {
                    throw ex;
                }
            }
            finally {
                this.caretManager.mark.resume();
                this.exitTaskSuspension();
                this.validationController.refreshErrors();
            }
        };
        Editor.prototype._fireTransformation = function (tr, data) {
            var node = data.node;
            if (node !== undefined) {
                // Convert the gui node to a data node
                if (this.guiRoot.contains(node)) {
                    var dataNode = this.toDataNode(node);
                    data.node = dataNode === null ? undefined : dataNode;
                }
                else {
                    if (!domutil.contains(this.dataRoot, node)) {
                        throw new Error("node is neither in the gui tree nor the data tree");
                    }
                }
            }
            var caret = data.moveCaretTo;
            if (caret !== undefined) {
                this.caretManager.setCaret(caret);
            }
            if (this.caretManager.caret === undefined) {
                throw new Error("transformation applied with undefined caret.");
            }
            this._transformations.next({
                name: "StartTransformation",
                transformation: tr,
            });
            tr.handler(this, data);
            this._transformations.next({
                name: "EndTransformation",
                transformation: tr,
            });
        };
        /**
         * Enter a state in which all tasks are suspended. It is possible to call this
         * method while the state is already in effect. Its sister method
         * ``exitTaskSuspension`` should be called the same number of times to resume
         * the tasks.
         */
        Editor.prototype.enterTaskSuspension = function () {
            if (this.taskSuspension === 0) {
                this.stopAllTasks();
            }
            this.taskSuspension++;
        };
        /**
         * Exit a state in which all tasks are suspended. For the state to be
         * effectively exited, this method needs to be called the same number of times
         * ``enterTaskSuspension`` was called.
         */
        Editor.prototype.exitTaskSuspension = function () {
            this.taskSuspension--;
            if (this.taskSuspension < 0) {
                throw new Error("exitTaskSuspension underflow");
            }
            if (this.taskSuspension === 0) {
                this.resumeAllTasks();
            }
        };
        /**
         * Unconditionally stop all tasks.
         */
        Editor.prototype.stopAllTasks = function () {
            for (var _i = 0, _a = this.taskRunners; _i < _a.length; _i++) {
                var runner = _a[_i];
                runner.stop();
            }
            this.validationController.stop();
        };
        /**
         * Unconditionally resume all tasks.
         */
        Editor.prototype.resumeAllTasks = function () {
            for (var _i = 0, _a = this.taskRunners; _i < _a.length; _i++) {
                var runner = _a[_i];
                runner.resume();
            }
            // The validator is a special case. And yes, ``start`` is the correct method
            // to call on it.
            this.validationController.resume();
        };
        /**
         * If we are not in the task suspended state that is entered upon calling
         * ``enterTaskSuspension``, resume the task right away. Otherwise, this is a
         * no-op.
         */
        Editor.prototype.resumeTaskWhenPossible = function (task) {
            if (this.taskSuspension === 0) {
                task.resume();
            }
        };
        /**
         * Record an undo object in the list of undoable operations.
         *
         * Note that this method also provides the implementation for the restricted
         * method of the same name that allows only [["wed/undo".UndoMarker]] objects.
         *
         * @param undo The object to record.
         */
        Editor.prototype.recordUndo = function (undo) {
            this._undo.record(undo);
        };
        Editor.prototype.undoAll = function () {
            while (this._undo.canUndo()) {
                this.undo();
            }
        };
        Editor.prototype.undo = function () {
            // We need to replicate to some extent how fireTransformation inhibits
            // functions and reinstates them.
            this.caretManager.mark.suspend();
            this.enterTaskSuspension();
            this.undoRecorder.suppressRecording(true);
            this._undo.undo();
            this.undoRecorder.suppressRecording(false);
            this.caretManager.mark.resume();
            this.exitTaskSuspension();
        };
        Editor.prototype.redo = function () {
            // We need to replicate to some extent how fireTransformation inhibits
            // functions and reinstates them.
            this.caretManager.mark.suspend();
            this.enterTaskSuspension();
            this.undoRecorder.suppressRecording(true);
            this._undo.redo();
            this.undoRecorder.suppressRecording(false);
            this.caretManager.mark.resume();
            this.exitTaskSuspension();
        };
        Editor.prototype.dumpUndo = function () {
            // tslint:disable-next-line:no-console
            console.log(this._undo.toString());
        };
        Editor.prototype.undoingOrRedoing = function () {
            return this._undo.undoingOrRedoing();
        };
        Editor.prototype.isAttrProtected = function (attr, parent) {
            var name;
            if (typeof attr === "string") {
                name = attr;
                if (parent === undefined) {
                    throw new Error("must specify a parent");
                }
            }
            else if (domtypeguards_1.isAttr(attr)) {
                name = attr.name;
            }
            else if (domtypeguards_1.isElement(attr)) {
                name = domutil.siblingByClass(attr, "_attribute_name").textContent;
            }
            else {
                throw new Error("unexpected value for attr");
            }
            return (name === "xmlns" || name.lastIndexOf("xmlns:", 0) === 0);
        };
        Editor.prototype.save = function () {
            return this.saver.save();
        };
        Editor.prototype.initiateTextUndo = function () {
            // Handle undo information
            var currentGroup = this._undo.getGroup();
            if (currentGroup === undefined ||
                !(currentGroup instanceof wundo.TextUndoGroup)) {
                currentGroup = new wundo.TextUndoGroup("text", this, this._undo, this.textUndoMaxLength);
                this._undo.startGroup(currentGroup);
            }
            return currentGroup;
        };
        Editor.prototype.terminateTextUndo = function () {
            var currentGroup = this._undo.getGroup();
            if (currentGroup instanceof wundo.TextUndoGroup) {
                this._undo.endGroup();
            }
        };
        Editor.prototype.normalizeEnteredText = function (text) {
            if (!this.normalizeEnteredSpaces) {
                return text;
            }
            return text.replace(this.strippedSpaces, "")
                .replace(this.replacedSpaces, " ");
        };
        Editor.prototype.compensateForAdjacentSpaces = function (text, caret) {
            if (!this.normalizeEnteredSpaces) {
                return text;
            }
            var arCaret = caret.toArray();
            // If there is previous text and the previous text
            // is a space, then we need to prevent a double
            // space.
            if (text[0] === " " &&
                domutil.getCharacterImmediatelyBefore(arCaret) === " ") {
                text = text.slice(1);
            }
            // Same with the text that comes after.
            if (text.length > 0 && text[text.length - 1] === " " &&
                domutil.getCharacterImmediatelyAt(arCaret) === " ") {
                text = text.slice(-1);
            }
            return text;
        };
        Editor.prototype.insertText = function (text) {
            // We remove zero-width spaces.
            this.closeAllTooltips();
            text = this.normalizeEnteredText(text);
            if (text === "") {
                return;
            }
            var caretManager = this.caretManager;
            var caret = caretManager.caret;
            if (caret === undefined) {
                return;
            }
            var el = domutil_1.closestByClass(caret.node, "_real", this.guiRoot);
            // We do not operate on elements that are readonly.
            if (el === null || el.classList.contains("_readonly")) {
                return;
            }
            this.enterTaskSuspension();
            try {
                var attrVal = domutil_1.closestByClass(caret.node, "_attribute_value", this.guiRoot);
                if (attrVal === null) {
                    caret = caretManager.getDataCaret();
                    text = this.compensateForAdjacentSpaces(text, caret);
                    if (text === "") {
                        return;
                    }
                    var textUndo = this.initiateTextUndo();
                    var newCaret = this.dataUpdater.insertText(caret, text).caret;
                    caretManager.setCaret(newCaret, { textEdit: true });
                    textUndo.recordCaretAfter();
                }
                else {
                    // Modifying an attribute...
                    this.spliceAttribute(attrVal, caret.offset, 0, text);
                }
            }
            finally {
                this.exitTaskSuspension();
                this.validationController.refreshErrors();
            }
        };
        Editor.prototype.spliceAttribute = function (attrVal, offset, count, add) {
            if (offset < 0) {
                return;
            }
            // We ignore changes to protected attributes.
            if (this.isAttrProtected(attrVal)) {
                return;
            }
            var val = this.toDataNode(attrVal).value;
            if (offset > val.length) {
                return;
            }
            if (offset === val.length && count > 0) {
                return;
            }
            if (this.normalizeEnteredSpaces) {
                if (add[0] === " " && val[offset - 1] === " ") {
                    add = add.slice(1);
                }
                if (add[add.length - 1] === " " && val[offset + count] === " ") {
                    add = add.slice(-1);
                }
            }
            var textUndo = this.initiateTextUndo();
            val = val.slice(0, offset) + add + val.slice(offset + count);
            offset += add.length;
            var dataReal = $.data(domutil_1.closestByClass(attrVal, "_real"), "wed_mirror_node");
            var guiPath = this.nodeToPath(attrVal);
            var name = domutil.siblingByClass(attrVal, "_attribute_name").textContent;
            var mode = this.modeTree.getMode(attrVal);
            var resolved = mode.getAbsoluteResolver().resolveName(name, true);
            if (resolved === undefined) {
                throw new Error("cannot resolve " + name);
            }
            this.dataUpdater.setAttributeNS(dataReal, resolved.ns, resolved.name, val);
            // Redecoration of the attribute's element may have destroyed our old
            // attrVal node. Refetch. And after redecoration, the attribute value
            // element may not have a child. Not only that, but the attribute may no
            // longer be shown at all.
            var moveTo;
            try {
                moveTo = this.pathToNode(guiPath);
                if (moveTo.firstChild !== null) {
                    moveTo = moveTo.firstChild;
                }
            }
            catch (ex) {
                if (!(ex instanceof guiroot_1.AttributeNotFound)) {
                    throw ex;
                }
            }
            // We don't have an attribute to go back to. Go back to the element that
            // held the attribute.
            if (moveTo == null) {
                moveTo = dataReal;
                offset = 0;
            }
            this.caretManager.setCaret(moveTo, offset, { textEdit: true });
            textUndo.recordCaretAfter();
        };
        Editor.prototype.insertTransientPlaceholderAt = function (loc) {
            var ph = 
            // tslint:disable-next-line:no-jquery-raw-elements
            $("<span class='_placeholder _transient' contenteditable='false'> \
</span>", loc.node.ownerDocument)[0];
            this.guiUpdater.insertNodeAt(loc, ph);
            return ph;
        };
        Editor.prototype.toDataNode = function (node) {
            if (domtypeguards_1.isElement(node)) {
                var ret = $.data(node, "wed_mirror_node");
                // We can bypass the whole pathToNode, nodeToPath thing.
                if (ret != null) {
                    return ret;
                }
            }
            return this.dataUpdater.pathToNode(this.nodeToPath(node));
        };
        Editor.prototype.fromDataNode = function (node) {
            if (domtypeguards_1.isElement(node)) {
                var ret = $.data(node, "wed_mirror_node");
                // We can bypass the whole pathToNode, nodeToPath thing.
                if (ret != null) {
                    return ret;
                }
            }
            return this.pathToNode(this.dataUpdater.nodeToPath(node));
        };
        Editor.prototype.onSaverSaved = function () {
            notify_1.notify("Saved", { type: "success" });
            this.refreshSaveStatus();
        };
        Editor.prototype.onSaverAutosaved = function () {
            notify_1.notify("Autosaved", { type: "success" });
            this.refreshSaveStatus();
        };
        Editor.prototype.onSaverChanged = function () {
            this.refreshSaveStatus();
        };
        Editor.prototype.onSaverFailed = function (event) {
            var _this = this;
            this.refreshSaveStatus();
            var error = event.error;
            if (error.type === "too_old") {
                // Reload when the modal is dismissed.
                this.modals.getModal("tooOld").modal(this.window.location.reload.bind(this.window.location));
            }
            else if (error.type === "save_disconnected") {
                this.modals.getModal("disconnect").modal(function () {
                    // tslint:disable-next-line:no-floating-promises
                    _this.save();
                });
            }
            else if (error.type === "save_edited") {
                this.modals.getModal("editedByOther").modal(function () {
                    _this.window.location.reload();
                });
            }
            else {
                notify_1.notify("Failed to save!\n" + error.msg, { type: "danger" });
            }
        };
        Editor.prototype.nodeToPath = function (node) {
            return this.guiDLocRoot.nodeToPath(node);
        };
        Editor.prototype.pathToNode = function (path) {
            return this.guiDLocRoot.pathToNode(path);
        };
        // tslint:disable-next-line:no-any
        Editor.prototype.getModeData = function (key) {
            return this.modeData[key];
        };
        // tslint:disable-next-line:no-any
        Editor.prototype.setModeData = function (key, value) {
            this.modeData[key] = value;
        };
        Editor.prototype.destroy = function () {
            this.destroying = true;
            if (this.destroyed) {
                return;
            }
            var myIndex = onerror.editors.indexOf(this);
            if (myIndex >= 0) {
                onerror.editors.splice(myIndex, 1);
            }
            //
            // This is imperfect, but the goal here is to do as much work as possible,
            // even if things have not been initialized fully.
            //
            // The last recorded exception will be rethrown at the end.
            //
            // Turn off autosaving.
            if (this.saver !== undefined) {
                this.saver.setAutosaveInterval(0);
            }
            if (this.saveStatusInterval !== undefined) {
                clearInterval(this.saveStatusInterval);
            }
            try {
                if (this.validationController !== undefined) {
                    this.validationController.terminate();
                }
            }
            catch (ex) {
                log.unhandled(ex);
            }
            if (this.taskRunners !== undefined) {
                for (var _i = 0, _a = this.taskRunners; _i < _a.length; _i++) {
                    var runner = _a[_i];
                    try {
                        runner.stop();
                    }
                    catch (ex) {
                        log.unhandled(ex);
                    }
                }
            }
            try {
                if (this.domlistener !== undefined) {
                    this.domlistener.stopListening();
                    this.domlistener.clearPending();
                }
            }
            catch (ex) {
                log.unhandled(ex);
            }
            if (this.editingMenuManager !== undefined) {
                this.editingMenuManager.dismiss();
            }
            // These ought to prevent jQuery leaks.
            try {
                this.$widget.empty();
                this.$frame.find("*").off(".wed");
                // This will also remove handlers on the window.
                $(this.window).off(".wed");
            }
            catch (ex) {
                log.unhandled(ex);
            }
            // Trash our variables: this will likely cause immediate failure if the
            // object is used again.
            for (var _b = 0, _c = Object.keys(this); _b < _c.length; _b++) {
                var key = _c[_b];
                // tslint:disable-next-line:no-any
                delete this[key];
            }
            if (this.appender !== undefined) {
                log.removeAppender(this.appender);
            }
            // ... but keep these two. Calling destroy over and over is okay.
            this.destroyed = true;
            // tslint:disable-next-line:no-empty
            this.destroy = function fakeDestroy() { };
        };
        Editor.prototype.init = function (xmlData) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                var parser, hasTooltips;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            parser = new this.window.DOMParser();
                            if (xmlData !== undefined && xmlData !== "") {
                                this.dataRoot = parser.parseFromString(xmlData, "text/xml");
                                this._dataChild = this.dataRoot.firstChild;
                            }
                            else {
                                this.dataRoot = parser.parseFromString("<div></div>", "text/xml");
                                this._dataChild = undefined;
                            }
                            this.dataRoot.removeChild(this.dataRoot.firstChild);
                            // $dataRoot is the document we are editing, $guiRoot will become decorated
                            // with all kinds of HTML elements so we keep the two separate.
                            this.$dataRoot = $(this.dataRoot);
                            this.guiDLocRoot = new guiroot_1.GUIRoot(this.guiRoot);
                            this.dataDLocRoot = new dloc_1.DLocRoot(this.dataRoot);
                            this.dataUpdater = new tree_updater_1.TreeUpdater(this.dataRoot);
                            this.guiUpdater = new gui_updater_1.GUIUpdater(this.guiRoot, this.dataUpdater);
                            this.undoRecorder = new undo_recorder_1.UndoRecorder(this, this.dataUpdater);
                            this.guiUpdater.events.subscribe(function (ev) {
                                switch (ev.name) {
                                    case "BeforeInsertNodeAt":
                                        if (domtypeguards_1.isElement(ev.node)) {
                                            _this.initialContentEditableHandler(ev);
                                        }
                                        break;
                                    case "InsertNodeAt":
                                        if (domtypeguards_1.isElement(ev.node)) {
                                            _this.finalContentEditableHandler(ev);
                                        }
                                        break;
                                    default:
                                }
                            });
                            hasTooltips = document.getElementsByClassName("wed-has-tooltip");
                            this.guiUpdater.events.subscribe(function (ev) {
                                if (ev.name !== "BeforeDeleteNode") {
                                    return;
                                }
                                var node = ev.node;
                                if (node.nodeType !== Node.TEXT_NODE) {
                                    for (var _i = 0, _a = Array.from(hasTooltips); _i < _a.length; _i++) {
                                        var hasTooltip = _a[_i];
                                        if (!node.contains(hasTooltip)) {
                                            continue;
                                        }
                                        var tt = $.data(hasTooltip, "bs.tooltip");
                                        if (tt != null) {
                                            tt.destroy();
                                        }
                                        // We don't remove the wed-has-tooltip class. Generally, the elements
                                        // that have tooltips and are removed from the GUI tree won't be added
                                        // to the tree again. If they are added again, they'll most likely get
                                        // a new tooltip so removing the class does not gain us much because
                                        // it will be added again.
                                        //
                                        // If we *were* to remove the class, then the collection would change
                                        // as we go through it.
                                    }
                                }
                            });
                            this.domlistener = new domlistener.DOMListener(this.guiRoot, this.guiUpdater);
                            this.modeTree = new mode_tree_1.ModeTree(this, this.options.mode);
                            return [4 /*yield*/, this.modeTree.init()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.onModeChange(this.modeTree.getMode(this.guiRoot))];
                    }
                });
            });
        };
        Editor.prototype.onModeChange = function (mode) {
            return __awaiter(this, void 0, void 0, function () {
                var styles, $head, _i, styles_1, style, schema, schemaOption, schemaText;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // We purposely do not raise an error here so that calls to destroy can be
                            // done as early as possible. It aborts the initialization sequence without
                            // causing an error.
                            if (this.destroyed) {
                                return [2 /*return*/, this];
                            }
                            this.maxLabelLevel = this.modeTree.getMaxLabelLevel();
                            this.initialLabelLevel = this.modeTree.getInitialLabelLevel();
                            this.currentLabelLevel = this.initialLabelLevel;
                            styles = this.modeTree.getStylesheets();
                            $head = this.$frame.children("head");
                            for (_i = 0, styles_1 = styles; _i < styles_1.length; _i++) {
                                style = styles_1[_i];
                                $head.append("<link rel=\"stylesheet\" href=\"" + style + "\" type=\"text/css\" />");
                            }
                            this.guiRoot.setAttribute("tabindex", "-1");
                            this.$guiRoot.focus();
                            this.caretManager = new caret_manager_1.CaretManager(this.guiDLocRoot, this.dataDLocRoot, this.inputField, this.guiUpdater, this.caretLayer, this.scroller, this.modeTree);
                            this.editingMenuManager = new editing_menu_manager_1.EditingMenuManager(this);
                            this.caretManager.events.subscribe(this.caretChange.bind(this));
                            this.resizeHandler();
                            schemaOption = this.options.schema;
                            if (!(schemaOption instanceof salve.Grammar)) return [3 /*break*/, 1];
                            schema = schemaOption;
                            return [3 /*break*/, 4];
                        case 1:
                            if (!(typeof schemaOption === "string")) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.runtime.resolveToString(schemaOption)];
                        case 2:
                            schemaText = _a.sent();
                            schema = salve.constructTree(schemaText);
                            return [3 /*break*/, 4];
                        case 3: throw new Error("unexpected value for schema");
                        case 4:
                            this.validator = new validator_1.Validator(schema, this.dataRoot, this.modeTree.getValidators());
                            this.validator.events.addEventListener("state-update", this.onValidatorStateChange.bind(this));
                            this.validator.events.addEventListener("possible-due-to-wildcard-change", this.onPossibleDueToWildcardChange.bind(this));
                            this.validationController =
                                new validation_controller_1.ValidationController(this, this.validator, mode.getAbsoluteResolver(), this.scroller, this.guiRoot, this.validationProgress, this.validationMessage, this.errorLayer, this.$errorList[0], this.errorItemHandlerBound);
                            return [2 /*return*/, this.postInitialize()];
                    }
                });
            });
        };
        // tslint:disable-next-line:max-func-body-length
        Editor.prototype.postInitialize = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                var attributePlaceholderHandler, $guiRoot, $body, namespaceError, limitationModal, demo, demoModal, save, savePromise;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (this.destroyed) {
                                return [2 /*return*/, this];
                            }
                            // Make the validator revalidate the structure from the point where a change
                            // occurred.
                            this.domlistener.addHandler("children-changed", "._real, ._phantom_wrap, .wed-document", function (root, added, removed, prev, next, target) {
                                for (var _i = 0, _a = added.concat(removed); _i < _a.length; _i++) {
                                    var child = _a[_i];
                                    if (domtypeguards_1.isText(child) ||
                                        (domtypeguards_1.isElement(child) &&
                                            (child.classList.contains("_real") ||
                                                child.classList.contains("_phantom_wrap")))) {
                                        _this.validator.resetTo(target);
                                        break;
                                    }
                                }
                            });
                            // Revalidate on attribute change.
                            this.domlistener.addHandler("attribute-changed", "._real", function (root, el, namespace, name) {
                                if (namespace === "" && name.indexOf("data-wed", 0) === 0) {
                                    // Doing the restart immediately messes up the editing. So schedule it
                                    // for ASAP.
                                    setTimeout(function () {
                                        if (_this.destroyed) {
                                            return;
                                        }
                                        _this.validator.resetTo(el);
                                    }, 0);
                                }
                            });
                            this.modeTree.addDecoratorHandlers();
                            this.domlistener.addHandler("included-element", "._label", function (root, tree, parent, prev, next, target) {
                                var cl = target.classList;
                                var found;
                                for (var i = 0; i < cl.length && found === undefined; ++i) {
                                    if (cl[i].lastIndexOf("_label_level_", 0) === 0) {
                                        found = Number(cl[i].slice(13));
                                    }
                                }
                                if (found === undefined) {
                                    throw new Error("unable to get level");
                                }
                                if (found > _this.currentLabelLevel) {
                                    cl.add("_invisible");
                                }
                            });
                            // If an element is edited and contains a placeholder, delete the
                            // placeholder
                            this.domlistener.addHandler("children-changed", "._real, ._phantom_wrap, .wed-document", 
                            // tslint:disable-next-line:cyclomatic-complexity
                            function (root, added, removed, prev, next, target) {
                                if (_this.updatingPlaceholder !== 0) {
                                    return;
                                }
                                _this.updatingPlaceholder++;
                                // We perform this check on the GUI tree because there's no way to know
                                // about ._phantom._text elements in the data tree.
                                var toConsider = [];
                                var ph;
                                var child = target.firstChild;
                                while (child !== null) {
                                    if (domtypeguards_1.isText(child) ||
                                        (domtypeguards_1.isElement(child) &&
                                            (child.classList.contains("_real") ||
                                                child.classList.contains("_phantom_wrap") ||
                                                // For ._phantom._text but ._text is used only with ._real and
                                                // ._phantom so we don't check for ._phantom.
                                                child.classList.contains("_text")))) {
                                        toConsider.push(child);
                                    }
                                    if (domtypeguards_1.isElement(child) && child.classList.contains("_placeholder")) {
                                        ph = child;
                                    }
                                    child = child.nextSibling;
                                }
                                var caretManager = _this.caretManager;
                                if (toConsider.length === 0 ||
                                    (toConsider.length === 1 &&
                                        removed.indexOf(toConsider[0]) !== -1)) {
                                    if (ph === undefined) {
                                        var mode = _this.modeTree.getMode(target);
                                        var nodes = mode.nodesAroundEditableContents(target);
                                        if (target === _this.guiRoot) {
                                            var loc = caretManager.makeCaret(_this.guiRoot, 0);
                                            ph = _this.insertTransientPlaceholderAt(loc);
                                            caretManager.setCaret(loc, { textEdit: true });
                                        }
                                        else {
                                            ph = mode.makePlaceholderFor(target);
                                            _this.guiUpdater.insertBefore(target, ph, nodes[1]);
                                        }
                                    }
                                }
                                else if (ph !== undefined && !ph.classList.contains("_transient")) {
                                    var caret = caretManager.caret !== undefined ?
                                        caretManager.caret.node : undefined;
                                    // Move the caret out of the placeholder if needed...
                                    var move = caret !== undefined && ph.contains(caret);
                                    var parent_1;
                                    var offset = void 0;
                                    if (move) {
                                        parent_1 = ph.parentNode;
                                        offset = domutil_1.indexOf(parent_1.childNodes, ph);
                                    }
                                    _this.guiUpdater.removeNode(ph);
                                    if (move) {
                                        caretManager.setCaret(parent_1, offset, { textEdit: true });
                                    }
                                }
                                _this.updatingPlaceholder--;
                            });
                            attributePlaceholderHandler = function (target) {
                                if (_this.updatingPlaceholder !== 0) {
                                    return;
                                }
                                _this.updatingPlaceholder++;
                                var dataNode = _this.toDataNode(target);
                                var ph = domutil.childByClass(target, "_placeholder");
                                if (dataNode.value !== "") {
                                    if (ph !== null) {
                                        target.removeChild(ph);
                                    }
                                }
                                else if (ph === null) {
                                    _this.guiUpdater.insertBefore(target, domutil.makePlaceholder(), null);
                                }
                                _this.updatingPlaceholder--;
                            };
                            this.domlistener.addHandler("children-changed", "._attribute_value", function (root, added, removed, prev, next, target) {
                                attributePlaceholderHandler(target);
                            });
                            this.domlistener.addHandler("included-element", "._attribute_value", function (root, tree, parent, prev, next, target) {
                                attributePlaceholderHandler(target);
                            });
                            this.modeTree.startListening();
                            if (this._dataChild !== undefined) {
                                this.dataUpdater.insertAt(this.dataRoot, 0, this._dataChild);
                            }
                            $guiRoot = this.$guiRoot;
                            // tslint:disable-next-line:no-any
                            $guiRoot.on("dragenter", "*", false);
                            // tslint:disable-next-line:no-any
                            $guiRoot.on("dragstart", "*", false);
                            // tslint:disable-next-line:no-any
                            $guiRoot.on("dragover", "*", false);
                            // tslint:disable-next-line:no-any
                            $guiRoot.on("drop", "*", false);
                            $guiRoot.on("wed-global-keydown", this.globalKeydownHandler.bind(this));
                            $guiRoot.on("wed-global-keypress", this.globalKeypressHandler.bind(this));
                            $guiRoot.on("keydown", this.keydownHandler.bind(this));
                            $guiRoot.on("keypress", this.keypressHandler.bind(this));
                            this.$inputField.on("keydown", this.keydownHandler.bind(this));
                            this.$inputField.on("keypress", this.keypressHandler.bind(this));
                            this.$inputField.on("compositionstart compositionupdate compositionend", this.compositionHandler.bind(this));
                            this.$inputField.on("input", this.inputHandler.bind(this));
                            // No click in the next binding because click does not distinguish left,
                            // middle, right mouse buttons.
                            $guiRoot.on("mousedown", this.mousedownHandler.bind(this));
                            $guiRoot.on("mouseover", this.mouseoverHandler.bind(this));
                            $guiRoot.on("mouseout", this.mouseoutHandler.bind(this));
                            $guiRoot.on("contextmenu", this.mouseupHandler.bind(this));
                            $guiRoot.on("paste", log.wrap(this.pasteHandler.bind(this)));
                            this.$inputField.on("paste", log.wrap(this.pasteHandler.bind(this)));
                            $guiRoot.on("cut", log.wrap(this.cutHandler.bind(this)));
                            $(this.window).on("resize.wed", this.resizeHandler.bind(this));
                            $guiRoot.on("click", "a", function (ev) {
                                if (ev.ctrlKey) {
                                    window.location.href = ev.currentTarget.href;
                                }
                                return false;
                            });
                            $body = $(this.doc.body);
                            $body.on("mouseup.wed", function () {
                                _this.$guiRoot.off("mousemove.wed mouseup");
                            });
                            $body.on("contextmenu.wed", function (ev) {
                                // It may happen that contextmenu can escape to the body even if the
                                // target is an element in guiRoot. This notably happens on IE for some
                                // reason. So trap such cases here and dispose of them.
                                return !_this.guiRoot.contains(ev.target);
                            });
                            $body.on("click.wed", function (ev) {
                                // If the click is triggered programmatically ``pageX`` and ``pageY``
                                // won't be defined. If the click is triggered due to an ENTER key
                                // converted by the browser, one or both will be negative. Or screenX,
                                // screenY will both be zero.
                                if (ev.pageX === undefined || ev.pageX < 0 ||
                                    ev.pageY === undefined || ev.pageY < 0 ||
                                    ((ev.screenX === ev.screenY) && (ev.screenX === 0))) {
                                    return;
                                }
                                // We don't want to blur for clicks that are on elements part of our GUI.
                                if (_this.widget.contains(ev.target)) {
                                    return;
                                }
                                var el = _this.doc.elementFromPoint(ev.clientX, ev.clientY);
                                if ($(el).closest(_this.$excludedFromBlur).length !== 0) {
                                    return;
                                }
                                var offset = _this.$guiRoot.offset();
                                var x = ev.pageX - offset.left;
                                var y = ev.pageY - offset.top;
                                if (!((x >= 0) && (y >= 0) &&
                                    (x < _this.$guiRoot.outerWidth()) &&
                                    (y < _this.$guiRoot.outerHeight()))) {
                                    _this.caretManager.onBlur();
                                }
                                // We don't need to do anything special to focus the editor.
                            });
                            // Make ourselves visible.
                            this.$widget.removeClass("loading");
                            this.$widget.css("display", "block");
                            namespaceError = this.initializeNamespaces();
                            if (namespaceError !== undefined) {
                                limitationModal = this.modals.getModal("limitation");
                                limitationModal.setBody(namespaceError);
                                limitationModal.modal();
                                this.destroy();
                                return [2 /*return*/, this];
                            }
                            this.domlistener.processImmediately();
                            // Flush whatever has happened earlier.
                            this._undo.reset();
                            $guiRoot.focus();
                            this.validator.start();
                            demo = this.options.demo;
                            if (demo !== undefined) {
                                // Provide a generic message.
                                if (typeof demo !== "string") {
                                    demo = "Some functions may not be available.";
                                }
                                demoModal = this.makeModal();
                                demoModal.setTitle("Demo");
                                demoModal.setBody("<p>This is a demo of wed. " + demo + "</p> <p>Click <a href='" + this.docURL + "' target='_blank'>this link</a> to see wed's generic help. The link by default will open in a new tab.</p>");
                                demoModal.addButton("Ok", true);
                                demoModal.modal();
                            }
                            save = this.options.save;
                            if (save !== undefined) {
                                // The editor is not initialized until the saver is also initialized,
                                // which may take a bit.
                                savePromise = this.runtime.resolveModules(save.path)
                                    .then(function (modules) {
                                    // tslint:disable-next-line:no-any variable-name
                                    var SaverClass = modules[0].Saver;
                                    var saveOptions = save.options !== undefined ? save.options : {};
                                    var saver = new SaverClass(_this.runtime, exports.version, _this.dataUpdater, _this.dataRoot, saveOptions);
                                    _this.saver = saver;
                                    saver.events
                                        .pipe(filter_1.filter(filterSaveEvents.bind(undefined, "Saved")))
                                        .subscribe(_this.onSaverSaved.bind(_this));
                                    saver.events
                                        .pipe(filter_1.filter(filterSaveEvents.bind(undefined, "Autosaved")))
                                        .subscribe(_this.onSaverAutosaved.bind(_this));
                                    saver.events
                                        .pipe(filter_1.filter(filterSaveEvents.bind(undefined, "Failed")))
                                        .subscribe(_this.onSaverFailed.bind(_this));
                                    saver.events
                                        .pipe(filter_1.filter(filterSaveEvents.bind(undefined, "Changed")))
                                        .subscribe(_this.onSaverChanged.bind(_this));
                                    _this.refreshSaveStatus();
                                    _this.saveStatusInterval =
                                        setInterval(_this.refreshSaveStatus.bind(_this), 30 * 1000);
                                    onbeforeunload.install(_this.window, function () { return !_this.destroyed && _this.saver.getModifiedWhen() !== false; }, true);
                                    return saver.init();
                                });
                            }
                            else {
                                savePromise = Promise.resolve()
                                    .then(function () {
                                    log.error("wed cannot save data due to the absence of a save option");
                                });
                            }
                            return [4 /*yield*/, savePromise];
                        case 1:
                            _a.sent();
                            this.initializedResolve(this);
                            return [2 /*return*/, this];
                    }
                });
            });
        };
        /**
         * Handler for setting ``contenteditable`` on nodes included into the
         * tree. This handler preforms an initial generic setup that does not need
         * mode-specific information. It sets ``contenteditable`` to true on any real
         * element or any attribute value.
         */
        Editor.prototype.initialContentEditableHandler = function (ev) {
            var mod = function (el) {
                // All elements that may get a selection must be focusable to
                // work around issue:
                // https://bugzilla.mozilla.org/show_bug.cgi?id=921444
                el.setAttribute("tabindex", "-1");
                el.setAttribute("contenteditable", String(el.classList.contains("_real") ||
                    el.classList.contains("_attribute_value")));
                var child = el.firstElementChild;
                while (child !== null) {
                    mod(child);
                    child = child.nextElementSibling;
                }
            };
            // We never call this function with something else than an Element for
            // ev.node.
            mod(ev.node);
        };
        /**
         * Handler for setting ``contenteditable`` on nodes included into the
         * tree. This handler adjusts whether attribute values are editable by using
         * mode-specific data.
         */
        Editor.prototype.finalContentEditableHandler = function (ev) {
            // We never call this function with something else than an Element for
            // ev.node.
            var el = ev.node;
            var attrs = el.getElementsByClassName("_attribute_value");
            for (var _i = 0, _a = Array.from(attrs); _i < _a.length; _i++) {
                var attr = _a[_i];
                if (this.modeTree.getAttributeHandling(attr) !== "edit") {
                    attr.setAttribute("contenteditable", "false");
                }
            }
        };
        Editor.prototype.initializeNamespaces = function () {
            var mode = this.modeTree.getMode(this.guiRoot);
            var resolver = mode.getAbsoluteResolver();
            var failure;
            if (this.dataRoot.firstChild === null) {
                // The document is empty: create a child node with the absolute namespace
                // mappings.
                var attrs_1 = Object.create(null);
                this.validator.getSchemaNamespaces().forEach(function (ns) {
                    if (ns === "*" || ns === "::except") {
                        return;
                    }
                    var k = resolver.prefixFromURI(ns);
                    // Don't create a mapping for the `xml`, seeing as it is defined by
                    // default.
                    if (k === "xml") {
                        return;
                    }
                    if (k === "") {
                        attrs_1.xmlns = ns;
                    }
                    else {
                        if (k === undefined) {
                            failure = "The mode does not allow determining the namespace prefix for " + ns + ". The most likely issue is that the mode is buggy or wed was started with incorrect options.";
                        }
                        attrs_1["xmlns:" + k] = ns;
                    }
                });
                if (failure !== undefined) {
                    return failure;
                }
                var evs = this.validator.possibleAt(this.dataRoot, 0).toArray();
                if (evs.length === 1 && evs[0].params[0] === "enterStartTag") {
                    var name_1 = evs[0].params[1];
                    // If the name pattern is not simple or it allows for a number of
                    // choices, then we skip this creation.
                    var asArray = name_1.toArray();
                    if (asArray !== null && asArray.length === 1) {
                        var simple = asArray[0];
                        transformation_1.insertElement(this.dataUpdater, this.dataRoot, 0, simple.ns, resolver.unresolveName(simple.ns, simple.name), attrs_1);
                        this.caretManager.setCaret(this.dataRoot.firstElementChild, 0);
                    }
                }
                // Ok, we did not insert anything, let's put a placeholder there.
                if (this.dataRoot.firstChild === null) {
                    var ph = this.insertTransientPlaceholderAt(this.caretManager.makeCaret(this.guiRoot, 0));
                    this.caretManager.setCaret(ph, 0);
                }
            }
            else {
                var namespaces_1 = this.validator.getDocumentNamespaces();
                // Yeah, we won't stop as early as possible if there's a failure.  So
                // what?
                Object.keys(namespaces_1).forEach(function (prefix) {
                    var uri = namespaces_1[prefix];
                    if (uri.length > 1) {
                        failure = "The document you are trying to edit uses namespaces \
in a way not supported by this version of wed.";
                    }
                    resolver.definePrefix(prefix, uri[0]);
                });
            }
            return failure;
        };
        Editor.prototype.addToolbarAction = function (actionClass, options) {
            this.toolbar.addButton(new actionClass(this).makeButton(), options);
        };
        /**
         * Creates a new task runner and registers it with the editor so that it is
         * started and stopped by the methods that stop/start all tasks.
         *
         * @param task The task that the runner must run.
         *
         * @returns The new runner.
         */
        Editor.prototype.newTaskRunner = function (task) {
            var runner = new task_runner_1.TaskRunner(task);
            this.taskRunners.push(runner);
            return runner;
        };
        /**
         * Triggers the resizing algorithm.
         */
        Editor.prototype.resize = function () {
            this.resizeHandler();
        };
        Editor.prototype.resizeHandler = function () {
            var heightAfter = 0;
            function addHeight(x) {
                heightAfter += x.getBoundingClientRect().height;
            }
            var constrainerSibling = this.constrainer.nextElementSibling;
            while (constrainerSibling !== null) {
                addHeight(constrainerSibling);
                constrainerSibling = constrainerSibling.nextElementSibling;
            }
            var examine = this.widget;
            // We want to use isElement here because eventually we'll run into the
            // document element that holds everything. We still declare examine as an
            // Element or null because we never use it as a document.
            while (domtypeguards_1.isElement(examine)) {
                var sibling = examine.nextElementSibling;
                while (sibling !== null) {
                    if (sibling.tagName !== "script") {
                        addHeight(sibling);
                    }
                    sibling = sibling.nextElementSibling;
                }
                examine = examine.parentNode;
            }
            // The height is the inner height of the window:
            // a. minus what appears before it.
            // b. minus what appears after it.
            var height = this.window.innerHeight -
                // This is the space before
                (this.scroller.getBoundingClientRect().top + this.window.pageYOffset) -
                // This is the space after
                heightAfter;
            height = Math.floor(height);
            this.scroller.coerceHeight(height);
            var sidebar = this.sidebar;
            var pheight = this.window.innerHeight -
                (sidebar.getBoundingClientRect().top + this.window.pageYOffset) -
                heightAfter;
            sidebar.style.maxHeight = pheight + "px";
            sidebar.style.minHeight = pheight + "px";
            var sp = sidebar.getElementsByClassName("wed-sidebar-panel")[0];
            pheight = this.window.innerHeight -
                (sp.getBoundingClientRect().top + this.window.pageYOffset) -
                heightAfter;
            sp.style.maxHeight = pheight + "px";
            sp.style.minHeight = pheight + "px";
            var panels = sp.getElementsByClassName("panel");
            var headings = sp.getElementsByClassName("panel-heading");
            var hheight = 0;
            for (var i = 0; i < headings.length; ++i) {
                var heading = headings[i];
                var $parent = $(heading.parentNode);
                hheight += $parent.outerHeight(true) - $parent.innerHeight();
                hheight += $(heading).outerHeight(true);
            }
            var maxPanelHeight = pheight - hheight;
            var panel;
            for (var i = 0; i < panels.length; ++i) {
                panel = panels[i];
                panel.style.maxHeight = maxPanelHeight +
                    $(domutil.childByClass(panel, "panel-heading")).outerHeight(true) + "px";
                var body = panel.getElementsByClassName("panel-body")[0];
                body.style.height = maxPanelHeight + "px";
            }
            if (this.validationController !== undefined) {
                // We must refresh these because resizing the editor pane may cause text
                // to move up or down due to line wrap.
                this.validationController.refreshErrors();
            }
            this.caretManager.mark.refresh();
        };
        /**
         * Opens a documentation link.
         *
         * @param url The URL to open.
         */
        Editor.prototype.openDocumentationLink = function (url) {
            window.open(url);
        };
        /**
         * Returns the list of element transformations for the location pointed to by
         * the caret.
         *
         * @param treeCaret The location in the document. This must be a data
         * location, not a GUI location.
         *
         * @param types The types of transformations to get.
         *
         * @return An array of objects having the fields ``tr`` which contain the
         * actual transformation and ``name`` which is the unresolved element name for
         * this transformation. It is exceptionally possible to have an item of the
         * list contain ``undefined`` for ``name``.
         */
        Editor.prototype.getElementTransformationsAt = function (treeCaret, types) {
            var _this = this;
            var mode = this.modeTree.getMode(treeCaret.node);
            var resolver = mode.getAbsoluteResolver();
            var ret = [];
            this.validator.possibleAt(treeCaret).forEach(function (ev) {
                if (ev.params[0] !== "enterStartTag") {
                    return;
                }
                var pattern = ev.params[1];
                var asArray = pattern.toArray();
                if (asArray !== null) {
                    for (var _i = 0, asArray_1 = asArray; _i < asArray_1.length; _i++) {
                        var name_2 = asArray_1[_i];
                        var unresolved = resolver.unresolveName(name_2.ns, name_2.name);
                        var trs = mode.getContextualActions(types, unresolved, treeCaret.node, treeCaret.offset);
                        if (trs === undefined) {
                            return;
                        }
                        for (var _a = 0, trs_1 = trs; _a < trs_1.length; _a++) {
                            var tr = trs_1[_a];
                            ret.push({ tr: tr, name: unresolved });
                        }
                    }
                }
                else {
                    // We push an action rather than a transformation.
                    ret.push({ tr: _this.complexPatternAction, name: undefined });
                }
            });
            return ret;
        };
        Editor.prototype.cutHandler = function (e) {
            if (this.caretManager.getDataCaret() === undefined) {
                // XXX alert the user?
                return false;
            }
            var sel = this.caretManager.sel;
            if (sel.wellFormed) {
                var el = domutil_1.closestByClass(sel.anchor.node, "_real", this.guiRoot);
                // We do not operate on elements that are readonly.
                if (el === null || el.classList.contains("_readonly")) {
                    return false;
                }
                // The only thing we need to pass is the event that triggered the
                // cut.
                this.fireTransformation(this.cutTr, { e: e });
                return true;
            }
            this.modals.getModal("straddling").modal();
            return false;
        };
        Editor.prototype.pasteHandler = function (e) {
            var _this = this;
            var caret = this.caretManager.getDataCaret();
            if (caret === undefined) {
                // XXX alert the user?
                return false;
            }
            var el = domutil_1.closestByClass(this.caretManager.anchor.node, "_real", this.guiRoot);
            // We do not operate on elements that are readonly.
            if (el === null || el.classList.contains("_readonly")) {
                return false;
            }
            // IE puts the clipboardData as a object on the window.
            // tslint:disable
            var cd = e.originalEvent.clipboardData ||
                this.window.clipboardData;
            // tslint:enable
            var text = cd.getData("text");
            if (text == null || text === "") {
                return false;
            }
            // This could result in an empty string.
            text = this.normalizeEnteredText(text);
            if (text === "") {
                return false;
            }
            var parser = new this.window.DOMParser();
            var doc = parser.parseFromString("<div>" + text + "</div>", "text/xml");
            var asXML = true;
            if (domtypeguards_1.isElement(doc.firstChild) &&
                doc.firstChild.tagName === "parsererror" &&
                doc.firstChild.namespaceURI ===
                    // tslint:disable-next-line:no-http-string
                    "http://www.mozilla.org/newlayout/xml/parsererror.xml") {
                asXML = false;
            }
            var data;
            if (asXML) {
                data = doc.firstChild;
                // Otherwise, check whether it is valid.
                var errors = this.validator.speculativelyValidate(caret, Array.prototype.slice.call(data.childNodes));
                if (errors) {
                    // We need to save this before we bring up the modal because clicking to
                    // dismiss the modal will mangle ``cd``.
                    var modal_2 = this.modals.getModal("paste");
                    modal_2.modal(function () {
                        if (modal_2.getClickedAsText() === "Yes") {
                            data = _this.doc.createElement("div");
                            data.textContent = text;
                            // At this point data is a single top level fake <div> element which
                            // contains the contents we actually want to paste.
                            _this.fireTransformation(_this.pasteTr, { node: caret.node, to_paste: data, e: e });
                        }
                    });
                    return false;
                }
            }
            else {
                data = this.doc.createElement("div");
                data.textContent = text;
            }
            // At this point data is a single top level fake <div> element
            // which contains the contents we actually want to paste.
            this.fireTransformation(this.pasteTr, { node: caret.node, to_paste: data, e: e });
            return false;
        };
        Editor.prototype.keydownHandler = function (e) {
            var caret = this.caretManager.getNormalizedCaret();
            // Don't call it on undefined caret.
            if (caret !== undefined) {
                this.$guiRoot.trigger("wed-input-trigger-keydown", [e]);
            }
            if (e.isImmediatePropagationStopped() || e.isPropagationStopped()) {
                return;
            }
            this.$guiRoot.trigger("wed-global-keydown", [e]);
        };
        Editor.prototype.pushGlobalKeydownHandler = function (handler) {
            this.globalKeydownHandlers.push(handler);
        };
        Editor.prototype.popGlobalKeydownHandler = function (handler) {
            var popped = this.globalKeydownHandlers.pop();
            if (popped !== handler) {
                throw new Error("did not pop the expected handler");
            }
        };
        // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
        Editor.prototype.globalKeydownHandler = function (wedEvent, e) {
            var caret; // damn hoisting
            // These are things like the user hitting Ctrl, Alt, Shift, or
            // CapsLock, etc. Return immediately.
            if (e.which === 17 || e.which === 16 || e.which === 18 || e.which === 0) {
                return true;
            }
            // We don't process any input if the minibuffer is enabled.
            if (this.minibuffer.enabled) {
                return true;
            }
            function terminate() {
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
            for (var _i = 0, _a = this.globalKeydownHandlers; _i < _a.length; _i++) {
                var handler = _a[_i];
                var ret = handler(wedEvent, e);
                if (ret === false) {
                    return terminate();
                }
            }
            // F1
            if (e.which === 112) {
                this.modals.getModal("help").modal();
                return terminate();
            }
            // Diagnosis stuff
            if (this.developmentMode) {
                // F2
                if (e.which === 113) {
                    this.caretManager.dumpCaretInfo();
                    return terminate();
                }
                // F3
                if (e.which === 114) {
                    this.dumpUndo();
                    return terminate();
                }
                // F4
                if (e.which === 115) {
                    // tslint:disable:no-console
                    console.log("manual focus");
                    console.log("document.activeElement before", document.activeElement);
                    console.log("document.querySelector(\":focus\") before", document.querySelector(":focus"));
                    this.caretManager.focusInputField();
                    console.log("document.activeElement after", document.activeElement);
                    console.log("document.querySelector(\":focus\") after", document.querySelector(":focus"));
                    // tslint:enable:no-console
                    return terminate();
                }
            }
            var selFocus = this.caretManager.caret;
            // Cursor movement keys: handle them.
            if (e.which >= 33 /* page up */ && e.which <= 40 /* down arrow */) {
                var direction = void 0;
                if (keyConstants.RIGHT_ARROW.matchesEvent(e)) {
                    direction = "right";
                }
                else if (keyConstants.LEFT_ARROW.matchesEvent(e)) {
                    direction = "left";
                }
                else if (keyConstants.DOWN_ARROW.matchesEvent(e)) {
                    direction = "down";
                }
                else if (keyConstants.UP_ARROW.matchesEvent(e)) {
                    direction = "up";
                }
                if (direction !== undefined) {
                    this.caretManager.move(direction, e.shiftKey);
                    return terminate();
                }
                return true;
            }
            else if (keyConstants.ESCAPE.matchesEvent(e)) {
                if (this.closeAllTooltips()) {
                    return terminate();
                }
                return true;
            }
            else if (keyConstants.SAVE.matchesEvent(e)) {
                // tslint:disable-next-line:no-floating-promises
                this.save();
                return terminate();
            }
            else if (keyConstants.UNDO.matchesEvent(e)) {
                this.undo();
                return terminate();
            }
            else if (keyConstants.REDO.matchesEvent(e)) {
                this.redo();
                return terminate();
            }
            else if (keyConstants.COPY.matchesEvent(e) ||
                keyConstants.CUT.matchesEvent(e) ||
                keyConstants.PASTE.matchesEvent(e)) {
                return true;
            }
            else if (keyConstants.DEVELOPMENT.matchesEvent(e)) {
                this.developmentMode = !this.developmentMode;
                notify_1.notify(this.developmentMode ? "Development mode on." :
                    "Development mode off.");
                if (this.developmentMode) {
                    log.showPopup();
                }
                return terminate();
            }
            else if (keyConstants.LOWER_LABEL_VISIBILITY.matchesEvent(e)) {
                return this.decreaseLabelVisibilityLevelAction.terminalEventHandler(e);
            }
            else if (keyConstants.INCREASE_LABEL_VISIBILITY.matchesEvent(e)) {
                return this.increaseLabelVisibilityLevelAction.terminalEventHandler(e);
            }
            else if (keyConstants.CONTEXTUAL_MENU.matchesEvent(e)) {
                if (selFocus !== undefined) {
                    var selFocusNode = selFocus.node;
                    var gui = domutil_1.closestByClass(selFocusNode, "_gui", selFocus.root);
                    if (gui !== null && gui.classList.contains("_label_clicked")) {
                        if (domtypeguards_1.isText(selFocusNode)) {
                            selFocusNode = selFocusNode.parentNode;
                        }
                        $(selFocusNode).trigger("wed-context-menu", [e]);
                        return terminate();
                    }
                }
                if (this.editingMenuManager.contextMenuHandler(e) === false) {
                    return terminate();
                }
            }
            else if (keyConstants.REPLACEMENT_MENU.matchesEvent(e)) {
                this.editingMenuManager.setupReplacementMenu();
                return terminate();
            }
            else if (keyConstants.QUICKSEARCH_FORWARD.matchesEvent(e)) {
                if (this.caretManager.caret !== undefined) {
                    // tslint:disable-next-line:no-unused-expression
                    new quick_search_1.QuickSearch(this, this.scroller, quick_search_1.Direction.FORWARD);
                }
                return terminate();
            }
            else if (keyConstants.QUICKSEARCH_BACKWARDS.matchesEvent(e)) {
                if (this.caretManager.caret !== undefined) {
                    // tslint:disable-next-line:no-unused-expression
                    new quick_search_1.QuickSearch(this, this.scroller, quick_search_1.Direction.BACKWARDS);
                }
                return terminate();
            }
            else if (keyConstants.SEARCH_FORWARD.matchesEvent(e)) {
                if (this.caretManager.caret !== undefined) {
                    // tslint:disable-next-line:no-unused-expression
                    new dialog_search_replace_1.DialogSearchReplace(this, this.scroller, quick_search_1.Direction.FORWARD);
                }
                return terminate();
            }
            else if (keyConstants.SEARCH_BACKWARDS.matchesEvent(e)) {
                if (this.caretManager.caret !== undefined) {
                    // tslint:disable-next-line:no-unused-expression
                    new dialog_search_replace_1.DialogSearchReplace(this, this.scroller, quick_search_1.Direction.BACKWARDS);
                }
                return terminate();
            }
            if (selFocus === undefined) {
                return true;
            }
            var placeholder = domutil_1.closestByClass(selFocus.node, "_placeholder", selFocus.root);
            if (placeholder !== null) {
                // We're in a placeholder, so...
                // Reminder: if the caret is currently inside a placeholder getCaret will
                // return a caret value just in front of the placeholder.
                caret = this.caretManager.getDataCaret();
                // A place holder could be in a place that does not allow text. If so,
                // then do not allow entering regular text in this location.
                if (!util.anySpecialKeyHeld(e)) {
                    var textPossible_1 = false;
                    if (placeholder.parentNode
                        .classList.contains("_attribute_value")) {
                        textPossible_1 = true;
                    }
                    else {
                        // Maybe throwing an exception could stop this loop early but that
                        // would have to be tested.
                        this.validator.possibleAt(caret).forEach(function (ev) {
                            if (ev.params[0] === "text") {
                                textPossible_1 = true;
                            }
                        });
                    }
                    if (!textPossible_1) {
                        return terminate();
                    }
                }
                // Swallow these events when they happen in a placeholder.
                if (keyConstants.BACKSPACE.matchesEvent(e) ||
                    keyConstants.DELETE.matchesEvent(e)) {
                    return terminate();
                }
            }
            var attrVal = domutil_1.closestByClass(selFocus.node, "_attribute_value", selFocus.root);
            var label = this.guiRoot.querySelector(".__start_label._label_clicked, .__end_label._label_clicked");
            if (attrVal === null && label !== null &&
                keyConstants.DELETE.matchesEvent(e)) {
                // The caret is currently in an element label, and not in an attribute
                // value. Delete the element!
                var el = domutil_1.closestByClass(label, "_real", this.guiRoot);
                var dataNode = this.dataUpdater.pathToNode(this.nodeToPath(el));
                var mode = this.modeTree.getMode(el);
                // Yes, delete-parent is correct because we take position 0 *inside*
                // dataNode.
                var trs = mode.getContextualActions("delete-parent", dataNode.tagName, dataNode, 0);
                trs[0].execute({ node: dataNode, name: dataNode.tagName });
                return terminate();
            }
            else if (domtypeguards_1.isElement(selFocus.node) &&
                (selFocus.node.classList.contains("_phantom") ||
                    selFocus.node.classList.contains("_phantom_wrap"))) {
                return terminate();
            }
            var textUndo;
            var parent;
            var offset;
            if (keyConstants.SPACE.matchesEvent(e)) {
                caret = this.caretManager.getNormalizedCaret();
                if (caret === undefined) {
                    return terminate();
                }
                if (attrVal !== null ||
                    domutil_1.closestByClass(caret.node, "_phantom", caret.root) === null) {
                    this.handleKeyInsertingText(e);
                }
                return terminate();
            }
            else if (keyConstants.DELETE.matchesEvent(e)) {
                if (attrVal !== null) {
                    if (attrVal.textContent === "") {
                        return terminate();
                    }
                    this.spliceAttribute(attrVal, this.caretManager.getNormalizedCaret().offset, 1, "");
                }
                else {
                    // Prevent deleting phantom stuff
                    var next = domutil.nextCaretPosition(selFocus.toArray(), this.guiRoot, true)[0];
                    if (!domtypeguards_1.isElement(next) ||
                        !(next.classList.contains("_phantom") ||
                            next.classList.contains("_phantom_wrap"))) {
                        // When a range is selected, we delete the whole range.
                        if (this.cutSelection()) {
                            this.validationController.refreshErrors();
                            return terminate();
                        }
                        // We need to handle the delete
                        caret = this.caretManager.getDataCaret();
                        // If the container is not a text node, we may still be just AT a text
                        // node from which we can delete. Handle this.
                        if (!domtypeguards_1.isText(caret.node)) {
                            caret = caret.make(caret.node.childNodes[caret.offset], 0);
                        }
                        if (domtypeguards_1.isText(caret.node)) {
                            parent = caret.node.parentNode;
                            offset = domutil_1.indexOf(parent.childNodes, caret.node);
                            textUndo = this.initiateTextUndo();
                            this.dataUpdater.deleteText(caret, 1);
                            // Don't set the caret inside a node that has been deleted.
                            if (caret.node.parentNode !== null) {
                                this.caretManager.setCaret(caret, { textEdit: true });
                            }
                            else {
                                this.caretManager.setCaret(parent, offset, { textEdit: true });
                            }
                            textUndo.recordCaretAfter();
                        }
                    }
                }
                this.validationController.refreshErrors();
                return terminate();
            }
            else if (keyConstants.BACKSPACE.matchesEvent(e)) {
                if (attrVal !== null) {
                    if (attrVal.textContent === "") {
                        return terminate();
                    }
                    this.spliceAttribute(attrVal, this.caretManager.getNormalizedCaret().offset - 1, 1, "");
                }
                else {
                    // Prevent backspacing over phantom stuff
                    var prev = domutil.prevCaretPosition(selFocus.toArray(), this.guiRoot, true)[0];
                    if (!domtypeguards_1.isElement(prev) ||
                        !(prev.classList.contains("_phantom") ||
                            prev.classList.contains("_phantom_wrap"))) {
                        // When a range is selected, we delete the whole range.
                        if (this.cutSelection()) {
                            this.validationController.refreshErrors();
                            return terminate();
                        }
                        // We need to handle the backspace
                        caret = this.caretManager.getDataCaret();
                        // If the container is not a text node, we may still be just behind a
                        // text node from which we can delete. Handle this.
                        if (!domtypeguards_1.isText(caret.node)) {
                            var last = caret.node.childNodes[caret.offset - 1];
                            // tslint:disable-next-line:no-any
                            var length_1 = last.length;
                            caret = caret.make(last, length_1);
                        }
                        if (domtypeguards_1.isText(caret.node)) {
                            parent = caret.node.parentNode;
                            offset = domutil_1.indexOf(parent.childNodes, caret.node);
                            // At start of text, nothing to delete.
                            if (caret.offset === 0) {
                                return terminate();
                            }
                            textUndo = this.initiateTextUndo();
                            this.dataUpdater.deleteText(caret.node, caret.offset - 1, 1);
                            // Don't set the caret inside a node that has been deleted.
                            if (caret.node.parentNode !== null) {
                                this.caretManager.setCaret(caret.node, caret.offset - 1, { textEdit: true });
                            }
                            else {
                                this.caretManager.setCaret(parent, offset, { textEdit: true });
                            }
                            textUndo.recordCaretAfter();
                        }
                    }
                }
                this.validationController.refreshErrors();
                return terminate();
            }
            return true;
        };
        Editor.prototype.keypressHandler = function (e) {
            // IE is the odd browser that allows ESCAPE to show up as a keypress so
            // we have to prevent it from going any further.
            if (ESCAPE_KEYPRESS.matchesEvent(e)) {
                return true;
            }
            this.$guiRoot.trigger("wed-input-trigger-keypress", [e]);
            if (e.isImmediatePropagationStopped() || e.isPropagationStopped()) {
                return true;
            }
            this.$guiRoot.trigger("wed-global-keypress", [e]);
            return undefined;
        };
        /**
         * Simulates typing text in the editor.
         *
         * **NOTE**: this function is limited in what it can simulate. The main
         * editing pane is where you get the most support. Other locations offer less
         * support. One good example is the minibuffer. Typing a string into it works
         * fine. Trying to use directional arrows and backspace/delete currently does
         * not work. We'd have to write custom code to handle these cases because it
         * is not possible, as we speak, to write JavaScript code that **entirely**
         * simulates pressing keyboard keys. (JavaScript easily supports sending the
         * events *generated* by hitting the keyboard, but this is not enough.)
         *
         * @param text The text to type in. An array of keys, a string or a single
         * key.
         */
        // tslint:disable-next-line:no-reserved-keywords
        Editor.prototype.type = function (text, where) {
            if (where === void 0) { where = WedEventTarget.DEFAULT; }
            if (text instanceof key_1.Key) {
                text = [text];
            }
            for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
                var k = text_1[_i];
                if (typeof k === "string") {
                    k = (k === " ") ? keyConstants.SPACE : key_1.makeKey(k);
                }
                var event_1 = new $.Event("keydown");
                k.setEventToMatch(event_1);
                switch (where) {
                    case WedEventTarget.MINIBUFFER:
                        this.minibuffer.forwardEvent(event_1);
                        break;
                    case WedEventTarget.DEFAULT:
                        this.$inputField.trigger(event_1);
                        break;
                    default:
                        var t = where;
                        throw new Error("unhandled target: " + t);
                }
            }
        };
        Editor.prototype.globalKeypressHandler = function (wedEvent, e) {
            if (this.caretManager.caret === undefined) {
                return true;
            }
            function terminate() {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // On Firefox keypress events are generated for things like hitting the left
            // or right arrow. The which value is 0 in these cases. On Chrome, hitting
            // the left or right arrow will generate keyup, keydown events but not
            // keypress. Yay for inconsistencies!
            if (e.which === 0) {
                return true;
            }
            // Backspace, which for some reason gets here on Firefox...
            if (e.which === 8) {
                return terminate();
            }
            // On Firefox the modifier keys will generate a keypress event, etc. Not so
            // on Chrome. Yay for inconsistencies!
            if (e.ctrlKey || e.altKey || e.metaKey) {
                return true;
            }
            this.cutSelection();
            this.handleKeyInsertingText(e);
            return terminate();
        };
        Editor.prototype.cutSelection = function () {
            var sel = this.caretManager.sel;
            if (sel !== undefined && !sel.collapsed) {
                if (!sel.wellFormed) {
                    return true;
                }
                var textUndo = this.initiateTextUndo();
                var _a = sel.mustAsDataCarets(), start = _a[0], end = _a[1];
                var cutRet = this.dataUpdater.cut(start, end)[0];
                this.caretManager.setCaret(cutRet, { textEdit: true });
                textUndo.recordCaretAfter();
                return true;
            }
            return false;
        };
        Editor.prototype.handleKeyInsertingText = function (e) {
            var text = String.fromCharCode(e.which);
            if (text === "") {
                // Nothing needed
                return false;
            }
            this.insertText(text);
            e.preventDefault();
            e.stopPropagation();
            return undefined;
        };
        Editor.prototype.compositionHandler = function (ev) {
            if (ev.type === "compositionstart") {
                this.composing = true;
                this.compositionData = {
                    // tslint:disable-next-line:no-any
                    data: ev.originalEvent.data,
                    startCaret: this.caretManager.caret,
                };
                this.inputField.style.zIndex = "10";
                this.caretManager.mark.refresh();
            }
            else if (ev.type === "compositionupdate") {
                // tslint:disable-next-line:no-any
                this.compositionData.data = ev.originalEvent.data;
            }
            else if (ev.type === "compositionend") {
                this.composing = false;
                this.inputField.style.zIndex = "";
                this.inputField.style.top = "";
                this.inputField.style.left = "";
            }
            else {
                throw new Error("unexpected event type: " + ev.type);
            }
        };
        Editor.prototype.inputHandler = function () {
            if (this.composing) {
                return;
            }
            if (this.$inputField.val() === "") {
                return;
            }
            this.insertText(this.$inputField.val());
            this.$inputField.val("");
            this.caretManager.focusInputField();
        };
        Editor.prototype.mousemoveHandler = function (e) {
            var _this = this;
            var elementAtMouse = this.doc.elementFromPoint(e.clientX, e.clientY);
            if (!this.guiRoot.contains(elementAtMouse)) {
                // Not in GUI tree.
                return;
            }
            var editable = function (el) {
                var cl = el.classList;
                return cl.contains("_real") ||
                    (cl.contains("_attribute_value") &&
                        _this.modeTree.getAttributeHandling(el) === "edit");
            };
            var boundary;
            if (editable(elementAtMouse)) {
                boundary = this.pointToCharBoundary(e.clientX, e.clientY);
                if (boundary === undefined) {
                    return;
                }
            }
            else {
                var child = elementAtMouse;
                while (!editable(elementAtMouse)) {
                    child = elementAtMouse;
                    elementAtMouse = child.parentNode;
                    if (!this.guiRoot.contains(elementAtMouse)) {
                        // The mouse was in a bunch of non-editable elements.
                        return;
                    }
                }
                var offset = domutil_1.indexOf(elementAtMouse.childNodes, child);
                var range = this.doc.createRange();
                range.setStart(elementAtMouse, offset);
                range.setEnd(elementAtMouse, offset + 1);
                var rect = range.getBoundingClientRect();
                if (Math.abs(rect.left - e.clientX) >= Math.abs(rect.right - e.clientX)) {
                    offset++;
                }
                boundary = this.caretManager.makeCaret(elementAtMouse, offset);
            }
            this.caretManager.setRange(this.caretManager.anchor, boundary);
        };
        Editor.prototype.mousedownHandler = function (ev) {
            // Make sure the mouse is not on a scroll bar.
            if (!this.scroller.isPointInside(ev.pageX, ev.pageY)) {
                return false;
            }
            var boundary = this.pointToCharBoundary(ev.clientX, ev.clientY);
            if (boundary === undefined) {
                return true;
            }
            this.$guiRoot.one("mouseup", this.mouseupHandler.bind(this));
            this.errorLayer.unselectAll();
            this.$errorList.find(".selected").removeClass("selected");
            var root = this.guiRoot;
            var target = ev.target;
            var placeholder = domutil_1.closestByClass(target, "_placeholder", root);
            var label = domutil_1.closestByClass(target, "_label", root);
            var caretManager = this.caretManager;
            switch (ev.which) {
                case 1:
                    // Don't track selections in gui elements, except if they are inside an
                    // attribute value.
                    if (domutil_1.closest(target, "._gui, ._phantom", root) === null ||
                        domutil_1.closestByClass(target, "_attribute_value", root) !== null) {
                        this.$guiRoot.on("mousemove.wed", this.mousemoveHandler.bind(this));
                    }
                    // If the caret is changing due to a click on a placeholder, then put it
                    // inside the placeholder.
                    if (placeholder !== null) {
                        caretManager.setCaret(placeholder, 0);
                    }
                    else if (label !== null) {
                        // If the caret is changing due to a click on a label, then normalize it
                        // to a valid position.
                        caretManager.setCaretToLabelPosition(target, label, boundary);
                    }
                    else {
                        caretManager.setCaret(boundary);
                    }
                    if (ev.target.classList.contains("wed-validation-error")) {
                        return true;
                    }
                    break;
                case 3:
                    var range = this.caretManager.range;
                    if (!(range !== undefined && !range.collapsed)) {
                        // If the caret is changing due to a click on a placeholder, then put it
                        // inside the placeholder.
                        if (placeholder !== null) {
                            caretManager.setCaret(placeholder, 0);
                        }
                        else if (label !== null) {
                            // If the caret is changing due to a click on a label, then normalize
                            // it to a valid position.
                            caretManager.setCaretToLabelPosition(target, label, boundary);
                        }
                        else {
                            caretManager.setCaret(boundary);
                        }
                    }
                    break;
                default:
                    break;
            }
            return false;
        };
        // In previous versions of wed all mouse button processing was done in
        // _mousedownHandler. However, this caused problems when processing context
        // menus events. On IE in particular the mouseup that would occur when a
        // context menu is brought up would happen on the newly brought up menu and
        // would cause focus problems.
        Editor.prototype.mouseupHandler = function (ev) {
            // Make sure the mouse is not on a scroll bar.
            if (!this.scroller.isPointInside(ev.pageX, ev.pageY)) {
                return false;
            }
            var boundary = this.pointToCharBoundary(ev.clientX, ev.clientY);
            if (boundary === undefined) {
                return true;
            }
            // Normalize.
            if (ev.type === "contextmenu") {
                ev.which = 3;
            }
            var root = this.guiRoot;
            var target = ev.target;
            var placeholder = domutil_1.closestByClass(target, "_placeholder", root);
            var label = domutil_1.closestByClass(target, "_label", root);
            var caretManager = this.caretManager;
            switch (ev.which) {
                case 3:
                    // If the caret is changing due to a click on a placeholder, then put it
                    // inside the placeholder.
                    if (placeholder !== null) {
                        caretManager.setCaret(target, 0);
                    }
                    if (label !== null) {
                        caretManager.setCaretToLabelPosition(target, label, boundary);
                        $(target).trigger("wed-context-menu", [ev]);
                    }
                    else {
                        // If the editor is just gaining focus with *this* click, then
                        // this.caretManager.caret will not be set. It also means the range is
                        // collapsed.
                        if (caretManager.caret === undefined) {
                            caretManager.setCaret(boundary);
                        }
                        if (domutil_1.closest(target, "*[data-wed--custom-context-menu]", root) !== null) {
                            $(target).trigger("wed-context-menu", [ev]);
                        }
                        else {
                            this.editingMenuManager.contextMenuHandler(ev);
                        }
                    }
                    break;
                default:
                    break;
            }
            this.$guiRoot.off("mousemove");
            ev.preventDefault();
            return false;
        };
        Editor.prototype.mouseoverHandler = function (ev) {
            var _this = this;
            var root = this.guiRoot;
            var label = domutil_1.closestByClass(ev.target, "_label", root);
            if (label !== null) {
                // Get tooltips from the current mode
                var real = domutil_1.closestByClass(label, "_real", root);
                var origName_1 = util.getOriginalName(real);
                var options = {
                    title: function () {
                        var mode = _this.modeTree.getMode(label);
                        return mode.shortDescriptionFor(origName_1);
                    },
                    container: "body",
                    delay: { show: 1000 },
                    placement: "auto top",
                    trigger: "hover",
                };
                this.makeGUITreeTooltip($(label), options);
                var tt = $.data(label, "bs.tooltip");
                tt.enter(tt);
            }
        };
        Editor.prototype.mouseoutHandler = function (ev) {
            var root = this.guiRoot;
            var label = domutil_1.closestByClass(ev.target, "_label", root);
            if (label !== null) {
                $(label).tooltip("destroy");
                // See _mouseoutHandler. We return false here for symmetry.
                return false;
            }
            return undefined;
        };
        Editor.prototype.refreshSaveStatus = function () {
            if (this.saver !== undefined) {
                var saveStatus = this.saver.getSavedWhen();
                this.$saveStatus.children("span").first()
                    .text(saveStatus !== undefined ? saveStatus : "");
                if (saveStatus === undefined) {
                    this.$saveStatus.removeClass("label-success label-info")
                        .addClass("label-default");
                }
                else {
                    var kind = this.saver.getLastSaveKind();
                    var toAdd = void 0;
                    var tip = void 0;
                    switch (kind) {
                        case saver_1.SaveKind.AUTO:
                            toAdd = "label-info";
                            tip = "The last save was an autosave.";
                            break;
                        case saver_1.SaveKind.MANUAL:
                            toAdd = "label-success";
                            tip = "The last save was a manual save.";
                            break;
                        default:
                            throw new Error("unexpected kind of save: " + kind);
                    }
                    this.$saveStatus.removeClass("label-default label-info label-success")
                        .addClass(toAdd);
                    this.$saveStatus.tooltip("destroy");
                    this.$saveStatus.tooltip({
                        title: tip,
                        container: "body",
                        placement: "auto top",
                        trigger: "hover",
                    });
                }
                var modified = this.saver.getModifiedWhen();
                if (modified !== false) {
                    this.$modificationStatus.removeClass("label-success");
                    this.$modificationStatus.addClass("label-warning");
                    this.$modificationStatus.children("i").css("visibility", "");
                }
                else {
                    this.$modificationStatus.removeClass("label-warning");
                    this.$modificationStatus.addClass("label-success");
                    this.$modificationStatus.children("i").css("visibility", "hidden");
                }
            }
        };
        Editor.prototype.onValidatorStateChange = function (workingState) {
            var state = workingState.state;
            if (state === salve_dom_1.WorkingState.VALID || state === salve_dom_1.WorkingState.INVALID) {
                if (!this._firstValidationComplete) {
                    this._firstValidationComplete = true;
                    this.firstValidationCompleteResolve(this);
                }
            }
        };
        Editor.prototype.onPossibleDueToWildcardChange = function (node) {
            //
            // This function is designed to execute fairly quickly. **IT IS IMPORTANT
            // NOT TO BURDEN THIS FUNCTION.** It will be called for every element and
            // attribute in the data tree and thus making this function slower will have
            // a significant impact on validation speed and the speed of wed generally.
            //
            var guiNode = wed_util_1.getGUINodeIfExists(this, node);
            // This may happen if we are dealing with an attribute node.
            if (domtypeguards_1.isText(guiNode)) {
                guiNode = domutil_1.closestByClass(guiNode, "_attribute", this.guiRoot);
            }
            if (guiNode != null) {
                var decorator = this.modeTree.getDecorator(node);
                // guiNode is necessarily an Element if we get here.
                // And the property is necessarily set.
                decorator.setReadOnly(guiNode, this.validator.getNodeProperty(node, "PossibleDueToWildcard"));
            }
            // If the GUI node does not exist yet, then the decorator will take care of
            // adding or removing _readonly when decorating the node.
        };
        /**
         * Expand the error panel if there is no navigation.
         */
        Editor.prototype.expandErrorPanelWhenNoNavigation = function () {
            if (this.$navigationPanel[0].style.display === "none") {
                this.$errorList.parents(".panel-collapse").collapse("show");
            }
        };
        Editor.prototype.errorItemHandler = function (ev) {
            var marker = document.querySelector(ev.target.getAttribute("href"));
            this.errorLayer.select(marker);
            var $parent = $(ev.target.parentNode);
            $parent.siblings().removeClass("selected");
            $parent.addClass("selected");
        };
        Editor.prototype.setNavigationList = function (items) {
            this.$navigationList.empty();
            // tslint:disable-next-line:no-any
            this.$navigationList.append(items);
            // Show the navigation panel.
            this.$navigationPanel.css("display", "");
        };
        Editor.prototype.makeModal = function (options) {
            var _this = this;
            var ret = new modal_1.Modal(options);
            var $top = ret.getTopLevel();
            // Ensure that we don't lose the caret when a modal is displayed.
            $top.on("show.bs.modal.modal", function () {
                _this.caretManager.pushSelection();
            });
            $top.on("hidden.bs.modal.modal", function () {
                _this.caretManager.popSelection();
            });
            this.$widget.prepend($top);
            return ret;
        };
        Editor.prototype.makeGUITreeTooltip = function ($for, options) {
            var _this = this;
            var title = options.title;
            if (title !== undefined) {
                options = Object.assign({}, options);
                options.title = function () {
                    // The check is here so that we can turn tooltips on and off
                    // dynamically.
                    if (_this.destroyed || !_this.preferences.get("tooltips")) {
                        return undefined;
                    }
                    return (typeof title === "function") ? title() : title;
                };
            }
            tooltip_1.tooltip($for, options);
        };
        /**
         * Reset the label visibility level to what it was when the editor was first
         * initialized.
         */
        Editor.prototype.resetLabelVisibilityLevel = function () {
            this.setLabelVisibilityLevel(this.initialLabelLevel);
        };
        /**
         * Set the visibility level to a specific value. It is a no-op if it is called
         * with a value that is less than 0 or greater than the maximum level
         * supported, or if the new level is the same as the current level.
         *
         * @param level The new level.
         */
        Editor.prototype.setLabelVisibilityLevel = function (level) {
            if (level < 0 || level > this.maxLabelLevel) {
                return;
            }
            while (this.currentLabelLevel > level) {
                this.decreaseLabelVisiblityLevel();
            }
            while (this.currentLabelLevel < level) {
                this.increaseLabelVisibilityLevel();
            }
        };
        Editor.prototype.increaseLabelVisibilityLevel = function () {
            if (this.currentLabelLevel >= this.maxLabelLevel) {
                return;
            }
            this.currentLabelLevel++;
            var labels = this.guiRoot.getElementsByClassName("_label_level_" + this.currentLabelLevel);
            // tslint:disable-next-line:one-variable-per-declaration
            for (var i = 0, limit = labels.length; i < limit; i++) {
                labels[i].classList.remove("_invisible");
            }
            // We cannot just refresh the errors because some errors may appear or
            // disappear due to the visibility change.
            this.validationController.recreateErrors();
            this.caretManager.mark.refresh();
        };
        Editor.prototype.decreaseLabelVisiblityLevel = function () {
            if (this.currentLabelLevel === 0) {
                return;
            }
            var prev = this.currentLabelLevel;
            this.currentLabelLevel--;
            var labels = this.guiRoot.getElementsByClassName("_label_level_" + prev);
            // tslint:disable-next-line:one-variable-per-declaration
            for (var i = 0, limit = labels.length; i < limit; i++) {
                labels[i].classList.add("_invisible");
            }
            // We cannot just refresh the errors because some errors may appear or
            // disappear due to the visibility change.
            this.validationController.recreateErrors();
            this.caretManager.mark.refresh();
        };
        Editor.prototype.toggleAttributeHiding = function () {
            this.guiRoot.classList.toggle("inhibit_attribute_hiding");
        };
        Editor.prototype.closeAllTooltips = function () {
            var tts = this.doc.querySelectorAll("div.tooltip");
            var closed = false;
            for (var i = 0; i < tts.length; ++i) {
                var forEl = $.data(tts[i], "wed-tooltip-for");
                var data = $(forEl).data("bs.tooltip");
                if (data != null) {
                    data.leave(data);
                    closed = true;
                }
            }
            return closed;
        };
        Editor.prototype.excludeFromBlur = function (elements) {
            // tslint:disable-next-line:no-any
            this.$excludedFromBlur.add(elements);
        };
        /**
         * Finds the location of the character closest to the ``x, y``
         * coordinates. Very often this will be the character whose bounding client
         * rect encloses the coordinates. However, if no such character exists the
         * algorithm will return the closest character. If multiple characters are at
         * the same distance, then the first one found will be returned.
         *
         * @param x The x coordinate in client coordinates.
         *
         * @param y The y coordinate in client coordinates.
         *
         * @returns The location of the boundary character. The value return is
         * ``undefined`` if the coordinates are outside the client or if the element
         * in which the click occurred is not inside the editor pane (a descendant of
         * ``this.guiRoot``).
         */
        Editor.prototype.findLocationAt = function (x, y) {
            var elementAtMouse = this.doc.elementFromPoint(x, y);
            // This could happen if x, y is outside our screen.
            if (elementAtMouse === null) {
                return undefined;
            }
            // The elementAtMouse is not in the editing pane.
            if (!this.guiRoot.contains(elementAtMouse)) {
                return undefined;
            }
            return this.findLocationInElementAt(elementAtMouse, x, y);
        };
        Editor.prototype.findLocationInElementAt = function (node, x, y, textOk) {
            if (textOk === void 0) { textOk = true; }
            var range = this.doc.createRange();
            var min;
            //
            // This function works only in cases where a space that is effectively
            // rendered as a line break on the screen has a height and width of
            // zero. (Logically this makes sense, there is no part of the screen which
            // really belongs to the space.)
            //
            function checkRange(checkNode, start) {
                var rects;
                if (domtypeguards_1.isText(checkNode)) {
                    range.setStart(checkNode, start);
                    range.setEnd(checkNode, start + 1);
                    rects = range.getClientRects();
                }
                else {
                    rects = checkNode.childNodes[start].getClientRects();
                }
                for (var rectIx = 0; rectIx < rects.length; ++rectIx) {
                    var rect = rects[rectIx];
                    // Not a contender...
                    if (rect.height === 0 || rect.width === 0) {
                        continue;
                    }
                    var dist = util.distsFromRect(x, y, rect.left, rect.top, rect.right, rect.bottom);
                    if (min === undefined || min.dist.y > dist.y ||
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
            var childIx = 0;
            main_loop: while (child !== null) {
                if (textOk && domtypeguards_1.isText(child)) {
                    for (var i = 0; i < child.length; ++i) {
                        if (checkRange(child, i)) {
                            // Can't get any better than this.
                            break main_loop;
                        }
                    }
                }
                else if (checkRange(node, childIx)) {
                    // Can't get any better than this.
                    break;
                }
                child = child.nextSibling;
                childIx++;
            }
            if (min === undefined) {
                return this.caretManager.makeCaret(node, 0);
            }
            return this.caretManager.makeCaret(min.node, min.start);
        };
        // tslint:disable-next-line:cyclomatic-complexity
        Editor.prototype.pointToCharBoundary = function (x, y) {
            // This obviously won't work for top to bottom scripts.  Probably does not
            // work with RTL scripts either.
            var boundary = this.findLocationAt(x, y);
            if (boundary !== undefined) {
                var node = boundary.node, offset = boundary.offset;
                var nodeType = node.nodeType;
                if ((domtypeguards_1.isElement(node) && (offset < node.childNodes.length)) ||
                    (domtypeguards_1.isText(node) && (offset < node.length))) {
                    // Adjust the value we return so that the location returned is the one
                    // closest to the x, y coordinates.
                    var range = this.doc.createRange();
                    range.setStart(node, offset);
                    range.setEnd(node, offset + 1);
                    var rect = range.getBoundingClientRect();
                    switch (nodeType) {
                        case Node.TEXT_NODE:
                            // We use newPosition to adjust the position so that the caret ends up
                            // in a location that makes sense from an editing standpoint.
                            var right = this.caretManager.newPosition(boundary, "right");
                            var left = this.caretManager.newPosition(boundary.make(node, offset + 1), "left");
                            if (right !== undefined && left === undefined) {
                                boundary = right;
                            }
                            else if (left !== undefined && right === undefined) {
                                boundary = left;
                            }
                            else if (right !== undefined && left !== undefined) {
                                boundary = (Math.abs(wed_util_1.boundaryXY(right).left - x) >=
                                    Math.abs(wed_util_1.boundaryXY(left).left - x) ?
                                    left : right);
                            }
                            break;
                        case Node.ELEMENT_NODE:
                            // We don't use newPosition here because we want to skip over the
                            // *whole* element.
                            var before_1;
                            var pointedNode = node.childNodes[offset];
                            if (domtypeguards_1.isElement(pointedNode)) {
                                var closestPos = this.findLocationInElementAt(pointedNode, x, y);
                                var limit = domtypeguards_1.isElement(closestPos.node) ?
                                    closestPos.node.childNodes.length - 1 : -1;
                                switch (closestPos.offset) {
                                    case 0:
                                        before_1 = true;
                                        break;
                                    case limit:
                                        before_1 = false;
                                        break;
                                    default:
                                        break;
                                }
                            }
                            if (before_1 === undefined) {
                                before_1 = Math.abs(rect.left - x) < Math.abs(rect.right - x);
                            }
                            if (!before_1) {
                                boundary = boundary.make(node, offset + 1);
                            }
                            break;
                        default:
                            throw new Error("unexpected node type: " + nodeType);
                    }
                }
            }
            return boundary;
        };
        // tslint:disable-next-line:max-func-body-length cyclomatic-complexity
        Editor.prototype.caretChange = function (ev) {
            var options = ev.options, caret = ev.caret, prevCaret = ev.prevCaret, mode = ev.mode, prevMode = ev.prevMode, manager = ev.manager;
            if (caret === undefined) {
                return;
            }
            var textEdit = options.textEdit === true;
            var gainingFocus = options.gainingFocus === true;
            // We don't want to do this on regaining focus.
            if (!gainingFocus) {
                this.editingMenuManager.setupCompletionMenu();
            }
            // Caret movement terminates a text undo, unless the caret is moved by a
            // text edit.
            if (!textEdit) {
                this.terminateTextUndo();
            }
            // The class owns_caret can be on more than one element. The classic case is
            // if the caret is at an element label.
            while (this.caretOwners[0] !== undefined) {
                this.caretOwners[0].classList.remove("_owns_caret");
            }
            // _label_clicked can also be on more than one element.
            while (this.clickedLabels[0] !== undefined) {
                this.clickedLabels[0].classList.remove("_label_clicked");
            }
            // _with_caret should not be on more than one element, but if a momentary
            // issue happens, we fix it here.
            var hadCaret;
            while (this.withCaret[0] !== undefined) {
                // We record the element with the caret. If there is more than one, which
                // should not happen except in transient cases, it does not matter as it
                // only means that we'll have an unnecessary error recreation.
                hadCaret = this.withCaret[0];
                hadCaret.classList.remove("_with_caret");
            }
            if (prevCaret !== undefined) {
                var oldTp = domutil_1.closest(prevCaret.node, "._placeholder._transient", prevCaret.root);
                if (oldTp !== null && caret.root.contains(oldTp)) {
                    this.guiUpdater.removeNode(oldTp);
                }
            }
            var node = domtypeguards_1.isElement(caret.node) ?
                caret.node : caret.node.parentNode;
            var root = caret.root;
            // This caret is no longer in the gui tree. It is probably an intermediary
            // state so don't do anything with it.
            if (!this.guiRoot.contains(node)) {
                return;
            }
            if (mode !== prevMode) {
                this.toolbar.setModeButtons(mode !== undefined ? mode.getToolbarButtons() : []);
            }
            var real = domutil_1.closestByClass(node, "_real", root);
            if (real !== null) {
                real.classList.add("_owns_caret");
            }
            var hasCaret;
            var gui = domutil_1.closestByClass(node, "_gui", root);
            // Make sure that the caret is in view.
            if (gui !== null) {
                if (manager.anchor === undefined ||
                    domutil_1.closestByClass(manager.anchor.node, "_gui", root) === gui) {
                    for (var _i = 0, _a = domutil.childrenByClass(gui.parentNode, "_gui"); _i < _a.length; _i++) {
                        var child = _a[_i];
                        child.classList.add("_label_clicked");
                    }
                    gui.classList.add("_with_caret");
                    hasCaret = gui;
                }
            }
            else {
                node.classList.add("_owns_caret");
            }
            // When the caret moves, it may move outside of, or into, a start label
            // that has autohidden attributes. In such case, we must recreate the
            // errors, so that any error associated with an attribute that may be
            // shown or hidden is recreated to fix hyperlinking.
            if ((hadCaret !== hasCaret) &&
                ((hasCaret !== undefined &&
                    hasCaret.getElementsByClassName("_shown_when_caret_in_label")
                        .length !== 0) ||
                    (hadCaret !== undefined &&
                        hadCaret.getElementsByClassName("_shown_when_caret_in_label")
                            .length !== 0))) {
                this.validationController.recreateErrors();
            }
            if (!gainingFocus) {
                manager.mark.scrollIntoView();
            }
            // We need to refresh the mark here because the modifications we made above
            // to the CSS may have caused GUI items to appear or disappear and may have
            // mucked up the caret mark.
            this.caretManager.mark.refresh();
            this.setLocationTo(node);
        };
        /**
         * Set the location bar to a new location.
         *
         * @param el The element at which the location should point.
         */
        Editor.prototype.setLocationTo = function (el) {
            var steps = [];
            while (el !== this.guiRoot) {
                if (el.nodeType !== Node.ELEMENT_NODE) {
                    throw new Error("unexpected node type: " + el.nodeType);
                }
                if (!el.classList.contains("_placeholder") &&
                    domutil_1.closestByClass(el, "_phantom", this.guiRoot) === null) {
                    steps.unshift("<span class='_gui _label'><span>&nbsp;" + util.getOriginalName(el) + "&nbsp;</span></span>");
                }
                el = el.parentNode;
            }
            var span = this.wedLocationBar.getElementsByTagName("span")[0];
            // tslint:disable-next-line:no-inner-html
            span.innerHTML =
                steps.length !== 0 ? steps.join("/") : "<span>&nbsp;</span>";
        };
        Editor.prototype.cut = function () {
            var caretManager = this.caretManager;
            var sel = caretManager.sel;
            if (sel === undefined) {
                throw new Error("no selection");
            }
            if (!sel.wellFormed) {
                throw new Error("malformed range");
            }
            var _a = sel.mustAsDataCarets(), startCaret = _a[0], endCaret = _a[1];
            var cutBuffer = this.cutBuffer;
            while (cutBuffer.firstChild !== null) {
                cutBuffer.removeChild(cutBuffer.firstChild);
            }
            if (domtypeguards_1.isAttr(startCaret.node)) {
                var attr = startCaret.node;
                if (attr !== endCaret.node) {
                    throw new Error("attribute selection that does not start " +
                        "and end in the same attribute");
                }
                var removedText = attr.value.slice(startCaret.offset, endCaret.offset);
                this.spliceAttribute(domutil_1.closestByClass(caretManager.mustFromDataLocation(startCaret).node, "_attribute_value"), startCaret.offset, endCaret.offset - startCaret.offset, "");
                cutBuffer.textContent = removedText;
            }
            else {
                var cutRet = this.dataUpdater.cut(startCaret, endCaret);
                var nodes = cutRet[1];
                var parser = new this.window.DOMParser();
                var doc = parser.parseFromString("<div></div>", "text/xml");
                for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                    var node = nodes_1[_i];
                    doc.firstChild.appendChild(doc.adoptNode(node));
                }
                cutBuffer.textContent = doc.firstChild.innerHTML;
                caretManager.setCaret(cutRet[0]);
            }
            var range = this.doc.createRange();
            var container = cutBuffer;
            range.setStart(container, 0);
            range.setEnd(container, container.childNodes.length);
            var domSel = this.window.getSelection();
            domSel.removeAllRanges();
            domSel.addRange(range);
            // We've set the range to the cut buffer, which is what we want for the cut
            // operation to work. However, the focus is also set to the cut buffer but
            // once the cut is done we want the focus to be back to our caret, so...
            setTimeout(function () {
                caretManager.focusInputField();
            }, 0);
        };
        Editor.prototype.paste = function (editor, data) {
            var toPaste = data.to_paste;
            var dataClone = toPaste.cloneNode(true);
            var caret = this.caretManager.getDataCaret();
            if (caret === undefined) {
                throw new Error("trying to paste without a caret");
            }
            var newCaret;
            // Handle the case where we are pasting only text.
            if (toPaste.childNodes.length === 1 && domtypeguards_1.isText(toPaste.firstChild)) {
                if (domtypeguards_1.isAttr(caret.node)) {
                    var guiCaret = this.caretManager.mustGetNormalizedCaret();
                    this.spliceAttribute(domutil_1.closestByClass(guiCaret.node, "_attribute_value", guiCaret.node), guiCaret.offset, 0, toPaste.firstChild.data);
                }
                else {
                    (newCaret = this.dataUpdater.insertText(caret, toPaste.firstChild.data).caret);
                }
            }
            else {
                var frag = document.createDocumentFragment();
                while (toPaste.firstChild !== null) {
                    frag.appendChild(toPaste.firstChild);
                }
                switch (caret.node.nodeType) {
                    case Node.TEXT_NODE:
                        newCaret = this.dataUpdater.insertIntoText(caret, frag)[1];
                        break;
                    case Node.ELEMENT_NODE:
                        var child = caret.node.childNodes[caret.offset];
                        var after_1 = child != null ? child.nextSibling : null;
                        // tslint:disable-next-line:no-any
                        this.dataUpdater.insertBefore(caret.node, frag, child);
                        newCaret = caret.makeWithOffset(after_1 !== null ?
                            domutil_1.indexOf(caret.node.childNodes, after_1) :
                            caret.node.childNodes.length);
                        break;
                    default:
                        throw new Error("unexpected node type: " + caret.node.nodeType);
                }
            }
            if (newCaret != null) {
                this.caretManager.setCaret(newCaret);
                caret = newCaret;
            }
            this.$guiRoot.trigger("wed-post-paste", [data.e, caret, dataClone]);
        };
        Editor.prototype.replaceRange = function (editor, data) {
            var caretManager = editor.caretManager;
            var range = data.range, newText = data.newText, caretAtEnd = data.caretAtEnd;
            var start = range.start, end = range.end;
            var dataStart = caretManager.toDataLocation(start);
            var dataEnd = caretManager.toDataLocation(end);
            var caret;
            if (domtypeguards_1.isAttr(dataStart.node)) {
                var attr = dataStart.node;
                var value = attr.value;
                value = value.slice(0, dataStart.offset) + newText +
                    value.slice(dataEnd.offset);
                editor.dataUpdater.setAttributeNS(attr.ownerElement, attr.namespaceURI === null ? "" : attr.namespaceURI, attr.name, value);
                if (caretAtEnd) {
                    caret = dataStart.makeWithOffset(dataStart.offset + newText.length);
                }
                else {
                    caret = dataStart;
                }
            }
            else {
                var cutRet = editor.dataUpdater.cut(dataStart, dataEnd)[0];
                (caret = editor.dataUpdater.insertText(cutRet, newText, caretAtEnd).caret);
            }
            caretManager.setCaret(caret, { textEdit: true });
        };
        return Editor;
    }());
    exports.Editor = Editor;
});
//  LocalWords:  MPL keyConstants KEYPRESS sm md contenteditable constrainer sb
//  LocalWords:  scroller nbsp href nav ul li errorlist HTMLElement jQuery lt
//  LocalWords:  html runtime DLocRoot config navlist popstate attr xmlns xml
//  LocalWords:  getDescriptionFor fireTransformation exitTaskSuspension tooOld
//  LocalWords:  readonly attrVal Refetch pathToNode nodeToPath Autosaved bs ev
//  LocalWords:  editedByOther autosaving guiRoot BeforeInsertNodeAt tooltip ns
//  LocalWords:  InsertNodeAt tooltips BeforeDeleteNode stylesheet css tabindex
//  LocalWords:  revalidate dragenter dragstart dragover keydown keypress pageX
//  LocalWords:  compositionstart compositionupdate compositionend mousedown px
//  LocalWords:  mouseover mouseout contextmenu mousemove mouseup pageY screenX
//  LocalWords:  screenY docUrl wed's enterStartTag pheight maxPanelHeight cd
//  LocalWords:  domutil childByClass outerHeight clipboardData parsererror Yay
//  LocalWords:  Ctrl CapsLock activeElement querySelector getCaret dataNode nd
//  LocalWords:  noop keyup mousedownHandler caretManager mouseoutHandler rect
//  LocalWords:  typeahead autosave guiNode PossibleDueToWildcard RTL nodeType
//  LocalWords:  currentLabelLevel elementAtMouse newPosition
//# sourceMappingURL=editor.js.map