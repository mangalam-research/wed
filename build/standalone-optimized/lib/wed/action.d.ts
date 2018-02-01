/**
 * Editing actions.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Button } from "./gui/button";
import { EditorAPI } from "./mode-api";
export interface EventWithData<Data> extends Event {
    data: Data;
}
/**
 * Actions model "things the user can do." These can be contextual menu items,
 * menu items, buttons, keybindings, etc. The base class is always enabled but
 * derived classes can set their own enabled state depending on whatever
 * conditions they choose.
 */
export declare abstract class Action<Data> {
    readonly editor: EditorAPI;
    protected readonly desc: string;
    protected readonly abbreviatedDesc: string | undefined;
    protected readonly icon: string;
    readonly needsInput: boolean;
    readonly boundHandler: (this: Action<Data>, ev: Event) => void;
    readonly boundTerminalHandler: (this: Action<Data>, ev: Event) => boolean;
    /**
     * @param editor The editor to which this action belongs.
     *
     * @param desc A simple string description of the action.
     *
     * @param abbreviatedDesc An abbreviated description, suitable to put into a
     * button, for instance.
     *
     * @param icon HTML code that represents an icon for this action. This can be
     * a simple string or something more complex.
     *
     * @param needsInput Indicates whether this action needs input from the
     * user. For instance, an action which brings up a modal dialog to ask
     * something of the user must have this parameter set to ``true``. It is
     * important to record whether an action needs input because, to take one
     * example, the ``autoinsert`` logic will try to insert automatically any
     * element it can. However, doing this for elements that need user input will
     * just confuse the user (or could cause a crash). Therefore, it is important
     * that the insertion operations for such elements be marked with
     * ``needsInput`` set to ``true`` so that the ``autoinsert`` logic backs off
     * from trying to insert these elements.
     */
    constructor(editor: EditorAPI, desc: string, abbreviatedDesc: string | undefined, icon?: string, needsInput?: boolean);
    /**
     * @param data Arbitrary data. What data must be passed is
     * determined by the action.
     */
    abstract execute(data: Data): void;
    /**
     * An event handler. By default just calls [[execute]]. You probably want to
     * use [[boundHandler]] rather than rebind this method. This handler always
     * returns ``undefined`` and calls ``preventDefault()`` on the event passed to
     * it.
     *
     * @param ev The DOM event.
     */
    eventHandler(ev: EventWithData<Data>): void;
    /**
     * An event handler. By default just calls [[eventHandler]]. You probably want
     * to use [[boundTerminalHandler]] rather than rebind this method.  This
     * handler always returns false and calls ``preventDefault()`` and
     * ``stopPropagation`` on the event passed to it.
     *
     * @param ev The DOM event.
     *
     * @returns False.
     */
    terminalEventHandler(ev: EventWithData<Data>): boolean;
    /**
     * Gets a description for this action.
     *
     * @returns A description for the action.
     */
    getDescription(): string;
    /**
     * Gets a description for this action, contextualized by the data passed.
     *
     * @param data The same data that would be passed to [[execute]].
     *
     * @returns The description.
     */
    getDescriptionFor(data: Data): string;
    /**
     * Gets the abbreviated description for this action.
     *
     * @returns The abbreviated description.
     */
    getAbbreviatedDescription(): string | undefined;
    /**
     * Gets the icon.
     *
     * @returns The icon. This is an HTML string.
     */
    getIcon(): string;
    /**
     * This method returns the icon together with the description for the
     * data passed as parameter.
     *
     * @param data The same data that would be passed to [[execute]].
     *
     * @returns The icon and the description, combined for presentation.
     */
    getLabelFor(data: Data): string;
    /**
     * Converts this action to a string. By default calls [[getDescription]].
     */
    toString(): string;
    makeButton(data?: Data): Button;
}
