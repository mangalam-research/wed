/// <reference types="bluebird" />
/**
 * A mode for testing.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as Promise from "bluebird";
import { Action } from "wed/action";
import { Editor } from "wed/decorator";
import { GenericModeOptions, Mode as GenericMode } from "wed/modes/generic/generic";
import { GenericDecorator } from "wed/modes/generic/generic-decorator";
import { Template } from "wed/object-check";
import { ModeValidator } from "wed/validator";
export declare class TestDecorator extends GenericDecorator {
    private readonly elementLevel;
    addHandlers(): void;
    elementDecorator(root: Element, el: Element): void;
    private _navigationContextMenuHandler(wedEv, ev);
}
export interface TestModeOptions extends GenericModeOptions {
    ambiguous_fileDesc_insert: boolean;
    fileDesc_insert_needs_input: boolean;
    hide_attributes: boolean;
}
/**
 * This mode is purely designed to help test wed, and nothing
 * else. Don't derive anything from it and don't use it for editing.
 */
declare class TestMode extends GenericMode<TestModeOptions> {
    private typeaheadAction;
    private draggable;
    private resizable;
    private draggableResizable;
    private draggableAction;
    private resizableAction;
    private draggableResizableAction;
    readonly optionTemplate: Template;
    constructor(editor: Editor, options: TestModeOptions);
    init(): Promise<void>;
    getContextualActions(transformationType: string | string[], tag: string, container: Node, offset: number): Action<{}>[];
    makeDecorator(): TestDecorator;
    getAttributeCompletions(attr: Attr): string[];
    getValidator(): ModeValidator;
}
export { TestMode as Mode };
