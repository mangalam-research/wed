/**
 * This exception is thrown when **voluntarily** aborting a transformation, like
 * if the user is trying to do something which is not allowed in this
 * context. Only transformations can throw this.
 */
export declare class AbortTransformationException extends Error {
    constructor(message: string);
}
