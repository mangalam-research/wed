/**
 * The icons used by the user interface.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
const ICON_NAMES: Record<string, string> = Object.create(null);

ICON_NAMES.add = "fa-plus";
ICON_NAMES.delete = "fa-times";
ICON_NAMES.wrap = "fa-caret-square-o-down";
ICON_NAMES.unwrap = "fa-caret-square-o-up";
ICON_NAMES.documentation = "fa-question-circle";
ICON_NAMES.transform = "fa-cog";
ICON_NAMES.any = "fa-asterisk";
ICON_NAMES.element = "fa-angle-left";
ICON_NAMES.attribute = "fa-at";
ICON_NAMES.other = "fa-circle-thin";
ICON_NAMES.exclamation = "fa-exclamation";
ICON_NAMES["arrow-up"] = "fa-arrow-up";
ICON_NAMES["arrow-down"] = "fa-arrow-down";
ICON_NAMES.upload = "fa-cloud-upload";
ICON_NAMES.undo = "fa-undo";
ICON_NAMES.redo = "fa-repeat";
ICON_NAMES.spanSelectionMode = "fa-i-cursor";
ICON_NAMES.unitSelectionMode = "fa-hand-o-up";

/**
 * Generates the HTML for an icon. The icon name can be any of:
 *
 * - ``"add"`` for actions that add content.
 *
 * - ``"delete"`` for actions that delete content.
 *
 * - ``"wrap"`` for actions that wrap content.
 *
 * - ``"unwrap"`` for actions that unwrap content.
 *
 * - ``"documentation"`` for actions that present documentation.
 *
 * - ``"any"`` for any action.
 *
 * @param name The name of the icon to create.
 * @returns The HTML for the icon.
 */
export function makeHTML(name: string): string {
  const cl = ICON_NAMES[name];
  if (cl === undefined) {
    throw new Error(`unknown icon name: ${name}`);
  }

  return `<i class="fa fa-fw ${cl}"></i>`;
}

//  LocalWords:  MPL fw
