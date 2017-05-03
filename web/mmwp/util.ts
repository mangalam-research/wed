import { Grammar } from "salve";
import { ErrorData, WorkingState as WS,
         WorkingStateData } from "salve-dom";

import { ModeValidator, Validator } from "wed/validator";

export function validate(grammar: Grammar,
                         doc: Document,
                         modeValidator?: ModeValidator): Promise<ErrorData[]> {
  return Promise.resolve().then(() => {
    const validator = new Validator(grammar, doc, modeValidator);
    const errors: ErrorData[] = [];
    return new Promise((resolve) => {
      validator.events.addEventListener(
        "state-update",
        (state: WorkingStateData) => {
          if (!(state.state === WS.VALID || state.state === WS.INVALID)) {
            return;
          }

          resolve(errors);
        });
      validator.events.addEventListener("error", errors.push.bind(errors));
      validator.start();
    });
  });
}
