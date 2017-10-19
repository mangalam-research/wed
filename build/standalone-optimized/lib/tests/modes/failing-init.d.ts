/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Mode as TestMode } from "wed/modes/test/test-mode";
declare class FakeMode extends TestMode {
    init(): Promise<void>;
}
export { FakeMode as Mode };
