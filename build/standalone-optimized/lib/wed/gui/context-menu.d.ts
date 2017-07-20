/**
 * Context menus.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import "bootstrap";
export declare type DismissCallback = () => void;
/**
 * A context menu GUI element.
 */
export declare class ContextMenu {
    private readonly dismissCallback;
    /**
     * The ``Element`` that contains the list of menu items. This ``Element`` is
     * an HTML list. It is created at construction of the object and deleted only
     * when the object is destroyed. This is what the [[ContextMenu.render]]
     * method should populate.
     */
    protected readonly menu: HTMLElement;
    /**
     * The jQuery equivalent of [[ContextMenu.menu]].
     */
    protected readonly $menu: JQuery;
    protected dismissed: boolean;
    protected dropdown: HTMLElement;
    protected backdrop: Element;
    private x;
    private y;
    /**
     * @param document The DOM document for which to make this
     * context menu.
     *
     * @param x Position of the menu. The context menu may ignore this position if
     * the menu would appear off-screen.
     *
     * @param y Position of the menu.
     *
     * @param items The items to show in the menu. These should be list items
     * containing links appropriately formatted for a menu.
     *
     * @param dismissCallback Function to call when the menu is dismissed.
     *
     * @param immediateDisplay If true, will call ``render`` from the constructor.
     */
    constructor(document: Document, x: number, y: number, items: Element[], dismissCallback?: DismissCallback, immediateDisplay?: boolean);
    protected display(items: Element[]): void;
    /**
     * Event handler for focus events on the toggle. Bootstrap focuses the toggle
     * when the dropdown is shown. This can cause problems on some platforms if
     * the dropdown is meant to have a descendant focused. (IE in particular
     * grants focus asynchronously.) This method can be used to focus the proper
     * element.
     */
    handleToggleFocus(): void;
    /**
     * Event handler for clicks on the contents. Dismissed the menu.
     */
    private contentsClickHandler(ev);
    /**
     * Event handler for clicks on the backdrop. Dismisses the menu.
     * @private
     */
    private backdropClickHandler();
    /**
     * Subclasses can override this to customize what is shown to the user. For
     * instance, subclasses could accept a list of items which is more complex
     * than DOM ``Element`` objects. Or could include in the list shown to the
     * user some additional GUI elements.
     *
     * @param items The list of items that should make up the menu.
     */
    protected render(items: Element[]): void;
    /**
     * Dismisses the menu.
     */
    dismiss(): void;
}
