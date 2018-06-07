/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { CaretManager } from "wed/caret-manager";
import { Editor } from "wed/editor";

import * as globalConfig from "../base-config";
import { EditorSetup } from "../wed-test-util";

const expect = chai.expect;

describe("wed label visibility level:", () => {
  let setup: EditorSetup;
  let editor: Editor;
  let caretManager: CaretManager;

  before(() => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/wed_test_data/source_converted.xml",
      globalConfig.config,
      document);
    ({ editor } = setup);
    return setup.init().then(() => {
      // tslint:disable-next-line:no-any
      (editor.validator as any)._validateUpTo(editor.dataRoot, -1);
      caretManager = editor.caretManager;
    });
  });

  afterEach(() => {
    setup.reset();
  });

  after(() => {
    setup.restore();

    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
    // tslint:disable-next-line:no-any
    (caretManager as any) = undefined;
  });

  it("can be reduced using the toolbar", () => {
    // tslint:disable-next-line:no-any
    expect((editor as any).currentLabelLevel).to.equal(1);
    const button = editor.widget
      .querySelector(
        "[data-original-title='Decrease label visibility level']",
      ) as HTMLElement;
    button.click();
    // tslint:disable-next-line:no-any
    expect((editor as any).currentLabelLevel).to.equal(0);
  });

  it("can be increased using the toolbar", () => {
    // tslint:disable-next-line:no-any
    expect((editor as any).currentLabelLevel).to.equal(1);
    const button = editor.widget
      .querySelector(
        "[data-original-title='Increase label visibility level']",
      ) as HTMLElement;
    button.click();
    // tslint:disable-next-line:no-any
    expect((editor as any).currentLabelLevel).to.equal(2);
  });
});
