import { ComplexAttributesSpec, WedOptions } from "./wed-options";
export interface CleanedWedOptions extends WedOptions {
    attributes: ComplexAttributesSpec;
}
/**
 * Validates and normalizes the options to a specific format.
 *
 * @param options The raw options obtained from the mode.
 *
 * @returns The cleaned options if successful. If there were error the return
 * value is an array of error messages.
 */
export declare function processWedOptions(options: WedOptions): CleanedWedOptions | string[];
