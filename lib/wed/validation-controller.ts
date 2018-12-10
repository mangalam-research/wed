/**
 * Controller managing the validation logic of a wed editor.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { AttributeNameError, DefaultNameResolver,
         ValidationError } from "salve";
import { ErrorData, ResetData, WorkingState,
         WorkingStateData } from "salve-dom";

import { DLoc } from "./dloc";
import { isAttr, isElement } from "./domtypeguards";
import { isNotDisplayed } from "./domutil";
import { Editor } from "./editor";
import { GUIValidationError } from "./gui-validation-error";
import { ErrorLayer } from "./gui/error-layer";
import { Scroller } from "./gui/scroller";
import { AttributeNotFound } from "./guiroot";
import { TaskRunner } from "./task-runner";
import { ProcessValidationErrors } from "./tasks/process-validation-errors";
import { RefreshValidationErrors } from "./tasks/refresh-validation-errors";
import { convertPatternObj, newGenericID } from "./util";
import { Validator } from "./validator";
import { boundaryXY, getGUINodeIfExists } from "./wed-util";

const stateToStr: Record<string, string> = {};
stateToStr[WorkingState.INCOMPLETE] = "stopped";
stateToStr[WorkingState.WORKING] = "working";
stateToStr[WorkingState.INVALID] = "invalid";
stateToStr[WorkingState.VALID] = "valid";

const stateToProgressType: Record<string, string> = {};
stateToProgressType[WorkingState.INCOMPLETE] = "info";
stateToProgressType[WorkingState.WORKING] = "info";
stateToProgressType[WorkingState.INVALID] = "danger";
stateToProgressType[WorkingState.VALID] = "success";

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
function findInsertionPoint(editor: Editor, node: Node,
                            index: number): DLoc | undefined {
  const caretManager = editor.caretManager;
  try {
    return caretManager.fromDataLocation(node, index);
  }
  catch (ex) {
    if (ex instanceof AttributeNotFound) {
      // This happens only if node points to an attribute.
      return caretManager.fromDataLocation((node as Attr).ownerElement!, 0);
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
function elementsToFrag(doc: Document,
                        items: HTMLElement[]): DocumentFragment {
  const frag = doc.createDocumentFragment();
  for (const item of items) {
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
function convertNames(error: ValidationError,
                      resolver: DefaultNameResolver): string[] {
  // Turn the names into qualified names.
  const convertedNames = [];
  const patterns = error.getNames();
  for (const pattern of patterns) {
    const names = pattern.toArray();
    let convertedName = "";
    if (names !== null) {
      // Simple pattern, just translate all names one by one.
      const conv = [];
      for (const name of names) {
        conv.push(resolver.unresolveName(name.ns, name.name));
      }
      convertedName = conv.join(" or ");
    }
    else {
      // We convert the complex pattern into something reasonable.
      convertedName = convertPatternObj(pattern.toObject(), resolver);
    }
    convertedNames.push(convertedName);
  }

  return convertedNames;
}

/**
 * The click event handler to use on list items created by the controller.
 */
export type ErrorItemHandler = (ev: JQueryMouseEventObject) => boolean;

/**
 * Controls the validator and the tasks that pertain to error processing and
 * refreshing. Takes care of reporting errors to the user.
 */
export class ValidationController {
  public readonly document: Document;

  private readonly refreshErrorsRunner: TaskRunner;
  private readonly processErrorsRunner: TaskRunner;

  private lastDoneShown: number = 0;
  private processErrorsTimeout: number | undefined;

  /**
   * This holds the timeout set to process validation errors in batch.  The
   * delay in ms before we consider a batch ready to process.
   */
  private processErrorsDelay: number = 500;
  private _errors: GUIValidationError[] = [];

  private readonly $errorList: JQuery;

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
  constructor(private readonly editor: Editor,
              private readonly validator: Validator,
              private readonly resolver: DefaultNameResolver,
              private readonly scroller: Scroller,
              private readonly guiRoot: Element,
              private readonly progressBar: HTMLElement,
              private readonly validationMessage: HTMLElement,
              private readonly errorLayer: ErrorLayer,
              private readonly errorList: HTMLElement,
              private readonly errorItemHandler: ErrorItemHandler) {
    this.document = guiRoot.ownerDocument;
    this.$errorList = $(errorList);
    this.refreshErrorsRunner =
      new TaskRunner(new RefreshValidationErrors(this));
    this.processErrorsRunner =
      new TaskRunner(new ProcessValidationErrors(this));
    this.validator.events.addEventListener(
      "state-update", this.onValidatorStateChange.bind(this));
    this.validator.events.addEventListener(
      "error", this.onValidatorError.bind(this));
    this.validator.events.addEventListener(
      "reset-errors", this.onResetErrors.bind(this));
  }

  /**
   * @returns a shallow copy of the error list.
   */
  copyErrorList(): GUIValidationError[] {
    return this._errors.slice();
  }

  /**
   * Stops all tasks and the validator.
   */
  stop(): void {
    this.refreshErrorsRunner.stop();
    this.processErrorsRunner.stop();
    this.validator.stop();
  }

  /**
   * Resumes all tasks and the validator.
   */
  resume(): void {
    this.refreshErrorsRunner.resume();
    this.processErrorsRunner.resume();
    this.validator.start(); // Yes, start is the right method.
  }

  /**
   * Handles changes in the validator state. Updates the progress bar and the
   * validation status.
   */
  private onValidatorStateChange(workingState: WorkingStateData): void {
    const { state, partDone } = workingState;
    if (state === WorkingState.WORKING) {
      // Do not show changes less than 5%
      if (partDone - this.lastDoneShown < 0.05) {
        return;
      }
    }
    else if (state === WorkingState.VALID || state === WorkingState.INVALID) {
      // We're done so we might as well process the errors right now.
      this.processErrors();
    }

    this.lastDoneShown = partDone;
    const percent = partDone * 100;
    const progress = this.progressBar;
    progress.style.width = `${percent}%`;
    progress.classList.remove("progress-bar-info", "progress-bar-success",
                              "progress-bar-danger");
    progress.classList.add(`progress-bar-${stateToProgressType[state]}`);
    this.validationMessage.textContent = stateToStr[state];
  }

  /**
   * Handles a validation error reported by the validator. It records the error
   * and schedule future processing of the errors.
   */
  private onValidatorError(ev: ErrorData): void {
    this._errors.push({
      ev,
      marker: undefined,
      item: undefined,
    });
    // We "batch" validation errors to process multiple of them in one shot
    // rather than call _processErrors each time.
    if (this.processErrorsTimeout === undefined) {
      this.processErrorsTimeout = setTimeout(this.processErrors.bind(this),
                                             this.processErrorsDelay);
    }
  }

  /**
   * Handles resets of the validation state.
   */
  private onResetErrors(ev: ResetData): void {
    if (ev.at !== 0) {
      throw new Error("internal error: wed does not yet support " +
                      "resetting errors at an arbitrary location");
    }

    this.lastDoneShown = 0;
    this.clearErrors();
  }

  /**
   * Resets the state of the error processing task and resumes it
   * as soon as possible.
   */
  processErrors(): void {
    // Clear the timeout... because this function may be called from somewhere
    // else than the timeout.
    if (this.processErrorsTimeout !== undefined) {
      clearTimeout(this.processErrorsTimeout);
      this.processErrorsTimeout = undefined;
    }

    this.processErrorsRunner.reset();
    this.editor.resumeTaskWhenPossible(this.processErrorsRunner);
  }

  /**
   * Find where the error represented by the event passed should be marked.
   *
   * @param ev The error reported by the validator.
   *
   * @returns A location, if possible.
   */
  private findInsertionPoint(ev: ErrorData): DLoc | undefined {
    const { error, node: dataNode, index } = ev;

    if (dataNode == null) {
      throw new Error("error without a node");
    }

    if (index === undefined) {
      throw new Error("error without an index");
    }

    const isAttributeNameError = error instanceof AttributeNameError;

    let insertAt: DLoc | undefined;
    if (isAttributeNameError) {
      const guiNode = getGUINodeIfExists(this.editor, dataNode);
      if (guiNode === undefined) {
        return undefined;
      }

      // Attribute name errors can have two causes: the attribute is not
      // allowed, or an attribute is missing. In the former case, the error
      // points to the attribute node. In the latter case, it points to the
      // element that's missing the attribute.
      let insertionNode: Node | null;
      if (isAttr(dataNode)) {
        // Spurious attribute.
        insertionNode = guiNode;
      }
      else {
        // Missing attribute.
        if (!isElement(guiNode)) {
          throw new Error("attribute name errors should be associated with " +
                          "elements");
        }

        insertionNode =
          guiNode.querySelector("._gui.__start_label ._greater_than");
      }

      insertAt = DLoc.mustMakeDLoc(this.guiRoot, insertionNode, 0);
    }
    else {
      insertAt = findInsertionPoint(this.editor, dataNode, index);

      if (insertAt === undefined) {
        return undefined;
      }

      insertAt = this.editor.caretManager.normalizeToEditableRange(insertAt);
    }

    return insertAt;
  }

  /**
   * Process a single error. This will compute the location of the error marker
   * and will create a marker to add to the error layer, and a list item to add
   * to the list of errors.
   *
   * @return ``false`` if there was no insertion point for the error, and thus
   * no marker or item were created. ``true`` otherwise.
   */
  // tslint:disable-next-line:max-func-body-length
  processError(err: GUIValidationError): boolean {
    this.editor.expandErrorPanelWhenNoNavigation();
    const { ev } = err;
    const { error, node: dataNode } = ev;

    if (dataNode == null) {
      throw new Error("error without a node");
    }

    const insertAt = this.findInsertionPoint(ev);
    if (insertAt === undefined) {
      return false;
    }

    let closestElement = insertAt.node as HTMLElement;
    if (closestElement.nodeType === Node.TEXT_NODE) {
      closestElement = closestElement.parentNode as HTMLElement;
    }

    if (!isElement(closestElement)) {
      throw new Error("we should be landing on an element");
    }

    let item;
    let marker = err.marker;

    // We may be getting here with an error that already has a marker. It has
    // already been "processed" and only needs its location updated. Otherwise,
    // this is a new error: create a list item and marker for it.
    if (marker === undefined) {
      // Turn the names into qualified names.
      const convertedNames = convertNames(error, this.resolver);
      const doc = insertAt.node.ownerDocument;
      item = doc.createElement("li");
      const linkId = item.id = newGenericID();
      if (isAttr(dataNode) &&
          isNotDisplayed(closestElement,
                         insertAt.root as (HTMLElement | HTMLDocument))) {
        item.textContent = error.toStringWithNames(convertedNames);
        item.title = "This error belongs to an attribute " +
          "which is not currently displayed.";
      }
      else {
        marker = doc.createElement("span");
        marker.className = "_phantom wed-validation-error";
        const $marker = $(marker);

        $marker.mousedown(() => {
          this.$errorList.parents(".panel-collapse").collapse("show");
          const $link = $(this.errorList.querySelector(`#${linkId}`));
          const $scrollable = this.$errorList.parent(".panel-body");
          $scrollable.animate({
            scrollTop: $link.offset()!.top - $scrollable.offset()!.top +
              $scrollable[0].scrollTop,
          });
          this.errorLayer.select(marker!);
          $link.siblings().removeClass("selected");
          $link.addClass("selected");

          // We move the caret ourselves and prevent further processing of this
          // event. Older versions of wed let the event trickle up and be
          // handled by the general caret movement code but that would sometimes
          // result in a caret being put in a bad position.
          this.editor.caretManager.setCaret(insertAt);
          return false;
        });

        const markerId = marker.id = newGenericID();
        const link = doc.createElement("a");
        link.href = `#${markerId}`;
        link.textContent = error.toStringWithNames(convertedNames);
        item.appendChild(link);

        $(item.firstElementChild).click(err, this.errorItemHandler);
      }
    }

    // Update the marker's location.
    if (marker !== undefined) {
      const { top, left } = boundaryXY(insertAt);
      const { scrollTop, scrollLeft } = this.scroller;
      const scrollerPos = this.scroller.getBoundingClientRect();
      const fontSize =
        parseFloat(this.editor.window.getComputedStyle(closestElement)
                   .fontSize!);
      const height = fontSize * 0.2;
      marker.style.height = `${height}px`;
      // We move down from the top of the box produced by boundaryXY because
      // when targeting parent, it may return a box which is as high as the
      // parent's contents.
      marker.style.top =
        `${top + fontSize - height - scrollerPos.top + scrollTop}px`;
      marker.style.left = `${left - scrollerPos.left + scrollLeft}px`;
    }

    if (err.item === undefined) {
      err.item = item;
    }
    err.marker = marker;

    return true;
  }

  /**
   * Clear all validation errors. This makes the editor forget and updates the
   * GUI to remove all displayed errors.
   */
  private clearErrors(): void {
    this._errors = [];
    this.refreshErrorsRunner.stop();
    this.processErrorsRunner.stop();

    this.errorLayer.clear();

    const list = this.errorList;
    while (list.lastChild != null) {
      list.removeChild(list.lastChild);
    }

    this.refreshErrorsRunner.reset();
    this.processErrorsRunner.reset();
  }

  /**
   * Terminate the controller. This stops all runners and clears any unexpired
   * timeout.
   */
  terminate(): void {
    if (this.processErrorsTimeout !== undefined) {
      clearTimeout(this.processErrorsTimeout);
    }
    this.stop();
  }

  /**
   * This method updates the location markers of the errors.
   */
  refreshErrors(): void {
    this.refreshErrorsRunner.reset();
    this.editor.resumeTaskWhenPossible(this.refreshErrorsRunner);
  }

  /**
   * This method recreates the error messages and the error markers associated
   * with the errors that the editor already knows.
   */
  recreateErrors(): void {
    this.errorLayer.clear();

    const list = this.errorList;
    while (list.lastChild !== null) {
      list.removeChild(list.lastChild);
    }

    for (const error of this._errors) {
      error.marker = undefined;
      error.item = undefined;
    }

    this.processErrors();
  }

  /**
   * Add items to the list of errors.
   *
   * @param items The items to add to the list of errors.
   */
  appendItems(items: HTMLElement[]): void {
    this.errorList.appendChild(elementsToFrag(this.document, items));
  }

  /**
   * Add markers to the layer that is used to contain error markers.
   *
   * @param markers The markers to add.
   */
  appendMarkers(markers: HTMLElement[]): void {
    this.errorLayer.append(elementsToFrag(this.document, markers));
  }
}

//  LocalWords:  MPL scroller processErrors li markerId loc scrollerPos px
//  LocalWords:  scrollTop scrollLeft
