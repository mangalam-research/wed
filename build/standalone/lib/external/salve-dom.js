(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("salve"));
	else if(typeof define === 'function' && define.amd)
		define(["salve"], factory);
	else if(typeof exports === 'object')
		exports["salve-dom"] = factory(require("salve"));
	else
		root["salve-dom"] = factory(root["salve"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_2__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * A listener class.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The ``Event`` parameter passed to the class must be an interface that maps
 * event names to the type of data that the event subscribers will get.
 *
 *     interface Events {
 *       "foo": FooData,
 *       "bar": BarData,
 *     }
 *
 * The code that wishes to emit an event calls ``_emit`` to emit events. For
 * instance, if ``_emit("foo", {beep: 3})`` is called, this will result in all
 * listeners on event ``"foo"`` being called and passed the object ``{beep:
 * 3}``. Any listener returning the value ``false`` ends the processing of the
 * event.
 *
 * This class also supports listening on events in a generic way, by listening
 * to the event named "\*". Listeners on such events have the signature
 * ``listener(name, ev)``. When the ``_emit`` call above is executed such
 * listener will be called with ``name`` set to ``"foo"`` and ``ev`` set to
 * ``{beep: 3}``. Listeners on "\*" are executed before the other
 * listeners. Therefore, if they return the value ``false``, they prevent the
 * other listeners from executing.
 */
var EventEmitter = (function () {
    function EventEmitter() {
        this._eventListeners = Object.create(null);
        this._generalListeners = [];
        this._trace = false;
    }
    EventEmitter.prototype.addEventListener = function (eventName, listener) {
        if (eventName === "*") {
            this._generalListeners.push(listener);
        }
        else {
            var listeners = this._eventListeners[eventName];
            if (listeners === undefined) {
                listeners = this._eventListeners[eventName] = [];
            }
            listeners.push(listener);
        }
    };
    EventEmitter.prototype.addOneTimeEventListener = function (eventName, listener) {
        var _this = this;
        // We perform casts as any here to indicate to TypeScript that it is
        // safe to pass this stub.
        var me = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _this.removeEventListener(eventName, me);
            return listener.apply(_this, args);
        };
        this.addEventListener(eventName, me);
        return me;
    };
    EventEmitter.prototype.removeEventListener = function (eventName, listener) {
        var listeners = (eventName === "*") ?
            this._generalListeners :
            this._eventListeners[eventName];
        if (listeners === undefined) {
            return;
        }
        var index = listeners.lastIndexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    };
    EventEmitter.prototype.removeAllListeners = function (eventName) {
        if (eventName === "*") {
            this._generalListeners = [];
        }
        else {
            this._eventListeners[eventName] = [];
        }
    };
    /**
     * This is the function that the class using this mixin must call to
     * indicate that an event has occurred.
     *
     * @param eventName The name of the event to emit.
     *
     * @param ev The event data to provide to handlers. The type can be
     * anything.
     */
    EventEmitter.prototype._emit = function (eventName, ev) {
        if (this._trace) {
            // tslint:disable-next-line: no-console
            console.log("simple_event_emitter emitting:", eventName, "with:", ev);
        }
        {
            var listeners = this._generalListeners;
            if (listeners.length > 0) {
                // We take a copy so that if any of the handlers add or remove
                // listeners, they don't disturb our work here.
                listeners = listeners.slice();
                for (var _i = 0, listeners_1 = listeners; _i < listeners_1.length; _i++) {
                    var listener = listeners_1[_i];
                    var ret = listener.call(undefined, eventName, ev);
                    if (ret === false) {
                        return;
                    }
                }
            }
        }
        {
            var listeners = this._eventListeners[eventName];
            if (listeners !== undefined && listeners.length > 0) {
                // We take a copy so that if any of the handlers add or remove
                // listeners, they don't disturb our work here.
                listeners = listeners.slice();
                for (var _a = 0, listeners_2 = listeners; _a < listeners_2.length; _a++) {
                    var listener = listeners_2[_a];
                    var ret = listener.call(undefined, ev);
                    if (ret === false) {
                        return;
                    }
                }
            }
        }
    };
    return EventEmitter;
}());
exports.EventEmitter = EventEmitter;
//  LocalWords:  Mangalam MPL Dubeau noop ev mixin

//# sourceMappingURL=event_emitter.js.map


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This is required to work around a problem when extending built-in classes
 * like ``Error``. Some of the constructors for these classes return a value
 * from the constructor, which is then picked up by the constructors generated
 * by TypeScript (same with ES6 code transpiled through Babel), and this messes
 * up the inheritance chain.
 *
 * See https://github.com/Microsoft/TypeScript/issues/12123.
 */
function fixPrototype(obj, parent) {
    var oldProto = Object.getPrototypeOf !== undefined ?
        Object.getPrototypeOf(obj) :
        obj.__proto__;
    if (oldProto !== parent) {
        if (Object.setPrototypeOf !== undefined) {
            Object.setPrototypeOf(obj, parent.prototype);
        }
        else {
            obj.__proto__ = parent.prototype;
        }
    }
}
exports.fixPrototype = fixPrototype;

//# sourceMappingURL=tools.js.map


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Main module of salve-dom.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var salve_1 = __webpack_require__(2);
var event_emitter_1 = __webpack_require__(0);
var tools_1 = __webpack_require__(1);
function _indexOf(parent, needle) {
    return Array.prototype.indexOf.call(parent, needle);
}
function isAttr(it) {
    var attrNodeType = Node.ATTRIBUTE_NODE;
    // We check that ``attr_node_type`` is not undefined because eventually
    // ``ATTRIBUTE_NODE`` will be removed from the ``Node`` interface, and then we
    // could be testing ``undefined === undefined`` for objects which are not
    // attributes, which would return ``true``. The function is not very strict
    // but it should not be too lax either.
    return it instanceof Attr ||
        ((attrNodeType !== undefined) && (it.nodeType === attrNodeType));
}
exports.isAttr = isAttr;
// validation_stage values
var Stage;
(function (Stage) {
    Stage[Stage["START_TAG"] = 1] = "START_TAG";
    Stage[Stage["CONTENTS"] = 2] = "CONTENTS";
    Stage[Stage["END_TAG"] = 3] = "END_TAG";
})(Stage || (Stage = {}));
// Working state values
var WorkingState;
(function (WorkingState) {
    /**
     * The validator is stopped but has not completed a validation pass yet.
     */
    WorkingState[WorkingState["INCOMPLETE"] = 1] = "INCOMPLETE";
    /**
     * The validator is working on validating the document.
     */
    WorkingState[WorkingState["WORKING"] = 2] = "WORKING";
    /**
     * The validator is stopped and has found the document invalid. Note that this
     * state happens *only* if the whole document was validated.
     */
    WorkingState[WorkingState["INVALID"] = 3] = "INVALID";
    /**
     * The validator is stopped and has found the document valid. Note that this
     * state happens *only* if the whole document was validated.
     */
    WorkingState[WorkingState["VALID"] = 4] = "VALID";
})(WorkingState = exports.WorkingState || (exports.WorkingState = {}));
/**
 * Data structure for recording progress.
 *
 * @private
 *
 * @param partDone The part of the document done so far.
 *
 * @param portion A ProgressState object is created in relation to an
 * element. The element covers portion X of the total document. This parameter
 * should be X.
 */
var ProgressState = (function () {
    function ProgressState(partDone, portion) {
        this.partDone = partDone;
        this.portion = portion;
    }
    return ProgressState;
}());
//
// Note: the Validator class adds information to the Element nodes it
// is working with by adding expando properties that start with
// "wed_event_". This deemed acceptable here because:
//
// * The tree on which a Validator object operates is not supposed to
//   be open to third party software. Even if it were, the chance of a
//   clash is small.
//
// * The values of the expando properties are primitives (not objects
//   or other elements).
//
// * We don't care about browsers or situations where expando
//   properties are not supported.
//
//
// These are constants. So create them once rather than over and over
// again.
//
var ENTER_CONTEXT_EVENT = new salve_1.Event("enterContext");
var LEAVE_START_TAG_EVENT = new salve_1.Event("leaveStartTag");
var LEAVE_CONTEXT_EVENT = new salve_1.Event("leaveContext");
/**
 * Exception to be raised if we can't find our place in the events list. It is
 * only to be raised by code in this module but the documentation is left public
 * for diagnosis purposes.
 */
var EventIndexException = (function (_super) {
    __extends(EventIndexException, _super);
    function EventIndexException() {
        var _this = _super.call(this, "undefined event_index; _validateUpTo should have taken care of that") || this;
        tools_1.fixPrototype(_this, EventIndexException);
        return _this;
    }
    return EventIndexException;
}(Error));
// This private utility function checks whether an event is possible
// only because there is a name_pattern wildcard that allows it.
function isPossibleDueToWildcard(walker, eventName, ns, name) {
    var evs = walker.possible().toArray();
    var matched = false;
    for (var _i = 0, evs_1 = evs; _i < evs_1.length; _i++) {
        var ev = evs_1[_i];
        if (ev.params[0] !== eventName) {
            continue;
        }
        var namePattern = ev.params[1];
        var matches = namePattern.match(ns, name);
        // Keep track of whether it ever matched anything.
        matched = matched || matches;
        // We already know that it matches, and this is not merely due
        // to a wildcard.
        if (matches && !namePattern.wildcardMatch(ns, name)) {
            return false;
        }
    }
    // If it never matched any pattern at all, then we must return false.  If we
    // get here and matched is true then it means that it matched all patterns due
    // to wildcards.
    return matched;
}
/**
 * A document validator. The validator assumes that the DOM tree it uses for
 * validation is always normalized: that is, there are no empty text nodes and
 * there cannot be two adjacent text nodes.
 *
 * This validator operates by scheduling work cycles. Given the way JavaScript
 * works, if the validator just validated the whole document in one shot, it
 * would take all processing power until done, and everything else would
 * block. Rather than do this, it performs a bit of work, stops, and performs
 * another bit, etc. Each bit of work is called a "cycle". The options passed to
 * the validator at creation determine how long a cycle may last and how much
 * time elapses between cycles. (Yes, using ``Worker``s has been considered as
 * an option but it would complicate the whole deal by quite a bit due to
 * communication costs between a ``Worker`` and the main process.)
 *
 * @param schema A ``Grammar`` object that has already been produced from
 * ``salve``'s ``constructTree``.
 *
 * @param root The root of the DOM tree to validate. This root contains the
 * document to validate but is not part of the document itself.
 *
 * @param options Some options driving how the validator works.
 */
var Validator = (function () {
    function Validator(schema, root, options) {
        if (options === void 0) { options = {}; }
        this.schema = schema;
        this.root = root;
        this._cycleEntered = 0;
        this._timeout = 200;
        this._maxTimespan = 100;
        this._resetting = false;
        this._errors = [];
        this._boundWrapper = this._workWrapper.bind(this);
        // Validation state
        this._validationEvents = [];
        this._workingState = WorkingState.INCOMPLETE;
        this._partDone = 0;
        this._validationStage = Stage.CONTENTS;
        this._previousChild = null;
        this._validationStack = [new ProgressState(0, 1)];
        this._walkerCache = Object.create(null);
        this._walkerCacheMax = -1;
        this._prefix = "salveDom";
        // The distance between walkers under which we skip saving a
        // walker in the cache.
        this._walkerCacheGap = 100;
        this._events = new event_emitter_1.EventEmitter();
        var keys = ["timeout", "maxTimespan",
            "walkerCacheGap"];
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var key = keys_1[_i];
            var value = options[key];
            if (value === undefined) {
                continue;
            }
            if (value < 0) {
                throw new Error("the value for " + key + " cannot be negative");
            }
            this["_" + key] = options[key];
        }
        if (options.prefix !== undefined) {
            this._prefix = options.prefix;
        }
        this._curEl = this.root;
        // This prevents an infinite loop when speculativelyValidate is
        // called to validate a text node.
        this._setNodeProperty(this._curEl, "EventIndexAfterStart", this._validationEvents.length);
        this._setWorkingState(WorkingState.INCOMPLETE, 0);
        this._validationWalker = this.schema.newWalker();
        this.events = this._events;
    }
    Validator.prototype.makeKey = function (key) {
        return "" + this._prefix + key;
    };
    /**
     * Function allowing to get a custom properties set on ``Node`` objects by
     * this class.
     */
    Validator.prototype.getNodeProperty = function (node, key) {
        return node[this.makeKey(key)];
    };
    /**
     * Function allowing to set a custom properties set on ``Node`` objects by
     * this class.
     */
    Validator.prototype._setNodeProperty = function (node, key, value) {
        node[this.makeKey(key)] = value;
    };
    Validator.prototype._clearNodeProperties = function (node) {
        var keys = [
            "EventIndexAfter",
            "EventIndexAfterStart",
            "EventIndexBeforeAttributes",
            "EventIndexAfterAttributes",
            "PossibleDueToWildcard",
        ];
        for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
            var key = keys_2[_i];
            delete node[this.makeKey(key)];
        }
    };
    /**
     * Starts the background validation process.
     */
    Validator.prototype.start = function () {
        if (this._timeoutId !== undefined) {
            this._stop(WorkingState.WORKING);
        }
        // When we call ``this.start``, we want the validation to start ASAP. So we
        // do not use ``this._timeout`` here. However, we do not call
        // ``this._workWrapper`` directly because we want to be able to call
        // ``this.start`` from event handlers. If we did call ``this._workWrapper``
        // directly, we'd be calling this._cycle from inside this._cycle, which is
        // results in an internal error.
        this._timeoutId = setTimeout(this._boundWrapper, 0);
    };
    /**
     * Get the namespaces defined in the schema passed to the
     * Validator.
     *
     * @returns The namespaces known to the schema.
     */
    Validator.prototype.getSchemaNamespaces = function () {
        return this.schema.getNamespaces();
    };
    /**
     * Get the namespaces used in the document. This method does not cache its
     * information and scan the whole document independently of the current
     * validation status.
     *
     * @returns An object whose keys are namespace prefixes and values are lists
     * of namespace URIs.  The values are lists because prefixes can be redefined
     * in a document.
     */
    Validator.prototype.getDocumentNamespaces = function () {
        var ret = {};
        function _process(node) {
            if (node === null) {
                return;
            }
            var attrIxLim = node.attributes.length;
            for (var attrIx = 0; attrIx < attrIxLim; ++attrIx) {
                var attr = node.attributes[attrIx];
                if (attr.name.lastIndexOf("xmlns", 0) === 0) {
                    var key = attr.name.slice(6);
                    var array = ret[key];
                    if (array === undefined) {
                        array = ret[key] = [];
                    }
                    array.push(attr.value);
                }
            }
            var child = node.firstChild;
            while (child !== null) {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    _process(child);
                }
                child = child.nextSibling;
            }
        }
        _process(this.root.firstChild);
        return ret;
    };
    /**
     * Convenience method. The bound version of this method
     * (``this._boundWrapper``) is what is called by the timeouts to perform the
     * background validation.
     */
    Validator.prototype._workWrapper = function () {
        if (this._work()) {
            this._timeoutId = setTimeout(this._boundWrapper, this._timeout);
        }
    };
    /**
     * Controller method for the background validation. Keeps the validator
     * running only until done or until the maximum time span for one run
     * of the validator is reached.
     *
     * @returns False if there is no more work to do. True otherwise.
     */
    Validator.prototype._work = function () {
        var startDate = Date.now();
        while (true) {
            // Give a chance to other operations to work.
            if ((this._maxTimespan > 0) &&
                (Date.now() - startDate) >= this._maxTimespan) {
                return true;
            }
            var ret = this._cycle();
            if (!ret) {
                return false;
            }
        }
    };
    /**
     * Performs one cycle of validation. "One cycle" is an arbitrarily
     * small unit of work.
     *
     * @returns False if there is no more work to be done. True otherwise.
     *
     * @throws {Error} When there is an internal error.
     */
    // tslint:disable-next-line:max-func-body-length cyclomatic-complexity
    Validator.prototype._cycle = function () {
        var _this = this;
        // If we got here after a reset, then we've finished resetting.  If we were
        // not resetting, then this is a noop.
        this._resetting = false;
        //
        // This check is meant to catch problems that could be hard to diagnose if
        // wed or one of its modes had a bug such that `_cycle` is reentered from
        // `_cycle`. This could happen during error processing, for instance. Error
        // processing causes wed to process the errors, which causes changes in the
        // GUI tree, which *could* (this would be a bug) cause the code of a mode to
        // execute something like `getErrorsFor`, which could cause `_cycle` to be
        // reentered.
        //
        if (this._cycleEntered > 0) {
            throw new Error("internal error: _cycle is being reentered");
        }
        if (this._cycleEntered < 0) {
            throw new Error("internal error: _cycleEntered negative");
        }
        //
        // IMPORTANT: This variable must be decremented before exiting this
        // method. A try...finally statement is not used here because it would
        // prevent some virtual machines from optimizing this function.
        //
        this._cycleEntered++;
        var walker = this._validationWalker;
        var stack = this._validationStack;
        var events = this._validationEvents;
        var portion = stack[0].portion;
        var stage = this._validationStage;
        var _loop_1 = function () {
            var curEl = this_1._curEl;
            switch (stage) {
                case Stage.START_TAG: {
                    // The logic is such that if we get here curEl must be an Element.
                    curEl = curEl;
                    stack.unshift(new ProgressState(this_1._partDone, portion));
                    // Handle namespace declarations. Yes, this must happen before we deal
                    // with the tag name.
                    this_1._fireAndProcessEvent(walker, ENTER_CONTEXT_EVENT, curEl, 0);
                    var attrIxLim = curEl.attributes.length;
                    for (var attrIx = 0; attrIx < attrIxLim; ++attrIx) {
                        var attr = curEl.attributes[attrIx];
                        if (attr.name === "xmlns") {
                            this_1._fireAndProcessEvent(walker, new salve_1.Event("definePrefix", "", attr.value), curEl, 0);
                        }
                        else if (attr.name.lastIndexOf("xmlns:", 0) === 0) {
                            this_1._fireAndProcessEvent(walker, new salve_1.Event("definePrefix", attr.name.slice(6), attr.value), curEl, 0);
                        }
                    }
                    var tagName = curEl.tagName;
                    // tslint:disable-next-line:no-non-null-assertion
                    var parent_1 = curEl.parentNode;
                    var curElIndex = _indexOf(parent_1.childNodes, curEl);
                    var ename = walker.resolveName(tagName, false);
                    if (ename === undefined) {
                        this_1._processEventResult([new salve_1.ValidationError("cannot resolve the name " + tagName)], parent_1, curElIndex);
                        // This allows us to move forward. It will certainly cause a
                        // validation error, and send salve into its recovery mode for unknown
                        // elements.
                        ename = new salve_1.EName("", tagName);
                    }
                    // Check whether this element is going to be allowed only
                    // due to a wildcard.
                    this_1._setPossibleDueToWildcard(curEl, walker, "enterStartTag", ename.ns, ename.name);
                    this_1._fireAndProcessEvent(walker, new salve_1.Event("enterStartTag", ename.ns, ename.name), parent_1, curElIndex);
                    this_1._setNodeProperty(curEl, "EventIndexBeforeAttributes", events.length);
                    this_1._fireAttributeEvents(walker, curEl);
                    this_1._setNodeProperty(curEl, "EventIndexAfterAttributes", events.length);
                    // Leave the start tag.
                    this_1._fireAndProcessEvent(walker, LEAVE_START_TAG_EVENT, curEl, 0);
                    stage = this_1._validationStage = Stage.CONTENTS;
                    this_1._setNodeProperty(curEl, "EventIndexAfterStart", events.length);
                    this_1._cycleEntered--;
                    return { value: true };
                    // break would be unreachable.
                }
                case Stage.CONTENTS: {
                    var node = (this_1._previousChild === null) ?
                        // starting from scratch
                        curEl.firstChild :
                        // already validation contents
                        this_1._previousChild.nextSibling;
                    var textAccumulator_1 = [];
                    var textAccumulatorNode_1;
                    var flushText = function () {
                        if (textAccumulator_1.length !== 0) {
                            var event_1 = new salve_1.Event("text", textAccumulator_1.join(""));
                            var eventResult = walker.fireEvent(event_1);
                            if (eventResult instanceof Array) {
                                if (textAccumulatorNode_1 === undefined) {
                                    throw new Error("flushText running with undefined node");
                                }
                                // We are never without a parentNode here.
                                // tslint:disable-next-line:no-non-null-assertion
                                var parent_2 = textAccumulatorNode_1.parentNode;
                                _this._processEventResult(eventResult, parent_2, _indexOf(parent_2.childNodes, textAccumulatorNode_1));
                            }
                        }
                        textAccumulator_1 = [];
                        textAccumulatorNode_1 = undefined;
                    };
                    while (node !== null) {
                        switch (node.nodeType) {
                            case Node.TEXT_NODE:
                                // Salve does not allow multiple text events in a row. If text is
                                // encountered, then all the text must be passed to salve as a
                                // single event. We record the text and will flush it to salve
                                // later.
                                textAccumulator_1.push(node.data);
                                if (textAccumulatorNode_1 === undefined) {
                                    textAccumulatorNode_1 = node;
                                }
                                break;
                            case Node.ELEMENT_NODE:
                                flushText();
                                portion /= curEl.childElementCount;
                                this_1._curEl = curEl = node;
                                stage = this_1._validationStage = Stage.START_TAG;
                                this_1._previousChild = null;
                                return "continue-stage_change";
                            case Node.COMMENT_NODE:
                                break; // We just skip over comment nodes.
                            default:
                                throw new Error("unexpected node type: " + node.nodeType);
                        }
                        node = node.nextSibling;
                    }
                    flushText();
                    stage = this_1._validationStage = Stage.END_TAG;
                    break;
                }
                case Stage.END_TAG: {
                    // We've reached the end...
                    if (curEl === this_1.root) {
                        var eventResult = walker.end();
                        if (eventResult instanceof Array) {
                            this_1._processEventResult(eventResult, curEl, curEl.childNodes.length);
                        }
                        this_1._runDocumentValidation();
                        this_1._setNodeProperty(curEl, "EventIndexAfter", events.length);
                        this_1._partDone = 1;
                        this_1._stop(this_1._errors.length > 0 ? WorkingState.INVALID :
                            WorkingState.VALID);
                        this_1._cycleEntered--;
                        return { value: false };
                    }
                    // we need it later
                    var originalElement = curEl;
                    var tagName = curEl.tagName;
                    var ename = walker.resolveName(tagName, false);
                    if (ename === undefined) {
                        // We just produce the name name we produced when we encountered the
                        // start tag.
                        ename = new salve_1.EName("", tagName);
                    }
                    this_1._fireAndProcessEvent(walker, new salve_1.Event("endTag", ename.ns, ename.name), curEl, curEl.childNodes.length);
                    this_1._fireAndProcessEvent(walker, LEAVE_CONTEXT_EVENT, curEl, curEl.childNodes.length);
                    // Go back to the parent
                    this_1._previousChild = curEl;
                    // We are never without a parentNode here.
                    // tslint:disable-next-line:no-non-null-assertion
                    this_1._curEl = curEl = curEl.parentNode;
                    var nextDone = this_1._partDone;
                    if (curEl !== this_1.root) {
                        stack.shift();
                        var first = stack[0];
                        nextDone = first.partDone += portion;
                        portion = first.portion;
                    }
                    this_1._setWorkingState(WorkingState.WORKING, nextDone);
                    this_1._setNodeProperty(originalElement, "EventIndexAfter", this_1._validationEvents.length);
                    stage = this_1._validationStage = Stage.CONTENTS;
                    this_1._cycleEntered--;
                    return { value: true };
                }
                // break; would be unreachable
                default:
                    throw new Error("unexpected state");
            }
        };
        var this_1 = this;
        stage_change: while (true) {
            var state_1 = _loop_1();
            if (typeof state_1 === "object")
                return state_1.value;
            switch (state_1) {
                case "continue-stage_change": continue stage_change;
            }
        }
    };
    /**
     * Stops background validation.
     */
    Validator.prototype.stop = function () {
        this._stop();
    };
    /**
     * This private method takes an argument that allows setting the working state
     * to a specific value. This is useful to reduce the number of
     * ``state-update`` events emitted when some internal operations are
     * performed. The alternative would be to perform a state change before or
     * after the call to ``stop``, which would result in more events being
     * emitted.
     *
     * If the parameter is unused, then the logic is that if we were not yet in a
     * VALID or INVALID state, the stopping now leads to the INCOMPLETE state.
     *
     * @param state The state with which to stop.
     */
    Validator.prototype._stop = function (state) {
        if (this._timeoutId !== undefined) {
            clearTimeout(this._timeoutId);
        }
        this._timeoutId = undefined;
        if (state === undefined) {
            // We are stopping prematurely, update the state
            if (this._workingState === WorkingState.WORKING) {
                this._setWorkingState(WorkingState.INCOMPLETE, this._partDone);
            }
        }
        else {
            this._setWorkingState(state, this._partDone);
        }
    };
    /**
     * Run document-level validation that cannot be modeled by Relax NG.  The
     * default implementation does nothing. Deriving classes may override it to
     * call [[_processError]].
     */
    Validator.prototype._runDocumentValidation = function () { }; // tslint:disable-line: no-empty
    /**
     * Restarts validation from a specific point. After the call returns, the
     * background validation will be in effect. (So calling it on a stopped
     * validator has the side effect of starting it.)
     *
     * @param node The element to start validation from.
     */
    Validator.prototype.restartAt = function (node) {
        this.resetTo(node);
        this.start();
    };
    /**
     * Reset validation to continue from a certain point.
     *
     * @param node The element to start validation from.
     */
    Validator.prototype.resetTo = function (node) {
        // We use `this._resetting` to avoid a costly reinitialization if this
        // method is called twice in a row before any work has had a chance to be
        // done.
        if (!this._resetting) {
            this._resetting = true;
            this._resetTo(node);
        }
    };
    Validator.prototype._erase = function (el) {
        this._clearNodeProperties(el);
        var child = el.firstElementChild;
        while (child !== null) {
            this._erase(child);
            child = child.nextElementSibling;
        }
    };
    /**
     * Resets validation to continue from a specific point. Any further work done
     * by the validator will start from the point specified.
     *
     * @param node The element to start validation from.
     *
     * @emits module:validator~Validator#reset-errors
     */
    Validator.prototype._resetTo = function (node) {
        // An earlier implementation was trying to be clever and to avoid restarting
        // much earlier than strictly needed. That ended up being more costly than
        // doing this primitive restart from 0 no matter what. Eventually, Validator
        // should be updated so that on large documents, restarting from a location
        // towards the end does not require revalidating the whole document. For
        // now, since wed is used for smallish documents, it would be a premature
        // optimization.
        this._erase(this.root);
        this._validationStage = Stage.CONTENTS;
        this._previousChild = null;
        this._validationWalker = this.schema.newWalker();
        this._validationEvents = [];
        this._curEl = this.root;
        this._partDone = 0;
        this._errors = [];
        this._walkerCache = Object.create(null);
        this._walkerCacheMax = -1;
        /**
         * Tells the listener that it must reset its list of errors.
         *
         * @event module:validator~Validator#reset-errors
         * @type {Object}
         * @property {integer} at The index of the first error that must
         * be deleted. This error and all those after it must be deleted.
         */
        this._events._emit("reset-errors", { at: 0 });
    };
    /**
     * Sets the working state of the validator. Emits a "state-update"
     * event if the state has changed.
     *
     * @param newState The new state of the validator.
     *
     * @param newDone The new portion of work done.
     *
     * @emits module:validator~Validator#state-update
     */
    Validator.prototype._setWorkingState = function (newState, newDone) {
        var changed = false;
        if (this._workingState !== newState) {
            this._workingState = newState;
            changed = true;
        }
        if (this._partDone !== newDone) {
            this._partDone = newDone;
            changed = true;
        }
        if (changed) {
            /**
             * Tells the listener that the validator has changed state.
             *
             * @event module:validator~Validator#state-update
             */
            this._events._emit("state-update", { state: newState, partDone: newDone });
        }
    };
    /**
     * Gets the validator working state.
     *
     * @returns The working state
     */
    Validator.prototype.getWorkingState = function () {
        return {
            state: this._workingState,
            partDone: this._partDone,
        };
    };
    Object.defineProperty(Validator.prototype, "errors", {
        /**
         * The current set of errors.
         */
        get: function () {
            return this._errors.slice();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Processes the result of firing a tag event. It will emit an "error"
     * event for each error.
     *
     * @param results The results of the walker's ``fireEvent`` call.
     *
     * @param node The data node to which the result belongs.
     *
     * @param index The index into ``node`` to which the result belongs.
     *
     * @emits module:validator~Validator#error
     */
    Validator.prototype._processEventResult = function (results, node, index) {
        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
            var result = results_1[_i];
            this._processError({ error: result, node: node, index: index });
        }
    };
    /**
     * This method should be called whenever a new error is detected. It
     * records the error and emits the corresponding event.
     *
     * @param error The error found.
     *
     * @emits module:validator~Validator#error
     */
    Validator.prototype._processError = function (error) {
        this._errors.push(error);
        /**
         * Tells the listener that an error has occurred.
         *
         * @event module:validator~Validator#error
         * @type {Object}
         * @property {Object} error The validation error.
         * @property {Node} node The node where the error occurred.
         * @property {integer} index The index in this node.
         */
        this._events._emit("error", error);
    };
    /**
     * Fires all the attribute events for a given element.
     */
    Validator.prototype._fireAttributeEvents = function (walker, el) {
        // Find all attributes, fire events for them.
        var attributes = el.attributes;
        // tslint:disable-next-line:prefer-for-of
        for (var i = 0; i < attributes.length; ++i) {
            var attr = attributes[i];
            // Skip those attributes which are namespace attributes.
            if ((attr.name === "xmlns") ||
                (attr.name.lastIndexOf("xmlns", 0) === 0)) {
                continue;
            }
            if (this._fireAttributeNameEvent(walker, el, attr)) {
                this._fireAndProcessEvent(walker, new salve_1.Event("attributeValue", attr.value), attr, 0);
            }
        }
    };
    /**
     * Fires an attributeName event. If the attribute name is in a namespace and
     * cannot be resolved, the event is not fired.
     *
     * @returns True if the event was actually fired, false if not.
     */
    Validator.prototype._fireAttributeNameEvent = function (walker, el, attr) {
        var attrName = attr.name;
        var ename = walker.resolveName(attrName, true);
        if (ename === undefined) {
            this._processError({ error: new salve_1.ValidationError("cannot resolve attribute name " + attrName), node: attr, index: 0 });
            return false;
        }
        this._setPossibleDueToWildcard(attr, walker, "attributeName", ename.ns, ename.name);
        this._fireAndProcessEvent(walker, new salve_1.Event("attributeName", ename.ns, ename.name), attr, 0);
        return true;
    };
    /**
     * Convenience method to fire events.
     *
     * @param walker The walker on which to fire events.
     *
     * @param event The event to fire.
     *
     * @param el The DOM node associated with this event. Both ``el`` and ``ix``
     * can be undefined for events that have no location associated with them.
     *
     * @param ix The index into ``el`` associated with this event, or a ``Node``
     * which must be a child of ``el``. The index will be computed from the
     * location of the child passed as this parameter in ``el``.
     */
    Validator.prototype._fireAndProcessEvent = function (walker, event, el, ix) {
        this._validationEvents.push(event);
        var eventResult = walker.fireEvent(event);
        if (eventResult instanceof Array) {
            if (el != null && ix !== undefined && typeof ix !== "number") {
                ix = _indexOf(el.childNodes, ix);
            }
            this._processEventResult(eventResult, el, ix);
        }
    };
    /**
     * Force an immediate validation which is guaranteed to go at least up to the
     * point specified by ``container, index``, exclusively. These parameters are
     * interpreted in the same way a DOM caret is.
     *
     * If the validation has not yet reached the location specified, validation
     * will immediately be performed to reach the point. If the validation has
     * already reached this point, then this call is a no-op.
     *
     * There is one exception in the way the ``container, index`` pair is
     * interpreted. If the container is the ``root`` that was passed when
     * constructing the Validator, then setting ``index`` to a negative value will
     * result in the validation validating all elements **and** considering the
     * document complete. So unclosed tags or missing elements will be
     * reported. Otherwise, the validation goes up the ``index`` but considers the
     * document incomplete, and won't report the errors that are normally reported
     * at the end of a document. For instance, unclosed elements won't be
     * reported.
     *
     * @param container The location up to where to validate.
     *
     * @param index The location up to where to validate.
     *
     * @param attributes Whether we are interested to validate up to and including
     * the attribute events of the node pointed to by ``container, index``. The
     * validation ends before leaving the start tag.
     *
     * @throws {Error} If ``container`` is not of element or text type.
     */
    Validator.prototype._validateUpTo = function (container, index, attributes) {
        if (attributes === void 0) { attributes = false; }
        attributes = !!attributes; // Normalize.
        if (attributes && (container.childNodes === undefined ||
            container.childNodes[index].nodeType !==
                Node.ELEMENT_NODE)) {
            throw new Error("trying to validate after attributes but before " +
                "the end of the start tag on a " +
                "node which is not an element node");
        }
        // Set these to reasonable defaults. The rest of the code is
        // dedicated to changing these values to those necessary depending
        // on specifics of what is passed to the method.
        var toInspect = container;
        var dataKey = "EventIndexAfter";
        // This function could be called with container === root if the
        // document is empty or if the user has the caret before the start
        // tag of the first element of the actual structure we want to
        // validate or after the end tag of that element.
        if (container === this.root && index <= 0) {
            if (attributes) {
                dataKey = "EventIndexAfterAttributes";
                toInspect = container.childNodes[index];
            }
            else if (index === 0) {
                // We're before the top element, no events to fire.
                return;
            }
            // default values of toInspect and dataKey are what we want
        }
        else {
            if (isAttr(container)) {
                toInspect = container.ownerElement;
                dataKey = "EventIndexBeforeAttributes";
            }
            else {
                switch (container.nodeType) {
                    case Node.TEXT_NODE:
                        toInspect = container.previousElementSibling;
                        if (toInspect === null) {
                            // tslint:disable-next-line:no-non-null-assertion
                            toInspect = container.parentNode;
                            dataKey = "EventIndexAfterStart";
                        }
                        break;
                    case Node.ELEMENT_NODE:
                    case Node.DOCUMENT_FRAGMENT_NODE:
                    case Node.DOCUMENT_NODE:
                        var node = container.childNodes[index];
                        var prev = node === undefined ?
                            container.lastElementChild :
                            // It may not be an element, in which case we get "undefined".
                            node.previousElementSibling;
                        if (attributes) {
                            dataKey = "EventIndexAfterAttributes";
                            toInspect = node;
                        }
                        else if (prev !== null) {
                            toInspect = prev;
                        }
                        else {
                            dataKey = "EventIndexAfterStart";
                        }
                        break;
                    default:
                        throw new Error("unexpected node type: " + container.nodeType);
                }
            }
        }
        while (this.getNodeProperty(toInspect, dataKey) === undefined) {
            this._cycle();
        }
    };
    /**
     * Gets the walker which would represent the state of parsing at the point
     * expressed by the parameters. See [[Validator.validateUpTo]] for the details
     * of how these parameters are interpreted.
     *
     * **The walker returned by this function is not guaranteed to be a new
     *   instance. Callers should not modify the walker returned but instead clone
     *   it.**
     *
     * @param container
     *
     * @param index
     *
     * @param attributes Whether we are interested to validate up to but not
     * including the attribute events of the node pointed to by ``container,
     * index``. If ``true`` the walker returned will have all events fired on it
     * up to, and including, those attribute events on the element pointed to by
     * ``container, index``.
     *
     * @returns The walker.
     *
     * @throws {EventIndexException} If it runs out of events or computes an event
     * index that makes no sense.
     */
    // tslint:disable-next-line:max-func-body-length cyclomatic-complexity
    Validator.prototype._getWalkerAt = function (container, index, attributes) {
        if (attributes === void 0) { attributes = false; }
        attributes = !!attributes; // Normalize.
        if (attributes && (container.childNodes === undefined ||
            container.childNodes[index].nodeType !==
                Node.ELEMENT_NODE)) {
            throw new Error("trying to get a walker for attribute events on a " +
                "node which is not an element node");
        }
        // Make sure we have the data we need.
        this._validateUpTo(container, index, attributes);
        // This function could be called with container === root if the document is
        // empty or if the user has the caret before the start tag of the first
        // element of the actual structure we want to validate or after the end tag
        // of that element.
        if (container === this.root && index <= 0) {
            if (!attributes) {
                // We're before the top element, no events to fire.
                if (index === 0) {
                    return this.schema.newWalker();
                }
                // _validateUpTo ensures that the current walker held by the validator
                // is what we want. We can just return it here because it is the
                // caller's reponsibility to either not modify it or clone it.
                return this._validationWalker;
            }
        }
        var walker;
        function fireTextEvent(textNode) {
            if (walker === undefined) {
                throw new Error("calling fireTextEvent without a walker");
            }
            walker.fireEvent(new salve_1.Event("text", textNode.data));
        }
        if (isAttr(container)) {
            var el = container.ownerElement;
            walker = this.readyWalker(
            // tslint:disable-next-line:no-non-null-assertion
            this.getNodeProperty(el, "EventIndexBeforeAttributes"));
            // Don't fire on namespace attributes.
            if (!(container.name === "xmlns" || container.prefix === "xmlns")) {
                walker = walker.clone();
                this._fireAttributeNameEvent(walker, el, container);
            }
        }
        else {
            switch (container.nodeType) {
                case Node.TEXT_NODE: {
                    var prev = container.previousElementSibling;
                    var getFrom = void 0;
                    var propName = void 0;
                    if (prev !== null) {
                        getFrom = prev;
                        propName = "EventIndexAfter";
                    }
                    else {
                        // tslint:disable-next-line:no-non-null-assertion
                        getFrom = container.parentNode;
                        propName = "EventIndexAfterStart";
                    }
                    // tslint:disable-next-line:no-non-null-assertion
                    walker = this.readyWalker(this.getNodeProperty(getFrom, propName));
                    // We will attempt to fire a text event if our location is inside the
                    // current text node.
                    //
                    // A previous version of this code was also checking whether there is a
                    // text node between this text node and prev but this cannot happen
                    // because the tree on which validation is performed cannot have two
                    // adjacent text nodes. It was also checking whether there was a _text
                    // element between prev and this text node but this also cannot happen.
                    if (index > 0) {
                        walker = walker.clone();
                        fireTextEvent(container);
                    }
                    break;
                }
                case Node.ELEMENT_NODE:
                case Node.DOCUMENT_NODE:
                case Node.DOCUMENT_FRAGMENT_NODE: {
                    var node = container.childNodes[index];
                    var prev = void 0;
                    var getFrom = void 0;
                    var propName = void 0;
                    if (!attributes) {
                        prev = node === undefined ? container.lastElementChild :
                            node.previousElementSibling;
                        if (prev !== null) {
                            getFrom = prev;
                            propName = "EventIndexAfter";
                        }
                        else {
                            getFrom = container;
                            propName = "EventIndexAfterStart";
                        }
                    }
                    else {
                        getFrom = node;
                        propName = "EventIndexAfterAttributes";
                    }
                    // tslint:disable-next-line:no-non-null-assertion
                    walker = this.readyWalker(this.getNodeProperty(getFrom, propName));
                    if (!attributes) {
                        // We will attempt to fire a text event if another text node appeared
                        // between the node we care about and the element just before it.
                        var prevSibling = node != null ? node.previousSibling : null;
                        if (prevSibling !== null &&
                            // If the previous sibling is the same as the previous *element*
                            // sibbling, then there is nothing *between* that we need to take
                            // care of.
                            prevSibling !== prev) {
                            if (prevSibling.nodeType === Node.TEXT_NODE) {
                                walker = walker.clone();
                                fireTextEvent(prevSibling);
                            }
                        }
                    }
                    break;
                }
                default:
                    throw new Error("unexpected node type: " + container.nodeType);
            }
        }
        return walker;
    };
    Validator.prototype.readyWalker = function (eventIndex) {
        //
        // Perceptive readers will notice that the caching being done here could be
        // more aggressive. It turns out that the cases where we have to clone the
        // walker after getting it from the cache are not that frequently used, so
        // there is little to gain from being more aggressive. Furthermore, it is
        // likely that the caching system will change when we implement a saner way
        // to reset validation and segment large documents into smaller chunks.
        //
        if (eventIndex === undefined) {
            throw new EventIndexException();
        }
        var cache = this._walkerCache;
        var max = this._walkerCacheMax;
        var walker = cache[eventIndex];
        if (walker) {
            return walker;
        }
        //
        // Scan the cache for a walker we could use... rather than start from zero.
        //
        // There is no point in trying to be clever by using this._walkerCacheGap to
        // start our search. If _getWalkerAt is called with decreasing positions in
        // the document, then the gap is meaningless for our search. (Such scenario
        // is not a normal usage pattern for _getWalkerAt but it *can* happen so we
        // cannot assume that it won't happen.)
        //
        // Also, the following approach is a bit crude but trying to be clever with
        // Object.keys() and then searching through a sorted list does not yield an
        // appreciable improvement. Maybe on very large documents it would but this
        // module will have to be redesigned to tackle that so there's no point now
        // to be cleverer than this. We also tested using a sparse Array for the
        // cache and got visibly worse performance. And we tested to see if a flag
        // indicating if the cache has anything in it would help avoid doing a long
        // search but it maked things worse. Basically, it seems that the typical
        // usage pattern of _getWalkerAt is such that it will usually be called in
        // increasing order of position in the document.
        //
        var searchIx = eventIndex;
        if (searchIx >= max) {
            searchIx = max;
            walker = cache[searchIx];
        }
        else {
            while (!walker && --searchIx >= 0) {
                walker = cache[searchIx];
            }
        }
        if (walker) {
            walker = walker.clone();
        }
        else {
            walker = this.schema.newWalker();
            searchIx = 0;
        }
        for (var ix = searchIx; ix < eventIndex; ++ix) {
            walker.fireEvent(this._validationEvents[ix]);
        }
        // This is a bit arbitrary to find a balance between caching too much
        // information and spending too much time computing walkers.
        if (eventIndex - searchIx >= this._walkerCacheGap) {
            cache[eventIndex] = walker;
            this._walkerCacheMax = Math.max(eventIndex, max);
        }
        return walker;
    };
    /**
     * Returns the set of possible events for the location specified by the
     * parameters.
     *
     * @param container Together with ``index`` this parameter is interpreted to
     * form a location.
     *
     * @param index Together with ``container`` this parameter is interpreted to
     * form a location.
     *
     * @param attributes
     *
     * @returns A set of possible events.
     */
    Validator.prototype.possibleAt = function (container, index, attributes) {
        if (attributes === void 0) { attributes = false; }
        var walker = this._getWalkerAt(container, index, attributes);
        // Calling possible does not *modify* the walker.
        return walker.possible();
    };
    /**
     * Finds the locations in a node where a certain validation event is
     * possible.
     *
     * @param container A node.
     *
     * @param event The event to search for. The event should be presented in the
     * same format used for ``fireEvent``.
     *
     * @returns The locations in ``container`` where the event is possible.
     */
    Validator.prototype.possibleWhere = function (container, event) {
        var ret = [];
        for (var index = 0; index <= container.childNodes.length; ++index) {
            var possible = this.possibleAt(container, index);
            if (possible.has(event)) {
                ret.push(index);
            }
            else if (event.params[0] === "enterStartTag" ||
                event.params[0] === "attributeName") {
                // In the case where we have a name pattern as the 2nd parameter, and
                // this pattern can be complex or have wildcards, then we have to check
                // all events one by one for a name pattern match. (While enterStartTag,
                // endTag and attributeName all have name patterns, endTag cannot be
                // complex or allow wildcards because what it allows much match the tag
                // that started the current element.
                for (var _i = 0, _a = possible.toArray(); _i < _a.length; _i++) {
                    var candidate = _a[_i];
                    if (candidate.params[0] === event.params[0] &&
                        candidate.params[1].match(event.params[1], event.params[2])) {
                        ret.push(index);
                        break;
                    }
                }
            }
        }
        return ret;
    };
    /**
     * Validate a DOM fragment as if it were present at the point specified in the
     * parameters in the DOM tree being validated.
     *
     * WARNING: This method will not catch unclosed elements. This is because the
     * fragment is not considered to be a "complete" document. Unclosed elements
     * or fragments that are not well-formed must be caught by other means.
     *
     * @param container The location in the tree to start at.
     *
     * @param index The location in the tree to start at.
     *
     * @param toParse The fragment to parse.
     *
     * @returns Returns an array of errors if there is an error. Otherwise returns
     * false.
     */
    Validator.prototype.speculativelyValidate = function (container, index, toParse) {
        var clone;
        if (toParse instanceof Array) {
            clone = container.ownerDocument.createDocumentFragment();
            for (var _i = 0, toParse_1 = toParse; _i < toParse_1.length; _i++) {
                var child = toParse_1[_i];
                clone.insertBefore(child.cloneNode(true), null);
            }
        }
        else {
            clone = toParse.cloneNode(true);
        }
        var root = container.ownerDocument.createElement("div");
        root.insertBefore(clone, null);
        return this.speculativelyValidateFragment(container, index, root);
    };
    /**
     * Validate a DOM fragment as if it were present at the point specified in the
     * parameters in the DOM tree being validated.
     *
     * WARNING: This method will not catch unclosed elements. This is because the
     * fragment is not considered to be a "complete" document. Unclosed elements
     * or fragments that are not well-formed must be caught by other means.
     *
     * @param container The location in the tree to start at.
     *
     * @param index The location in the tree to start at.
     *
     * @param toParse The fragment to parse. See above.
     *
     * @returns Returns an array of errors if there is an error. Otherwise returns
     * false.
     */
    Validator.prototype.speculativelyValidateFragment = function (container, index, toParse) {
        // This is useful for pure-JS code that may be calling this.
        if (toParse.nodeType !== Node.ELEMENT_NODE) {
            throw new Error("toParse is not an element");
        }
        // We create a new validator with the proper state to parse the fragment
        // we've been given.
        var dup = new Validator(this.schema, toParse);
        // We have to clone the walker to prevent messing up the internal cache.
        dup._validationWalker = this._getWalkerAt(container, index).clone();
        // This forces validating the whole fragment
        dup._validateUpTo(toParse, toParse.childNodes.length);
        if (dup._errors.length !== 0) {
            return dup._errors;
        }
        return false;
    };
    /**
     * Obtain the validation errors that belong to a specific node.
     *
     * The term "that belong to" has a specific meaning here:
     *
     * - An error in the contents of an element belongs to the element whose
     *   contents are incorrect. For instance if in the sequence
     *   ``<foo><blip/></foo>`` the tag ``<blip/>`` is out of place, then the
     *   error belongs to the node for the element ``foo``, not the node for the
     *   element ``blip``.
     *
     * - Attribute errors belong to the element node to which the attributes
     *   belong.
     *
     * @param node The node whose errors we want to get.
     *
     * @returns The errors.
     */
    Validator.prototype.getErrorsFor = function (node) {
        var parent = node.parentNode;
        if (parent === null) {
            throw new Error("node without a parent!");
        }
        // Validate to after the closing tag of the node.
        this._validateUpTo(parent, _indexOf(parent.childNodes, node) + 1);
        var ret = [];
        for (var _i = 0, _a = this._errors; _i < _a.length; _i++) {
            var errorData = _a[_i];
            if (errorData.node === node) {
                ret.push(errorData);
            }
        }
        return ret;
    };
    /**
     * Sets a flag indicating whether a node is possible only due to a name
     * pattern wildcard, and emits an event if setting the flag is a change from
     * the previous value of the flag. It does this by inspecting the event that
     * would be fired when ``node`` is validated. The parameters ``eventName``,
     * ``ns`` and ``name`` are used to determine what we are looking for among
     * possible events.
     *
     * @param node The node we want to check.
     *
     * @param walker A walker whose last fired event is the one just before the
     * event that would be fired when validating ``node``.
     *
     * @param eventName The event name we are interested in.
     *
     * @param ns The namespace to use with the event.
     *
     * @param name The name to use with the event.
     *
     * @emits module:validator~Validator#event:possible-due-to-wildcard-change
     *
     */
    Validator.prototype._setPossibleDueToWildcard = function (node, walker, eventName, ns, name) {
        var previous = this.getNodeProperty(node, "PossibleDueToWildcard");
        var possible = isPossibleDueToWildcard(walker, eventName, ns, name);
        this._setNodeProperty(node, "PossibleDueToWildcard", possible);
        if (previous === undefined || previous !== possible) {
            /**
             * Tells the listener that a node's flag indicating whether it is possible
             * only due to a wildcard has changed.
             *
             * @event module:validator~Validator#possible-due-to-wildcard-change
             *
             * @type {Node} The node whose flag has changed.
             */
            this._events._emit("possible-due-to-wildcard-change", node);
        }
    };
    /**
     * Resolve a qualified name to an expanded name. See
     * ``"salve".NameResolver.resolveName`` for what resolving means.  This method
     * takes into account namespaces defined on parent nodes.
     *
     * @param container Where to perform the operation.
     *
     * @param index Where to perform the operation.
     *
     * @param name The name to rresolve.
     *
     * @param attributes Whether the name is an attribute's name.
     *
     * @return The resolved name.
     */
    Validator.prototype.resolveNameAt = function (container, index, name, attribute) {
        if (attribute === void 0) { attribute = false; }
        // Even when ``attribute`` is true, we want to call ``_getWalkerAt`` with
        // its ``attribute`` parameter ``false``.
        return this._getWalkerAt(container, index).resolveName(name, attribute);
    };
    /**
     * Unresolve an expanded name to a qualified name. See
     * ``"salve".NameResolver.unresolveName`` for what unresolving means. This
     * method takes into account namespaces defined on parent nodes.
     *
     * @param container Where to perform the operation.
     *
     * @param index Where to perform the operation.
     *
     * @param uri The URI to unresolve.
     *
     * @param name The name to unresolve.
     *
     * @return The unresolved name.
     */
    Validator.prototype.unresolveNameAt = function (container, index, uri, name) {
        return this._getWalkerAt(container, index).unresolveName(uri, name);
    };
    return Validator;
}());
exports.Validator = Validator;

//# sourceMappingURL=main.js.map


/***/ })
/******/ ]);
});
//# sourceMappingURL=salve-dom.map.js