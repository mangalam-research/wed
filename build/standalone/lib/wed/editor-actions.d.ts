/**
 * Actions that all editors support.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Observable, Subject } from "rxjs";
import { Action } from "./action";
import { Button } from "./gui/button";
import { EditorAPI } from "./mode-api";
export declare type ActionCtor = {
    new (editor: EditorAPI): Action<{}>;
};
export declare type Handler = (editor: EditorAPI) => void;
export declare function makeAction(desc: string, icon: string, needsInput: boolean, fn: Handler): ActionCtor;
export declare function makeAction(desc: string, icon: string, abbreviatedDesc: string, needsInput: boolean, fn: Handler): ActionCtor;
export declare const Save: ActionCtor;
export declare const Undo: ActionCtor;
export declare const Redo: ActionCtor;
export declare const DecreaseLabelVisibilityLevel: ActionCtor;
export declare const IncreaseLabelVisibilityLevel: ActionCtor;
export interface PressedEvent {
    name: "Pressed";
    action: ToggleAttributeHiding;
}
/**
 * An action that toggles the editors attribute hiding.
 */
export declare class ToggleAttributeHiding extends Action<boolean> {
    protected pressed: boolean;
    /**
     * The object on which this class and subclasses may push new events.
     */
    protected readonly _events: Subject<PressedEvent>;
    /**
     * The observable on which clients can listen for events.
     */
    readonly events: Observable<PressedEvent>;
    constructor(editor: EditorAPI);
    execute(data: boolean): void;
    makeButton(data?: boolean): Button;
}
