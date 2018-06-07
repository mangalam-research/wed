/**
 * Validate wed options.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import Ajv from "ajv";

import { ComplexAttributesSpec, WedOptions } from "./wed-options";
import * as wedOptionsSchema from "./wed-options-schema.json";

export interface CleanedWedOptions extends WedOptions {
  attributes: ComplexAttributesSpec;
}

let _wedOptionsValidator: Ajv.ValidateFunction;

function getValidator(): Ajv.ValidateFunction {
  if (_wedOptionsValidator === undefined) {
      _wedOptionsValidator = new Ajv().compile(wedOptionsSchema);
  }

  return _wedOptionsValidator;
}

/**
 * Validates and normalizes the options to a specific format.
 *
 * @param options The raw options obtained from the mode.
 *
 * @returns The cleaned options if successful. If there were error the return
 * value is an array of error messages.
 */
export function processWedOptions(options: WedOptions):
CleanedWedOptions | string[] {
  const errors: string[] = [];

  const ovalidator = getValidator();
  const valid = ovalidator(options);
  if (!(valid as boolean)) {
    if (ovalidator.errors != null) {
      for (const error of ovalidator.errors) {
        errors.push(`${error.dataPath} ${error.message}`);
      }
    }

    return errors;
  }

  const max = options.label_levels.max;

  const initial = options.label_levels.initial;

  // We cannot validate this with a schema.
  if (initial > max) {
    errors.push("label_levels.initial must be <= label_levels.max");
  }

  if (options.attributes === undefined) {
    options.attributes = "hide";
  }

  // Normalize the format of options.attributes.
  if (typeof options.attributes === "string") {
    const tmp = options.attributes;
    // We need the type cast at the end because otherwise TS infers a type of
    // { handling: "hide" | "show" | "edit" }.
    // tslint:disable-next-line:no-object-literal-type-assertion
    options.attributes = {
      handling: tmp,
    } as { handling: "hide" } | { handling: "show" | "edit" };
  }

  if (errors.length !== 0) {
    return errors;
  }

  return options as CleanedWedOptions;
}

//  LocalWords:  MPL
