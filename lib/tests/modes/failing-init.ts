/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { Mode as TestMode } from "wed/modes/test/test-mode";

// tslint:disable-next-line:completed-docs
class FakeMode extends TestMode {
  init(): Promise<void> {
    return Promise.reject(new Error("failed init"));
  }
}

export { FakeMode as Mode };
