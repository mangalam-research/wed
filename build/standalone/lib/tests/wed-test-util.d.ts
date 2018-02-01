/// <reference types="sinon" />
import * as sinon from "sinon";
import { Options } from "wed";
import { Editor } from "wed/editor";
export declare function activateContextMenu(editor: Editor, el: Element): void;
export declare function contextMenuHasOption(editor: Editor, pattern: RegExp, expectedCount?: number): void;
export declare function firstGUI(container: Element): Element | null;
export declare function lastGUI(container: Element): Element | null;
export declare function getElementNameFor(container: Element, last?: boolean): Element | undefined;
export declare function getAttributeValuesFor(container: Element): NodeListOf<Element>;
export declare function getAttributeNamesFor(container: Element): NodeListOf<Element>;
export declare function caretCheck(editor: Editor, container: Node, offset: number | null, msg: string): void;
export declare function dataCaretCheck(editor: Editor, container: Node, offset: number, msg: string): void;
export interface Payload {
    readonly command: string;
    readonly data: string;
    readonly version: string;
}
export declare class WedServer {
    private _saveRequests;
    private readonly oldUseFilters;
    private readonly oldFilters;
    private readonly xhr;
    emptyResponseOnSave: boolean;
    failOnSave: boolean;
    preconditionFailOnSave: boolean;
    tooOldOnSave: boolean;
    constructor(server: sinon.SinonFakeServer);
    readonly saveRequests: ReadonlyArray<Payload>;
    readonly lastSaveRequest: Payload;
    reset(): void;
    restore(): void;
    private decode(request);
    private handleSave(request);
}
export declare function makeWedRoot(doc: Document): HTMLElement;
export declare function errorCheck(): void;
export declare class EditorSetup {
    readonly source: string;
    private static provider;
    readonly sandbox: sinon.SinonSandbox;
    readonly server: WedServer;
    readonly wedroot: HTMLElement;
    readonly editor: Editor;
    constructor(source: string, options: Options, doc: Document);
    init(): Promise<Editor>;
    reset(): void;
    restore(): void;
}
