import { expect, use } from "chai";
import * as sinon from "sinon";
import sinonChai from "sinon-chai";

import { expectError } from "tests/util";
import { Editor } from "wed/editor";
import { ModeLoader } from "wed/mode-loader";

use(sinonChai);

// tslint:disable-next-line:completed-docs
class FakeMode {
  public initialized: boolean = false;

  // tslint:disable-next-line:no-any
  constructor(public readonly editor: any, public readonly options: any) {}

  init(): Promise<void> {
    this.initialized = true;
    return Promise.resolve();
  }
}

// tslint:disable-next-line:missing-jsdoc
describe("ModeLoader", () => {
  let loader: ModeLoader;
  // tslint:disable-next-line:no-any
  let runtime: any;
  // Yes, we cheat with a typecast.
  // tslint:disable-next-line:no-any mocha-no-side-effect-code
  const editor = { editor: true } as any as Editor;
  const options = { options: true };
  beforeEach(() => {
    const runtime_ = sinon.stub({
      // tslint:disable-next-line:no-empty
      resolveModules: () => {},
    });
    runtime = runtime_;
    loader = new ModeLoader(editor, runtime);
  });

  describe("#initMode", () => {
    it("fails if we cannot load", async () => {
      runtime.resolveModules.throws(new Error("cannot load"));
      await expectError(async () => loader.initMode("moo", options),
                        Error, "cannot load");
    });

    it("by default, tries multiple module names", async () => {
      runtime.resolveModules.throws(new Error("cannot load"));
      try {
        await loader.initMode("moo", {});
      }
      // tslint:disable-next-line:no-empty
      catch (ex) {}
      expect(runtime).to.have.property("resolveModules").to.have.callCount(4);
      expect(runtime.resolveModules.firstCall).to.have.been.calledWith("moo");
      expect(runtime.resolveModules.secondCall)
        .to.have.been.calledWith("wed/modes/moo/moo");
      expect(runtime.resolveModules.thirdCall)
        .to.have.been.calledWith("wed/modes/moo/moo-mode");
      expect(runtime.resolveModules.lastCall)
        .to.have.been.calledWith("wed/modes/moo/moo_mode");
    });

    it("fails on first attempt if the path has a forward slash", async () => {
      runtime.resolveModules.throws(new Error("cannot load"));
      try {
        await loader.initMode("moo/foo", options);
      }
      // tslint:disable-next-line:no-empty
      catch (ex) {}
      expect(runtime).to.have.property("resolveModules").to.have.callCount(1);
      expect(runtime.resolveModules).to.have.been.calledWith("moo/foo");
    });

    it("initializes the module after loading it", async () => {
      runtime.resolveModules.returns([{
        Mode: FakeMode,
      }]);
      const loaded = await loader.initMode("moo/foo", options);
      expect(loaded).to.be.instanceof(FakeMode);
      expect(loaded).to.have.property("initialized").be.true;
    });

    it("creates the mode with correct parameters", async () => {
      // tslint:disable-next-line:variable-name
      const ModeConstructor = sinon.spy(function Mode(): FakeMode {
          return sinon.createStubInstance(FakeMode);
      });
      runtime.resolveModules.returns([{
        Mode: ModeConstructor,
      }]);
      await loader.initMode("moo/foo", options);
      expect(ModeConstructor).to.have.been.calledOnce;
      expect(ModeConstructor).to.have.been.calledWith(editor, options);
    });

    it("fails if the module fails to init", async () => {
      runtime.resolveModules.returns([{
        Mode: function Mode(): FakeMode {
          const ret = sinon.createStubInstance(FakeMode);
          ret.init.returns(Promise.reject(new Error("failed")));
          return ret;
        },
      }]);
      await expectError(async () =>  loader.initMode("moo/foo", options),
                        Error, "failed");
    });
  });
});
