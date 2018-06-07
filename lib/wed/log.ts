/**
 * Logging facilities
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
// tslint:disable:no-any
import * as log4javascript from "log4javascript";

log4javascript.setShowStackTraces(true);

const ajaxLogger = log4javascript.getLogger("wed");
ajaxLogger.setLevel(log4javascript.Level.ALL);

const log = log4javascript.getLogger("wed.common");
log.setLevel(log4javascript.Level.ALL);
const popup = new log4javascript.PopUpAppender(true);
popup.setThreshold(log4javascript.Level.ERROR);
popup.setInitiallyMinimized(true);
popup.setNewestMessageAtTop(true);

log.addAppender(popup);

export type Log4JSMethod = (...messages: any[]) => void;

export const trace: Log4JSMethod = log.trace.bind(log);
export const debug: Log4JSMethod = log.debug.bind(log);
export const info: Log4JSMethod = log.info.bind(log);
export const warn: Log4JSMethod = log.warn.bind(log);
export const error: Log4JSMethod = log.error.bind(log);
export const fatal: Log4JSMethod = log.fatal.bind(log);

/**
 * Shows the popup appender.
 */
export function showPopup(): void {
  popup.show();
}

/**
 * Wrapper for handled exceptions.
 */
export class Handled {
  /**
   * original The original exception that was raised.
   */
  constructor(public readonly original: any) {}
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
export function unhandled(e: any): Handled {
  if (!(e instanceof Handled)) {
    log.fatal("Unhandled exception", e);
    // tslint:disable-next-line:no-typeof-undefined
    if (typeof console !== "undefined") {
      // tslint:disable:no-console
      console.log(e);
      console.log(e.stack);
      // tslint:enable:no-console
    }
    return new Handled(e);
  }
  return e;
}

/**
 * Handles an unhandled exception. In almost all cases where you have to deal
 * with an unhandled exception, you want to interrupt the flow of
 * execution. This function does this.
 *
 * @param e The exception that is unhandled.
 *
 * @throws {Handled} Always.
 */
export function handle(e: any): never {
  throw unhandled(e);
}

/**
 * Wraps a function into an unhandled exception logger. The exceptions caught
 * are rethrown after being logged.
 *
 * @param f The function to wrap.
 *
 * @returns The value returned by f.
 */
export function wrap<T extends (this: any, ...args: any[]) => any>(fn: T): T {
  // @ts-ignore
  return function wrapper(this: any, ...args: any[]): any {
    try {
      // tslint:disable-next-line:no-invalid-this
      return fn.apply(this, arguments);
    }
    catch (ex) {
      handle(ex);
    }
  } as T;
}

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
export function addURL(url: string, headers?: Record<string, string>):
log4javascript.AjaxAppender {
  const appender = new log4javascript.AjaxAppender(url);
  appender.setThreshold(log4javascript.Level.ALL);
  const layout = new log4javascript.XmlLayout();
  appender.setLayout(layout);
  if (headers !== undefined) {
    Object.keys(headers).forEach((x) => {
      appender.addHeader(x, headers[x]);
    });
  }
  ajaxLogger.addAppender(appender);
  log.info("Ajax appender initialized");
  return appender;
}

/**
 * Removes an appender from the logger. Flushes out any pending messages first.
 *
 * @param appender The appender to remove.
 */
export function removeAppender(appender: log4javascript.AjaxAppender): void {
  appender.sendAll();
  ajaxLogger.removeAppender(appender);
}

//  LocalWords:  Dubeau MPL Mangalam popup appender unhandled rethrown Django
//  LocalWords:  CSRFToken param
