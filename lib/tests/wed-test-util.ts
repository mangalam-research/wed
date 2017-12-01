/**
 * Utilities that require a DOM to run.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

// tslint:disable-next-line:import-name no-require-imports
import md5 = require("blueimp-md5");
import { expect } from "chai";
// tslint:disable-next-line: no-require-imports
import qs = require("qs");
import * as sinon from "sinon";

import { domutil, makeEditor, Options } from "wed";
import { Editor } from "wed/editor";
import * as onerror from "wed/onerror";

const { childByClass, childrenByClass } = domutil;

import { DataProvider } from "./util";

export function activateContextMenu(editor: Editor, el: Element): void {
  // tslint:disable-next-line:no-any
  function computeValues(): any {
    el.scrollIntoView();
    const rect = el.getBoundingClientRect();
    const left = rect.left + (rect.width / 2);
    const top = rect.top + (rect.height / 2);
    const scrollTop = editor.window.document.body.scrollTop;
    const scrollLeft = editor.window.document.body.scrollLeft;
    return {
      which: 3,
      pageX: left + scrollLeft,
      pageY: top + scrollTop,
      clientX: left,
      clientY: top,
      target: el,
    };
  }

  editor.$guiRoot.trigger(new $.Event("mousedown", computeValues()));
  editor.$guiRoot.trigger(new $.Event("mouseup", computeValues()));
}

export function contextMenuHasOption(editor: Editor, pattern: RegExp,
                                     expectedCount?: number): void {
  const menu =
    editor.window.document.getElementsByClassName("wed-context-menu")[0];
  expect(menu, "the menu should exist").to.not.be.undefined;
  const items = menu.querySelectorAll("li>a");
  let found = 0;
  for (let i = 0; i < items.length; ++i) {
    const item = items[i];
    if (pattern.test(item.textContent!.trim())) {
      found++;
    }

    if (expectedCount === undefined && found > 0) {
      break;
    }
  }

  if (expectedCount === undefined) {
    expect(found).to.be.greaterThan(0);
  }
  else {
    expect(found).to.equal(expectedCount,
                           "should have seen the option a number of times \
equal to the expected count");
  }
}

export function firstGUI(container: Element): Element | null {
  return childByClass(container, "_gui");
}

export function lastGUI(container: Element): Element | null {
  const children = childrenByClass(container, "_gui");
  const last = children[children.length - 1];
  return last !== undefined ? last : null;
}

export function getElementNameFor(container: Element,
                                  last: boolean = false): Element | undefined {
  const gui = last ? lastGUI(container) : firstGUI(container);

  return gui!.getElementsByClassName("_element_name")[0];
}

export function getAttributeValuesFor(container: Element): NodeListOf<Element> {
  return firstGUI(container)!.getElementsByClassName("_attribute_value");
}

export function getAttributeNamesFor(container: Element): NodeListOf<Element> {
  return firstGUI(container)!.getElementsByClassName("_attribute_name");
}

export function caretCheck(editor: Editor, container: Node,
                           offset: number | null, msg: string): void {
  const caret = editor.caretManager.caret!;
  expect(caret, "there should be a caret").to.not.be.undefined;
  if (offset !== null) {
    expect(caret.toArray(), msg).to.deep.equal([container, offset]);
  }
  else {
    // A null offset means we are not interested in the specific offset.  We
    // just want to know that the caret is *inside* container either directly or
    // indirectly.
    expect(container.contains(caret.node), msg).to.be.true;
  }
}

export function dataCaretCheck(editor: Editor, container: Node,
                               offset: number, msg: string): void {
  const dataCaret = editor.caretManager.getDataCaret()!;
  expect(dataCaret.toArray(), msg).to.deep.equal([container, offset]);
}

export interface Payload {
  readonly command: string;
  readonly data: string;
  readonly version: string;
}

// tslint:disable-next-line:completed-docs
export class WedServer {
  private _saveRequests: Payload[] = [];
  private readonly oldUseFilters: boolean;
    // tslint:disable-next-line:no-any
  private readonly oldFilters: any[];
  private readonly xhr: sinon.SinonFakeXMLHttpRequest;

  emptyResponseOnSave: boolean = false;
  failOnSave: boolean = false;
  preconditionFailOnSave: boolean = false;
  tooOldOnSave: boolean = false;

  constructor(server: sinon.SinonFakeServer) {
    // tslint:disable-next-line:no-any
    const xhr = (server as any).xhr as sinon.SinonFakeXMLHttpRequest;
    this.xhr = xhr;

    // We must save and restore the filter state ourselves because Sinon does
    // not do it. Fake servers don't restore it, nor do sandboxes.
    this.oldUseFilters = xhr.useFilters;
    // tslint:disable-next-line:no-any
    this.oldFilters = (xhr as any).filters;

    xhr.useFilters = true;
    xhr.addFilter((method: string, url: string): boolean =>
                  !/^\/build\/ajax\//.test(url));
    server.respondImmediately = true;
    server.respondWith("POST", /^\/build\/ajax\/save\.txt$/,
                       this.handleSave.bind(this));
    server.respondWith("POST", "/build/ajax/log.txt",
                       [200, { "Content-Type": "application/json" }, "{}"]);
  }

  get saveRequests(): ReadonlyArray<Payload> {
    return this._saveRequests;
  }

  get lastSaveRequest(): Payload {
    const reqs = this.saveRequests;
    return reqs[reqs.length - 1];
  }

  reset(): void {
    this._saveRequests = [];
    this.emptyResponseOnSave = false;
    this.failOnSave = false;
    this.preconditionFailOnSave = false;
    this.tooOldOnSave = false;
  }

  restore(): void {
    const xhr = this.xhr;
    xhr.useFilters = this.oldUseFilters;
    // tslint:disable-next-line:no-any
    (xhr as any).filters = this.oldFilters;
  }

  private decode(request: sinon.SinonFakeXMLHttpRequest): Payload {
    const contentType = request.requestHeaders["Content-Type"];
    const { requestBody } = request;
    switch (contentType) {
    case "application/x-www-form-urlencoded;charset=utf-8":
      return qs.parse(requestBody);
    case "json":
      return JSON.parse(requestBody);
    default:
      throw new Error(`unknown content type: ${contentType}`);
    }
  }

  private handleSave(request: sinon.SinonFakeXMLHttpRequest): void {
    const decoded = this.decode(request);
    this._saveRequests.push(decoded);
    let status = 200;
    const headers: Record<string, string> =
      { "Content-Type": "application/json" };
    // tslint:disable-next-line:no-reserved-keywords
    const messages: { type: string }[] = [];

    function populateSaveResponse(): void {
      headers.ETag = btoa(md5(decoded.data, undefined, true));
      messages.push({ type: "save_successful" });
    }

    switch (decoded.command) {
    case "check":
      break;
    case "save":
    case "autosave":
      if (!this.emptyResponseOnSave) {
        if (this.tooOldOnSave) {
          messages.push({ type: "version_too_old_error" });
        }

        if (this.preconditionFailOnSave) {
          status = 412;
        }
        else if (this.failOnSave) {
          status = 400;
        }
        else {
          populateSaveResponse();
        }
      }
      break;
    case "recover":
      populateSaveResponse();
      break;
    default:
      status = 400;
    }

    request.respond(status, headers, JSON.stringify({ messages }));
  }
}

export function makeWedRoot(doc: Document): HTMLElement {
  const wedroot = document.createElement("div");
  wedroot.className = "wed-widget container";
  return wedroot;
}

export function errorCheck(): void {
  // We read the state, reset, and do the assertion later so that if the
  // assertion fails, we still have our reset.
  const wasTerminating = onerror.is_terminating();

  // We don't reload our page so we need to do this.
  onerror.__test.reset();
  expect(wasTerminating)
    .to.equal(false, "test caused an unhandled exception to occur");
}

// tslint:disable-next-line:completed-docs
export class EditorSetup {
  private static provider: DataProvider = new DataProvider("");

  public readonly sandbox: sinon.SinonSandbox;
  public readonly server: WedServer;
  public readonly wedroot: HTMLElement;
  public readonly editor: Editor;

  constructor(public readonly source: string,
              options: Options, doc: Document) {
    this.sandbox = sinon.sandbox.create({
      useFakeServer: true,
    });

    this.server = new WedServer(this.sandbox.server);

    this.wedroot = makeWedRoot(document);
    doc.body.appendChild(this.wedroot);
    this.editor = makeEditor(this.wedroot, options) as Editor;
  }

  async init(): Promise<Editor> {
    const provider = (this.constructor as typeof EditorSetup).provider;
    const data = await provider.getText(this.source);
    return this.editor.init(data);
  }

  reset(): void {
    const editor = this.editor;
    editor.undoAll();
    editor.resetLabelVisibilityLevel();
    editor.editingMenuManager.dismiss();
    editor.caretManager.clearSelection(); // Yes, clear the caret.
    this.server.reset();
    errorCheck();
  }

  restore(): void {
    if (this.editor !== undefined) {
      this.editor.destroy();
    }

    this.server.restore();

    errorCheck();

    if (this.wedroot !== undefined) {
      document.body.removeChild(this.wedroot);
    }

    if (this.sandbox !== undefined) {
      this.sandbox.restore();
    }

    // Immediately destroy all notifications to prevent interfering with other
    // tests. ($.notifyClose is not drastic enough.)
    $("[data-notify=container]").remove();
  }
}
