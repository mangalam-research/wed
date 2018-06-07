/**
 * Minibuffer for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import $ from "jquery";
import { Observable, Subject, Subscription } from "rxjs";

import { ESCAPE } from "../key-constants";

export interface ChangeEvent {
  name: "ChangeEvent";
  value: string;
}

export type KeydownHandler = (ev: JQueryKeyEventObject) => boolean | undefined;

export interface MinibufferClient {
  onUninstall(): void;
  onMinibufferKeydown: KeydownHandler;
  onMinibufferChange(ev: ChangeEvent): void;
}

/**
 * A minibuffer is a kind of single line prompt that allows the user to enter
 * data. As the name suggests, this is inspired from Emacs.
 */
export class Minibuffer {
  private readonly $top: JQuery;
  private readonly input: HTMLInputElement;
  private readonly $input: JQuery;
  private previous: string | undefined;
  private client: MinibufferClient | undefined;
  private clientSubscription: Subscription | undefined;
  private _enabled: boolean = false;

  /**
   * The keydown handler that may optionally be set to handle keys with
   * modifiers.
   */
  private keydownHandler: KeydownHandler | undefined;

  /** The element that holds the prompt. */
  private promptEl: HTMLElement;

  /**
   * The object on which this class and subclasses may push new events.
   */
  protected readonly _events: Subject<ChangeEvent> = new Subject();

  /**
   * The observable on which clients can listen for events.
   */
  protected readonly events: Observable<ChangeEvent> =
    this._events.asObservable();

  get enabled(): boolean {
    return this._enabled;
  }

  constructor(top: HTMLElement) {
    this.$top = $(top);
    this.$top.append("\
<label></label>&nbsp;<input type='text'>");

    this.promptEl = top.getElementsByTagName("label")[0];
    this.input = top.getElementsByTagName("input")[0];

    const $input = this.$input = $(this.input);
    $input.on("input", this.onInput.bind(this));
    $input.on("keypress", this.onKeypress.bind(this));
    $input.on("keydown", this.onKeydown.bind(this));
    this.disable();
  }

  protected enable(): void {
    this._enabled = true;
    this.input.disabled = false;
    this.input.style.display = "";
    this.input.focus();
  }

  protected disable(): void {
    this._enabled = false;
    this.input.disabled = true;
    this.input.value = "";
    this.input.style.display = "none";
  }

  installClient(client: MinibufferClient): void {
    this.client = client;
    this.keydownHandler = client.onMinibufferKeydown.bind(client);
    this.clientSubscription =
      this.events.subscribe(client.onMinibufferChange.bind(client));
    this.enable();
  }

  uninstallClient(): void {
    const client = this.client;
    if (client === undefined) {
      return;
    }

    this.client = undefined;
    this.keydownHandler = undefined;
    this.clientSubscription!.unsubscribe();
    this.disable();
    this.prompt = "";
    this.previous = undefined;
    client.onUninstall();
  }

  get prompt(): string {
    return this.promptEl.textContent!;
  }

  set prompt(value: string) {
    this.promptEl.textContent = value;
  }

  public forwardEvent(ev: JQueryEventObject): void {
    // For keypress events, we have to fill the input ourselves.
    if (ev.type === "keypress") {
      this.input.value += String.fromCharCode(ev.which);
    }

    this.$input.trigger(ev);
  }

  private onKeydown(ev: JQueryKeyEventObject): undefined | boolean {
    if (ESCAPE.matchesEvent(ev)) {
      this.uninstallClient();
      return false;
    }

    if (this.keydownHandler != null && this.keydownHandler(ev) === false) {
      return false;
    }

    return undefined;
  }

  protected onKeypress(_ev: JQueryKeyEventObject): void {
    const value = this.input.value;
    if (value !== this.previous) {
      this.previous = value;
      this._events.next({ name: "ChangeEvent", value });
    }
  }

  protected onInput(_ev: JQueryKeyEventObject): void {
    const value = this.input.value;
    if (value !== this.previous) {
      this.previous = value;
      this._events.next({ name: "ChangeEvent", value });
    }
  }
}
