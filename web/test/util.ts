import "chai";

export function waitFor(fn: () => boolean | Promise<boolean>,
                        delay: number = 100,
                        timeout?: number):
Promise<boolean> {
  const start = Date.now();

  function check(): boolean | Promise<boolean> {
    const ret = fn();
    if (ret) {
      return ret;
    }

    if ((timeout !== undefined) && (Date.now() - start > timeout)) {
      return false;
    }

    return new Promise((resolve) => setTimeout(resolve, delay)).then(check);
  }

  return Promise.resolve().then(check);
}

export function waitForSuccess(fn: () => void,
                               delay?: number,
                               timeout?: number):
Promise<void> {
  return waitFor(() => {
    try {
      fn();
      return true;
    }
    catch (e) {
      if (e instanceof chai.AssertionError) {
        return false;
      }

      throw e;
    }
    // tslint:disable-next-line:align
  }, delay, timeout).then(() => undefined);
}
