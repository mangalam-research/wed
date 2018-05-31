/**
 * Task abstraction for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

import { BehaviorSubject, Observable } from "rxjs";
import { first } from "rxjs/operators";

/**
 * The options accepted by a task runner.
 */
export interface TaskRunnerOptions {
  /**
   * The timeout between one cycle and the next. This is the number of
   * milliseconds that elapse before the next cycle runs.
   */
  timeout?: number;

  /**
   * The maximum number of milliseconds a cycle may run. A cycle will stop after
   * it has used the number of milliseconds listed here. Setting this to 0 means
   * "run until done" which is not generally recommended.
   */
  maxTimespan?: number;
}

export interface Task {
  /**
   * Performs one cycle of work. "One cycle" is an arbitrarily small unit of
   * work. For instance, if the task is to do something to all elements in an
   * array, one cycle could process a set number of elements from the array.
   *
   * @param task The task that is performing the computation.
   *
   * @returns False if there is no more work to be done. True otherwise.
   */
  cycle(task: TaskRunner): boolean;

  /**
   * Inform the computation that it should reset its state to start a
   * computation anew.
   */
  reset(task: TaskRunner): void;
}

export interface State {
  running: boolean;
  completed: boolean;
  terminated: boolean;
}

/**
 * A task is a computation that should produce a definite goal after a finite
 * time. This class is used to allow the task to happen in a way that does not
 * completely block the JavaScript virtual machine. The task will happen in
 * cycles that run for a maximum amount of time before relinquishing control.
 */
export class TaskRunner {
  private readonly _timeout: number = 0;
  private readonly _maxTimespan: number = 100;
  private readonly _boundWrapper: Function = this._workWrapper.bind(this);
  private _timeoutId: number | undefined;
  private _state: BehaviorSubject<State>;

  public state: Observable<State>;
  /**
   * @param task The computation controlled by this runner.
   *
   * @param options The options governing this runner.
   */
  constructor(private readonly task: Task, options: TaskRunnerOptions = {}) {
    const keys: (keyof TaskRunnerOptions)[] = ["timeout", "maxTimespan"];
    for (const key of keys) {
      const value = options[key];
      if (value === undefined) {
        continue;
      }

      if (value < 0) {
        throw new Error(`the value for ${key} cannot be negative`);
      }

      // tslint:disable-next-line:no-any
      (this as any)[`_${key}`] = options[key];
    }

    this._state = new BehaviorSubject({
      running: false,
      completed: false,
      terminated: false,
    });

    this.state = this._state.asObservable();
  }

  get running(): boolean {
    return this._state.value.running;
  }

  get completed(): boolean {
    return this._state.value.completed;
  }

  get terminated(): boolean {
    return this._state.value.terminated;
  }

  onCompleted(): Promise<State> {
    return this.state.pipe(first((state) => state.completed)).toPromise();
  }

  private _stateFieldChange<T extends keyof State>(field: T,
                                                   value: State[T]): void {
    const latest = this._state.value;
    const newState = {...this._state.value};
    newState[field] = value;

    if (newState[field] !== latest[field]) {
      this._state.next(newState);
    }
  }

  private _setTimeoutId(value: number | undefined): void {
    this._timeoutId = value;
    this._stateFieldChange("running", this._timeoutId !== undefined);
  }

  /**
   * Marks the task as incomplete and starts processing.
   */
  start(): void {
    this.reset();
    this.resume();
  }

  /**
   * Resets the task to its initial state. The task will be deemed incomplete.
   */
  reset(): void {
    this._stateFieldChange("completed", false);
    this.task.reset(this);
  }

  /**
   * Resumes the task. This method does not change the completion status of the
   * task. So it is possible to stop a task temporarily and resume it later from
   * where it stopped.
   */
  resume(): void {
    if (this.completed) {
      return;
    }

    if (this._timeoutId !== undefined) {
      this.stop();
    }

    // When we call ``this.resume``, we want the task to resume ASAP. So we do
    // not use ``this._timeout`` here. However, we do not call
    // ``this._workWrapper`` directly because we want to be able to call
    // ``this.resume`` from event handlers. If we did call ``this._workWrapper``
    // directly, we'd be calling this._cycle from inside this._cycle
    this._setTimeoutId(setTimeout(this._boundWrapper, 0));
  }

  /**
   * Convenience method. The bound version of this method
   * (``this._boundWrapper``) is what is called by the timeouts.
   */
  private _workWrapper(): void {
    if (this._work()) {
      this._setTimeoutId(setTimeout(this._boundWrapper, this._timeout));
    }
    else {
      this._stateFieldChange("completed", true);
    }
  }

  /**
   * Keeps the task running by launching cycles only until done or until the
   * maximum time span for one run is reached.
   *
   * @returns False if there is no more work to do. True otherwise.
   */
  private _work(): boolean {
    const startDate = Date.now();
    // tslint:disable-next-line:strict-boolean-expressions no-constant-condition
    while (true) {
      // Give a chance to other operations to work.
      if ((this._maxTimespan > 0) &&
          (Date.now() - startDate) >= this._maxTimespan) {
        return true;
      }

      const ret = this.task.cycle(this);
      if (!ret) {
        return false;
      }
    }
  }

  /**
   * Stops the task.
   */
  stop(): void {
    if (this._timeoutId !== undefined) {
      clearTimeout(this._timeoutId);
    }
    this._setTimeoutId(undefined);
  }

  /**
   * Terminate the task.
   */
  terminate(): void {
    this.stop();
    this._stateFieldChange("terminated", true);
    this._state.complete();
  }
}

//  LocalWords:  MPL maxTimespan workWrapper
