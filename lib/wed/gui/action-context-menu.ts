/**
 * Context menus meant to hold actions.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import $ from "jquery";

import { Action } from "../action";
import * as browsers from "../browsers";
import * as keyMod from "../key";
import * as keyConstants from "../key-constants";
import { Transformation, TransformationData } from "../transformation";
import { ContextMenu as Base, DismissCallback } from "./context-menu";
import * as icon from "./icon";

const KINDS = ["transform", "add", "delete", "wrap", "unwrap"];
// ``undefined`` is "other kinds".
const KIND_FILTERS = (KINDS as (string | undefined)[]).concat(undefined);
// Sort order.
const KIND_ORDER = ([undefined] as (string | undefined)[]).concat(KINDS);

const TYPES = ["element", "attribute"];
const TYPE_FILTERS = (TYPES as (string | undefined)[]).concat(undefined);

const ITEM_SELECTOR = "li:not(.divider):visible a";

const plus = keyMod.makeKey("+");
const minus = keyMod.makeKey("-");
const period = keyMod.makeKey(".");
const comma = keyMod.makeKey(",");
const question = keyMod.makeKey("?");
const less = keyMod.makeKey("<");
const at = keyMod.makeKey("@");
const exclamation = keyMod.makeKey("!");

const KEY_TO_FILTER: {
  key: keyMod.Key;
  filter: "add" | "delete" | "wrap" | "unwrap" | "element" | "attribute" |
    undefined;
  which: "kind" | "type";
}[] = [
  { key: plus, filter: "add", which: "kind" },
  { key: minus, filter: "delete", which: "kind" },
  { key: comma, filter: "wrap", which: "kind" },
  { key: period, filter: "unwrap", which: "kind" },
  { key: question, filter: undefined, which: "kind" },
  { key: less, filter: "element", which: "type" },
  { key: at, filter: "attribute", which: "type" },
  { key: exclamation, filter: undefined, which: "type" },
];

export interface Item {
  action: Action<{}> | null;
  item: Element;
  data: TransformationData | null;
}

function compareItems(a: Item, b: Item): number {
  const aKind = (a.action !== null && (a.action instanceof Transformation)) ?
    a.action.kind : undefined;
  const bKind = (b.action !== null && (b.action instanceof Transformation)) ?
    b.action.kind : undefined;

  if (aKind !== bKind) {
    const aOrder = KIND_ORDER.indexOf(aKind);
    const bOrder = KIND_ORDER.indexOf(bKind);

    return aOrder - bOrder;
  }

  const aText = a.item.textContent!;
  const bText = b.item.textContent!;
  if (aText === bText) {
    return 0;
  }

  if (aText < bText) {
    return -1;
  }

  return 1;
}

interface Filters {
  kind: string | undefined | null;
  // tslint:disable-next-line:no-reserved-keywords
  type: string | undefined | null;
}

/**
 * A context menu for displaying actions. This class is designed to know how to
 * sort [["wed/action".Action]] objects and
 * [["wed/transformation".Transformation]] objects and how to filter them. Even
 * though the names used here suggest that ``Action`` objects are the focus of
 * this class, the fact is that it is really performing its work on
 * ``Transformation`` objects. It does accept ``Action`` as a kind of lame
 * ``Transformation``. So the following description will focus on
 * ``Transformation`` objects rather than ``Action`` objects.
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
export class ActionContextMenu extends Base {
  private readonly actionItems: Item[];
  private readonly actionFilterItem: Element;
  private readonly actionFilterInput: HTMLInputElement;

  private filters: Filters = {
    kind: null,
    type: null,
  };

  private actionTextFilter: string = "";

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
  constructor(document: Document, x: number, y: number, items: Item[],
              dismissCallback?: DismissCallback) {
    super(document, x, y, [], dismissCallback, false);

    // Sort the items once and for all.
    items.sort(compareItems);

    this.actionItems = items;

    // Create the filtering GUI...

    // <li><div><button>... allows us to have this button group inserted in the
    // menu and yet be ignored by Bootstrap's Dropdown class.
    const li = document.createElement("li");
    li.className = "wed-menu-filter";
    li.style.whiteSpace = "nowrap";
    const groupGroup = document.createElement("div");
    const kindGroup = this.makeKindGroup(document);
    const typeGroup = this.makeTypeGroup(document);

    // Prevent clicks in the group from closing the context menu.
    $(li).on("click", false);
    li.appendChild(groupGroup);
    groupGroup.appendChild(kindGroup);
    groupGroup.appendChild(document.createTextNode("\u00a0"));
    groupGroup.appendChild(typeGroup);

    const textInput = document.createElement("input");
    textInput.className = "form-control input-sm";
    textInput.setAttribute("placeholder", "Filter choices by text.");
    const textDiv = document.createElement("div");
    textDiv.appendChild(textInput);
    li.appendChild(textDiv);

    const $textInput = $(textInput);
    $textInput.on("input", this.inputChangeHandler.bind(this));
    $textInput.on("keydown", this.inputKeydownHandler.bind(this));
    this.actionFilterItem = li;
    this.actionFilterInput = textInput;

    const $menu = this.$menu;
    $menu.parent().on("hidden.bs.dropdown",
                      () => {
                        // Manually destroy the tooltips so that they are not
                        // left behind.
                        $(textInput).tooltip("destroy");
                        $(kindGroup).children().tooltip("destroy");
                      });
    $menu.on("keydown", this.actionKeydownHandler.bind(this));
    $menu.on("keypress", this.actionKeypressHandler.bind(this));
    this.display([]);
    textInput.focus();
  }

  private makeKindGroup(document: Document): Element {
    const kindGroup = document.createElement("div");
    kindGroup.className = "btn-group btn-group-xs";
    for (const kind of KIND_FILTERS) {
      const child = document.createElement("button");
      child.className = "btn btn-default";
      let title;
      if (kind !== undefined) {
        // tslint:disable-next-line:no-inner-html
        child.innerHTML = icon.makeHTML(kind);
        title = `Show only ${kind} operations.`;
      }
      else {
        // tslint:disable-next-line:no-inner-html
        child.innerHTML = icon.makeHTML("other");
        title = "Show operations not covered by other filter buttons.";
      }
      $(child).tooltip({
        title: title,
        // If we don't set it to be on the body, then the tooltip will be
        // clipped by the dropdown. However, we then run into the problem that
        // when the dropdown menu is removed, the tooltip may remain displayed.
        container: "body",
        placement: "auto top",
        trigger: "hover",
      });
      $(child).on("click", this.makeKindHandler(kind));
      kindGroup.appendChild(child);
    }

    return kindGroup;
  }

  private makeTypeGroup(document: Document): Element {
    const typeGroup = document.createElement("div");
    typeGroup.className = "btn-group btn-group-xs";
    for (const actionType of TYPE_FILTERS) {
      const child = document.createElement("button");
      child.className = "btn btn-default";
      let title;
      if (actionType !== undefined) {
        // tslint:disable-next-line:no-inner-html
        child.innerHTML = icon.makeHTML(actionType);
        title = `Show only ${actionType} operations.`;
      }
      else {
        // tslint:disable-next-line:no-inner-html
        child.innerHTML = icon.makeHTML("other");
        title = "Show operations not covered by other filter buttons.";
      }
      $(child).tooltip({
        title: title,
        // If we don't set it to be on the body, then the tooltip will be
        // clipped by the dropdown. However, we then run into the problem that
        // when the dropdown menu is removed, the tooltip may remain displayed.
        container: "body",
        placement: "auto top",
        trigger: "hover",
      });
      $(child).on("click", this.makeTypeHandler(actionType));
      typeGroup.appendChild(child);
    }

    return typeGroup;
  }

  private makeKindHandler(kind: string | undefined): () => void {
    return () => {
      this.filters.kind = kind;
      this.render();
    };
  }

  private makeTypeHandler(actionType: string | undefined): () => void {
    return () => {
      this.filters.type = actionType;
      this.render();
    };
  }

  handleToggleFocus(): void {
    this.actionFilterInput.focus();
  }

  private actionKeydownHandler(ev: JQueryKeyEventObject): boolean {
    if (keyConstants.ESCAPE.matchesEvent(ev) &&
        (this.filters.kind !== null ||
         this.filters.type !== null ||
         this.actionTextFilter !== "")) {
      this.filters.kind = null;
      this.filters.type = null;
      this.actionTextFilter = "";
      // For some reason, on FF 24, stopping propagation and
      // preventing the default is not enough.
      if (!browsers.FIREFOX_24) {
        this.actionFilterInput.value = "";
        this.render();
      }
      else {
        setTimeout(() => {
          this.actionFilterInput.value = "";
          this.render();
        },
                   0);
      }
      ev.stopPropagation();
      ev.preventDefault();
      return false;
    }
    return true;
  }

  private actionKeypressHandler(ev: JQueryKeyEventObject): boolean {
    // If the user has started filtering on text, we don't interpret
    // the key as setting a kind or type filter.
    if (this.actionTextFilter !== "") {
      return true;
    }

    for (const spec of KEY_TO_FILTER) {
      const key = spec.key;
      if (key.matchesEvent(ev)) {
        const whichFilter = spec.which;
        // Don't treat the key specially if the filter is already set.
        if (this.filters[whichFilter] !== null) {
          continue;
        }
        this.filters[whichFilter] = spec.filter;
        this.render();
        ev.stopPropagation();
        ev.preventDefault();
        return false;
      }
    }

    return true;
  }

  private inputChangeHandler(ev: KeyboardEvent): void {
    const previous = this.actionTextFilter;
    const newval = (ev.target as HTMLInputElement).value;
    // IE11 generates input events when focus is lost/gained. These
    // events do not change anything to the contents of the field so
    // we protect against unnecessary renders a bit of logic here.
    if (previous !== newval) {
      this.actionTextFilter = newval;
      this.render();
    }
  }

  private inputKeydownHandler(ev: KeyboardEvent): boolean {
    if (keyConstants.ENTER.matchesEvent(ev)) {
      this.$menu.find(ITEM_SELECTOR).first().focus().click();
      ev.stopPropagation();
      ev.preventDefault();
      return false;
    }

    // Bootstrap 3.3.2 (and probably some versions before this one) introduces a
    // change that prevents these events from being processed by the dropdown
    // menu. We have to manually forward them. See bug report:
    //
    // https://github.com/twbs/bootstrap/issues/15757
    //
    let matches;
    for (const check of ["UP_ARROW", "DOWN_ARROW", "ESCAPE"]) {
      // tslint:disable-next-line:no-any
      const key = (keyConstants as any)[check] as keyMod.Key;
      if (key.matchesEvent(ev)) {
        matches = key;
        break;
      }
    }

    if (matches !== undefined) {
      const fakeEv = new $.Event("keydown");
      matches.setEventToMatch(fakeEv);
      // We have to pass the event to ``actionKeypressHandler`` so that it can
      // act in the same way as if the event had been directly on the menu. If
      // ``actionKeypressHandler`` does not handle it, then pass it on to the
      // toggle. We forward to the toggle because that's how Bootstrap normally
      // works.
      if (this.actionKeydownHandler(fakeEv) !== false) {
        this.$toggle.trigger(fakeEv);
      }
      // We have to return `false` to make sure it is not mishandled.
      return false;
    }

    return true;
  }

  render(): void {
    const menu = this.menu;
    const actionFilterItem = this.actionFilterItem;
    const actionKindFilter = this.filters.kind;
    const actionTypeFilter = this.filters.type;
    // On IE 10, we don't want to remove and then add back this.actionFilterItem
    // on each render because that makes this.actionFilterInput lose the
    // focus. Yes, even with the call at the end of _render, IE 10 inexplicably
    // makes the field lose focus **later**.
    while (menu.lastChild !== null && menu.lastChild !== actionFilterItem) {
      menu.removeChild(menu.lastChild);
    }

    let child = actionFilterItem
          .firstElementChild!.firstElementChild!.firstElementChild!;
    for (const kind of KIND_FILTERS) {
      const cl = child.classList;
      const method = (actionKindFilter === kind) ? cl.add : cl.remove;
      method.call(cl, "active");
      child = child.nextElementSibling!;
    }

    child = actionFilterItem
      .firstElementChild!.lastElementChild!.firstElementChild!;
    for (const actionType of TYPE_FILTERS) {
      const cl = child.classList;
      const method = (actionTypeFilter === actionType) ? cl.add : cl.remove;
      method.call(cl, "active");
      child = child.nextElementSibling!;
    }

    if (actionFilterItem.parentNode === null) {
      menu.appendChild(actionFilterItem);
    }
    const items = this.computeActionItemsToDisplay(this.actionItems);
    super.render(items);
  }

  private computeActionItemsToDisplay(items: Item[]): Element[] {
    const kindFilter = this.filters.kind;
    const typeFilter = this.filters.type;
    const textFilter = this.actionTextFilter;

    let kindMatch;
    switch (kindFilter) {
    case null:
      kindMatch = () => true;
      break;
    case undefined:
      kindMatch = (item: Item) => !(item.action instanceof Transformation) ||
        KINDS.indexOf(item.action.kind) === -1;
      break;
    default:
      kindMatch = (item: Item) => (item.action instanceof Transformation) &&
        item.action.kind === kindFilter;
    }

    let typeMatch;
    switch (typeFilter) {
    case null:
      typeMatch = () => true;
      break;
    case undefined:
      typeMatch = (item: Item) => !(item.action instanceof Transformation) ||
        TYPES.indexOf(item.action.nodeType) === -1;
      break;
    default:
      typeMatch = (item: Item) => (item.action instanceof Transformation) &&
        item.action.nodeType === typeFilter;
    }

    let textMatch;
    if (textFilter !== "") {
      if (textFilter[0] === "^") {
        const textFilterRe = RegExp(textFilter);
        textMatch = (item: Item) => {
          const text = (item.data !== null && item.data.name !== undefined) ?
            item.data.name : item.item.textContent!;
          return textFilterRe.test(text);
        };
      }
      else {
          textMatch = (item: Item) => {
            const text = (item.data !== null && item.data.name !== undefined) ?
              item.data.name : item.item.textContent!;
            return text.indexOf(textFilter) !== -1;
          };
      }
    }
    else {
      textMatch = () => true;
    }

    const ret = [];
    for (const item of items) {
      if (kindMatch(item) && typeMatch(item) && textMatch(item)) {
        ret.push(item.item);
      }
    }

    return ret;
  }
}

//  LocalWords:  MPL li Dropdown nowrap sm keydown tooltips keypress btn xs
//  LocalWords:  tooltip dropdown actionType actionFilterItem actionFilterInput
//  LocalWords:  actionKeypressHandler
