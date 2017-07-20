/// <reference types="bootstrap" />
/**
 * Tooltips for elements that appear in the editor pane.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import "bootstrap";
/**
 * Creates a tooltip for an element. This function must be used to create *all*
 * tooltips that are associated with elements that appear in a GUI tree. It is
 * not necessary to use this function for tooltips that are outside this tree.
 *
 * This function adds the ``wed-tooltip-for`` data to the tooltip created for
 * the ``$for`` element. This allows getting the DOM element for which a tooltip
 * was created from the DOM element corresponding to the tooltip itself.
 *
 * This function also adds the ``wed-has-tooltip`` class to the ``$for``
 * element. This allows knowing which elements from the GUI tree have tooltips.
 *
 * @param $for The element for which to create a tooltip.
 *
 * @param options The options to pass to Bootstrap to create the tooltip.
 */
export declare function tooltip($for: JQuery, options: TooltipOptions): void;
