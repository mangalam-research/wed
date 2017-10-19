import { Mode as TestMode, TestModeOptions } from "wed/modes/test/test-mode";
import { Editor } from "wed/wed";
declare class FakeMode extends TestMode {
    constructor(editor: Editor, options: TestModeOptions);
}
export { FakeMode as Mode };
