/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2016 Louis-Dominique Dubeau
 */
/* global define module require Promise */
(function boot(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([
            'module',
            'exports'
        ], function stub(module, exports) {
            if (root.LastResort) {
                module.exports = root.LastResort;
                return;
            }
            factory(exports);
        });
    } else if (typeof module === 'object' && module.exports) {
        if (root.LastResort) {
            module.exports = root.LastResort;
            return;
        }
        factory(module.exports);
    } else {
        var exports = root.LastResort = {};
        factory(exports);
    }
}(this, function factory(exports) {
    'use strict';
    'use strict';
    var triggered = false;
    var OnError = function () {
        function OnError(context, options) {
            this._triggered = false;
            this._triggeredUncaughtException = false;
            this._triggeredUnhandledException = false;
            this._onunhandledrejection = null;
            this._context = context;
            this._onerror = this._makeErrorHandler();
            this._onunhandledrejection = null;
            context.addEventListener('error', this._onerror);
            if (options.noUnhandledRejection) {
                return;
            }
            var onunhandledrejection = this._onunhandledrejection = this._makeUnhandledRejectionHandler();
            //
            // It is currently impossible to use ``addEventListener`` robustly in
            // workers to listen for ``unhandledrejection``. In brief,
            // ``addEventListener`` works on Chrome, FF and Opera but fails
            // elsewhere. See this for details:
            //
            // https://github.com/petkaantonov/bluebird/pull/1213
            //
            // There could be more sophisticated ways to detect the issue and work
            // around it but I don't want to put more work into this than
            // necessary. This works. We check that we are in a worker. Bluebird has a
            // ``version`` field, a ``getNewLibraryCopy`` function and has a ``Promise``
            // reference on ``Promise``.
            //
            if (!(typeof self !== 'undefined' && self.importScripts && Promise.version && Promise.getNewLibraryCopy && Promise.Promise === Promise)) {
                context.addEventListener('unhandledrejection', onunhandledrejection);
            } else {
                context.onunhandledrejection = onunhandledrejection;
            }
        }
        OnError.prototype.uninstall = function () {
            var context = this._context;
            if (this._onerror) {
                context.removeEventListener('error', this._onerror);
                this._onerror = null;
            }
            if (!this._onunhandledrejection) {
                return;
            }
            context.removeEventListener('unhandledrejection', this._onunhandledrejection);
            // Undo the workaround if necessary.
            if (context.onunhandledrejection === this._onunhandledrejection) {
                context.onunhandledrejection = null;
            }
            this._onunhandledrejection = null;
        };
        OnError.prototype.register = function (fn) {
            this._registered = fn;
        };
        OnError.prototype._handle = function (evContext, ev) {
            var registered = this._registered;
            this._triggered = true;
            triggered = true;
            // Nothing to do!
            if (!registered) {
                return;
            }
            this.uninstall();
            registered.call(evContext, ev);
        };
        OnError.prototype._makeErrorHandler = function () {
            var _this = this;
            return function (ev) {
                _this._triggeredUncaughtException = true;
                _this._handle(_this, ev);
            };
        };
        OnError.prototype._makeUnhandledRejectionHandler = function () {
            var _this = this;
            return function (ev) {
                _this._triggeredUnhandledException = true;
                _this._handle(_this, ev);
            };
        };
        return OnError;
    }();
    exports.OnError = OnError;
    function install(context, options) {
        options = options || {
            force: false,
            noUnhandledRejection: false
        };
        var force = options.force;
        var previous = context.__LastResortInstalledOnError;
        if (previous) {
            if (!force) {
                throw new Error('trying to set onerror more than once on the same context.');
            }
            previous.uninstall();
        }
        var ret = context.__LastResortInstalledOnError = new OnError(context, options);
        return ret;
    }
    exports.install = install;
    function isInstalled(context) {
        return !!context.__LastResortInstalledOnError;
    }
    exports.isInstalled = isInstalled;
    function wasTriggered() {
        return triggered;
    }
    exports.wasTriggered = wasTriggered;
    exports.version = '0.1.0';
}));
//# sourceMappingURL=last-resort.js.map
