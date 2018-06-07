/**
 * Utilities that don't require a DOM to run.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { ajax } from "bluejax";
import { AssertionError, expect } from "chai";

export function delay(timeout: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

export function waitFor(fn: () => boolean | Promise<boolean>,
                        pollDelay: number = 100,
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

    return delay(pollDelay).then(check);
  }

  // TypeScript does not like Promise.resolve(check).
  return Promise.resolve().then(check);
}

export function waitForSuccess(fn: () => void,
                               pollDelay?: number,
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
  }, pollDelay, timeout).then(() => undefined);
}

// tslint:disable-next-line:completed-docs
export class DataProvider {
  private readonly cache: Record<string, string> = Object.create(null);
  private readonly parser: DOMParser = new DOMParser();
  private readonly registered: Record<string, string> = Object.create(null);

  constructor(private readonly base: string) {}

  register(name: string, path: string): void {
    this.registered[name] = path;
  }

  getNamed(name: string): Promise<string> {
    const path = this.registered[name];
    return this.getText(path);
  }

  getNamedDoc(name: string): Promise<Document> {
    const path = this.registered[name];
    return this.getDoc(path);
  }

  getText(path: string): Promise<string> {
    return this._getText(this.base + path);
  }

  _getText(path: string): Promise<string> {
    return Promise.resolve().then(() => {
      const cached = this.cache[path];
      if (cached !== undefined) {
        return cached;
      }

      return ajax({ url: path, dataType: "text"})
        .then((data) => {
          this.cache[path] = data;
          return data;
        });
    });
  }

  getDoc(path: string): Promise<Document> {
    return this._getText(this.base + path).then((data) => {
      return this.parser.parseFromString(data, "text/xml");
    });
  }
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

// tslint:disable-next-line:no-any
export function makeFakePasteEvent(clipboardData: any): any {
  const event = new $.Event("paste");
  event.originalEvent = {
    clipboardData,
    // tslint:disable-next-line:no-empty
    stopImmediatePropagation: () => {},
    // tslint:disable-next-line:no-empty
    preventDefault: () => {},
    // tslint:disable-next-line:no-empty
    stopPropagation: () => {},
    // tslint:disable-next-line:no-any
  } as any;
  return event;
}
