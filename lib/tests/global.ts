/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { assert } from "chai";
import * as $ from "jquery";

// tslint:disable-next-line:no-any
function control(command: string, additional: any, errmsg: string,
                 done: () => void): void {
  const params = $.extend({ command: command }, additional);
  $.post("/build/ajax/control", params, (data) => {
    assert.deepEqual(data, {});
    done();
  }).fail(() => {
    throw new Error(errmsg);
  });
}

export function reset(done: () => void): void {
  control("reset", undefined, "failed to reset", done);
}

function setParam(name: string, done: () => void): void {
  control(name, { value: 1 }, `failed to set ${name}`, done);
}

export function fail_on_save(done: () => void): void {
  setParam("fail_on_save", done);
}

export function no_response_on_save(done: () => void): void {
  setParam("no_response_on_save", done);
}

export function precondition_fail_on_save(done: () => void): void {
  setParam("precondition_fail_on_save", done);
}

export function too_old_on_save(done: () => void): void {
  setParam("too_old_on_save", done);
}

// tslint:disable-next-line:no-any
export function makeFakePasteEvent(clipboardData: any): any {
  const event = new $.Event("paste");
  event.originalEvent = {
    clipboardData,
    // tslint:disable-next-line:no-empty
    stopImmediatePropagation: () => {},
    // tslint:disable-next-line:no-empty
    preventDefault: () => {},
    // tslint:disable-next-line:no-empty
    stopPropagation: () => {},
    // tslint:disable-next-line:no-any
  } as any;
  return event;
}

//  LocalWords:  Mangalam MPL Dubeau jQuery jquery ajax chai
