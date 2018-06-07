/**
 * Task abstraction for wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
define(["require", "exports", "rxjs", "rxjs/operators"], function (require, exports, rxjs_1, operators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A task is a computation that should produce a definite goal after a finite
     * time. This class is used to allow the task to happen in a way that does not
     * completely block the JavaScript virtual machine. The task will happen in
     * cycles that run for a maximum amount of time before relinquishing control.
     */
    var TaskRunner = /** @class */ (function () {
        /**
         * @param task The computation controlled by this runner.
         *
         * @param options The options governing this runner.
         */
        function TaskRunner(task, options) {
            if (options === void 0) { options = {}; }
            this.task = task;
            this._timeout = 0;
            this._maxTimespan = 100;
            this._boundWrapper = this._workWrapper.bind(this);
            var keys = ["timeout", "maxTimespan"];
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                var value = options[key];
                if (value === undefined) {
                    continue;
                }
                if (value < 0) {
                    throw new Error("the value for " + key + " cannot be negative");
                }
                // tslint:disable-next-line:no-any
                this["_" + key] = options[key];
            }
            this._state = new rxjs_1.BehaviorSubject({
                running: false,
                completed: false,
                terminated: false,
            });
            this.state = this._state.asObservable();
        }
        Object.defineProperty(TaskRunner.prototype, "running", {
            get: function () {
                return this._state.value.running;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TaskRunner.prototype, "completed", {
            get: function () {
                return this._state.value.completed;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TaskRunner.prototype, "terminated", {
            get: function () {
                return this._state.value.terminated;
            },
            enumerable: true,
            configurable: true
        });
        TaskRunner.prototype.onCompleted = function () {
            return this.state.pipe(operators_1.first(function (state) { return state.completed; })).toPromise();
        };
        TaskRunner.prototype._stateFieldChange = function (field, value) {
            var latest = this._state.value;
            var newState = __assign({}, this._state.value);
            newState[field] = value;
            if (newState[field] !== latest[field]) {
                this._state.next(newState);
            }
        };
        TaskRunner.prototype._setTimeoutId = function (value) {
            this._timeoutId = value;
            this._stateFieldChange("running", this._timeoutId !== undefined);
        };
        /**
         * Marks the task as incomplete and starts processing.
         */
        TaskRunner.prototype.start = function () {
            this.reset();
            this.resume();
        };
        /**
         * Resets the task to its initial state. The task will be deemed incomplete.
         */
        TaskRunner.prototype.reset = function () {
            this._stateFieldChange("completed", false);
            this.task.reset(this);
        };
        /**
         * Resumes the task. This method does not change the completion status of the
         * task. So it is possible to stop a task temporarily and resume it later from
         * where it stopped.
         */
        TaskRunner.prototype.resume = function () {
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
        };
        /**
         * Convenience method. The bound version of this method
         * (``this._boundWrapper``) is what is called by the timeouts.
         */
        TaskRunner.prototype._workWrapper = function () {
            if (this._work()) {
                this._setTimeoutId(setTimeout(this._boundWrapper, this._timeout));
            }
            else {
                this._stateFieldChange("completed", true);
            }
        };
        /**
         * Keeps the task running by launching cycles only until done or until the
         * maximum time span for one run is reached.
         *
         * @returns False if there is no more work to do. True otherwise.
         */
        TaskRunner.prototype._work = function () {
            var startDate = Date.now();
            // tslint:disable-next-line:strict-boolean-expressions no-constant-condition
            while (true) {
                // Give a chance to other operations to work.
                if ((this._maxTimespan > 0) &&
                    (Date.now() - startDate) >= this._maxTimespan) {
                    return true;
                }
                var ret = this.task.cycle(this);
                if (!ret) {
                    return false;
                }
            }
        };
        /**
         * Stops the task.
         */
        TaskRunner.prototype.stop = function () {
            if (this._timeoutId !== undefined) {
                clearTimeout(this._timeoutId);
            }
            this._setTimeoutId(undefined);
        };
        /**
         * Terminate the task.
         */
        TaskRunner.prototype.terminate = function () {
            this.stop();
            this._stateFieldChange("terminated", true);
            this._state.complete();
        };
        return TaskRunner;
    }());
    exports.TaskRunner = TaskRunner;
});
//  LocalWords:  MPL maxTimespan workWrapper
//# sourceMappingURL=task-runner.js.map