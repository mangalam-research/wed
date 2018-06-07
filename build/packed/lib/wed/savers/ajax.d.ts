import { Runtime, saver, treeUpdater } from "wed";
import TreeUpdater = treeUpdater.TreeUpdater;
export interface Options extends saver.SaverOptions {
    /** The URL location to POST save requests. */
    url: string;
    /**
     * Headers to set on the POST request. This may be necessary for cross
     * domain request protection, for instance.
     */
    headers?: Record<string, string>;
    /** The initial ETag to use. */
    initial_etag?: string;
}
/**
 * A saver responsible for communicating with a server to save the data edited
 * by a wed editor.
 *
 * @param runtime The runtime under which this saver is created.
 *
 * @param version The version of wed for which this object is created.
 *
 * @param dataUpdater The updater that the editor created for its data tree.
 *
 * @param {Node} dataTree The editor's data tree.
 *
 * @param options The options specific to this class.
 */
declare class AjaxSaver extends saver.Saver {
    private readonly url;
    private readonly headers;
    private etag;
    constructor(runtime: Runtime, version: string, dataUpdater: TreeUpdater, dataTree: Node, options: Options);
    init(): Promise<void>;
    _save(autosave: boolean): Promise<void>;
    _recover(): Promise<boolean>;
    /**
     * Utility wrapper for Ajax queries. Read the code for more information.
     *
     * @private
     *
     * @param data
     * @param dataType
     *
     * @returns A promise that resolves when the post is over.
     */
    private _post(data, dataType);
}
export { AjaxSaver as Saver };
