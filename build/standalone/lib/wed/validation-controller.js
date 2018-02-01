/**
 * Controller managing the validation logic of a wed editor.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "salve", "salve-dom", "./dloc", "./domtypeguards", "./domutil", "./guiroot", "./task-runner", "./tasks/process-validation-errors", "./tasks/refresh-validation-errors", "./util", "./wed-util"], function (require, exports, salve_1, salve_dom_1, dloc_1, domtypeguards_1, domutil_1, guiroot_1, task_runner_1, process_validation_errors_1, refresh_validation_errors_1, util_1, wed_util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var stateToStr = {};
    stateToStr[salve_dom_1.WorkingState.INCOMPLETE] = "stopped";
    stateToStr[salve_dom_1.WorkingState.WORKING] = "working";
    stateToStr[salve_dom_1.WorkingState.INVALID] = "invalid";
    stateToStr[salve_dom_1.WorkingState.VALID] = "valid";
    var stateToProgressType = {};
    stateToProgressType[salve_dom_1.WorkingState.INCOMPLETE] = "info";
    stateToProgressType[salve_dom_1.WorkingState.WORKING] = "info";
    stateToProgressType[salve_dom_1.WorkingState.INVALID] = "danger";
    stateToProgressType[salve_dom_1.WorkingState.VALID] = "success";
    // This is a utility function for the method of the same name. If the mode is
    // set to not display attributes or if a custom decorator is set to not display
    // a specific attribute, then finding the GUI location of the attribute won't be
    // possible. In such case, we want to fail nicely rather than crash to the
    // ground.
    //
    // (NOTE: What we're talking about is not the label visibility level being such
    // that attributes are not *seen* but have DOM elements for them in the GUI
    // tree. We're talking about a situation in which the mode's decorator does not
    // create DOM elements for the attributes.)
    //
    function findInsertionPoint(editor, node, index) {
        var caretManager = editor.caretManager;
        try {
            return caretManager.fromDataLocation(node, index);
        }
        catch (ex) {
            if (ex instanceof guiroot_1.AttributeNotFound) {
                // This happens only if node points to an attribute.
                return caretManager.fromDataLocation(node.ownerElement, 0);
            }
            throw ex;
        }
    }
    /**
     * Add a list of elements to a ``DocumentFragment``.
     *
     * @param doc The document from which to create the fragment.
     *
     * @param items The elements to add to the new fragment.
     *
     * @returns A new fragment that contains the elements passed.
     */
    function elementsToFrag(doc, items) {
        var frag = doc.createDocumentFragment();
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            frag.appendChild(item);
        }
        return frag;
    }
    /**
     * Convert the names in an error message from their expanded form to their
     * prefix, local name form.
     *
     * @param error The error.
     *
     * @param resolve The resolver to use to convert the names.
     *
     * @returns The converted names.
     */
    function convertNames(error, resolver) {
        // Turn the names into qualified names.
        var convertedNames = [];
        var patterns = error.getNames();
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            var names = pattern.toArray();
            var convertedName = "";
            if (names !== null) {
                // Simple pattern, just translate all names one by one.
                var conv = [];
                for (var _a = 0, names_1 = names; _a < names_1.length; _a++) {
                    var name_1 = names_1[_a];
                    conv.push(resolver.unresolveName(name_1.ns, name_1.name));
                }
                convertedName = conv.join(" or ");
            }
            else {
                // We convert the complex pattern into something reasonable.
                convertedName = util_1.convertPatternObj(pattern.toObject(), resolver);
            }
            convertedNames.push(convertedName);
        }
        return convertedNames;
    }
    /**
     * Controls the validator and the tasks that pertain to error processing and
     * refreshing. Takes care of reporting errors to the user.
     */
    var ValidationController = /** @class */ (function () {
        /**
         * @param editor The editor for which this controller is created.
         *
         * @param validator The validator which is under control.
         *
         * @param resolver A name resolver to resolve names in errors.
         *
         * @param scroller The scroller for the edited contents.
         *
         * @param guiRoot The DOM element representing the root of the edited
         * document.
         *
         * @param progressBar: The DOM element which contains the validation progress
         * bar.
         *
         * @param validationMessage: The DOM element which serves to report the
         * validation status.
         *
         * @param errorLayer: The layer that holds error markers.
         *
         * @param errorList: The DOM element which serves to contain the error list.
         *
         * @param errorItemHandler: An event handler for the markers.
         */
        function ValidationController(editor, validator, resolver, scroller, guiRoot, progressBar, validationMessage, errorLayer, errorList, errorItemHandler) {
            this.editor = editor;
            this.validator = validator;
            this.resolver = resolver;
            this.scroller = scroller;
            this.guiRoot = guiRoot;
            this.progressBar = progressBar;
            this.validationMessage = validationMessage;
            this.errorLayer = errorLayer;
            this.errorList = errorList;
            this.errorItemHandler = errorItemHandler;
            this.lastDoneShown = 0;
            /**
             * This holds the timeout set to process validation errors in batch.  The
             * delay in ms before we consider a batch ready to process.
             */
            this.processErrorsDelay = 500;
            this._errors = [];
            /**
             * Gives the index in errors of the last validation error that has
             * already been processed.
             */
            this.processedErrorsUpTo = -1;
            this.document = guiRoot.ownerDocument;
            this.$errorList = $(errorList);
            this.refreshErrorsRunner =
                new task_runner_1.TaskRunner(new refresh_validation_errors_1.RefreshValidationErrors(this));
            this.processErrorsRunner =
                new task_runner_1.TaskRunner(new process_validation_errors_1.ProcessValidationErrors(this));
            this.validator.events.addEventListener("state-update", this.onValidatorStateChange.bind(this));
            this.validator.events.addEventListener("error", this.onValidatorError.bind(this));
            this.validator.events.addEventListener("reset-errors", this.onResetErrors.bind(this));
        }
        /**
         * @returns a shallow copy of the error list.
         */
        ValidationController.prototype.copyErrorList = function () {
            return this._errors.slice();
        };
        /**
         * Stops all tasks and the validator.
         */
        ValidationController.prototype.stop = function () {
            this.refreshErrorsRunner.stop();
            this.processErrorsRunner.stop();
            this.validator.stop();
        };
        /**
         * Resumes all tasks and the validator.
         */
        ValidationController.prototype.resume = function () {
            this.refreshErrorsRunner.resume();
            this.processErrorsRunner.resume();
            this.validator.start(); // Yes, start is the right method.
        };
        /**
         * Handles changes in the validator state. Updates the progress bar and the
         * validation status.
         */
        ValidationController.prototype.onValidatorStateChange = function (workingState) {
            var state = workingState.state, partDone = workingState.partDone;
            if (state === salve_dom_1.WorkingState.WORKING) {
                // Do not show changes less than 5%
                if (partDone - this.lastDoneShown < 0.05) {
                    return;
                }
            }
            else if (state === salve_dom_1.WorkingState.VALID || state === salve_dom_1.WorkingState.INVALID) {
                // We're done so we might as well process the errors right now.
                this.processErrors();
            }
            this.lastDoneShown = partDone;
            var percent = partDone * 100;
            var progress = this.progressBar;
            progress.style.width = percent + "%";
            progress.classList.remove("progress-bar-info", "progress-bar-success", "progress-bar-danger");
            progress.classList.add("progress-bar-" + stateToProgressType[state]);
            this.validationMessage.textContent = stateToStr[state];
        };
        /**
         * Handles a validation error reported by the validator. It records the error
         * and schedule future processing of the errors.
         */
        ValidationController.prototype.onValidatorError = function (ev) {
            this._errors.push({
                ev: ev,
                marker: undefined,
                item: undefined,
            });
            // We "batch" validation errors to process multiple of them in one shot
            // rather than call _processErrors each time.
            if (this.processErrorsTimeout === undefined) {
                this.processErrorsTimeout = setTimeout(this.processErrors.bind(this), this.processErrorsDelay);
            }
        };
        /**
         * Handles resets of the validation state.
         */
        ValidationController.prototype.onResetErrors = function (ev) {
            if (ev.at !== 0) {
                throw new Error("internal error: wed does not yet support " +
                    "resetting errors at an arbitrary location");
            }
            this.lastDoneShown = 0;
            this.clearErrors();
        };
        /**
         * Resets the state of the error processing task and resumes it
         * as soon as possible.
         */
        ValidationController.prototype.processErrors = function () {
            // Clear the timeout... because this function may be called from somewhere
            // else than the timeout.
            if (this.processErrorsTimeout !== undefined) {
                clearTimeout(this.processErrorsTimeout);
                this.processErrorsTimeout = undefined;
            }
            this.processErrorsRunner.reset();
            this.editor.resumeTaskWhenPossible(this.processErrorsRunner);
        };
        /**
         * Find where the error represented by the event passed should be marked.
         *
         * @param ev The error reported by the validator.
         *
         * @returns A location, if possible.
         */
        ValidationController.prototype.findInsertionPoint = function (ev) {
            var error = ev.error, dataNode = ev.node, index = ev.index;
            if (dataNode == null) {
                throw new Error("error without a node");
            }
            if (index === undefined) {
                throw new Error("error without an index");
            }
            var isAttributeNameError = error instanceof salve_1.AttributeNameError;
            var insertAt;
            if (isAttributeNameError) {
                var guiNode = wed_util_1.getGUINodeIfExists(this.editor, dataNode);
                if (guiNode === undefined) {
                    return undefined;
                }
                // Attribute name errors can have two causes: the attribute is not
                // allowed, or an attribute is missing. In the former case, the error
                // points to the attribute node. In the latter case, it points to the
                // element that's missing the attribute.
                var insertionNode = void 0;
                if (domtypeguards_1.isAttr(dataNode)) {
                    // Spurious attribute.
                    insertionNode = guiNode;
                }
                else {
                    // Missing attribute.
                    if (!domtypeguards_1.isElement(guiNode)) {
                        throw new Error("attribute name errors should be associated with " +
                            "elements");
                    }
                    insertionNode =
                        guiNode.querySelector("._gui.__start_label ._greater_than");
                }
                insertAt = dloc_1.DLoc.mustMakeDLoc(this.guiRoot, insertionNode, 0);
            }
            else {
                insertAt = findInsertionPoint(this.editor, dataNode, index);
                if (insertAt === undefined) {
                    return undefined;
                }
                insertAt = this.editor.caretManager.normalizeToEditableRange(insertAt);
            }
            return insertAt;
        };
        /**
         * Process a single error. This will compute the location of the error marker
         * and will create a marker to add to the error layer, and a list item to add
         * to the list of errors.
         *
         * @return ``false`` if there was no insertion point for the error, and thus
         * no marker or item were created. ``true`` otherwise.
         */
        ValidationController.prototype.processError = function (err) {
            var _this = this;
            this.editor.expandErrorPanelWhenNoNavigation();
            var ev = err.ev;
            var error = ev.error, dataNode = ev.node;
            var insertAt = this.findInsertionPoint(ev);
            if (insertAt === undefined) {
                return false;
            }
            var item;
            var marker = err.marker;
            if (dataNode == null) {
                throw new Error("error without a node");
            }
            // We may be getting here with an error that already has a marker. It has
            // already been "processed" and only needs its location updated. Otherwise,
            // this is a new error: create a list item and marker for it.
            if (marker === undefined) {
                var doc = insertAt.node.ownerDocument;
                var invisibleAttribute = false;
                if (domtypeguards_1.isAttr(dataNode)) {
                    var nodeToTest = insertAt.node;
                    if (nodeToTest.nodeType === Node.TEXT_NODE) {
                        nodeToTest = nodeToTest.parentNode;
                    }
                    if (!domtypeguards_1.isElement(nodeToTest)) {
                        throw new Error("we should be landing on an element");
                    }
                    invisibleAttribute = domutil_1.isNotDisplayed(nodeToTest, insertAt.root);
                }
                // Turn the names into qualified names.
                var convertedNames = convertNames(error, this.resolver);
                item = doc.createElement("li");
                var linkId_1 = item.id = util_1.newGenericID();
                if (!invisibleAttribute) {
                    marker = doc.createElement("span");
                    marker.className = "_phantom wed-validation-error";
                    marker.innerText = "\u00A0";
                    var $marker = $(marker);
                    $marker.mousedown(function () {
                        _this.$errorList.parents(".panel-collapse").collapse("show");
                        var $link = $(_this.errorList.querySelector("#" + linkId_1));
                        var $scrollable = _this.$errorList.parent(".panel-body");
                        $scrollable.animate({
                            scrollTop: $link.offset().top - $scrollable.offset().top +
                                $scrollable[0].scrollTop,
                        });
                        _this.errorLayer.select(marker);
                        $link.siblings().removeClass("selected");
                        $link.addClass("selected");
                        // We move the caret ourselves and prevent further processing of this
                        // event. Older versions of wed let the event trickle up and be
                        // handled by the general caret movement code but that would sometimes
                        // result in a caret being put in a bad position.
                        _this.editor.caretManager.setCaret(insertAt);
                        return false;
                    });
                    var markerId = marker.id = util_1.newGenericID();
                    var link = doc.createElement("a");
                    link.href = "#" + markerId;
                    link.textContent = error.toStringWithNames(convertedNames);
                    item.appendChild(link);
                    $(item.firstElementChild).click(this.errorItemHandler);
                }
                else {
                    item.textContent = error.toStringWithNames(convertedNames);
                    item.title = "This error belongs to an attribute " +
                        "which is not currently displayed.";
                }
            }
            // Update the marker's location.
            if (marker !== undefined) {
                var loc = wed_util_1.boundaryXY(insertAt);
                var scroller = this.scroller;
                var scrollerPos = scroller.getBoundingClientRect();
                marker.style.top = loc.top - scrollerPos.top + scroller.scrollTop + "px";
                marker.style.left =
                    loc.left - scrollerPos.left + scroller.scrollLeft + "px";
            }
            if (err.item === undefined) {
                err.item = item;
            }
            err.marker = marker;
            return true;
        };
        /**
         * Clear all validation errors. This makes the editor forget and updates the
         * GUI to remove all displayed errors.
         */
        ValidationController.prototype.clearErrors = function () {
            this._errors = [];
            this.processedErrorsUpTo = -1;
            this.refreshErrorsRunner.stop();
            this.processErrorsRunner.stop();
            this.errorLayer.clear();
            var list = this.errorList;
            while (list.lastChild != null) {
                list.removeChild(list.lastChild);
            }
            this.refreshErrorsRunner.reset();
            this.processErrorsRunner.reset();
        };
        /**
         * Terminate the controller. This stops all runners and clears any unexpired
         * timeout.
         */
        ValidationController.prototype.terminate = function () {
            if (this.processErrorsTimeout !== undefined) {
                clearTimeout(this.processErrorsTimeout);
            }
            this.stop();
        };
        /**
         * This method updates the location markers of the errors.
         */
        ValidationController.prototype.refreshErrors = function () {
            this.refreshErrorsRunner.reset();
            this.editor.resumeTaskWhenPossible(this.refreshErrorsRunner);
        };
        /**
         * This method recreates the error messages and the error markers associated
         * with the errors that the editor already knows.
         */
        ValidationController.prototype.recreateErrors = function () {
            this.errorLayer.clear();
            var list = this.errorList;
            while (list.lastChild !== null) {
                list.removeChild(list.lastChild);
            }
            for (var _i = 0, _a = this._errors; _i < _a.length; _i++) {
                var error = _a[_i];
                error.marker = undefined;
                error.item = undefined;
            }
            this.processedErrorsUpTo = -1;
            this.processErrors();
        };
        /**
         * Add items to the list of errors.
         *
         * @param items The items to add to the list of errors.
         */
        ValidationController.prototype.appendItems = function (items) {
            this.errorList.appendChild(elementsToFrag(this.document, items));
        };
        /**
         * Add markers to the layer that is used to contain error markers.
         *
         * @param markers The markers to add.
         */
        ValidationController.prototype.appendMarkers = function (markers) {
            this.errorLayer.append(elementsToFrag(this.document, markers));
        };
        return ValidationController;
    }());
    exports.ValidationController = ValidationController;
});
//  LocalWords:  MPL scroller processErrors li markerId loc scrollerPos px
//  LocalWords:  scrollTop scrollLeft
//# sourceMappingURL=validation-controller.js.map