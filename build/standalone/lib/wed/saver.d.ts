/**
 * Base class for savers.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { Runtime } from "./runtime";
import { TreeUpdater } from "./tree-updater";
export declare enum SaveKind {
    AUTO = 1,
    MANUAL = 2,
}
export interface SaveError {
    /**
     * The possible values for ``type`` are:
     *
     * - ``save_edited`` when the file to be saved has changed in the save
     *   media. (For instance, if someone else edited a file that is stored on a
     *   server.)
     *
     * - ``save_disconnected`` when the saver has lost contact with the media that
     *   holds the data to be saved.
     *
     * - ``save_transient_error`` when an recoverable error happened while
     *   saving. These are errors that a user should be able to recover from. For
     *   instance, if the document must contain a specific piece of information
     *   before being saved, this kind of error may be used to notify the user.
     */
    type: string | undefined;
    msg: string;
}
/**
 * Emitted upon a failure during operations.
 */
export interface FailedEvent {
    name: "Failed";
    error: SaveError;
}
/**
 * This event is emitted when the saver detects that the document it is
 * responsible for saving has changed in a way that makes it stale from the
 * point of view of saving.
 *
 * Suppose that the document has been saved. Then a change is made. Upon this
 * first change, this event is emitted. Then a change is made again. Since the
 * document was *already* stale, this event is not emitted again.
 */
export interface ChangedEvent {
    name: "Changed";
}
/**
 * This event is emitted after a document has been successfully saved.
 */
export interface Saved {
    name: "Saved";
}
/**
 * This event is emitted after a document has been successfully autosaved.
 */
export interface Autosaved {
    name: "Autosaved";
}
export declare type SaveEvents = Saved | Autosaved | ChangedEvent | FailedEvent;
export interface SaverOptions {
    /** The time between autosaves in seconds. */
    autosave?: number;
}
/**
 * A saver is responsible for saving a document's data. This class cannot be
 * instantiated as-is, but only through subclasses.
 */
export declare abstract class Saver {
    protected readonly runtime: Runtime;
    protected readonly version: string;
    protected readonly dataUpdater: TreeUpdater;
    protected readonly dataTree: Node;
    protected readonly options: SaverOptions;
    /**
     * Subclasses must set this variable to true once they have finished with
     * their initialization.
     */
    protected initialized: boolean;
    /**
     * Subclasses must set this variable to true if the saver is in a failed
     * state. Note that the "failed" state is for cases where it makes no sense to
     * attempt a recovery operation.
     *
     * One effect of being in a "failed" state is that the saver won't perform a
     * recover operation if it is in a "failed" state.
     */
    protected failed: boolean;
    /**
     * The generation that is currently being edited.  It is mutable. Derived
     * classes can read it but not modify it.
     */
    protected currentGeneration: number;
    /**
     * The generation that has last been saved. Derived classes can read it but
     * not modify it.
     */
    protected savedGeneration: number;
    /**
     * The date of last modification.
     */
    private lastModification;
    /**
     * The date of last save.
     */
    private lastSave;
    /**
     * The last kind of save.
     */
    private lastSaveKind;
    /**
     * The interval at which to autosave, in milliseconds.
     */
    private autosaveInterval;
    /**
     * The current timeout object which will trigger an autosave. It has the value
     * ``undefined`` if there is no current timeout.
     */
    private autosaveTimeout;
    /**
     * The object on which this class and subclasses may push new events.
     */
    protected readonly _events: Subject<SaveEvents>;
    /**
     * The observable on which clients can listen for events.
     */
    readonly events: Observable<SaveEvents>;
    private _boundAutosave;
    /**
     * @param runtime The runtime under which this saver is created.
     *
     * @param version The version of wed for which this object is created.
     *
     * @param dataUpdater The updater that the editor created for its data tree.
     *
     * @param {Node} dataTree The editor's data tree.
     */
    constructor(runtime: Runtime, version: string, dataUpdater: TreeUpdater, dataTree: Node, options: SaverOptions);
    /**
     * This method must be called before using the saver. **MUST BE CALLED ONLY
     * ONCE.**
     *
     * @returns A promise that is resolved when the saver is initialized.
     */
    abstract init(): Promise<void>;
    /**
     * This method must be called when the user manually initiates a save.
     *
     * @returns A promise which resolves if the save was successful.
     */
    save(): Promise<void>;
    /**
     * This method is called when saving or autosaving. This is the method
     * responsible for the implementation-specific details.
     *
     * @param autosave ``true`` if called by an autosave, ``false`` if not.
     */
    protected abstract _save(autosave: boolean): Promise<void>;
    /**
     * This method returns the data to be saved in a save operation. Derived
     * classes **must** call this method rather than get the data directly from
     * the data tree.
     */
    getData(): string;
    /**
     * Must be called by derived class upon a successful save.
     *
     * @param autosave ``true`` if called for an autosave operation, ``false`` if
     * not.
     *
     * @param savingGeneration The generation being saved. It is necessary to pass
     * this value due to the asynchronous nature of some saving operations.
     */
    protected _saveSuccess(autosave: boolean, savingGeneration: number): void;
    /**
     * Must be called by derived classes when they fail to perform their task.
     *
     * @param The error message associated with the failure. If the error message
     * is specified a ``failed`` event will be emitted. If not, no event is
     * emitted.
     */
    protected _fail(error?: SaveError): void;
    /**
     * This is the function called internally when an autosave is needed.
     */
    private _autosave();
    /**
     * Changes the interval at which autosaves are performed. Note that calling
     * this function will stop the current countdown and restart it from zero. If,
     * for instance, the previous interval was 5 minutes, and 4 minutes had
     * elapsed since the last save, the next autosave should happen one minute
     * from now. However, if I now call this function with a new interval of 4
     * minutes, this will cause the next autosave to happen 4 minutes after the
     * call, rather than one minute.
     *
     * @param interval The interval between autosaves in milliseconds. 0 turns off
     * autosaves.
     */
    setAutosaveInterval(interval: number): void;
    /**
     * This method is to be used by wed upon encountering a fatal error. It will
     * attempt to record the last state of the data tree before wed dies.
     *
     * @returns A promise which resolves to ``undefined`` if the method did not do
     * anything because the Saver object is in an unintialized state or has
     * already failed. It resolves to ``true`` if the recovery operation was
     * successful, and ``false`` if not.
     */
    recover(): Promise<boolean | undefined>;
    /**
     * This method is called when recovering. This is the method responsible for
     * the implementation-specific details.
     *
     * @returns A promise that resolves to ``true`` if the recovery operation was
     * successful, and ``false`` if not.
     */
    protected abstract _recover(): Promise<boolean>;
    /**
     * Returns information regarding whether the saver sees the data tree as
     * having been modified since the last save occurred.
     *
     * @returns ``false`` if the tree has not been modified. Otherwise, returns a
     * string that describes how long ago the modification happened.
     */
    getModifiedWhen(): false | string;
    /**
     * Produces a string that indicates in human readable format when the last
     * save occurred.
     *
     * @returns The string. The value ``undefined`` is returned if no save has
     * occurred yet.
     */
    getSavedWhen(): undefined | string;
    /**
     * Returns the last kind of save that occurred.
     *
     * @returns {number|undefined} The kind. The value will be
     * ``undefined`` if there has not been any save yet.
     */
    getLastSaveKind(): number | undefined;
}
export interface SaverConstructor {
    new (runtime: Runtime, version: string, dataUpdater: TreeUpdater, dataTree: Node, options: SaverOptions): Saver;
}
