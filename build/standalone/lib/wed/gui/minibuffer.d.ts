/// <reference types="jquery" />
import { Observable, Subject } from "rxjs";
export interface ChangeEvent {
    name: "ChangeEvent";
    value: string;
}
export declare type KeydownHandler = (ev: JQueryKeyEventObject) => boolean | undefined;
export interface MinibufferClient {
    onUninstall(): void;
    onMinibufferKeydown: KeydownHandler;
    onMinibufferChange(ev: ChangeEvent): void;
}
/**
 * A minibuffer is a kind of single line prompt that allows the user to enter
 * data. As the name suggests, this is inspired from Emacs.
 */
export declare class Minibuffer {
    private readonly $top;
    private readonly input;
    private readonly $input;
    private previous;
    private client;
    private clientSubscription;
    private _enabled;
    /**
     * The keydown handler that may optionally be set to handle keys with
     * modifiers.
     */
    private keydownHandler;
    /** The element that holds the prompt. */
    private promptEl;
    /**
     * The object on which this class and subclasses may push new events.
     */
    protected readonly _events: Subject<ChangeEvent>;
    /**
     * The observable on which clients can listen for events.
     */
    protected readonly events: Observable<ChangeEvent>;
    readonly enabled: boolean;
    constructor(top: HTMLElement);
    protected enable(): void;
    protected disable(): void;
    installClient(client: MinibufferClient): void;
    uninstallClient(): void;
    prompt: string;
    forwardEvent(ev: JQueryEventObject): void;
    private onKeydown(ev);
    protected onKeypress(ev: JQueryKeyEventObject): void;
    protected onInput(ev: JQueryKeyEventObject): void;
}
