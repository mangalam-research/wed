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
export declare class Button {
    readonly desc: string;
    readonly abbreviatedDesc: string | undefined;
    readonly icon: string;
    readonly extraClass: string;
    /**
     * The current DOM element representing the button, if it has been rendered
     * already.
     */
    protected el: Element | undefined;
    /**
     * The object on which this class and subclasses may push new events.
     */
    protected readonly _events: Subject<ClickEvent>;
    /**
     * The observable on which clients can listen for events.
     */
    readonly events: Observable<ClickEvent>;
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
    constructor(desc: string, abbreviatedDesc: string | undefined, icon?: string, extraClass?: string);
    /** The class name that [[makeButton]] must use. */
    protected readonly buttonClassName: string;
    /**
     * The text that goes inside a button. This is the abbreviated description, or
     * if unavailable, the long description.
     */
    protected readonly buttonText: string;
    /**
     * Render the button.
     *
     * @param parent On first render, this parameter must contain the parent DOM
     * element of the button. On later renders, this parameter is ignored.
     *
     */
    render(parent?: Element | Document | DocumentFragment): void;
    /**
     * Create a button, fill its contents, set its tooltip and add the event
     * handlers.
     *
     * @param doc The document in which we are creating the element.
     *
     * @returns The new button.
     */
    protected makeButton(doc: Document): Element;
    /**
     * Fill the content of the button.
     *
     * @param button The button to fill.
     */
    protected setButtonContent(button: Element): void;
    /**
     * Make a tooltip for the button.
     *
     * @param $button The button for which to make a tooltip.
     */
    protected setButtonTooltip($button: JQuery): void;
    /**
     * Set event handlers on the button.
     */
    setButtonEventHandlers($button: JQuery): void;
}
/**
 * A button that represents an on/off state.
 */
export declare class ToggleButton extends Button {
    readonly desc: string;
    readonly abbreviatedDesc: string | undefined;
    readonly icon: string;
    readonly extraClass: string;
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
    constructor(initialyPressed: boolean, desc: string, abbreviatedDesc: string | undefined, icon?: string, extraClass?: string);
    /**
     * Whether the button is in the pressed state.
     */
    pressed: boolean;
    protected readonly buttonClassName: string;
}
