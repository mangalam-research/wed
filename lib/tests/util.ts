/**
 * Utilities that don't require a DOM to run.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import * as Promise from "bluebird";
import { AssertionError, expect } from "chai";

export function waitFor(fn: () => boolean | Promise<boolean>,
                        delay: number = 100,
                        timeout?: number): Promise<boolean> {
  const start = Date.now();

  function check(): boolean | Promise<boolean> {
    const ret = fn();
    if (ret) {
      return ret;
    }

    if ((timeout !== undefined) && (Date.now() - start > timeout)) {
      return false;
    }

    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    }).then(check);
  }

  return Promise.resolve().then(check);
}

export function waitForSuccess(fn: () => void,
                               delay?: number,
                               timeout?: number): Promise<void> {
  return waitFor(() => {
    try {
      fn();
      return true;
    }
    catch (e) {
      if (e instanceof AssertionError) {
        return false;
      }

      throw e;
    }
  }, delay, timeout).then(() => undefined);
}

// tslint:disable-next-line:no-any
export type ErrorClass = { new (...args: any[]): Error };

export function expectError(fn: Function,
                            pattern: RegExp | string): Promise<void>;
export function expectError(fn: Function, errorClass: ErrorClass,
                            pattern: RegExp | string): Promise<void>;
export function expectError(fn: Function,
                            errorLike: RegExp | string | ErrorClass,
                            pattern?: RegExp | string): Promise<void> {
  return fn().then(
    () => {
      throw new Error("should have thrown an error");
    },
    // tslint:disable-next-line:no-any
    (ex: any) => {
      if (!(errorLike instanceof RegExp || typeof errorLike === "string")) {
        expect(ex).to.be.instanceof(errorLike);
      }
      else {
        pattern = errorLike;
      }

      if (pattern instanceof RegExp) {
        expect(ex).to.have.property("message").match(pattern);
      }
      else {
        expect(ex).to.have.property("message").equal(pattern);
      }
    });
}
