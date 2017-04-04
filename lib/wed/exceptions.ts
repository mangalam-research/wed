/**
 * Exceptions for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { fixPrototype } from "./util";

/**
 * This exception is thrown when **voluntarily** aborting a transformation, like
 * if the user is trying to do something which is not allowed in this
 * context. Only transformations can throw this.
 */
export class AbortTransformationException extends Error {
  constructor(message: string) {
    super(message);
    fixPrototype(this, AbortTransformationException);
  }
}

// LocalWords:  Dubeau MPL Mangalam classdesc
