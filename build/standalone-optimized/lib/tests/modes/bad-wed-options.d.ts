import { EditorAPI } from "wed";
import { Mode as TestMode, TestModeOptions } from "wed/modes/test/test-mode";
declare class FakeMode extends TestMode {
    constructor(editor: EditorAPI, options: TestModeOptions);
}
export { FakeMode as Mode };
