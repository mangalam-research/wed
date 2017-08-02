/**
 * Load and initialize modes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { Mode } from "./mode";
import { Runtime } from "./runtime";

interface ModeConstructor {
  new (editor: {}, modeOptions: {}): Mode<{}>;
}

interface ModeModule {
  Mode: ModeConstructor;
}

/**
 * A class that can load modes.
 */
export class ModeLoader {
  /**
   * @param runtime The runtime to use to load the mode module.
   */
  constructor(private readonly editor: {},
              private readonly runtime: Runtime) {}

  /**
   * Load and initialize a mode.
   *
   * @param path The path to the mode.
   *
   * @param options The mode's options.
   *
   * @returns A promise that resolves to the initialized [[Mode]] object.
   */
  async initMode(path: string,
                 options: {} | undefined = {}): Promise<Mode<{}>> {
    const mmodule: ModeModule = await this.loadMode(path);
    const mode = new mmodule.Mode(this.editor, options);

    await mode.init();
    return mode;
  }

  /**
   * Loads a mode.
   *
   * @param path The path to the mode.
   *
   * @returns A promise that resolves to the module that holds the mode.
   */
  private async loadMode(path: string): Promise<ModeModule> {
    const runtime = this.runtime;
    try {
      return (await runtime.resolveModules(path))[0] as ModeModule;
    }
    // tslint:disable-next-line:no-empty
    catch (ex) {}

    if (path.indexOf("/") !== -1) {
      // It is an actual path so don't try any further loading.
      throw new Error(`can't load mode ${path}`);
    }

    path = `./modes/${path}/${path}`;

    try {
      return (await runtime.resolveModules(path))[0] as ModeModule;
    }
    // tslint:disable-next-line:no-empty
    catch (ex) {}

    try {
      return (await runtime.resolveModules(`${path}-mode`))[0] as ModeModule;
    }
    // tslint:disable-next-line:no-empty
    catch (ex) {}

    return (await runtime.resolveModules(`${path}_mode`))[0] as ModeModule;
  }
}
