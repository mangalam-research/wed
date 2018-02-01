(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["salve"] = factory();
	else
		root["salve"] = factory();
})(this, function() {
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
/******/ 	return __webpack_require__(__webpack_require__.s = 31);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Classes that model RNG patterns.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
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
var hashstructs_1 = __webpack_require__(8);
var name_resolver_1 = __webpack_require__(3);
var util = __webpack_require__(30);
// XML validation against a schema could work without any lookahead if it were
// not for namespaces. However, namespace support means that the interpretation
// of a tag or of an attribute may depend on information which appears *later*
// than the earliest time at which a validation decision might be called for:
//
// Consider:
//    <elephant a="a" b="b"... xmlns="elephant_uri"/>
//
// It is not until xmlns is encountered that the validator will know that
// elephant belongs to the elephant_uri namespace. This is not too troubling for
// a validator that can access the whole document but for validators used in a
// line-by-line process (which is the case if the validator is driven by a
// CodeMirror or Ace tokenizer, and anything based on them), this can be
// problematic because the attributes could appear on lines other than the line
// on which the start of the tag appears:
//
// <elephant
//  a="a"
//  b="b"
//  xmlns="elephant_uri"/>
//
// The validator encounters the start of the tag and the attributes, without
// knowing that eventually this elephant tag belongs to the elephant_uri
// namespace. This discovery might result in things that were seen previously
// and deemed valid becoming invalid. Or things that were invalid becoming
// valid.
//
// Handling namespaces will require lookahead. Although the validator would
// still expect all events that have tag and attribute names to have a proper
// namespace uri, upon ``enterStartTag`` the parsing code which feeds events to
// the validator would look ahead for these cases:
//
// * There is a valid ``>`` character ending the start tag. Scan the start tag
//   for all namespace declarations.
//
// * The tag ends at EOF. Scan from beginning of tag to EOF for namespace
//   declarations.
//
// * The tag is terminated by an invalid token. Scan from beginning of tag to
//   error.
//
// Then issue the enterStartTag and attributeName events on the basis of what
// was found in scanning.
//
// When the parsing code discovers a change in namespace declarations, for
// instance because the user typed xmlns="..." or removed a declaration, the
// parsing code must *restart* validation *from* the location of the original
// enterStartTag event.
var DEBUG = false;
// This is here to shut the compiler up about unused variables.
/* tslint:disable: no-empty no-invalid-this */
function noop() {
    var _args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        _args[_i] = arguments[_i];
    }
}
// tslint:disable-next-line:strict-boolean-expressions
if (DEBUG) {
    //
    // Debugging utilities
    //
    var trace_1 = function (msg) {
        console.log(msg); // tslint:disable-line:no-console
    };
    var stackTrace = function () {
        trace_1(new Error().stack);
    };
    noop(stackTrace);
    // tslint:disable:no-var-keyword
    var possibleTracer;
    var fireEventTracer;
    var plainTracer;
    var callDump;
    // tslint:enable:no-var-keyword
    // tslint:disable-next-line:only-arrow-functions no-void-expression
    (function buildTracingCode() {
        var buf = "";
        var step = " ";
        var nameOrPath = function (walker) {
            var el = walker.el;
            if (el == null) {
                return "";
            }
            if (el.name === undefined) {
                return " with path " + el.xmlPath;
            }
            var named = " named " + el.name.toString();
            if (walker.boundName == null) {
                return named;
            }
            return named + " (bound to " + walker.boundName.toString() + ")";
        };
        callDump = function (msg, name, me) {
            trace_1("" + buf + msg + name + " on class " + me.constructor.name +
                (" id " + me.id + nameOrPath(me)));
        };
        // tslint:disable-next-line:only-arrow-functions
        possibleTracer = function _possibleTracer(oldMethod, name, args) {
            buf += step;
            callDump("calling ", name, this);
            var ret = oldMethod.apply(this, args);
            callDump("called ", name, this);
            trace_1(buf + "return from the call: " + util.inspect(ret));
            buf = buf.slice(step.length);
            return ret;
        };
        // tslint:disable-next-line:only-arrow-functions
        fireEventTracer = function _fireEventTracer(oldMethod, name, args) {
            buf += step;
            callDump("calling ", name, this);
            trace_1(buf + util.inspect(args[0]));
            var ret = oldMethod.apply(this, args);
            callDump("called ", name, this);
            if (ret !== false) {
                trace_1(buf + "return from the call: " + util.inspect(ret));
            }
            buf = buf.slice(step.length);
            return ret;
        };
        // tslint:disable-next-line:only-arrow-functions
        plainTracer = function _plainTracer(oldMethod, name, args) {
            buf += step;
            callDump("calling ", name, this);
            var ret = oldMethod.apply(this, args);
            callDump("called ", name, this);
            trace_1(buf + "return from the call: " + util.inspect(ret));
            buf = buf.slice(step.length);
            return ret;
        };
    }());
    /**
     * Utility function for debugging. Wraps ``me[name]`` in a wrapper
     * function. ``me[name]`` must be a function.  ``me`` could be an instance or
     * could be a prototype. This function cannot trivially wrap the same field on
     * the same object twice.
     *
     * @private
     * @param me The object to modify.
     * @param name The field name to modify in the object.
     * @param f The function that should serve as wrapper.
     *
     */
    // tslint:disable-next-line:only-arrow-functions no-var-keyword prefer-const
    var wrap = function (me, name, f) {
        var mangledName = "___" + name;
        me[mangledName] = me[name];
        // tslint:disable-next-line:only-arrow-functions
        me[name] = function wrapper() {
            return f.call(this, me[mangledName], name, arguments);
        };
    };
    noop(wrap);
    /* tslint:enable */
}
/**
 * Sets up a ``newWalker`` method in a prototype.
 *
 * @private
 * @param elCls The class that will get the new method.
 * @param walkerCls The Walker class to instantiate.
 */
/* tslint:disable: no-invalid-this */
function addWalker(elCls, walkerCls) {
    // `resolver` is a NameResolver.
    // tslint:disable-next-line:only-arrow-functions
    elCls.prototype.newWalker = function newWalker(resolver) {
        return new walkerCls(this, resolver);
    };
}
exports.addWalker = addWalker;
/* tslint:enable */
// function EventSet() {
//     var args = Array.prototype.slice.call(arguments);
//     args.unshift(function (x) { return x.hash() });
//     HashSet.apply(this, args);
// }
// inherit(EventSet, HashSet);
// The naive Set implementation turns out to be faster than the HashSet
// implementation for how we are using it.
var set_1 = __webpack_require__(13);
var set_2 = __webpack_require__(13);
exports.EventSet = set_2.NaiveSet;
/**
 * Calls the ``hash()`` method on the object passed to it.
 *
 * @private
 * @param o An object that implements ``hash()``.
 * @returns The return value of ``hash()``.
 */
function hashHelper(o) {
    return o.hash();
}
/**
 *
 * This is the base class for all patterns created from the file passed to
 * [["validate".constructTree]]. These patterns form a JavaScript representation
 * of the simplified RNG tree. The base class implements a leaf in the RNG
 * tree. In other words, it does not itself refer to children Patterns. (To put
 * it in other words, it has no subpatterns.)
 */
var BasePattern = (function () {
    /**
     * @param xmlPath This is a string which uniquely identifies the element from
     * the simplified RNG tree. Used in debugging.
     */
    function BasePattern(xmlPath) {
        this.id = "P" + this.__newID();
        this.xmlPath = xmlPath;
    }
    /**
     * This method is mainly used to be able to use these objects in a
     * [["hashstructs".HashSet]] or a [["hashstructs".HashMap]].
     *
     * Returns a hash guaranteed to be unique to this object. There are some
     * limitations. First, if this module is instantiated twice, the objects
     * created by the two instances cannot mix without violating the uniqueness
     * guarantee. Second, the hash is a monotonically increasing counter, so when
     * it reaches beyond the maximum integer that the JavaScript vm can handle,
     * things go kaboom. Third, this hash is meant to work within salve only.
     *
     * @returns A hash unique to this object.
     */
    BasePattern.prototype.hash = function () {
        return this.id;
    };
    /**
     * Resolve references to definitions.
     *
     * @param definitions The definitions that exist in this grammar.
     *
     * @returns The references that cannot be resolved, or ``undefined`` if no
     * references cannot be resolved. The caller is free to modify the value
     * returned as needed.
     */
    BasePattern.prototype._resolve = function (definitions) {
        return undefined;
    };
    /**
     * This method must be called after resolution has been performed.
     * ``_prepare`` recursively calls children but does not traverse ref-define
     * boundaries to avoid infinite regress...
     *
     * This function now performs two tasks: a) it prepares the attributes
     * (Definition and Element objects maintain a pattern which contains only
     * attribute patterns, and nothing else), b) it gathers all the namespaces
     * seen in the schema.
     *
     * @param namespaces An object whose keys are the namespaces seen in
     * the schema. This method populates the object.
     *
     */
    BasePattern.prototype._prepare = function (namespaces) {
        // nothing here
    };
    /**
     * This method tests whether a pattern is an attribute pattern or contains
     * attribute patterns. This method does not cross element boundaries. That is,
     * if element X cannot have attributes of its own but can contain elements
     * that can have attributes, the return value if this method is called on the
     * pattern contained by element X's pattern will be ``false``.
     *
     * @returns True if the pattern is or has attributes. False if not.
     */
    BasePattern.prototype._hasAttrs = function () {
        return false;
    };
    /**
     * Populates a memo with a mapping of (element name, [list of patterns]).  In
     * a Relax NG schema, the same element name may appear in multiple contexts,
     * with multiple contents. For instance an element named "name" could require
     * the sequence of elements "firstName", "lastName" in a certain context and
     * text in a different context. This method allows determining whether this
     * happens or not within a pattern.
     *
     * @param memo The memo in which to store the information.
     */
    BasePattern.prototype._gatherElementDefinitions = function (memo) {
        // By default we have no children.
    };
    /**
     * Gets a new Pattern id.
     *
     * @returns The new id.
     */
    BasePattern.prototype.__newID = function () {
        return BasePattern.__id++;
    };
    /**
     * The next id to associate to the next Pattern object to be created. This is
     * used so that [[hash]] can return unique values.
     */
    BasePattern.__id = 0; // tslint:disable-line:variable-name
    return BasePattern;
}());
exports.BasePattern = BasePattern;
/**
 * This is the common class from which patterns are derived. Most patterns
 * create a new walker by passing a name resolver. The one exception is
 * [[Grammar]], which creates the name resolver that are used by other
 * patterns. So when calling it we do not need a ``resolver`` parameter and thus
 * it inherits from [[BasePattern]] rather than [[Pattern]].
 */
var Pattern = (function (_super) {
    __extends(Pattern, _super);
    function Pattern() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Creates a new walker to walk this pattern.
     *
     * @returns A walker.
     */
    Pattern.prototype.newWalker = function (resolver) {
        throw new Error("derived classes must override this");
    };
    return Pattern;
}(BasePattern));
exports.Pattern = Pattern;
/**
 * Pattern objects of this class have exactly one child pattern.
 */
var OneSubpattern = (function (_super) {
    __extends(OneSubpattern, _super);
    function OneSubpattern(xmlPath, pat) {
        var _this = _super.call(this, xmlPath) || this;
        _this.pat = pat;
        return _this;
    }
    OneSubpattern.prototype._resolve = function (definitions) {
        return this.pat._resolve(definitions);
    };
    OneSubpattern.prototype._prepare = function (namespaces) {
        this.pat._prepare(namespaces);
    };
    OneSubpattern.prototype._hasAttrs = function () {
        return this.pat._hasAttrs();
    };
    OneSubpattern.prototype._gatherElementDefinitions = function (memo) {
        this.pat._gatherElementDefinitions(memo);
    };
    return OneSubpattern;
}(Pattern));
exports.OneSubpattern = OneSubpattern;
/**
 * Pattern objects of this class have exactly two child patterns.
 *
 */
var TwoSubpatterns = (function (_super) {
    __extends(TwoSubpatterns, _super);
    function TwoSubpatterns(xmlPath, patA, patB) {
        var _this = _super.call(this, xmlPath) || this;
        _this.patA = patA;
        _this.patB = patB;
        return _this;
    }
    TwoSubpatterns.prototype._resolve = function (definitions) {
        var a = this.patA._resolve(definitions);
        var b = this.patB._resolve(definitions);
        if (a !== undefined && b !== undefined) {
            return a.concat(b);
        }
        if (a !== undefined) {
            return a;
        }
        return b;
    };
    TwoSubpatterns.prototype._prepare = function (namespaces) {
        this.patA._prepare(namespaces);
        this.patB._prepare(namespaces);
    };
    TwoSubpatterns.prototype._hasAttrs = function () {
        return this.patA._hasAttrs() || this.patB._hasAttrs();
    };
    TwoSubpatterns.prototype._gatherElementDefinitions = function (memo) {
        this.patA._gatherElementDefinitions(memo);
        this.patB._gatherElementDefinitions(memo);
    };
    return TwoSubpatterns;
}(Pattern));
exports.TwoSubpatterns = TwoSubpatterns;
/**
 * This class models events occurring during parsing. Upon encountering the
 * start of a start tag, an "enterStartTag" event is generated, etc. Event
 * objects are held to be immutable. No precautions have been made to enforce
 * this. Users of these objects simply must not modify them. Moreover, there is
 * one and only one of each event created.
 *
 * An event is made of a list of event parameters, with the first one being the
 * type of the event and the rest of the list varying depending on this type.
 *
 */
var Event = (function () {
    /**
     * @param args... The event parameters may be passed directly in the call
     * ``(new Event(a, b, ...))`` or the first call parameter may be a list
     * containing all the event parameters ``(new Event([a, b, ])``. All of the
     * event parameters must be strings.
     */
    function Event() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var params = (args.length === 1 && args[0] instanceof Array) ? args[0] : args;
        var key = params.join();
        // Ensure we have only one of each event created.
        var cached = Event.__cache[key];
        if (cached !== undefined) {
            return cached;
        }
        this.id = "E" + this.__newID();
        this.params = params;
        this.key = key;
        Event.__cache[key] = this;
        return this;
    }
    /**
     * This method is mainly used to be able to use these objects in a
     * [["hashstructs".HashSet]] or a [["hashstructs".HashMap]].
     *
     * Returns a hash guaranteed to be unique to this object. There are some
     * limitations. First, if this module is instantiated twice, the objects
     * created by the two instances cannot mix without violating the uniqueness
     * guarantee. Second, the hash is a monotonically increasing counter, so when
     * it reaches beyond the maximum integer that the JavaScript vm can handle,
     * things go kaboom. Third, this hash is meant to work within salve only.
     *
     * @returns A hash unique to this object.
     */
    Event.prototype.hash = function () {
        return this.id;
    };
    /**
     * Is this Event an attribute event?
     *
     * @returns ``true`` if the event is an attribute event, ``false``
     * otherwise.
     */
    Event.prototype.isAttributeEvent = function () {
        return (this.params[0] === "attributeName" ||
            this.params[0] === "attributeValue");
    };
    /**
     * @returns A string representation of the event.
     */
    Event.prototype.toString = function () {
        return "Event: " + this.params.join(", ");
    };
    /**
     * Gets a new Event id.
     *
     * @returns The new id.
     */
    Event.prototype.__newID = function () {
        return Event.__id++;
    };
    /**
     * The cache of Event objects. So that we create one and only one Event object
     * per run.
     */
    // tslint:disable-next-line:variable-name
    Event.__cache = Object.create(null);
    /**
     * The next id to associate to the next Event object to be created. This is
     * used so that [[Event.hash]] can return unique values.
     */
    // tslint:disable-next-line:variable-name
    Event.__id = 0;
    return Event;
}());
exports.Event = Event;
/**
 * Utility function used mainly in testing to transform a [["set".NaiveSet]] of
 * events into a string containing a tree structure.  The principle is to
 * combine events of a same type together and among events of a same type
 * combine those which are in the same namespace. So for instance if there is a
 * set of events that are all attributeName events plus one ``leaveStartTag``
 * event, the output could be:
 *
 * <pre>``
 * attributeName:
 * ..uri A:
 * ....name 1
 * ....name 2
 * ..uri B:
 * ....name 3
 * ....name 4
 * leaveStartTag
 * ``</pre>
 *
 * The dots above are to represent more visually the indentation. Actual output
 * does not contain leading dots.  In this list there are two attributeName
 * events in the "uri A" namespace and two in the "uri B" namespace.
 *
 * @param evs Events to turn into a string.
 * @returns A string which contains the tree described above.
 */
function eventsToTreeString(evs) {
    function hashF(x) {
        return x;
    }
    if (evs instanceof set_1.NaiveSet) {
        evs = evs.toArray();
    }
    var hash = new hashstructs_1.HashMap(hashF);
    evs.forEach(function (ev) {
        var params = ev.params;
        var node = hash;
        for (var i = 0; i < params.length; ++i) {
            if (i === params.length - 1) {
                // Our HashSet/Map cannot deal with undefined values. So we mark
                // leaf elements with the value false.
                node.add(params[i], false);
            }
            else {
                var nextNode = node.has(params[i]);
                if (nextNode === undefined) {
                    nextNode = new hashstructs_1.HashMap(hashF);
                    node.add(params[i], nextNode);
                }
                node = nextNode;
            }
        }
    });
    // We don't set dumpTree to const because the compiler has a fit when dumpTree
    // is accessed recursively.
    // tslint:disable-next-line:prefer-const
    var dumpTree = 
    // tslint:disable-next-line:only-arrow-functions
    (function makeDumpTree() {
        var dumpTreeBuf = "";
        var dumpTreeIndent = "    ";
        // tslint:disable-next-line:no-shadowed-variable
        return function (hash) {
            var ret = "";
            var keys = hash.keys();
            keys.sort();
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                var sub = hash.has(key);
                if (sub !== false) {
                    ret += "" + dumpTreeBuf + key + ":\n";
                    dumpTreeBuf += dumpTreeIndent;
                    ret += dumpTree(hash.has(key));
                    dumpTreeBuf = dumpTreeBuf.slice(dumpTreeIndent.length);
                }
                else {
                    ret += "" + dumpTreeBuf + key + "\n";
                }
            }
            return ret;
        };
    }());
    return dumpTree(hash);
    /* tslint:enable */
}
exports.eventsToTreeString = eventsToTreeString;
/**
 * Special event to which only the [["empty".EmptyWalker]] responds
 * positively. This object is meant to be used internally by salve.
 */
exports.emptyEvent = new Event("<empty>");
/**
 * Roughly speaking each [[Pattern]] object has a corresponding ``Walker`` class
 * that models an object which is able to walk the pattern to which it
 * belongs. So an ``Element`` has an ``ElementWalker`` and an ``Attribute`` has
 * an ``AttributeWalker``. A ``Walker`` object responds to parsing events and
 * reports whether the structure represented by these events is valid.
 *
 * This base class records only a minimal number of properties so that child
 * classes can avoid keeping useless properties. A prime example is the walker
 * for ``<empty>`` which is a terminal walker (it has no subwalker) so does not
 * need to record the name resolver.
 *
 * Note that users of this API do not instantiate Walker objects themselves.
 */
var Walker = (function () {
    function Walker(elOrWalker) {
        this.id = "W" + this.__newID();
        this.suppressedAttributes = false;
        if (elOrWalker instanceof Walker) {
            this.el = elOrWalker.el;
            this.possibleCached = elOrWalker.possibleCached;
            this.suppressedAttributes = elOrWalker.suppressedAttributes;
        }
        else {
            this.el = elOrWalker;
        }
        if (DEBUG) {
            wrap(this, "_possible", possibleTracer);
            wrap(this, "fireEvent", fireEventTracer);
            wrap(this, "end", plainTracer);
            wrap(this, "_suppressAttributes", plainTracer);
            wrap(this, "_clone", plainTracer);
        }
    }
    /**
     * This method is mainly used to be able to use these objects in a
     * [["hashstructs".HashSet]] or a [["hashstructs".HashMap]].
     *
     * Returns a hash guaranteed to be unique to this object. There are some
     * limitations. First, if this module is instantiated twice, the objects
     * created by the two instances cannot mix without violating the uniqueness
     * guarantee. Second, the hash is a monotonically increasing counter, so when
     * it reaches beyond the maximum integer that the JavaScript vm can handle,
     * things go kaboom. Third, this hash is meant to work within salve only.
     *
     * @returns A hash unique to this object.
     */
    Walker.prototype.hash = function () {
        return this.id;
    };
    /**
     * Fetch the set of possible events at the current stage of parsing.
     *
     * @returns The set of events that can be fired without resulting in an error.
     */
    Walker.prototype.possible = function () {
        return new set_1.NaiveSet(this._possible());
    };
    /**
     * Can this Walker validly end after the previous event fired?
     *
     * @param attribute ``true`` if calling this method while processing
     * attributes, ``false`` otherwise.
     *
     * @return ``true`` if the walker can validly end here.  ``false`` otherwise.
     */
    Walker.prototype.canEnd = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        return true;
    };
    /**
     * Obtain the errors that would occur if the walker were to end here. Note the
     * conditional phrasing. It **must** be idempotent. Therefore it **must not**
     * change the state of the walker. The internal code of salve will sometimes
     * call end more than once on the same walker.
     *
     * @param attribute ``true`` if calling this method while processing
     * attributes, ``false`` otherwise.
     *
     * @returns ``false`` if the walker ended without error. Otherwise, the
     * errors.
     */
    Walker.prototype.end = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        return false;
    };
    /**
     * Deep copy the Walker.
     *
     * @returns A deep copy of the Walker.
     */
    Walker.prototype.clone = function () {
        return this._clone(new hashstructs_1.HashMap(hashHelper));
    };
    /**
     * Helper function for clone. Code that is not part of the Pattern family would
     * call clone() whereas Pattern and its derived classes call _clone() with the
     * appropriate memo.
     *
     * @param memo A mapping of old object to copy object. As a tree of patterns
     * is being cloned, this memo is populated.  So if A is cloned to B then a
     * mapping from A to B is stored in the memo.  If A is seen again in the same
     * cloning operation, then it will be substituted with B instead of creating a
     * new object.
     *
     * This method is meant only to be used by classes derived from [[Walker]]. It
     * is public due to a limitation of TypeScript. Don't call it from your own
     * code. You've been warned.
     *
     * @protected
     *
     * @returns The clone.
     */
    Walker.prototype._clone = function (memo) {
        return new this.constructor(this, memo);
    };
    /**
     * Helper function used to prevent Walker objects from reporting attribute
     * events as possible. In RelaxNG it is normal to mix attributes and elements
     * in patterns. However, XML validation segregates attributes and
     * elements. Once a start tag has been processed, attributes are not possible
     * until a new start tag begins. For instance, if a Walker is processing
     * ``<foo a="1">``, as soon as the greater than symbol is encountered,
     * attribute events are no longer possible. This function informs the Walker
     * of this fact.
     *
     */
    Walker.prototype._suppressAttributes = function () {
        this.suppressedAttributes = true;
    };
    /**
     * Helper method for cloning. This method should be called to clone objects
     * that do not participate in the ``clone``, protocol. This typically means
     * instance properties that are not ``Walker`` objects and not immutable.
     *
     * This method will call a ``clone`` method on ``obj``, when it determines
     * that cloning must happen.
     *
     * @param obj The object to clone.
     *
     * @param memo A mapping of old object to copy object. As a tree of patterns
     * is being cloned, this memo is populated. So if A is cloned to B then a
     * mapping from A to B is stored in the memo. If A is seen again in the same
     * cloning operation, then it will be substituted with B instead of creating a
     * new object. This should be the same object as the one passed to the
     * constructor.
     *
     * @returns A clone of ``obj``.
     */
    Walker.prototype._cloneIfNeeded = function (obj, memo) {
        var other = memo.has(obj);
        if (other !== undefined) {
            return other;
        }
        other = obj.clone();
        memo.add(obj, other);
        return other;
    };
    /**
     * Gets a new Walker id.
     *
     * @returns The new id.
     */
    Walker.prototype.__newID = function () {
        return Walker.__id++;
    };
    /**
     * The next id to associate to the next Walker object to be created. This is
     * used so that [[hash]] can return unique values.
     */
    Walker.__id = 0; // tslint:disable-line:variable-name
    return Walker;
}());
exports.Walker = Walker;
function isHashMap(value, msg) {
    if (msg === void 0) { msg = ""; }
    if (value instanceof hashstructs_1.HashMap) {
        return value;
    }
    throw new Error("did not get a HashMap " + msg);
}
exports.isHashMap = isHashMap;
function isNameResolver(value, msg) {
    if (msg === void 0) { msg = ""; }
    if (value instanceof name_resolver_1.NameResolver) {
        return value;
    }
    throw new Error("did not get a HashMap " + msg);
}
exports.isNameResolver = isNameResolver;
/**
 * Walkers that have only one subwalker.
 */
var SingleSubwalker = (function (_super) {
    __extends(SingleSubwalker, _super);
    function SingleSubwalker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SingleSubwalker.prototype._possible = function () {
        return this.subwalker.possible();
    };
    SingleSubwalker.prototype.fireEvent = function (ev) {
        return this.subwalker.fireEvent(ev);
    };
    SingleSubwalker.prototype._suppressAttributes = function () {
        if (!this.suppressedAttributes) {
            this.suppressedAttributes = true;
            this.subwalker._suppressAttributes();
        }
    };
    SingleSubwalker.prototype.canEnd = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        return this.subwalker.canEnd(attribute);
    };
    SingleSubwalker.prototype.end = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        return this.subwalker.end(attribute);
    };
    return SingleSubwalker;
}(Walker));
exports.SingleSubwalker = SingleSubwalker;
/**
 * A pattern for RNG references.
 */
var Ref = (function (_super) {
    __extends(Ref, _super);
    /**
     *
     * @param xmlPath This is a string which uniquely identifies the
     * element from the simplified RNG tree. Used in debugging.
     *
     * @param name The reference name.
     */
    function Ref(xmlPath, name) {
        var _this = _super.call(this, xmlPath) || this;
        _this.name = name;
        return _this;
    }
    Ref.prototype._prepare = function () {
        // We do not cross ref/define boundaries to avoid infinite loops.
        return;
    };
    Ref.prototype._resolve = function (definitions) {
        this.resolvesTo = definitions[this.name];
        if (this.resolvesTo === undefined) {
            return [this];
        }
        return undefined;
    };
    // addWalker(Ref, RefWalker); No, see below
    // This completely skips the creation of RefWalker and DefineWalker. This
    // returns the walker for whatever it is that the Define element this
    // refers to ultimately contains.
    Ref.prototype.newWalker = function (resolver) {
        // _resolve must have been called before any walker can be created.
        // tslint:disable-next-line:no-non-null-assertion
        return this.resolvesTo.pat.newWalker(resolver);
    };
    return Ref;
}(Pattern));
exports.Ref = Ref;
/**
 * A pattern for ``<define>``.
 */
var Define = (function (_super) {
    __extends(Define, _super);
    /**
     * @param xmlPath This is a string which uniquely identifies the
     * element from the simplified RNG tree. Used in debugging.
     *
     * @param name The name of the definition.
     *
     * @param pat The pattern contained by this one.
     */
    function Define(xmlPath, name, pat) {
        var _this = _super.call(this, xmlPath, pat) || this;
        _this.name = name;
        return _this;
    }
    return Define;
}(OneSubpattern));
exports.Define = Define;
/**
 * Walker for [[Define]].
 */
var DefineWalker = (function (_super) {
    __extends(DefineWalker, _super);
    function DefineWalker(elOrWalker, nameResolverOrMemo) {
        var _this = this;
        if (elOrWalker instanceof DefineWalker) {
            var walker = elOrWalker;
            var memo = isHashMap(nameResolverOrMemo);
            _this = _super.call(this, walker, memo) || this;
            _this.nameResolver = _this._cloneIfNeeded(walker.nameResolver, memo);
            _this.subwalker = walker.subwalker._clone(memo);
        }
        else {
            var el = elOrWalker;
            var nameResolver = isNameResolver(nameResolverOrMemo);
            _this = _super.call(this, el) || this;
            _this.nameResolver = nameResolver;
            _this.subwalker = el.pat.newWalker(_this.nameResolver);
        }
        return _this;
    }
    return DefineWalker;
}(SingleSubwalker));
addWalker(Define, DefineWalker);
//  LocalWords:  RNG MPL lookahead xmlns uri CodeMirror tokenizer enterStartTag
//  LocalWords:  EOF attributeName el xmlPath buf nameOrPath util ret EventSet
//  LocalWords:  NameResolver args unshift HashSet subpatterns newID NG vm pre
//  LocalWords:  firstName lastName attributeValue leaveStartTag dumpTree const
//  LocalWords:  dumpTreeBuf subwalker fireEvent suppressAttributes HashMap
//  LocalWords:  ValidationError addWalker RefWalker DefineWalker

//# sourceMappingURL=base.js.map


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Validation errors.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
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
 * The ``fireEvent`` methods return an array of objects of this class to
 * notify the caller of errors in the file being validated.
 *
 * Note that these error objects do not record what (element, attribute, text,
 * etc.) in the XML document was responsible for the error. It is the
 * responsibility of the code that uses salve to combine the error message with
 * an object that points into the document being validated.
 *
 * This is particularly important when considering the equality of errors. Two
 * errors are considered equal if their messages (with names) are the
 * same. *They could still be associated with two different locations in the
 * document being validated.* The code calling salve must distinguish such
 * cases.
 */
var ValidationError = (function () {
    /**
     *
     * @param msg The error message.
     */
    function ValidationError(msg) {
        this.msg = msg;
        // May be useful for debugging:
        // this.stack_trace = new Error().stack;
    }
    /**
     * The default implementation is to return the value of calling
     * ``this.toStringWithNames(this.getNames())``.
     *
     * @returns The text representation of the error.
     */
    ValidationError.prototype.toString = function () {
        return this.toStringWithNames(this.getNames());
    };
    /**
     * This method provides the caller with the list of all names that are used in
     * the error message.
     *
     * @returns The list of names used in the error message.
     */
    ValidationError.prototype.getNames = function () {
        return [];
    };
    /**
     * This method transforms this object to a string but uses the names in the
     * parameter passed to it to format the string.
     *
     * Since salve does not work with namespace prefixes, someone using salve
     * would typically use this method so as to replace the name patterns passed
     * in error messages with qualified names.
     *
     * @param names The array of names to use. This should be an array of the same
     * length as that returned by [[getNames]] . Each element of the array
     * corresponds to each name in [[getNames]] and should be something that can
     * be converted to a meaningful string.
     *
     * @returns The object formatted as a string.
     */
    ValidationError.prototype.toStringWithNames = function (names) {
        // We do not have names in ValidationError
        return this.msg;
    };
    /**
     * Two [[ValidationError]] objects are considered equal if the values returned
     * by [[toString]] are equal.
     *
     * @param other The other validation error to compare against.
     *
     * @returns Whether ``this`` and ``other`` are equal.
     */
    ValidationError.prototype.equals = function (other) {
        return (this === other) || (this.toString() === other.toString());
    };
    return ValidationError;
}());
exports.ValidationError = ValidationError;
/**
 * This class serves as a base for all those errors that have only
 * one name involved.
 */
var SingleNameError = (function (_super) {
    __extends(SingleNameError, _super);
    /**
     * @param msg The error message.
     *
     * @param name The name of the XML entity at stake.
     */
    function SingleNameError(msg, name) {
        var _this = _super.call(this, msg) || this;
        _this.name = name;
        return _this;
    }
    SingleNameError.prototype.getNames = function () {
        return [this.name];
    };
    SingleNameError.prototype.toStringWithNames = function (names) {
        return this.msg + ": " + names[0].toString();
    };
    return SingleNameError;
}(ValidationError));
exports.SingleNameError = SingleNameError;
/**
 * Error returned when an attribute name is invalid.
 */
var AttributeNameError = (function (_super) {
    __extends(AttributeNameError, _super);
    function AttributeNameError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return AttributeNameError;
}(SingleNameError));
exports.AttributeNameError = AttributeNameError;
/**
 * Error returned when an attribute value is invalid.
 */
var AttributeValueError = (function (_super) {
    __extends(AttributeValueError, _super);
    function AttributeValueError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return AttributeValueError;
}(SingleNameError));
exports.AttributeValueError = AttributeValueError;
/**
 * Error returned when an element is invalid.
 */
var ElementNameError = (function (_super) {
    __extends(ElementNameError, _super);
    function ElementNameError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ElementNameError;
}(SingleNameError));
exports.ElementNameError = ElementNameError;
/**
 * Error returned when choice was not satisfied.
 */
var ChoiceError = (function (_super) {
    __extends(ChoiceError, _super);
    /**
     * @param namesA The names of the first XML entities at stake.
     *
     * @param namesB The names of the second XML entities at stake.
     */
    function ChoiceError(namesA, namesB) {
        var _this = _super.call(this, "") || this;
        _this.namesA = namesA;
        _this.namesB = namesB;
        return _this;
    }
    ChoiceError.prototype.getNames = function () {
        return this.namesA.concat(this.namesB);
    };
    ChoiceError.prototype.toStringWithNames = function (names) {
        var first = names.slice(0, this.namesA.length);
        var second = names.slice(this.namesA.length);
        return "must choose either " + first.join(", ") + " or " + second.join(", ");
    };
    return ChoiceError;
}(ValidationError));
exports.ChoiceError = ChoiceError;
//  LocalWords:  MPL ValidationError toStringWithNames getNames toString

//# sourceMappingURL=errors.js.map


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
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
 * Base class for all name patterns.
 */
var Base = (function () {
    /**
     * @param path The XML path of the element that corresponds to this
     * object in the Relax NG schema from which this object was constructed.
     */
    function Base(path) {
        this.path = path;
    }
    /**
     * Gets the list of namespaces used in the pattern. An ``::except`` entry
     * indicates that there are exceptions in the pattern. A ``*`` entry indicates
     * that any namespace is allowed.
     *
     * This method should be used by client code to help determine how to prompt
     * the user for a namespace. If the return value is a list without
     * ``::except`` or ``*``, the client code knows there is a finite list of
     * namespaces expected, and what the possible values are. So it could present
     * the user with a choice from the set. If ``::except`` or ``*`` appears in
     * the list, then a different strategy must be used.
     *
     * @returns The list of namespaces.
     */
    Base.prototype.getNamespaces = function () {
        var namespaces = Object.create(null);
        this._recordNamespaces(namespaces);
        return Object.keys(namespaces);
    };
    /**
     * Alias of [[Base.toObject]].
     *
     * ``toJSON`` is a misnomer, as the data returned is not JSON but a JavaScript
     * object. This method exists so that ``JSON.stringify`` can use it.
     */
    Base.prototype.toJSON = function () {
        return this.toObject();
    };
    /**
     * Stringify the pattern to a JSON string.
     *
     * @returns The stringified instance.
     */
    Base.prototype.toString = function () {
        return JSON.stringify(this);
    };
    return Base;
}());
exports.Base = Base;
/**
 * Models the Relax NG ``<name>`` element.
 *
 */
var Name = (function (_super) {
    __extends(Name, _super);
    /**
     * @param path See parent class.
     *
     * @param ns The namespace URI for this name. Corresponds to the
     * ``ns`` attribute in the simplified Relax NG syntax.
     *
     * @param name The name. Corresponds to the content of ``<name>``
     * in the simplified Relax NG syntax.
     */
    function Name(path, ns, name) {
        var _this = _super.call(this, path) || this;
        _this.ns = ns;
        _this.name = name;
        return _this;
    }
    Name.prototype.match = function (ns, name) {
        return this.ns === ns && this.name === name;
    };
    Name.prototype.wildcardMatch = function (ns, name) {
        return false; // This is not a wildcard.
    };
    Name.prototype.toObject = function () {
        return {
            ns: this.ns,
            name: this.name,
        };
    };
    Name.prototype.simple = function () {
        return true;
    };
    Name.prototype.toArray = function () {
        return [this];
    };
    Name.prototype._recordNamespaces = function (namespaces) {
        namespaces[this.ns] = 1;
    };
    return Name;
}(Base));
exports.Name = Name;
/**
 * Models the Relax NG ``<choice>`` element when it appears in a name
 * class.
 */
var NameChoice = (function (_super) {
    __extends(NameChoice, _super);
    /**
     * @param path See parent class.
     *
     * @param pats An array of length 2 which
     * contains the two choices allowed by this object.
     */
    function NameChoice(path, pats) {
        var _this = _super.call(this, path) || this;
        _this.a = pats[0], _this.b = pats[1];
        return _this;
    }
    NameChoice.prototype.match = function (ns, name) {
        return this.a.match(ns, name) || this.b.match(ns, name);
    };
    NameChoice.prototype.wildcardMatch = function (ns, name) {
        return this.a.wildcardMatch(ns, name) || this.b.wildcardMatch(ns, name);
    };
    NameChoice.prototype.toObject = function () {
        return {
            a: this.a.toObject(),
            b: this.b.toObject(),
        };
    };
    NameChoice.prototype.simple = function () {
        return this.a.simple() && this.b.simple();
    };
    NameChoice.prototype.toArray = function () {
        var aArr = this.a.toArray();
        if (aArr === null) {
            return null;
        }
        var bArr = this.b.toArray();
        if (bArr === null) {
            return null;
        }
        return aArr.concat(bArr);
    };
    NameChoice.prototype._recordNamespaces = function (namespaces) {
        this.a._recordNamespaces(namespaces);
        this.b._recordNamespaces(namespaces);
    };
    return NameChoice;
}(Base));
exports.NameChoice = NameChoice;
/**
 * Models the Relax NG ``<nsName>`` element.
 */
var NsName = (function (_super) {
    __extends(NsName, _super);
    /**
     *
     * @param path See parent class.
     *
     * @param ns The namespace URI for this name. Corresponds to the ``ns``
     * attribute in the simplified Relax NG syntax.
     *
     * @param except Corresponds to an ``<except>`` element appearing as a child
     * of the ``<nsName>`` element in the Relax NG schema.
     */
    function NsName(path, ns, except) {
        var _this = _super.call(this, path) || this;
        _this.ns = ns;
        _this.except = except;
        return _this;
    }
    NsName.prototype.match = function (ns, name) {
        return this.ns === ns && !(this.except !== undefined &&
            this.except.match(ns, name));
    };
    NsName.prototype.wildcardMatch = function (ns, name) {
        return this.match(ns, name);
    };
    NsName.prototype.toObject = function () {
        var ret = {
            ns: this.ns,
        };
        if (this.except !== undefined) {
            ret.except = this.except.toObject();
        }
        return ret;
    };
    NsName.prototype.simple = function () {
        return false;
    };
    NsName.prototype.toArray = function () {
        return null;
    };
    NsName.prototype._recordNamespaces = function (namespaces) {
        namespaces[this.ns] = 1;
        if (this.except !== undefined) {
            namespaces["::except"] = 1;
        }
    };
    return NsName;
}(Base));
exports.NsName = NsName;
/**
 * Models the Relax NG ``<anyName>`` element.
 */
var AnyName = (function (_super) {
    __extends(AnyName, _super);
    /**
     * @param path See parent class.
     *
     * @param except Corresponds to an ``<except>`` element appearing as a child
     * of the ``<anyName>`` element in the Relax NG schema.
     */
    function AnyName(path, except) {
        var _this = _super.call(this, path) || this;
        _this.except = except;
        return _this;
    }
    AnyName.prototype.match = function (ns, name) {
        return (this.except === undefined) || !this.except.match(ns, name);
    };
    AnyName.prototype.wildcardMatch = function (ns, name) {
        return this.match(ns, name);
    };
    AnyName.prototype.toObject = function () {
        var ret = {
            pattern: "AnyName",
        };
        if (this.except !== undefined) {
            ret.except = this.except.toObject();
        }
        return ret;
    };
    AnyName.prototype.simple = function () {
        return false;
    };
    AnyName.prototype.toArray = function () {
        return null;
    };
    AnyName.prototype._recordNamespaces = function (namespaces) {
        namespaces["*"] = 1;
        if (this.except !== undefined) {
            namespaces["::except"] = 1;
        }
    };
    return AnyName;
}(Base));
exports.AnyName = AnyName;
//  LocalWords:  MPL NG Stringify stringified AnyName

//# sourceMappingURL=name_patterns.js.map


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Implements a name resolver for handling namespace changes in XML.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
Object.defineProperty(exports, "__esModule", { value: true });
var ename_1 = __webpack_require__(4);
//
// Both defined at:
// http://www.w3.org/TR/REC-xml-names/#ns-decl
//
/**
 * The namespace URI for the "xml" prefix. This is part of the [XML
 * spec](http://www.w3.org/TR/REC-xml-names/#ns-decl).
 */
// tslint:disable-next-line: no-http-string
exports.XML1_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
/**
 * The namespace URI for the "xmlns" prefix. This is part of the [XML
 * spec](http://www.w3.org/TR/REC-xml-names/#ns-decl).
 */
// tslint:disable-next-line: no-http-string
exports.XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
/**
 * A resolution context.
 *
 * @private
 */
var Context = (function () {
    function Context() {
        /**
         * A mapping from namespace prefix to namespace uri.
         */
        this.forward = Object.create(null);
        /**
         * A mapping from namespace uri to namespace prefixes. It is "prefixes" in the
         * plural because multiple prefixes may exist for the same uri.
         */
        this.backwards = Object.create(null);
    }
    return Context;
}());
/**
 * A name resolver for handling namespace changes in XML. This name
 * resolver maintains mappings from namespace prefix to namespace URI.
 */
var NameResolver = (function () {
    function NameResolver(other) {
        this.id = "N" + this.__newID();
        if (other !== undefined) {
            this._contextStack = other._contextStack.slice();
        }
        else {
            this._contextStack = [];
            // Create a default context.
            this.enterContext();
            // Both namespaces defined at:
            // http://www.w3.org/TR/REC-xml-names/#ns-decl
            // Skip definePrefix for these initial values.
            /* tslint:disable no-string-literal */
            this._contextStack[0].forward["xml"] = exports.XML1_NAMESPACE;
            this._contextStack[0].backwards[exports.XML1_NAMESPACE] = ["xml"];
            this._contextStack[0].forward["xmlns"] = exports.XMLNS_NAMESPACE;
            this._contextStack[0].backwards[exports.XMLNS_NAMESPACE] = ["xmlns"];
            /* tslint:enable no-string-literal */
        }
    }
    /**
     * This method is mainly used to be able to use [[NameResolver]] objects in a
     * collection.
     *
     * Returns a hash guaranteed to be unique to this object. There are some
     * limitations. First, if this module is instantiated twice, the objects
     * created by the two instances cannot mix without violating the uniqueness
     * guarantee. Second, the hash is a monotonically increasing counter, so when
     * it reaches beyond the maximum integer that the JavaScript vm can handle,
     * things go kaboom.
     *
     * @returns A number unique to this object.
     */
    NameResolver.prototype.hash = function () {
        return this.id;
    };
    /**
     * Makes a deep copy.
     *
     * @returns A deep copy of the resolver.
     */
    NameResolver.prototype.clone = function () {
        return new NameResolver(this);
    };
    /**
     * Defines a (prefix, URI) mapping.
     *
     * @param prefix The namespace prefix to associate with the URI.
     *
     * @param uri The namespace URI associated with the prefix.
     */
    NameResolver.prototype.definePrefix = function (prefix, uri) {
        // http://www.w3.org/TR/REC-xml-names/#ns-decl
        if (prefix === "xmlns") {
            throw new Error("trying to define 'xmlns' but the XML Namespaces " +
                "standard stipulates that 'xmlns' cannot be " +
                "declared (= \"defined\")");
        }
        if (prefix === "xml" && uri !== exports.XML1_NAMESPACE) {
            throw new Error("trying to define 'xml' to an incorrect URI");
        }
        this._contextStack[0].forward[prefix] = uri;
        var prefixes = this._contextStack[0].backwards[uri];
        if (prefixes === undefined) {
            prefixes = this._contextStack[0].backwards[uri] = [];
        }
        // This ensure that the default namespace is given priority when
        // unresolving names.
        if (prefix === "") {
            prefixes.unshift("");
        }
        else {
            prefixes.push(prefix);
        }
    };
    /**
     * This method is called to indicate the start of a new context.  Contexts
     * enable this class to support namespace redeclarations. In XML, each start
     * tag can potentially redefine a prefix that was already defined by an
     * ancestor. When using this class, such redefinition must appear in a new
     * context, otherwise it would merely overwrite the old definition.
     *
     * At creation, a [[NameResolver]] has a default context already
     * created. There is no need to create it and it is not possible to leave it.
     */
    NameResolver.prototype.enterContext = function () {
        this._contextStack.unshift(new Context());
    };
    /**
     * This method is called to indicate the end of a context. Whatever context
     * was in effect when the current context ends becomes effective.
     *
     * @throws {Error} If this method is called when there is no context created
     * by [[NameResolver.enterContext]].
     */
    NameResolver.prototype.leaveContext = function () {
        if (this._contextStack.length > 1) {
            this._contextStack.shift();
        }
        else {
            throw new Error("trying to leave the default context");
        }
    };
    /**
     * Resolves a qualified name to an expanded name. A qualified name is an XML
     * name optionally prefixed by a namespace prefix. For instance, in ``<html
     * xml:lang="en">``, "html" is a name without a prefix, and "xml:lang" is a
     * name with the "xml" prefix. An expanded name is a (URI, name) pair.
     *
     * @param name The name to resolve.
     *
     * @param attribute Whether this name appears as an attribute.
     *
     * @throws {Error} If the name is malformed. For instance, a name with two
     * colons would be malformed.
     *
     * @returns The expanded name, or ``undefined`` if the name cannot be
     * resolved.
     */
    NameResolver.prototype.resolveName = function (name, attribute) {
        if (attribute === void 0) { attribute = false; }
        var parts = name.split(":");
        if (parts.length === 1) {
            if (attribute) {
                return new ename_1.EName("", name);
            }
            // We are searching for the default namespace currently in effect.
            parts = ["", name];
        }
        if (parts.length > 2) {
            throw new Error("invalid name passed to resolveName");
        }
        // Search through the contexts
        var uri;
        for (var cIx = 0; (uri === undefined) && (cIx < this._contextStack.length); ++cIx) {
            var ctx = this._contextStack[cIx];
            uri = ctx.forward[parts[0]];
        }
        if (uri === undefined) {
            return (parts[0] === "") ? new ename_1.EName("", parts[1]) : undefined;
        }
        return new ename_1.EName(uri, parts[1]);
    };
    /**
     * Unresolves an expanded name to a qualified name. An expanded name is a
     * (URI, name) pair. Note that if we execute:
     *
     * <pre>
     *   var nameResolver = new NameResolver();
     *   var ename = nameResolver.resolveName(qname);
     *   var qname2 = nameResolver.unresolveName(ename.ns, ename.name);
     * </pre>
     *
     * then ``qname === qname2`` is not necessarily true. This would happen if two
     * prefixes map to the same URI. In such case the prefix provided in the
     * return value is arbitrarily chosen.
     *
     * @param uri The URI part of the expanded name. An empty string is
     * valid, and basically means "no namespace". This occurs for unprefixed
     * attributes but could also happen if the default namespace is undeclared.
     *
     * @param  name The name part.
     *
     * @returns The qualified name that corresponds to the expanded name, or
     * ``undefined`` if it cannot be resolved.
     */
    NameResolver.prototype.unresolveName = function (uri, name) {
        if (uri === "") {
            return name;
        }
        // Search through the contexts
        var prefixes;
        for (var cIx = 0; (prefixes === undefined) &&
            (cIx < this._contextStack.length); ++cIx) {
            var ctx = this._contextStack[cIx];
            prefixes = ctx.backwards[uri];
        }
        if (prefixes === undefined) {
            return undefined;
        }
        var pre = prefixes[0];
        return (pre !== "") ? pre + ":" + name : name;
    };
    /**
     * Returns a prefix that, in the current context, is mapped to the URI
     * specified. Note that this function will return the first prefix that
     * satisfies the requirement, starting from the innermost context.
     *
     * @param uri A URI for which to get a prefix.
     *
     * @returns A prefix that maps to this URI. Undefined if there is no prefix
     * available.
     */
    NameResolver.prototype.prefixFromURI = function (uri) {
        var prefixes;
        for (var cIx = 0; (prefixes === undefined) &&
            (cIx < this._contextStack.length); ++cIx) {
            var ctx = this._contextStack[cIx];
            prefixes = ctx.backwards[uri];
        }
        if (prefixes === undefined) {
            return undefined;
        }
        return prefixes[0];
    };
    /**
     * Gets a new Pattern id.
     *
     * @returns The new id.
     */
    NameResolver.prototype.__newID = function () {
        return NameResolver.__id++;
    };
    /**
     * The next id to associate to the next NameResolver object to be created.
     * This is used so that [[NameResolver.hash]] can return unique values.
     */
    NameResolver.__id = 0; // tslint:disable-line: variable-name
    return NameResolver;
}());
exports.NameResolver = NameResolver;
//  LocalWords:  unprefixed nameResolver pre definePrefix Unresolves qname vm
//  LocalWords:  redeclarations newID ename lang html NameResolver Mangalam uri
//  LocalWords:  xmlns URI Dubeau resolveName xml MPL unresolving namespace

//# sourceMappingURL=name_resolver.js.map


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Class for XML Expanded Names.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Immutable objects modeling XML Expanded Names.
 */
var EName = (function () {
    /**
     * @param ns The namespace URI.
     *
     * @param name The local name of the entity.
     */
    function EName(ns, name) {
        this.ns = ns;
        this.name = name;
    }
    /**
     * @returns A string representing the expanded name.
     */
    EName.prototype.toString = function () {
        return "{" + this.ns + "}" + this.name;
    };
    /**
     * Compares two expanded names.
     *
     * @param other The other object to compare this object with.
     *
     * @returns  ``true`` if this object equals the other.
     */
    EName.prototype.equal = function (other) {
        return this.ns === other.ns && this.name === other.name;
    };
    return EName;
}());
exports.EName = EName;
//  LocalWords:  MPL ns

//# sourceMappingURL=ename.js.map


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Errors that can be raised during parsing of types.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
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
var tools_1 = __webpack_require__(7);
/**
 * Records an error due to an incorrect parameter (``<param>``) value. This is
 * an error in the **schema** used to validate a document. Note that these
 * errors are *returned* by salve's internal code. They are not *thrown*.
 */
var ParamError = (function () {
    /**
     *
     * @param message The actual error description.
     */
    function ParamError(message) {
        this.message = message;
    }
    ParamError.prototype.toString = function () {
        return this.message;
    };
    return ParamError;
}());
exports.ParamError = ParamError;
/**
 * Records an error due to an incorrect value (``<value>``).  This is an error
 * in the **schema** used to validate a document. Note that these errors are
 * *returned* by salve's internal code. They are not *thrown*.
 */
var ValueError = (function () {
    /**
     * @param message The actual error description.
     */
    function ValueError(message) {
        this.message = message;
    }
    ValueError.prototype.toString = function () {
        return this.message;
    };
    return ValueError;
}());
exports.ValueError = ValueError;
/**
 * Records the failure of parsing a parameter (``<param>``) value. Whereas
 * [[ParamError]] records each individual issue with a parameter's parsing, this
 * object is used to throw a single failure that collects all the individual
 * issues that were encountered.
 */
var ParameterParsingError = (function (_super) {
    __extends(ParameterParsingError, _super);
    /**
     *
     * @param location The location of the ``<param>`` in the schema.
     *
     * @param errors The errors encountered.
     */
    function ParameterParsingError(location, errors) {
        var _this = _super.call(this) || this;
        _this.errors = errors;
        // This is crap to work around the fact that Error is a terribly badly
        // designed class or prototype or whatever. Unfortunately the stack trace is
        // off...
        var msg = location + ": " + errors.map(function (x) { return x.toString(); }).join("\n");
        var err = new Error(msg);
        _this.name = "ParameterParsingError";
        _this.stack = err.stack;
        _this.message = err.message;
        tools_1.fixPrototype(_this, ParameterParsingError);
        return _this;
    }
    return ParameterParsingError;
}(Error));
exports.ParameterParsingError = ParameterParsingError;
/**
 * Records the failure of parsing a value (``<value>``). Whereas [[ValueError]]
 * records each individual issue with a value's parsing, this object is used to
 * throw a single failure that collects all the individual issues that were
 * encountered.
 */
var ValueValidationError = (function (_super) {
    __extends(ValueValidationError, _super);
    /**
     * @param errors The errors encountered.
     */
    function ValueValidationError(errors) {
        var _this = _super.call(this) || this;
        _this.errors = errors;
        // This is crap to work around the fact that Error is a terribly badly
        // designed class or prototype or whatever. Unfortunately the stack trace is
        // off...
        var msg = errors.map(function (x) { return x.toString(); }).join("\n");
        var err = new Error(msg);
        _this.name = "ValueValidationError";
        _this.stack = err.stack;
        _this.message = err.message;
        tools_1.fixPrototype(_this, ValueValidationError);
        return _this;
    }
    return ValueValidationError;
}(Error));
exports.ValueValidationError = ValueValidationError;
//  LocalWords:  MPL ParamError ParameterParsingError ValueValidationError

//# sourceMappingURL=errors.js.map


/***/ }),
/* 6 */
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
var base_1 = __webpack_require__(0);
/**
 * Pattern for ``<notAllowed/>``.
 */
var NotAllowed = (function (_super) {
    __extends(NotAllowed, _super);
    function NotAllowed() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return NotAllowed;
}(base_1.Pattern));
exports.NotAllowed = NotAllowed;
/**
 * Walker for [[NotAllowed]];
 */
var NotAllowedWalker = (function (_super) {
    __extends(NotAllowedWalker, _super);
    function NotAllowedWalker(elOrWalker, memo) {
        var _this = this;
        if (elOrWalker instanceof NotAllowedWalker) {
            var walker = elOrWalker;
            memo = base_1.isHashMap(memo); // Makes sure it is not undefined.
            _this = _super.call(this, walker, memo) || this;
        }
        else {
            var el = elOrWalker;
            _this = _super.call(this, el) || this;
            _this.possibleCached = new base_1.EventSet();
        }
        return _this;
    }
    NotAllowedWalker.prototype.possible = function () {
        // Save some time by avoiding calling _possible
        return new base_1.EventSet();
    };
    NotAllowedWalker.prototype._possible = function () {
        // possibleCached is necessarily defined because of the constructor's
        // logic.
        // tslint:disable-next-line:no-non-null-assertion
        return this.possibleCached;
    };
    NotAllowedWalker.prototype.fireEvent = function (ev) {
        return undefined; // we never match!
    };
    return NotAllowedWalker;
}(base_1.Walker));
exports.NotAllowedWalker = NotAllowedWalker;
base_1.addWalker(NotAllowed, NotAllowedWalker);
//  LocalWords:  RNG's MPL possibleCached

//# sourceMappingURL=not_allowed.js.map


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Common tools for salve.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @private
 */
function copy(target, source) {
    for (var i in source) {
        target[i] = source[i];
    }
}
/**
 * Modify ``target`` by copying the sources into it. This function is designed
 * to fit the internal needs of salve and is not meant as a general purpose
 * "extend" function like provided by jQuery or Lodash (for instance).
 *
 * @param target The target to copy into.
 *
 * @param sources The sources from which to copy. These sources are
 * processed in order.
 *
 * @returns The target, modified.
 */
function extend(target) {
    var sources = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        sources[_i - 1] = arguments[_i];
    }
    for (var _a = 0, sources_1 = sources; _a < sources_1.length; _a++) {
        var source = sources_1[_a];
        copy(target, source);
    }
    return target;
}
exports.extend = extend;
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
        Object.getPrototypeOf(obj) : obj.__proto__;
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
//  LocalWords:  MPL jQuery Lodash

//# sourceMappingURL=tools.js.map


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Implementations of some simple collections. This module is meant for salve's
 * internal purposes only. It may be yanked at any time. Do not use in your own
 * code.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 * @private
 */
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
 * The HashBase class provides a base class for the collections in this module.
 */
var HashBase = (function () {
    /**
     * @param hashF A function which returns a uniquely identifying hash when
     * called with an object that a ``HashBase`` instance uses.
     *
     * @param initial An initial value for the object being constructed.
     */
    function HashBase(hashF, initial) {
        this.hashF = hashF;
        /**
         * The backing store that holds objects added to this collection.
         */
        this.backing = Object.create(null);
        /**
         * The cached size of the collection.
         */
        this._size = 0;
        if (initial !== undefined) {
            if (initial instanceof HashBase) {
                var backing = this.backing;
                var initialBacking = initial.backing;
                var keys = Object.keys(initialBacking);
                for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                    var key = keys_1[_i];
                    backing[key] = initialBacking[key];
                }
                this._size = keys.length;
            }
            else if (initial instanceof Array) {
                for (var _a = 0, initial_1 = initial; _a < initial_1.length; _a++) {
                    var value = initial_1[_a];
                    this.add(value);
                }
            }
            else {
                this.add(initial);
            }
        }
    }
    /**
     * Unites this object with another object. This method modifies the object
     * upon which it is called so as to make it a mathematical union of the two
     * objects.
     *
     * @param s The object to unite with this one. Must be of the same class as
     * this object.
     *
     * @throws {Error} If ``s`` is not of the same type as this object.
     */
    HashBase.prototype.union = function (s) {
        if (s == null) {
            return;
        }
        if (!(s instanceof this.constructor)) {
            throw new Error("union invalid class object; my class " + this.constructor.name + " other class " + s.constructor.name);
        }
        var backing = s.backing;
        var keys = Object.keys(backing);
        for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
            var key = keys_2[_i];
            this._store(key, backing[key]);
        }
    };
    /**
     * Applies a function on each value stored in the object.
     *
     * @param f A function which accepts one parameter. The function will be
     * called on each value.
     */
    HashBase.prototype.forEach = function (f) {
        var backing = this.backing;
        var keys = Object.keys(backing);
        for (var _i = 0, keys_3 = keys; _i < keys_3.length; _i++) {
            var key = keys_3[_i];
            f(backing[key]);
        }
    };
    /**
     * @returns The number of values stored.
     */
    HashBase.prototype.size = function () {
        return this._size;
    };
    /**
     * Selects a subset of values.
     *
     * @param f A function that selects values. It is called with each value. If
     * the value happens to be an ``Array`` then the function is *applied* to this
     * array. A return value which is truthy includes the value, otherwise the
     * value is excluded.
     *
     * @returns An object of the same class as the object on which the method is
     * called. This object contains only the value selected by the function.
     */
    HashBase.prototype.filter = function (f) {
        var ret = new this.constructor();
        if (ret.hashF === undefined) {
            ret.hashF = this.hashF;
        }
        var backing = this.backing;
        var keys = Object.keys(backing);
        for (var _i = 0, keys_4 = keys; _i < keys_4.length; _i++) {
            var key = keys_4[_i];
            var data = backing[key];
            var args = data instanceof Array ? data : [data];
            if (f.apply(undefined, args)) {
                ret._store(key, data);
            }
        }
        return ret;
    };
    /**
     * Tests whether a value is contained in the object on which this method is
     * called.
     *
     * @param obj The value for which to test.
     *
     * @returns ``true`` if the value is present, ``false`` if not.
     */
    HashBase.prototype.has = function (obj) {
        var hash = this.hashF(obj);
        return this.backing[hash] !== undefined;
    };
    /**
     * Converts the object on which this method is called to a string.
     *
     * @returns All the values, joined with ", ".
     */
    HashBase.prototype.toString = function () {
        return this.toArray().join(", ");
    };
    /**
     * Converts the object on which this method is called to an array.
     *
     * @returns An array that corresponds to the object.
     *
     */
    HashBase.prototype.toArray = function () {
        var t = [];
        var backing = this.backing;
        var keys = Object.keys(backing);
        for (var _i = 0, keys_5 = keys; _i < keys_5.length; _i++) {
            var key = keys_5[_i];
            t.push(backing[key]);
        }
        return t;
    };
    /**
     * Record a hash and value pair into the backing store. Effectively associates
     * the hash with the value. This method assumes but does not verify that the
     * mapping from hash to value is unique. This method cannot be used to
     * **change** such mapping.
     *
     * @param hash The hash with which to associate the value. Can be any type
     * that can be used as an array index.
     *
     * @param val The value to associate with the hash.
     *
     * @throws {Error} If the hash is undefined or null.
     */
    HashBase.prototype._store = function (hash, val) {
        if (hash == null) {
            throw new Error("undefined or null hash");
        }
        if (this.backing[hash] === undefined) {
            this.backing[hash] = val;
            this._size++;
        }
        // else noop
    };
    return HashBase;
}());
exports.HashBase = HashBase;
/**
 * A set of objects. The objects are distinguished by a hash
 * function.
 */
var HashSet = (function (_super) {
    __extends(HashSet, _super);
    function HashSet() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Adds a value to the set.
     *
     * @param x The value to add. This value must be hashable by the hash function
     * that was used to create the collection.
     */
    HashSet.prototype.add = function (x) {
        this._store(this.hashF(x), x);
    };
    return HashSet;
}(HashBase));
exports.HashSet = HashSet;
/**
 * A map of (key, value) pairs. The keys are distinguished by means of a hash
 * function.
 */
var HashMap = (function (_super) {
    __extends(HashMap, _super);
    function HashMap(hashF, initial) {
        var _this = _super.call(this, hashF, initial) || this;
        _this.hashF = hashF;
        return _this;
    }
    // The arrays stored in the backing store are considered immutable.
    /**
     * Adds a (key, value) mapping to the map.
     *
     * @param key This must be a value hashable with the hash function that was
     * used to create the collection.
     *
     * @param value The value to associate with the key.
     */
    HashMap.prototype.add = function (key, value) {
        this._store(this.hashF(key), [key, value]);
    };
    HashMap.prototype.forEach = function (f) {
        var backing = this.backing;
        var keys = Object.keys(backing);
        for (var _i = 0, keys_6 = keys; _i < keys_6.length; _i++) {
            var key = keys_6[_i];
            f(backing[key][0], backing[key][1]);
        }
    };
    /**
     * Checks whether an object is a key of the map, and returns its associated
     * value if present.
     *
     * @param obj The object to check.
     *
     * @returns The value associated with the object if present. ``undefined`` if
     * not.
     */
    HashMap.prototype.has = function (obj) {
        var hash = this.hashF(obj);
        var pair = this.backing[hash];
        if (pair !== undefined) {
            return pair[1];
        }
        return undefined;
    };
    /**
     * Gets the keys present in this mapping.
     */
    HashMap.prototype.keys = function () {
        return Object.keys(this.backing);
    };
    return HashMap;
}(HashBase));
exports.HashMap = HashMap;
//  LocalWords:  truthy Mangalam Dubeau hashable HashMap HashSet noop HashBase
//  LocalWords:  MPL

//# sourceMappingURL=hashstructs.js.map


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Classes that model RNG patterns.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var ename_1 = __webpack_require__(4);
var attribute_1 = __webpack_require__(18);
var base_1 = __webpack_require__(0);
var choice_1 = __webpack_require__(19);
var data_1 = __webpack_require__(20);
var element_1 = __webpack_require__(21);
var empty_1 = __webpack_require__(22);
var grammar_1 = __webpack_require__(12);
var group_1 = __webpack_require__(23);
var interleave_1 = __webpack_require__(24);
var list_1 = __webpack_require__(25);
var not_allowed_1 = __webpack_require__(6);
var one_or_more_1 = __webpack_require__(26);
var param_1 = __webpack_require__(27);
var text_1 = __webpack_require__(28);
var value_1 = __webpack_require__(29);
var namePatterns = __webpack_require__(2);
var base_2 = __webpack_require__(0);
exports.eventsToTreeString = base_2.eventsToTreeString;
exports.Event = base_2.Event;
exports.EventSet = base_2.EventSet;
exports.BasePattern = base_2.BasePattern;
exports.Walker = base_2.Walker;
var grammar_2 = __webpack_require__(12);
exports.Grammar = grammar_2.Grammar;
exports.GrammarWalker = grammar_2.GrammarWalker;
exports.RefError = grammar_2.RefError;
//
// Things used only during testing.
//
var tret = {
    GrammarWalker: grammar_1.GrammarWalker,
    Text: text_1.Text,
};
function __test() {
    return tret;
}
exports.__test = __test;
// tslint:disable-next-line:variable-name
exports.__protected = {
    Empty: empty_1.Empty,
    Data: data_1.Data,
    List: list_1.List,
    Param: param_1.Param,
    Value: value_1.Value,
    NotAllowed: not_allowed_1.NotAllowed,
    Text: text_1.Text,
    Ref: base_1.Ref,
    OneOrMore: one_or_more_1.OneOrMore,
    Choice: choice_1.Choice,
    Group: group_1.Group,
    Attribute: attribute_1.Attribute,
    Element: element_1.Element,
    Define: base_1.Define,
    Grammar: grammar_1.Grammar,
    EName: ename_1.EName,
    Interleave: interleave_1.Interleave,
    Name: namePatterns.Name,
    NameChoice: namePatterns.NameChoice,
    NsName: namePatterns.NsName,
    AnyName: namePatterns.AnyName,
};
/*  tslint:enable */
//  LocalWords:  EName NotAllowed oneOrMore RNG MPL Dubeau GrammarWalker rng
//  LocalWords:  notAllowed Mangalam EventSet

//# sourceMappingURL=patterns.js.map


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Classes that model datatypes used in RNG schemas.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
var builtin_1 = __webpack_require__(15);
var xmlschema_1 = __webpack_require__(17);
/**
 * The registry of types.
 */
var Registry = (function () {
    function Registry() {
        this.libraries = Object.create(null);
    }
    /**
     * Adds a library to the registry.
     *
     * @param library The library to add to the registry.
     *
     * @throws {Error} If the URI is already registered.
     */
    Registry.prototype.add = function (library) {
        var uri = library.uri;
        if (uri in this.libraries) {
            throw new Error("URI clash: " + uri);
        }
        this.libraries[uri] = library;
    };
    /**
     * Searches for a URI in the library.
     *
     * @param uri The URI to search for.
     *
     * @returns The library that corresponds to the URI or ``undefined`` if no
     * such library exists.
     */
    Registry.prototype.find = function (uri) {
        return this.libraries[uri];
    };
    /**
     * Gets the library corresponding to a URI.
     *
     * @param uri The URI.
     *
     * @returns The library that corresponds to the URI.
     *
     * @throws {Error} If the library does not exist.
     */
    // tslint:disable-next-line: no-reserved-keywords
    Registry.prototype.get = function (uri) {
        var ret = this.find(uri);
        if (ret === undefined) {
            throw new Error("can't get library with URI: " + uri);
        }
        return ret;
    };
    return Registry;
}());
exports.Registry = Registry;
exports.registry = new Registry();
exports.registry.add(builtin_1.builtin);
exports.registry.add(xmlschema_1.xmlschema);
var errors_1 = __webpack_require__(5);
exports.ParameterParsingError = errors_1.ParameterParsingError;
exports.ValueValidationError = errors_1.ValueValidationError;
exports.ValueError = errors_1.ValueError;
//  LocalWords:  datatypes RNG MPL uri

//# sourceMappingURL=datatypes.js.map


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Collection of constants that model the way XML refers to various
 * characters and groups of characters. This module is essentially private to
 * salve.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
Object.defineProperty(exports, "__esModule", { value: true });
// The constants here are just representations in JavaScript of the character
// classes that the XML standard uses. So we don't document them.  See the XML
// standard and read salve's code to figure out what they are for.
/* tslint:disable max-line-length */
var xmlBaseChar = "A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u0131\u0134-\u013E\u0141-\u0148\u014A-\u017E\u0180-\u01C3\u01CD-\u01F0\u01F4-\u01F5\u01FA-\u0217\u0250-\u02A8\u02BB-\u02C1\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03CE\u03D0-\u03D6\u03DA\u03DC\u03DE\u03E0\u03E2-\u03F3\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E-\u0481\u0490-\u04C4\u04C7-\u04C8\u04CB-\u04CC\u04D0-\u04EB\u04EE-\u04F5\u04F8-\u04F9\u0531-\u0556\u0559\u0561-\u0586\u05D0-\u05EA\u05F0-\u05F2\u0621-\u063A\u0641-\u064A\u0671-\u06B7\u06BA-\u06BE\u06C0-\u06CE\u06D0-\u06D3\u06D5\u06E5-\u06E6\u0905-\u0939\u093D\u0958-\u0961\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8B\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AE0\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B36-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB5\u0BB7-\u0BB9\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CDE\u0CE0-\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D60-\u0D61\u0E01-\u0E2E\u0E30\u0E32-\u0E33\u0E40-\u0E45\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EAE\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0F40-\u0F47\u0F49-\u0F69\u10A0-\u10C5\u10D0-\u10F6\u1100\u1102-\u1103\u1105-\u1107\u1109\u110B-\u110C\u110E-\u1112\u113C\u113E\u1140\u114C\u114E\u1150\u1154-\u1155\u1159\u115F-\u1161\u1163\u1165\u1167\u1169\u116D-\u116E\u1172-\u1173\u1175\u119E\u11A8\u11AB\u11AE-\u11AF\u11B7-\u11B8\u11BA\u11BC-\u11C2\u11EB\u11F0\u11F9\u1E00-\u1E9B\u1EA0-\u1EF9\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A-\u212B\u212E\u2180-\u2182\u3041-\u3094\u30A1-\u30FA\u3105-\u312C\uAC00-\uD7A3";
var xmlIdeographic = "\u4E00-\u9FA5\u3007\u3021-\u3029";
exports.xmlLetter = xmlBaseChar + xmlIdeographic;
var xmlDigit = "\u0030-\u0039\u0660-\u0669\u06F0-\u06F9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE7-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29";
var xmlCombiningChar = "\u0300-\u0345\u0360-\u0361\u0483-\u0486\u0591-\u05A1\u05A3-\u05B9\u05BB-\u05BD\u05BF\u05C1-\u05C2\u05C4\u064B-\u0652\u0670\u06D6-\u06DC\u06DD-\u06DF\u06E0-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u0901-\u0903\u093C\u093E-\u094C\u094D\u0951-\u0954\u0962-\u0963\u0981-\u0983\u09BC\u09BE\u09BF\u09C0-\u09C4\u09C7-\u09C8\u09CB-\u09CD\u09D7\u09E2-\u09E3\u0A02\u0A3C\u0A3E\u0A3F\u0A40-\u0A42\u0A47-\u0A48\u0A4B-\u0A4D\u0A70-\u0A71\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0B01-\u0B03\u0B3C\u0B3E-\u0B43\u0B47-\u0B48\u0B4B-\u0B4D\u0B56-\u0B57\u0B82-\u0B83\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C01-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55-\u0C56\u0C82-\u0C83\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5-\u0CD6\u0D02-\u0D03\u0D3E-\u0D43\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB-\u0EBC\u0EC8-\u0ECD\u0F18-\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86-\u0F8B\u0F90-\u0F95\u0F97\u0F99-\u0FAD\u0FB1-\u0FB7\u0FB9\u20D0-\u20DC\u20E1\u302A-\u302F\u3099\u309A";
var xmlExtender = "\u00B7\u02D0\u02D1\u0387\u0640\u0E46\u0EC6\u3005\u3031-\u3035\u309D-\u309E\u30FC-\u30FE";
// It is important to have the dash first to avoid issues with ranges in
// regexps. Also, the following contain periods. However, they are doing to
// appear inside square bracket in the regexps.
exports.xmlNameChar = "-" + exports.xmlLetter + xmlDigit + "._:" + xmlCombiningChar + xmlExtender;
var xmlName = "[" + exports.xmlLetter + "_:](?:[" + exports.xmlNameChar + "])*";
exports.xmlNameRe = new RegExp("^" + xmlName + "$");
exports.xmlNcname = "[" + exports.xmlLetter + "_](?:[-" + exports.xmlLetter + xmlDigit + "._" + xmlCombiningChar +
    (xmlExtender + "])*");
exports.xmlNcnameRe = new RegExp("^" + exports.xmlNcname + "$");
//  LocalWords:  MPL

//# sourceMappingURL=xmlcharacters.js.map


/***/ }),
/* 12 */
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
var errors_1 = __webpack_require__(1);
var namePatterns = __webpack_require__(2);
var name_resolver_1 = __webpack_require__(3);
var tools_1 = __webpack_require__(7);
var base_1 = __webpack_require__(0);
/**
 * This is an exception raised to indicate references to undefined entities in a
 * schema. If for instance element A has element B as its children but B is not
 * defined, then this exception would be raised.
 *
 * This exception is indicative of an internal error because by the time this
 * module loads a schema, the schema should have been simplified already and
 * simplification should have failed due to the unresolvable reference.
 *
 * This class used to be named ``ReferenceError`` in previous versions of salve
 * but this name clashes with the built-in ``ReferenceError`` that JavaScript
 * engines have built into their runtime. The clash did not make the code fail
 * but it had unfortunate side-effects.
 */
var RefError = (function (_super) {
    __extends(RefError, _super);
    /**
     * @param references The set of references that could not be resolved.
     */
    function RefError(references) {
        var _this = _super.call(this) || this;
        _this.references = references;
        tools_1.fixPrototype(_this, RefError);
        return _this;
    }
    /**
     * @returns string representation of the error.
     */
    RefError.prototype.toString = function () {
        return ("Cannot resolve the following references: " + this.references.join(", "));
    };
    return RefError;
}(Error));
exports.RefError = RefError;
/**
 * Grammar object. Users of this library normally do not create objects
 * of this class themselves but rely on [["validate".constructTree]].
 */
var Grammar = (function (_super) {
    __extends(Grammar, _super);
    /**
     * @param xmlPath This is a string which uniquely identifies the
     * element from the simplified RNG tree. Used in debugging.
     *
     * @param start The start pattern of this grammar.
     *
     * @param definitions An array which contain all definitions specified in this
     * grammar.
     *
     * @throws {RefError} When any definition in the original
     * schema refers to a schema entity which is not defined in the schema.
     */
    function Grammar(xmlPath, start, definitions) {
        var _this = _super.call(this, xmlPath) || this;
        _this.xmlPath = xmlPath;
        _this.start = start;
        _this.definitions = Object.create(null);
        _this._namespaces = Object.create(null);
        if (definitions !== undefined) {
            definitions.forEach(function (x) {
                _this.add(x);
            });
        }
        var missing = _this._resolve(_this.definitions);
        if (missing !== undefined) {
            throw new RefError(missing);
        }
        _this._prepare(_this._namespaces);
        return _this;
    }
    /**
     * Adds a definition.
     *
     * @param d The definition to add.
     */
    Grammar.prototype.add = function (d) {
        this.definitions[d.name] = d;
        if (d.name === "start") {
            this.start = d;
        }
    };
    /**
     * Populates a memo with a mapping of (element name, [list of patterns]).  In
     * a Relax NG schema, the same element name may appear in multiple contexts,
     * with multiple contents. For instance an element named ``name`` could
     * require the sequence of elements ``firstName, lastName`` in a certain
     * context and text in a different context. This method allows determining
     * whether this happens or not within a pattern.
     *
     * @param memo The memo in which to store the information.
     */
    Grammar.prototype._gatherElementDefinitions = function (memo) {
        // tslint:disable-next-line:forin
        for (var d in this.definitions) {
            this.definitions[d]._gatherElementDefinitions(memo);
        }
    };
    Object.defineProperty(Grammar.prototype, "elementDefinitions", {
        get: function () {
            var ret = this._elementDefinitions;
            if (ret !== undefined) {
                return ret;
            }
            var newDef = this._elementDefinitions = Object.create(null);
            this._gatherElementDefinitions(newDef);
            return newDef;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @returns ``true`` if the schema is wholly context independent. This means
     * that each element in the schema can be validated purely on the basis of
     * knowing its expanded name. ``false`` otherwise.
     */
    Grammar.prototype.whollyContextIndependent = function () {
        var defs = this.elementDefinitions;
        for (var v in defs) {
            if (defs[v].length > 1) {
                return false;
            }
        }
        return true;
    };
    /**
     * @returns An array of all namespaces used in the schema.  The array may
     * contain two special values: ``*`` indicates that there was an ``anyName``
     * element in the schema and thus that it is probably possible to insert more
     * than the namespaces listed in the array, ``::except`` indicates that an
     * ``except`` element is affecting what namespaces are acceptable to the
     * schema.
     */
    Grammar.prototype.getNamespaces = function () {
        return Object.keys(this._namespaces);
    };
    /**
     * This method must be called after resolution has been performed.
     *
     * This function now performs two tasks: a) it prepares the attributes
     * (Definition and Element objects maintain a pattern which contains only
     * attribute patterns, and nothing else), b) it gathers all the namespaces
     * seen in the schema.
     *
     * @param namespaces An object whose keys are the namespaces seen in the
     * schema. This method populates the object.
     */
    Grammar.prototype._prepare = function (namespaces) {
        this.start._prepare(namespaces);
        // tslint:disable-next-line:forin
        for (var d in this.definitions) {
            this.definitions[d]._prepare(namespaces);
        }
    };
    Grammar.prototype._resolve = function (definitions) {
        var all = [];
        var ret;
        // tslint:disable-next-line forin
        for (var d in definitions) {
            ret = definitions[d]._resolve(definitions);
            if (ret !== undefined) {
                all = all.concat(ret);
            }
        }
        ret = this.start._resolve(definitions);
        if (ret !== undefined) {
            all = all.concat(ret);
        }
        if (all.length !== 0) {
            return all;
        }
        return undefined;
    };
    /**
     * Creates a new walker to walk this pattern.
     *
     * @returns A walker.
     */
    Grammar.prototype.newWalker = function () {
        // tslint:disable-next-line:no-use-before-declare
        return GrammarWalker.makeWalker(this);
    };
    return Grammar;
}(base_1.BasePattern));
exports.Grammar = Grammar;
/**
 * Walker for [[Grammar]].
 */
var GrammarWalker = (function (_super) {
    __extends(GrammarWalker, _super);
    function GrammarWalker(elOrWalker, memo) {
        var _this = this;
        if (elOrWalker instanceof GrammarWalker) {
            var walker = elOrWalker;
            memo = base_1.isHashMap(memo); // Checks for undefined.
            _this = _super.call(this, walker, memo) || this;
            _this.nameResolver = _this._cloneIfNeeded(walker.nameResolver, memo);
            _this.subwalker = walker.subwalker._clone(memo);
            var misplacedElements = _this._misplacedElements = [];
            for (var _i = 0, _a = walker._misplacedElements; _i < _a.length; _i++) {
                var mpe = _a[_i];
                misplacedElements.push(mpe instanceof base_1.Walker ?
                    mpe._clone(memo) :
                    mpe.concat([]));
            }
            _this._swallowAttributeValue = walker._swallowAttributeValue;
            _this.suspendedWs = walker.suspendedWs;
            _this.ignoreNextWs = walker.ignoreNextWs;
            _this._prevEvWasText = walker._prevEvWasText;
        }
        else {
            var el = elOrWalker;
            _this = _super.call(this, el) || this;
            _this.nameResolver = new name_resolver_1.NameResolver();
            _this._misplacedElements = [];
            _this._swallowAttributeValue = false;
            _this.ignoreNextWs = false;
            _this._prevEvWasText = false;
            _this.subwalker = el.start.newWalker(_this.nameResolver);
        }
        return _this;
    }
    GrammarWalker.makeWalker = function (el) {
        return new GrammarWalker(el);
    };
    /**
     * Resolves a name using the walker's own name resolver.
     *
     * @param name A qualified name.
     *
     * @param attribute Whether this qualified name refers to an attribute.
     *
     * @returns An expanded name, or undefined if the name cannot be resolved.
     */
    GrammarWalker.prototype.resolveName = function (name, attribute) {
        return this.nameResolver.resolveName(name, attribute);
    };
    /**
     * See [["name_resolver".NameResolver.unresolveName]].
     *
     * @param uri The URI part of the expanded name.
     *
     * @param name The name part.
     *
     * @returns The qualified name that corresponds to the expanded name, or
     * ``undefined`` if it cannot be resolved.
     */
    GrammarWalker.prototype.unresolveName = function (uri, name) {
        return this.nameResolver.unresolveName(uri, name);
    };
    /**
     * On a [[GrammarWalker]] this method cannot return ``undefined``. An
     * undefined value would mean nothing matched, which is a validation error.
     *
     * @param ev The event to fire.
     *
     * @returns ``false`` if there is no error or an array errors.
     *
     * @throws {Error} When name resolving events (``enterContext``,
     * ``leaveContext``, or ``definePrefix``) are passed while this walker was not
     * instructed to create its own name resolver or when trying to process an
     * event type unknown to salve.
     */
    // tslint:disable-next-line: max-func-body-length
    GrammarWalker.prototype.fireEvent = function (ev) {
        var wsErr = false;
        function combineWsErrWith(x) {
            if (wsErr === undefined) {
                wsErr = [new errors_1.ValidationError("text not allowed here")];
            }
            if (wsErr === false) {
                return x;
            }
            if (x === false) {
                return wsErr;
            }
            if (x === undefined) {
                throw new Error("undefined x");
            }
            return wsErr.concat(x);
        }
        if (ev.params[0] === "enterContext" ||
            ev.params[0] === "leaveContext" ||
            ev.params[0] === "definePrefix") {
            switch (ev.params[0]) {
                case "enterContext":
                    this.nameResolver.enterContext();
                    break;
                case "leaveContext":
                    this.nameResolver.leaveContext();
                    break;
                case "definePrefix":
                    this.nameResolver.definePrefix(ev.params[1], ev.params[2]);
                    break;
                default:
                    throw new Error("unexpected event: " + ev.params[0]);
            }
            return false;
        }
        // Process whitespace nodes
        if (ev.params[0] === "text" && ev.params[1].trim() === "") {
            if (this.suspendedWs !== undefined) {
                this.suspendedWs += ev.params[1];
            }
            else {
                this.suspendedWs = ev.params[1];
            }
            return false;
        }
        // This is the walker we must fire all our events on.
        var walker = (this._misplacedElements.length > 0 &&
            this._misplacedElements[0] instanceof base_1.Walker) ?
            // This happens if we ran into a misplaced element that we were
            // able to infer.
            this._misplacedElements[0] : this.subwalker;
        var ignoreNextWsNow = this.ignoreNextWs;
        this.ignoreNextWs = false;
        switch (ev.params[0]) {
            case "enterStartTag":
                // Absorb the whitespace: poof, gone!
                this.suspendedWs = undefined;
                break;
            case "text":
                if (this._prevEvWasText) {
                    throw new Error("fired two text events in a row: this is " +
                        "disallowed by salve");
                }
                if (ignoreNextWsNow) {
                    this.suspendedWs = undefined;
                    var trimmed = ev.params[1].replace(/^\s+/, "");
                    if (trimmed.length !== ev.params[1].length) {
                        ev = new base_1.Event("text", trimmed);
                    }
                }
                else if (this.suspendedWs !== undefined && this.suspendedWs !== "") {
                    wsErr = walker.fireEvent(new base_1.Event("text", this.suspendedWs));
                    this.suspendedWs = undefined;
                }
                break;
            case "endTag":
                this.ignoreNextWs = true;
            /* falls through */
            default:
                // Process the whitespace that was suspended.
                if (this.suspendedWs !== undefined && this.suspendedWs !== "" &&
                    !ignoreNextWsNow) {
                    wsErr = walker.fireEvent(new base_1.Event("text", this.suspendedWs));
                }
                this.suspendedWs = undefined;
        }
        // We can update it here because we're done examining the value that was
        // set from the previous call to fireEvent.
        this._prevEvWasText = (ev.params[0] === "text");
        if (this._misplacedElements.length > 0 &&
            this._misplacedElements[0] instanceof Array) {
            // We are in a misplaced element which is foreign to the schema (or
            // which cannot be inferred unambiguously.
            var mpe = this._misplacedElements[0];
            switch (ev.params[0]) {
                case "enterStartTag":
                    mpe.unshift(ev.params.slice(1));
                    break;
                case "endTag":
                    mpe.shift();
                    break;
                default:
                    // We don't care
                    break;
            }
            // We're done with this context.
            if (mpe.length === 0) {
                this._misplacedElements.shift();
            }
            return false;
        }
        // This would happen if the user puts an attribute on a tag that does not
        // allow one. Instead of generating errors for both the attribute name
        // and value, we generate an error for the name and ignore the value.
        if (this._swallowAttributeValue) {
            // Swallow only one event.
            this._swallowAttributeValue = false;
            if (ev.params[0] === "attributeValue") {
                return false;
            }
            return [new errors_1.ValidationError("attribute value required")];
        }
        var ret = walker.fireEvent(ev);
        if (ret === undefined) {
            switch (ev.params[0]) {
                case "enterStartTag":
                    var name = new namePatterns.Name("", ev.params[1], ev.params[2]);
                    ret = [new errors_1.ElementNameError("tag not allowed here", name)];
                    // Try to infer what element is meant by this errant tag. If we can't
                    // find a candidate, then fall back to a dumb mode.
                    var candidates = this.el.elementDefinitions[name.toString()];
                    if (candidates !== undefined && candidates.length === 1) {
                        var newWalker = candidates[0].newWalker(this.nameResolver);
                        this._misplacedElements.unshift(newWalker);
                        if (newWalker.fireEvent(ev) !== false) {
                            throw new Error("internal error: the inferred element " +
                                "does not accept its initial event");
                        }
                    }
                    else {
                        // Dumb mode...
                        this._misplacedElements.unshift([ev.params.slice(1)]);
                    }
                    break;
                case "endTag":
                    ret = [new errors_1.ElementNameError("unexpected end tag", new namePatterns.Name("", ev.params[1], ev.params[2]))];
                    break;
                case "attributeName":
                    ret = [new errors_1.AttributeNameError("attribute not allowed here", new namePatterns.Name("", ev.params[1], ev.params[2]))];
                    this._swallowAttributeValue = true;
                    break;
                case "attributeValue":
                    ret = [new errors_1.ValidationError("unexpected attributeValue event; it is likely " +
                            "that fireEvent is incorrectly called")];
                    break;
                case "text":
                    ret = [new errors_1.ValidationError("text not allowed here")];
                    break;
                case "leaveStartTag":
                // If the _misplacedElements stack did not exist then we would get here
                // if a file being validated contains a tag which is not allowed. An
                // ElementNameError will already have been issued. So rather than
                // violate our contract (which says no undefined value may be returned)
                // or require that callers do something special with 'undefined' as a
                // return value, just treat this event as a non-error.
                //
                // But the stack exists, so we cannot get here. If we do end up here,
                // then there is an internal error somewhere.
                /* falls through */
                default:
                    throw new Error("unexpected event type in GrammarWalker's fireEvent: " + ev.params[0].toString());
            }
        }
        // Check whether the context should end
        if (this._misplacedElements.length > 0 &&
            this._misplacedElements[0] instanceof base_1.Walker) {
            walker = this._misplacedElements[0];
            if (walker.canEnd()) {
                this._misplacedElements.shift();
                var endRet = walker.end();
                if (endRet) {
                    ret = ret ? ret.concat(endRet) : endRet;
                }
            }
        }
        return combineWsErrWith(ret);
    };
    GrammarWalker.prototype.possible = function () {
        if (this._misplacedElements.length !== 0) {
            var mpe = this._misplacedElements[0];
            // Return an empty set if the tags are unknown to us.
            return mpe instanceof base_1.Walker ? mpe.possible() : new base_1.EventSet();
        }
        // There's no point in calling this._possible.
        return this.subwalker.possible();
    };
    GrammarWalker.prototype._suppressAttributes = function () {
        throw new Error("_suppressAttributes cannot be called on a GrammarWalker");
    };
    return GrammarWalker;
}(base_1.SingleSubwalker));
exports.GrammarWalker = GrammarWalker;
// Nope, we're using a custom function.
// addWalker(Grammar, GrammarWalker);
//  LocalWords:  RNG's MPL unresolvable runtime RNG NG firstName enterContext
//  LocalWords:  leaveContext definePrefix whitespace enterStartTag endTag
//  LocalWords:  fireEvent attributeValue attributeName leaveStartTag addWalker
//  LocalWords:  misplacedElements ElementNameError GrammarWalker's
//  LocalWords:  suppressAttributes GrammarWalker

//# sourceMappingURL=grammar.js.map


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Naive set implementation.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 * @private
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This is a naive implementation of sets. It stores all elements in an
 * array. All array manipulations are done by searching through the array from
 * start to hit. So when adding a new element to the ``NaiveSet`` for instance,
 * the add method will scan the whole array, find the element is not there and
 * then add the element at the end of the array. As naive as this implementation
 * is, it has been shown to be faster than [["hashstructs".HashSet]] when used
 * in the context of this library.
 *
 * Note that ``NaiveSet`` cannot hold undefined values.
 */
// tslint:disable: no-any no-reserved-keywords
var NaiveSet = (function () {
    /**
     * @param initial The value to initialize the set with. If a [[NaiveSet]],
     * then the new ``NaiveSet`` will be a clone of the parameter. If an
     * ``Array``, then the new ``NaiveSet`` will be initialized with the
     * ``Array``. If something else, then the new ``NaiveSet`` will contain
     * whatever value was passed.  The backing array that hold the values
     * contained in the set.
     */
    function NaiveSet(initial) {
        if (initial != null) {
            if (initial instanceof NaiveSet) {
                this.b = initial.b.concat([]);
            }
            else if (initial instanceof Array) {
                this.b = [];
                for (var _i = 0, initial_1 = initial; _i < initial_1.length; _i++) {
                    var item = initial_1[_i];
                    this.add(item);
                }
            }
            else {
                this.b = [initial];
            }
        }
        else {
            this.b = [];
        }
    }
    /**
     * Adds a value to the set.
     *
     * @param value The value to add.
     */
    NaiveSet.prototype.add = function (value) {
        var t = this.b.indexOf(value);
        if (t < 0) {
            this.b.push(value);
        }
    };
    /**
     * Destructively adds the elements of another set to this set.
     *
     * @param s The set to add.
     * @throws {Error} If ``s`` is not a ``NaiveSet`` object
     */
    NaiveSet.prototype.union = function (s) {
        if (s == null) {
            return;
        }
        if (!(s instanceof NaiveSet)) {
            throw new Error("union with non-NaiveSet");
        }
        var len = s.b.length;
        for (var i = 0; i < len; ++i) {
            this.add(s.b[i]);
        }
    };
    /**
     * Selects a subset of values.
     *
     * @param f A function that selects values.
     *
     * @returns An object of the same class as the object on which the method is
     * called. This object contains only the value selected by the function.
     */
    NaiveSet.prototype.filter = function (f) {
        var _this = this;
        var ret = new this.constructor();
        // The fat arrow is used to prevent a caller from accessing ``this.b``
        // through the 3rd parameter that would be passed to ``f``.
        ret.b = this.b.filter(function (value, index) { return f(value, index, _this); });
        return ret;
    };
    /**
     * This method works like Array.map but with a provision for eliminating
     * elements from the resulting [[NaiveSet]].
     *
     * @param f This parameter plays the same role as for ``Array``'s ``map``
     * method.  However, when it returns an undefined value, this return value is
     * not added to the ``NaiveSet`` that will be returned.
     *
     * @returns The new set. This set is of the same class as the original set.
     */
    NaiveSet.prototype.map = function (f) {
        var ret = new this.constructor();
        for (var i = 0; i < this.b.length; ++i) {
            var value = this.b[i];
            var result = f(value, i, this);
            // Undefined is not added.
            if (result !== undefined) {
                ret.add(result);
            }
        }
        return ret;
    };
    /**
     * Applies a function on each value stored in the set.
     *
     * @param f A function which accepts one parameter. The function will be
     * called on each value.
     */
    NaiveSet.prototype.forEach = function (f) {
        var _this = this;
        this.b.forEach(function (value, index) {
            f(value, index, _this);
        });
    };
    /**
     * Converts the set to a string.
     *
     * @returns All the values, joined with ", ".
     */
    NaiveSet.prototype.toString = function () {
        return this.b.join(", ");
    };
    /**
     * @returns The number of values stored.
     */
    NaiveSet.prototype.size = function () {
        return this.b.length;
    };
    /**
     * Determines whether or not this set has the parameter passed.
     *
     * @param obj The object which we want to look for.
     *
     * @returns True if the object is present, false if not.
     */
    NaiveSet.prototype.has = function (obj) {
        return this.b.indexOf(obj) >= 0;
    };
    /**
     * Converts the object on which this method is called to an array.
     *
     * @returns An array that corresponds to the object.
     */
    NaiveSet.prototype.toArray = function () {
        return this.b.slice();
    };
    return NaiveSet;
}());
exports.NaiveSet = NaiveSet;
//  LocalWords:  param NaiveSet Mangalam MPL Dubeau HashSet hashstructs

//# sourceMappingURL=set.js.map


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * This module contains data and utilities to work with the schema format that
 * salve uses natively.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
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
var patterns = __webpack_require__(9);
var tools_1 = __webpack_require__(7);
var pro = patterns.__protected;
//
// MODIFICATIONS TO THIS TABLE MUST BE REFLECTED IN nameToConstructor
//
var codeToConstructor = [
    Array,
    pro.Empty,
    pro.Data,
    pro.List,
    pro.Param,
    pro.Value,
    pro.NotAllowed,
    pro.Text,
    pro.Ref,
    pro.OneOrMore,
    pro.Choice,
    pro.Group,
    pro.Attribute,
    pro.Element,
    pro.Define,
    pro.Grammar,
    pro.EName,
    pro.Interleave,
    pro.Name,
    pro.NameChoice,
    pro.NsName,
    pro.AnyName,
];
//
// MODIFICATIONS TO THIS TABLE MUST BE REFLECTED IN codeToConstructor
//
var nameToConstructor = {
    // Array = 0 is hard-coded elsewhere in the conversion code so don't change
    // it.
    0: Array,
    Empty: pro.Empty,
    1: pro.Empty,
    Data: pro.Data,
    2: pro.Data,
    List: pro.List,
    3: pro.List,
    Param: pro.Param,
    4: pro.Param,
    Value: pro.Value,
    5: pro.Value,
    NotAllowed: pro.NotAllowed,
    6: pro.NotAllowed,
    Text: pro.Text,
    7: pro.Text,
    Ref: pro.Ref,
    8: pro.Ref,
    OneOrMore: pro.OneOrMore,
    9: pro.OneOrMore,
    Choice: pro.Choice,
    10: pro.Choice,
    Group: pro.Group,
    11: pro.Group,
    Attribute: pro.Attribute,
    12: pro.Attribute,
    Element: pro.Element,
    13: pro.Element,
    Define: pro.Define,
    14: pro.Define,
    Grammar: pro.Grammar,
    15: pro.Grammar,
    EName: pro.EName,
    16: pro.EName,
    Interleave: pro.Interleave,
    17: pro.Interleave,
    Name: pro.Name,
    18: pro.Name,
    NameChoice: pro.NameChoice,
    19: pro.NameChoice,
    NsName: pro.NsName,
    20: pro.NsName,
    AnyName: pro.AnyName,
    21: pro.AnyName,
};
//
// MODIFICATIONS TO THESE VARIABLES MUST BE REFLECTED IN rng-to-js.xsl
//
// This is a bit field
var OPTION_NO_PATHS = 1;
// var OPTION_WHATEVER = 2;
// var OPTION_WHATEVER_PLUS_1 = 4;
// etc...
var OldFormatError = (function (_super) {
    __extends(OldFormatError, _super);
    function OldFormatError() {
        var _this = _super.call(this, "your schema file must be recreated with a newer " +
            "version of salve-convert") || this;
        tools_1.fixPrototype(_this, OldFormatError);
        return _this;
    }
    return OldFormatError;
}(Error));
/**
 * A class for walking the JSON object representing a schema.
 */
var V2JSONWalker = (function () {
    /**
     *
     * @param options The options object from the file that contains the
     * schema.
     */
    function V2JSONWalker(options) {
        this.options = options;
    }
    /**
     * Walks a V2 representation of a JavaScript object.
     *
     * @param array The array representing the object.
     *
     * @throws {Error} If the object is malformed.
     *
     * @returns The return value of [[V2JSONWalker._processObject]].
     */
    V2JSONWalker.prototype.walkObject = function (array) {
        var kind = array[0];
        var ctor = codeToConstructor[kind];
        if (ctor === undefined) {
            if (array.length < 1) {
                throw new Error("array too small to contain object");
            }
            throw new Error("undefined type: " + kind);
        }
        if (ctor === Array) {
            throw new Error("trying to build array with _constructObjectV2");
        }
        var addPath = 
        // tslint:disable-next-line:no-bitwise
        ((this.options & OPTION_NO_PATHS) !== 0) && ctor !== pro.EName;
        var args;
        if (array.length > 1) {
            args = array.slice(1);
            if (addPath) {
                args.unshift(0, "");
            }
            else {
                args.unshift(0);
            }
            this._transformArray(args);
        }
        else if (addPath) {
            args = [""];
        }
        else {
            args = [];
        }
        return this._processObject(ctor, args);
    };
    /**
     * Processes an object. Derived classes will want to override this method to
     * perform their work.
     *
     * @param ctor The object's constructor.
     *
     * @param args The arguments that should be passed to the constructor.
     *
     * @returns If the ``V2JSONWalker`` instance is meant to convert the JSON
     * data, then this method should return an Object. If the ``V2JSONWalker``
     * instance is meant to check the JSON data, then it should return
     * ``undefined``.
     */
    V2JSONWalker.prototype._processObject = function (ctor, args) {
        return undefined; // Do nothing
    };
    V2JSONWalker.prototype._transformArray = function (arr) {
        if (arr[0] !== 0) {
            throw new Error("array type not 0, but " + arr[0] + " for array " + arr);
        }
        arr.splice(0, 1);
        var limit = arr.length;
        for (var elIx = 0; elIx < limit; elIx++) {
            var el = arr[elIx];
            if (el instanceof Array) {
                if (el[0] !== 0) {
                    arr[elIx] = this.walkObject(el);
                }
                else {
                    this._transformArray(el);
                }
            }
        }
    };
    return V2JSONWalker;
}());
exports.V2JSONWalker = V2JSONWalker;
/**
 * A JSON walker that constructs a pattern tree as it walks the JSON object.
 *
 * @private
 */
var V2Constructor = (function (_super) {
    __extends(V2Constructor, _super);
    function V2Constructor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    V2Constructor.prototype._processObject = function (ctor, args) {
        if (ctor === pro.Data && args.length >= 4) {
            // Parameters are represented as an array of strings in the file.
            // Transform this array of strings into an array of objects.
            var params = args[3];
            if (params.length % 2 !== 0) {
                throw new Error("parameter array length not a multiple of 2");
            }
            // tslint:disable-next-line: prefer-array-literal
            var newParams = new Array(params.length / 2);
            var limit = params.length;
            for (var i = 0; i < limit; i += 2) {
                newParams[i / 2] = { name: params[i], value: params[i + 1] };
            }
            args[3] = newParams;
        }
        else if (ctor === pro.OneOrMore) {
            //
            // In the file we have two arguments:
            //
            // * the XML path.
            // * An array of length 1 that contains the one subpattern.
            //
            // Here we ditch the array and replace it with its lone subpattern.
            //
            if (args[1].length !== 1) {
                throw new Error("OneOrMore with an array of patterns that " +
                    "contains other than 1 pattern");
            }
            args = [args[0], args[1][0]];
        }
        else if (ctor === pro.Attribute ||
            ctor === pro.Element ||
            ctor === pro.Define) {
            // Same thing as above, but for these elements the array of patterns is at
            // index 2 rather than index 1.
            if (args[2].length !== 1) {
                throw new Error("PatternOnePattern with an array of patterns that " +
                    "contains other than 1 pattern");
            }
            args = [args[0], args[1], args[2][0]];
        }
        else if (ctor === pro.Choice ||
            ctor === pro.Group ||
            ctor === pro.Interleave) {
            if (args[1].length !== 2) {
                throw new Error("PatternTwoPatterns with an array of patterns that " +
                    "contains other than 2 pattern");
            }
            args = [args[0], args[1][0], args[1][1]];
        }
        var newObj = Object.create(ctor.prototype);
        var ctorRet = ctor.apply(newObj, args);
        // Some constructors return a value; make sure to use it!
        return ctorRet !== undefined ? ctorRet : newObj;
    };
    return V2Constructor;
}(V2JSONWalker));
/**
 * Constructs a tree of patterns from the data structure produced by running
 * ``salve-convert`` on an RNG file.
 *
 * @param code The JSON representation (a string) or the deserialized JSON. **If
 * you pass an object, it will be mutated while producing the result.** So you
 * cannot pass the same object twice to this function. Note that if you are
 * calling ``constructTree`` on the same input repeatedly, you are probably
 * "doing it wrong". You should be caching the results rather than building
 * multiple identical trees.
 *
 * @throws {Error} When the version of the data is not supported.
 *
 * @returns The tree.
 */
function constructTree(code) {
    var parsed = (typeof code === "string" ? JSON.parse(code) : code);
    if (typeof parsed === "object" && parsed.v === undefined) {
        throw new OldFormatError(); // version 0
    }
    var version = parsed.v, options = parsed.o, data = parsed.d;
    if (version === 3) {
        return new V2Constructor(options).walkObject(data);
    }
    throw new Error("unknown version: " + version);
}
exports.constructTree = constructTree;
//
// Exports which are meant for other modules internal to salve.
//
// DO NOT USE THIS OUTSIDE SALVE! THIS EXPORT MAY CHANGE AT ANY TIME!
// YOU'VE BEEN WARNED!
//
// tslint:disable-next-line:variable-name
exports.__protected = {
    V2JSONWalker: V2JSONWalker,
    nameToConstructor: nameToConstructor,
    OPTION_NO_PATHS: OPTION_NO_PATHS,
};
//  LocalWords:  deserialized PatternTwoPatterns PatternOnePattern OneOrMore js
//  LocalWords:  codeToConstructor nameToConstructor RNG subpattern JSON xsl
//  LocalWords:  rng MPL

//# sourceMappingURL=formats.js.map


/***/ }),
/* 15 */
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
 * Implementation of the builtin Relax NG datatype library.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var errors_1 = __webpack_require__(5);
/**
 * Strips leading and trailing space. Normalize all internal spaces to a single
 * space.
 *
 * @private
 *
 * @param value The value whose space we want to normalize.
 *
 * @returns The normalized value.
 */
function normalizeSpace(value) {
    return value.trim().replace(/\s{2,}/g, " ");
}
//
// TypeScript does not automatically treat unimplemented interface bits as
// abstract. :-(
//
// See https://github.com/Microsoft/TypeScript/issues/4670
//
var Base = (function () {
    function Base() {
    }
    Base.prototype.parseParams = function (location, params) {
        if (params !== undefined && params.length > 0) {
            throw new errors_1.ParameterParsingError(location, [new errors_1.ParamError("this type does not accept parameters")]);
        }
    };
    Base.prototype.parseValue = function (value) {
        var errors = this.disallows(value);
        if (errors instanceof Array && errors.length !== 0) {
            throw new errors_1.ValueValidationError(errors);
        }
        return { value: value };
    };
    return Base;
}());
var StringT = (function (_super) {
    __extends(StringT, _super);
    function StringT() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.regexp = /.*/;
        _this.needsContext = false;
        return _this;
    }
    StringT.prototype.equal = function (value, schemaValue) {
        if (schemaValue.value === undefined) {
            throw Error("it looks like you are trying to use an unparsed value");
        }
        return value === schemaValue.value;
    };
    StringT.prototype.disallows = function (value) {
        return false;
    };
    return StringT;
}(Base));
var stringT = new StringT();
var Token = (function (_super) {
    __extends(Token, _super);
    function Token() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "token";
        _this.needsContext = false;
        _this.regexp = /.*/;
        return _this;
    }
    Token.prototype.equal = function (value, schemaValue) {
        if (schemaValue.value === undefined) {
            throw Error("it looks like you are trying to use an unparsed value");
        }
        return normalizeSpace(value) === normalizeSpace(schemaValue.value);
    };
    Token.prototype.disallows = function (value) {
        // Yep, token allows anything, just like string.
        return false;
    };
    return Token;
}(Base));
var token = new Token();
/**
 * The builtin datatype library.
 */
exports.builtin = {
    uri: "",
    types: {
        string: stringT,
        token: token,
    },
};
//  LocalWords:  NG MPL unparsed

//# sourceMappingURL=builtin.js.map


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module, process) {/* parser generated by jison 0.4.17 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,8],$V1=[1,10],$V2=[1,13],$V3=[1,19],$V4=[1,20],$V5=[1,14],$V6=[1,15],$V7=[1,16],$V8=[1,17],$V9=[5,23],$Va=[5,8,20,22,23,26,30,31,42,43,44,45],$Vb=[5,8,12,13,14,15,20,22,23,26,30,31,42,43,44,45],$Vc=[5,8,12,13,14,15,20,22,23,26,29,30,31,36,38,40,41,42,43,44,45],$Vd=[1,37],$Ve=[1,39],$Vf=[1,40],$Vg=[38,40,41,42,43,44,45],$Vh=[29,36,38,40,41,42,43,44,45];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"start":3,"input":4,"EOF":5,"regexp":6,"branch":7,"|":8,"piece":9,"atom":10,"quantifier":11,"?":12,"*":13,"+":14,"{":15,"quantity":16,"}":17,"NUMBER":18,",":19,"CHAR":20,"charClass":21,"(":22,")":23,"charClassEsc":24,"charClassExpr":25,"WILDCARDESC":26,"charClassExprStart":27,"charGroup":28,"]":29,"[":30,"[^":31,"posCharGroups":32,"charClassSub":33,"posCharGroup":34,"charRange":35,"CLASSSUBTRACTION":36,"seRange":37,"-":38,"charOrEsc":39,"XMLCHAR":40,"SingleCharEsc":41,"SINGLECHARESC":42,"MULTICHARESC":43,"CATESC":44,"COMPLESC":45,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",8:"|",12:"?",13:"*",14:"+",15:"{",17:"}",18:"NUMBER",19:",",20:"CHAR",22:"(",23:")",26:"WILDCARDESC",29:"]",30:"[",31:"[^",36:"CLASSSUBTRACTION",38:"-",40:"XMLCHAR",41:"SingleCharEsc",42:"SINGLECHARESC",43:"MULTICHARESC",44:"CATESC",45:"COMPLESC"},
productions_: [0,[3,1],[4,1],[4,2],[6,1],[6,3],[7,1],[7,2],[9,1],[9,2],[11,1],[11,1],[11,1],[11,3],[16,1],[16,3],[16,2],[10,1],[10,1],[10,3],[21,1],[21,1],[21,1],[25,3],[27,1],[27,1],[28,1],[28,1],[32,1],[32,2],[34,1],[34,1],[33,3],[35,1],[35,1],[37,3],[37,1],[39,1],[39,1],[24,1],[24,1],[24,1],[24,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */, outputType) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:

      // Overwrite the parseError method with our own. NOTE: Our own
      // method does not allow recovering from recoverable parsing
      // errors.
      this.parseError = parseError;
      outputType = outputType || "re";
      switch(outputType) {
      case "string":
        return $$[$0];
      case "re":
        var constructor = (needsXRegExpRe.test($$[$0]) ? XRegExp : RegExp);
        return new constructor($$[$0]);
      default:
        throw new Error("unsupported output type: " + outputType);
      }
    
break;
case 2:
this.$ = '^$';
break;
case 3:
this.$ = '^' + $$[$0-1] + '$';
break;
case 5: case 13: case 35:
this.$ = $$[$0-2].concat($$[$0-1], $$[$0]);
break;
case 7: case 9: case 29:
this.$ = $$[$0-1] + $$[$0];
break;
case 15:
this.$ = $$[$0-2].concat(',', $$[$0]);
break;
case 16:
this.$ = $$[$0-1].concat($$[$0]);
break;
case 19:
this.$ = '(?:' + $$[$0-1] + $$[$0];
break;
case 23:

      var state = groupState.shift();
      var capturedMultiChar = state.capturedMultiChar;

      var subtraction = state.subtraction ?
            ("(?!" +  state.subtraction + ")") : "";
      if (capturedMultiChar.length !== 0) {
        var out = ["(?:", subtraction];
        if (state.negative) {
          out.push("(?=[");
          for (var i = 0; i < capturedMultiChar.length; ++i) {
            out.push(multiCharEscapesInGroup[capturedMultiChar[i]].slice(1));
          }
          out.push("])");
        }
        else {
          for (var i = 0; i < capturedMultiChar.length; ++i) {
            out.push("[", multiCharEscapesInGroup[capturedMultiChar[i]], "]|");
          }
        }
        out.push($$[$0-2], $$[$0-1], $$[$0], ")");
        this.$ = out.join("");
      }
      else {
        this.$ = (subtraction !== "") ?
          "(?:" + subtraction + $$[$0-2].concat($$[$0-1], $$[$0]) + ")":
          $$[$0-2].concat($$[$0-1], $$[$0]);
      }
    
break;
case 24:

      unshiftGroupState(false);
      this.$ = $$[$0];
    
break;
case 25:

      unshiftGroupState(true);
      this.$ = $$[$0];
    
break;
case 32:

      this.$ = $$[$0-2];
      groupState[0].subtraction = $$[$0];
    
break;
case 40:

      if (groupState.length) {
        var repl = multiCharEscapesInGroup[$$[$0]]
        if (repl.charAt(0) === "^") {
          groupState[0].capturedMultiChar.push($$[$0]);
          this.$ = "";
        }
        else {
          this.$ = repl;
        }
      }
      else {
        this.$ = multiCharEscapes[$$[$0]]
      }
    
break;
}
},
table: [{3:1,4:2,5:[1,3],6:4,7:5,9:6,10:7,20:$V0,21:9,22:$V1,24:11,25:12,26:$V2,27:18,30:$V3,31:$V4,42:$V5,43:$V6,44:$V7,45:$V8},{1:[3]},{1:[2,1]},{1:[2,2]},{5:[1,21]},o($V9,[2,4],{10:7,21:9,24:11,25:12,27:18,9:23,8:[1,22],20:$V0,22:$V1,26:$V2,30:$V3,31:$V4,42:$V5,43:$V6,44:$V7,45:$V8}),o($Va,[2,6]),o($Va,[2,8],{11:24,12:[1,25],13:[1,26],14:[1,27],15:[1,28]}),o($Vb,[2,17]),o($Vb,[2,18]),{6:29,7:5,9:6,10:7,20:$V0,21:9,22:$V1,24:11,25:12,26:$V2,27:18,30:$V3,31:$V4,42:$V5,43:$V6,44:$V7,45:$V8},o($Vb,[2,20]),o($Vb,[2,21]),o($Vb,[2,22]),o($Vc,[2,39]),o($Vc,[2,40]),o($Vc,[2,41]),o($Vc,[2,42]),{24:34,28:30,32:31,33:32,34:33,35:35,37:36,38:$Vd,39:38,40:$Ve,41:$Vf,42:$V5,43:$V6,44:$V7,45:$V8},o($Vg,[2,24]),o($Vg,[2,25]),{1:[2,3]},{6:41,7:5,9:6,10:7,20:$V0,21:9,22:$V1,24:11,25:12,26:$V2,27:18,30:$V3,31:$V4,42:$V5,43:$V6,44:$V7,45:$V8},o($Va,[2,7]),o($Va,[2,9]),o($Va,[2,10]),o($Va,[2,11]),o($Va,[2,12]),{16:42,18:[1,43]},{23:[1,44]},{29:[1,45]},{24:34,29:[2,26],34:46,35:35,36:[1,47],37:36,38:$Vd,39:38,40:$Ve,41:$Vf,42:$V5,43:$V6,44:$V7,45:$V8},{29:[2,27]},o($Vh,[2,28]),o($Vh,[2,30]),o($Vh,[2,31]),o($Vh,[2,33]),o($Vh,[2,34]),o([29,36,40,41,42,43,44,45],[2,36],{38:[1,48]}),o($Vh,[2,37]),o($Vh,[2,38]),o($V9,[2,5]),{17:[1,49]},{17:[2,14],19:[1,50]},o($Vb,[2,19]),o([5,8,12,13,14,15,20,22,23,26,29,30,31,42,43,44,45],[2,23]),o($Vh,[2,29]),{25:51,27:18,30:$V3,31:$V4},{39:52,40:$Ve,41:$Vf},o($Va,[2,13]),{17:[2,16],18:[1,53]},{29:[2,32]},o($Vh,[2,35]),{17:[2,15]}],
defaultActions: {2:[2,1],3:[2,2],21:[2,3],32:[2,27],51:[2,32],53:[2,15]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        function _parseError (msg, hash) {
            this.message = msg;
            this.hash = hash;
        }
        _parseError.prototype = Error;

        throw new _parseError(str, hash);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
var xmlcharacters = __webpack_require__(11);
var XRegExp = __webpack_require__(41);

// We use the name ``Salve`` to help avoid potential
// clashes. ``ParsingError`` seems too risky.
function SalveParsingError(msg) {
  // This is crap to work around the fact that Error is a terribly
  // designed class or prototype or whatever. Unfortunately the
  // stack trace contains an extra frame.
  var err = new Error(msg);
  this.name = "SalveParsingError";
  this.stack = err.stack;
  this.message = err.message;
}

SalveParsingError.prototype = new Error();

// This will serve as a replacement for the default parseError method on
// the parser.
function parseError(str, hash) {
  throw new SalveParsingError(str);
}

// Export this error.
if (true) {
  exports.SalveParsingError = SalveParsingError;
}
else {
  parser.SalveParsingError = SalveParsingError;
}


var xmlNameChar = xmlcharacters.xmlNameChar;
var xmlLetter = xmlcharacters.xmlLetter;

// Maintain a group state.
var groupState = [];
var needsXRegExpRe = /\\p/i;

function unshiftGroupState(negative) {
  groupState.unshift({
    negative: negative,
    capturedMultiChar: [],
  });
}

var multiCharEscapesInGroup = {
    "\\s": " \\t\\n\\r",
    "\\S": "^ \\t\\n\\r",
    "\\i": "" + xmlLetter + "_:",
    "\\I": "^" + xmlLetter + "_:",
    "\\c": "" + xmlNameChar,
    "\\C": "^" + xmlNameChar,
    "\\d": "\\p{Nd}",
    "\\D": "^\\p{Nd}",
    "\\w": "^\\p{P}\\p{Z}\\p{C}",
    "\\W": "\\p{P}\\p{Z}\\p{C}"
};

var multiCharEscapes = [];
for(var i in multiCharEscapesInGroup) {
  if (!multiCharEscapesInGroup.hasOwnProperty(i)) {
    continue;
  }
  multiCharEscapes[i] = "[" + multiCharEscapesInGroup[i] + "]";
}

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 18;
break;
case 1:return 19;
break;
case 2:this.popState(); return 17;
break;
case 3:this.begin('CHARCLASS'); return 31;
break;
case 4:this.begin('CHARCLASS'); return 30;
break;
case 5:return 42;
break;
case 6:return 43;
break;
case 7:return 36;
break;
case 8:return 38;
break;
case 9:return 40;
break;
case 10:this.popState(); return 29;
break;
case 11:return 22;
break;
case 12:return 8;
break;
case 13:return 23;
break;
case 14:return 13;
break;
case 15:return 14;
break;
case 16:return 12;
break;
case 17:this.begin('QUANTITY'); return 15;
break;
case 18:return 17;
break;
case 19:return 29;
break;
case 20:return '^';
break;
case 21:return 44;
break;
case 22:return 45;
break;
case 23:return 26;
break;
case 24:return 5;
break;
case 25:return 20;
break;
}
},
rules: [/^(?:[0-9])/,/^(?:,)/,/^(?:\})/,/^(?:\[\^)/,/^(?:\[)/,/^(?:\\[-nrt\|.?*+(){}[\]^])/,/^(?:\\[sSiIcCdDwW])/,/^(?:-(?=\[))/,/^(?:-)/,/^(?:[^-[\]])/,/^(?:\])/,/^(?:\()/,/^(?:\|)/,/^(?:\))/,/^(?:\*)/,/^(?:\+)/,/^(?:\?)/,/^(?:\{)/,/^(?:\})/,/^(?:\])/,/^(?:\^)/,/^(?:\\p\{.*?\})/,/^(?:\\P\{.*?\})/,/^(?:\.)/,/^(?:$)/,/^(?:[^\\])/],
conditions: {"CHARCLASS":{"rules":[3,4,5,6,7,8,9,10],"inclusive":false},"QUANTITY":{"rules":[0,1,2],"inclusive":false},"INITIAL":{"rules":[3,4,5,6,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function main() {
      throw new Error("this module cannot be used as main");
    };
if (typeof module !== 'undefined' && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(33)(module), __webpack_require__(32)))

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Implementation of the XMLSchema datatypes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
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
var errors_1 = __webpack_require__(5);
var regexp = __webpack_require__(16);
var xmlcharacters_1 = __webpack_require__(11);
// tslint:disable: no-reserved-keywords
/**
 * @private
 */
var WhitespaceHandling;
(function (WhitespaceHandling) {
    /**
     * Preserve the whitespace
     */
    WhitespaceHandling[WhitespaceHandling["PRESERVE"] = 1] = "PRESERVE";
    /**
     * Replace all instances of whitespace by spaces.
     */
    WhitespaceHandling[WhitespaceHandling["REPLACE"] = 2] = "REPLACE";
    /**
     * Replace all instances of whitespace by spaces, collapse consecutive
     * spaces, and remove leading and trailing spaces.
     */
    WhitespaceHandling[WhitespaceHandling["COLLAPSE"] = 3] = "COLLAPSE";
})(WhitespaceHandling || (WhitespaceHandling = {}));
/**
 * Check whether a parameter is an integer.
 *
 * @param value The parameter value.
 *
 * @param name The name of the parameter.
 *
 * @return ``false`` if there is no error. Otherwise it returns a [[ParamError]]
 * that records the error.
 *
 * @private
 */
function failIfNotInteger(value, name) {
    if (value.search(/^\d+$/) !== -1) {
        return false;
    }
    return new errors_1.ParamError(name + " must have an integer value");
}
/**
 * Check whether a parameter is a non-negative integer.
 *
 * @param value The parameter value.
 *
 * @param name The name of the parameter.
 *
 * @return ``false`` if there is no error. Otherwise it returns a [[ParamError]]
 * that records the error.
 *
 * @private
 */
function failIfNotNonNegativeInteger(value, name) {
    if (!failIfNotInteger(value, name) && Number(value) >= 0) {
        return false;
    }
    return new errors_1.ParamError(name + " must have a non-negative integer value");
}
/**
 * Check whether a parameter is a positive integer.
 *
 * @param value The parameter value.
 *
 * @param name The name of the parameter.
 *
 * @return ``false`` if there is no error. Otherwise it returns a [[ParamError]]
 * that records the error.
 *
 * @private
 */
function failIfNotPositiveInteger(value, name) {
    if (!failIfNotInteger(value, name) && Number(value) > 0) {
        return false;
    }
    return new errors_1.ParamError(name + " must have a positive value");
}
/**
 * Convert a number to an internal representation. This takes care of the
 * differences between JavaScript and XML Schema (e.g. "Infinity" vs "INF").
 *
 * @param value The value as expressed in an XML file or schema.
 *
 * @returns The number, in its internal representation.
 */
function convertToInternalNumber(value) {
    if (value === "INF") {
        return Infinity;
    }
    if (value === "-INF") {
        return -Infinity;
    }
    return Number(value);
}
/**
 * Convert an internal representation of a number to a string. This takes care
 * of the differences between JavaScript and XML Schema. For instance, a value
 * of ``Infinity`` will be represented as the string ``"INF"``.
 *
 * @param number The internal representation.
 *
 * @returns The string representation.
 */
function convertInternalNumberToString(value) {
    if (value === Infinity) {
        return "INF";
    }
    if (value === -Infinity) {
        return "-INF";
    }
    return value.toString();
}
//
// The parameters
//
/**
 * A parameter used for XML
 * Schema type processing.
 */
var Parameter = (function () {
    function Parameter() {
        /**
         * Whether the parameter can appear more than once on the same type.
         */
        this.repeatable = false;
    }
    /**
     * Combine multiple values from the schema into an internal value. This method
     * may be called only for parameters that are repeatable.
     *
     * @param values The values to combine
     *
     * @returns An array of internal values.
     */
    Parameter.prototype.combine = function (values) {
        if (!this.repeatable) {
            throw new Error("this parameter is not repeatable");
        }
        throw new Error("derived classes must implement this method " +
            "if they are repeatable");
    };
    return Parameter;
}());
var NumericParameter = (function (_super) {
    __extends(NumericParameter, _super);
    function NumericParameter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NumericParameter.prototype.convert = function (value) {
        return convertToInternalNumber(value);
    };
    return NumericParameter;
}(Parameter));
var NonNegativeIntegerParameter = (function (_super) {
    __extends(NonNegativeIntegerParameter, _super);
    function NonNegativeIntegerParameter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NonNegativeIntegerParameter.prototype.isInvalidParam = function (value, name) {
        return failIfNotNonNegativeInteger(value, name);
    };
    return NonNegativeIntegerParameter;
}(NumericParameter));
var LengthP = (function (_super) {
    __extends(LengthP, _super);
    function LengthP() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "length";
        return _this;
    }
    LengthP.prototype.isInvalidValue = function (value, param, type) {
        if (type.valueLength(value) === param) {
            return false;
        }
        return new errors_1.ValueError("length of value should be " + param);
    };
    return LengthP;
}(NonNegativeIntegerParameter));
var lengthP = new LengthP();
var MinLengthP = (function (_super) {
    __extends(MinLengthP, _super);
    function MinLengthP() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "minLength";
        return _this;
    }
    MinLengthP.prototype.isInvalidValue = function (value, param, type) {
        if (type.valueLength(value) >= param) {
            return false;
        }
        return new errors_1.ValueError("length of value should be greater than " +
            ("or equal to " + param));
    };
    return MinLengthP;
}(NonNegativeIntegerParameter));
var minLengthP = new MinLengthP();
var MaxLengthP = (function (_super) {
    __extends(MaxLengthP, _super);
    function MaxLengthP() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "maxLength";
        return _this;
    }
    MaxLengthP.prototype.isInvalidValue = function (value, param, type) {
        if (type.valueLength(value) <= param) {
            return false;
        }
        return new errors_1.ValueError("length of value should be less than " +
            ("or equal to " + param));
    };
    return MaxLengthP;
}(NonNegativeIntegerParameter));
var maxLengthP = new MaxLengthP();
//
// pattern is special. It converts the param value found in the RNG file into an
// object with two fields: ``rng`` and ``internal``. RNG is the string value
// from the RNG file, and ``internal`` is a representation internal to salve. We
// use ``internal`` for performing the validation but present ``rng`` to the
// user. Note that if pattern appears multiple times as a parameter, the two
// values are the result of the concatenation of all the instance of the pattern
// parameter. (Why this? Because it would be confusing to show the internal
// value in error messages to the user.)
//
/**
 * A mapping of raw schema values to the corresponding [[RegExp]] object.
 */
var reCache = Object.create(null);
var PatternP = (function (_super) {
    __extends(PatternP, _super);
    function PatternP() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "pattern";
        _this.repeatable = true;
        return _this;
    }
    PatternP.prototype.convert = function (value) {
        var internal = reCache[value];
        if (internal === undefined) {
            internal = reCache[value] = regexp.parse(value);
        }
        return {
            rng: value,
            internal: internal,
        };
    };
    PatternP.prototype.combine = function (values) {
        return values.map(this.convert);
    };
    PatternP.prototype.isInvalidParam = function (value) {
        try {
            this.convert(value);
        }
        catch (ex) {
            // Convert the error into something that makes sense for salve.
            if (ex instanceof regexp.SalveParsingError) {
                return new errors_1.ParamError(ex.message);
            }
            // Rethrow
            throw ex;
        }
        return false;
    };
    PatternP.prototype.isInvalidValue = function (value, param) {
        if (param instanceof Array) {
            var failedOn = void 0;
            for (var _i = 0, param_1 = param; _i < param_1.length; _i++) {
                var p = param_1[_i];
                if (!p.internal.test(value)) {
                    failedOn = p;
                    break;
                }
            }
            if (failedOn === undefined) {
                return false;
            }
            return new errors_1.ValueError("value does not match the pattern " + failedOn.rng);
        }
        if (param.internal.test(value)) {
            return false;
        }
        return new errors_1.ValueError("value does not match the pattern " + param.rng);
    };
    return PatternP;
}(Parameter));
var patternP = new PatternP();
var TotalDigitsP = (function (_super) {
    __extends(TotalDigitsP, _super);
    function TotalDigitsP() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "totalDigits";
        return _this;
    }
    TotalDigitsP.prototype.isInvalidParam = function (value, name) {
        return failIfNotPositiveInteger(value, name);
    };
    TotalDigitsP.prototype.isInvalidValue = function (value, param) {
        var str = String(Number(value)).replace(/[-+.]/g, "");
        if (str.length > param) {
            return new errors_1.ValueError("value must have at most " + param + " digits");
        }
        return false;
    };
    return TotalDigitsP;
}(NumericParameter));
var totalDigitsP = new TotalDigitsP();
var FractionDigitsP = (function (_super) {
    __extends(FractionDigitsP, _super);
    function FractionDigitsP() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "fractionDigits";
        return _this;
    }
    FractionDigitsP.prototype.isInvalidValue = function (value, param) {
        var str = String(Number(value)).replace(/^.*\./, "");
        if (str.length > param) {
            return new errors_1.ValueError("value must have at most " + param + " fraction digits");
        }
        return false;
    };
    return FractionDigitsP;
}(NonNegativeIntegerParameter));
var NumericTypeDependentParameter = (function (_super) {
    __extends(NumericTypeDependentParameter, _super);
    function NumericTypeDependentParameter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NumericTypeDependentParameter.prototype.isInvalidParam = function (value, name, type) {
        var errors = type.disallows(value);
        if (!errors) {
            return false;
        }
        // Support for multiple value errors is mainly so that we can report if a
        // value violates multiple param specifications. When we check a param in
        // isolation, it is unlikely that we'd get multiple errors. If we do, we
        // narrow it to the first error and convert the ValueError to a ParamError.
        return new errors_1.ParamError(errors[0].message);
    };
    return NumericTypeDependentParameter;
}(NumericParameter));
var fractionDigitsP = new FractionDigitsP();
var MaxInclusiveP = (function (_super) {
    __extends(MaxInclusiveP, _super);
    function MaxInclusiveP() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "maxInclusive";
        return _this;
    }
    MaxInclusiveP.prototype.isInvalidValue = function (value, param) {
        if ((isNaN(value) !== isNaN(param)) || value > param) {
            var repr = convertInternalNumberToString(param);
            return new errors_1.ValueError("value must be less than or equal to " + repr);
        }
        return false;
    };
    return MaxInclusiveP;
}(NumericTypeDependentParameter));
var maxInclusiveP = new MaxInclusiveP();
var MaxExclusiveP = (function (_super) {
    __extends(MaxExclusiveP, _super);
    function MaxExclusiveP() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "maxExclusive";
        return _this;
    }
    MaxExclusiveP.prototype.isInvalidValue = function (value, param) {
        // The negation of a less-than test allows handling a parameter value of NaN
        // automatically.
        if (!(value < param)) {
            var repr = convertInternalNumberToString(param);
            return new errors_1.ValueError("value must be less than " + repr);
        }
        return false;
    };
    return MaxExclusiveP;
}(NumericTypeDependentParameter));
var maxExclusiveP = new MaxExclusiveP();
var MinInclusiveP = (function (_super) {
    __extends(MinInclusiveP, _super);
    function MinInclusiveP() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "minInclusive";
        return _this;
    }
    MinInclusiveP.prototype.isInvalidValue = function (value, param) {
        if ((isNaN(value) !== isNaN(param)) || value < param) {
            var repr = convertInternalNumberToString(param);
            return new errors_1.ValueError("value must be greater than or equal to " + repr);
        }
        return false;
    };
    return MinInclusiveP;
}(NumericTypeDependentParameter));
var minInclusiveP = new MinInclusiveP();
var MinExclusiveP = (function (_super) {
    __extends(MinExclusiveP, _super);
    function MinExclusiveP() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "minExclusive";
        return _this;
    }
    MinExclusiveP.prototype.isInvalidValue = function (value, param) {
        // The negation of a greater-than test allows handling a parameter value of
        // NaN automatically.
        if (!(value > param)) {
            var repr = convertInternalNumberToString(param);
            return new errors_1.ValueError("value must be greater than " + repr);
        }
        return false;
    };
    return MinExclusiveP;
}(NumericTypeDependentParameter));
var minExclusiveP = new MinExclusiveP();
/**
 * @private
 *
 * @param value The value to process.
 *
 * @param param How to process the whitespaces.
 *
 * @returns The white-space-processed value. That is, the ``value`` parameter
 * once its white-spaces have been processed according to the parameter
 * passed. See the XML Schema Datatype standard for the meaning.
 */
function whiteSpaceProcessed(value, param) {
    switch (param) {
        case WhitespaceHandling.PRESERVE:
            break;
        case WhitespaceHandling.REPLACE:
            value = value.replace(/\r\n\t/g, " ");
            break;
        case WhitespaceHandling.COLLAPSE:
            value = value.replace(/\r\n\t/g, " ").trim().replace(/\s{2,}/g, " ");
            break;
        default:
            throw new Error("unexpected value: " + param);
    }
    return value;
}
/**
 * The structure that all datatype implementations in this module share.
 *
 * @private
 *
 */
var Base = (function () {
    function Base() {
        /**
         * The default whitespace processing for this type.
         */
        this.whiteSpaceDefault = WhitespaceHandling.COLLAPSE;
    }
    Base.throwMissingLocation = function (errors) {
        // The only time location is undefined is if ``parseParams`` was called
        // without arguments. That's an internal error because we should always be
        // able to call ``parseParams`` to "parse" the default parameter values.
        throw new Error("internal error: undefined location");
    };
    Object.defineProperty(Base.prototype, "paramNameToObj", {
        /**
         * A mapping of parameter names to parameter objects. It is constructed during
         * initialization of the type.
         */
        get: function () {
            var paramNameToObj = this._paramNameToObj;
            var ret = paramNameToObj !== undefined ?
                paramNameToObj : Object.create(null);
            if (paramNameToObj === undefined) {
                this._paramNameToObj = ret;
                for (var _i = 0, _a = this.validParams; _i < _a.length; _i++) {
                    var param = _a[_i];
                    ret[param.name] = param;
                }
            }
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Base.prototype, "defaultParams", {
        /**
         * The default parameters if none are specified.
         */
        get: function () {
            var defaultParams = this._defaultParams;
            if (defaultParams !== undefined) {
                return defaultParams;
            }
            var ret;
            this._defaultParams = ret = this.parseParams();
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Converts a value. It does the strict minimum to convert the value from a
     * string to an internal representation. It is never interchangeable with
     * [[parseValue]].
     *
     * @param value The value from the XML document.
     *
     * @param context The context of the value in the XML document.
     *
     * @returns An internal representation.
     */
    Base.prototype.convertValue = function (value, context) {
        return whiteSpaceProcessed(value, this.whiteSpaceDefault);
    };
    /**
     * Computes the value's length. This may differ from the value's length, as it
     * appears in the XML document it comes from.
     *
     * @param value The value from the XML document.
     *
     * @returns The length.
     */
    Base.prototype.valueLength = function (value) {
        return value.length;
    };
    Base.prototype.parseValue = function (value, context) {
        var errors = this.disallows(value, {}, context);
        if (errors) {
            throw new errors_1.ValueValidationError(errors);
        }
        return { value: this.convertValue(value, context) };
    };
    // tslint:disable-next-line: max-func-body-length
    Base.prototype.parseParams = function (location, params) {
        var errors = [];
        var names = Object.create(null);
        params = params !== undefined ? params : [];
        for (var _i = 0, params_1 = params; _i < params_1.length; _i++) {
            var x = params_1[_i];
            var name = x.name, value = x.value;
            var prop = this.paramNameToObj[name];
            // Do we know this parameter?
            if (prop === undefined) {
                errors.push(new errors_1.ParamError("unexpected parameter: " + name));
                return;
            }
            // Is the value valid at all?
            var invalid = prop.isInvalidParam(value, name, this);
            if (invalid) {
                errors.push(invalid);
            }
            // Is it repeated, and repeatable?
            if (names[name] !== undefined && !prop.repeatable) {
                errors.push(new errors_1.ParamError("cannot repeat parameter " + name));
            }
            // We gather all the values in a map of name to value.
            var values = names[name];
            if (values === undefined) {
                values = names[name] = [];
            }
            values.push(value);
        }
        if (errors.length !== 0) {
            if (location !== undefined) {
                throw new errors_1.ParameterParsingError(location, errors);
            }
            Base.throwMissingLocation(errors);
        }
        // We just modify the ``names`` object to produce a return value.
        var ret = names;
        for (var key in ret) {
            var value = ret[key];
            var prop = this.paramNameToObj[key];
            if (value.length > 1) {
                ret[key] = prop.combine(value);
            }
            else {
                ret[key] = ((prop.convert !== undefined) ?
                    prop.convert(value[0]) : value[0]);
            }
        }
        // Inter-parameter checks. There's no point in trying to generalize
        // this.
        /* tslint:disable: no-string-literal */
        if (ret["minLength"] > ret["maxLength"]) {
            errors.push(new errors_1.ParamError("minLength must be less than or equal to maxLength"));
        }
        if (ret["length"] !== undefined) {
            if (ret["minLength"] !== undefined) {
                errors.push(new errors_1.ParamError("length and minLength cannot appear together"));
            }
            if (ret["maxLength"] !== undefined) {
                errors.push(new errors_1.ParamError("length and maxLength cannot appear together"));
            }
        }
        if (ret["maxInclusive"] !== undefined) {
            if (ret["maxExclusive"] !== undefined) {
                errors.push(new errors_1.ParamError("maxInclusive and maxExclusive cannot appear together"));
            }
            // maxInclusive, minExclusive
            if (ret["minExclusive"] >= ret["maxInclusive"]) {
                errors.push(new errors_1.ParamError("minExclusive must be less than maxInclusive"));
            }
        }
        if (ret["minInclusive"] !== undefined) {
            if (ret["minExclusive"] !== undefined) {
                errors.push(new errors_1.ParamError("minInclusive and minExclusive cannot appear together"));
            }
            // maxInclusive, minInclusive
            if (ret["minInclusive"] > ret["maxInclusive"]) {
                errors.push(new errors_1.ParamError("minInclusive must be less than or equal to maxInclusive"));
            }
            // maxExclusive, minInclusive
            if (ret["minInclusive"] >= ret["maxExclusive"]) {
                errors.push(new errors_1.ParamError("minInclusive must be less than maxExclusive"));
            }
        }
        // maxExclusive, minExclusive
        if (ret["minExclusive"] > ret["maxExclusive"]) {
            errors.push(new errors_1.ParamError("minExclusive must be less than or equal to maxExclusive"));
        }
        /* tslint:enable: no-string-literal */
        if (errors.length !== 0) {
            if (location !== undefined) {
                throw new errors_1.ParameterParsingError(location, errors);
            }
            Base.throwMissingLocation(errors);
        }
        return ret;
    };
    /**
     * Determines whether the parameters disallow a value.
     *
     * @param raw The value from the XML document.
     *
     * @param value The internal representation of the value, as returned from
     * [[convertValue]].
     *
     * @param params The parameters, as returned from [[parseParams]].
     *
     * @param context The context, if needed.
     *
     * @returns ``false`` if there is no error. Otherwise, an array of errors.
     */
    Base.prototype.disallowedByParams = function (raw, value, params, context) {
        if (params !== undefined) {
            var errors = [];
            // We use Object.keys because we don't know the precise type of params.
            for (var _i = 0, _a = Object.keys(params); _i < _a.length; _i++) {
                var name = _a[_i];
                var param = this.paramNameToObj[name];
                var err = param.isInvalidValue(value, params[name], this);
                if (err) {
                    errors.push(err);
                }
            }
            if (errors.length !== 0) {
                return errors;
            }
        }
        return false;
    };
    Base.prototype.equal = function (value, schemaValue, context) {
        if (schemaValue.value === undefined) {
            throw Error("it looks like you are trying to use an unparsed value");
        }
        var converted;
        try {
            converted = this.convertValue(value, context);
        }
        catch (ex) {
            // An invalid value cannot be equal.
            if (ex instanceof errors_1.ValueValidationError) {
                return false;
            }
            throw ex;
        }
        // In the IEEE 754-1985 standard, which is what XMLSChema 1.0 follows, NaN
        // is equal to NaN. In JavaScript NaN is equal to nothing, not even itself.
        // So we need to handle this difference.
        if (typeof converted === "number" && isNaN(converted)) {
            return isNaN(schemaValue.value);
        }
        return converted === schemaValue.value;
    };
    Base.prototype.disallows = function (value, params, context) {
        if (params instanceof Array) {
            throw new Error("it looks like you are passing unparsed " +
                "parameters to disallows");
        }
        else if (params === undefined || Object.keys(params).length === 0) {
            // If no params were passed, get the default params.
            params = this.defaultParams;
        }
        // This must be done against the raw value because the **lexical** space of
        // this type must match this.
        if (whiteSpaceProcessed(value, WhitespaceHandling.COLLAPSE)
            .match(this.regexp) === null) {
            return [new errors_1.ValueError(this.typeErrorMsg)];
        }
        var converted;
        try {
            converted = this.convertValue(value, context);
        }
        catch (ex) {
            // An invalid value is not allowed.
            if (ex instanceof errors_1.ValueValidationError) {
                return ex.errors;
            }
            throw ex;
        }
        return this.disallowedByParams(value, converted, params, context);
    };
    return Base;
}());
//
// String family
//
/* tslint:disable:class-name */
var string_ = (function (_super) {
    __extends(string_, _super);
    function string_() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "string";
        _this.typeErrorMsg = "value is not a string";
        _this.whiteSpaceDefault = WhitespaceHandling.PRESERVE;
        _this.validParams = [lengthP, minLengthP, maxLengthP,
            patternP];
        _this.needsContext = false;
        _this.regexp = /^.*$/;
        return _this;
    }
    return string_;
}(Base));
var normalizedString = (function (_super) {
    __extends(normalizedString, _super);
    function normalizedString() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "normalizedString";
        _this.typeErrorMsg = "string contains a tab, carriage return or newline";
        _this.regexp = /^[^\r\n\t]+$/;
        return _this;
    }
    return normalizedString;
}(string_));
var token = (function (_super) {
    __extends(token, _super);
    function token() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "token";
        _this.typeErrorMsg = "not a valid token";
        _this.regexp = /^(?:(?! )(?:(?! {3})[^\r\n\t])*[^\r\n\t ])?$/;
        return _this;
    }
    return token;
}(normalizedString));
var language = (function (_super) {
    __extends(language, _super);
    function language() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "language";
        _this.typeErrorMsg = "not a valid language identifier";
        _this.regexp = /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/;
        return _this;
    }
    return language;
}(token));
var Name = (function (_super) {
    __extends(Name, _super);
    function Name() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "Name";
        _this.typeErrorMsg = "not a valid Name";
        _this.regexp = xmlcharacters_1.xmlNameRe;
        return _this;
    }
    return Name;
}(token));
var NCName = (function (_super) {
    __extends(NCName, _super);
    function NCName() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "NCName";
        _this.typeErrorMsg = "not a valid NCName";
        _this.regexp = xmlcharacters_1.xmlNcnameRe;
        return _this;
    }
    return NCName;
}(Name));
var xmlNmtokenRe = new RegExp("^[" + xmlcharacters_1.xmlNameChar + "]+$");
var NMTOKEN = (function (_super) {
    __extends(NMTOKEN, _super);
    function NMTOKEN() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "NMTOKEN";
        _this.typeErrorMsg = "not a valid NMTOKEN";
        _this.regexp = xmlNmtokenRe;
        return _this;
    }
    return NMTOKEN;
}(token));
var xmlNmtokensRe = new RegExp("^[" + xmlcharacters_1.xmlNameChar + "]+(?: [" + xmlcharacters_1.xmlNameChar + "]+)*$");
var NMTOKENS = (function (_super) {
    __extends(NMTOKENS, _super);
    function NMTOKENS() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "NMTOKENS";
        _this.typeErrorMsg = "not a valid NMTOKENS";
        _this.regexp = xmlNmtokensRe;
        _this.whiteSpaceDefault = WhitespaceHandling.COLLAPSE;
        return _this;
    }
    return NMTOKENS;
}(NMTOKEN));
var ID = (function (_super) {
    __extends(ID, _super);
    function ID() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "ID";
        _this.typeErrorMsg = "not a valid ID";
        return _this;
    }
    return ID;
}(NCName));
var IDREF = (function (_super) {
    __extends(IDREF, _super);
    function IDREF() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "IDREF";
        _this.typeErrorMsg = "not a valid IDREF";
        return _this;
    }
    return IDREF;
}(NCName));
var IDREFS_RE = new RegExp("^" + xmlcharacters_1.xmlNcname + "(?: " + xmlcharacters_1.xmlNcname + ")*$");
var IDREFS = (function (_super) {
    __extends(IDREFS, _super);
    function IDREFS() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "IDREFS";
        _this.typeErrorMsg = "not a valid IDREFS";
        _this.regexp = IDREFS_RE;
        _this.whiteSpaceDefault = WhitespaceHandling.COLLAPSE;
        return _this;
    }
    return IDREFS;
}(IDREF));
var ENTITY = (function (_super) {
    __extends(ENTITY, _super);
    function ENTITY() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "ENTITY";
        _this.typeErrorMsg = "not a valid ENTITY";
        return _this;
    }
    return ENTITY;
}(string_));
var ENTITIES = (function (_super) {
    __extends(ENTITIES, _super);
    function ENTITIES() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "ENTITIES";
        _this.typeErrorMsg = "not a valid ENTITIES";
        return _this;
    }
    return ENTITIES;
}(string_));
//
// Decimal family
//
var decimalPattern = "[-+]?(?!$)\\d*(\\.\\d*)?";
var decimal = (function (_super) {
    __extends(decimal, _super);
    function decimal() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "decimal";
        _this.typeErrorMsg = "value not a decimal number";
        _this.regexp = new RegExp("^" + decimalPattern + "$");
        _this.whiteSpaceDefault = WhitespaceHandling.COLLAPSE;
        _this.needsContext = false;
        _this.validParams = [
            totalDigitsP, fractionDigitsP, patternP, minExclusiveP, minInclusiveP,
            maxExclusiveP, maxInclusiveP,
        ];
        return _this;
    }
    decimal.prototype.convertValue = function (value) {
        return Number(_super.prototype.convertValue.call(this, value));
    };
    return decimal;
}(Base));
var integerPattern = "[-+]?\\d+";
var integer = (function (_super) {
    __extends(integer, _super);
    function integer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "integer";
        _this.typeErrorMsg = "value is not an integer";
        _this.regexp = new RegExp("^" + integerPattern + "$");
        _this.validParams = [
            totalDigitsP, patternP, minExclusiveP, minInclusiveP, maxExclusiveP,
            maxInclusiveP,
        ];
        return _this;
    }
    integer.prototype.parseParams = function (location, params) {
        var me;
        var mi;
        var ret = _super.prototype.parseParams.call(this, location, params);
        function fail(message) {
            var errors = [new errors_1.ParamError(message)];
            if (location !== undefined) {
                throw new errors_1.ParameterParsingError(location, errors);
            }
            return Base.throwMissingLocation(errors);
        }
        var highestVal = this.highestVal;
        if (highestVal !== undefined) {
            /* tslint:disable:no-string-literal */
            if (ret["maxExclusive"] !== undefined) {
                me = ret["maxExclusive"];
                if (me > highestVal) {
                    fail("maxExclusive cannot be greater than " + highestVal);
                }
            }
            else if (ret["maxInclusive"] !== undefined) {
                mi = ret["maxInclusive"];
                if (mi > highestVal) {
                    fail("maxInclusive cannot be greater than " + highestVal);
                }
            }
            else {
                ret["maxInclusive"] = this.highestVal;
            }
        }
        if (this.lowestVal !== undefined) {
            if (ret["minExclusive"] !== undefined) {
                me = ret["minExclusive"];
                if (me < this.lowestVal) {
                    fail("minExclusive cannot be lower than " + this.lowestVal);
                }
            }
            else if (ret["minInclusive"] !== undefined) {
                mi = ret["minInclusive"];
                if (mi < this.lowestVal) {
                    fail("minInclusive cannot be lower than " + this.lowestVal);
                }
            }
            else {
                ret["minInclusive"] = this.lowestVal;
            }
        }
        /* tslint:enable:no-string-literal */
        return ret;
    };
    return integer;
}(decimal));
var nonPositiveInteger = (function (_super) {
    __extends(nonPositiveInteger, _super);
    function nonPositiveInteger() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "nonPositiveInteger";
        _this.typeErrorMsg = "value is not a nonPositiveInteger";
        _this.regexp = /^\+?0+|-\d+$/;
        _this.highestVal = 0;
        _this.validParams = [
            totalDigitsP, patternP, minExclusiveP, minInclusiveP, maxExclusiveP,
            maxInclusiveP,
        ];
        return _this;
    }
    return nonPositiveInteger;
}(integer));
var negativeInteger = (function (_super) {
    __extends(negativeInteger, _super);
    function negativeInteger() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "negativeInteger";
        _this.typeErrorMsg = "value is not a negativeInteger";
        _this.regexp = /^-\d+$/;
        _this.highestVal = -1;
        _this.validParams = [
            totalDigitsP, patternP, minExclusiveP, minInclusiveP, maxExclusiveP,
            maxInclusiveP,
        ];
        return _this;
    }
    return negativeInteger;
}(nonPositiveInteger));
var nonNegativeInteger = (function (_super) {
    __extends(nonNegativeInteger, _super);
    function nonNegativeInteger() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "nonNegativeInteger";
        _this.typeErrorMsg = "value is not a nonNegativeInteger";
        _this.regexp = /^(\+?\d+|-0)$/;
        _this.lowestVal = 0;
        _this.validParams = [
            totalDigitsP, patternP, minExclusiveP, minInclusiveP, maxExclusiveP,
            maxInclusiveP,
        ];
        return _this;
    }
    return nonNegativeInteger;
}(integer));
var positiveInteger = (function (_super) {
    __extends(positiveInteger, _super);
    function positiveInteger() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "positiveInteger";
        _this.typeErrorMsg = "value is not a positiveInteger";
        _this.regexp = /^\+?\d+$/;
        _this.lowestVal = 1;
        _this.validParams = [
            totalDigitsP, patternP, minExclusiveP, minInclusiveP, maxExclusiveP,
            maxInclusiveP,
        ];
        return _this;
    }
    return positiveInteger;
}(nonNegativeInteger));
var long_ = (function (_super) {
    __extends(long_, _super);
    function long_() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "long";
        _this.typeErrorMsg = "value is not a long";
        _this.highestVal = 9223372036854775807;
        _this.lowestVal = -9223372036854775808;
        _this.validParams = [
            totalDigitsP, patternP, minExclusiveP, minInclusiveP, maxExclusiveP,
            maxInclusiveP,
        ];
        return _this;
    }
    return long_;
}(integer));
var int_ = (function (_super) {
    __extends(int_, _super);
    function int_() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "int";
        _this.typeErrorMsg = "value is not an int";
        _this.highestVal = 2147483647;
        _this.lowestVal = -2147483648;
        return _this;
    }
    return int_;
}(long_));
var short_ = (function (_super) {
    __extends(short_, _super);
    function short_() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "short";
        _this.typeErrorMsg = "value is not a short";
        _this.highestVal = 32767;
        _this.lowestVal = -32768;
        return _this;
    }
    return short_;
}(int_));
var byte_ = (function (_super) {
    __extends(byte_, _super);
    function byte_() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "byte";
        _this.typeErrorMsg = "value is not a byte";
        _this.highestVal = 127;
        _this.lowestVal = -128;
        return _this;
    }
    return byte_;
}(short_));
var unsignedLong = (function (_super) {
    __extends(unsignedLong, _super);
    function unsignedLong() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "unsignedLong";
        _this.typeErrorMsg = "value is not an unsignedLong";
        _this.highestVal = 18446744073709551615;
        _this.validParams = [
            totalDigitsP, patternP, minExclusiveP, minInclusiveP, maxExclusiveP,
            maxInclusiveP,
        ];
        return _this;
    }
    return unsignedLong;
}(nonNegativeInteger));
var unsignedInt = (function (_super) {
    __extends(unsignedInt, _super);
    function unsignedInt() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "unsignedInt";
        _this.typeErrorMsg = "value is not an unsignedInt";
        _this.highestVal = 4294967295;
        _this.validParams = [
            totalDigitsP, patternP, minExclusiveP, minInclusiveP, maxExclusiveP,
            maxInclusiveP,
        ];
        return _this;
    }
    return unsignedInt;
}(unsignedLong));
var unsignedShort = (function (_super) {
    __extends(unsignedShort, _super);
    function unsignedShort() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "unsignedShort";
        _this.typeErrorMsg = "value is not an unsignedShort";
        _this.highestVal = 65535;
        _this.validParams = [
            totalDigitsP, patternP, minExclusiveP, minInclusiveP, maxExclusiveP,
            maxInclusiveP,
        ];
        return _this;
    }
    return unsignedShort;
}(unsignedInt));
var unsignedByte = (function (_super) {
    __extends(unsignedByte, _super);
    function unsignedByte() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "unsignedByte";
        _this.typeErrorMsg = "value is not an unsignedByte";
        _this.highestVal = 255;
        _this.validParams = [
            totalDigitsP, patternP, minExclusiveP, minInclusiveP, maxExclusiveP,
            maxInclusiveP,
        ];
        return _this;
    }
    return unsignedByte;
}(unsignedShort));
var boolean_ = (function (_super) {
    __extends(boolean_, _super);
    function boolean_() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "boolean";
        _this.typeErrorMsg = "not a valid boolean";
        _this.regexp = /^(1|0|true|false)$/;
        _this.validParams = [patternP];
        _this.needsContext = false;
        return _this;
    }
    boolean_.prototype.convertValue = function (value) {
        return (value === "1" || value === "true");
    };
    return boolean_;
}(Base));
var B04 = "[AQgw]";
var B16 = "[AEIMQUYcgkosw048]";
var B64 = "[A-Za-z0-9+/]";
var B64S = "(?:" + B64 + " ?)";
var B16S = "(?:" + B16 + " ?)";
var B04S = "(?:" + B04 + " ?)";
var base64BinaryRe = new RegExp("^(?:(?:" + B64S + "{4})*(?:(?:" + B64S + "{3}" + B64 + ")|(?:" + B64S + "{2}" + B16S + "=)|(?:" +
    ("" + B64S + B04S + "= ?=)))?$"));
var base64Binary = (function (_super) {
    __extends(base64Binary, _super);
    function base64Binary() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "base64Binary";
        _this.typeErrorMsg = "not a valid base64Binary";
        _this.regexp = base64BinaryRe;
        _this.needsContext = false;
        _this.validParams = [lengthP, minLengthP, maxLengthP, patternP];
        return _this;
    }
    base64Binary.prototype.convertValue = function (value) {
        // We don't need to actually decode it.
        return value.replace(/\s/g, "");
    };
    base64Binary.prototype.valueLength = function (value) {
        // Length of the decoded value.
        return Math.floor((value.replace(/[\s=]/g, "").length * 3) / 4);
    };
    return base64Binary;
}(Base));
var hexBinary = (function (_super) {
    __extends(hexBinary, _super);
    function hexBinary() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "hexBinary";
        _this.typeErrorMsg = "not a valid hexBinary";
        _this.regexp = /^(?:[0-9a-fA-F]{2})*$/;
        _this.needsContext = false;
        _this.validParams = [lengthP, minLengthP, maxLengthP, patternP];
        return _this;
    }
    hexBinary.prototype.convertValue = function (value) {
        return value;
    };
    hexBinary.prototype.valueLength = function (value) {
        // Length of the byte list.
        return value.length / 2;
    };
    return hexBinary;
}(Base));
var doubleRe = new RegExp("^(?:(?:[-+]?INF)|(?:NaN)|(?:" + decimalPattern + "(?:[Ee]" + integerPattern + ")?))$");
var float_ = (function (_super) {
    __extends(float_, _super);
    function float_() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "float";
        _this.typeErrorMsg = "not a valid float";
        _this.regexp = doubleRe;
        _this.needsContext = false;
        _this.validParams = [
            patternP, minInclusiveP, minExclusiveP, maxInclusiveP, maxExclusiveP,
        ];
        return _this;
    }
    float_.prototype.convertValue = function (value, context) {
        return convertToInternalNumber(value);
    };
    return float_;
}(Base));
var double_ = (function (_super) {
    __extends(double_, _super);
    function double_() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "double";
        _this.typeErrorMsg = "not a valid double";
        return _this;
    }
    return double_;
}(float_));
var QName = (function (_super) {
    __extends(QName, _super);
    function QName() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "QName";
        _this.typeErrorMsg = "not a valid QName";
        _this.regexp = new RegExp("^(?:" + xmlcharacters_1.xmlNcname + ":)?" + xmlcharacters_1.xmlNcname + "$");
        _this.needsContext = true;
        _this.validParams = [patternP, lengthP, minLengthP, maxLengthP];
        return _this;
    }
    QName.prototype.convertValue = function (value, context) {
        var ret = context.resolver.resolveName(_super.prototype.convertValue.call(this, value));
        if (ret === undefined) {
            throw new errors_1.ValueValidationError([new errors_1.ValueError("cannot resolve the name " + value)]);
        }
        return "{" + ret.ns + "}" + ret.name;
    };
    return QName;
}(Base));
var NOTATION = (function (_super) {
    __extends(NOTATION, _super);
    function NOTATION() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "NOTATION";
        _this.typeErrorMsg = "not a valid NOTATION";
        _this.regexp = new RegExp("^(?:" + xmlcharacters_1.xmlNcname + ":)?" + xmlcharacters_1.xmlNcname + "$");
        _this.needsContext = true;
        _this.validParams = [patternP, lengthP, minLengthP, maxLengthP];
        return _this;
    }
    NOTATION.prototype.convertValue = function (value, context) {
        var ret = context.resolver.resolveName(_super.prototype.convertValue.call(this, value));
        if (ret === undefined) {
            throw new errors_1.ValueValidationError([new errors_1.ValueError("cannot resolve the name " + value)]);
        }
        return "{" + ret.ns + "}" + ret.name;
    };
    return NOTATION;
}(Base));
var duration = (function (_super) {
    __extends(duration, _super);
    function duration() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "duration";
        _this.typeErrorMsg = "not a valid duration";
        _this.regexp = 
        // tslint:disable-next-line:max-line-length
        /^-?P(?!$)(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?!$)(?:\d+H)?(?:\d+M)?(?:\d+(\.\d+)?S)?)?$/;
        _this.validParams = [patternP];
        _this.needsContext = false;
        return _this;
    }
    return duration;
}(Base));
var yearPattern = "-?(?:[1-9]\\d*)?\\d{4}";
var monthPattern = "[01]\\d";
var domPattern = "[0-3]\\d";
var timePattern = "[012]\\d:[0-5]\\d:[0-5]\\d(?:\\.\\d+)?";
var tzPattern = "(?:[+-][01]\\d:[0-5]\\d|Z)";
var tzRe = new RegExp(tzPattern + "$");
function isLeapYear(year) {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}
var dateGroupingRe = new RegExp("^(" + yearPattern + ")-(" + monthPattern + ")-(" + domPattern + ")T(" + timePattern + ")" +
    ("(" + tzPattern + "?)$"));
var maxDoms = [undefined, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function checkDate(value) {
    // The Date.parse method of JavaScript is not reliable.
    var match = value.match(dateGroupingRe);
    if (match === null) {
        return false;
    }
    var year = match[1];
    var leap = isLeapYear(Number(year));
    var month = Number(match[2]);
    if (month === 0 || month > 12) {
        return false;
    }
    var dom = Number(match[3]);
    // We cannot have an undefined value here... so...
    // tslint:disable-next-line:no-non-null-assertion
    var maxDom = maxDoms[month];
    if (month === 2 && !leap) {
        maxDom = 28;
    }
    if (dom === 0 || dom > maxDom) {
        return false;
    }
    var timeParts = match[4].split(":");
    var minutes = Number(timeParts[1]);
    if (minutes > 59) {
        return false;
    }
    var seconds = Number(timeParts[2]);
    if (seconds > 59) {
        return false;
    }
    // 24 is valid if minutes and seconds are at 0, otherwise 23 is the
    // limit.
    var hoursLimit = (minutes === 0 && seconds === 0) ? 24 : 23;
    if (Number(timeParts[0]) > hoursLimit) {
        return false;
    }
    if (match[5] !== undefined && match[5] !== "" && match[5] !== "Z") {
        // We have a TZ
        var tzParts = match[5].split(":");
        // Slice: skip the sign.
        var tzHours = Number(tzParts[0].slice(1));
        if (tzHours > 14) {
            return false;
        }
        var tzSeconds = Number(tzParts[1]);
        if (tzSeconds > 59) {
            return false;
        }
        if (tzHours === 14 && tzSeconds !== 0) {
            return false;
        }
    }
    return true;
}
var dateTime = (function (_super) {
    __extends(dateTime, _super);
    function dateTime() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "dateTime";
        _this.typeErrorMsg = "not a valid dateTime";
        _this.regexp = new RegExp("^" + yearPattern + "-" + monthPattern + "-" + domPattern +
            ("T" + timePattern + tzPattern + "?$"));
        _this.needsContext = false;
        _this.validParams = [patternP];
        return _this;
    }
    dateTime.prototype.disallows = function (value, params) {
        var ret = _super.prototype.disallows.call(this, value, params);
        if (ret instanceof Array) {
            return ret;
        }
        if (!checkDate(value)) {
            return [new errors_1.ValueError(this.typeErrorMsg)];
        }
        return false;
    };
    return dateTime;
}(Base));
var time = (function (_super) {
    __extends(time, _super);
    function time() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "time";
        _this.typeErrorMsg = "not a valid time";
        _this.regexp = new RegExp("^" + timePattern + tzPattern + "?$");
        _this.validParams = [patternP];
        _this.needsContext = false;
        return _this;
    }
    time.prototype.disallows = function (value, params) {
        var ret = _super.prototype.disallows.call(this, value, params);
        if (ret) {
            return ret;
        }
        // Date does not validate times, so set the date to something fake.
        if (!checkDate("1901-01-01T" + value)) {
            return [new errors_1.ValueError(this.typeErrorMsg)];
        }
        return false;
    };
    return time;
}(Base));
var date = (function (_super) {
    __extends(date, _super);
    function date() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "date";
        _this.typeErrorMsg = "not a valid date";
        _this.regexp = new RegExp("^" + yearPattern + "-" + monthPattern + "-" + domPattern + tzPattern + "?$");
        _this.needsContext = false;
        _this.validParams = [patternP];
        return _this;
    }
    date.prototype.disallows = function (value, params) {
        var ret = _super.prototype.disallows.call(this, value, params);
        if (ret) {
            return ret;
        }
        // We have to add time for Date() to parse it.
        var match = value.match(tzRe);
        value = match !== null ?
            value.slice(0, match.index) + "T00:00:00" + match[0] :
            value + "T00:00:00";
        if (!checkDate(value)) {
            return [new errors_1.ValueError(this.typeErrorMsg)];
        }
        return false;
    };
    return date;
}(Base));
var gYearMonth = (function (_super) {
    __extends(gYearMonth, _super);
    function gYearMonth() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "gYearMonth";
        _this.typeErrorMsg = "not a valid gYearMonth";
        _this.regexp = new RegExp("^" + yearPattern + "-" + monthPattern + tzPattern + "?$");
        _this.validParams = [patternP];
        _this.needsContext = false;
        return _this;
    }
    gYearMonth.prototype.disallows = function (value, params) {
        var ret = _super.prototype.disallows.call(this, value, params);
        if (ret) {
            return ret;
        }
        // We have to add a day and time for Date() to parse it.
        var match = value.match(tzRe);
        value = match !== null ?
            value.slice(0, match.index) + "-01T00:00:00" + match[0] :
            value + "-01T00:00:00";
        if (!checkDate(value)) {
            return [new errors_1.ValueError(this.typeErrorMsg)];
        }
        return false;
    };
    return gYearMonth;
}(Base));
var gYear = (function (_super) {
    __extends(gYear, _super);
    function gYear() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "gYear";
        _this.typeErrorMsg = "not a valid gYear";
        _this.regexp = new RegExp("^" + yearPattern + tzPattern + "?$");
        _this.needsContext = false;
        _this.validParams = [patternP];
        return _this;
    }
    gYear.prototype.disallows = function (value, params) {
        var ret = _super.prototype.disallows.call(this, value, params);
        if (ret) {
            return ret;
        }
        // We have to add a month, a day and a time for Date() to parse it.
        var match = value.match(tzRe);
        value = match !== null ?
            value.slice(0, match.index) + "-01-01T00:00:00" + match[0] :
            value + "-01-01T00:00:00";
        if (!checkDate(value)) {
            return [new errors_1.ValueError(this.typeErrorMsg)];
        }
        return false;
    };
    return gYear;
}(Base));
var gMonthDay = (function (_super) {
    __extends(gMonthDay, _super);
    function gMonthDay() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "gMonthDay";
        _this.typeErrorMsg = "not a valid gMonthDay";
        _this.regexp = new RegExp("^" + monthPattern + "-" + domPattern + tzPattern + "?$");
        _this.needsContext = false;
        _this.validParams = [patternP];
        return _this;
    }
    gMonthDay.prototype.disallows = function (value, params) {
        var ret = _super.prototype.disallows.call(this, value, params);
        if (ret) {
            return ret;
        }
        // We have to add a year and a time for Date() to parse it.
        var match = value.match(tzRe);
        value = match !== null ?
            value.slice(0, match.index) + "T00:00:00" + match[0] :
            value + "T00:00:00";
        // We always add 2000, which is a leap year, so 01-29 won't raise an
        // error.
        if (!checkDate("2000-" + value)) {
            return [new errors_1.ValueError(this.typeErrorMsg)];
        }
        return false;
    };
    return gMonthDay;
}(Base));
var gDay = (function (_super) {
    __extends(gDay, _super);
    function gDay() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "gDay";
        _this.typeErrorMsg = "not a valid gDay";
        _this.regexp = new RegExp("^" + domPattern + tzPattern + "?$");
        _this.needsContext = false;
        _this.validParams = [patternP];
        return _this;
    }
    gDay.prototype.disallows = function (value, params) {
        var ret = _super.prototype.disallows.call(this, value, params);
        if (ret) {
            return ret;
        }
        // We have to add a year and a time for Date() to parse it.
        var match = value.match(tzRe);
        value = match !== null ?
            value.slice(0, match.index) + "T00:00:00" + match[0] :
            value + "T00:00:00";
        // We always add 2000, which is a leap year, so 01-29 won't raise an
        // error.
        if (!checkDate("2000-01-" + value)) {
            return [new errors_1.ValueError(this.typeErrorMsg)];
        }
        return false;
    };
    return gDay;
}(Base));
var gMonth = (function (_super) {
    __extends(gMonth, _super);
    function gMonth() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "gMonth";
        _this.typeErrorMsg = "not a valid gMonth";
        _this.regexp = new RegExp("^" + monthPattern + tzPattern + "?$");
        _this.needsContext = false;
        _this.validParams = [patternP];
        return _this;
    }
    gMonth.prototype.disallows = function (value, params) {
        var ret = _super.prototype.disallows.call(this, value, params);
        if (ret) {
            return ret;
        }
        // We have to add a year and a time for Date() to parse it.
        var match = value.match(tzRe);
        value = match !== null ?
            value.slice(0, match.index) + "-01T00:00:00" + match[0] :
            value + "-01T00:00:00";
        // We always add 2000, which is a leap year, so 01-29 won't raise an
        // error.
        if (!checkDate("2000-" + value)) {
            return [new errors_1.ValueError(this.typeErrorMsg)];
        }
        return false;
    };
    return gMonth;
}(Base));
// Generated from http://jmrware.com/articles/2009/uri_regexp/URI_regex.html
// tslint:disable-next-line:max-line-length
var reJsRfc3986UriReference = /^(?:[A-Za-z][A-Za-z0-9+\-.]*:(?:\/\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:]|%[0-9A-Fa-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9A-Fa-f]{1,4}:){6}|::(?:[0-9A-Fa-f]{1,4}:){5}|(?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,1}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){3}|(?:(?:[0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){2}|(?:(?:[0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}:|(?:(?:[0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})?::)(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(?:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})?::)|[Vv][0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[A-Za-z0-9\-._~!$&'()*+,;=]|%[0-9A-Fa-f]{2})*)(?::[0-9]*)?(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*)?|(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|)(?:\?(?:[A-Za-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*)?(?:\#(?:[A-Za-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*)?|(?:\/\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:]|%[0-9A-Fa-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9A-Fa-f]{1,4}:){6}|::(?:[0-9A-Fa-f]{1,4}:){5}|(?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,1}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){3}|(?:(?:[0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){2}|(?:(?:[0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}:|(?:(?:[0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})?::)(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(?:(?:[0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}|(?:(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})?::)|[Vv][0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[A-Za-z0-9\-._~!$&'()*+,;=]|%[0-9A-Fa-f]{2})*)(?::[0-9]*)?(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|\/(?:(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*)?|(?:[A-Za-z0-9\-._~!$&'()*+,;=@]|%[0-9A-Fa-f]{2})+(?:\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*|)(?:\?(?:[A-Za-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*)?(?:\#(?:[A-Za-z0-9\-._~!$&'()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*)?)$/;
var anyURI = (function (_super) {
    __extends(anyURI, _super);
    function anyURI() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "anyURI";
        _this.typeErrorMsg = "not a valid anyURI";
        _this.regexp = reJsRfc3986UriReference;
        _this.needsContext = false;
        _this.validParams = [patternP, lengthP, minLengthP, maxLengthP];
        return _this;
    }
    return anyURI;
}(Base));
var types = [
    string_,
    normalizedString,
    token,
    language,
    Name,
    NCName,
    NMTOKEN,
    NMTOKENS,
    ID,
    IDREF,
    IDREFS,
    ENTITY,
    ENTITIES,
    decimal,
    integer,
    nonPositiveInteger,
    negativeInteger,
    nonNegativeInteger,
    positiveInteger,
    long_,
    int_,
    short_,
    byte_,
    unsignedLong,
    unsignedInt,
    unsignedShort,
    unsignedByte,
    boolean_,
    base64Binary,
    hexBinary,
    float_,
    double_,
    QName,
    NOTATION,
    duration,
    dateTime,
    time,
    date,
    gYearMonth,
    gYear,
    gMonthDay,
    gDay,
    gMonth,
    anyURI,
];
var library = {
    // tslint:disable-next-line: no-http-string
    uri: "http://www.w3.org/2001/XMLSchema-datatypes",
    types: {},
};
for (var _i = 0, types_1 = types; _i < types_1.length; _i++) {
    var type = types_1[_i];
    var instance = new type();
    library.types[instance.name] = instance;
}
/**
 * The XML Schema datatype library.
 */
exports.xmlschema = library;
//  LocalWords:  XMLSchema datatypes MPL whitespace param minLength maxLength
//  LocalWords:  RNG rng failedOn totalDigits fractionDigits ValueError repr zA
//  LocalWords:  ParamError maxInclusive maxExclusive NaN minInclusive params
//  LocalWords:  minExclusive whitespaces parseParams unparsed XMLSChema NCName
//  LocalWords:  normalizedString xmlNameChar NMTOKEN NMTOKENS IDREF xmlNcname
//  LocalWords:  IDREFS decimalPattern integerPattern highestVal lowestVal AQgw
//  LocalWords:  nonPositiveInteger negativeInteger nonNegativeInteger Za fA Ee
//  LocalWords:  positiveInteger unsignedLong unsignedInt unsignedShort QName
//  LocalWords:  unsignedByte AEIMQUYcgkosw hexBinary tzPattern yearPattern TZ
//  LocalWords:  monthPattern domPattern timePattern dateTime gYearMonth gYear
//  LocalWords:  gMonthDay gDay gMonth anyURI

//# sourceMappingURL=xmlschema.js.map


/***/ }),
/* 18 */
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
 * Pattern and walker for RNG's ``attribute`` elements.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var errors_1 = __webpack_require__(1);
var base_1 = __webpack_require__(0);
/**
 * A pattern for attributes.
 */
var Attribute = (function (_super) {
    __extends(Attribute, _super);
    /**
     * @param xmlPath This is a string which uniquely identifies the
     * element from the simplified RNG tree. Used in debugging.
     *
     * @param name The qualified name of the attribute.
     *
     * @param pat The pattern contained by this one.
     */
    function Attribute(xmlPath, name, pat) {
        var _this = _super.call(this, xmlPath, pat) || this;
        _this.name = name;
        return _this;
    }
    Attribute.prototype._prepare = function (namespaces) {
        var nss = Object.create(null);
        this.name._recordNamespaces(nss);
        // A lack of namespace on an attribute should not be recorded.
        delete nss[""];
        // Copy the resulting namespaces.
        // tslint:disable-next-line:forin
        for (var key in nss) {
            namespaces[key] = 1;
        }
    };
    Attribute.prototype._hasAttrs = function () {
        return true;
    };
    return Attribute;
}(base_1.OneSubpattern));
exports.Attribute = Attribute;
/**
 * Walker for [[Attribute]].
 */
var AttributeWalker = (function (_super) {
    __extends(AttributeWalker, _super);
    function AttributeWalker(elOrWalker, nameResolverOrMemo) {
        var _this = this;
        if (elOrWalker instanceof AttributeWalker) {
            var walker = elOrWalker;
            var memo = base_1.isHashMap(nameResolverOrMemo);
            _this = _super.call(this, walker, memo) || this;
            _this.nameResolver = _this._cloneIfNeeded(walker.nameResolver, memo);
            _this.seenName = walker.seenName;
            _this.seenValue = walker.seenValue;
            _this.subwalker = walker.subwalker !== undefined ?
                walker.subwalker._clone(memo) : undefined;
            // No need to clone; values are immutable.
            _this.attrNameEvent = walker.attrNameEvent;
            _this.neutralized = walker.neutralized;
        }
        else {
            var el = elOrWalker;
            var nameResolver = base_1.isNameResolver(nameResolverOrMemo);
            _this = _super.call(this, el) || this;
            _this.nameResolver = nameResolver;
            _this.attrNameEvent = new base_1.Event("attributeName", el.name);
            _this.seenName = false;
            _this.seenValue = false;
            _this.neutralized = false;
        }
        return _this;
    }
    AttributeWalker.prototype._possible = function () {
        // We've been suppressed!
        if (this.suppressedAttributes) {
            return new base_1.EventSet();
        }
        if (!this.seenName) {
            return new base_1.EventSet(this.attrNameEvent);
        }
        else if (!this.seenValue) {
            if (this.subwalker === undefined) {
                this.subwalker = this.el.pat.newWalker(this.nameResolver);
            }
            var sub = this.subwalker._possible();
            var ret_1 = new base_1.EventSet();
            // Convert text events to attributeValue events.
            sub.forEach(function (ev) {
                if (ev.params[0] !== "text") {
                    throw new Error("unexpected event type: " + ev.params[0]);
                }
                ret_1.add(new base_1.Event("attributeValue", ev.params[1]));
            });
            return ret_1;
        }
        return new base_1.EventSet();
    };
    AttributeWalker.prototype.possible = function () {
        // _possible always return new sets.
        return this._possible();
    };
    AttributeWalker.prototype.fireEvent = function (ev) {
        if (this.suppressedAttributes || this.neutralized) {
            return undefined;
        }
        if ((ev.params[0] === "neutralizeAttribute") &&
            this.el.name.toString() === ev.params[1].toString()) {
            this.neutralized = true;
            return false;
        }
        if (this.seenName) {
            if (!this.seenValue && ev.params[0] === "attributeValue") {
                this.seenValue = true;
                if (this.subwalker === undefined) {
                    this.subwalker = this.el.pat.newWalker(this.nameResolver);
                }
                // Convert the attributeValue event to a text event.
                var textEv = new base_1.Event("text", ev.params[1]);
                var ret = this.subwalker.fireEvent(textEv);
                if (ret === undefined) {
                    return [new errors_1.AttributeValueError("invalid attribute value", this.el.name)];
                }
                // Attributes end immediately.
                if (ret === false) {
                    ret = this.subwalker.end();
                }
                return ret;
            }
        }
        else if (ev.params[0] === "attributeName" &&
            this.el.name.match(ev.params[1], ev.params[2])) {
            this.seenName = true;
            return false;
        }
        return undefined;
    };
    AttributeWalker.prototype._suppressAttributes = function () {
        this.suppressedAttributes = true;
    };
    AttributeWalker.prototype.canEnd = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        return this.seenValue || this.neutralized;
    };
    AttributeWalker.prototype.end = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        if (this.neutralized) {
            return false;
        }
        if (!this.seenName) {
            return [new errors_1.AttributeNameError("attribute missing", this.el.name)];
        }
        else if (!this.seenValue) {
            return [new errors_1.AttributeValueError("attribute value missing", this.el.name)];
        }
        return false;
    };
    return AttributeWalker;
}(base_1.Walker));
base_1.addWalker(Attribute, AttributeWalker);
//  LocalWords:  RNG's MPL RNG attributeName attributeValue ev params
//  LocalWords:  neutralizeAttribute

//# sourceMappingURL=attribute.js.map


/***/ }),
/* 19 */
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
 * Pattern and walker for RNG's ``choice`` elements.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var errors_1 = __webpack_require__(1);
var base_1 = __webpack_require__(0);
/**
 * A pattern for ``<choice>``.
 */
var Choice = (function (_super) {
    __extends(Choice, _super);
    function Choice() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Choice;
}(base_1.TwoSubpatterns));
exports.Choice = Choice;
/**
 * Walker for [[Choice]].
 */
var ChoiceWalker = (function (_super) {
    __extends(ChoiceWalker, _super);
    function ChoiceWalker(elOrWalker, nameResolverOrMemo) {
        var _this = this;
        if (elOrWalker instanceof ChoiceWalker) {
            var walker = elOrWalker;
            var memo = base_1.isHashMap(nameResolverOrMemo);
            _this = _super.call(this, walker, memo) || this;
            _this.nameResolver = _this._cloneIfNeeded(walker.nameResolver, memo);
            _this.chosen = walker.chosen;
            _this.walkerA = walker.walkerA !== undefined ?
                walker.walkerA._clone(memo) : undefined;
            _this.walkerB = walker.walkerB !== undefined ?
                walker.walkerB._clone(memo) : undefined;
            _this.instantiatedWalkers = walker.instantiatedWalkers;
        }
        else {
            var el = elOrWalker;
            var nameResolver = base_1.isNameResolver(nameResolverOrMemo);
            _this = _super.call(this, el) || this;
            _this.nameResolver = nameResolver;
            _this.chosen = false;
            _this.instantiatedWalkers = false;
        }
        return _this;
    }
    ChoiceWalker.prototype._possible = function () {
        this._instantiateWalkers();
        if (this.possibleCached !== undefined) {
            return this.possibleCached;
        }
        this.possibleCached = this.walkerA !== undefined ?
            this.walkerA._possible() : undefined;
        if (this.walkerB !== undefined) {
            this.possibleCached = new base_1.EventSet(this.possibleCached);
            var possibleB = this.walkerB._possible();
            this.possibleCached.union(possibleB);
        }
        else if (this.possibleCached === undefined) {
            this.possibleCached = new base_1.EventSet();
        }
        return this.possibleCached;
    };
    ChoiceWalker.prototype.fireEvent = function (ev) {
        this._instantiateWalkers();
        this.possibleCached = undefined;
        // We purposely do not normalize this.walker_{a,b} to a boolean value
        // because we do want `undefined` to be the result if the walkers are
        // undefined.
        var retA = this.walkerA !== undefined ?
            this.walkerA.fireEvent(ev) : undefined;
        var retB = this.walkerB !== undefined ?
            this.walkerB.fireEvent(ev) : undefined;
        if (retA !== undefined) {
            this.chosen = true;
            if (retB === undefined) {
                this.walkerB = undefined;
                return retA;
            }
            return retA;
        }
        if (retB !== undefined) {
            this.chosen = true;
            // We do not need to test if retA is undefined because we would not get
            // here if it were not.
            this.walkerA = undefined;
            return retB;
        }
        return undefined;
    };
    ChoiceWalker.prototype._suppressAttributes = function () {
        this._instantiateWalkers();
        if (!this.suppressedAttributes) {
            this.possibleCached = undefined; // no longer valid
            this.suppressedAttributes = true;
            if (this.walkerA !== undefined) {
                this.walkerA._suppressAttributes();
            }
            if (this.walkerB !== undefined) {
                this.walkerB._suppressAttributes();
            }
        }
    };
    ChoiceWalker.prototype.canEnd = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        this._instantiateWalkers();
        var retA = false;
        var retB = false;
        if (attribute) {
            retA = !this.el.patA._hasAttrs();
            retB = !this.el.patB._hasAttrs();
        }
        retA = retA || (this.walkerA !== undefined &&
            this.walkerA.canEnd(attribute));
        retB = retB || (this.walkerB !== undefined &&
            this.walkerB.canEnd(attribute));
        // ChoiceWalker can end if any walker can end. The assignments earlier
        // ensure that the logic works.
        return retA || retB;
    };
    ChoiceWalker.prototype.end = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        this._instantiateWalkers();
        if (this.canEnd(attribute)) {
            return false;
        }
        var retA = this.walkerA !== undefined &&
            this.walkerA.end(attribute);
        var retB = this.walkerB !== undefined &&
            this.walkerB.end(attribute);
        if (!retA && !retB) {
            return false;
        }
        if (retA && !retB) {
            return retA;
        }
        if (!retA && retB) {
            return retB;
        }
        // If we are here both walkers exist and returned an error.
        var namesA = [];
        var namesB = [];
        var notAChoiceError = false;
        // tslint:disable-next-line:no-non-null-assertion
        this.walkerA.possible().forEach(function (ev) {
            if (ev.params[0] === "enterStartTag") {
                namesA.push(ev.params[1]);
            }
            else {
                notAChoiceError = true;
            }
        });
        // The as boolean casts are necessary due to a flaw in the type inference
        // done by TS. Without the cast, TS thinks notAChoiceError is necessarily
        // false here and tslint issues a warning.
        if (!notAChoiceError) {
            // tslint:disable-next-line:no-non-null-assertion
            this.walkerB.possible().forEach(function (ev) {
                if (ev.params[0] === "enterStartTag") {
                    namesB.push(ev.params[1]);
                }
                else {
                    notAChoiceError = true;
                }
            });
            if (!notAChoiceError) {
                return [new errors_1.ChoiceError(namesA, namesB)];
            }
        }
        // If we get here, we were not able to raise a ChoiceError, possibly
        // because there was not enough information to decide among the two
        // walkers. Return whatever error comes first.
        return retA || retB;
    };
    /**
     * Creates walkers for the patterns contained by this one. Calling this method
     * multiple times is safe as the walkers are created once and only once.
     */
    ChoiceWalker.prototype._instantiateWalkers = function () {
        if (!this.instantiatedWalkers) {
            this.instantiatedWalkers = true;
            this.walkerA = this.el.patA.newWalker(this.nameResolver);
            this.walkerB = this.el.patB.newWalker(this.nameResolver);
        }
    };
    return ChoiceWalker;
}(base_1.Walker));
base_1.addWalker(Choice, ChoiceWalker);
//  LocalWords:  RNG's MPL retA ChoiceWalker enterStartTag notAChoiceError
//  LocalWords:  tslint ChoiceError

//# sourceMappingURL=choice.js.map


/***/ }),
/* 20 */
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
 * Pattern and walker for RNG's ``data`` elements.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var datatypes_1 = __webpack_require__(10);
var errors_1 = __webpack_require__(1);
var base_1 = __webpack_require__(0);
/**
 * Data pattern.
 */
var Data = (function (_super) {
    __extends(Data, _super);
    /**
     *
     * @param xmlPath This is a string which uniquely identifies the
     * element from the simplified RNG tree. Used in debugging.
     *
     * @param type The type of value.
     *
     * @param datatypeLibrary The URI of the datatype library to use.
     *
     * @param params The parameters from the RNG file.
     *
     * @param except The exception pattern.
     */
    // tslint:disable-next-line: no-reserved-keywords
    function Data(xmlPath, type, datatypeLibrary, params, except) {
        if (type === void 0) { type = "token"; }
        if (datatypeLibrary === void 0) { datatypeLibrary = ""; }
        var _this = _super.call(this, xmlPath) || this;
        _this.type = type;
        _this.datatypeLibrary = datatypeLibrary;
        _this.except = except;
        _this.datatype = datatypes_1.registry.get(_this.datatypeLibrary).types[_this.type];
        if (_this.datatype === undefined) {
            throw new Error("unknown type: " + type);
        }
        _this.rngParams = params !== undefined ? params : [];
        return _this;
    }
    Object.defineProperty(Data.prototype, "params", {
        get: function () {
            var ret = this._params;
            if (ret != null) {
                return ret;
            }
            ret = this._params = this.datatype.parseParams(this.xmlPath, this.rngParams);
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    return Data;
}(base_1.Pattern));
exports.Data = Data;
/**
 * Walker for [[Data]].
 */
var DataWalker = (function (_super) {
    __extends(DataWalker, _super);
    function DataWalker(elOrWalker, nameResolverOrMemo) {
        var _this = this;
        if (elOrWalker instanceof DataWalker) {
            var walker = elOrWalker;
            var memo = base_1.isHashMap(nameResolverOrMemo);
            _this = _super.call(this, walker, memo) || this;
            _this.nameResolver = _this._cloneIfNeeded(walker.nameResolver, memo);
            _this.context = walker.context !== undefined ?
                { resolver: _this.nameResolver } : undefined;
            _this.matched = walker.matched;
        }
        else {
            var el = elOrWalker;
            var nameResolver = base_1.isNameResolver(nameResolverOrMemo, "as 2nd argument");
            _this = _super.call(this, el) || this;
            _this.nameResolver = nameResolver;
            // We completely ignore the possible exception when producing the
            // possibilities. There is no clean way to specify such an exception.
            _this.possibleCached = new base_1.EventSet(new base_1.Event("text", _this.el.datatype.regexp));
            _this.context = el.datatype.needsContext ?
                { resolver: _this.nameResolver } : undefined;
            _this.matched = false;
        }
        return _this;
    }
    DataWalker.prototype._possible = function () {
        // possibleCached is necessarily defined because of the constructor's
        // logic.
        // tslint:disable-next-line:no-non-null-assertion
        return this.possibleCached;
    };
    DataWalker.prototype.fireEvent = function (ev) {
        if (this.matched) {
            return undefined;
        }
        if (ev.params[0] !== "text") {
            return undefined;
        }
        if (this.el.datatype.disallows(ev.params[1], this.el.params, this.context)) {
            return undefined;
        }
        if (this.el.except !== undefined) {
            var walker = this.el.except.newWalker(this.nameResolver);
            var exceptRet = walker.fireEvent(ev);
            // False, so the except does match the text, and so this pattern does
            // not match it.
            if (exceptRet === false) {
                return undefined;
            }
            // Otherwise, it is undefined, in which case it means the except does
            // not match the text, and we are fine. Or it would be possible for the
            // walker to have returned an error but there is nothing we can do with
            // such errors here.
        }
        this.matched = true;
        this.possibleCached = new base_1.EventSet();
        return false;
    };
    DataWalker.prototype.canEnd = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        // If we matched, we are done. salve does not allow text that appears in
        // an XML element to be passed as two "text" events. So there is nothing
        // to come that could falsify the match. (If a client *does* pass
        // multiple text events one after the other, it is using salve
        // incorrectly.)
        if (this.matched) {
            return true;
        }
        // We have not matched anything. Therefore we have to check whether we
        // allow the empty string.
        if (this.el.except !== undefined) {
            var walker = this.el.except.newWalker(this.nameResolver);
            if (walker.canEnd()) {
                return false;
            }
        }
        return !this.el.datatype.disallows("", this.el.params, this.context);
    };
    DataWalker.prototype.end = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        if (this.canEnd(attribute)) {
            return false;
        }
        return [new errors_1.ValidationError("value required")];
    };
    DataWalker.prototype._suppressAttributes = function () {
        // No child attributes.
    };
    return DataWalker;
}(base_1.Walker));
base_1.addWalker(Data, DataWalker);
//  LocalWords:  RNG's MPL RNG nd possibleCached

//# sourceMappingURL=data.js.map


/***/ }),
/* 21 */
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
 * Pattern and walker for RNG's ``element`` elements.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var errors_1 = __webpack_require__(1);
var namePatterns = __webpack_require__(2);
var base_1 = __webpack_require__(0);
var not_allowed_1 = __webpack_require__(6);
/**
 * A pattern for elements.
 */
var Element = (function (_super) {
    __extends(Element, _super);
    /**
     * @param xmlPath This is a string which uniquely identifies the
     * element from the simplified RNG tree. Used in debugging.
     *
     * @param name The qualified name of the element.
     *
     * @param pat The pattern contained by this one.
     */
    function Element(xmlPath, name, pat) {
        var _this = _super.call(this, xmlPath, pat) || this;
        _this.name = name;
        return _this;
    }
    Element.prototype._prepare = function (namespaces) {
        this.name._recordNamespaces(namespaces);
        this.pat._prepare(namespaces);
    };
    // addWalker(Element, ElementWalker); Nope... see below..
    Element.prototype.newWalker = function (resolver) {
        if (this.pat instanceof not_allowed_1.NotAllowed) {
            return this.pat.newWalker(resolver);
        }
        // tslint:disable-next-line:no-use-before-declare
        return ElementWalker.makeWalker(this, resolver);
    };
    Element.prototype._hasAttrs = function () {
        return false;
    };
    Element.prototype._gatherElementDefinitions = function (memo) {
        var key = this.name.toString();
        if (memo[key] === undefined) {
            memo[key] = [this];
        }
        else {
            memo[key].push(this);
        }
    };
    return Element;
}(base_1.OneSubpattern));
exports.Element = Element;
/**
 *
 * Walker for [[Element]].
 */
var ElementWalker = (function (_super) {
    __extends(ElementWalker, _super);
    function ElementWalker(elOrWalker, nameResolverOrMemo) {
        var _this = this;
        if (elOrWalker instanceof ElementWalker) {
            var walker = elOrWalker;
            var memo = base_1.isHashMap(nameResolverOrMemo);
            _this = _super.call(this, walker, memo) || this;
            _this.nameResolver = _this._cloneIfNeeded(walker.nameResolver, memo);
            _this.seenName = walker.seenName;
            _this.endedStartTag = walker.endedStartTag;
            _this.closed = walker.closed;
            _this.walker = walker.walker !== undefined ? walker.walker._clone(memo) :
                undefined;
            // No cloning needed since these are immutable.
            _this.startTagEvent = walker.startTagEvent;
            _this.endTagEvent = walker.endTagEvent;
            _this.boundName = walker.boundName;
        }
        else {
            var el = elOrWalker;
            var nameResolver = base_1.isNameResolver(nameResolverOrMemo);
            _this = _super.call(this, el) || this;
            _this.nameResolver = nameResolver;
            _this.seenName = false;
            _this.endedStartTag = false;
            _this.closed = false;
            _this.startTagEvent = new base_1.Event("enterStartTag", el.name);
        }
        return _this;
    }
    ElementWalker.makeWalker = function (el, nameResolver) {
        return new ElementWalker(el, nameResolver);
    };
    ElementWalker.prototype._possible = function () {
        if (!this.seenName) {
            return new base_1.EventSet(this.startTagEvent);
        }
        else if (!this.endedStartTag) {
            // If we have seen the name, then there is necessarily a walker.
            // tslint:disable-next-line:no-non-null-assertion
            var walker = this.walker;
            var all = walker._possible();
            var ret_1 = new base_1.EventSet();
            // We use valueEvs to record whether an attributeValue is a
            // possibility. If so, we must only return these possibilities and no
            // other.
            var valueEvs_1 = new base_1.EventSet();
            all.forEach(function (poss) {
                if (poss.params[0] === "attributeValue") {
                    valueEvs_1.add(poss);
                }
                else if (poss.isAttributeEvent()) {
                    ret_1.add(poss);
                }
            });
            if (valueEvs_1.size() !== 0) {
                ret_1 = valueEvs_1;
            }
            else if (walker.canEnd(true)) {
                ret_1.add(ElementWalker._leaveStartTagEvent);
            }
            return ret_1;
        }
        else if (!this.closed) {
            // If we have seen the name, then there is necessarily a walker.
            // tslint:disable-next-line:no-non-null-assertion
            var walker = this.walker;
            var posses = new base_1.EventSet(walker._possible());
            if (walker.canEnd()) {
                posses.add(this.endTagEvent);
            }
            return posses;
        }
        return new base_1.EventSet();
    };
    // _possible always returns new sets
    ElementWalker.prototype.possible = function () {
        return this._possible();
    };
    ElementWalker.prototype.fireEvent = function (ev) {
        if (!this.endedStartTag) {
            if (!this.seenName) {
                if (ev.params[0] === "enterStartTag" &&
                    this.el.name.match(ev.params[1], ev.params[2])) {
                    this.walker = this.el.pat.newWalker(this.nameResolver);
                    this.seenName = true;
                    this.boundName = new namePatterns.Name("", ev.params[1], ev.params[2]);
                    this.endTagEvent = new base_1.Event("endTag", this.boundName);
                    return false;
                }
            }
            else if (ev.params[0] === "leaveStartTag") {
                this.endedStartTag = true;
                // If we have seen the name, then there is necessarily a walker.
                // tslint:disable-next-line:no-non-null-assertion
                var walker = this.walker;
                var errs = walker.end(true);
                var ret = [];
                if (errs) {
                    for (var _i = 0, errs_1 = errs; _i < errs_1.length; _i++) {
                        var err = errs_1[_i];
                        if (err instanceof errors_1.AttributeValueError ||
                            err instanceof errors_1.AttributeNameError) {
                            ret.push(err);
                        }
                        if (err instanceof errors_1.AttributeNameError) {
                            // We generate an internal event designed to neutralize the
                            // attributes that errored.
                            walker.fireEvent(new base_1.Event(["neutralizeAttribute", err.name]));
                        }
                    }
                }
                // And suppress the attributes.
                walker._suppressAttributes();
                return ret.length !== 0 ? ret : false;
            }
            return this.walker !== undefined ? this.walker.fireEvent(ev) : undefined;
        }
        else if (!this.closed) {
            // If we have ended the start tag, then there is necessarily a walker.
            // tslint:disable-next-line:no-non-null-assertion
            var walker = this.walker;
            var ret = walker.fireEvent(ev);
            if (ret === undefined) {
                // Our subwalker did not handle the event, so we must do it here.
                if (ev.params[0] === "endTag") {
                    // boundName is necessarily defined by the time we get here.
                    // tslint:disable-next-line:no-non-null-assertion
                    if (this.boundName.match(ev.params[1], ev.params[2])) {
                        this.closed = true;
                        var errs = walker.end();
                        ret = [];
                        // Strip out the attributes errors as we've already reported
                        // them.
                        if (errs) {
                            for (var _a = 0, errs_2 = errs; _a < errs_2.length; _a++) {
                                var err = errs_2[_a];
                                if (!(err instanceof errors_1.AttributeValueError ||
                                    err instanceof errors_1.AttributeNameError)) {
                                    ret.push(err);
                                }
                            }
                        }
                        return ret.length !== 0 ? ret : false;
                    }
                }
                else if (ev.params[0] === "leaveStartTag") {
                    return [new errors_1.ValidationError("unexpected leaveStartTag event; it is likely that " +
                            "fireEvent is incorrectly called")];
                }
            }
            return ret;
        }
        return undefined;
    };
    ElementWalker.prototype._suppressAttributes = function () {
        // _suppressAttributes does not cross element boundary
        return;
    };
    ElementWalker.prototype.canEnd = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        if (attribute) {
            return true;
        }
        return this.closed;
    };
    ElementWalker.prototype.end = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        if (attribute) {
            return false;
        }
        var ret = [];
        if (!this.seenName) {
            ret.push(new errors_1.ElementNameError("tag required", this.el.name));
        }
        else if (!this.endedStartTag || !this.closed) {
            if (this.walker !== undefined) {
                var errs = this.walker.end();
                if (errs) {
                    ret = errs;
                }
            }
            ret.push(this.endedStartTag ?
                new errors_1.ElementNameError("tag not closed", this.el.name) :
                new errors_1.ElementNameError("start tag not terminated", this.el.name));
        }
        if (ret.length > 0) {
            return ret;
        }
        return false;
    };
    ElementWalker._leaveStartTagEvent = new base_1.Event("leaveStartTag");
    return ElementWalker;
}(base_1.Walker));
//  LocalWords:  RNG's MPL RNG addWalker ElementWalker leaveStartTag valueEvs
//  LocalWords:  enterStartTag attributeValue endTag errored subwalker
//  LocalWords:  neutralizeAttribute boundName fireEvent suppressAttributes

//# sourceMappingURL=element.js.map


/***/ }),
/* 22 */
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
var base_1 = __webpack_require__(0);
/**
 * Pattern for ``<empty/>``.
 */
var Empty = (function (_super) {
    __extends(Empty, _super);
    function Empty() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Empty;
}(base_1.Pattern));
exports.Empty = Empty;
/**
 * Walker for [[Empty]].
 *
 * @param el The pattern for which this walker was created.
 *
 * @param resolver Ignored by this walker.
 */
var EmptyWalker = (function (_super) {
    __extends(EmptyWalker, _super);
    function EmptyWalker(elOrWalker, memo) {
        var _this = this;
        if (elOrWalker instanceof EmptyWalker) {
            memo = base_1.isHashMap(memo);
            _this = _super.call(this, elOrWalker, memo) || this;
        }
        else {
            _this = _super.call(this, elOrWalker) || this;
            _this.possibleCached = new base_1.EventSet();
        }
        return _this;
    }
    EmptyWalker.prototype.possible = function () {
        // Save some time by avoiding calling _possible. We always want to return a
        // new object here.
        return new base_1.EventSet();
    };
    EmptyWalker.prototype._possible = function () {
        // possibleCached is necessarily defined because of the constructor's
        // logic.
        // tslint:disable-next-line:no-non-null-assertion
        return this.possibleCached;
    };
    EmptyWalker.prototype.fireEvent = function (ev) {
        if ((ev === base_1.emptyEvent) ||
            ((ev.params[0] === "text") &&
                (ev.params[1].trim() === ""))) {
            return false;
        }
        return undefined;
    };
    return EmptyWalker;
}(base_1.Walker));
exports.EmptyWalker = EmptyWalker;
base_1.addWalker(Empty, EmptyWalker);
//  LocalWords:  RNG's MPL possibleCached

//# sourceMappingURL=empty.js.map


/***/ }),
/* 23 */
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
 * Pattern and walker for RNG's ``group`` elements.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var errors_1 = __webpack_require__(1);
var base_1 = __webpack_require__(0);
/**
 * A pattern for ``<group>``.
 */
var Group = (function (_super) {
    __extends(Group, _super);
    function Group() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Group;
}(base_1.TwoSubpatterns));
exports.Group = Group;
/**
 * Walker for [[Group]].
 */
var GroupWalker = (function (_super) {
    __extends(GroupWalker, _super);
    function GroupWalker(elOrWalker, nameResolverOrMemo) {
        var _this = this;
        if (elOrWalker instanceof GroupWalker) {
            var walker = elOrWalker;
            var memo = base_1.isHashMap(nameResolverOrMemo);
            _this = _super.call(this, walker, memo) || this;
            _this.nameResolver = _this._cloneIfNeeded(walker.nameResolver, memo);
            _this.hitA = walker.hitA;
            _this.endedA = walker.endedA;
            _this.hitB = walker.hitB;
            _this.walkerA = walker.walkerA !== undefined ?
                walker.walkerA._clone(memo) : undefined;
            _this.walkerB = walker.walkerB !== undefined ?
                walker.walkerB._clone(memo) : undefined;
        }
        else {
            var el = elOrWalker;
            var nameResolver = base_1.isNameResolver(nameResolverOrMemo);
            _this = _super.call(this, el) || this;
            _this.nameResolver = nameResolver;
            _this.hitA = false;
            _this.endedA = false;
            _this.hitB = false;
        }
        return _this;
    }
    GroupWalker.prototype._possible = function () {
        this._instantiateWalkers();
        if (this.possibleCached !== undefined) {
            return this.possibleCached;
        }
        // Both walkers are necessarily defined because of the call to
        // _instantiateWalkers.
        //
        // tslint:disable:no-non-null-assertion
        var walkerA = this.walkerA;
        var walkerB = this.walkerB;
        // tslint:enable:no-non-null-assertion
        this.possibleCached = (!this.endedA) ? walkerA._possible() : undefined;
        if (this.suppressedAttributes) {
            // If we are in the midst of processing walker a and it cannot end yet,
            // then we do not want to see anything from b.
            if (this.endedA || walkerA.canEnd()) {
                this.possibleCached = new base_1.EventSet(this.possibleCached);
                this.possibleCached.union(walkerB._possible());
            }
        }
        else {
            var possibleB = walkerB._possible();
            // Attribute events are still possible event if the first walker is not
            // done with.
            if ((!this.endedA || this.hitB) && !walkerA.canEnd()) {
                // Narrow it down to attribute events...
                possibleB = possibleB.filter(function (x) { return x.isAttributeEvent(); });
            }
            this.possibleCached = new base_1.EventSet(this.possibleCached);
            this.possibleCached.union(possibleB);
        }
        // Necessarily defined once we get here.
        // tslint:disable-next-line:no-non-null-assertion
        return this.possibleCached;
    };
    GroupWalker.prototype.fireEvent = function (ev) {
        this._instantiateWalkers();
        // Both walkers are necessarily defined because of the call to
        // _instantiateWalkers.
        //
        // tslint:disable:no-non-null-assertion
        var walkerA = this.walkerA;
        var walkerB = this.walkerB;
        // tslint:enable:no-non-null-assertion
        this.possibleCached = undefined;
        if (!this.endedA) {
            var retA = walkerA.fireEvent(ev);
            if (retA !== undefined) {
                this.hitA = true;
                return retA;
            }
            // We must return right away if walkerA cannot yet end. Only attribute
            // events are allowed to move forward.
            if (!ev.isAttributeEvent() && !walkerA.canEnd()) {
                return undefined;
            }
        }
        var retB = walkerB.fireEvent(ev);
        if (retB !== undefined) {
            this.hitB = true;
        }
        // Non-attribute event: if walker b matched the event then we must end
        // walkerA, if we've not already done so.
        if (!ev.isAttributeEvent() && retB !== undefined && !this.endedA) {
            var endRet = walkerA.end();
            this.endedA = true;
            // Combine the possible errors.
            if (!retB) {
                // retB must be false, because retB === undefined has been
                // eliminated above; toss it.
                retB = endRet;
            }
            else if (endRet) {
                retB = retB.concat(endRet);
            }
        }
        return retB;
    };
    GroupWalker.prototype._suppressAttributes = function () {
        this._instantiateWalkers();
        if (!this.suppressedAttributes) {
            this.possibleCached = undefined; // no longer valid
            this.suppressedAttributes = true;
            // Both walkers are necessarily defined because of the call to
            // _instantiateWalkers.
            //
            // tslint:disable:no-non-null-assertion
            this.walkerA._suppressAttributes();
            this.walkerB._suppressAttributes();
            // tslint:enable:no-non-null-assertion
        }
    };
    GroupWalker.prototype.canEnd = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        this._instantiateWalkers();
        // Both walkers are necessarily defined because of the call to
        // _instantiateWalkers.
        //
        // tslint:disable:no-non-null-assertion
        var walkerA = this.walkerA;
        var walkerB = this.walkerB;
        // tslint:enable:no-non-null-assertion
        if (attribute) {
            var aHas = this.el.patA._hasAttrs();
            var bHas = this.el.patB._hasAttrs();
            if (aHas && bHas) {
                return walkerA.canEnd(attribute) && walkerB.canEnd(attribute);
            }
            else if (aHas) {
                return walkerA.canEnd(true);
            }
            else if (bHas) {
                return walkerB.canEnd(true);
            }
            return true;
        }
        return walkerA.canEnd(attribute) && walkerB.canEnd(attribute);
    };
    GroupWalker.prototype.end = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        if (this.canEnd(attribute)) {
            return false;
        }
        var ret;
        // Both walkers are necessarily defined because of the call to canEnd.
        //
        // tslint:disable:no-non-null-assertion
        var walkerA = this.walkerA;
        var walkerB = this.walkerB;
        // tslint:enable:no-non-null-assertion
        if (attribute) {
            var aHas = this.el.patA._hasAttrs();
            var bHas = this.el.patB._hasAttrs();
            if (aHas) {
                // This should not happen. this.endedA is to become true when we run
                // into a non-attribute event that matches. This can happen only once we
                // have deal with all attributes.
                if (this.endedA) {
                    throw new Error("invalid state: endedA is true but we are processing attributes");
                }
                ret = walkerA.end(true);
                if (bHas) {
                    var endB = walkerB.end(true);
                    if (endB) {
                        ret = ret ? ret.concat(endB) : endB;
                    }
                }
                return ret;
            }
            if (bHas) {
                return walkerB.end(true);
            }
            return false;
        }
        var retA = false;
        // Don't end it more than once.
        if (!this.endedA) {
            retA = walkerA.end(false);
            // If we get here and the only errors we get are attribute errors,
            // we must move on to check the second walker too.
            if (retA) {
                for (var _i = 0, retA_1 = retA; _i < retA_1.length; _i++) {
                    var err = retA_1[_i];
                    if (!(err instanceof errors_1.AttributeValueError ||
                        err instanceof errors_1.AttributeNameError)) {
                        // We ran into a non-attribute error. We can stop here.
                        return retA;
                    }
                }
            }
        }
        var retB = walkerB.end(false);
        if (retB) {
            if (!retA) {
                return retB;
            }
            else {
                return retA.concat(retB);
            }
        }
        return retA;
    };
    /**
     * Creates walkers for the patterns contained by this one. Calling this
     * method multiple times is safe as the walkers are created once and only
     * once.
     */
    GroupWalker.prototype._instantiateWalkers = function () {
        if (this.walkerA === undefined) {
            this.walkerA = this.el.patA.newWalker(this.nameResolver);
            this.walkerB = this.el.patB.newWalker(this.nameResolver);
        }
    };
    return GroupWalker;
}(base_1.Walker));
base_1.addWalker(Group, GroupWalker);
//  LocalWords:  RNG's MPL instantiateWalkers walkerA retB canEnd endedA

//# sourceMappingURL=group.js.map


/***/ }),
/* 24 */
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
var base_1 = __webpack_require__(0);
/**
 * A pattern for ``<interleave>``.
 */
var Interleave = (function (_super) {
    __extends(Interleave, _super);
    function Interleave() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Interleave;
}(base_1.TwoSubpatterns));
exports.Interleave = Interleave;
/**
 * Walker for [[Interleave]].
 */
var InterleaveWalker = (function (_super) {
    __extends(InterleaveWalker, _super);
    function InterleaveWalker(elOrWalker, nameResolverOrMemo) {
        var _this = this;
        if (elOrWalker instanceof InterleaveWalker) {
            var walker = elOrWalker;
            var memo = base_1.isHashMap(nameResolverOrMemo);
            _this = _super.call(this, walker, memo) || this;
            _this.nameResolver = _this._cloneIfNeeded(walker.nameResolver, memo);
            _this.inA = walker.inA;
            _this.inB = walker.inB;
            _this.walkerA = walker.walkerA !== undefined ?
                walker.walkerA._clone(memo) : undefined;
            _this.walkerB = walker.walkerB !== undefined ?
                walker.walkerB._clone(memo) : undefined;
        }
        else {
            var el = elOrWalker;
            var nameResolver = base_1.isNameResolver(nameResolverOrMemo);
            _this = _super.call(this, el) || this;
            _this.nameResolver = nameResolver;
            _this.inA = false;
            _this.inB = false;
        }
        return _this;
    }
    InterleaveWalker.prototype._possible = function () {
        this._instantiateWalkers();
        if (this.possibleCached !== undefined) {
            return this.possibleCached;
        }
        if (this.inA && this.inB) {
            // It due to the restrictions imposed by Relax NG, it should not be
            // possible to be both inA and inB.
            throw new Error("impossible state");
        }
        // Both walkers are necessarily defined because of the call to
        // _instantiateWalkers.
        //
        // tslint:disable:no-non-null-assertion
        var walkerA = this.walkerA;
        var walkerB = this.walkerB;
        // tslint:enable:no-non-null-assertion
        if (this.inA && !walkerA.canEnd()) {
            this.possibleCached = walkerA._possible();
        }
        else if (this.inB && !walkerB.canEnd()) {
            this.possibleCached = walkerB._possible();
        }
        if (this.possibleCached === undefined) {
            this.possibleCached = walkerA.possible();
            this.possibleCached.union(walkerB._possible());
        }
        return this.possibleCached;
    };
    InterleaveWalker.prototype.fireEvent = function (ev) {
        this._instantiateWalkers();
        this.possibleCached = undefined;
        if (this.inA && this.inB) {
            // It due to the restrictions imposed by Relax NG, it should not be
            // possible to be both inA and inB.
            throw new Error("impossible state");
        }
        // Both walkers are necessarily defined because of the call to
        // _instantiateWalkers.
        //
        // tslint:disable:no-non-null-assertion
        var walkerA = this.walkerA;
        var walkerB = this.walkerB;
        // tslint:enable:no-non-null-assertion
        var retA;
        var retB;
        if (!this.inA && !this.inB) {
            retA = walkerA.fireEvent(ev);
            if (retA === false) {
                this.inA = true;
                return false;
            }
            // The constraints on interleave do not allow for two child patterns of
            // interleave to match. So if the first walker matched, the second
            // cannot. So we don't have to fireEvent on the second walker if the first
            // matched.
            retB = walkerB.fireEvent(ev);
            if (retB === false) {
                this.inB = true;
                return false;
            }
            if (retB === undefined) {
                return retA;
            }
            if (retA === undefined) {
                return retB;
            }
            return retA.concat(retB);
        }
        else if (this.inA) {
            retA = walkerA.fireEvent(ev);
            if (retA instanceof Array || retA === false) {
                return retA;
            }
            // If we got here, retA === undefined
            retB = walkerB.fireEvent(ev);
            if (retB === false) {
                this.inA = false;
                this.inB = true;
                return false;
            }
        }
        else {
            retB = walkerB.fireEvent(ev);
            if (retB instanceof Array || retB === false) {
                return retB;
            }
            // If we got here, retB === undefined
            retA = walkerA.fireEvent(ev);
            if (retA === false) {
                this.inA = true;
                this.inB = false;
                return false;
            }
        }
        return undefined;
    };
    InterleaveWalker.prototype._suppressAttributes = function () {
        this._instantiateWalkers();
        if (!this.suppressedAttributes) {
            this.possibleCached = undefined; // no longer valid
            this.suppressedAttributes = true;
            // Both walkers are necessarily defined because of the call to
            // _instantiateWalkers.
            //
            // tslint:disable:no-non-null-assertion
            this.walkerA._suppressAttributes();
            this.walkerB._suppressAttributes();
            // tslint:enable:no-non-null-assertion
        }
    };
    InterleaveWalker.prototype.canEnd = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        this._instantiateWalkers();
        // Both walkers are necessarily defined because of the call to
        // _instantiateWalkers.
        //
        // tslint:disable-next-line:no-non-null-assertion
        return this.walkerA.canEnd(attribute) && this.walkerB.canEnd(attribute);
    };
    InterleaveWalker.prototype.end = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        this._instantiateWalkers();
        // Both walkers are necessarily defined because of the call to
        // _instantiateWalkers.
        //
        // tslint:disable:no-non-null-assertion
        var retA = this.walkerA.end(attribute);
        var retB = this.walkerB.end(attribute);
        // tslint:enable:no-non-null-assertion
        if (retA && !retB) {
            return retA;
        }
        if (retB && !retA) {
            return retB;
        }
        if (retA && retB) {
            return retA.concat(retB);
        }
        return false;
    };
    /**
     * Creates walkers for the patterns contained by this one. Calling this method
     * multiple times is safe as the walkers are created once and only once.
     */
    InterleaveWalker.prototype._instantiateWalkers = function () {
        if (this.walkerA === undefined) {
            this.walkerA = this.el.patA.newWalker(this.nameResolver);
        }
        if (this.walkerB === undefined) {
            this.walkerB = this.el.patB.newWalker(this.nameResolver);
        }
    };
    return InterleaveWalker;
}(base_1.Walker));
base_1.addWalker(Interleave, InterleaveWalker);
//  LocalWords:  RNG's MPL NG inA inB instantiateWalkers fireEvent retA retB

//# sourceMappingURL=interleave.js.map


/***/ }),
/* 25 */
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
 * Pattern and walker for RNG's ``list`` elements.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var errors_1 = __webpack_require__(1);
var base_1 = __webpack_require__(0);
/**
 * List pattern.
 */
var List = (function (_super) {
    __extends(List, _super);
    function List() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return List;
}(base_1.OneSubpattern));
exports.List = List;
/**
 * Walker for [[List]].
 *
 */
var ListWalker = (function (_super) {
    __extends(ListWalker, _super);
    function ListWalker(elOrWalker, nameResolverOrMemo) {
        var _this = this;
        if (elOrWalker instanceof ListWalker) {
            var walker = elOrWalker;
            var memo = base_1.isHashMap(nameResolverOrMemo, "as 2nd argument");
            _this = _super.call(this, walker, memo) || this;
            _this.nameResolver = _this._cloneIfNeeded(walker.nameResolver, memo);
            _this.subwalker = walker.subwalker._clone(memo);
            _this.seenTokens = walker.seenTokens;
            _this.matched = walker.matched;
        }
        else {
            var el = elOrWalker;
            var nameResolver = base_1.isNameResolver(nameResolverOrMemo, "as 2nd argument");
            _this = _super.call(this, el) || this;
            _this.nameResolver = nameResolver;
            _this.subwalker = el.pat.newWalker(_this.nameResolver);
            _this.seenTokens = false;
            _this.matched = false;
        }
        return _this;
    }
    ListWalker.prototype.fireEvent = function (ev) {
        // Only these two types can match.
        if (ev.params[0] !== "text") {
            return undefined;
        }
        var trimmed = ev.params[1].trim();
        // The list walker cannot send empty strings to its children because it
        // validates a list of **tokens**.
        if (trimmed === "") {
            return false;
        }
        this.seenTokens = true;
        var tokens = trimmed.split(/\s+/);
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            var ret = this.subwalker.fireEvent(new base_1.Event(ev.params[0], token));
            if (ret !== false) {
                return ret;
            }
        }
        this.matched = true;
        return false;
    };
    ListWalker.prototype._suppressAttributes = function () {
        // Lists cannot contain attributes.
    };
    ListWalker.prototype.canEnd = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        if (!this.seenTokens) {
            return (this.subwalker.fireEvent(base_1.emptyEvent) === false);
        }
        return this.subwalker.canEnd(attribute);
    };
    ListWalker.prototype.end = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        var ret = this.subwalker.end(attribute);
        if (ret !== false) {
            return ret;
        }
        if (this.canEnd(attribute)) {
            return false;
        }
        return [new errors_1.ValidationError("unfulfilled list")];
    };
    return ListWalker;
}(base_1.SingleSubwalker));
base_1.addWalker(List, ListWalker);
//  LocalWords:  RNG's MPL nd

//# sourceMappingURL=list.js.map


/***/ }),
/* 26 */
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
var base_1 = __webpack_require__(0);
/**
 * A pattern for ``<oneOrMore>``.
 */
var OneOrMore = (function (_super) {
    __extends(OneOrMore, _super);
    function OneOrMore() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return OneOrMore;
}(base_1.OneSubpattern));
exports.OneOrMore = OneOrMore;
/**
 * Walker for [[OneOrMore]]
 */
var OneOrMoreWalker = (function (_super) {
    __extends(OneOrMoreWalker, _super);
    function OneOrMoreWalker(elOrWalker, nameResolverOrMemo) {
        var _this = this;
        if (elOrWalker instanceof OneOrMoreWalker) {
            var walker = elOrWalker;
            var memo = base_1.isHashMap(nameResolverOrMemo);
            _this = _super.call(this, walker, memo) || this;
            _this.seenOnce = walker.seenOnce;
            _this.nameResolver = _this._cloneIfNeeded(walker.nameResolver, memo);
            _this.currentIteration = walker.currentIteration !== undefined ?
                walker.currentIteration._clone(memo) : undefined;
            _this.nextIteration = walker.nextIteration !== undefined ?
                walker.nextIteration._clone(memo) : undefined;
        }
        else {
            var el = elOrWalker;
            var nameResolver = base_1.isNameResolver(nameResolverOrMemo);
            _this = _super.call(this, el) || this;
            _this.nameResolver = nameResolver;
            _this.seenOnce = false;
        }
        return _this;
    }
    OneOrMoreWalker.prototype._possible = function () {
        if (this.possibleCached !== undefined) {
            return this.possibleCached;
        }
        this._instantiateCurrentIteration();
        // currentIteration is necessarily defined here due to the previous call.
        // tslint:disable-next-line:no-non-null-assertion
        this.possibleCached = this.currentIteration._possible();
        // tslint:disable-next-line:no-non-null-assertion
        if (this.currentIteration.canEnd()) {
            this.possibleCached = new base_1.EventSet(this.possibleCached);
            this._instantiateNextIteration();
            // nextIteration is necessarily defined here due to the previous call.
            // tslint:disable-next-line:no-non-null-assertion
            var nextPossible = this.nextIteration._possible();
            this.possibleCached.union(nextPossible);
        }
        return this.possibleCached;
    };
    OneOrMoreWalker.prototype.fireEvent = function (ev) {
        this.possibleCached = undefined;
        this._instantiateCurrentIteration();
        // currentIteration is necessarily defined here due to the previous call.
        // tslint:disable-next-line:no-non-null-assertion
        var currentIteration = this.currentIteration;
        var ret = currentIteration.fireEvent(ev);
        if (ret === false) {
            this.seenOnce = true;
        }
        if (ret !== undefined) {
            return ret;
        }
        if (this.seenOnce && currentIteration.canEnd()) {
            ret = currentIteration.end();
            if (ret) {
                throw new Error("internal error; canEnd() returns true but end() fails");
            }
            this._instantiateNextIteration();
            // nextIteration is necessarily defined here due to the previous call.
            // tslint:disable-next-line:no-non-null-assertion
            var nextRet = this.nextIteration.fireEvent(ev);
            if (nextRet === false) {
                this.currentIteration = this.nextIteration;
                this.nextIteration = undefined;
            }
            return nextRet;
        }
        return undefined;
    };
    OneOrMoreWalker.prototype._suppressAttributes = function () {
        // A oneOrMore element can happen if we have the pattern ``(attribute * {
        // text })+`` for instance. Once converted to the simplified RNG, it
        // becomes:
        //
        // ``<oneOrMore><attribute><anyName/><rng:text/></attribute></oneOrMore>``
        //
        // An attribute in ``oneOrMore`` cannot happen when ``anyName`` is not used
        // because an attribute of any given name cannot be repeated.
        //
        this._instantiateCurrentIteration();
        if (!this.suppressedAttributes) {
            this.suppressedAttributes = true;
            this.possibleCached = undefined; // No longer valid.
            // currentIteration is necessarily defined here...
            // tslint:disable-next-line:no-non-null-assertion
            this.currentIteration._suppressAttributes();
            if (this.nextIteration !== undefined) {
                this.nextIteration._suppressAttributes();
            }
        }
    };
    OneOrMoreWalker.prototype.canEnd = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        if (attribute) {
            if (!this.el.pat._hasAttrs()) {
                return true;
            }
            this._instantiateCurrentIteration();
            // currentIteration is necessarily defined here due to the previous call.
            // tslint:disable-next-line:no-non-null-assertion
            return this.currentIteration.canEnd(true);
        }
        // currentIteration is necessarily defined here.
        // tslint:disable-next-line:no-non-null-assertion
        return this.seenOnce && this.currentIteration.canEnd();
    };
    OneOrMoreWalker.prototype.end = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        if (this.canEnd(attribute)) {
            return false;
        }
        // Undefined currentIteration can happen in rare cases.
        this._instantiateCurrentIteration();
        // currentIteration is necessarily defined here due to the previous call.
        // tslint:disable-next-line:no-non-null-assertion
        return this.currentIteration.end(attribute);
    };
    OneOrMoreWalker.prototype._instantiateCurrentIteration = function () {
        if (this.currentIteration === undefined) {
            this.currentIteration = this.el.pat.newWalker(this.nameResolver);
        }
    };
    OneOrMoreWalker.prototype._instantiateNextIteration = function () {
        if (this.nextIteration === undefined) {
            this.nextIteration = this.el.pat.newWalker(this.nameResolver);
            // Whereas _suppressAttributes calls _instantiateCurrentIteration() so
            // that currentIteration is always existing and its _suppressAttributes()
            // method is called before _suppressAttributes() returns, the same is not
            // true of nextIteration. So if we create it **after**
            // _suppressAttributes() was called we need to call _suppressAttributes()
            // on it.
            if (this.suppressedAttributes) {
                this.nextIteration._suppressAttributes();
            }
        }
    };
    return OneOrMoreWalker;
}(base_1.Walker));
base_1.addWalker(OneOrMore, OneOrMoreWalker);
//  LocalWords:  RNG's MPL currentIteration nextIteration canEnd oneOrMore rng
//  LocalWords:  anyName suppressAttributes instantiateCurrentIteration

//# sourceMappingURL=one_or_more.js.map


/***/ }),
/* 27 */
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
 * Pattern for RNG's ``param`` element.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var base_1 = __webpack_require__(0);
/**
 * This is a defunct pattern. During the processing of the RNG file all
 * ``param`` elements are converted into parameters to [["patterns/data".Data]]
 * so we never end up with a converted file that contains an instance of this
 * class.
 */
var Param = (function (_super) {
    __extends(Param, _super);
    function Param(xmlPath) {
        var _this = _super.call(this, xmlPath) || this;
        throw new Error("this pattern is a placeholder and should never actually " +
            "be used");
        return _this;
    }
    return Param;
}(base_1.Pattern));
exports.Param = Param;
//  LocalWords:  RNG's MPL

//# sourceMappingURL=param.js.map


/***/ }),
/* 28 */
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
var base_1 = __webpack_require__(0);
var not_allowed_1 = __webpack_require__(6);
/**
 * Pattern for ``<text/>``.
 */
var Text = (function (_super) {
    __extends(Text, _super);
    function Text() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Text;
}(base_1.Pattern));
exports.Text = Text;
/**
 *
 * Walker for [[Text]]
 *
 */
var TextWalker = (function (_super) {
    __extends(TextWalker, _super);
    function TextWalker(elOrWalker, memo) {
        var _this = this;
        if (elOrWalker instanceof not_allowed_1.NotAllowedWalker) {
            var walker = elOrWalker;
            memo = base_1.isHashMap(memo);
            _this = _super.call(this, walker, memo) || this;
        }
        else {
            _this = _super.call(this, elOrWalker) || this;
            _this.possibleCached = new base_1.EventSet(TextWalker._textEvent);
        }
        return _this;
    }
    TextWalker.prototype._possible = function () {
        // possibleCached is necessarily defined because of the constructor's
        // logic.
        // tslint:disable-next-line:no-non-null-assertion
        return this.possibleCached;
    };
    TextWalker.prototype.fireEvent = function (ev) {
        return (ev.params[0] === "text") ? false : undefined;
    };
    TextWalker._textEvent = new base_1.Event("text", /^.*$/);
    return TextWalker;
}(base_1.Walker));
base_1.addWalker(Text, TextWalker);
//  LocalWords:  RNG's MPL possibleCached

//# sourceMappingURL=text.js.map


/***/ }),
/* 29 */
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
 * Pattern and walker for RNG's ``list`` elements.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
var datatypes_1 = __webpack_require__(10);
var errors_1 = __webpack_require__(1);
var name_resolver_1 = __webpack_require__(3);
var base_1 = __webpack_require__(0);
/**
 * Value pattern.
 */
var Value = (function (_super) {
    __extends(Value, _super);
    /**
     * @param xmlPath This is a string which uniquely identifies the
     * element from the simplified RNG tree. Used in debugging.
     *
     * @param value The value expected in the document.
     *
     * @param type The type of value. ``undefined`` means
     * ``"token"``.
     *
     * @param datatypeLibrary The URI of the datatype library to
     * use. ``undefined`` means use the builtin library.
     *
     * @param ns The namespace in which to interpret the value.
     */
    // tslint:disable-next-line: no-reserved-keywords
    function Value(xmlPath, value, type, datatypeLibrary, ns) {
        if (type === void 0) { type = "token"; }
        if (datatypeLibrary === void 0) { datatypeLibrary = ""; }
        if (ns === void 0) { ns = ""; }
        var _this = _super.call(this, xmlPath) || this;
        _this.type = type;
        _this.datatypeLibrary = datatypeLibrary;
        _this.ns = ns;
        _this.datatype = datatypes_1.registry.get(_this.datatypeLibrary).types[_this.type];
        if (_this.datatype === undefined) {
            throw new Error("unknown type: " + type);
        }
        _this.rawValue = value;
        return _this;
    }
    Object.defineProperty(Value.prototype, "value", {
        get: function () {
            var ret = this._value;
            if (ret != null) {
                return ret;
            }
            // We construct a pseudo-context representing the context in the schema
            // file.
            var context;
            if (this.datatype.needsContext) {
                var nr = new name_resolver_1.NameResolver();
                nr.definePrefix("", this.ns);
                context = { resolver: nr };
            }
            ret = this._value = this.datatype.parseValue(this.rawValue, context);
            return ret;
        },
        enumerable: true,
        configurable: true
    });
    return Value;
}(base_1.Pattern));
exports.Value = Value;
/**
 * Walker for [[Value]].
 */
var ValueWalker = (function (_super) {
    __extends(ValueWalker, _super);
    function ValueWalker(elOrWalker, nameResolverOrMemo) {
        var _this = this;
        if (elOrWalker instanceof ValueWalker) {
            var walker = elOrWalker;
            var memo = base_1.isHashMap(nameResolverOrMemo, "as 2nd argument");
            _this = _super.call(this, walker, memo) || this;
            _this.nameResolver = _this._cloneIfNeeded(walker.nameResolver, memo);
            _this.context = walker.context !== undefined ?
                { resolver: _this.nameResolver } : undefined;
            _this.matched = walker.matched;
        }
        else {
            var el = elOrWalker;
            var nameResolver = base_1.isNameResolver(nameResolverOrMemo, "as 2nd argument");
            _this = _super.call(this, el) || this;
            _this.nameResolver = nameResolver;
            _this.possibleCached = new base_1.EventSet(new base_1.Event("text", el.rawValue));
            _this.context = el.datatype.needsContext ?
                { resolver: _this.nameResolver } : undefined;
            _this.matched = false;
        }
        return _this;
    }
    ValueWalker.prototype._possible = function () {
        // possibleCached is necessarily defined because of the constructor's
        // logic.
        // tslint:disable-next-line:no-non-null-assertion
        return this.possibleCached;
    };
    ValueWalker.prototype.fireEvent = function (ev) {
        if (this.matched) {
            return undefined;
        }
        if (ev.params[0] !== "text") {
            return undefined;
        }
        if (!this.el.datatype.equal(ev.params[1], this.el.value, this.context)) {
            return undefined;
        }
        this.matched = true;
        this.possibleCached = new base_1.EventSet();
        return false;
    };
    ValueWalker.prototype.canEnd = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        return this.matched || this.el.rawValue === "";
    };
    ValueWalker.prototype.end = function (attribute) {
        if (attribute === void 0) { attribute = false; }
        if (this.canEnd(attribute)) {
            return false;
        }
        return [new errors_1.ValidationError("value required: " + this.el.rawValue)];
    };
    ValueWalker.prototype._suppressAttributes = function () {
        // No child attributes.
    };
    return ValueWalker;
}(base_1.Walker));
base_1.addWalker(Value, ValueWalker);
//  LocalWords:  RNG's MPL RNG nd possibleCached

//# sourceMappingURL=value.js.map


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * A mock implementation of Node's util package. This module implements only
 * what is actually used in salve.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A mock of Node's ``util.inspect``.
 */
function inspect(x) {
    if (x === undefined) {
        return "undefined";
    }
    if (x === null) {
        return "null";
    }
    return x.toString();
}
exports.inspect = inspect;
//  LocalWords:  Mangalam MPL Dubeau util

//# sourceMappingURL=util.js.map


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * RNG-based validator.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.version = "4.3.0";
var patterns_1 = __webpack_require__(9);
exports.eventsToTreeString = patterns_1.eventsToTreeString;
exports.Event = patterns_1.Event;
exports.EventSet = patterns_1.EventSet;
exports.Grammar = patterns_1.Grammar;
exports.GrammarWalker = patterns_1.GrammarWalker;
exports.BasePattern = patterns_1.BasePattern;
exports.RefError = patterns_1.RefError;
exports.Walker = patterns_1.Walker;
exports.__test = patterns_1.__test;
var formats_1 = __webpack_require__(14);
exports.constructTree = formats_1.constructTree;
var ename_1 = __webpack_require__(4);
exports.EName = ename_1.EName;
var errors_1 = __webpack_require__(1);
exports.AttributeNameError = errors_1.AttributeNameError;
exports.AttributeValueError = errors_1.AttributeValueError;
exports.ChoiceError = errors_1.ChoiceError;
exports.ElementNameError = errors_1.ElementNameError;
exports.ValidationError = errors_1.ValidationError;
var name_resolver_1 = __webpack_require__(3);
exports.NameResolver = name_resolver_1.NameResolver;
var name_patterns_1 = __webpack_require__(2);
exports.BaseName = name_patterns_1.Base;
exports.Name = name_patterns_1.Name;
exports.NameChoice = name_patterns_1.NameChoice;
exports.NsName = name_patterns_1.NsName;
exports.AnyName = name_patterns_1.AnyName;
/**
 * Do not use this. This is here only for historical reasons and may be yanked
 * at any time.
 * @private
 */
var hashstructs_1 = __webpack_require__(8);
exports.HashMap = hashstructs_1.HashMap;
//  LocalWords:  rng Mangalam Dubeau MPL RNG constructTree validator

//# sourceMappingURL=validate.js.map


/***/ }),
/* 32 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 33 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 34 */
/***/ (function(module, exports) {

/*!
 * XRegExp.build 3.1.1
 * <xregexp.com>
 * Steven Levithan (c) 2012-2016 MIT License
 * Inspired by Lea Verou's RegExp.create <lea.verou.me>
 */

module.exports = function(XRegExp) {
    'use strict';

    var REGEX_DATA = 'xregexp';
    var subParts = /(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*]/g;
    var parts = XRegExp.union([/\({{([\w$]+)}}\)|{{([\w$]+)}}/, subParts], 'g');

    /**
     * Strips a leading `^` and trailing unescaped `$`, if both are present.
     *
     * @param {String} pattern Pattern to process.
     * @returns {String} Pattern with edge anchors removed.
     */
    function deanchor(pattern) {
        // Allow any number of empty noncapturing groups before/after anchors, because regexes
        // built/generated by XRegExp sometimes include them
        var leadingAnchor = /^(?:\(\?:\))*\^/,
            trailingAnchor = /\$(?:\(\?:\))*$/;

        if (
            leadingAnchor.test(pattern) &&
            trailingAnchor.test(pattern) &&
            // Ensure that the trailing `$` isn't escaped
            trailingAnchor.test(pattern.replace(/\\[\s\S]/g, ''))
        ) {
            return pattern.replace(leadingAnchor, '').replace(trailingAnchor, '');
        }

        return pattern;
    }

    /**
     * Converts the provided value to an XRegExp. Native RegExp flags are not preserved.
     *
     * @param {String|RegExp} value Value to convert.
     * @returns {RegExp} XRegExp object with XRegExp syntax applied.
     */
    function asXRegExp(value) {
        return XRegExp.isRegExp(value) ?
            (value[REGEX_DATA] && value[REGEX_DATA].captureNames ?
                // Don't recompile, to preserve capture names
                value :
                // Recompile as XRegExp
                XRegExp(value.source)
            ) :
            // Compile string as XRegExp
            XRegExp(value);
    }

    /**
     * Builds regexes using named subpatterns, for readability and pattern reuse. Backreferences in
     * the outer pattern and provided subpatterns are automatically renumbered to work correctly.
     * Native flags used by provided subpatterns are ignored in favor of the `flags` argument.
     *
     * @param {String} pattern XRegExp pattern using `{{name}}` for embedded subpatterns. Allows
     *   `({{name}})` as shorthand for `(?<name>{{name}})`. Patterns cannot be embedded within
     *   character classes.
     * @param {Object} subs Lookup object for named subpatterns. Values can be strings or regexes. A
     *   leading `^` and trailing unescaped `$` are stripped from subpatterns, if both are present.
     * @param {String} [flags] Any combination of XRegExp flags.
     * @returns {RegExp} Regex with interpolated subpatterns.
     * @example
     *
     * var time = XRegExp.build('(?x)^ {{hours}} ({{minutes}}) $', {
     *   hours: XRegExp.build('{{h12}} : | {{h24}}', {
     *     h12: /1[0-2]|0?[1-9]/,
     *     h24: /2[0-3]|[01][0-9]/
     *   }, 'x'),
     *   minutes: /^[0-5][0-9]$/
     * });
     * time.test('10:59'); // -> true
     * XRegExp.exec('10:59', time).minutes; // -> '59'
     */
    XRegExp.build = function(pattern, subs, flags) {
        var inlineFlags = /^\(\?([\w$]+)\)/.exec(pattern),
            data = {},
            numCaps = 0, // 'Caps' is short for captures
            numPriorCaps,
            numOuterCaps = 0,
            outerCapsMap = [0],
            outerCapNames,
            sub,
            p;

        // Add flags within a leading mode modifier to the overall pattern's flags
        if (inlineFlags) {
            flags = flags || '';
            inlineFlags[1].replace(/./g, function(flag) {
                // Don't add duplicates
                flags += (flags.indexOf(flag) > -1 ? '' : flag);
            });
        }

        for (p in subs) {
            if (subs.hasOwnProperty(p)) {
                // Passing to XRegExp enables extended syntax and ensures independent validity,
                // lest an unescaped `(`, `)`, `[`, or trailing `\` breaks the `(?:)` wrapper. For
                // subpatterns provided as native regexes, it dies on octals and adds the property
                // used to hold extended regex instance data, for simplicity
                sub = asXRegExp(subs[p]);
                data[p] = {
                    // Deanchoring allows embedding independently useful anchored regexes. If you
                    // really need to keep your anchors, double them (i.e., `^^...$$`)
                    pattern: deanchor(sub.source),
                    names: sub[REGEX_DATA].captureNames || []
                };
            }
        }

        // Passing to XRegExp dies on octals and ensures the outer pattern is independently valid;
        // helps keep this simple. Named captures will be put back
        pattern = asXRegExp(pattern);
        outerCapNames = pattern[REGEX_DATA].captureNames || [];
        pattern = pattern.source.replace(parts, function($0, $1, $2, $3, $4) {
            var subName = $1 || $2,
                capName,
                intro,
                localCapIndex;
            // Named subpattern
            if (subName) {
                if (!data.hasOwnProperty(subName)) {
                    throw new ReferenceError('Undefined property ' + $0);
                }
                // Named subpattern was wrapped in a capturing group
                if ($1) {
                    capName = outerCapNames[numOuterCaps];
                    outerCapsMap[++numOuterCaps] = ++numCaps;
                    // If it's a named group, preserve the name. Otherwise, use the subpattern name
                    // as the capture name
                    intro = '(?<' + (capName || subName) + '>';
                } else {
                    intro = '(?:';
                }
                numPriorCaps = numCaps;
                return intro + data[subName].pattern.replace(subParts, function(match, paren, backref) {
                    // Capturing group
                    if (paren) {
                        capName = data[subName].names[numCaps - numPriorCaps];
                        ++numCaps;
                        // If the current capture has a name, preserve the name
                        if (capName) {
                            return '(?<' + capName + '>';
                        }
                    // Backreference
                    } else if (backref) {
                        localCapIndex = +backref - 1;
                        // Rewrite the backreference
                        return data[subName].names[localCapIndex] ?
                            // Need to preserve the backreference name in case using flag `n`
                            '\\k<' + data[subName].names[localCapIndex] + '>' :
                            '\\' + (+backref + numPriorCaps);
                    }
                    return match;
                }) + ')';
            }
            // Capturing group
            if ($3) {
                capName = outerCapNames[numOuterCaps];
                outerCapsMap[++numOuterCaps] = ++numCaps;
                // If the current capture has a name, preserve the name
                if (capName) {
                    return '(?<' + capName + '>';
                }
            // Backreference
            } else if ($4) {
                localCapIndex = +$4 - 1;
                // Rewrite the backreference
                return outerCapNames[localCapIndex] ?
                    // Need to preserve the backreference name in case using flag `n`
                    '\\k<' + outerCapNames[localCapIndex] + '>' :
                    '\\' + outerCapsMap[+$4];
            }
            return $0;
        });

        return XRegExp(pattern, flags);
    };

};


/***/ }),
/* 35 */
/***/ (function(module, exports) {

/*!
 * XRegExp.matchRecursive 3.1.1
 * <xregexp.com>
 * Steven Levithan (c) 2009-2016 MIT License
 */

module.exports = function(XRegExp) {
    'use strict';

    /**
     * Returns a match detail object composed of the provided values.
     */
    function row(name, value, start, end) {
        return {
            name: name,
            value: value,
            start: start,
            end: end
        };
    }

    /**
     * Returns an array of match strings between outermost left and right delimiters, or an array of
     * objects with detailed match parts and position data. An error is thrown if delimiters are
     * unbalanced within the data.
     *
     * @param {String} str String to search.
     * @param {String} left Left delimiter as an XRegExp pattern.
     * @param {String} right Right delimiter as an XRegExp pattern.
     * @param {String} [flags] Any native or XRegExp flags, used for the left and right delimiters.
     * @param {Object} [options] Lets you specify `valueNames` and `escapeChar` options.
     * @returns {Array} Array of matches, or an empty array.
     * @example
     *
     * // Basic usage
     * var str = '(t((e))s)t()(ing)';
     * XRegExp.matchRecursive(str, '\\(', '\\)', 'g');
     * // -> ['t((e))s', '', 'ing']
     *
     * // Extended information mode with valueNames
     * str = 'Here is <div> <div>an</div></div> example';
     * XRegExp.matchRecursive(str, '<div\\s*>', '</div>', 'gi', {
     *   valueNames: ['between', 'left', 'match', 'right']
     * });
     * // -> [
     * // {name: 'between', value: 'Here is ',       start: 0,  end: 8},
     * // {name: 'left',    value: '<div>',          start: 8,  end: 13},
     * // {name: 'match',   value: ' <div>an</div>', start: 13, end: 27},
     * // {name: 'right',   value: '</div>',         start: 27, end: 33},
     * // {name: 'between', value: ' example',       start: 33, end: 41}
     * // ]
     *
     * // Omitting unneeded parts with null valueNames, and using escapeChar
     * str = '...{1}.\\{{function(x,y){return {y:x}}}';
     * XRegExp.matchRecursive(str, '{', '}', 'g', {
     *   valueNames: ['literal', null, 'value', null],
     *   escapeChar: '\\'
     * });
     * // -> [
     * // {name: 'literal', value: '...',  start: 0, end: 3},
     * // {name: 'value',   value: '1',    start: 4, end: 5},
     * // {name: 'literal', value: '.\\{', start: 6, end: 9},
     * // {name: 'value',   value: 'function(x,y){return {y:x}}', start: 10, end: 37}
     * // ]
     *
     * // Sticky mode via flag y
     * str = '<1><<<2>>><3>4<5>';
     * XRegExp.matchRecursive(str, '<', '>', 'gy');
     * // -> ['1', '<<2>>', '3']
     */
    XRegExp.matchRecursive = function(str, left, right, flags, options) {
        flags = flags || '';
        options = options || {};
        var global = flags.indexOf('g') > -1,
            sticky = flags.indexOf('y') > -1,
            // Flag `y` is controlled internally
            basicFlags = flags.replace(/y/g, ''),
            escapeChar = options.escapeChar,
            vN = options.valueNames,
            output = [],
            openTokens = 0,
            delimStart = 0,
            delimEnd = 0,
            lastOuterEnd = 0,
            outerStart,
            innerStart,
            leftMatch,
            rightMatch,
            esc;
        left = XRegExp(left, basicFlags);
        right = XRegExp(right, basicFlags);

        if (escapeChar) {
            if (escapeChar.length > 1) {
                throw new Error('Cannot use more than one escape character');
            }
            escapeChar = XRegExp.escape(escapeChar);
            // Using `XRegExp.union` safely rewrites backreferences in `left` and `right`
            esc = new RegExp(
                '(?:' + escapeChar + '[\\S\\s]|(?:(?!' +
                    XRegExp.union([left, right]).source +
                    ')[^' + escapeChar + '])+)+',
                // Flags `gy` not needed here
                flags.replace(/[^imu]+/g, '')
            );
        }

        while (true) {
            // If using an escape character, advance to the delimiter's next starting position,
            // skipping any escaped characters in between
            if (escapeChar) {
                delimEnd += (XRegExp.exec(str, esc, delimEnd, 'sticky') || [''])[0].length;
            }
            leftMatch = XRegExp.exec(str, left, delimEnd);
            rightMatch = XRegExp.exec(str, right, delimEnd);
            // Keep the leftmost match only
            if (leftMatch && rightMatch) {
                if (leftMatch.index <= rightMatch.index) {
                    rightMatch = null;
                } else {
                    leftMatch = null;
                }
            }
            // Paths (LM: leftMatch, RM: rightMatch, OT: openTokens):
            // LM | RM | OT | Result
            // 1  | 0  | 1  | loop
            // 1  | 0  | 0  | loop
            // 0  | 1  | 1  | loop
            // 0  | 1  | 0  | throw
            // 0  | 0  | 1  | throw
            // 0  | 0  | 0  | break
            // The paths above don't include the sticky mode special case. The loop ends after the
            // first completed match if not `global`.
            if (leftMatch || rightMatch) {
                delimStart = (leftMatch || rightMatch).index;
                delimEnd = delimStart + (leftMatch || rightMatch)[0].length;
            } else if (!openTokens) {
                break;
            }
            if (sticky && !openTokens && delimStart > lastOuterEnd) {
                break;
            }
            if (leftMatch) {
                if (!openTokens) {
                    outerStart = delimStart;
                    innerStart = delimEnd;
                }
                ++openTokens;
            } else if (rightMatch && openTokens) {
                if (!--openTokens) {
                    if (vN) {
                        if (vN[0] && outerStart > lastOuterEnd) {
                            output.push(row(vN[0], str.slice(lastOuterEnd, outerStart), lastOuterEnd, outerStart));
                        }
                        if (vN[1]) {
                            output.push(row(vN[1], str.slice(outerStart, innerStart), outerStart, innerStart));
                        }
                        if (vN[2]) {
                            output.push(row(vN[2], str.slice(innerStart, delimStart), innerStart, delimStart));
                        }
                        if (vN[3]) {
                            output.push(row(vN[3], str.slice(delimStart, delimEnd), delimStart, delimEnd));
                        }
                    } else {
                        output.push(str.slice(innerStart, delimStart));
                    }
                    lastOuterEnd = delimEnd;
                    if (!global) {
                        break;
                    }
                }
            } else {
                throw new Error('Unbalanced delimiter found in string');
            }
            // If the delimiter matched an empty string, avoid an infinite loop
            if (delimStart === delimEnd) {
                ++delimEnd;
            }
        }

        if (global && !sticky && vN && vN[0] && str.length > lastOuterEnd) {
            output.push(row(vN[0], str.slice(lastOuterEnd), lastOuterEnd, str.length));
        }

        return output;
    };

};


/***/ }),
/* 36 */
/***/ (function(module, exports) {

/*!
 * XRegExp Unicode Base 3.1.1
 * <xregexp.com>
 * Steven Levithan (c) 2008-2016 MIT License
 */

module.exports = function(XRegExp) {
    'use strict';

    /**
     * Adds base support for Unicode matching:
     * - Adds syntax `\p{..}` for matching Unicode tokens. Tokens can be inverted using `\P{..}` or
     *   `\p{^..}`. Token names ignore case, spaces, hyphens, and underscores. You can omit the
     *   braces for token names that are a single letter (e.g. `\pL` or `PL`).
     * - Adds flag A (astral), which enables 21-bit Unicode support.
     * - Adds the `XRegExp.addUnicodeData` method used by other addons to provide character data.
     *
     * Unicode Base relies on externally provided Unicode character data. Official addons are
     * available to provide data for Unicode categories, scripts, blocks, and properties.
     *
     * @requires XRegExp
     */

    // ==--------------------------==
    // Private stuff
    // ==--------------------------==

    // Storage for Unicode data
    var unicode = {};

    // Reuse utils
    var dec = XRegExp._dec;
    var hex = XRegExp._hex;
    var pad4 = XRegExp._pad4;

    // Generates a token lookup name: lowercase, with hyphens, spaces, and underscores removed
    function normalize(name) {
        return name.replace(/[- _]+/g, '').toLowerCase();
    }

    // Gets the decimal code of a literal code unit, \xHH, \uHHHH, or a backslash-escaped literal
    function charCode(chr) {
        var esc = /^\\[xu](.+)/.exec(chr);
        return esc ?
            dec(esc[1]) :
            chr.charCodeAt(chr.charAt(0) === '\\' ? 1 : 0);
    }

    // Inverts a list of ordered BMP characters and ranges
    function invertBmp(range) {
        var output = '';
        var lastEnd = -1;
        XRegExp.forEach(
            range,
            /(\\x..|\\u....|\\?[\s\S])(?:-(\\x..|\\u....|\\?[\s\S]))?/,
            function(m) {
                var start = charCode(m[1]);
                if (start > (lastEnd + 1)) {
                    output += '\\u' + pad4(hex(lastEnd + 1));
                    if (start > (lastEnd + 2)) {
                        output += '-\\u' + pad4(hex(start - 1));
                    }
                }
                lastEnd = charCode(m[2] || m[1]);
            }
        );
        if (lastEnd < 0xFFFF) {
            output += '\\u' + pad4(hex(lastEnd + 1));
            if (lastEnd < 0xFFFE) {
                output += '-\\uFFFF';
            }
        }
        return output;
    }

    // Generates an inverted BMP range on first use
    function cacheInvertedBmp(slug) {
        var prop = 'b!';
        return unicode[slug][prop] || (
            unicode[slug][prop] = invertBmp(unicode[slug].bmp)
        );
    }

    // Combines and optionally negates BMP and astral data
    function buildAstral(slug, isNegated) {
        var item = unicode[slug],
            combined = '';
        if (item.bmp && !item.isBmpLast) {
            combined = '[' + item.bmp + ']' + (item.astral ? '|' : '');
        }
        if (item.astral) {
            combined += item.astral;
        }
        if (item.isBmpLast && item.bmp) {
            combined += (item.astral ? '|' : '') + '[' + item.bmp + ']';
        }
        // Astral Unicode tokens always match a code point, never a code unit
        return isNegated ?
            '(?:(?!' + combined + ')(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[\0-\uFFFF]))' :
            '(?:' + combined + ')';
    }

    // Builds a complete astral pattern on first use
    function cacheAstral(slug, isNegated) {
        var prop = isNegated ? 'a!' : 'a=';
        return unicode[slug][prop] || (
            unicode[slug][prop] = buildAstral(slug, isNegated)
        );
    }

    // ==--------------------------==
    // Core functionality
    // ==--------------------------==

    /*
     * Add Unicode token syntax: \p{..}, \P{..}, \p{^..}. Also add astral mode (flag A).
     */
    XRegExp.addToken(
        // Use `*` instead of `+` to avoid capturing `^` as the token name in `\p{^}`
        /\\([pP])(?:{(\^?)([^}]*)}|([A-Za-z]))/,
        function(match, scope, flags) {
            var ERR_DOUBLE_NEG = 'Invalid double negation ',
                ERR_UNKNOWN_NAME = 'Unknown Unicode token ',
                ERR_UNKNOWN_REF = 'Unicode token missing data ',
                ERR_ASTRAL_ONLY = 'Astral mode required for Unicode token ',
                ERR_ASTRAL_IN_CLASS = 'Astral mode does not support Unicode tokens within character classes',
                // Negated via \P{..} or \p{^..}
                isNegated = match[1] === 'P' || !!match[2],
                // Switch from BMP (0-FFFF) to astral (0-10FFFF) mode via flag A
                isAstralMode = flags.indexOf('A') > -1,
                // Token lookup name. Check `[4]` first to avoid passing `undefined` via `\p{}`
                slug = normalize(match[4] || match[3]),
                // Token data object
                item = unicode[slug];

            if (match[1] === 'P' && match[2]) {
                throw new SyntaxError(ERR_DOUBLE_NEG + match[0]);
            }
            if (!unicode.hasOwnProperty(slug)) {
                throw new SyntaxError(ERR_UNKNOWN_NAME + match[0]);
            }

            // Switch to the negated form of the referenced Unicode token
            if (item.inverseOf) {
                slug = normalize(item.inverseOf);
                if (!unicode.hasOwnProperty(slug)) {
                    throw new ReferenceError(ERR_UNKNOWN_REF + match[0] + ' -> ' + item.inverseOf);
                }
                item = unicode[slug];
                isNegated = !isNegated;
            }

            if (!(item.bmp || isAstralMode)) {
                throw new SyntaxError(ERR_ASTRAL_ONLY + match[0]);
            }
            if (isAstralMode) {
                if (scope === 'class') {
                    throw new SyntaxError(ERR_ASTRAL_IN_CLASS);
                }

                return cacheAstral(slug, isNegated);
            }

            return scope === 'class' ?
                (isNegated ? cacheInvertedBmp(slug) : item.bmp) :
                (isNegated ? '[^' : '[') + item.bmp + ']';
        },
        {
            scope: 'all',
            optionalFlags: 'A',
            leadChar: '\\'
        }
    );

    /**
     * Adds to the list of Unicode tokens that XRegExp regexes can match via `\p` or `\P`.
     *
     * @param {Array} data Objects with named character ranges. Each object may have properties
     *   `name`, `alias`, `isBmpLast`, `inverseOf`, `bmp`, and `astral`. All but `name` are
     *   optional, although one of `bmp` or `astral` is required (unless `inverseOf` is set). If
     *   `astral` is absent, the `bmp` data is used for BMP and astral modes. If `bmp` is absent,
     *   the name errors in BMP mode but works in astral mode. If both `bmp` and `astral` are
     *   provided, the `bmp` data only is used in BMP mode, and the combination of `bmp` and
     *   `astral` data is used in astral mode. `isBmpLast` is needed when a token matches orphan
     *   high surrogates *and* uses surrogate pairs to match astral code points. The `bmp` and
     *   `astral` data should be a combination of literal characters and `\xHH` or `\uHHHH` escape
     *   sequences, with hyphens to create ranges. Any regex metacharacters in the data should be
     *   escaped, apart from range-creating hyphens. The `astral` data can additionally use
     *   character classes and alternation, and should use surrogate pairs to represent astral code
     *   points. `inverseOf` can be used to avoid duplicating character data if a Unicode token is
     *   defined as the exact inverse of another token.
     * @example
     *
     * // Basic use
     * XRegExp.addUnicodeData([{
     *   name: 'XDigit',
     *   alias: 'Hexadecimal',
     *   bmp: '0-9A-Fa-f'
     * }]);
     * XRegExp('\\p{XDigit}:\\p{Hexadecimal}+').test('0:3D'); // -> true
     */
    XRegExp.addUnicodeData = function(data) {
        var ERR_NO_NAME = 'Unicode token requires name',
            ERR_NO_DATA = 'Unicode token has no character data ',
            item,
            i;

        for (i = 0; i < data.length; ++i) {
            item = data[i];
            if (!item.name) {
                throw new Error(ERR_NO_NAME);
            }
            if (!(item.inverseOf || item.bmp || item.astral)) {
                throw new Error(ERR_NO_DATA + item.name);
            }
            unicode[normalize(item.name)] = item;
            if (item.alias) {
                unicode[normalize(item.alias)] = item;
            }
        }

        // Reset the pattern cache used by the `XRegExp` constructor, since the same pattern and
        // flags might now produce different results
        XRegExp.cache.flush('patterns');
    };

};


/***/ }),
/* 37 */
/***/ (function(module, exports) {

/*!
 * XRegExp Unicode Blocks 3.1.1
 * <xregexp.com>
 * Steven Levithan (c) 2010-2016 MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */

module.exports = function(XRegExp) {
    'use strict';

    /**
     * Adds support for all Unicode blocks. Block names use the prefix 'In'. E.g.,
     * `\p{InBasicLatin}`. Token names are case insensitive, and any spaces, hyphens, and
     * underscores are ignored.
     *
     * Uses Unicode 8.0.0.
     *
     * @requires XRegExp, Unicode Base
     */

    if (!XRegExp.addUnicodeData) {
        throw new ReferenceError('Unicode Base must be loaded before Unicode Blocks');
    }

    XRegExp.addUnicodeData([
        {
            name: 'InAegean_Numbers',
            astral: '\uD800[\uDD00-\uDD3F]'
        },
        {
            name: 'InAhom',
            astral: '\uD805[\uDF00-\uDF3F]'
        },
        {
            name: 'InAlchemical_Symbols',
            astral: '\uD83D[\uDF00-\uDF7F]'
        },
        {
            name: 'InAlphabetic_Presentation_Forms',
            bmp: '\uFB00-\uFB4F'
        },
        {
            name: 'InAnatolian_Hieroglyphs',
            astral: '\uD811[\uDC00-\uDE7F]'
        },
        {
            name: 'InAncient_Greek_Musical_Notation',
            astral: '\uD834[\uDE00-\uDE4F]'
        },
        {
            name: 'InAncient_Greek_Numbers',
            astral: '\uD800[\uDD40-\uDD8F]'
        },
        {
            name: 'InAncient_Symbols',
            astral: '\uD800[\uDD90-\uDDCF]'
        },
        {
            name: 'InArabic',
            bmp: '\u0600-\u06FF'
        },
        {
            name: 'InArabic_Extended_A',
            bmp: '\u08A0-\u08FF'
        },
        {
            name: 'InArabic_Mathematical_Alphabetic_Symbols',
            astral: '\uD83B[\uDE00-\uDEFF]'
        },
        {
            name: 'InArabic_Presentation_Forms_A',
            bmp: '\uFB50-\uFDFF'
        },
        {
            name: 'InArabic_Presentation_Forms_B',
            bmp: '\uFE70-\uFEFF'
        },
        {
            name: 'InArabic_Supplement',
            bmp: '\u0750-\u077F'
        },
        {
            name: 'InArmenian',
            bmp: '\u0530-\u058F'
        },
        {
            name: 'InArrows',
            bmp: '\u2190-\u21FF'
        },
        {
            name: 'InAvestan',
            astral: '\uD802[\uDF00-\uDF3F]'
        },
        {
            name: 'InBalinese',
            bmp: '\u1B00-\u1B7F'
        },
        {
            name: 'InBamum',
            bmp: '\uA6A0-\uA6FF'
        },
        {
            name: 'InBamum_Supplement',
            astral: '\uD81A[\uDC00-\uDE3F]'
        },
        {
            name: 'InBasic_Latin',
            bmp: '\0-\x7F'
        },
        {
            name: 'InBassa_Vah',
            astral: '\uD81A[\uDED0-\uDEFF]'
        },
        {
            name: 'InBatak',
            bmp: '\u1BC0-\u1BFF'
        },
        {
            name: 'InBengali',
            bmp: '\u0980-\u09FF'
        },
        {
            name: 'InBlock_Elements',
            bmp: '\u2580-\u259F'
        },
        {
            name: 'InBopomofo',
            bmp: '\u3100-\u312F'
        },
        {
            name: 'InBopomofo_Extended',
            bmp: '\u31A0-\u31BF'
        },
        {
            name: 'InBox_Drawing',
            bmp: '\u2500-\u257F'
        },
        {
            name: 'InBrahmi',
            astral: '\uD804[\uDC00-\uDC7F]'
        },
        {
            name: 'InBraille_Patterns',
            bmp: '\u2800-\u28FF'
        },
        {
            name: 'InBuginese',
            bmp: '\u1A00-\u1A1F'
        },
        {
            name: 'InBuhid',
            bmp: '\u1740-\u175F'
        },
        {
            name: 'InByzantine_Musical_Symbols',
            astral: '\uD834[\uDC00-\uDCFF]'
        },
        {
            name: 'InCJK_Compatibility',
            bmp: '\u3300-\u33FF'
        },
        {
            name: 'InCJK_Compatibility_Forms',
            bmp: '\uFE30-\uFE4F'
        },
        {
            name: 'InCJK_Compatibility_Ideographs',
            bmp: '\uF900-\uFAFF'
        },
        {
            name: 'InCJK_Compatibility_Ideographs_Supplement',
            astral: '\uD87E[\uDC00-\uDE1F]'
        },
        {
            name: 'InCJK_Radicals_Supplement',
            bmp: '\u2E80-\u2EFF'
        },
        {
            name: 'InCJK_Strokes',
            bmp: '\u31C0-\u31EF'
        },
        {
            name: 'InCJK_Symbols_and_Punctuation',
            bmp: '\u3000-\u303F'
        },
        {
            name: 'InCJK_Unified_Ideographs',
            bmp: '\u4E00-\u9FFF'
        },
        {
            name: 'InCJK_Unified_Ideographs_Extension_A',
            bmp: '\u3400-\u4DBF'
        },
        {
            name: 'InCJK_Unified_Ideographs_Extension_B',
            astral: '[\uD840-\uD868][\uDC00-\uDFFF]|\uD869[\uDC00-\uDEDF]'
        },
        {
            name: 'InCJK_Unified_Ideographs_Extension_C',
            astral: '\uD86D[\uDC00-\uDF3F]|[\uD86A-\uD86C][\uDC00-\uDFFF]|\uD869[\uDF00-\uDFFF]'
        },
        {
            name: 'InCJK_Unified_Ideographs_Extension_D',
            astral: '\uD86D[\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1F]'
        },
        {
            name: 'InCJK_Unified_Ideographs_Extension_E',
            astral: '[\uD86F-\uD872][\uDC00-\uDFFF]|\uD873[\uDC00-\uDEAF]|\uD86E[\uDC20-\uDFFF]'
        },
        {
            name: 'InCarian',
            astral: '\uD800[\uDEA0-\uDEDF]'
        },
        {
            name: 'InCaucasian_Albanian',
            astral: '\uD801[\uDD30-\uDD6F]'
        },
        {
            name: 'InChakma',
            astral: '\uD804[\uDD00-\uDD4F]'
        },
        {
            name: 'InCham',
            bmp: '\uAA00-\uAA5F'
        },
        {
            name: 'InCherokee',
            bmp: '\u13A0-\u13FF'
        },
        {
            name: 'InCherokee_Supplement',
            bmp: '\uAB70-\uABBF'
        },
        {
            name: 'InCombining_Diacritical_Marks',
            bmp: '\u0300-\u036F'
        },
        {
            name: 'InCombining_Diacritical_Marks_Extended',
            bmp: '\u1AB0-\u1AFF'
        },
        {
            name: 'InCombining_Diacritical_Marks_Supplement',
            bmp: '\u1DC0-\u1DFF'
        },
        {
            name: 'InCombining_Diacritical_Marks_for_Symbols',
            bmp: '\u20D0-\u20FF'
        },
        {
            name: 'InCombining_Half_Marks',
            bmp: '\uFE20-\uFE2F'
        },
        {
            name: 'InCommon_Indic_Number_Forms',
            bmp: '\uA830-\uA83F'
        },
        {
            name: 'InControl_Pictures',
            bmp: '\u2400-\u243F'
        },
        {
            name: 'InCoptic',
            bmp: '\u2C80-\u2CFF'
        },
        {
            name: 'InCoptic_Epact_Numbers',
            astral: '\uD800[\uDEE0-\uDEFF]'
        },
        {
            name: 'InCounting_Rod_Numerals',
            astral: '\uD834[\uDF60-\uDF7F]'
        },
        {
            name: 'InCuneiform',
            astral: '\uD808[\uDC00-\uDFFF]'
        },
        {
            name: 'InCuneiform_Numbers_and_Punctuation',
            astral: '\uD809[\uDC00-\uDC7F]'
        },
        {
            name: 'InCurrency_Symbols',
            bmp: '\u20A0-\u20CF'
        },
        {
            name: 'InCypriot_Syllabary',
            astral: '\uD802[\uDC00-\uDC3F]'
        },
        {
            name: 'InCyrillic',
            bmp: '\u0400-\u04FF'
        },
        {
            name: 'InCyrillic_Extended_A',
            bmp: '\u2DE0-\u2DFF'
        },
        {
            name: 'InCyrillic_Extended_B',
            bmp: '\uA640-\uA69F'
        },
        {
            name: 'InCyrillic_Supplement',
            bmp: '\u0500-\u052F'
        },
        {
            name: 'InDeseret',
            astral: '\uD801[\uDC00-\uDC4F]'
        },
        {
            name: 'InDevanagari',
            bmp: '\u0900-\u097F'
        },
        {
            name: 'InDevanagari_Extended',
            bmp: '\uA8E0-\uA8FF'
        },
        {
            name: 'InDingbats',
            bmp: '\u2700-\u27BF'
        },
        {
            name: 'InDomino_Tiles',
            astral: '\uD83C[\uDC30-\uDC9F]'
        },
        {
            name: 'InDuployan',
            astral: '\uD82F[\uDC00-\uDC9F]'
        },
        {
            name: 'InEarly_Dynastic_Cuneiform',
            astral: '\uD809[\uDC80-\uDD4F]'
        },
        {
            name: 'InEgyptian_Hieroglyphs',
            astral: '\uD80C[\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2F]'
        },
        {
            name: 'InElbasan',
            astral: '\uD801[\uDD00-\uDD2F]'
        },
        {
            name: 'InEmoticons',
            astral: '\uD83D[\uDE00-\uDE4F]'
        },
        {
            name: 'InEnclosed_Alphanumeric_Supplement',
            astral: '\uD83C[\uDD00-\uDDFF]'
        },
        {
            name: 'InEnclosed_Alphanumerics',
            bmp: '\u2460-\u24FF'
        },
        {
            name: 'InEnclosed_CJK_Letters_and_Months',
            bmp: '\u3200-\u32FF'
        },
        {
            name: 'InEnclosed_Ideographic_Supplement',
            astral: '\uD83C[\uDE00-\uDEFF]'
        },
        {
            name: 'InEthiopic',
            bmp: '\u1200-\u137F'
        },
        {
            name: 'InEthiopic_Extended',
            bmp: '\u2D80-\u2DDF'
        },
        {
            name: 'InEthiopic_Extended_A',
            bmp: '\uAB00-\uAB2F'
        },
        {
            name: 'InEthiopic_Supplement',
            bmp: '\u1380-\u139F'
        },
        {
            name: 'InGeneral_Punctuation',
            bmp: '\u2000-\u206F'
        },
        {
            name: 'InGeometric_Shapes',
            bmp: '\u25A0-\u25FF'
        },
        {
            name: 'InGeometric_Shapes_Extended',
            astral: '\uD83D[\uDF80-\uDFFF]'
        },
        {
            name: 'InGeorgian',
            bmp: '\u10A0-\u10FF'
        },
        {
            name: 'InGeorgian_Supplement',
            bmp: '\u2D00-\u2D2F'
        },
        {
            name: 'InGlagolitic',
            bmp: '\u2C00-\u2C5F'
        },
        {
            name: 'InGothic',
            astral: '\uD800[\uDF30-\uDF4F]'
        },
        {
            name: 'InGrantha',
            astral: '\uD804[\uDF00-\uDF7F]'
        },
        {
            name: 'InGreek_Extended',
            bmp: '\u1F00-\u1FFF'
        },
        {
            name: 'InGreek_and_Coptic',
            bmp: '\u0370-\u03FF'
        },
        {
            name: 'InGujarati',
            bmp: '\u0A80-\u0AFF'
        },
        {
            name: 'InGurmukhi',
            bmp: '\u0A00-\u0A7F'
        },
        {
            name: 'InHalfwidth_and_Fullwidth_Forms',
            bmp: '\uFF00-\uFFEF'
        },
        {
            name: 'InHangul_Compatibility_Jamo',
            bmp: '\u3130-\u318F'
        },
        {
            name: 'InHangul_Jamo',
            bmp: '\u1100-\u11FF'
        },
        {
            name: 'InHangul_Jamo_Extended_A',
            bmp: '\uA960-\uA97F'
        },
        {
            name: 'InHangul_Jamo_Extended_B',
            bmp: '\uD7B0-\uD7FF'
        },
        {
            name: 'InHangul_Syllables',
            bmp: '\uAC00-\uD7AF'
        },
        {
            name: 'InHanunoo',
            bmp: '\u1720-\u173F'
        },
        {
            name: 'InHatran',
            astral: '\uD802[\uDCE0-\uDCFF]'
        },
        {
            name: 'InHebrew',
            bmp: '\u0590-\u05FF'
        },
        {
            name: 'InHigh_Private_Use_Surrogates',
            bmp: '\uDB80-\uDBFF'
        },
        {
            name: 'InHigh_Surrogates',
            bmp: '\uD800-\uDB7F'
        },
        {
            name: 'InHiragana',
            bmp: '\u3040-\u309F'
        },
        {
            name: 'InIPA_Extensions',
            bmp: '\u0250-\u02AF'
        },
        {
            name: 'InIdeographic_Description_Characters',
            bmp: '\u2FF0-\u2FFF'
        },
        {
            name: 'InImperial_Aramaic',
            astral: '\uD802[\uDC40-\uDC5F]'
        },
        {
            name: 'InInscriptional_Pahlavi',
            astral: '\uD802[\uDF60-\uDF7F]'
        },
        {
            name: 'InInscriptional_Parthian',
            astral: '\uD802[\uDF40-\uDF5F]'
        },
        {
            name: 'InJavanese',
            bmp: '\uA980-\uA9DF'
        },
        {
            name: 'InKaithi',
            astral: '\uD804[\uDC80-\uDCCF]'
        },
        {
            name: 'InKana_Supplement',
            astral: '\uD82C[\uDC00-\uDCFF]'
        },
        {
            name: 'InKanbun',
            bmp: '\u3190-\u319F'
        },
        {
            name: 'InKangxi_Radicals',
            bmp: '\u2F00-\u2FDF'
        },
        {
            name: 'InKannada',
            bmp: '\u0C80-\u0CFF'
        },
        {
            name: 'InKatakana',
            bmp: '\u30A0-\u30FF'
        },
        {
            name: 'InKatakana_Phonetic_Extensions',
            bmp: '\u31F0-\u31FF'
        },
        {
            name: 'InKayah_Li',
            bmp: '\uA900-\uA92F'
        },
        {
            name: 'InKharoshthi',
            astral: '\uD802[\uDE00-\uDE5F]'
        },
        {
            name: 'InKhmer',
            bmp: '\u1780-\u17FF'
        },
        {
            name: 'InKhmer_Symbols',
            bmp: '\u19E0-\u19FF'
        },
        {
            name: 'InKhojki',
            astral: '\uD804[\uDE00-\uDE4F]'
        },
        {
            name: 'InKhudawadi',
            astral: '\uD804[\uDEB0-\uDEFF]'
        },
        {
            name: 'InLao',
            bmp: '\u0E80-\u0EFF'
        },
        {
            name: 'InLatin_Extended_Additional',
            bmp: '\u1E00-\u1EFF'
        },
        {
            name: 'InLatin_Extended_A',
            bmp: '\u0100-\u017F'
        },
        {
            name: 'InLatin_Extended_B',
            bmp: '\u0180-\u024F'
        },
        {
            name: 'InLatin_Extended_C',
            bmp: '\u2C60-\u2C7F'
        },
        {
            name: 'InLatin_Extended_D',
            bmp: '\uA720-\uA7FF'
        },
        {
            name: 'InLatin_Extended_E',
            bmp: '\uAB30-\uAB6F'
        },
        {
            name: 'InLatin_1_Supplement',
            bmp: '\x80-\xFF'
        },
        {
            name: 'InLepcha',
            bmp: '\u1C00-\u1C4F'
        },
        {
            name: 'InLetterlike_Symbols',
            bmp: '\u2100-\u214F'
        },
        {
            name: 'InLimbu',
            bmp: '\u1900-\u194F'
        },
        {
            name: 'InLinear_A',
            astral: '\uD801[\uDE00-\uDF7F]'
        },
        {
            name: 'InLinear_B_Ideograms',
            astral: '\uD800[\uDC80-\uDCFF]'
        },
        {
            name: 'InLinear_B_Syllabary',
            astral: '\uD800[\uDC00-\uDC7F]'
        },
        {
            name: 'InLisu',
            bmp: '\uA4D0-\uA4FF'
        },
        {
            name: 'InLow_Surrogates',
            bmp: '\uDC00-\uDFFF'
        },
        {
            name: 'InLycian',
            astral: '\uD800[\uDE80-\uDE9F]'
        },
        {
            name: 'InLydian',
            astral: '\uD802[\uDD20-\uDD3F]'
        },
        {
            name: 'InMahajani',
            astral: '\uD804[\uDD50-\uDD7F]'
        },
        {
            name: 'InMahjong_Tiles',
            astral: '\uD83C[\uDC00-\uDC2F]'
        },
        {
            name: 'InMalayalam',
            bmp: '\u0D00-\u0D7F'
        },
        {
            name: 'InMandaic',
            bmp: '\u0840-\u085F'
        },
        {
            name: 'InManichaean',
            astral: '\uD802[\uDEC0-\uDEFF]'
        },
        {
            name: 'InMathematical_Alphanumeric_Symbols',
            astral: '\uD835[\uDC00-\uDFFF]'
        },
        {
            name: 'InMathematical_Operators',
            bmp: '\u2200-\u22FF'
        },
        {
            name: 'InMeetei_Mayek',
            bmp: '\uABC0-\uABFF'
        },
        {
            name: 'InMeetei_Mayek_Extensions',
            bmp: '\uAAE0-\uAAFF'
        },
        {
            name: 'InMende_Kikakui',
            astral: '\uD83A[\uDC00-\uDCDF]'
        },
        {
            name: 'InMeroitic_Cursive',
            astral: '\uD802[\uDDA0-\uDDFF]'
        },
        {
            name: 'InMeroitic_Hieroglyphs',
            astral: '\uD802[\uDD80-\uDD9F]'
        },
        {
            name: 'InMiao',
            astral: '\uD81B[\uDF00-\uDF9F]'
        },
        {
            name: 'InMiscellaneous_Mathematical_Symbols_A',
            bmp: '\u27C0-\u27EF'
        },
        {
            name: 'InMiscellaneous_Mathematical_Symbols_B',
            bmp: '\u2980-\u29FF'
        },
        {
            name: 'InMiscellaneous_Symbols',
            bmp: '\u2600-\u26FF'
        },
        {
            name: 'InMiscellaneous_Symbols_and_Arrows',
            bmp: '\u2B00-\u2BFF'
        },
        {
            name: 'InMiscellaneous_Symbols_and_Pictographs',
            astral: '\uD83D[\uDC00-\uDDFF]|\uD83C[\uDF00-\uDFFF]'
        },
        {
            name: 'InMiscellaneous_Technical',
            bmp: '\u2300-\u23FF'
        },
        {
            name: 'InModi',
            astral: '\uD805[\uDE00-\uDE5F]'
        },
        {
            name: 'InModifier_Tone_Letters',
            bmp: '\uA700-\uA71F'
        },
        {
            name: 'InMongolian',
            bmp: '\u1800-\u18AF'
        },
        {
            name: 'InMro',
            astral: '\uD81A[\uDE40-\uDE6F]'
        },
        {
            name: 'InMultani',
            astral: '\uD804[\uDE80-\uDEAF]'
        },
        {
            name: 'InMusical_Symbols',
            astral: '\uD834[\uDD00-\uDDFF]'
        },
        {
            name: 'InMyanmar',
            bmp: '\u1000-\u109F'
        },
        {
            name: 'InMyanmar_Extended_A',
            bmp: '\uAA60-\uAA7F'
        },
        {
            name: 'InMyanmar_Extended_B',
            bmp: '\uA9E0-\uA9FF'
        },
        {
            name: 'InNKo',
            bmp: '\u07C0-\u07FF'
        },
        {
            name: 'InNabataean',
            astral: '\uD802[\uDC80-\uDCAF]'
        },
        {
            name: 'InNew_Tai_Lue',
            bmp: '\u1980-\u19DF'
        },
        {
            name: 'InNumber_Forms',
            bmp: '\u2150-\u218F'
        },
        {
            name: 'InOgham',
            bmp: '\u1680-\u169F'
        },
        {
            name: 'InOl_Chiki',
            bmp: '\u1C50-\u1C7F'
        },
        {
            name: 'InOld_Hungarian',
            astral: '\uD803[\uDC80-\uDCFF]'
        },
        {
            name: 'InOld_Italic',
            astral: '\uD800[\uDF00-\uDF2F]'
        },
        {
            name: 'InOld_North_Arabian',
            astral: '\uD802[\uDE80-\uDE9F]'
        },
        {
            name: 'InOld_Permic',
            astral: '\uD800[\uDF50-\uDF7F]'
        },
        {
            name: 'InOld_Persian',
            astral: '\uD800[\uDFA0-\uDFDF]'
        },
        {
            name: 'InOld_South_Arabian',
            astral: '\uD802[\uDE60-\uDE7F]'
        },
        {
            name: 'InOld_Turkic',
            astral: '\uD803[\uDC00-\uDC4F]'
        },
        {
            name: 'InOptical_Character_Recognition',
            bmp: '\u2440-\u245F'
        },
        {
            name: 'InOriya',
            bmp: '\u0B00-\u0B7F'
        },
        {
            name: 'InOrnamental_Dingbats',
            astral: '\uD83D[\uDE50-\uDE7F]'
        },
        {
            name: 'InOsmanya',
            astral: '\uD801[\uDC80-\uDCAF]'
        },
        {
            name: 'InPahawh_Hmong',
            astral: '\uD81A[\uDF00-\uDF8F]'
        },
        {
            name: 'InPalmyrene',
            astral: '\uD802[\uDC60-\uDC7F]'
        },
        {
            name: 'InPau_Cin_Hau',
            astral: '\uD806[\uDEC0-\uDEFF]'
        },
        {
            name: 'InPhags_pa',
            bmp: '\uA840-\uA87F'
        },
        {
            name: 'InPhaistos_Disc',
            astral: '\uD800[\uDDD0-\uDDFF]'
        },
        {
            name: 'InPhoenician',
            astral: '\uD802[\uDD00-\uDD1F]'
        },
        {
            name: 'InPhonetic_Extensions',
            bmp: '\u1D00-\u1D7F'
        },
        {
            name: 'InPhonetic_Extensions_Supplement',
            bmp: '\u1D80-\u1DBF'
        },
        {
            name: 'InPlaying_Cards',
            astral: '\uD83C[\uDCA0-\uDCFF]'
        },
        {
            name: 'InPrivate_Use_Area',
            bmp: '\uE000-\uF8FF'
        },
        {
            name: 'InPsalter_Pahlavi',
            astral: '\uD802[\uDF80-\uDFAF]'
        },
        {
            name: 'InRejang',
            bmp: '\uA930-\uA95F'
        },
        {
            name: 'InRumi_Numeral_Symbols',
            astral: '\uD803[\uDE60-\uDE7F]'
        },
        {
            name: 'InRunic',
            bmp: '\u16A0-\u16FF'
        },
        {
            name: 'InSamaritan',
            bmp: '\u0800-\u083F'
        },
        {
            name: 'InSaurashtra',
            bmp: '\uA880-\uA8DF'
        },
        {
            name: 'InSharada',
            astral: '\uD804[\uDD80-\uDDDF]'
        },
        {
            name: 'InShavian',
            astral: '\uD801[\uDC50-\uDC7F]'
        },
        {
            name: 'InShorthand_Format_Controls',
            astral: '\uD82F[\uDCA0-\uDCAF]'
        },
        {
            name: 'InSiddham',
            astral: '\uD805[\uDD80-\uDDFF]'
        },
        {
            name: 'InSinhala',
            bmp: '\u0D80-\u0DFF'
        },
        {
            name: 'InSinhala_Archaic_Numbers',
            astral: '\uD804[\uDDE0-\uDDFF]'
        },
        {
            name: 'InSmall_Form_Variants',
            bmp: '\uFE50-\uFE6F'
        },
        {
            name: 'InSora_Sompeng',
            astral: '\uD804[\uDCD0-\uDCFF]'
        },
        {
            name: 'InSpacing_Modifier_Letters',
            bmp: '\u02B0-\u02FF'
        },
        {
            name: 'InSpecials',
            bmp: '\uFFF0-\uFFFF'
        },
        {
            name: 'InSundanese',
            bmp: '\u1B80-\u1BBF'
        },
        {
            name: 'InSundanese_Supplement',
            bmp: '\u1CC0-\u1CCF'
        },
        {
            name: 'InSuperscripts_and_Subscripts',
            bmp: '\u2070-\u209F'
        },
        {
            name: 'InSupplemental_Arrows_A',
            bmp: '\u27F0-\u27FF'
        },
        {
            name: 'InSupplemental_Arrows_B',
            bmp: '\u2900-\u297F'
        },
        {
            name: 'InSupplemental_Arrows_C',
            astral: '\uD83E[\uDC00-\uDCFF]'
        },
        {
            name: 'InSupplemental_Mathematical_Operators',
            bmp: '\u2A00-\u2AFF'
        },
        {
            name: 'InSupplemental_Punctuation',
            bmp: '\u2E00-\u2E7F'
        },
        {
            name: 'InSupplemental_Symbols_and_Pictographs',
            astral: '\uD83E[\uDD00-\uDDFF]'
        },
        {
            name: 'InSupplementary_Private_Use_Area_A',
            astral: '[\uDB80-\uDBBF][\uDC00-\uDFFF]'
        },
        {
            name: 'InSupplementary_Private_Use_Area_B',
            astral: '[\uDBC0-\uDBFF][\uDC00-\uDFFF]'
        },
        {
            name: 'InSutton_SignWriting',
            astral: '\uD836[\uDC00-\uDEAF]'
        },
        {
            name: 'InSyloti_Nagri',
            bmp: '\uA800-\uA82F'
        },
        {
            name: 'InSyriac',
            bmp: '\u0700-\u074F'
        },
        {
            name: 'InTagalog',
            bmp: '\u1700-\u171F'
        },
        {
            name: 'InTagbanwa',
            bmp: '\u1760-\u177F'
        },
        {
            name: 'InTags',
            astral: '\uDB40[\uDC00-\uDC7F]'
        },
        {
            name: 'InTai_Le',
            bmp: '\u1950-\u197F'
        },
        {
            name: 'InTai_Tham',
            bmp: '\u1A20-\u1AAF'
        },
        {
            name: 'InTai_Viet',
            bmp: '\uAA80-\uAADF'
        },
        {
            name: 'InTai_Xuan_Jing_Symbols',
            astral: '\uD834[\uDF00-\uDF5F]'
        },
        {
            name: 'InTakri',
            astral: '\uD805[\uDE80-\uDECF]'
        },
        {
            name: 'InTamil',
            bmp: '\u0B80-\u0BFF'
        },
        {
            name: 'InTelugu',
            bmp: '\u0C00-\u0C7F'
        },
        {
            name: 'InThaana',
            bmp: '\u0780-\u07BF'
        },
        {
            name: 'InThai',
            bmp: '\u0E00-\u0E7F'
        },
        {
            name: 'InTibetan',
            bmp: '\u0F00-\u0FFF'
        },
        {
            name: 'InTifinagh',
            bmp: '\u2D30-\u2D7F'
        },
        {
            name: 'InTirhuta',
            astral: '\uD805[\uDC80-\uDCDF]'
        },
        {
            name: 'InTransport_and_Map_Symbols',
            astral: '\uD83D[\uDE80-\uDEFF]'
        },
        {
            name: 'InUgaritic',
            astral: '\uD800[\uDF80-\uDF9F]'
        },
        {
            name: 'InUnified_Canadian_Aboriginal_Syllabics',
            bmp: '\u1400-\u167F'
        },
        {
            name: 'InUnified_Canadian_Aboriginal_Syllabics_Extended',
            bmp: '\u18B0-\u18FF'
        },
        {
            name: 'InVai',
            bmp: '\uA500-\uA63F'
        },
        {
            name: 'InVariation_Selectors',
            bmp: '\uFE00-\uFE0F'
        },
        {
            name: 'InVariation_Selectors_Supplement',
            astral: '\uDB40[\uDD00-\uDDEF]'
        },
        {
            name: 'InVedic_Extensions',
            bmp: '\u1CD0-\u1CFF'
        },
        {
            name: 'InVertical_Forms',
            bmp: '\uFE10-\uFE1F'
        },
        {
            name: 'InWarang_Citi',
            astral: '\uD806[\uDCA0-\uDCFF]'
        },
        {
            name: 'InYi_Radicals',
            bmp: '\uA490-\uA4CF'
        },
        {
            name: 'InYi_Syllables',
            bmp: '\uA000-\uA48F'
        },
        {
            name: 'InYijing_Hexagram_Symbols',
            bmp: '\u4DC0-\u4DFF'
        }
    ]);

};


/***/ }),
/* 38 */
/***/ (function(module, exports) {

/*!
 * XRegExp Unicode Categories 3.1.1
 * <xregexp.com>
 * Steven Levithan (c) 2010-2016 MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */

module.exports = function(XRegExp) {
    'use strict';

    /**
     * Adds support for Unicode's general categories. E.g., `\p{Lu}` or `\p{Uppercase Letter}`. See
     * category descriptions in UAX #44 <http://unicode.org/reports/tr44/#GC_Values_Table>. Token
     * names are case insensitive, and any spaces, hyphens, and underscores are ignored.
     *
     * Uses Unicode 8.0.0.
     *
     * @requires XRegExp, Unicode Base
     */

    if (!XRegExp.addUnicodeData) {
        throw new ReferenceError('Unicode Base must be loaded before Unicode Categories');
    }

    XRegExp.addUnicodeData([
        {
            name: 'C',
            alias: 'Other',
            isBmpLast: true,
            bmp: '\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u0380-\u0383\u038B\u038D\u03A2\u0530\u0557\u0558\u0560\u0588\u058B\u058C\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08B5-\u08E2\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0AF8\u0AFA-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0BFF\u0C04\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D00\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5E\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F6\u13F7\u13FE\u13FF\u169D-\u169F\u16F9-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180E\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE\u1AAF\u1ABF-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7\u1CFA-\u1CFF\u1DF6-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BF-\u20CF\u20F1-\u20FF\u218C-\u218F\u23FB-\u23FF\u2427-\u243F\u244B-\u245F\u2B74\u2B75\u2B96\u2B97\u2BBA-\u2BBC\u2BC9\u2BD2-\u2BEB\u2BF0-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E43-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FD6-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA6F8-\uA6FF\uA7AE\uA7AF\uA7B8-\uA7F6\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FE\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB66-\uAB6F\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF',
            astral: '\uD834[\uDCF6-\uDCFF\uDD27\uDD28\uDD73-\uDD7A\uDDE9-\uDDFF\uDE46-\uDEFF\uDF57-\uDF5F\uDF72-\uDFFF]|\uD836[\uDE8C-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD83C[\uDC2C-\uDC2F\uDC94-\uDC9F\uDCAF\uDCB0\uDCC0\uDCD0\uDCF6-\uDCFF\uDD0D-\uDD0F\uDD2F\uDD6C-\uDD6F\uDD9B-\uDDE5\uDE03-\uDE0F\uDE3B-\uDE3F\uDE49-\uDE4F\uDE52-\uDEFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDE6D\uDE70-\uDECF\uDEEE\uDEEF\uDEF6-\uDEFF\uDF46-\uDF4F\uDF5A\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD809[\uDC6F\uDC75-\uDC7F\uDD44-\uDFFF]|\uD81B[\uDC00-\uDEFF\uDF45-\uDF4F\uDF7F-\uDF8E\uDFA0-\uDFFF]|\uD86E[\uDC1E\uDC1F]|\uD83D[\uDD7A\uDDA4\uDED1-\uDEDF\uDEED-\uDEEF\uDEF4-\uDEFF\uDF74-\uDF7F\uDFD5-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCFF\uDD28-\uDD2F\uDD64-\uDD6E\uDD70-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDFFF]|\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDCFF\uDD03-\uDD06\uDD34-\uDD36\uDD8D-\uDD8F\uDD9C-\uDD9F\uDDA1-\uDDCF\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEFC-\uDEFF\uDF24-\uDF2F\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDFC4-\uDFC7\uDFD6-\uDFFF]|\uD869[\uDED7-\uDEFF]|\uD83B[\uDC00-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDEEF\uDEF2-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uDB40[\uDC00-\uDCFF\uDDF0-\uDFFF]|\uD804[\uDC4E-\uDC51\uDC70-\uDC7E\uDCBD\uDCC2-\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD44-\uDD4F\uDD77-\uDD7F\uDDCE\uDDCF\uDDE0\uDDF5-\uDDFF\uDE12\uDE3E-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEAA-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF3B\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD83A[\uDCC5\uDCC6\uDCD7-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD86D[\uDF35-\uDF3F]|[\uD807\uD80A\uD80B\uD80E-\uD810\uD812-\uD819\uD81C-\uD82B\uD82D\uD82E\uD830-\uD833\uD837-\uD839\uD83F\uD874-\uD87D\uD87F-\uDB3F\uDB41-\uDBFF][\uDC00-\uDFFF]|\uD806[\uDC00-\uDC9F\uDCF3-\uDCFE\uDD00-\uDEBF\uDEF9-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCF9\uDD00-\uDE5F\uDE7F-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDFCC\uDFCD]|\uD805[\uDC00-\uDC7F\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDDE-\uDDFF\uDE45-\uDE4F\uDE5A-\uDE7F\uDEB8-\uDEBF\uDECA-\uDEFF\uDF1A-\uDF1C\uDF2C-\uDF2F\uDF40-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56\uDC9F-\uDCA6\uDCB0-\uDCDF\uDCF3\uDCF6-\uDCFA\uDD1C-\uDD1E\uDD3A-\uDD3E\uDD40-\uDD7F\uDDB8-\uDDBB\uDDD0\uDDD1\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE34-\uDE37\uDE3B-\uDE3E\uDE48-\uDE4F\uDE59-\uDE5F\uDEA0-\uDEBF\uDEE7-\uDEEA\uDEF7-\uDEFF\uDF36-\uDF38\uDF56\uDF57\uDF73-\uDF77\uDF92-\uDF98\uDF9D-\uDFA8\uDFB0-\uDFFF]|\uD808[\uDF9A-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A\uDC9B\uDCA0-\uDFFF]|\uD82C[\uDC02-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD83E[\uDC0C-\uDC0F\uDC48-\uDC4F\uDC5A-\uDC5F\uDC88-\uDC8F\uDCAE-\uDD0F\uDD19-\uDD7F\uDD85-\uDDBF\uDDC1-\uDFFF]|\uD873[\uDEA2-\uDFFF]'
        },
        {
            name: 'Cc',
            alias: 'Control',
            bmp: '\0-\x1F\x7F-\x9F'
        },
        {
            name: 'Cf',
            alias: 'Format',
            bmp: '\xAD\u0600-\u0605\u061C\u06DD\u070F\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB',
            astral: '\uDB40[\uDC01\uDC20-\uDC7F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uD804\uDCBD'
        },
        {
            name: 'Cn',
            alias: 'Unassigned',
            bmp: '\u0378\u0379\u0380-\u0383\u038B\u038D\u03A2\u0530\u0557\u0558\u0560\u0588\u058B\u058C\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u05FF\u061D\u070E\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08B5-\u08E2\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0AF8\u0AFA-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0BFF\u0C04\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D00\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5E\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F6\u13F7\u13FE\u13FF\u169D-\u169F\u16F9-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE\u1AAF\u1ABF-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7\u1CFA-\u1CFF\u1DF6-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u2065\u2072\u2073\u208F\u209D-\u209F\u20BF-\u20CF\u20F1-\u20FF\u218C-\u218F\u23FB-\u23FF\u2427-\u243F\u244B-\u245F\u2B74\u2B75\u2B96\u2B97\u2BBA-\u2BBC\u2BC9\u2BD2-\u2BEB\u2BF0-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E43-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FD6-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA6F8-\uA6FF\uA7AE\uA7AF\uA7B8-\uA7F6\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FE\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB66-\uAB6F\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uD7FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD\uFEFE\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFF8\uFFFE\uFFFF',
            astral: '\uDB40[\uDC00\uDC02-\uDC1F\uDC80-\uDCFF\uDDF0-\uDFFF]|\uD834[\uDCF6-\uDCFF\uDD27\uDD28\uDDE9-\uDDFF\uDE46-\uDEFF\uDF57-\uDF5F\uDF72-\uDFFF]|\uD83C[\uDC2C-\uDC2F\uDC94-\uDC9F\uDCAF\uDCB0\uDCC0\uDCD0\uDCF6-\uDCFF\uDD0D-\uDD0F\uDD2F\uDD6C-\uDD6F\uDD9B-\uDDE5\uDE03-\uDE0F\uDE3B-\uDE3F\uDE49-\uDE4F\uDE52-\uDEFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDE6D\uDE70-\uDECF\uDEEE\uDEEF\uDEF6-\uDEFF\uDF46-\uDF4F\uDF5A\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD809[\uDC6F\uDC75-\uDC7F\uDD44-\uDFFF]|\uD81B[\uDC00-\uDEFF\uDF45-\uDF4F\uDF7F-\uDF8E\uDFA0-\uDFFF]|\uD86E[\uDC1E\uDC1F]|\uD83D[\uDD7A\uDDA4\uDED1-\uDEDF\uDEED-\uDEEF\uDEF4-\uDEFF\uDF74-\uDF7F\uDFD5-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCFF\uDD28-\uDD2F\uDD64-\uDD6E\uDD70-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDFFF]|\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDCFF\uDD03-\uDD06\uDD34-\uDD36\uDD8D-\uDD8F\uDD9C-\uDD9F\uDDA1-\uDDCF\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEFC-\uDEFF\uDF24-\uDF2F\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDFC4-\uDFC7\uDFD6-\uDFFF]|\uD869[\uDED7-\uDEFF]|\uD83B[\uDC00-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDEEF\uDEF2-\uDFFF]|[\uDBBF\uDBFF][\uDFFE\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A\uDC9B\uDCA4-\uDFFF]|\uD83A[\uDCC5\uDCC6\uDCD7-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD86D[\uDF35-\uDF3F]|[\uD807\uD80A\uD80B\uD80E-\uD810\uD812-\uD819\uD81C-\uD82B\uD82D\uD82E\uD830-\uD833\uD837-\uD839\uD83F\uD874-\uD87D\uD87F-\uDB3F\uDB41-\uDB7F][\uDC00-\uDFFF]|\uD806[\uDC00-\uDC9F\uDCF3-\uDCFE\uDD00-\uDEBF\uDEF9-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCF9\uDD00-\uDE5F\uDE7F-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDFCC\uDFCD]|\uD836[\uDE8C-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD805[\uDC00-\uDC7F\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDDE-\uDDFF\uDE45-\uDE4F\uDE5A-\uDE7F\uDEB8-\uDEBF\uDECA-\uDEFF\uDF1A-\uDF1C\uDF2C-\uDF2F\uDF40-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56\uDC9F-\uDCA6\uDCB0-\uDCDF\uDCF3\uDCF6-\uDCFA\uDD1C-\uDD1E\uDD3A-\uDD3E\uDD40-\uDD7F\uDDB8-\uDDBB\uDDD0\uDDD1\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE34-\uDE37\uDE3B-\uDE3E\uDE48-\uDE4F\uDE59-\uDE5F\uDEA0-\uDEBF\uDEE7-\uDEEA\uDEF7-\uDEFF\uDF36-\uDF38\uDF56\uDF57\uDF73-\uDF77\uDF92-\uDF98\uDF9D-\uDFA8\uDFB0-\uDFFF]|\uD808[\uDF9A-\uDFFF]|\uD804[\uDC4E-\uDC51\uDC70-\uDC7E\uDCC2-\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD44-\uDD4F\uDD77-\uDD7F\uDDCE\uDDCF\uDDE0\uDDF5-\uDDFF\uDE12\uDE3E-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEAA-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF3B\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD82C[\uDC02-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD83E[\uDC0C-\uDC0F\uDC48-\uDC4F\uDC5A-\uDC5F\uDC88-\uDC8F\uDCAE-\uDD0F\uDD19-\uDD7F\uDD85-\uDDBF\uDDC1-\uDFFF]|\uD873[\uDEA2-\uDFFF]'
        },
        {
            name: 'Co',
            alias: 'Private_Use',
            bmp: '\uE000-\uF8FF',
            astral: '[\uDB80-\uDBBE\uDBC0-\uDBFE][\uDC00-\uDFFF]|[\uDBBF\uDBFF][\uDC00-\uDFFD]'
        },
        {
            name: 'Cs',
            alias: 'Surrogate',
            bmp: '\uD800-\uDFFF'
        },
        {
            name: 'L',
            alias: 'Letter',
            bmp: 'A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
            astral: '\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD83A[\uDC00-\uDCC4]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD80D[\uDC00-\uDC2E]|\uD87E[\uDC00-\uDE1D]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD809[\uDC80-\uDD43]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD808[\uDC00-\uDF99]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD811[\uDC00-\uDE46]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD82C[\uDC00\uDC01]|\uD873[\uDC00-\uDEA1]'
        },
        {
            name: 'Ll',
            alias: 'Lowercase_Letter',
            bmp: 'a-z\xB5\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0561-\u0587\u13F8-\u13FD\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7B5\uA7B7\uA7FA\uAB30-\uAB5A\uAB60-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A',
            astral: '\uD803[\uDCC0-\uDCF2]|\uD835[\uDC1A-\uDC33\uDC4E-\uDC54\uDC56-\uDC67\uDC82-\uDC9B\uDCB6-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDCEA-\uDD03\uDD1E-\uDD37\uDD52-\uDD6B\uDD86-\uDD9F\uDDBA-\uDDD3\uDDEE-\uDE07\uDE22-\uDE3B\uDE56-\uDE6F\uDE8A-\uDEA5\uDEC2-\uDEDA\uDEDC-\uDEE1\uDEFC-\uDF14\uDF16-\uDF1B\uDF36-\uDF4E\uDF50-\uDF55\uDF70-\uDF88\uDF8A-\uDF8F\uDFAA-\uDFC2\uDFC4-\uDFC9\uDFCB]|\uD801[\uDC28-\uDC4F]|\uD806[\uDCC0-\uDCDF]'
        },
        {
            name: 'Lm',
            alias: 'Modifier_Letter',
            bmp: '\u02B0-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0374\u037A\u0559\u0640\u06E5\u06E6\u07F4\u07F5\u07FA\u081A\u0824\u0828\u0971\u0E46\u0EC6\u10FC\u17D7\u1843\u1AA7\u1C78-\u1C7D\u1D2C-\u1D6A\u1D78\u1D9B-\u1DBF\u2071\u207F\u2090-\u209C\u2C7C\u2C7D\u2D6F\u2E2F\u3005\u3031-\u3035\u303B\u309D\u309E\u30FC-\u30FE\uA015\uA4F8-\uA4FD\uA60C\uA67F\uA69C\uA69D\uA717-\uA71F\uA770\uA788\uA7F8\uA7F9\uA9CF\uA9E6\uAA70\uAADD\uAAF3\uAAF4\uAB5C-\uAB5F\uFF70\uFF9E\uFF9F',
            astral: '\uD81A[\uDF40-\uDF43]|\uD81B[\uDF93-\uDF9F]'
        },
        {
            name: 'Lo',
            alias: 'Other_Letter',
            bmp: '\xAA\xBA\u01BB\u01C0-\u01C3\u0294\u05D0-\u05EA\u05F0-\u05F2\u0620-\u063F\u0641-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u0800-\u0815\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0972-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E45\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10D0-\u10FA\u10FD-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17DC\u1820-\u1842\u1844-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C77\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u2135-\u2138\u2D30-\u2D67\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3006\u303C\u3041-\u3096\u309F\u30A1-\u30FA\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA014\uA016-\uA48C\uA4D0-\uA4F7\uA500-\uA60B\uA610-\uA61F\uA62A\uA62B\uA66E\uA6A0-\uA6E5\uA78F\uA7F7\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9E0-\uA9E4\uA9E7-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA6F\uAA71-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB\uAADC\uAAE0-\uAAEA\uAAF2\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF66-\uFF6F\uFF71-\uFF9D\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
            astral: '\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD83A[\uDC00-\uDCC4]|\uD803[\uDC00-\uDC48]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD80D[\uDC00-\uDC2E]|\uD87E[\uDC00-\uDE1D]|\uD81B[\uDF00-\uDF44\uDF50]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCFF\uDEC0-\uDEF8]|\uD809[\uDC80-\uDD43]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD808[\uDC00-\uDF99]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF63-\uDF77\uDF7D-\uDF8F]|\uD801[\uDC50-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD811[\uDC00-\uDE46]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD82C[\uDC00\uDC01]|\uD873[\uDC00-\uDEA1]'
        },
        {
            name: 'Lt',
            alias: 'Titlecase_Letter',
            bmp: '\u01C5\u01C8\u01CB\u01F2\u1F88-\u1F8F\u1F98-\u1F9F\u1FA8-\u1FAF\u1FBC\u1FCC\u1FFC'
        },
        {
            name: 'Lu',
            alias: 'Uppercase_Letter',
            bmp: 'A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AD\uA7B0-\uA7B4\uA7B6\uFF21-\uFF3A',
            astral: '\uD806[\uDCA0-\uDCBF]|\uD803[\uDC80-\uDCB2]|\uD801[\uDC00-\uDC27]|\uD835[\uDC00-\uDC19\uDC34-\uDC4D\uDC68-\uDC81\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB5\uDCD0-\uDCE9\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD38\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD6C-\uDD85\uDDA0-\uDDB9\uDDD4-\uDDED\uDE08-\uDE21\uDE3C-\uDE55\uDE70-\uDE89\uDEA8-\uDEC0\uDEE2-\uDEFA\uDF1C-\uDF34\uDF56-\uDF6E\uDF90-\uDFA8\uDFCA]'
        },
        {
            name: 'M',
            alias: 'Mark',
            bmp: '\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFC-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C4\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F',
            astral: '\uD805[\uDCB0-\uDCC3\uDDAF-\uDDB5\uDDB8-\uDDC0\uDDDC\uDDDD\uDE30-\uDE40\uDEAB-\uDEB7\uDF1D-\uDF2B]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD804[\uDC00-\uDC02\uDC38-\uDC46\uDC7F-\uDC82\uDCB0-\uDCBA\uDD00-\uDD02\uDD27-\uDD34\uDD73\uDD80-\uDD82\uDDB3-\uDDC0\uDDCA-\uDDCC\uDE2C-\uDE37\uDEDF-\uDEEA\uDF00-\uDF03\uDF3C\uDF3E-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD81B[\uDF51-\uDF7E\uDF8F-\uDF92]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD82F[\uDC9D\uDC9E]|\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD83A[\uDCD0-\uDCD6]|\uDB40[\uDD00-\uDDEF]'
        },
        {
            name: 'Mc',
            alias: 'Spacing_Mark',
            bmp: '\u0903\u093B\u093E-\u0940\u0949-\u094C\u094E\u094F\u0982\u0983\u09BE-\u09C0\u09C7\u09C8\u09CB\u09CC\u09D7\u0A03\u0A3E-\u0A40\u0A83\u0ABE-\u0AC0\u0AC9\u0ACB\u0ACC\u0B02\u0B03\u0B3E\u0B40\u0B47\u0B48\u0B4B\u0B4C\u0B57\u0BBE\u0BBF\u0BC1\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD7\u0C01-\u0C03\u0C41-\u0C44\u0C82\u0C83\u0CBE\u0CC0-\u0CC4\u0CC7\u0CC8\u0CCA\u0CCB\u0CD5\u0CD6\u0D02\u0D03\u0D3E-\u0D40\u0D46-\u0D48\u0D4A-\u0D4C\u0D57\u0D82\u0D83\u0DCF-\u0DD1\u0DD8-\u0DDF\u0DF2\u0DF3\u0F3E\u0F3F\u0F7F\u102B\u102C\u1031\u1038\u103B\u103C\u1056\u1057\u1062-\u1064\u1067-\u106D\u1083\u1084\u1087-\u108C\u108F\u109A-\u109C\u17B6\u17BE-\u17C5\u17C7\u17C8\u1923-\u1926\u1929-\u192B\u1930\u1931\u1933-\u1938\u1A19\u1A1A\u1A55\u1A57\u1A61\u1A63\u1A64\u1A6D-\u1A72\u1B04\u1B35\u1B3B\u1B3D-\u1B41\u1B43\u1B44\u1B82\u1BA1\u1BA6\u1BA7\u1BAA\u1BE7\u1BEA-\u1BEC\u1BEE\u1BF2\u1BF3\u1C24-\u1C2B\u1C34\u1C35\u1CE1\u1CF2\u1CF3\u302E\u302F\uA823\uA824\uA827\uA880\uA881\uA8B4-\uA8C3\uA952\uA953\uA983\uA9B4\uA9B5\uA9BA\uA9BB\uA9BD-\uA9C0\uAA2F\uAA30\uAA33\uAA34\uAA4D\uAA7B\uAA7D\uAAEB\uAAEE\uAAEF\uAAF5\uABE3\uABE4\uABE6\uABE7\uABE9\uABEA\uABEC',
            astral: '\uD834[\uDD65\uDD66\uDD6D-\uDD72]|\uD804[\uDC00\uDC02\uDC82\uDCB0-\uDCB2\uDCB7\uDCB8\uDD2C\uDD82\uDDB3-\uDDB5\uDDBF\uDDC0\uDE2C-\uDE2E\uDE32\uDE33\uDE35\uDEE0-\uDEE2\uDF02\uDF03\uDF3E\uDF3F\uDF41-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63]|\uD805[\uDCB0-\uDCB2\uDCB9\uDCBB-\uDCBE\uDCC1\uDDAF-\uDDB1\uDDB8-\uDDBB\uDDBE\uDE30-\uDE32\uDE3B\uDE3C\uDE3E\uDEAC\uDEAE\uDEAF\uDEB6\uDF20\uDF21\uDF26]|\uD81B[\uDF51-\uDF7E]'
        },
        {
            name: 'Me',
            alias: 'Enclosing_Mark',
            bmp: '\u0488\u0489\u1ABE\u20DD-\u20E0\u20E2-\u20E4\uA670-\uA672'
        },
        {
            name: 'Mn',
            alias: 'Nonspacing_Mark',
            bmp: '\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08E3-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2\u09E3\u0A01\u0A02\u0A3C\u0A41\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7\u0AC8\u0ACD\u0AE2\u0AE3\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B56\u0B62\u0B63\u0B82\u0BC0\u0BCD\u0C00\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81\u0CBC\u0CBF\u0CC6\u0CCC\u0CCD\u0CE2\u0CE3\u0D01\u0D41-\u0D44\u0D4D\u0D62\u0D63\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039\u103A\u103D\u103E\u1058\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085\u1086\u108D\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DD\u180B-\u180D\u18A9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193B\u1A17\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1AB0-\u1ABD\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80\u1B81\u1BA2-\u1BA5\u1BA8\u1BA9\u1BAB-\u1BAD\u1BE6\u1BE8\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFC-\u1DFF\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302D\u3099\u309A\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA825\uA826\uA8C4\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uA9E5\uAA29-\uAA2E\uAA31\uAA32\uAA35\uAA36\uAA43\uAA4C\uAA7C\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEC\uAAED\uAAF6\uABE5\uABE8\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F',
            astral: '\uD805[\uDCB3-\uDCB8\uDCBA\uDCBF\uDCC0\uDCC2\uDCC3\uDDB2-\uDDB5\uDDBC\uDDBD\uDDBF\uDDC0\uDDDC\uDDDD\uDE33-\uDE3A\uDE3D\uDE3F\uDE40\uDEAB\uDEAD\uDEB0-\uDEB5\uDEB7\uDF1D-\uDF1F\uDF22-\uDF25\uDF27-\uDF2B]|\uD834[\uDD67-\uDD69\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E]|\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD804[\uDC01\uDC38-\uDC46\uDC7F-\uDC81\uDCB3-\uDCB6\uDCB9\uDCBA\uDD00-\uDD02\uDD27-\uDD2B\uDD2D-\uDD34\uDD73\uDD80\uDD81\uDDB6-\uDDBE\uDDCA-\uDDCC\uDE2F-\uDE31\uDE34\uDE36\uDE37\uDEDF\uDEE3-\uDEEA\uDF00\uDF01\uDF3C\uDF40\uDF66-\uDF6C\uDF70-\uDF74]|\uD83A[\uDCD0-\uDCD6]|\uDB40[\uDD00-\uDDEF]'
        },
        {
            name: 'N',
            alias: 'Number',
            bmp: '0-9\xB2\xB3\xB9\xBC-\xBE\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u09F4-\u09F9\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0B72-\u0B77\u0BE6-\u0BF2\u0C66-\u0C6F\u0C78-\u0C7E\u0CE6-\u0CEF\u0D66-\u0D75\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F33\u1040-\u1049\u1090-\u1099\u1369-\u137C\u16EE-\u16F0\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1946-\u194F\u19D0-\u19DA\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\u2070\u2074-\u2079\u2080-\u2089\u2150-\u2182\u2185-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3007\u3021-\u3029\u3038-\u303A\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA620-\uA629\uA6E6-\uA6EF\uA830-\uA835\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19',
            astral: '\uD800[\uDD07-\uDD33\uDD40-\uDD78\uDD8A\uDD8B\uDEE1-\uDEFB\uDF20-\uDF23\uDF41\uDF4A\uDFD1-\uDFD5]|\uD801[\uDCA0-\uDCA9]|\uD803[\uDCFA-\uDCFF\uDE60-\uDE7E]|\uD835[\uDFCE-\uDFFF]|\uD83A[\uDCC7-\uDCCF]|\uD81A[\uDE60-\uDE69\uDF50-\uDF59\uDF5B-\uDF61]|\uD806[\uDCE0-\uDCF2]|\uD804[\uDC52-\uDC6F\uDCF0-\uDCF9\uDD36-\uDD3F\uDDD0-\uDDD9\uDDE1-\uDDF4\uDEF0-\uDEF9]|\uD834[\uDF60-\uDF71]|\uD83C[\uDD00-\uDD0C]|\uD809[\uDC00-\uDC6E]|\uD802[\uDC58-\uDC5F\uDC79-\uDC7F\uDCA7-\uDCAF\uDCFB-\uDCFF\uDD16-\uDD1B\uDDBC\uDDBD\uDDC0-\uDDCF\uDDD2-\uDDFF\uDE40-\uDE47\uDE7D\uDE7E\uDE9D-\uDE9F\uDEEB-\uDEEF\uDF58-\uDF5F\uDF78-\uDF7F\uDFA9-\uDFAF]|\uD805[\uDCD0-\uDCD9\uDE50-\uDE59\uDEC0-\uDEC9\uDF30-\uDF3B]'
        },
        {
            name: 'Nd',
            alias: 'Decimal_Number',
            bmp: '0-9\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29\u1040-\u1049\u1090-\u1099\u17E0-\u17E9\u1810-\u1819\u1946-\u194F\u19D0-\u19D9\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\uA620-\uA629\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19',
            astral: '\uD801[\uDCA0-\uDCA9]|\uD835[\uDFCE-\uDFFF]|\uD805[\uDCD0-\uDCD9\uDE50-\uDE59\uDEC0-\uDEC9\uDF30-\uDF39]|\uD806[\uDCE0-\uDCE9]|\uD804[\uDC66-\uDC6F\uDCF0-\uDCF9\uDD36-\uDD3F\uDDD0-\uDDD9\uDEF0-\uDEF9]|\uD81A[\uDE60-\uDE69\uDF50-\uDF59]'
        },
        {
            name: 'Nl',
            alias: 'Letter_Number',
            bmp: '\u16EE-\u16F0\u2160-\u2182\u2185-\u2188\u3007\u3021-\u3029\u3038-\u303A\uA6E6-\uA6EF',
            astral: '\uD809[\uDC00-\uDC6E]|\uD800[\uDD40-\uDD74\uDF41\uDF4A\uDFD1-\uDFD5]'
        },
        {
            name: 'No',
            alias: 'Other_Number',
            bmp: '\xB2\xB3\xB9\xBC-\xBE\u09F4-\u09F9\u0B72-\u0B77\u0BF0-\u0BF2\u0C78-\u0C7E\u0D70-\u0D75\u0F2A-\u0F33\u1369-\u137C\u17F0-\u17F9\u19DA\u2070\u2074-\u2079\u2080-\u2089\u2150-\u215F\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA830-\uA835',
            astral: '\uD804[\uDC52-\uDC65\uDDE1-\uDDF4]|\uD803[\uDCFA-\uDCFF\uDE60-\uDE7E]|\uD83C[\uDD00-\uDD0C]|\uD806[\uDCEA-\uDCF2]|\uD83A[\uDCC7-\uDCCF]|\uD802[\uDC58-\uDC5F\uDC79-\uDC7F\uDCA7-\uDCAF\uDCFB-\uDCFF\uDD16-\uDD1B\uDDBC\uDDBD\uDDC0-\uDDCF\uDDD2-\uDDFF\uDE40-\uDE47\uDE7D\uDE7E\uDE9D-\uDE9F\uDEEB-\uDEEF\uDF58-\uDF5F\uDF78-\uDF7F\uDFA9-\uDFAF]|\uD805[\uDF3A\uDF3B]|\uD81A[\uDF5B-\uDF61]|\uD834[\uDF60-\uDF71]|\uD800[\uDD07-\uDD33\uDD75-\uDD78\uDD8A\uDD8B\uDEE1-\uDEFB\uDF20-\uDF23]'
        },
        {
            name: 'P',
            alias: 'Punctuation',
            bmp: '\x21-\x23\x25-\\x2A\x2C-\x2F\x3A\x3B\\x3F\x40\\x5B-\\x5D\x5F\\x7B\x7D\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65',
            astral: '\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD809[\uDC70-\uDC74]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD836[\uDE87-\uDE8B]|\uD801\uDD6F|\uD82F\uDC9F|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]'
        },
        {
            name: 'Pc',
            alias: 'Connector_Punctuation',
            bmp: '\x5F\u203F\u2040\u2054\uFE33\uFE34\uFE4D-\uFE4F\uFF3F'
        },
        {
            name: 'Pd',
            alias: 'Dash_Punctuation',
            bmp: '\\x2D\u058A\u05BE\u1400\u1806\u2010-\u2015\u2E17\u2E1A\u2E3A\u2E3B\u2E40\u301C\u3030\u30A0\uFE31\uFE32\uFE58\uFE63\uFF0D'
        },
        {
            name: 'Pe',
            alias: 'Close_Punctuation',
            bmp: '\\x29\\x5D\x7D\u0F3B\u0F3D\u169C\u2046\u207E\u208E\u2309\u230B\u232A\u2769\u276B\u276D\u276F\u2771\u2773\u2775\u27C6\u27E7\u27E9\u27EB\u27ED\u27EF\u2984\u2986\u2988\u298A\u298C\u298E\u2990\u2992\u2994\u2996\u2998\u29D9\u29DB\u29FD\u2E23\u2E25\u2E27\u2E29\u3009\u300B\u300D\u300F\u3011\u3015\u3017\u3019\u301B\u301E\u301F\uFD3E\uFE18\uFE36\uFE38\uFE3A\uFE3C\uFE3E\uFE40\uFE42\uFE44\uFE48\uFE5A\uFE5C\uFE5E\uFF09\uFF3D\uFF5D\uFF60\uFF63'
        },
        {
            name: 'Pf',
            alias: 'Final_Punctuation',
            bmp: '\xBB\u2019\u201D\u203A\u2E03\u2E05\u2E0A\u2E0D\u2E1D\u2E21'
        },
        {
            name: 'Pi',
            alias: 'Initial_Punctuation',
            bmp: '\xAB\u2018\u201B\u201C\u201F\u2039\u2E02\u2E04\u2E09\u2E0C\u2E1C\u2E20'
        },
        {
            name: 'Po',
            alias: 'Other_Punctuation',
            bmp: '\x21-\x23\x25-\x27\\x2A\x2C\\x2E\x2F\x3A\x3B\\x3F\x40\\x5C\xA1\xA7\xB6\xB7\xBF\u037E\u0387\u055A-\u055F\u0589\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u166D\u166E\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u1805\u1807-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2016\u2017\u2020-\u2027\u2030-\u2038\u203B-\u203E\u2041-\u2043\u2047-\u2051\u2053\u2055-\u205E\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00\u2E01\u2E06-\u2E08\u2E0B\u2E0E-\u2E16\u2E18\u2E19\u2E1B\u2E1E\u2E1F\u2E2A-\u2E2E\u2E30-\u2E39\u2E3C-\u2E3F\u2E41\u3001-\u3003\u303D\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFE10-\uFE16\uFE19\uFE30\uFE45\uFE46\uFE49-\uFE4C\uFE50-\uFE52\uFE54-\uFE57\uFE5F-\uFE61\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF07\uFF0A\uFF0C\uFF0E\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3C\uFF61\uFF64\uFF65',
            astral: '\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD809[\uDC70-\uDC74]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD836[\uDE87-\uDE8B]|\uD801\uDD6F|\uD82F\uDC9F|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]'
        },
        {
            name: 'Ps',
            alias: 'Open_Punctuation',
            bmp: '\\x28\\x5B\\x7B\u0F3A\u0F3C\u169B\u201A\u201E\u2045\u207D\u208D\u2308\u230A\u2329\u2768\u276A\u276C\u276E\u2770\u2772\u2774\u27C5\u27E6\u27E8\u27EA\u27EC\u27EE\u2983\u2985\u2987\u2989\u298B\u298D\u298F\u2991\u2993\u2995\u2997\u29D8\u29DA\u29FC\u2E22\u2E24\u2E26\u2E28\u2E42\u3008\u300A\u300C\u300E\u3010\u3014\u3016\u3018\u301A\u301D\uFD3F\uFE17\uFE35\uFE37\uFE39\uFE3B\uFE3D\uFE3F\uFE41\uFE43\uFE47\uFE59\uFE5B\uFE5D\uFF08\uFF3B\uFF5B\uFF5F\uFF62'
        },
        {
            name: 'S',
            alias: 'Symbol',
            bmp: '\\x24\\x2B\x3C-\x3E\\x5E\x60\\x7C\x7E\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20BE\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u23FA\u2400-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B98-\u2BB9\u2BBD-\u2BC8\u2BCA-\u2BD1\u2BEC-\u2BEF\u2CE5-\u2CEA\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u32FE\u3300-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uFB29\uFBB2-\uFBC1\uFDFC\uFDFD\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD',
            astral: '\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDD10-\uDD18\uDD80-\uDD84\uDDC0]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD10-\uDD2E\uDD30-\uDD6B\uDD70-\uDD9A\uDDE6-\uDE02\uDE10-\uDE3A\uDE40-\uDE48\uDE50\uDE51\uDF00-\uDFFF]|\uD83D[\uDC00-\uDD79\uDD7B-\uDDA3\uDDA5-\uDED0\uDEE0-\uDEEC\uDEF0-\uDEF3\uDF00-\uDF73\uDF80-\uDFD4]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C\uDD90-\uDD9B\uDDA0\uDDD0-\uDDFC]|\uD82F\uDC9C|\uD805\uDF3F|\uD802[\uDC77\uDC78\uDEC8]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDE8\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD83B[\uDEF0\uDEF1]'
        },
        {
            name: 'Sc',
            alias: 'Currency_Symbol',
            bmp: '\\x24\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BE\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6'
        },
        {
            name: 'Sk',
            alias: 'Modifier_Symbol',
            bmp: '\\x5E\x60\xA8\xAF\xB4\xB8\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u309B\u309C\uA700-\uA716\uA720\uA721\uA789\uA78A\uAB5B\uFBB2-\uFBC1\uFF3E\uFF40\uFFE3',
            astral: '\uD83C[\uDFFB-\uDFFF]'
        },
        {
            name: 'Sm',
            alias: 'Math_Symbol',
            bmp: '\\x2B\x3C-\x3E\\x7C\x7E\xAC\xB1\xD7\xF7\u03F6\u0606-\u0608\u2044\u2052\u207A-\u207C\u208A-\u208C\u2118\u2140-\u2144\u214B\u2190-\u2194\u219A\u219B\u21A0\u21A3\u21A6\u21AE\u21CE\u21CF\u21D2\u21D4\u21F4-\u22FF\u2320\u2321\u237C\u239B-\u23B3\u23DC-\u23E1\u25B7\u25C1\u25F8-\u25FF\u266F\u27C0-\u27C4\u27C7-\u27E5\u27F0-\u27FF\u2900-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2AFF\u2B30-\u2B44\u2B47-\u2B4C\uFB29\uFE62\uFE64-\uFE66\uFF0B\uFF1C-\uFF1E\uFF5C\uFF5E\uFFE2\uFFE9-\uFFEC',
            astral: '\uD83B[\uDEF0\uDEF1]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]'
        },
        {
            name: 'So',
            alias: 'Other_Symbol',
            bmp: '\xA6\xA9\xAE\xB0\u0482\u058D\u058E\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u09FA\u0B70\u0BF3-\u0BF8\u0BFA\u0C7F\u0D79\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116\u2117\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u214A\u214C\u214D\u214F\u218A\u218B\u2195-\u2199\u219C-\u219F\u21A1\u21A2\u21A4\u21A5\u21A7-\u21AD\u21AF-\u21CD\u21D0\u21D1\u21D3\u21D5-\u21F3\u2300-\u2307\u230C-\u231F\u2322-\u2328\u232B-\u237B\u237D-\u239A\u23B4-\u23DB\u23E2-\u23FA\u2400-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u25B6\u25B8-\u25C0\u25C2-\u25F7\u2600-\u266E\u2670-\u2767\u2794-\u27BF\u2800-\u28FF\u2B00-\u2B2F\u2B45\u2B46\u2B4D-\u2B73\u2B76-\u2B95\u2B98-\u2BB9\u2BBD-\u2BC8\u2BCA-\u2BD1\u2BEC-\u2BEF\u2CE5-\u2CEA\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u32FE\u3300-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA828-\uA82B\uA836\uA837\uA839\uAA77-\uAA79\uFDFD\uFFE4\uFFE8\uFFED\uFFEE\uFFFC\uFFFD',
            astral: '\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDD10-\uDD18\uDD80-\uDD84\uDDC0]|\uD83D[\uDC00-\uDD79\uDD7B-\uDDA3\uDDA5-\uDED0\uDEE0-\uDEEC\uDEF0-\uDEF3\uDF00-\uDF73\uDF80-\uDFD4]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD10-\uDD2E\uDD30-\uDD6B\uDD70-\uDD9A\uDDE6-\uDE02\uDE10-\uDE3A\uDE40-\uDE48\uDE50\uDE51\uDF00-\uDFFA]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C\uDD90-\uDD9B\uDDA0\uDDD0-\uDDFC]|\uD82F\uDC9C|\uD805\uDF3F|\uD802[\uDC77\uDC78\uDEC8]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDE8\uDE00-\uDE41\uDE45\uDF00-\uDF56]'
        },
        {
            name: 'Z',
            alias: 'Separator',
            bmp: '\x20\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000'
        },
        {
            name: 'Zl',
            alias: 'Line_Separator',
            bmp: '\u2028'
        },
        {
            name: 'Zp',
            alias: 'Paragraph_Separator',
            bmp: '\u2029'
        },
        {
            name: 'Zs',
            alias: 'Space_Separator',
            bmp: '\x20\xA0\u1680\u2000-\u200A\u202F\u205F\u3000'
        }
    ]);

};


/***/ }),
/* 39 */
/***/ (function(module, exports) {

/*!
 * XRegExp Unicode Properties 3.1.1
 * <xregexp.com>
 * Steven Levithan (c) 2012-2016 MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */

module.exports = function(XRegExp) {
    'use strict';

    /**
     * Adds properties to meet the UTS #18 Level 1 RL1.2 requirements for Unicode regex support. See
     * <http://unicode.org/reports/tr18/#RL1.2>. Following are definitions of these properties from
     * UAX #44 <http://unicode.org/reports/tr44/>:
     *
     * - Alphabetic
     *   Characters with the Alphabetic property. Generated from: Lowercase + Uppercase + Lt + Lm +
     *   Lo + Nl + Other_Alphabetic.
     *
     * - Default_Ignorable_Code_Point
     *   For programmatic determination of default ignorable code points. New characters that should
     *   be ignored in rendering (unless explicitly supported) will be assigned in these ranges,
     *   permitting programs to correctly handle the default rendering of such characters when not
     *   otherwise supported.
     *
     * - Lowercase
     *   Characters with the Lowercase property. Generated from: Ll + Other_Lowercase.
     *
     * - Noncharacter_Code_Point
     *   Code points permanently reserved for internal use.
     *
     * - Uppercase
     *   Characters with the Uppercase property. Generated from: Lu + Other_Uppercase.
     *
     * - White_Space
     *   Spaces, separator characters and other control characters which should be treated by
     *   programming languages as "white space" for the purpose of parsing elements.
     *
     * The properties ASCII, Any, and Assigned are also included but are not defined in UAX #44. UTS
     * #18 RL1.2 additionally requires support for Unicode scripts and general categories. These are
     * included in XRegExp's Unicode Categories and Unicode Scripts addons.
     *
     * Token names are case insensitive, and any spaces, hyphens, and underscores are ignored.
     *
     * Uses Unicode 8.0.0.
     *
     * @requires XRegExp, Unicode Base
     */

    if (!XRegExp.addUnicodeData) {
        throw new ReferenceError('Unicode Base must be loaded before Unicode Properties');
    }

    var unicodeData = [
        {
            name: 'ASCII',
            bmp: '\0-\x7F'
        },
        {
            name: 'Alphabetic',
            bmp: 'A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0345\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0657\u0659-\u065F\u066E-\u06D3\u06D5-\u06DC\u06E1-\u06E8\u06ED-\u06EF\u06FA-\u06FC\u06FF\u0710-\u073F\u074D-\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0817\u081A-\u082C\u0840-\u0858\u08A0-\u08B4\u08E3-\u08E9\u08F0-\u093B\u093D-\u094C\u094E-\u0950\u0955-\u0963\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD-\u09C4\u09C7\u09C8\u09CB\u09CC\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09F0\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3E-\u0A42\u0A47\u0A48\u0A4B\u0A4C\u0A51\u0A59-\u0A5C\u0A5E\u0A70-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD-\u0AC5\u0AC7-\u0AC9\u0ACB\u0ACC\u0AD0\u0AE0-\u0AE3\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D-\u0B44\u0B47\u0B48\u0B4B\u0B4C\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD0\u0BD7\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4C\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCC\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4C\u0D4E\u0D57\u0D5F-\u0D63\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E46\u0E4D\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0ECD\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F71-\u0F81\u0F88-\u0F97\u0F99-\u0FBC\u1000-\u1036\u1038\u103B-\u103F\u1050-\u1062\u1065-\u1068\u106E-\u1086\u108E\u109C\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1713\u1720-\u1733\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17B3\u17B6-\u17C8\u17D7\u17DC\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u1938\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A1B\u1A20-\u1A5E\u1A61-\u1A74\u1AA7\u1B00-\u1B33\u1B35-\u1B43\u1B45-\u1B4B\u1B80-\u1BA9\u1BAC-\u1BAF\u1BBA-\u1BE5\u1BE7-\u1BF1\u1C00-\u1C35\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1D00-\u1DBF\u1DE7-\u1DF4\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u24B6-\u24E9\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA674-\uA67B\uA67F-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA827\uA840-\uA873\uA880-\uA8C3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA92A\uA930-\uA952\uA960-\uA97C\uA980-\uA9B2\uA9B4-\uA9BF\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA60-\uAA76\uAA7A\uAA7E-\uAABE\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF5\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
            astral: '\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD804[\uDC00-\uDC45\uDC82-\uDCB8\uDCD0-\uDCE8\uDD00-\uDD32\uDD50-\uDD72\uDD76\uDD80-\uDDBF\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE34\uDE37\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEE8\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D-\uDF44\uDF47\uDF48\uDF4B\uDF4C\uDF50\uDF57\uDF5D-\uDF63]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD83A[\uDC00-\uDCC4]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF36\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD83C[\uDD30-\uDD49\uDD50-\uDD69\uDD70-\uDD89]|\uD80D[\uDC00-\uDC2E]|\uD87E[\uDC00-\uDE1D]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9E]|\uD808[\uDC00-\uDF99]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD805[\uDC80-\uDCC1\uDCC4\uDCC5\uDCC7\uDD80-\uDDB5\uDDB8-\uDDBE\uDDD8-\uDDDD\uDE00-\uDE3E\uDE40\uDE44\uDE80-\uDEB5\uDF00-\uDF19\uDF1D-\uDF2A]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD811[\uDC00-\uDE46]|\uD82C[\uDC00\uDC01]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF93-\uDF9F]|\uD873[\uDC00-\uDEA1]'
        },
        {
            name: 'Any',
            isBmpLast: true,
            bmp: '\0-\uFFFF',
            astral: '[\uD800-\uDBFF][\uDC00-\uDFFF]'
        },
        {
            name: 'Default_Ignorable_Code_Point',
            bmp: '\xAD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF0-\uFFF8',
            astral: '[\uDB40-\uDB43][\uDC00-\uDFFF]|\uD834[\uDD73-\uDD7A]|\uD82F[\uDCA0-\uDCA3]'
        },
        {
            name: 'Lowercase',
            bmp: 'a-z\xAA\xB5\xBA\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02B8\u02C0\u02C1\u02E0-\u02E4\u0345\u0371\u0373\u0377\u037A-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0561-\u0587\u13F8-\u13FD\u1D00-\u1DBF\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u2071\u207F\u2090-\u209C\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2170-\u217F\u2184\u24D0-\u24E9\u2C30-\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7D\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B-\uA69D\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7B5\uA7B7\uA7F8-\uA7FA\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A',
            astral: '\uD803[\uDCC0-\uDCF2]|\uD835[\uDC1A-\uDC33\uDC4E-\uDC54\uDC56-\uDC67\uDC82-\uDC9B\uDCB6-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDCEA-\uDD03\uDD1E-\uDD37\uDD52-\uDD6B\uDD86-\uDD9F\uDDBA-\uDDD3\uDDEE-\uDE07\uDE22-\uDE3B\uDE56-\uDE6F\uDE8A-\uDEA5\uDEC2-\uDEDA\uDEDC-\uDEE1\uDEFC-\uDF14\uDF16-\uDF1B\uDF36-\uDF4E\uDF50-\uDF55\uDF70-\uDF88\uDF8A-\uDF8F\uDFAA-\uDFC2\uDFC4-\uDFC9\uDFCB]|\uD801[\uDC28-\uDC4F]|\uD806[\uDCC0-\uDCDF]'
        },
        {
            name: 'Noncharacter_Code_Point',
            bmp: '\uFDD0-\uFDEF\uFFFE\uFFFF',
            astral: '[\uDB3F\uDB7F\uDBBF\uDBFF\uD83F\uD87F\uD8BF\uDAFF\uD97F\uD9BF\uD9FF\uDA3F\uD8FF\uDABF\uDA7F\uD93F][\uDFFE\uDFFF]'
        },
        {
            name: 'Uppercase',
            bmp: 'A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2160-\u216F\u2183\u24B6-\u24CF\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AD\uA7B0-\uA7B4\uA7B6\uFF21-\uFF3A',
            astral: '\uD806[\uDCA0-\uDCBF]|\uD803[\uDC80-\uDCB2]|\uD835[\uDC00-\uDC19\uDC34-\uDC4D\uDC68-\uDC81\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB5\uDCD0-\uDCE9\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD38\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD6C-\uDD85\uDDA0-\uDDB9\uDDD4-\uDDED\uDE08-\uDE21\uDE3C-\uDE55\uDE70-\uDE89\uDEA8-\uDEC0\uDEE2-\uDEFA\uDF1C-\uDF34\uDF56-\uDF6E\uDF90-\uDFA8\uDFCA]|\uD801[\uDC00-\uDC27]|\uD83C[\uDD30-\uDD49\uDD50-\uDD69\uDD70-\uDD89]'
        },
        {
            name: 'White_Space',
            bmp: '\x09-\x0D\x20\x85\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000'
        }
    ];

    // Add non-generated data
    unicodeData.push({
        name: 'Assigned',
        // Since this is defined as the inverse of Unicode category Cn (Unassigned), the Unicode
        // Categories addon is required to use this property
        inverseOf: 'Cn'
    });

    XRegExp.addUnicodeData(unicodeData);

};


/***/ }),
/* 40 */
/***/ (function(module, exports) {

/*!
 * XRegExp Unicode Scripts 3.1.1
 * <xregexp.com>
 * Steven Levithan (c) 2010-2016 MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */

module.exports = function(XRegExp) {
    'use strict';

    /**
     * Adds support for all Unicode scripts. E.g., `\p{Latin}`. Token names are case insensitive,
     * and any spaces, hyphens, and underscores are ignored.
     *
     * Uses Unicode 8.0.0.
     *
     * @requires XRegExp, Unicode Base
     */

    if (!XRegExp.addUnicodeData) {
        throw new ReferenceError('Unicode Base must be loaded before Unicode Scripts');
    }

    XRegExp.addUnicodeData([
        {
            name: 'Ahom',
            astral: '\uD805[\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF3F]'
        },
        {
            name: 'Anatolian_Hieroglyphs',
            astral: '\uD811[\uDC00-\uDE46]'
        },
        {
            name: 'Arabic',
            bmp: '\u0600-\u0604\u0606-\u060B\u060D-\u061A\u061E\u0620-\u063F\u0641-\u064A\u0656-\u066F\u0671-\u06DC\u06DE-\u06FF\u0750-\u077F\u08A0-\u08B4\u08E3-\u08FF\uFB50-\uFBC1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFD\uFE70-\uFE74\uFE76-\uFEFC',
            astral: '\uD803[\uDE60-\uDE7E]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB\uDEF0\uDEF1]'
        },
        {
            name: 'Armenian',
            bmp: '\u0531-\u0556\u0559-\u055F\u0561-\u0587\u058A\u058D-\u058F\uFB13-\uFB17'
        },
        {
            name: 'Avestan',
            astral: '\uD802[\uDF00-\uDF35\uDF39-\uDF3F]'
        },
        {
            name: 'Balinese',
            bmp: '\u1B00-\u1B4B\u1B50-\u1B7C'
        },
        {
            name: 'Bamum',
            bmp: '\uA6A0-\uA6F7',
            astral: '\uD81A[\uDC00-\uDE38]'
        },
        {
            name: 'Bassa_Vah',
            astral: '\uD81A[\uDED0-\uDEED\uDEF0-\uDEF5]'
        },
        {
            name: 'Batak',
            bmp: '\u1BC0-\u1BF3\u1BFC-\u1BFF'
        },
        {
            name: 'Bengali',
            bmp: '\u0980-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09FB'
        },
        {
            name: 'Bopomofo',
            bmp: '\u02EA\u02EB\u3105-\u312D\u31A0-\u31BA'
        },
        {
            name: 'Brahmi',
            astral: '\uD804[\uDC00-\uDC4D\uDC52-\uDC6F\uDC7F]'
        },
        {
            name: 'Braille',
            bmp: '\u2800-\u28FF'
        },
        {
            name: 'Buginese',
            bmp: '\u1A00-\u1A1B\u1A1E\u1A1F'
        },
        {
            name: 'Buhid',
            bmp: '\u1740-\u1753'
        },
        {
            name: 'Canadian_Aboriginal',
            bmp: '\u1400-\u167F\u18B0-\u18F5'
        },
        {
            name: 'Carian',
            astral: '\uD800[\uDEA0-\uDED0]'
        },
        {
            name: 'Caucasian_Albanian',
            astral: '\uD801[\uDD30-\uDD63\uDD6F]'
        },
        {
            name: 'Chakma',
            astral: '\uD804[\uDD00-\uDD34\uDD36-\uDD43]'
        },
        {
            name: 'Cham',
            bmp: '\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA5C-\uAA5F'
        },
        {
            name: 'Cherokee',
            bmp: '\u13A0-\u13F5\u13F8-\u13FD\uAB70-\uABBF'
        },
        {
            name: 'Common',
            bmp: '\0-\x40\\x5B-\x60\\x7B-\xA9\xAB-\xB9\xBB-\xBF\xD7\xF7\u02B9-\u02DF\u02E5-\u02E9\u02EC-\u02FF\u0374\u037E\u0385\u0387\u0589\u0605\u060C\u061B\u061C\u061F\u0640\u06DD\u0964\u0965\u0E3F\u0FD5-\u0FD8\u10FB\u16EB-\u16ED\u1735\u1736\u1802\u1803\u1805\u1CD3\u1CE1\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u2000-\u200B\u200E-\u2064\u2066-\u2070\u2074-\u207E\u2080-\u208E\u20A0-\u20BE\u2100-\u2125\u2127-\u2129\u212C-\u2131\u2133-\u214D\u214F-\u215F\u2189-\u218B\u2190-\u23FA\u2400-\u2426\u2440-\u244A\u2460-\u27FF\u2900-\u2B73\u2B76-\u2B95\u2B98-\u2BB9\u2BBD-\u2BC8\u2BCA-\u2BD1\u2BEC-\u2BEF\u2E00-\u2E42\u2FF0-\u2FFB\u3000-\u3004\u3006\u3008-\u3020\u3030-\u3037\u303C-\u303F\u309B\u309C\u30A0\u30FB\u30FC\u3190-\u319F\u31C0-\u31E3\u3220-\u325F\u327F-\u32CF\u3358-\u33FF\u4DC0-\u4DFF\uA700-\uA721\uA788-\uA78A\uA830-\uA839\uA92E\uA9CF\uAB5B\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFEFF\uFF01-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\uFF70\uFF9E\uFF9F\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFF9-\uFFFD',
            astral: '\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDD10-\uDD18\uDD80-\uDD84\uDDC0]|\uD82F[\uDCA0-\uDCA3]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDFCB\uDFCE-\uDFFF]|\uDB40[\uDC01\uDC20-\uDC7F]|\uD83D[\uDC00-\uDD79\uDD7B-\uDDA3\uDDA5-\uDED0\uDEE0-\uDEEC\uDEF0-\uDEF3\uDF00-\uDF73\uDF80-\uDFD4]|\uD800[\uDD00-\uDD02\uDD07-\uDD33\uDD37-\uDD3F\uDD90-\uDD9B\uDDD0-\uDDFC\uDEE1-\uDEFB]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD66\uDD6A-\uDD7A\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDE8\uDF00-\uDF56\uDF60-\uDF71]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD00-\uDD0C\uDD10-\uDD2E\uDD30-\uDD6B\uDD70-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE10-\uDE3A\uDE40-\uDE48\uDE50\uDE51\uDF00-\uDFFF]'
        },
        {
            name: 'Coptic',
            bmp: '\u03E2-\u03EF\u2C80-\u2CF3\u2CF9-\u2CFF'
        },
        {
            name: 'Cuneiform',
            astral: '\uD809[\uDC00-\uDC6E\uDC70-\uDC74\uDC80-\uDD43]|\uD808[\uDC00-\uDF99]'
        },
        {
            name: 'Cypriot',
            astral: '\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F]'
        },
        {
            name: 'Cyrillic',
            bmp: '\u0400-\u0484\u0487-\u052F\u1D2B\u1D78\u2DE0-\u2DFF\uA640-\uA69F\uFE2E\uFE2F'
        },
        {
            name: 'Deseret',
            astral: '\uD801[\uDC00-\uDC4F]'
        },
        {
            name: 'Devanagari',
            bmp: '\u0900-\u0950\u0953-\u0963\u0966-\u097F\uA8E0-\uA8FD'
        },
        {
            name: 'Duployan',
            astral: '\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9C-\uDC9F]'
        },
        {
            name: 'Egyptian_Hieroglyphs',
            astral: '\uD80C[\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]'
        },
        {
            name: 'Elbasan',
            astral: '\uD801[\uDD00-\uDD27]'
        },
        {
            name: 'Ethiopic',
            bmp: '\u1200-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u137C\u1380-\u1399\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E'
        },
        {
            name: 'Georgian',
            bmp: '\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u10FF\u2D00-\u2D25\u2D27\u2D2D'
        },
        {
            name: 'Glagolitic',
            bmp: '\u2C00-\u2C2E\u2C30-\u2C5E'
        },
        {
            name: 'Gothic',
            astral: '\uD800[\uDF30-\uDF4A]'
        },
        {
            name: 'Grantha',
            astral: '\uD804[\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]'
        },
        {
            name: 'Greek',
            bmp: '\u0370-\u0373\u0375-\u0377\u037A-\u037D\u037F\u0384\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03E1\u03F0-\u03FF\u1D26-\u1D2A\u1D5D-\u1D61\u1D66-\u1D6A\u1DBF\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FC4\u1FC6-\u1FD3\u1FD6-\u1FDB\u1FDD-\u1FEF\u1FF2-\u1FF4\u1FF6-\u1FFE\u2126\uAB65',
            astral: '\uD800[\uDD40-\uDD8C\uDDA0]|\uD834[\uDE00-\uDE45]'
        },
        {
            name: 'Gujarati',
            bmp: '\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AF1\u0AF9'
        },
        {
            name: 'Gurmukhi',
            bmp: '\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75'
        },
        {
            name: 'Han',
            bmp: '\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DB5\u4E00-\u9FD5\uF900-\uFA6D\uFA70-\uFAD9',
            astral: '\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD87E[\uDC00-\uDE1D]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD873[\uDC00-\uDEA1]'
        },
        {
            name: 'Hangul',
            bmp: '\u1100-\u11FF\u302E\u302F\u3131-\u318E\u3200-\u321E\u3260-\u327E\uA960-\uA97C\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC'
        },
        {
            name: 'Hanunoo',
            bmp: '\u1720-\u1734'
        },
        {
            name: 'Hatran',
            astral: '\uD802[\uDCE0-\uDCF2\uDCF4\uDCF5\uDCFB-\uDCFF]'
        },
        {
            name: 'Hebrew',
            bmp: '\u0591-\u05C7\u05D0-\u05EA\u05F0-\u05F4\uFB1D-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFB4F'
        },
        {
            name: 'Hiragana',
            bmp: '\u3041-\u3096\u309D-\u309F',
            astral: '\uD82C\uDC01|\uD83C\uDE00'
        },
        {
            name: 'Imperial_Aramaic',
            astral: '\uD802[\uDC40-\uDC55\uDC57-\uDC5F]'
        },
        {
            name: 'Inherited',
            bmp: '\u0300-\u036F\u0485\u0486\u064B-\u0655\u0670\u0951\u0952\u1AB0-\u1ABE\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFC-\u1DFF\u200C\u200D\u20D0-\u20F0\u302A-\u302D\u3099\u309A\uFE00-\uFE0F\uFE20-\uFE2D',
            astral: '\uD834[\uDD67-\uDD69\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD]|\uD800[\uDDFD\uDEE0]|\uDB40[\uDD00-\uDDEF]'
        },
        {
            name: 'Inscriptional_Pahlavi',
            astral: '\uD802[\uDF60-\uDF72\uDF78-\uDF7F]'
        },
        {
            name: 'Inscriptional_Parthian',
            astral: '\uD802[\uDF40-\uDF55\uDF58-\uDF5F]'
        },
        {
            name: 'Javanese',
            bmp: '\uA980-\uA9CD\uA9D0-\uA9D9\uA9DE\uA9DF'
        },
        {
            name: 'Kaithi',
            astral: '\uD804[\uDC80-\uDCC1]'
        },
        {
            name: 'Kannada',
            bmp: '\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2'
        },
        {
            name: 'Katakana',
            bmp: '\u30A1-\u30FA\u30FD-\u30FF\u31F0-\u31FF\u32D0-\u32FE\u3300-\u3357\uFF66-\uFF6F\uFF71-\uFF9D',
            astral: '\uD82C\uDC00'
        },
        {
            name: 'Kayah_Li',
            bmp: '\uA900-\uA92D\uA92F'
        },
        {
            name: 'Kharoshthi',
            astral: '\uD802[\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F-\uDE47\uDE50-\uDE58]'
        },
        {
            name: 'Khmer',
            bmp: '\u1780-\u17DD\u17E0-\u17E9\u17F0-\u17F9\u19E0-\u19FF'
        },
        {
            name: 'Khojki',
            astral: '\uD804[\uDE00-\uDE11\uDE13-\uDE3D]'
        },
        {
            name: 'Khudawadi',
            astral: '\uD804[\uDEB0-\uDEEA\uDEF0-\uDEF9]'
        },
        {
            name: 'Lao',
            bmp: '\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF'
        },
        {
            name: 'Latin',
            bmp: 'A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A'
        },
        {
            name: 'Lepcha',
            bmp: '\u1C00-\u1C37\u1C3B-\u1C49\u1C4D-\u1C4F'
        },
        {
            name: 'Limbu',
            bmp: '\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1940\u1944-\u194F'
        },
        {
            name: 'Linear_A',
            astral: '\uD801[\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]'
        },
        {
            name: 'Linear_B',
            astral: '\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA]'
        },
        {
            name: 'Lisu',
            bmp: '\uA4D0-\uA4FF'
        },
        {
            name: 'Lycian',
            astral: '\uD800[\uDE80-\uDE9C]'
        },
        {
            name: 'Lydian',
            astral: '\uD802[\uDD20-\uDD39\uDD3F]'
        },
        {
            name: 'Mahajani',
            astral: '\uD804[\uDD50-\uDD76]'
        },
        {
            name: 'Malayalam',
            bmp: '\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D5F-\u0D63\u0D66-\u0D75\u0D79-\u0D7F'
        },
        {
            name: 'Mandaic',
            bmp: '\u0840-\u085B\u085E'
        },
        {
            name: 'Manichaean',
            astral: '\uD802[\uDEC0-\uDEE6\uDEEB-\uDEF6]'
        },
        {
            name: 'Meetei_Mayek',
            bmp: '\uAAE0-\uAAF6\uABC0-\uABED\uABF0-\uABF9'
        },
        {
            name: 'Mende_Kikakui',
            astral: '\uD83A[\uDC00-\uDCC4\uDCC7-\uDCD6]'
        },
        {
            name: 'Meroitic_Cursive',
            astral: '\uD802[\uDDA0-\uDDB7\uDDBC-\uDDCF\uDDD2-\uDDFF]'
        },
        {
            name: 'Meroitic_Hieroglyphs',
            astral: '\uD802[\uDD80-\uDD9F]'
        },
        {
            name: 'Miao',
            astral: '\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]'
        },
        {
            name: 'Modi',
            astral: '\uD805[\uDE00-\uDE44\uDE50-\uDE59]'
        },
        {
            name: 'Mongolian',
            bmp: '\u1800\u1801\u1804\u1806-\u180E\u1810-\u1819\u1820-\u1877\u1880-\u18AA'
        },
        {
            name: 'Mro',
            astral: '\uD81A[\uDE40-\uDE5E\uDE60-\uDE69\uDE6E\uDE6F]'
        },
        {
            name: 'Multani',
            astral: '\uD804[\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA9]'
        },
        {
            name: 'Myanmar',
            bmp: '\u1000-\u109F\uA9E0-\uA9FE\uAA60-\uAA7F'
        },
        {
            name: 'Nabataean',
            astral: '\uD802[\uDC80-\uDC9E\uDCA7-\uDCAF]'
        },
        {
            name: 'New_Tai_Lue',
            bmp: '\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u19DE\u19DF'
        },
        {
            name: 'Nko',
            bmp: '\u07C0-\u07FA'
        },
        {
            name: 'Ogham',
            bmp: '\u1680-\u169C'
        },
        {
            name: 'Ol_Chiki',
            bmp: '\u1C50-\u1C7F'
        },
        {
            name: 'Old_Hungarian',
            astral: '\uD803[\uDC80-\uDCB2\uDCC0-\uDCF2\uDCFA-\uDCFF]'
        },
        {
            name: 'Old_Italic',
            astral: '\uD800[\uDF00-\uDF23]'
        },
        {
            name: 'Old_North_Arabian',
            astral: '\uD802[\uDE80-\uDE9F]'
        },
        {
            name: 'Old_Permic',
            astral: '\uD800[\uDF50-\uDF7A]'
        },
        {
            name: 'Old_Persian',
            astral: '\uD800[\uDFA0-\uDFC3\uDFC8-\uDFD5]'
        },
        {
            name: 'Old_South_Arabian',
            astral: '\uD802[\uDE60-\uDE7F]'
        },
        {
            name: 'Old_Turkic',
            astral: '\uD803[\uDC00-\uDC48]'
        },
        {
            name: 'Oriya',
            bmp: '\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B77'
        },
        {
            name: 'Osmanya',
            astral: '\uD801[\uDC80-\uDC9D\uDCA0-\uDCA9]'
        },
        {
            name: 'Pahawh_Hmong',
            astral: '\uD81A[\uDF00-\uDF45\uDF50-\uDF59\uDF5B-\uDF61\uDF63-\uDF77\uDF7D-\uDF8F]'
        },
        {
            name: 'Palmyrene',
            astral: '\uD802[\uDC60-\uDC7F]'
        },
        {
            name: 'Pau_Cin_Hau',
            astral: '\uD806[\uDEC0-\uDEF8]'
        },
        {
            name: 'Phags_Pa',
            bmp: '\uA840-\uA877'
        },
        {
            name: 'Phoenician',
            astral: '\uD802[\uDD00-\uDD1B\uDD1F]'
        },
        {
            name: 'Psalter_Pahlavi',
            astral: '\uD802[\uDF80-\uDF91\uDF99-\uDF9C\uDFA9-\uDFAF]'
        },
        {
            name: 'Rejang',
            bmp: '\uA930-\uA953\uA95F'
        },
        {
            name: 'Runic',
            bmp: '\u16A0-\u16EA\u16EE-\u16F8'
        },
        {
            name: 'Samaritan',
            bmp: '\u0800-\u082D\u0830-\u083E'
        },
        {
            name: 'Saurashtra',
            bmp: '\uA880-\uA8C4\uA8CE-\uA8D9'
        },
        {
            name: 'Sharada',
            astral: '\uD804[\uDD80-\uDDCD\uDDD0-\uDDDF]'
        },
        {
            name: 'Shavian',
            astral: '\uD801[\uDC50-\uDC7F]'
        },
        {
            name: 'Siddham',
            astral: '\uD805[\uDD80-\uDDB5\uDDB8-\uDDDD]'
        },
        {
            name: 'SignWriting',
            astral: '\uD836[\uDC00-\uDE8B\uDE9B-\uDE9F\uDEA1-\uDEAF]'
        },
        {
            name: 'Sinhala',
            bmp: '\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2-\u0DF4',
            astral: '\uD804[\uDDE1-\uDDF4]'
        },
        {
            name: 'Sora_Sompeng',
            astral: '\uD804[\uDCD0-\uDCE8\uDCF0-\uDCF9]'
        },
        {
            name: 'Sundanese',
            bmp: '\u1B80-\u1BBF\u1CC0-\u1CC7'
        },
        {
            name: 'Syloti_Nagri',
            bmp: '\uA800-\uA82B'
        },
        {
            name: 'Syriac',
            bmp: '\u0700-\u070D\u070F-\u074A\u074D-\u074F'
        },
        {
            name: 'Tagalog',
            bmp: '\u1700-\u170C\u170E-\u1714'
        },
        {
            name: 'Tagbanwa',
            bmp: '\u1760-\u176C\u176E-\u1770\u1772\u1773'
        },
        {
            name: 'Tai_Le',
            bmp: '\u1950-\u196D\u1970-\u1974'
        },
        {
            name: 'Tai_Tham',
            bmp: '\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA0-\u1AAD'
        },
        {
            name: 'Tai_Viet',
            bmp: '\uAA80-\uAAC2\uAADB-\uAADF'
        },
        {
            name: 'Takri',
            astral: '\uD805[\uDE80-\uDEB7\uDEC0-\uDEC9]'
        },
        {
            name: 'Tamil',
            bmp: '\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BFA'
        },
        {
            name: 'Telugu',
            bmp: '\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C78-\u0C7F'
        },
        {
            name: 'Thaana',
            bmp: '\u0780-\u07B1'
        },
        {
            name: 'Thai',
            bmp: '\u0E01-\u0E3A\u0E40-\u0E5B'
        },
        {
            name: 'Tibetan',
            bmp: '\u0F00-\u0F47\u0F49-\u0F6C\u0F71-\u0F97\u0F99-\u0FBC\u0FBE-\u0FCC\u0FCE-\u0FD4\u0FD9\u0FDA'
        },
        {
            name: 'Tifinagh',
            bmp: '\u2D30-\u2D67\u2D6F\u2D70\u2D7F'
        },
        {
            name: 'Tirhuta',
            astral: '\uD805[\uDC80-\uDCC7\uDCD0-\uDCD9]'
        },
        {
            name: 'Ugaritic',
            astral: '\uD800[\uDF80-\uDF9D\uDF9F]'
        },
        {
            name: 'Vai',
            bmp: '\uA500-\uA62B'
        },
        {
            name: 'Warang_Citi',
            astral: '\uD806[\uDCA0-\uDCF2\uDCFF]'
        },
        {
            name: 'Yi',
            bmp: '\uA000-\uA48C\uA490-\uA4C6'
        }
    ]);

};


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

var XRegExp = __webpack_require__(42);

__webpack_require__(34)(XRegExp);
__webpack_require__(35)(XRegExp);
__webpack_require__(36)(XRegExp);
__webpack_require__(37)(XRegExp);
__webpack_require__(38)(XRegExp);
__webpack_require__(39)(XRegExp);
__webpack_require__(40)(XRegExp);

module.exports = XRegExp;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * XRegExp 3.1.1
 * <xregexp.com>
 * Steven Levithan (c) 2007-2016 MIT License
 */



/**
 * XRegExp provides augmented, extensible regular expressions. You get additional regex syntax and
 * flags, beyond what browsers support natively. XRegExp is also a regex utility belt with tools to
 * make your client-side grepping simpler and more powerful, while freeing you from related
 * cross-browser inconsistencies.
 */

// ==--------------------------==
// Private stuff
// ==--------------------------==

// Property name used for extended regex instance data
var REGEX_DATA = 'xregexp';
// Optional features that can be installed and uninstalled
var features = {
    astral: false,
    natives: false
};
// Native methods to use and restore ('native' is an ES3 reserved keyword)
var nativ = {
    exec: RegExp.prototype.exec,
    test: RegExp.prototype.test,
    match: String.prototype.match,
    replace: String.prototype.replace,
    split: String.prototype.split
};
// Storage for fixed/extended native methods
var fixed = {};
// Storage for regexes cached by `XRegExp.cache`
var regexCache = {};
// Storage for pattern details cached by the `XRegExp` constructor
var patternCache = {};
// Storage for regex syntax tokens added internally or by `XRegExp.addToken`
var tokens = [];
// Token scopes
var defaultScope = 'default';
var classScope = 'class';
// Regexes that match native regex syntax, including octals
var nativeTokens = {
    // Any native multicharacter token in default scope, or any single character
    'default': /\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9]\d*|x[\dA-Fa-f]{2}|u(?:[\dA-Fa-f]{4}|{[\dA-Fa-f]+})|c[A-Za-z]|[\s\S])|\(\?(?:[:=!]|<[=!])|[?*+]\?|{\d+(?:,\d*)?}\??|[\s\S]/,
    // Any native multicharacter token in character class scope, or any single character
    'class': /\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[\dA-Fa-f]{2}|u(?:[\dA-Fa-f]{4}|{[\dA-Fa-f]+})|c[A-Za-z]|[\s\S])|[\s\S]/
};
// Any backreference or dollar-prefixed character in replacement strings
var replacementToken = /\$(?:{([\w$]+)}|(\d\d?|[\s\S]))/g;
// Check for correct `exec` handling of nonparticipating capturing groups
var correctExecNpcg = nativ.exec.call(/()??/, '')[1] === undefined;
// Check for ES6 `flags` prop support
var hasFlagsProp = /x/.flags !== undefined;
// Shortcut to `Object.prototype.toString`
var toString = {}.toString;

function hasNativeFlag(flag) {
    // Can't check based on the presense of properties/getters since browsers might support such
    // properties even when they don't support the corresponding flag in regex construction (tested
    // in Chrome 48, where `'unicode' in /x/` is true but trying to construct a regex with flag `u`
    // throws an error)
    var isSupported = true;
    try {
        // Can't use regex literals for testing even in a `try` because regex literals with
        // unsupported flags cause a compilation error in IE
        new RegExp('', flag);
    } catch (exception) {
        isSupported = false;
    }
    if (isSupported && flag === 'y') {
        // Work around Safari 9.1.1 bug
        return new RegExp('aa|.', 'y').test('b');
    }
    return isSupported;
}
// Check for ES6 `u` flag support
var hasNativeU = hasNativeFlag('u');
// Check for ES6 `y` flag support
var hasNativeY = hasNativeFlag('y');
// Tracker for known flags, including addon flags
var registeredFlags = {
    g: true,
    i: true,
    m: true,
    u: hasNativeU,
    y: hasNativeY
};

/**
 * Attaches extended data and `XRegExp.prototype` properties to a regex object.
 *
 * @param {RegExp} regex Regex to augment.
 * @param {Array} captureNames Array with capture names, or `null`.
 * @param {String} xSource XRegExp pattern used to generate `regex`, or `null` if N/A.
 * @param {String} xFlags XRegExp flags used to generate `regex`, or `null` if N/A.
 * @param {Boolean} [isInternalOnly=false] Whether the regex will be used only for internal
 *   operations, and never exposed to users. For internal-only regexes, we can improve perf by
 *   skipping some operations like attaching `XRegExp.prototype` properties.
 * @returns {RegExp} Augmented regex.
 */
function augment(regex, captureNames, xSource, xFlags, isInternalOnly) {
    var p;

    regex[REGEX_DATA] = {
        captureNames: captureNames
    };

    if (isInternalOnly) {
        return regex;
    }

    // Can't auto-inherit these since the XRegExp constructor returns a nonprimitive value
    if (regex.__proto__) {
        regex.__proto__ = XRegExp.prototype;
    } else {
        for (p in XRegExp.prototype) {
            // An `XRegExp.prototype.hasOwnProperty(p)` check wouldn't be worth it here, since this
            // is performance sensitive, and enumerable `Object.prototype` or `RegExp.prototype`
            // extensions exist on `regex.prototype` anyway
            regex[p] = XRegExp.prototype[p];
        }
    }

    regex[REGEX_DATA].source = xSource;
    // Emulate the ES6 `flags` prop by ensuring flags are in alphabetical order
    regex[REGEX_DATA].flags = xFlags ? xFlags.split('').sort().join('') : xFlags;

    return regex;
}

/**
 * Removes any duplicate characters from the provided string.
 *
 * @param {String} str String to remove duplicate characters from.
 * @returns {String} String with any duplicate characters removed.
 */
function clipDuplicates(str) {
    return nativ.replace.call(str, /([\s\S])(?=[\s\S]*\1)/g, '');
}

/**
 * Copies a regex object while preserving extended data and augmenting with `XRegExp.prototype`
 * properties. The copy has a fresh `lastIndex` property (set to zero). Allows adding and removing
 * flags g and y while copying the regex.
 *
 * @param {RegExp} regex Regex to copy.
 * @param {Object} [options] Options object with optional properties:
 *   <li>`addG` {Boolean} Add flag g while copying the regex.
 *   <li>`addY` {Boolean} Add flag y while copying the regex.
 *   <li>`removeG` {Boolean} Remove flag g while copying the regex.
 *   <li>`removeY` {Boolean} Remove flag y while copying the regex.
 *   <li>`isInternalOnly` {Boolean} Whether the copied regex will be used only for internal
 *     operations, and never exposed to users. For internal-only regexes, we can improve perf by
 *     skipping some operations like attaching `XRegExp.prototype` properties.
 * @returns {RegExp} Copy of the provided regex, possibly with modified flags.
 */
function copyRegex(regex, options) {
    if (!XRegExp.isRegExp(regex)) {
        throw new TypeError('Type RegExp expected');
    }

    var xData = regex[REGEX_DATA] || {},
        flags = getNativeFlags(regex),
        flagsToAdd = '',
        flagsToRemove = '',
        xregexpSource = null,
        xregexpFlags = null;

    options = options || {};

    if (options.removeG) {flagsToRemove += 'g';}
    if (options.removeY) {flagsToRemove += 'y';}
    if (flagsToRemove) {
        flags = nativ.replace.call(flags, new RegExp('[' + flagsToRemove + ']+', 'g'), '');
    }

    if (options.addG) {flagsToAdd += 'g';}
    if (options.addY) {flagsToAdd += 'y';}
    if (flagsToAdd) {
        flags = clipDuplicates(flags + flagsToAdd);
    }

    if (!options.isInternalOnly) {
        if (xData.source !== undefined) {
            xregexpSource = xData.source;
        }
        // null or undefined; don't want to add to `flags` if the previous value was null, since
        // that indicates we're not tracking original precompilation flags
        if (xData.flags != null) {
            // Flags are only added for non-internal regexes by `XRegExp.globalize`. Flags are never
            // removed for non-internal regexes, so don't need to handle it
            xregexpFlags = flagsToAdd ? clipDuplicates(xData.flags + flagsToAdd) : xData.flags;
        }
    }

    // Augment with `XRegExp.prototype` properties, but use the native `RegExp` constructor to avoid
    // searching for special tokens. That would be wrong for regexes constructed by `RegExp`, and
    // unnecessary for regexes constructed by `XRegExp` because the regex has already undergone the
    // translation to native regex syntax
    regex = augment(
        new RegExp(regex.source, flags),
        hasNamedCapture(regex) ? xData.captureNames.slice(0) : null,
        xregexpSource,
        xregexpFlags,
        options.isInternalOnly
    );

    return regex;
}

/**
 * Converts hexadecimal to decimal.
 *
 * @param {String} hex
 * @returns {Number}
 */
function dec(hex) {
    return parseInt(hex, 16);
}

/**
 * Returns native `RegExp` flags used by a regex object.
 *
 * @param {RegExp} regex Regex to check.
 * @returns {String} Native flags in use.
 */
function getNativeFlags(regex) {
    return hasFlagsProp ?
        regex.flags :
        // Explicitly using `RegExp.prototype.toString` (rather than e.g. `String` or concatenation
        // with an empty string) allows this to continue working predictably when
        // `XRegExp.proptotype.toString` is overriden
        nativ.exec.call(/\/([a-z]*)$/i, RegExp.prototype.toString.call(regex))[1];
}

/**
 * Determines whether a regex has extended instance data used to track capture names.
 *
 * @param {RegExp} regex Regex to check.
 * @returns {Boolean} Whether the regex uses named capture.
 */
function hasNamedCapture(regex) {
    return !!(regex[REGEX_DATA] && regex[REGEX_DATA].captureNames);
}

/**
 * Converts decimal to hexadecimal.
 *
 * @param {Number|String} dec
 * @returns {String}
 */
function hex(dec) {
    return parseInt(dec, 10).toString(16);
}

/**
 * Returns the first index at which a given value can be found in an array.
 *
 * @param {Array} array Array to search.
 * @param {*} value Value to locate in the array.
 * @returns {Number} Zero-based index at which the item is found, or -1.
 */
function indexOf(array, value) {
    var len = array.length, i;

    for (i = 0; i < len; ++i) {
        if (array[i] === value) {
            return i;
        }
    }

    return -1;
}

/**
 * Determines whether a value is of the specified type, by resolving its internal [[Class]].
 *
 * @param {*} value Object to check.
 * @param {String} type Type to check for, in TitleCase.
 * @returns {Boolean} Whether the object matches the type.
 */
function isType(value, type) {
    return toString.call(value) === '[object ' + type + ']';
}

/**
 * Checks whether the next nonignorable token after the specified position is a quantifier.
 *
 * @param {String} pattern Pattern to search within.
 * @param {Number} pos Index in `pattern` to search at.
 * @param {String} flags Flags used by the pattern.
 * @returns {Boolean} Whether the next token is a quantifier.
 */
function isQuantifierNext(pattern, pos, flags) {
    return nativ.test.call(
        flags.indexOf('x') > -1 ?
            // Ignore any leading whitespace, line comments, and inline comments
            /^(?:\s|#[^#\n]*|\(\?#[^)]*\))*(?:[?*+]|{\d+(?:,\d*)?})/ :
            // Ignore any leading inline comments
            /^(?:\(\?#[^)]*\))*(?:[?*+]|{\d+(?:,\d*)?})/,
        pattern.slice(pos)
    );
}

/**
 * Adds leading zeros if shorter than four characters. Used for fixed-length hexadecimal values.
 *
 * @param {String} str
 * @returns {String}
 */
function pad4(str) {
    while (str.length < 4) {
        str = '0' + str;
    }
    return str;
}

/**
 * Checks for flag-related errors, and strips/applies flags in a leading mode modifier. Offloads
 * the flag preparation logic from the `XRegExp` constructor.
 *
 * @param {String} pattern Regex pattern, possibly with a leading mode modifier.
 * @param {String} flags Any combination of flags.
 * @returns {Object} Object with properties `pattern` and `flags`.
 */
function prepareFlags(pattern, flags) {
    var i;

    // Recent browsers throw on duplicate flags, so copy this behavior for nonnative flags
    if (clipDuplicates(flags) !== flags) {
        throw new SyntaxError('Invalid duplicate regex flag ' + flags);
    }

    // Strip and apply a leading mode modifier with any combination of flags except g or y
    pattern = nativ.replace.call(pattern, /^\(\?([\w$]+)\)/, function($0, $1) {
        if (nativ.test.call(/[gy]/, $1)) {
            throw new SyntaxError('Cannot use flag g or y in mode modifier ' + $0);
        }
        // Allow duplicate flags within the mode modifier
        flags = clipDuplicates(flags + $1);
        return '';
    });

    // Throw on unknown native or nonnative flags
    for (i = 0; i < flags.length; ++i) {
        if (!registeredFlags[flags.charAt(i)]) {
            throw new SyntaxError('Unknown regex flag ' + flags.charAt(i));
        }
    }

    return {
        pattern: pattern,
        flags: flags
    };
}

/**
 * Prepares an options object from the given value.
 *
 * @param {String|Object} value Value to convert to an options object.
 * @returns {Object} Options object.
 */
function prepareOptions(value) {
    var options = {};

    if (isType(value, 'String')) {
        XRegExp.forEach(value, /[^\s,]+/, function(match) {
            options[match] = true;
        });

        return options;
    }

    return value;
}

/**
 * Registers a flag so it doesn't throw an 'unknown flag' error.
 *
 * @param {String} flag Single-character flag to register.
 */
function registerFlag(flag) {
    if (!/^[\w$]$/.test(flag)) {
        throw new Error('Flag must be a single character A-Za-z0-9_$');
    }

    registeredFlags[flag] = true;
}

/**
 * Runs built-in and custom regex syntax tokens in reverse insertion order at the specified
 * position, until a match is found.
 *
 * @param {String} pattern Original pattern from which an XRegExp object is being built.
 * @param {String} flags Flags being used to construct the regex.
 * @param {Number} pos Position to search for tokens within `pattern`.
 * @param {Number} scope Regex scope to apply: 'default' or 'class'.
 * @param {Object} context Context object to use for token handler functions.
 * @returns {Object} Object with properties `matchLength`, `output`, and `reparse`; or `null`.
 */
function runTokens(pattern, flags, pos, scope, context) {
    var i = tokens.length,
        leadChar = pattern.charAt(pos),
        result = null,
        match,
        t;

    // Run in reverse insertion order
    while (i--) {
        t = tokens[i];
        if (
            (t.leadChar && t.leadChar !== leadChar) ||
            (t.scope !== scope && t.scope !== 'all') ||
            (t.flag && flags.indexOf(t.flag) === -1)
        ) {
            continue;
        }

        match = XRegExp.exec(pattern, t.regex, pos, 'sticky');
        if (match) {
            result = {
                matchLength: match[0].length,
                output: t.handler.call(context, match, scope, flags),
                reparse: t.reparse
            };
            // Finished with token tests
            break;
        }
    }

    return result;
}

/**
 * Enables or disables implicit astral mode opt-in. When enabled, flag A is automatically added to
 * all new regexes created by XRegExp. This causes an error to be thrown when creating regexes if
 * the Unicode Base addon is not available, since flag A is registered by that addon.
 *
 * @param {Boolean} on `true` to enable; `false` to disable.
 */
function setAstral(on) {
    features.astral = on;
}

/**
 * Enables or disables native method overrides.
 *
 * @param {Boolean} on `true` to enable; `false` to disable.
 */
function setNatives(on) {
    RegExp.prototype.exec = (on ? fixed : nativ).exec;
    RegExp.prototype.test = (on ? fixed : nativ).test;
    String.prototype.match = (on ? fixed : nativ).match;
    String.prototype.replace = (on ? fixed : nativ).replace;
    String.prototype.split = (on ? fixed : nativ).split;

    features.natives = on;
}

/**
 * Returns the object, or throws an error if it is `null` or `undefined`. This is used to follow
 * the ES5 abstract operation `ToObject`.
 *
 * @param {*} value Object to check and return.
 * @returns {*} The provided object.
 */
function toObject(value) {
    // null or undefined
    if (value == null) {
        throw new TypeError('Cannot convert null or undefined to object');
    }

    return value;
}

// ==--------------------------==
// Constructor
// ==--------------------------==

/**
 * Creates an extended regular expression object for matching text with a pattern. Differs from a
 * native regular expression in that additional syntax and flags are supported. The returned object
 * is in fact a native `RegExp` and works with all native methods.
 *
 * @class XRegExp
 * @constructor
 * @param {String|RegExp} pattern Regex pattern string, or an existing regex object to copy.
 * @param {String} [flags] Any combination of flags.
 *   Native flags:
 *     <li>`g` - global
 *     <li>`i` - ignore case
 *     <li>`m` - multiline anchors
 *     <li>`u` - unicode (ES6)
 *     <li>`y` - sticky (Firefox 3+, ES6)
 *   Additional XRegExp flags:
 *     <li>`n` - explicit capture
 *     <li>`s` - dot matches all (aka singleline)
 *     <li>`x` - free-spacing and line comments (aka extended)
 *     <li>`A` - astral (requires the Unicode Base addon)
 *   Flags cannot be provided when constructing one `RegExp` from another.
 * @returns {RegExp} Extended regular expression object.
 * @example
 *
 * // With named capture and flag x
 * XRegExp('(?<year>  [0-9]{4} ) -?  # year  \n\
 *          (?<month> [0-9]{2} ) -?  # month \n\
 *          (?<day>   [0-9]{2} )     # day   ', 'x');
 *
 * // Providing a regex object copies it. Native regexes are recompiled using native (not XRegExp)
 * // syntax. Copies maintain extended data, are augmented with `XRegExp.prototype` properties, and
 * // have fresh `lastIndex` properties (set to zero).
 * XRegExp(/regex/);
 */
function XRegExp(pattern, flags) {
    if (XRegExp.isRegExp(pattern)) {
        if (flags !== undefined) {
            throw new TypeError('Cannot supply flags when copying a RegExp');
        }
        return copyRegex(pattern);
    }

    // Copy the argument behavior of `RegExp`
    pattern = pattern === undefined ? '' : String(pattern);
    flags = flags === undefined ? '' : String(flags);

    if (XRegExp.isInstalled('astral') && flags.indexOf('A') === -1) {
        // This causes an error to be thrown if the Unicode Base addon is not available
        flags += 'A';
    }

    if (!patternCache[pattern]) {
        patternCache[pattern] = {};
    }

    if (!patternCache[pattern][flags]) {
        var context = {
            hasNamedCapture: false,
            captureNames: []
        };
        var scope = defaultScope;
        var output = '';
        var pos = 0;
        var result;

        // Check for flag-related errors, and strip/apply flags in a leading mode modifier
        var applied = prepareFlags(pattern, flags);
        var appliedPattern = applied.pattern;
        var appliedFlags = applied.flags;

        // Use XRegExp's tokens to translate the pattern to a native regex pattern.
        // `appliedPattern.length` may change on each iteration if tokens use `reparse`
        while (pos < appliedPattern.length) {
            do {
                // Check for custom tokens at the current position
                result = runTokens(appliedPattern, appliedFlags, pos, scope, context);
                // If the matched token used the `reparse` option, splice its output into the
                // pattern before running tokens again at the same position
                if (result && result.reparse) {
                    appliedPattern = appliedPattern.slice(0, pos) +
                        result.output +
                        appliedPattern.slice(pos + result.matchLength);
                }
            } while (result && result.reparse);

            if (result) {
                output += result.output;
                pos += (result.matchLength || 1);
            } else {
                // Get the native token at the current position
                var token = XRegExp.exec(appliedPattern, nativeTokens[scope], pos, 'sticky')[0];
                output += token;
                pos += token.length;
                if (token === '[' && scope === defaultScope) {
                    scope = classScope;
                } else if (token === ']' && scope === classScope) {
                    scope = defaultScope;
                }
            }
        }

        patternCache[pattern][flags] = {
            // Use basic cleanup to collapse repeated empty groups like `(?:)(?:)` to `(?:)`. Empty
            // groups are sometimes inserted during regex transpilation in order to keep tokens
            // separated. However, more than one empty group in a row is never needed.
            pattern: nativ.replace.call(output, /(?:\(\?:\))+/g, '(?:)'),
            // Strip all but native flags
            flags: nativ.replace.call(appliedFlags, /[^gimuy]+/g, ''),
            // `context.captureNames` has an item for each capturing group, even if unnamed
            captures: context.hasNamedCapture ? context.captureNames : null
        };
    }

    var generated = patternCache[pattern][flags];
    return augment(
        new RegExp(generated.pattern, generated.flags),
        generated.captures,
        pattern,
        flags
    );
}

// Add `RegExp.prototype` to the prototype chain
XRegExp.prototype = new RegExp();

// ==--------------------------==
// Public properties
// ==--------------------------==

/**
 * The XRegExp version number as a string containing three dot-separated parts. For example,
 * '2.0.0-beta-3'.
 *
 * @static
 * @type String
 */
XRegExp.version = '3.1.1';

// ==--------------------------==
// Public methods
// ==--------------------------==

// Intentionally undocumented; used in tests and addons
XRegExp._hasNativeFlag = hasNativeFlag;
XRegExp._dec = dec;
XRegExp._hex = hex;
XRegExp._pad4 = pad4;

/**
 * Extends XRegExp syntax and allows custom flags. This is used internally and can be used to
 * create XRegExp addons. If more than one token can match the same string, the last added wins.
 *
 * @param {RegExp} regex Regex object that matches the new token.
 * @param {Function} handler Function that returns a new pattern string (using native regex syntax)
 *   to replace the matched token within all future XRegExp regexes. Has access to persistent
 *   properties of the regex being built, through `this`. Invoked with three arguments:
 *   <li>The match array, with named backreference properties.
 *   <li>The regex scope where the match was found: 'default' or 'class'.
 *   <li>The flags used by the regex, including any flags in a leading mode modifier.
 *   The handler function becomes part of the XRegExp construction process, so be careful not to
 *   construct XRegExps within the function or you will trigger infinite recursion.
 * @param {Object} [options] Options object with optional properties:
 *   <li>`scope` {String} Scope where the token applies: 'default', 'class', or 'all'.
 *   <li>`flag` {String} Single-character flag that triggers the token. This also registers the
 *     flag, which prevents XRegExp from throwing an 'unknown flag' error when the flag is used.
 *   <li>`optionalFlags` {String} Any custom flags checked for within the token `handler` that are
 *     not required to trigger the token. This registers the flags, to prevent XRegExp from
 *     throwing an 'unknown flag' error when any of the flags are used.
 *   <li>`reparse` {Boolean} Whether the `handler` function's output should not be treated as
 *     final, and instead be reparseable by other tokens (including the current token). Allows
 *     token chaining or deferring.
 *   <li>`leadChar` {String} Single character that occurs at the beginning of any successful match
 *     of the token (not always applicable). This doesn't change the behavior of the token unless
 *     you provide an erroneous value. However, providing it can increase the token's performance
 *     since the token can be skipped at any positions where this character doesn't appear.
 * @example
 *
 * // Basic usage: Add \a for the ALERT control code
 * XRegExp.addToken(
 *   /\\a/,
 *   function() {return '\\x07';},
 *   {scope: 'all'}
 * );
 * XRegExp('\\a[\\a-\\n]+').test('\x07\n\x07'); // -> true
 *
 * // Add the U (ungreedy) flag from PCRE and RE2, which reverses greedy and lazy quantifiers.
 * // Since `scope` is not specified, it uses 'default' (i.e., transformations apply outside of
 * // character classes only)
 * XRegExp.addToken(
 *   /([?*+]|{\d+(?:,\d*)?})(\??)/,
 *   function(match) {return match[1] + (match[2] ? '' : '?');},
 *   {flag: 'U'}
 * );
 * XRegExp('a+', 'U').exec('aaa')[0]; // -> 'a'
 * XRegExp('a+?', 'U').exec('aaa')[0]; // -> 'aaa'
 */
XRegExp.addToken = function(regex, handler, options) {
    options = options || {};
    var optionalFlags = options.optionalFlags, i;

    if (options.flag) {
        registerFlag(options.flag);
    }

    if (optionalFlags) {
        optionalFlags = nativ.split.call(optionalFlags, '');
        for (i = 0; i < optionalFlags.length; ++i) {
            registerFlag(optionalFlags[i]);
        }
    }

    // Add to the private list of syntax tokens
    tokens.push({
        regex: copyRegex(regex, {
            addG: true,
            addY: hasNativeY,
            isInternalOnly: true
        }),
        handler: handler,
        scope: options.scope || defaultScope,
        flag: options.flag,
        reparse: options.reparse,
        leadChar: options.leadChar
    });

    // Reset the pattern cache used by the `XRegExp` constructor, since the same pattern and flags
    // might now produce different results
    XRegExp.cache.flush('patterns');
};

/**
 * Caches and returns the result of calling `XRegExp(pattern, flags)`. On any subsequent call with
 * the same pattern and flag combination, the cached copy of the regex is returned.
 *
 * @param {String} pattern Regex pattern string.
 * @param {String} [flags] Any combination of XRegExp flags.
 * @returns {RegExp} Cached XRegExp object.
 * @example
 *
 * while (match = XRegExp.cache('.', 'gs').exec(str)) {
 *   // The regex is compiled once only
 * }
 */
XRegExp.cache = function(pattern, flags) {
    if (!regexCache[pattern]) {
        regexCache[pattern] = {};
    }
    return regexCache[pattern][flags] || (
        regexCache[pattern][flags] = XRegExp(pattern, flags)
    );
};

// Intentionally undocumented; used in tests
XRegExp.cache.flush = function(cacheName) {
    if (cacheName === 'patterns') {
        // Flush the pattern cache used by the `XRegExp` constructor
        patternCache = {};
    } else {
        // Flush the regex cache populated by `XRegExp.cache`
        regexCache = {};
    }
};

/**
 * Escapes any regular expression metacharacters, for use when matching literal strings. The result
 * can safely be used at any point within a regex that uses any flags.
 *
 * @param {String} str String to escape.
 * @returns {String} String with regex metacharacters escaped.
 * @example
 *
 * XRegExp.escape('Escaped? <.>');
 * // -> 'Escaped\?\ <\.>'
 */
XRegExp.escape = function(str) {
    return nativ.replace.call(toObject(str), /[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

/**
 * Executes a regex search in a specified string. Returns a match array or `null`. If the provided
 * regex uses named capture, named backreference properties are included on the match array.
 * Optional `pos` and `sticky` arguments specify the search start position, and whether the match
 * must start at the specified position only. The `lastIndex` property of the provided regex is not
 * used, but is updated for compatibility. Also fixes browser bugs compared to the native
 * `RegExp.prototype.exec` and can be used reliably cross-browser.
 *
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Number} [pos=0] Zero-based index at which to start the search.
 * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
 *   only. The string `'sticky'` is accepted as an alternative to `true`.
 * @returns {Array} Match array with named backreference properties, or `null`.
 * @example
 *
 * // Basic use, with named backreference
 * var match = XRegExp.exec('U+2620', XRegExp('U\\+(?<hex>[0-9A-F]{4})'));
 * match.hex; // -> '2620'
 *
 * // With pos and sticky, in a loop
 * var pos = 2, result = [], match;
 * while (match = XRegExp.exec('<1><2><3><4>5<6>', /<(\d)>/, pos, 'sticky')) {
 *   result.push(match[1]);
 *   pos = match.index + match[0].length;
 * }
 * // result -> ['2', '3', '4']
 */
XRegExp.exec = function(str, regex, pos, sticky) {
    var cacheKey = 'g',
        addY = false,
        match,
        r2;

    addY = hasNativeY && !!(sticky || (regex.sticky && sticky !== false));
    if (addY) {
        cacheKey += 'y';
    }

    regex[REGEX_DATA] = regex[REGEX_DATA] || {};

    // Shares cached copies with `XRegExp.match`/`replace`
    r2 = regex[REGEX_DATA][cacheKey] || (
        regex[REGEX_DATA][cacheKey] = copyRegex(regex, {
            addG: true,
            addY: addY,
            removeY: sticky === false,
            isInternalOnly: true
        })
    );

    r2.lastIndex = pos = pos || 0;

    // Fixed `exec` required for `lastIndex` fix, named backreferences, etc.
    match = fixed.exec.call(r2, str);

    if (sticky && match && match.index !== pos) {
        match = null;
    }

    if (regex.global) {
        regex.lastIndex = match ? r2.lastIndex : 0;
    }

    return match;
};

/**
 * Executes a provided function once per regex match. Searches always start at the beginning of the
 * string and continue until the end, regardless of the state of the regex's `global` property and
 * initial `lastIndex`.
 *
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Function} callback Function to execute for each match. Invoked with four arguments:
 *   <li>The match array, with named backreference properties.
 *   <li>The zero-based match index.
 *   <li>The string being traversed.
 *   <li>The regex object being used to traverse the string.
 * @example
 *
 * // Extracts every other digit from a string
 * var evens = [];
 * XRegExp.forEach('1a2345', /\d/, function(match, i) {
 *   if (i % 2) evens.push(+match[0]);
 * });
 * // evens -> [2, 4]
 */
XRegExp.forEach = function(str, regex, callback) {
    var pos = 0,
        i = -1,
        match;

    while ((match = XRegExp.exec(str, regex, pos))) {
        // Because `regex` is provided to `callback`, the function could use the deprecated/
        // nonstandard `RegExp.prototype.compile` to mutate the regex. However, since `XRegExp.exec`
        // doesn't use `lastIndex` to set the search position, this can't lead to an infinite loop,
        // at least. Actually, because of the way `XRegExp.exec` caches globalized versions of
        // regexes, mutating the regex will not have any effect on the iteration or matched strings,
        // which is a nice side effect that brings extra safety.
        callback(match, ++i, str, regex);

        pos = match.index + (match[0].length || 1);
    }
};

/**
 * Copies a regex object and adds flag `g`. The copy maintains extended data, is augmented with
 * `XRegExp.prototype` properties, and has a fresh `lastIndex` property (set to zero). Native
 * regexes are not recompiled using XRegExp syntax.
 *
 * @param {RegExp} regex Regex to globalize.
 * @returns {RegExp} Copy of the provided regex with flag `g` added.
 * @example
 *
 * var globalCopy = XRegExp.globalize(/regex/);
 * globalCopy.global; // -> true
 */
XRegExp.globalize = function(regex) {
    return copyRegex(regex, {addG: true});
};

/**
 * Installs optional features according to the specified options. Can be undone using
 * `XRegExp.uninstall`.
 *
 * @param {Object|String} options Options object or string.
 * @example
 *
 * // With an options object
 * XRegExp.install({
 *   // Enables support for astral code points in Unicode addons (implicitly sets flag A)
 *   astral: true,
 *
 *   // DEPRECATED: Overrides native regex methods with fixed/extended versions
 *   natives: true
 * });
 *
 * // With an options string
 * XRegExp.install('astral natives');
 */
XRegExp.install = function(options) {
    options = prepareOptions(options);

    if (!features.astral && options.astral) {
        setAstral(true);
    }

    if (!features.natives && options.natives) {
        setNatives(true);
    }
};

/**
 * Checks whether an individual optional feature is installed.
 *
 * @param {String} feature Name of the feature to check. One of:
 *   <li>`astral`
 *   <li>`natives`
 * @returns {Boolean} Whether the feature is installed.
 * @example
 *
 * XRegExp.isInstalled('astral');
 */
XRegExp.isInstalled = function(feature) {
    return !!(features[feature]);
};

/**
 * Returns `true` if an object is a regex; `false` if it isn't. This works correctly for regexes
 * created in another frame, when `instanceof` and `constructor` checks would fail.
 *
 * @param {*} value Object to check.
 * @returns {Boolean} Whether the object is a `RegExp` object.
 * @example
 *
 * XRegExp.isRegExp('string'); // -> false
 * XRegExp.isRegExp(/regex/i); // -> true
 * XRegExp.isRegExp(RegExp('^', 'm')); // -> true
 * XRegExp.isRegExp(XRegExp('(?s).')); // -> true
 */
XRegExp.isRegExp = function(value) {
    return toString.call(value) === '[object RegExp]';
    //return isType(value, 'RegExp');
};

/**
 * Returns the first matched string, or in global mode, an array containing all matched strings.
 * This is essentially a more convenient re-implementation of `String.prototype.match` that gives
 * the result types you actually want (string instead of `exec`-style array in match-first mode,
 * and an empty array instead of `null` when no matches are found in match-all mode). It also lets
 * you override flag g and ignore `lastIndex`, and fixes browser bugs.
 *
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {String} [scope='one'] Use 'one' to return the first match as a string. Use 'all' to
 *   return an array of all matched strings. If not explicitly specified and `regex` uses flag g,
 *   `scope` is 'all'.
 * @returns {String|Array} In match-first mode: First match as a string, or `null`. In match-all
 *   mode: Array of all matched strings, or an empty array.
 * @example
 *
 * // Match first
 * XRegExp.match('abc', /\w/); // -> 'a'
 * XRegExp.match('abc', /\w/g, 'one'); // -> 'a'
 * XRegExp.match('abc', /x/g, 'one'); // -> null
 *
 * // Match all
 * XRegExp.match('abc', /\w/g); // -> ['a', 'b', 'c']
 * XRegExp.match('abc', /\w/, 'all'); // -> ['a', 'b', 'c']
 * XRegExp.match('abc', /x/, 'all'); // -> []
 */
XRegExp.match = function(str, regex, scope) {
    var global = (regex.global && scope !== 'one') || scope === 'all',
        cacheKey = ((global ? 'g' : '') + (regex.sticky ? 'y' : '')) || 'noGY',
        result,
        r2;

    regex[REGEX_DATA] = regex[REGEX_DATA] || {};

    // Shares cached copies with `XRegExp.exec`/`replace`
    r2 = regex[REGEX_DATA][cacheKey] || (
        regex[REGEX_DATA][cacheKey] = copyRegex(regex, {
            addG: !!global,
            removeG: scope === 'one',
            isInternalOnly: true
        })
    );

    result = nativ.match.call(toObject(str), r2);

    if (regex.global) {
        regex.lastIndex = (
            (scope === 'one' && result) ?
                // Can't use `r2.lastIndex` since `r2` is nonglobal in this case
                (result.index + result[0].length) : 0
        );
    }

    return global ? (result || []) : (result && result[0]);
};

/**
 * Retrieves the matches from searching a string using a chain of regexes that successively search
 * within previous matches. The provided `chain` array can contain regexes and or objects with
 * `regex` and `backref` properties. When a backreference is specified, the named or numbered
 * backreference is passed forward to the next regex or returned.
 *
 * @param {String} str String to search.
 * @param {Array} chain Regexes that each search for matches within preceding results.
 * @returns {Array} Matches by the last regex in the chain, or an empty array.
 * @example
 *
 * // Basic usage; matches numbers within <b> tags
 * XRegExp.matchChain('1 <b>2</b> 3 <b>4 a 56</b>', [
 *   XRegExp('(?is)<b>.*?</b>'),
 *   /\d+/
 * ]);
 * // -> ['2', '4', '56']
 *
 * // Passing forward and returning specific backreferences
 * html = '<a href="http://xregexp.com/api/">XRegExp</a>\
 *         <a href="http://www.google.com/">Google</a>';
 * XRegExp.matchChain(html, [
 *   {regex: /<a href="([^"]+)">/i, backref: 1},
 *   {regex: XRegExp('(?i)^https?://(?<domain>[^/?#]+)'), backref: 'domain'}
 * ]);
 * // -> ['xregexp.com', 'www.google.com']
 */
XRegExp.matchChain = function(str, chain) {
    return (function recurseChain(values, level) {
        var item = chain[level].regex ? chain[level] : {regex: chain[level]};
        var matches = [];

        function addMatch(match) {
            if (item.backref) {
                // Safari 4.0.5 (but not 5.0.5+) inappropriately uses sparse arrays to hold the
                // `undefined`s for backreferences to nonparticipating capturing groups. In such
                // cases, a `hasOwnProperty` or `in` check on its own would inappropriately throw
                // the exception, so also check if the backreference is a number that is within the
                // bounds of the array.
                if (!(match.hasOwnProperty(item.backref) || +item.backref < match.length)) {
                    throw new ReferenceError('Backreference to undefined group: ' + item.backref);
                }

                matches.push(match[item.backref] || '');
            } else {
                matches.push(match[0]);
            }
        }

        for (var i = 0; i < values.length; ++i) {
            XRegExp.forEach(values[i], item.regex, addMatch);
        }

        return ((level === chain.length - 1) || !matches.length) ?
            matches :
            recurseChain(matches, level + 1);
    }([str], 0));
};

/**
 * Returns a new string with one or all matches of a pattern replaced. The pattern can be a string
 * or regex, and the replacement can be a string or a function to be called for each match. To
 * perform a global search and replace, use the optional `scope` argument or include flag g if using
 * a regex. Replacement strings can use `${n}` for named and numbered backreferences. Replacement
 * functions can use named backreferences via `arguments[0].name`. Also fixes browser bugs compared
 * to the native `String.prototype.replace` and can be used reliably cross-browser.
 *
 * @param {String} str String to search.
 * @param {RegExp|String} search Search pattern to be replaced.
 * @param {String|Function} replacement Replacement string or a function invoked to create it.
 *   Replacement strings can include special replacement syntax:
 *     <li>$$ - Inserts a literal $ character.
 *     <li>$&, $0 - Inserts the matched substring.
 *     <li>$` - Inserts the string that precedes the matched substring (left context).
 *     <li>$' - Inserts the string that follows the matched substring (right context).
 *     <li>$n, $nn - Where n/nn are digits referencing an existent capturing group, inserts
 *       backreference n/nn.
 *     <li>${n} - Where n is a name or any number of digits that reference an existent capturing
 *       group, inserts backreference n.
 *   Replacement functions are invoked with three or more arguments:
 *     <li>The matched substring (corresponds to $& above). Named backreferences are accessible as
 *       properties of this first argument.
 *     <li>0..n arguments, one for each backreference (corresponding to $1, $2, etc. above).
 *     <li>The zero-based index of the match within the total search string.
 *     <li>The total string being searched.
 * @param {String} [scope='one'] Use 'one' to replace the first match only, or 'all'. If not
 *   explicitly specified and using a regex with flag g, `scope` is 'all'.
 * @returns {String} New string with one or all matches replaced.
 * @example
 *
 * // Regex search, using named backreferences in replacement string
 * var name = XRegExp('(?<first>\\w+) (?<last>\\w+)');
 * XRegExp.replace('John Smith', name, '${last}, ${first}');
 * // -> 'Smith, John'
 *
 * // Regex search, using named backreferences in replacement function
 * XRegExp.replace('John Smith', name, function(match) {
 *   return match.last + ', ' + match.first;
 * });
 * // -> 'Smith, John'
 *
 * // String search, with replace-all
 * XRegExp.replace('RegExp builds RegExps', 'RegExp', 'XRegExp', 'all');
 * // -> 'XRegExp builds XRegExps'
 */
XRegExp.replace = function(str, search, replacement, scope) {
    var isRegex = XRegExp.isRegExp(search),
        global = (search.global && scope !== 'one') || scope === 'all',
        cacheKey = ((global ? 'g' : '') + (search.sticky ? 'y' : '')) || 'noGY',
        s2 = search,
        result;

    if (isRegex) {
        search[REGEX_DATA] = search[REGEX_DATA] || {};

        // Shares cached copies with `XRegExp.exec`/`match`. Since a copy is used, `search`'s
        // `lastIndex` isn't updated *during* replacement iterations
        s2 = search[REGEX_DATA][cacheKey] || (
            search[REGEX_DATA][cacheKey] = copyRegex(search, {
                addG: !!global,
                removeG: scope === 'one',
                isInternalOnly: true
            })
        );
    } else if (global) {
        s2 = new RegExp(XRegExp.escape(String(search)), 'g');
    }

    // Fixed `replace` required for named backreferences, etc.
    result = fixed.replace.call(toObject(str), s2, replacement);

    if (isRegex && search.global) {
        // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
        search.lastIndex = 0;
    }

    return result;
};

/**
 * Performs batch processing of string replacements. Used like `XRegExp.replace`, but accepts an
 * array of replacement details. Later replacements operate on the output of earlier replacements.
 * Replacement details are accepted as an array with a regex or string to search for, the
 * replacement string or function, and an optional scope of 'one' or 'all'. Uses the XRegExp
 * replacement text syntax, which supports named backreference properties via `${name}`.
 *
 * @param {String} str String to search.
 * @param {Array} replacements Array of replacement detail arrays.
 * @returns {String} New string with all replacements.
 * @example
 *
 * str = XRegExp.replaceEach(str, [
 *   [XRegExp('(?<name>a)'), 'z${name}'],
 *   [/b/gi, 'y'],
 *   [/c/g, 'x', 'one'], // scope 'one' overrides /g
 *   [/d/, 'w', 'all'],  // scope 'all' overrides lack of /g
 *   ['e', 'v', 'all'],  // scope 'all' allows replace-all for strings
 *   [/f/g, function($0) {
 *     return $0.toUpperCase();
 *   }]
 * ]);
 */
XRegExp.replaceEach = function(str, replacements) {
    var i, r;

    for (i = 0; i < replacements.length; ++i) {
        r = replacements[i];
        str = XRegExp.replace(str, r[0], r[1], r[2]);
    }

    return str;
};

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 *
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * XRegExp.split('a b c', ' ');
 * // -> ['a', 'b', 'c']
 *
 * // With limit
 * XRegExp.split('a b c', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * XRegExp.split('..word1..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', '..']
 */
XRegExp.split = function(str, separator, limit) {
    return fixed.split.call(toObject(str), separator, limit);
};

/**
 * Executes a regex search in a specified string. Returns `true` or `false`. Optional `pos` and
 * `sticky` arguments specify the search start position, and whether the match must start at the
 * specified position only. The `lastIndex` property of the provided regex is not used, but is
 * updated for compatibility. Also fixes browser bugs compared to the native
 * `RegExp.prototype.test` and can be used reliably cross-browser.
 *
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Number} [pos=0] Zero-based index at which to start the search.
 * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
 *   only. The string `'sticky'` is accepted as an alternative to `true`.
 * @returns {Boolean} Whether the regex matched the provided value.
 * @example
 *
 * // Basic use
 * XRegExp.test('abc', /c/); // -> true
 *
 * // With pos and sticky
 * XRegExp.test('abc', /c/, 0, 'sticky'); // -> false
 * XRegExp.test('abc', /c/, 2, 'sticky'); // -> true
 */
XRegExp.test = function(str, regex, pos, sticky) {
    // Do this the easy way :-)
    return !!XRegExp.exec(str, regex, pos, sticky);
};

/**
 * Uninstalls optional features according to the specified options. All optional features start out
 * uninstalled, so this is used to undo the actions of `XRegExp.install`.
 *
 * @param {Object|String} options Options object or string.
 * @example
 *
 * // With an options object
 * XRegExp.uninstall({
 *   // Disables support for astral code points in Unicode addons
 *   astral: true,
 *
 *   // DEPRECATED: Restores native regex methods
 *   natives: true
 * });
 *
 * // With an options string
 * XRegExp.uninstall('astral natives');
 */
XRegExp.uninstall = function(options) {
    options = prepareOptions(options);

    if (features.astral && options.astral) {
        setAstral(false);
    }

    if (features.natives && options.natives) {
        setNatives(false);
    }
};

/**
 * Returns an XRegExp object that is the union of the given patterns. Patterns can be provided as
 * regex objects or strings. Metacharacters are escaped in patterns provided as strings.
 * Backreferences in provided regex objects are automatically renumbered to work correctly within
 * the larger combined pattern. Native flags used by provided regexes are ignored in favor of the
 * `flags` argument.
 *
 * @param {Array} patterns Regexes and strings to combine.
 * @param {String} [flags] Any combination of XRegExp flags.
 * @returns {RegExp} Union of the provided regexes and strings.
 * @example
 *
 * XRegExp.union(['a+b*c', /(dogs)\1/, /(cats)\1/], 'i');
 * // -> /a\+b\*c|(dogs)\1|(cats)\2/i
 */
XRegExp.union = function(patterns, flags) {
    var numCaptures = 0;
    var numPriorCaptures;
    var captureNames;

    function rewrite(match, paren, backref) {
        var name = captureNames[numCaptures - numPriorCaptures];

        // Capturing group
        if (paren) {
            ++numCaptures;
            // If the current capture has a name, preserve the name
            if (name) {
                return '(?<' + name + '>';
            }
        // Backreference
        } else if (backref) {
            // Rewrite the backreference
            return '\\' + (+backref + numPriorCaptures);
        }

        return match;
    }

    if (!(isType(patterns, 'Array') && patterns.length)) {
        throw new TypeError('Must provide a nonempty array of patterns to merge');
    }

    var parts = /(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*]/g;
    var output = [];
    var pattern;
    for (var i = 0; i < patterns.length; ++i) {
        pattern = patterns[i];

        if (XRegExp.isRegExp(pattern)) {
            numPriorCaptures = numCaptures;
            captureNames = (pattern[REGEX_DATA] && pattern[REGEX_DATA].captureNames) || [];

            // Rewrite backreferences. Passing to XRegExp dies on octals and ensures patterns are
            // independently valid; helps keep this simple. Named captures are put back
            output.push(nativ.replace.call(XRegExp(pattern.source).source, parts, rewrite));
        } else {
            output.push(XRegExp.escape(pattern));
        }
    }

    return XRegExp(output.join('|'), flags);
};

// ==--------------------------==
// Fixed/extended native methods
// ==--------------------------==

/**
 * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
 * bugs in the native `RegExp.prototype.exec`. Calling `XRegExp.install('natives')` uses this to
 * override the native method. Use via `XRegExp.exec` without overriding natives.
 *
 * @param {String} str String to search.
 * @returns {Array} Match array with named backreference properties, or `null`.
 */
fixed.exec = function(str) {
    var origLastIndex = this.lastIndex,
        match = nativ.exec.apply(this, arguments),
        name,
        r2,
        i;

    if (match) {
        // Fix browsers whose `exec` methods don't return `undefined` for nonparticipating capturing
        // groups. This fixes IE 5.5-8, but not IE 9's quirks mode or emulation of older IEs. IE 9
        // in standards mode follows the spec.
        if (!correctExecNpcg && match.length > 1 && indexOf(match, '') > -1) {
            r2 = copyRegex(this, {
                removeG: true,
                isInternalOnly: true
            });
            // Using `str.slice(match.index)` rather than `match[0]` in case lookahead allowed
            // matching due to characters outside the match
            nativ.replace.call(String(str).slice(match.index), r2, function() {
                var len = arguments.length, i;
                // Skip index 0 and the last 2
                for (i = 1; i < len - 2; ++i) {
                    if (arguments[i] === undefined) {
                        match[i] = undefined;
                    }
                }
            });
        }

        // Attach named capture properties
        if (this[REGEX_DATA] && this[REGEX_DATA].captureNames) {
            // Skip index 0
            for (i = 1; i < match.length; ++i) {
                name = this[REGEX_DATA].captureNames[i - 1];
                if (name) {
                    match[name] = match[i];
                }
            }
        }

        // Fix browsers that increment `lastIndex` after zero-length matches
        if (this.global && !match[0].length && (this.lastIndex > match.index)) {
            this.lastIndex = match.index;
        }
    }

    if (!this.global) {
        // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
        this.lastIndex = origLastIndex;
    }

    return match;
};

/**
 * Fixes browser bugs in the native `RegExp.prototype.test`. Calling `XRegExp.install('natives')`
 * uses this to override the native method.
 *
 * @param {String} str String to search.
 * @returns {Boolean} Whether the regex matched the provided value.
 */
fixed.test = function(str) {
    // Do this the easy way :-)
    return !!fixed.exec.call(this, str);
};

/**
 * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
 * bugs in the native `String.prototype.match`. Calling `XRegExp.install('natives')` uses this to
 * override the native method.
 *
 * @param {RegExp|*} regex Regex to search with. If not a regex object, it is passed to `RegExp`.
 * @returns {Array} If `regex` uses flag g, an array of match strings or `null`. Without flag g,
 *   the result of calling `regex.exec(this)`.
 */
fixed.match = function(regex) {
    var result;

    if (!XRegExp.isRegExp(regex)) {
        // Use the native `RegExp` rather than `XRegExp`
        regex = new RegExp(regex);
    } else if (regex.global) {
        result = nativ.match.apply(this, arguments);
        // Fixes IE bug
        regex.lastIndex = 0;

        return result;
    }

    return fixed.exec.call(regex, toObject(this));
};

/**
 * Adds support for `${n}` tokens for named and numbered backreferences in replacement text, and
 * provides named backreferences to replacement functions as `arguments[0].name`. Also fixes browser
 * bugs in replacement text syntax when performing a replacement using a nonregex search value, and
 * the value of a replacement regex's `lastIndex` property during replacement iterations and upon
 * completion. Calling `XRegExp.install('natives')` uses this to override the native method. Note
 * that this doesn't support SpiderMonkey's proprietary third (`flags`) argument. Use via
 * `XRegExp.replace` without overriding natives.
 *
 * @param {RegExp|String} search Search pattern to be replaced.
 * @param {String|Function} replacement Replacement string or a function invoked to create it.
 * @returns {String} New string with one or all matches replaced.
 */
fixed.replace = function(search, replacement) {
    var isRegex = XRegExp.isRegExp(search),
        origLastIndex,
        captureNames,
        result;

    if (isRegex) {
        if (search[REGEX_DATA]) {
            captureNames = search[REGEX_DATA].captureNames;
        }
        // Only needed if `search` is nonglobal
        origLastIndex = search.lastIndex;
    } else {
        search += ''; // Type-convert
    }

    // Don't use `typeof`; some older browsers return 'function' for regex objects
    if (isType(replacement, 'Function')) {
        // Stringifying `this` fixes a bug in IE < 9 where the last argument in replacement
        // functions isn't type-converted to a string
        result = nativ.replace.call(String(this), search, function() {
            var args = arguments, i;
            if (captureNames) {
                // Change the `arguments[0]` string primitive to a `String` object that can store
                // properties. This really does need to use `String` as a constructor
                args[0] = new String(args[0]);
                // Store named backreferences on the first argument
                for (i = 0; i < captureNames.length; ++i) {
                    if (captureNames[i]) {
                        args[0][captureNames[i]] = args[i + 1];
                    }
                }
            }
            // Update `lastIndex` before calling `replacement`. Fixes IE, Chrome, Firefox, Safari
            // bug (last tested IE 9, Chrome 17, Firefox 11, Safari 5.1)
            if (isRegex && search.global) {
                search.lastIndex = args[args.length - 2] + args[0].length;
            }
            // ES6 specs the context for replacement functions as `undefined`
            return replacement.apply(undefined, args);
        });
    } else {
        // Ensure that the last value of `args` will be a string when given nonstring `this`,
        // while still throwing on null or undefined context
        result = nativ.replace.call(this == null ? this : String(this), search, function() {
            // Keep this function's `arguments` available through closure
            var args = arguments;
            return nativ.replace.call(String(replacement), replacementToken, function($0, $1, $2) {
                var n;
                // Named or numbered backreference with curly braces
                if ($1) {
                    // XRegExp behavior for `${n}`:
                    // 1. Backreference to numbered capture, if `n` is an integer. Use `0` for the
                    //    entire match. Any number of leading zeros may be used.
                    // 2. Backreference to named capture `n`, if it exists and is not an integer
                    //    overridden by numbered capture. In practice, this does not overlap with
                    //    numbered capture since XRegExp does not allow named capture to use a bare
                    //    integer as the name.
                    // 3. If the name or number does not refer to an existing capturing group, it's
                    //    an error.
                    n = +$1; // Type-convert; drop leading zeros
                    if (n <= args.length - 3) {
                        return args[n] || '';
                    }
                    // Groups with the same name is an error, else would need `lastIndexOf`
                    n = captureNames ? indexOf(captureNames, $1) : -1;
                    if (n < 0) {
                        throw new SyntaxError('Backreference to undefined group ' + $0);
                    }
                    return args[n + 1] || '';
                }
                // Else, special variable or numbered backreference without curly braces
                if ($2 === '$') { // $$
                    return '$';
                }
                if ($2 === '&' || +$2 === 0) { // $&, $0 (not followed by 1-9), $00
                    return args[0];
                }
                if ($2 === '`') { // $` (left context)
                    return args[args.length - 1].slice(0, args[args.length - 2]);
                }
                if ($2 === "'") { // $' (right context)
                    return args[args.length - 1].slice(args[args.length - 2] + args[0].length);
                }
                // Else, numbered backreference without curly braces
                $2 = +$2; // Type-convert; drop leading zero
                // XRegExp behavior for `$n` and `$nn`:
                // - Backrefs end after 1 or 2 digits. Use `${..}` for more digits.
                // - `$1` is an error if no capturing groups.
                // - `$10` is an error if less than 10 capturing groups. Use `${1}0` instead.
                // - `$01` is `$1` if at least one capturing group, else it's an error.
                // - `$0` (not followed by 1-9) and `$00` are the entire match.
                // Native behavior, for comparison:
                // - Backrefs end after 1 or 2 digits. Cannot reference capturing group 100+.
                // - `$1` is a literal `$1` if no capturing groups.
                // - `$10` is `$1` followed by a literal `0` if less than 10 capturing groups.
                // - `$01` is `$1` if at least one capturing group, else it's a literal `$01`.
                // - `$0` is a literal `$0`.
                if (!isNaN($2)) {
                    if ($2 > args.length - 3) {
                        throw new SyntaxError('Backreference to undefined group ' + $0);
                    }
                    return args[$2] || '';
                }
                // `$` followed by an unsupported char is an error, unlike native JS
                throw new SyntaxError('Invalid token ' + $0);
            });
        });
    }

    if (isRegex) {
        if (search.global) {
            // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
            search.lastIndex = 0;
        } else {
            // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
            search.lastIndex = origLastIndex;
        }
    }

    return result;
};

/**
 * Fixes browser bugs in the native `String.prototype.split`. Calling `XRegExp.install('natives')`
 * uses this to override the native method. Use via `XRegExp.split` without overriding natives.
 *
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 */
fixed.split = function(separator, limit) {
    if (!XRegExp.isRegExp(separator)) {
        // Browsers handle nonregex split correctly, so use the faster native method
        return nativ.split.apply(this, arguments);
    }

    var str = String(this),
        output = [],
        origLastIndex = separator.lastIndex,
        lastLastIndex = 0,
        lastLength;

    // Values for `limit`, per the spec:
    // If undefined: pow(2,32) - 1
    // If 0, Infinity, or NaN: 0
    // If positive number: limit = floor(limit); if (limit >= pow(2,32)) limit -= pow(2,32);
    // If negative number: pow(2,32) - floor(abs(limit))
    // If other: Type-convert, then use the above rules
    // This line fails in very strange ways for some values of `limit` in Opera 10.5-10.63, unless
    // Opera Dragonfly is open (go figure). It works in at least Opera 9.5-10.1 and 11+
    limit = (limit === undefined ? -1 : limit) >>> 0;

    XRegExp.forEach(str, separator, function(match) {
        // This condition is not the same as `if (match[0].length)`
        if ((match.index + match[0].length) > lastLastIndex) {
            output.push(str.slice(lastLastIndex, match.index));
            if (match.length > 1 && match.index < str.length) {
                Array.prototype.push.apply(output, match.slice(1));
            }
            lastLength = match[0].length;
            lastLastIndex = match.index + lastLength;
        }
    });

    if (lastLastIndex === str.length) {
        if (!nativ.test.call(separator, '') || lastLength) {
            output.push('');
        }
    } else {
        output.push(str.slice(lastLastIndex));
    }

    separator.lastIndex = origLastIndex;
    return output.length > limit ? output.slice(0, limit) : output;
};

// ==--------------------------==
// Built-in syntax/flag tokens
// ==--------------------------==

/*
 * Letter escapes that natively match literal characters: `\a`, `\A`, etc. These should be
 * SyntaxErrors but are allowed in web reality. XRegExp makes them errors for cross-browser
 * consistency and to reserve their syntax, but lets them be superseded by addons.
 */
XRegExp.addToken(
    /\\([ABCE-RTUVXYZaeg-mopqyz]|c(?![A-Za-z])|u(?![\dA-Fa-f]{4}|{[\dA-Fa-f]+})|x(?![\dA-Fa-f]{2}))/,
    function(match, scope) {
        // \B is allowed in default scope only
        if (match[1] === 'B' && scope === defaultScope) {
            return match[0];
        }
        throw new SyntaxError('Invalid escape ' + match[0]);
    },
    {
        scope: 'all',
        leadChar: '\\'
    }
);

/*
 * Unicode code point escape with curly braces: `\u{N..}`. `N..` is any one or more digit
 * hexadecimal number from 0-10FFFF, and can include leading zeros. Requires the native ES6 `u` flag
 * to support code points greater than U+FFFF. Avoids converting code points above U+FFFF to
 * surrogate pairs (which could be done without flag `u`), since that could lead to broken behavior
 * if you follow a `\u{N..}` token that references a code point above U+FFFF with a quantifier, or
 * if you use the same in a character class.
 */
XRegExp.addToken(
    /\\u{([\dA-Fa-f]+)}/,
    function(match, scope, flags) {
        var code = dec(match[1]);
        if (code > 0x10FFFF) {
            throw new SyntaxError('Invalid Unicode code point ' + match[0]);
        }
        if (code <= 0xFFFF) {
            // Converting to \uNNNN avoids needing to escape the literal character and keep it
            // separate from preceding tokens
            return '\\u' + pad4(hex(code));
        }
        // If `code` is between 0xFFFF and 0x10FFFF, require and defer to native handling
        if (hasNativeU && flags.indexOf('u') > -1) {
            return match[0];
        }
        throw new SyntaxError('Cannot use Unicode code point above \\u{FFFF} without flag u');
    },
    {
        scope: 'all',
        leadChar: '\\'
    }
);

/*
 * Empty character class: `[]` or `[^]`. This fixes a critical cross-browser syntax inconsistency.
 * Unless this is standardized (per the ES spec), regex syntax can't be accurately parsed because
 * character class endings can't be determined.
 */
XRegExp.addToken(
    /\[(\^?)]/,
    function(match) {
        // For cross-browser compatibility with ES3, convert [] to \b\B and [^] to [\s\S].
        // (?!) should work like \b\B, but is unreliable in some versions of Firefox
        return match[1] ? '[\\s\\S]' : '\\b\\B';
    },
    {leadChar: '['}
);

/*
 * Comment pattern: `(?# )`. Inline comments are an alternative to the line comments allowed in
 * free-spacing mode (flag x).
 */
XRegExp.addToken(
    /\(\?#[^)]*\)/,
    function(match, scope, flags) {
        // Keep tokens separated unless the following token is a quantifier. This avoids e.g.
        // inadvertedly changing `\1(?#)1` to `\11`.
        return isQuantifierNext(match.input, match.index + match[0].length, flags) ?
            '' : '(?:)';
    },
    {leadChar: '('}
);

/*
 * Whitespace and line comments, in free-spacing mode (aka extended mode, flag x) only.
 */
XRegExp.addToken(
    /\s+|#[^\n]*\n?/,
    function(match, scope, flags) {
        // Keep tokens separated unless the following token is a quantifier. This avoids e.g.
        // inadvertedly changing `\1 1` to `\11`.
        return isQuantifierNext(match.input, match.index + match[0].length, flags) ?
            '' : '(?:)';
    },
    {flag: 'x'}
);

/*
 * Dot, in dotall mode (aka singleline mode, flag s) only.
 */
XRegExp.addToken(
    /\./,
    function() {
        return '[\\s\\S]';
    },
    {
        flag: 's',
        leadChar: '.'
    }
);

/*
 * Named backreference: `\k<name>`. Backreference names can use the characters A-Z, a-z, 0-9, _,
 * and $ only. Also allows numbered backreferences as `\k<n>`.
 */
XRegExp.addToken(
    /\\k<([\w$]+)>/,
    function(match) {
        // Groups with the same name is an error, else would need `lastIndexOf`
        var index = isNaN(match[1]) ? (indexOf(this.captureNames, match[1]) + 1) : +match[1],
            endIndex = match.index + match[0].length;
        if (!index || index > this.captureNames.length) {
            throw new SyntaxError('Backreference to undefined group ' + match[0]);
        }
        // Keep backreferences separate from subsequent literal numbers. This avoids e.g.
        // inadvertedly changing `(?<n>)\k<n>1` to `()\11`.
        return '\\' + index + (
            endIndex === match.input.length || isNaN(match.input.charAt(endIndex)) ?
                '' : '(?:)'
        );
    },
    {leadChar: '\\'}
);

/*
 * Numbered backreference or octal, plus any following digits: `\0`, `\11`, etc. Octals except `\0`
 * not followed by 0-9 and backreferences to unopened capture groups throw an error. Other matches
 * are returned unaltered. IE < 9 doesn't support backreferences above `\99` in regex syntax.
 */
XRegExp.addToken(
    /\\(\d+)/,
    function(match, scope) {
        if (
            !(
                scope === defaultScope &&
                /^[1-9]/.test(match[1]) &&
                +match[1] <= this.captureNames.length
            ) &&
            match[1] !== '0'
        ) {
            throw new SyntaxError('Cannot use octal escape or backreference to undefined group ' +
                match[0]);
        }
        return match[0];
    },
    {
        scope: 'all',
        leadChar: '\\'
    }
);

/*
 * Named capturing group; match the opening delimiter only: `(?<name>`. Capture names can use the
 * characters A-Z, a-z, 0-9, _, and $ only. Names can't be integers. Supports Python-style
 * `(?P<name>` as an alternate syntax to avoid issues in some older versions of Opera which natively
 * supported the Python-style syntax. Otherwise, XRegExp might treat numbered backreferences to
 * Python-style named capture as octals.
 */
XRegExp.addToken(
    /\(\?P?<([\w$]+)>/,
    function(match) {
        // Disallow bare integers as names because named backreferences are added to match arrays
        // and therefore numeric properties may lead to incorrect lookups
        if (!isNaN(match[1])) {
            throw new SyntaxError('Cannot use integer as capture name ' + match[0]);
        }
        if (match[1] === 'length' || match[1] === '__proto__') {
            throw new SyntaxError('Cannot use reserved word as capture name ' + match[0]);
        }
        if (indexOf(this.captureNames, match[1]) > -1) {
            throw new SyntaxError('Cannot use same name for multiple groups ' + match[0]);
        }
        this.captureNames.push(match[1]);
        this.hasNamedCapture = true;
        return '(';
    },
    {leadChar: '('}
);

/*
 * Capturing group; match the opening parenthesis only. Required for support of named capturing
 * groups. Also adds explicit capture mode (flag n).
 */
XRegExp.addToken(
    /\((?!\?)/,
    function(match, scope, flags) {
        if (flags.indexOf('n') > -1) {
            return '(?:';
        }
        this.captureNames.push(null);
        return '(';
    },
    {
        optionalFlags: 'n',
        leadChar: '('
    }
);

module.exports = XRegExp;


/***/ })
/******/ ]);
});
//# sourceMappingURL=salve.map.js