/**
 * Load and initialize modes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Mode } from "./mode";
import { Runtime } from "./runtime";
/**
 * A class that can load modes.
 */
export declare class ModeLoader {
    private readonly editor;
    private readonly runtime;
    /**
     * @param runtime The runtime to use to load the mode module.
     */
    constructor(editor: {}, runtime: Runtime);
    /**
     * Load and initialize a mode.
     *
     * @param path The path to the mode.
     *
     * @param options The mode's options.
     *
     * @returns A promise that resolves to the initialized [[Mode]] object.
     */
    initMode(path: string, options?: {} | undefined): Promise<Mode>;
    /**
     * Loads a mode.
     *
     * @param path The path to the mode.
     *
     * @returns A promise that resolves to the module that holds the mode.
     */
    private loadMode(path);
}
