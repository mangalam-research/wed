import { Observable } from "rxjs/Observable";
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
export declare class TaskRunner {
    private readonly task;
    private readonly _timeout;
    private readonly _maxTimespan;
    private readonly _boundWrapper;
    private _timeoutId;
    private _state;
    state: Observable<State>;
    /**
     * @param task The computation controlled by this runner.
     *
     * @param options The options governing this runner.
     */
    constructor(task: Task, options?: TaskRunnerOptions);
    readonly running: boolean;
    readonly completed: boolean;
    readonly terminated: boolean;
    onCompleted(): Promise<State>;
    private _stateFieldChange<T>(field, value);
    private _setTimeoutId(value);
    /**
     * Marks the task as incomplete and starts processing.
     */
    start(): void;
    /**
     * Resets the task to its initial state. The task will be deemed incomplete.
     */
    reset(): void;
    /**
     * Resumes the task. This method does not change the completion status of the
     * task. So it is possible to stop a task temporarily and resume it later from
     * where it stopped.
     */
    resume(): void;
    /**
     * Convenience method. The bound version of this method
     * (``this._boundWrapper``) is what is called by the timeouts.
     */
    private _workWrapper();
    /**
     * Keeps the task running by launching cycles only until done or until the
     * maximum time span for one run is reached.
     *
     * @returns False if there is no more work to do. True otherwise.
     */
    private _work();
    /**
     * Stops the task.
     */
    stop(): void;
    /**
     * Terminate the task.
     */
    terminate(): void;
}
