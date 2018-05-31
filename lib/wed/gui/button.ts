import { Observable, Subject } from "rxjs";

export interface ButtonEvent {
  name: string;
  button: Button;
}

export interface ClickEvent extends ButtonEvent {
  name: "Click";
}

/**
 * A simple button that can be clicked.
 */
export class Button {
  /**
   * The current DOM element representing the button, if it has been rendered
   * already.
   */
  protected el: Element | undefined;

  /**
   * The object on which this class and subclasses may push new events.
   */
  protected readonly _events: Subject<ClickEvent> = new Subject();

  /**
   * The observable on which clients can listen for events.
   */
  readonly events: Observable<ClickEvent> = this._events.asObservable();

  /**
   * @param desc The full description of what the button does. This will be used
   * in the button's tooltip.
   *
   * @param abbreviatedDesc An abbreviated description. This may be used as text
   * inside the button.
   *
   * @param icon An optional icon for the button.
   *
   * @param extraClass Extra classes to add to ``className``.
   */
  constructor(readonly desc: string,
              readonly abbreviatedDesc: string | undefined,
              readonly icon: string = "",
              readonly extraClass: string = "") {}

  /** The class name that [[makeButton]] must use. */
  protected get buttonClassName(): string {
    let extraClass = this.extraClass;
    if (extraClass !== "") {
      extraClass = ` ${extraClass}`;
    }

    return `btn btn-default${extraClass}`;
  }

  /**
   * The text that goes inside a button. This is the abbreviated description, or
   * if unavailable, the long description.
   */
  protected get buttonText(): string {
    // If we don't have an abbreviation, we get the regular description.
    return this.abbreviatedDesc === undefined ?
      this.desc : this.abbreviatedDesc;
  }

  /**
   * Render the button.
   *
   * @param parent On first render, this parameter must contain the parent DOM
   * element of the button. On later renders, this parameter is ignored.
   *
   */
  render(parent?: Element | Document | DocumentFragment): void {
    let position: Node | null = null;
    if (this.el !== undefined) {
      position = this.el.nextSibling;
      parent = this.el.parentNode as Element;
      const $el = $(this.el);
      $el.remove();
      $el.tooltip("destroy");
    }

    if (parent == null) {
      throw new Error("called first render without a parent");
    }

    const button = this.makeButton(parent.ownerDocument);
    this.el = button;
    parent.insertBefore(button, position);
  }

  /**
   * Create a button, fill its contents, set its tooltip and add the event
   * handlers.
   *
   * @param doc The document in which we are creating the element.
   *
   * @returns The new button.
   */
  protected makeButton(doc: Document): Element {
    const button = doc.createElement("button");
    button.className = this.buttonClassName;
    const $button = $(button);
    this.setButtonContent(button);
    this.setButtonTooltip($button);
    this.setButtonEventHandlers($button);

    return button;
  }

  /**
   * Fill the content of the button.
   *
   * @param button The button to fill.
   */
  protected setButtonContent(button: Element): void {
    const icon = this.icon;
    if (icon !== "") {
      // tslint:disable-next-line:no-inner-html
      button.innerHTML = icon;
    }
    else {
      button.textContent = this.buttonText;
    }
  }

  /**
   * Make a tooltip for the button.
   *
   * @param $button The button for which to make a tooltip.
   */
  protected setButtonTooltip($button: JQuery): void {
    const desc = this.desc;
    if (this.icon !== "" || this.buttonText !== desc) {
      $button[0].setAttribute("title", desc);
      $button.tooltip({ title: desc,
                        container: "body",
                        placement: "auto",
                        trigger: "hover" });
    }
  }

  /**
   * Set event handlers on the button.
   */
  setButtonEventHandlers($button: JQuery): void {
    $button.click(() => {
      this._events.next({ name: "Click", button: this });
      return false;
    });

    // Prevents acquiring the focus.
    $button.mousedown(false);
  }
}

/**
 * A button that represents an on/off state.
 */
export class ToggleButton extends Button {
  protected _pressed: boolean;

  /**
   * @param initialyPressed Whether the button is initially pressed.
   *
   * @param desc See [[Button]].
   *
   * @param abbreviatedDesc See [[Button]].
   *
   * @param icon See [[Button]].
   *
   * @param extraClass See [[Button]].
   */
  constructor(initialyPressed: boolean,
              readonly desc: string,
              readonly abbreviatedDesc: string | undefined,
              readonly icon: string = "",
              readonly extraClass: string = "") {
    super(desc, abbreviatedDesc, icon, extraClass);
    this._pressed = initialyPressed;

    this.events.subscribe((event) => {
      if (event.name !== "Click" || this.el === undefined) {
        return;
      }

      this._pressed = !this._pressed;
      this.render();
    });
  }

  /**
   * Whether the button is in the pressed state.
   */
  get pressed(): boolean {
    return this._pressed;
  }

  set pressed(value: boolean) {
    if (this._pressed === value) {
      return;
    }

    this._pressed = value;
    if (this.el !== undefined) {
      this.render();
    }
  }

  protected get buttonClassName(): string {
    let extraClass = this.extraClass;
    if (extraClass !== "") {
      extraClass = ` ${extraClass}`;
    }

    return `btn btn-default${extraClass}${this._pressed ? " active" : ""}`;
  }
}
