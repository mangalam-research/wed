import { Action } from "../action";
import { TransformationData } from "../transformation";
import { ContextMenu as Base, DismissCallback } from "./context-menu";
export interface Item {
    action: Action<{}> | null;
    item: Element;
    data: TransformationData | null;
}
/**
 * A context menu for displaying actions. This class is designed to know how to
 * sort [["action".Action]] objects and [["transformation".Transformation]]
 * objects and how to filter them. Even though the names used here suggest that
 * ``Action`` objects are the focus of this class, the fact is that it is really
 * performing its work on ``Transformation`` objects. It does accept ``Action``
 * as a kind of lame ``Transformation``. So the following description will focus
 * on ``Transformation`` objects rather than ``Action`` objects.
 *
 * Sorting is performed first by the ``kind`` of the ``Transformation`` and then
 * by the text associated with the ``Transformation``. The kinds, in order, are:
 *
 * - other kinds than those listed below
 *
 * - undefined ``kind``
 *
 * - ``"add"``
 *
 * - ``"delete"``
 *
 * - ``"wrap"``
 *
 * - ``"unwrap"``
 *
 * The text associated with the transformation is the text value of the DOM
 * ``Element`` object stored in the ``item`` field of the object given in the
 * ``items`` array passed to the constructor. ``Actions`` are considered to have
 * an undefined ``kind``.
 *
 * Filtering is performed by ``kind`` and on the text of the **element name**
 * associated with a transformation. This class presents to the user a row of
 * buttons that represent graphically the possible filters. Clicking on a button
 * will reduce the list of displayed items only to those elements that
 * correspond to the ``kind`` to which the button corresponds.
 *
 * Typing text (e.g. "foo") will narrow the list of items to the text that the
 * user typed. Let's suppose that ``item`` is successively taking the values in
 * the ``items`` array. The filtering algorithm first checks whether there is an
 * ``item.data.name`` field. If there is, the match is performed against this
 * field. If not, the match is performed against the text of ``item.item``.
 *
 * If the text typed begins with a caret (^), the text will be interpreted as a
 * regular expression.
 *
 * Typing ESCAPE will reset filtering.
 *
 * When no option is focused, typing ENTER will select the first option of the
 * menu.
 */
export declare class ActionContextMenu extends Base {
    private readonly actionItems;
    private readonly actionFilterItem;
    private readonly actionFilterInput;
    private filters;
    private actionTextFilter;
    /**
     * @param document The DOM document for which to make this context menu.
     *
     * @param x Position of the menu. The context menu may ignore this position if
     * the menu would appear off-screen.
     *
     * @param y Position of the menu.
     *
     * @param items An array of action information in the form of anonymous
     * objects. It is valid to have some items in the array be of the form
     * ``{action: null, item: some_element, data: null}`` to insert arbitrary menu
     * items.
     *
     * @param dismissCallback Function to call when the menu is dismissed.
     */
    constructor(document: Document, x: number, y: number, items: Item[], dismissCallback?: DismissCallback);
    private makeKindGroup(document);
    private makeTypeGroup(document);
    private makeKindHandler(kind);
    private makeTypeHandler(actionType);
    handleToggleFocus(): void;
    private actionKeydownHandler(ev);
    private actionKeypressHandler(ev);
    private inputChangeHandler(ev);
    private inputKeydownHandler(ev);
    render(): void;
    private computeActionItemsToDisplay(items);
}
