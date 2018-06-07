/**
 * Support for a typeahead field that pops up in the editing pane.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import "bootstrap";
import $ from "jquery";
import "typeahead";

import * as domutil from "../domutil";
import * as keyConstants from "../key-constants";

export interface TypeaheadPopupOptions {
  /** Corresponds to the ``options`` parameter of Twitter Typeahead. */
  // tslint:disable-next-line:no-any
  options: any;
  /** Corresponds to the ``datasets`` parameter of Twitter Typeahead. */
  // tslint:disable-next-line:no-any
  datasets: any[];
}

/**
 * A typeahead popup GUI element.
 */
export class TypeaheadPopup {
  private readonly taWrapper: HTMLElement;
  // tslint:disable-next-line:no-any
  private readonly dismissCallback: (obj?: any) => void;
  private readonly backdrop: HTMLElement;
  private readonly $ta: JQuery;
  private dismissed: boolean = false;

  /**
   * @param doc The DOM document for which to make this popup.
   *
   * @param x Position of popup. The popup may ignore the position if it would
   * overflow off the screen or not have enough space to reasonably show the
   * choices for typing ahead.
   *
   * @param y Position of popup.
   *
   * @param width The desired width of the popup. This value may get overridden.
   *
   * @param  placeholder The placeholder text to use.
   *
   * @param options The options to pass to the underlying Twitter Typeahead
   * menu.
   *
   * @param dismissCallback Function to call when the popup is dismissed.
   */
  // tslint:disable-next-line:max-func-body-length
  constructor(doc: Document, x: number, y: number, width: number,
              placeholder: string, options: TypeaheadPopupOptions,
              // tslint:disable-next-line:no-any
              dismissCallback: (obj?: any) => void) {
    const taWrapper = domutil.htmlToElements(
      "<div class=\"wed-typeahead-popup\">\
<input class=\"typeahead form-control\" type=\"text\">\
<span class=\"spinner\"><i class=\"fa fa-spinner fa-spin\"></i></span></div>",
      doc)[0] as HTMLElement;
    const ta = taWrapper.firstElementChild as HTMLElement;
    ta.setAttribute("placeholder", placeholder);

    this.taWrapper = taWrapper;
    this.dismissCallback = dismissCallback;

    this.backdrop = document.createElement("div");
    this.backdrop.className = "wed-typeahead-popup-backdrop";

    $(this.backdrop).click(() => {
      this.dismiss();
      return false;
    });

    taWrapper.style.width = `${width}px`;
    taWrapper.style.left = `${x}px`;
    taWrapper.style.top = `${y}px`;

    const $ta = this.$ta = $(ta);

    let args = [options.options];
    if (options.datasets != null && options.datasets.length > 0) {
      args = args.concat(options.datasets);
    }
    $ta.typeahead.apply($ta, args);

    $ta.on("keydown", this._keydownHandler.bind(this));
    $ta.on("typeahead:selected", this._selectedHandler.bind(this));

    const body = doc.body;
    body.insertBefore(taWrapper, body.firstChild);
    body.insertBefore(this.backdrop, body.firstChild);

    // Verify if we're going to run off screen. If so, then modify our position
    // to be inside the screen.
    const actualWidth = taWrapper.offsetWidth;
    const winWidth = doc.defaultView.innerWidth;

    // The x value that would put the menu just against the side of the window
    // is actualWidth - winWidth. If x is less than it, then x is the value we
    // want, but we don't want less than 0.
    taWrapper.style.left = `${Math.max(0, Math.min(x, winWidth -
actualWidth))}px`;
    taWrapper.style.maxWidth = `${winWidth}px`;

    const winHeight = doc.defaultView.innerHeight;
    const maxHeight = winHeight - y;
    taWrapper.style.maxHeight = `${maxHeight}px`;

    const dropdown =
      taWrapper.getElementsByClassName("tt-menu")[0] as HTMLElement;
    const $dropdown = $(dropdown);

    // Yep, we forcibly display it here because the next computations depend on
    // the dropdown being visible.
    const oldDisplay = dropdown.style.display;
    dropdown.style.display = "block";

    // We arbitrarily want to show at least five lines of information. (Which
    // may or may not translate to 4 choices. This is not the goal. The goal is
    // just to show a reasonable amount of information.)
    const fiveLines = Number(
      $dropdown.css("line-height").replace("px", "")) * 5;

    const dropdownPos = dropdown.getBoundingClientRect();
    let dropdownMaxHeight = winHeight - dropdownPos.top;
    if (dropdownMaxHeight < fiveLines) {
      // Less than 5 lines: we need to move up.
      y -= fiveLines - dropdownMaxHeight;
      dropdownMaxHeight = fiveLines;
      taWrapper.style.top = `${y}px`;
    }

    dropdown.style.maxHeight = `${dropdownMaxHeight}px`;

    // Restore it. It was probably hidden.
    dropdown.style.display = oldDisplay;

    // Work around a stupid issue with typeahead. The problem is that
    // **hovering** over a choice makes it so that the choice is considered to
    // be the one to be selected when ENTER is pressed. This can lead to
    // inconsistent behavior from browser to browser. (It certainly messed up
    // testing.)
    $dropdown.off("mouseenter.tt", ".tt-suggestion");
    $dropdown.off("mouseleave.tt", ".tt-suggestion");

    // Prevent clicks from propagating up.
    $dropdown.on("click", false);
    ta.focus();

    // Typeahead will consider itself "activated" once it is focused. On most
    // platforms the focus above is delivered right away. However, on IE the
    // focus event is sent to elements asynchronously. Which means that the
    // typeahead could become "activated" much later than the end of this
    // constructor. For our purposes we want the typeahead to be activated right
    // away. So we unfortunately break through into private bits of the
    // typeahead code.
    const tt = $.data(ta, "ttTypeahead");
    tt.isActivated = true;

    // The default implementation closes the dropdown when the input is
    // unfocused. This is not a particularly good behavior for
    // wed. Unfortunately, the only way to rectify it is to break into the
    // private parts of typeahead.
    tt.input.off("blurred");
    tt._onBlurred = function _onBlurred(): void {
      this.isActivated = false;
    };
    tt.input.onSync("blurred", tt._onBlurred, tt);
  }

  /**
   * Dismisses the popup. Calls the callback that was passed when the popup was
   * created, if any.
   *
   * @param obj This should be the object selected by the user, if any. This
   * will be passed to the ``dismissCallback`` that was passed when the popup
   * was created, if any. If you call this method directly and want a selection
   * to occur, take care to use an object which is from the data set passed in
   * the ``options`` parameter that was used when the popup was created. The
   * value ``undefined`` means no object was selected.
   */
  // tslint:disable-next-line:no-any
  dismiss(obj?: any): void {
    if (this.dismissed) {
      return;
    }

    const taWrapper = this.taWrapper;
    if (taWrapper !== undefined && taWrapper.parentNode !== null) {
      taWrapper.parentNode.removeChild(taWrapper);
    }

    const backdrop = this.backdrop;
    if (backdrop !== undefined && backdrop.parentNode !== null) {
      backdrop.parentNode.removeChild(backdrop);
    }

    if (this.dismissCallback !== undefined) {
      this.dismissCallback(obj);
    }
    this.dismissed = true;
  }

  /**
   * Event handler for keydown events on the popup. The default implementation
   * is to dismiss the popup if escape is pressed.
   */
  private _keydownHandler(ev: JQueryEventObject): boolean | undefined {
    if (keyConstants.ESCAPE.matchesEvent(ev)) {
      this.dismiss();
      return false;
    }

    return undefined;
  }

  /**
   * Event handler for typeahead:selected events. The default implementation is
   * to dismiss the popup.
   */
  // tslint:disable-next-line:no-any
  private _selectedHandler(_ev: JQueryEventObject, obj: any): void {
    this.dismiss(obj);
  }

  /**
   * Hide the spinner that was created to indicate that the data is being
   * loaded.
   */
  hideSpinner(): void {
    (this.taWrapper.getElementsByClassName("spinner")[0] as HTMLElement)
      .style.display = "none";
  }

  /**
   * Set the value in the input field of the typeahead. This also updates the
   * suggestions.
   *
   * @param value The new value.
   */
  setValue(value: string): void {
    // tslint:disable-next-line:no-any
    (this.$ta as any).typeahead("val", value);
  }
}

//  LocalWords:  typeahead MPL px keydown actualWidth winWidth tt dropdown
//  LocalWords:  dropdownMaxHeight mouseenter mouseleave ttTypeahead
