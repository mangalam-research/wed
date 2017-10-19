define(["require", "exports", "module", "bluebird", "bluejax", "chai"], function (require, exports, module, Promise, bluejax_1, chai_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function delay(timeout) {
        return new Promise(function (resolve) { return setTimeout(resolve, timeout); });
    }
    exports.delay = delay;
    function waitFor(fn, pollDelay, timeout) {
        if (pollDelay === void 0) { pollDelay = 100; }
        var start = Date.now();
        function check() {
            var ret = fn();
            if (ret) {
                return ret;
            }
            if ((timeout !== undefined) && (Date.now() - start > timeout)) {
                return false;
            }
            return delay(pollDelay).then(check);
        }
        // TypeScript does not like Promise.resolve(check).
        return Promise.resolve().then(check);
    }
    exports.waitFor = waitFor;
    function waitForSuccess(fn, pollDelay, timeout) {
        return waitFor(function () {
            try {
                fn();
                return true;
            }
            catch (e) {
                if (e instanceof chai_1.AssertionError) {
                    return false;
                }
                throw e;
            }
        }, pollDelay, timeout).then(function () { return undefined; });
    }
    exports.waitForSuccess = waitForSuccess;
    // tslint:disable-next-line:completed-docs
    var DataProvider = /** @class */ (function () {
        function DataProvider(base) {
            this.base = base;
            this.cache = Object.create(null);
            this.parser = new DOMParser();
            this.registered = Object.create(null);
        }
        DataProvider.prototype.register = function (name, path) {
            this.registered[name] = path;
        };
        DataProvider.prototype.getNamed = function (name) {
            var path = this.registered[name];
            return this.getText(path);
        };
        DataProvider.prototype.getNamedDoc = function (name) {
            var path = this.registered[name];
            return this.getDoc(path);
        };
        DataProvider.prototype.getText = function (path) {
            return this._getText(this.base + path);
        };
        DataProvider.prototype._getText = function (path) {
            var _this = this;
            return Promise.resolve().then(function () {
                var cached = _this.cache[path];
                if (cached !== undefined) {
                    return cached;
                }
                return bluejax_1.ajax({ url: path, dataType: "text" })
                    .then(function (data) {
                    _this.cache[path] = data;
                    return data;
                });
            });
        };
        DataProvider.prototype.getDoc = function (path) {
            var _this = this;
            return this._getText(this.base + path).then(function (data) {
                return _this.parser.parseFromString(data, "text/xml");
            });
        };
        return DataProvider;
    }());
    exports.DataProvider = DataProvider;
    function expectError(fn, errorLike, pattern) {
        return fn().then(function () {
            throw new Error("should have thrown an error");
        }, 
        // tslint:disable-next-line:no-any
        function (ex) {
            if (!(errorLike instanceof RegExp || typeof errorLike === "string")) {
                chai_1.expect(ex).to.be.instanceof(errorLike);
            }
            else {
                pattern = errorLike;
            }
            if (pattern instanceof RegExp) {
                chai_1.expect(ex).to.have.property("message").match(pattern);
            }
            else {
                chai_1.expect(ex).to.have.property("message").equal(pattern);
            }
        });
    }
    exports.expectError = expectError;
    // tslint:disable-next-line:no-any
    function makeFakePasteEvent(clipboardData) {
        var event = new $.Event("paste");
        event.originalEvent = {
            clipboardData: clipboardData,
            // tslint:disable-next-line:no-empty
            stopImmediatePropagation: function () { },
            // tslint:disable-next-line:no-empty
            preventDefault: function () { },
            // tslint:disable-next-line:no-empty
            stopPropagation: function () { },
        };
        return event;
    }
    exports.makeFakePasteEvent = makeFakePasteEvent;
});

//# sourceMappingURL=util.js.map
