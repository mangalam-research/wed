/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import mergeOptions from "merge-options";

import { Editor } from "wed/editor";

import * as globalConfig from "../base-config";
import { EditorSetup } from "../wed-test-util";

const options = {
  mode: {
    options: {
      hide_attributes: true,
    },
  },
};

describe("wed hides attributes:", () => {
  let setup: EditorSetup;
  let editor: Editor;

  before(() => {
    setup = new EditorSetup(
      "/base/build/standalone/lib/tests/wed_test_data/source_converted.xml",
      mergeOptions(globalConfig.config, options),
      document);
    ({ editor } = setup);
    return setup.init().then(() => {
      // tslint:disable-next-line:no-any
      (editor.validator as any)._validateUpTo(editor.dataRoot, -1);
    });
  });

  afterEach(() => {
    setup.reset();
  });

  after(() => {
    setup.restore();
    // tslint:disable-next-line:no-any
    (editor as any) = undefined;
  });

  // We don't put this with wed-validation-error-test because it is not
  // specifically checking the validation code but is an overall smoketest.
  it("is able to start", () => {
    return editor.firstValidationComplete;
  });
});
