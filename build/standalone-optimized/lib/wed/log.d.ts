/**
 * Logging facilities
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as log4javascript from "log4javascript";
export declare type Log4JSMethod = (...messages: any[]) => void;
export declare const trace: Log4JSMethod;
export declare const debug: Log4JSMethod;
export declare const info: Log4JSMethod;
export declare const warn: Log4JSMethod;
export declare const error: Log4JSMethod;
export declare const fatal: Log4JSMethod;
/**
 * Shows the popup appender.
 */
export declare function showPopup(): void;
/**
 * Wrapper for handled exceptions.
 */
export declare class Handled {
    readonly original: any;
    /**
     * original The original exception that was raised.
     */
    constructor(original: any);
}
/**
 * Reports an unhandled exception. Avoids reporting the same exception
 * more than once.
 *
 * **Use this function only if it makes sense to not abort the current execution
 * by throwing a new exception.** In most cases you want to use [[handle]]
 * instead of this function.
 *
 * @param e The exception to report. This exception will not be
 * reported if it happens to be a [[Handled]] object.
 *
 * @returns A wrapper around the original exception.
 */
export declare function unhandled(e: any): Handled;
/**
 * Handles an unhandled exception. In almost all cases where you have to deal
 * with an unhandled exception, you want to interrupt the flow of
 * execution. This function does this.
 *
 * @param e The exception that is unhandled.
 *
 * @throws {Handled} Always.
 */
export declare function handle(e: any): never;
/**
 * Wraps a function into an unhandled exception logger. The exceptions caught
 * are rethrown after being logged.
 *
 * @param f The function to wrap.
 *
 * @returns The value returned by f.
 */
export declare function wrap<T extends (this: any, ...args: any[]) => any>(fn: T): T;
/**
 * This method adds an Ajax appender to the topmost logger defined by wed so
 * that all messages are sent to the URL specified as a parameter. A server
 * should be listening at that address.
 *
 * @param url The URL for the location to send log messages.
 *
 * @param headers An object having (key, value) pairs which define header fields
 * to set for communicating. One use for this parameter would be for instance to
 * set the X-CSRFToken field when wed is being used on pages served by a Django
 * server.
 *
 * @returns The appender that was created to handle the URL. This may be used
 * with [[removeAppender]] to remove an appender that is no longer used.
 */
export declare function addURL(url: string, headers?: Record<string, string>): log4javascript.AjaxAppender;
/**
 * Removes an appender from the logger. Flushes out any pending messages first.
 *
 * @param appender The appender to remove.
 */
export declare function removeAppender(appender: log4javascript.AjaxAppender): void;
