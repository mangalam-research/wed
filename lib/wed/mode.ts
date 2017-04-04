/**
 * The base types for modes.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
"use strict";

import { NameResolver } from "salve";

import { Action } from "./action";
import { isElement } from "./domtypeguards";
import * as domutil from "./domutil";
import { ModeValidator } from "./validator";

// tslint:disable-next-line:no-any
export type Editor = any;

// tslint:disable-next-line:no-any
export type Decorator = any;

export type ModeOptions = {};

export type WedOptions = { [key: string]: string | number | WedOptions };

export interface Mode {
  /**
   * This is called by the editor when a mode is ready to be initialized. The
   * mode could use this to add a toolbar above the editor or add listeners to
   * key events, etc.
   *
   * @returns A promise that resolves once the mode is done initializing.
   */
  init(): Promise<void>;

  /**
   * Gets the options that the mode wants wed to use with this mode.
   *
   * @returns The options. Callers are not allowed to modify the value returned.
   */
  getWedOptions(): WedOptions;

  /**
   * This method returns a name resolver that is setup to resolve names outside
   * the context of an XML tree. It is sometimes useful to use qualified names
   * that do not depend on how a specific XML document is structured, this
   * method provides for such functionality.
   */
  getAbsoluteResolver(): NameResolver;

  /**
   * Make a decorator that this mode will use.
   */
  makeDecorator(): Decorator;

  /**
   * Modes must implement this method to specify what transformations they allow
   * based on state. The implementation should rely on the ``container`` and
   * ``offset`` position rather than use the caret because the editor may be
   * seeking information about possible actions near to the caret.
   *
   * @param transformationType The type or types of transformations to return.
   *
   * @param tag The tag name we are interested in.
   *
   * @param container The position in the data tree.
   *
   * @param offset The position in the data tree.
   *
   * @returns The actions.
   */
  getContextualActions(transformationType: string | string[],
                       tag: string,
                       container: Node,
                       offset: number): Action<{}>[];

  /**
   * Get additional stylesheets to use to render the HTML.
   *
   * @returns An array of paths to the stylesheets to
   * load for this mode.
   */
  getStylesheets(): string[];

  /**
   * Find the nodes that are children of ``element`` and that are just before
   * and just after the content of element that is editable.
   *
   * @param element This is the element to examine. **MUST BE PART OF THE GUI
   * TREE.**
   *
   * @returns An array of two elements. The first is the node before editable
   * contents, the second is the node after. Either node can be null if there is
   * nothing before or after editable contents. Both are null if there is
   * nothing around the editable content.
   */
  nodesAroundEditableContents(element: Element): [Node | null, Node | null];

  /**
   * This method can be overriden by modes to provide the editor with different
   * placeholders for different elements. The default implementation returns a
   * default placeholder for all elements.
   *
   * @param element This is the element for which to make a placeholder.
   *
   * @returns A placeholder for the element.
   */
  makePlaceholderFor(element: Element): Element;

  /**
   * Returns a short description for an element. The element should be named
   * according to the mappings reported by the resolve returned by
   * [[getAbsoluteResolver]].
   *
   * @param name The name of the element.
   *
   * @returns The description. If the value returned is ``undefined``, then
   * description is not available. If the value returned is ``null``, the
   * description has not been loaded yet.
   */
  shortDescriptionFor(name: string): string | null | undefined;

  /**
   * Returns a URL to the documentation for an element. The element should be
   * named according to the mappings reported by the resolve returned by
   * [[getAbsoluteResolver]]. The default implementation returns ``undefined``
   * for everything.
   *
   * @param name The name of the element.
   *
   * @returns The URL. If the value returned is ``undefined``, then the URL is
   * not available. If the value returned is ``null``, the URL has not been
   * loaded yet.
   */
  documentationLinkFor(name: string): string | null | undefined;

  /**
   * Allows the mode to perform mode-specific checks on the document. This
   * method will be called by wed to obtain a mode-specific validator to give to
   * wed's own validator. Mode-specific validators are meant to provide checks
   * that **cannot** be provided by a schema. It would be conceivable for
   * instance to call a schematron processor.
   *
   * @returns The validator if this mode has one.
   */
  getValidator(): ModeValidator | undefined;
}

/**
 * A mode for wed should be implemented as a module which exports a
 * class derived from this class.
 *
 *
 */
export abstract class BaseMode implements Mode {
  protected wedOptions: WedOptions = {
      label_levels: {
        max: 1,
        initial: 1,
      },
  };

  /**
   * @param editor The editor with which the mode is being associated.
   *
   * @param options The options for the mode. Each mode defines
   * what fields this object contains.
   */
  constructor(protected readonly editor: Editor,
              protected readonly options: ModeOptions = {}) {}

  /**
   * Gets the options that the mode wants wed to use with this mode.
   *
   * @returns The options. Callers are not allowed to modify the value returned.
   */
  getWedOptions(): WedOptions {
    return this.wedOptions;
  }

  /**
   * @returns The base implementation returns an empty array.
   */
  getStylesheets(): string[] {
    return [];
  }

  nodesAroundEditableContents(element: Element): [Node | null, Node | null] {
    let start = null;
    let startIx;
    let end = null;
    let endIx;

    let child = element.firstChild;
    let childIx = 0;
    while (child !== null) {
      if (isElement(child)) {
        if (child.classList.contains("_start_wrapper")) {
          startIx = childIx;
          start = child;
        }

        if (child.classList.contains("_end_wrapper")) {
          endIx = childIx;
          end = child;

          // We want the first end_wrapper we hit. There is no need to continue.
          break;
        }
      }

      child = child.nextSibling;
      childIx++;
    }

    if (startIx !== undefined && endIx !== undefined && endIx <= startIx) {
      throw new Error("end wrapper element unexpectedly appears before " +
                      "start wrapper element, or is also a start wrapper " +
                      "element");
    }

    return [start, end];
  }

  makePlaceholderFor(element: Element): Element {
    return domutil.makePlaceholder();
  }

  /**
   * While this API provides for the case where descriptions have not been
   * loaded yet or cannot be loaded, this class does not allow such eventuality
   * to occur. Derived classes could allow it.
   *
   * @returns This default implementation always returns ``undefined``.
   */
  shortDescriptionFor(name: string): string | null | undefined {
    return undefined;
  }

  /**
   * While this API provides for the case such URL have not been loaded
   * yet or cannot be loaded, this class does not allow such eventuality
   * to occur. Derived classes could allow it.
   *
   * @returns The default implementation always returns ``undefined``.
   */
  documentationLinkFor(name: string): string | null | undefined {
    return undefined;
  }

  /**
   * @returns ``undefined``. The default implementation has no mode-specific
   * checks and thus not return a validator.
   */
  getValidator(): ModeValidator | undefined {
    return undefined;
  }

  abstract init(): Promise<void>;
  abstract getAbsoluteResolver(): NameResolver;
  abstract makeDecorator(): Decorator;
  abstract getContextualActions(transformationType: string | string[],
                                tag: string,
                                container: Node,
                                offset: number): Action<{}>[];
}

//  LocalWords:  RequireJS stylesheets subarrays overriden html MPL
//  LocalWords:  Mangalam Dubeau domutil
