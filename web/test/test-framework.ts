
// tslint:disable:no-any
type MochaCallback = (this: Mocha.ITestCallbackContext, done: MochaDone) => any;
type MochaHookCallback = (this: Mocha.IHookCallbackContext,
                          done: MochaDone) => any;

interface MochaHook {
  (callback: MochaHookCallback): void;
  (description: string, callback: MochaHookCallback): void;
}

class TestRecord<T> {
  constructor(public readonly method: Mocha.ITestDefinition,
              public readonly name: string,
              public readonly callback?: TestCallback<T>) {}
}

class HookRecord {
  constructor(public readonly method: MochaHook,
              public readonly name: string,
              public readonly callback: MochaCallback) {}
}

interface Test<T> { // tslint:disable-line: callable-types
  (name: string, callback?: TestCallback<T>): void;
}

interface TestAndProperties<T> extends Test<T> {
  only: Test<T>;
}

interface RecordContext<T> {
  it: TestAndProperties<T>;
}

export interface RuntimeContext<T> {
  test: Mocha.ITestCallbackContext;
  state: T;
}

type TestCallback<T> = (ctx: RuntimeContext<T>, done: MochaDone) => any;

export class TestSuite<T> {
  private readonly tests: (TestRecord<T> | HookRecord | TestSuite<T>)[] = [];

  constructor(public readonly name: string) {}

  addTest(method: Mocha.ITestDefinition, name: string,
          callback?: TestCallback<T>): void {
    this.tests.push(new TestRecord(method, name, callback));
  }

  addHook(method: MochaHook, name: string, callback: MochaHookCallback): void {
    this.tests.push(new HookRecord(method, name, callback));
  }

  addSuite(suite: TestSuite<T>): void {
    this.tests.push(suite);
  }

  makeTestHandler(stock: Mocha.ITestDefinition): TestAndProperties<T> {
    const test: TestAndProperties<T> =
      ((name: string, callback?: TestCallback<T>): void => {
        this.addTest(stock, name, callback);
      }) as TestAndProperties<T>;

    test.only = (name: string, callback?: TestCallback<T>): void => {
      this.addTest(stock.only as Mocha.ITestDefinition, name, callback);
    };

    return test;
  }

  record(cb: (context: RecordContext<T>) => void): TestSuite<T> {
    const ctx: RecordContext<T> = {
      it: this.makeTestHandler(it),
    };

    cb.call(undefined, ctx);

    return this;
  }

  make(state: T): void {
    describe(this.name, () => {
      for (const item of this.tests) {
        if (item instanceof TestSuite) {
          item.make(state);
        }
        else if (item instanceof TestRecord) {
          const callback = item.callback;
          if (callback !== undefined) {
            item.method(item.name, function wrapper(...args: any[]): any {
              return callback.apply(undefined, [{
                test: this,
                state,
              }].concat(args));
            });
          }
          else {
            item.method(item.name);
          }
        }
        else if (item instanceof HookRecord) {
          const wrapper = function wrapper(this: Mocha.IHookCallbackContext,
                                           ...args: any[]): any {
            return item.callback.apply(undefined, [{
              test: this,
              state,
            }].concat(args));
          };

          if (item.name !== undefined) {
            item.method(item.name, wrapper);
          }
          else {
            item.method(wrapper);
          }
        }
      }
    });
  }
}
