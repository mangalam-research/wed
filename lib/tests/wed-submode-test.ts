/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { expect } from "chai";
import * as mergeOptions from "merge-options";
import * as salve from "salve";

import * as log from "wed/log";
import * as onerror from "wed/onerror";
import { Options } from "wed/options";
import * as wed from "wed/wed";

import * as globalConfig from "./base-config";
import { DataProvider } from "./global";
// import { waitForSuccess } from "./util";
import { config } from "./submode-config";

describe("wed submodes", () => {
  let source: string;
  let editor: wed.Editor | undefined;
  let options: Options;

  before(() => {
    options = mergeOptions({}, config);
    const provider = new DataProvider("");
    return Promise.all([
      provider.getText("../schemas/tei-simplified-rng.js")
        .then((schema) => {
          // Resolve the schema to a grammar.
          options.schema = salve.constructTree(schema);
        }),
      provider
        .getText("lib/tests/wed_test_data/source_for_submodes_converted.xml")
        .then((xml) => {
          source = xml;
        }),
    ]);
  });

  before(() => {
    const wedroot =
      (window.parent.document.getElementById("wedframe") as HTMLIFrameElement)
      .contentWindow.document.getElementById("wedroot")!;
    editor = new wed.Editor(wedroot,
                            mergeOptions({}, globalConfig.config, options));
    return editor.init(source);
  });

  after(() => {
    if (editor !== undefined) {
      editor.destroy();
    }

    // We read the state, reset, and do the assertion later so
    // that if the assertion fails, we still have our reset.
    const wasTerminating = onerror.is_terminating();

    // We don't reload our page so we need to do this.
    onerror.__test.reset();
    log.clearAppenders();
    expect(wasTerminating)
      .to.equal(false, "test caused an unhandled exception to occur");

    editor = undefined;
  });

  it("dispatch to proper decorators", () => {
    const wrapped =
      editor!.guiRoot.querySelectorAll("[data-wed-rend='wrap'].tei\\:p._real");
    expect(wrapped).to.have.length(2);
    function parentTest(el: HTMLElement, msg: string, expected: boolean): void {
      const parent = el.parentNode as HTMLElement;
      expect(parent.classList.contains("_gui_test"), msg).to.equal(expected);
    }

    parentTest(wrapped[0] as HTMLElement,
               "the first paragraph with rend='wrap' should be decorated by \
the test mode",
               true);
    parentTest(wrapped[1] as HTMLElement,
               "the second paragraph with rend='wrap' should not be decorated \
by the test mode",
               false);
  });
});
