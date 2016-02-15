/**
 * @module patterns
 * @desc Classes that model RNG patterns.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013-2015 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:patterns */ function (require, exports, module) {
'use strict';

var name_resolver = require("./name_resolver");

// XML validation against a schema could work without any lookahead if
// it were not for namespaces. However, namespace support means that
// the interpretation of a tag or of an attribute may depend on
// information which appears *later* than the earliest time at which a
// validation decision might be called for:
//
// Consider:
//    <elephant a="a" b="b"... xmlns="elephant_uri"/>
//
// It is not until xmlns is encountered that the validator will know
// that elephant belongs to the elephant_uri namespace. This is not
// too troubling for a validator that can access the whole document
// but for validators used in a line-by-line process (which is the
// case if the validator is driven by a CodeMirror or Ace tokenizer,
// and anything based on them), this can be problematic because the
// attributes could appear on lines other than the line on which the
// start of the tag appears:
//
// <elephant
//  a="a"
//  b="b"
//  xmlns="elephant_uri"/>
//
// The validator encounters the start of the tag and the attributes,
// without knowing that eventually this elephant tag belongs to the
// elephant_uri namespace. This discovery might result in things that
// were seen previously and deemed valid becoming invalid. Or things
// that were invalid becoming valid.
//
// Handling namespaces will require lookahead. Although the validator
// would still expect all events that have tag and attribute names to
// have the a proper namespace uri, upon enterStartTag the parsing
// code which feeds events to the validator would look ahead for these
// cases:
//
// * There is a valid > character ending the start tag. Scan the start tag
//   for all namespace declarations.
//
// * The tag ends at EOF. Scan from beginning of tag to EOF for
//   namespace declarations.
//
// * The tag is terminated by an invalid token. Scan from beginning of
//   tag to error.
//
// Then issue the enterStartTag and attributeName events on the basis
// of what was found in scanning.
//
// When the parsing code discovers a change in namespace declarations,
// for instance because the user typed xmlns="..." or removed a
// declaration, the parsing code must *restart* validation *from* the
// location of the original enterStartTag event.

var util = require("./util");
var hashstructs = require("./hashstructs");
var oop = require("./oop");
var Set = require("./set").Set;
var datatypes = require("./datatypes");
var errors = require("./errors");
var ValidationError = errors.ValidationError;
var ElementNameError = errors.ElementNameError;
var AttributeNameError = errors.AttributeNameError;
var AttributeValueError = errors.AttributeValueError;
var ChoiceError = errors.ChoiceError;
var registry = datatypes.registry;
var inherit = oop.inherit;
var implement = oop.implement;
var HashSet = hashstructs.HashSet;
var HashMap = hashstructs.HashMap;

var DEBUG=false;

if (DEBUG) {
    //
    // Debugging utilities
    //

    var trace = function(msg) {
        console.log(msg);
    };

    var stackTrace = function() {
        trace(new Error().stack);
    };

    var possible_tracer;
    var fireEvent_tracer;
    var plain_tracer;
    var call_dump;

    (function () {
        var buf = "";
        var step = " ";

        var name_or_path = function(walker) {
            var el = walker.el;

            if (!el)
                return "";

            if (el.name === undefined)
                return " with path " + el.xml_path;

            var named = " named " + el.name.toString();
            if (!walker.bound_name)
                return named;

            return named + " (bound to " + walker.bound_name.toString() + ")";
        };

        call_dump = function (msg, name, me) {
            trace(buf + msg + name + " on class " + me.constructor.name +
                  " id " + me.id + name_or_path(me));
        };

        possible_tracer = function (old_method, name, args) {
            buf += step;
            call_dump("calling ", name, this);
            var ret = old_method.apply(this, args);
            call_dump("called ", name, this);
            trace(buf + "return from the call: " + util.inspect(ret));
            buf = buf.slice(step.length);
            return ret;
        };

        fireEvent_tracer = function (old_method, name, args) {
            buf += step;
            call_dump("calling ", name, this);
            trace(buf + util.inspect(args[0]));

            var ret = old_method.apply(this, args);
            call_dump("called ", name, this);
            if (ret !== false)
                trace(buf + "return from the call: " + util.inspect(ret));
            buf = buf.slice(step.length);
            return ret;
        };

        plain_tracer = function (old_method, name, args) {
            buf += step;
            call_dump("calling ", name, this);

            var ret = old_method.apply(this, args);
            call_dump("called ", name, this);
            //if (ret !== true)
            //    trace(buf + "return from the call: " + util.inspect(ret));
            buf = buf.slice(step.length);
            return ret;
        };

    })();

    /**
     * Utility function for debugging. Wraps <code>me[name]</code> in a
     * wrapper function. <code>me[name]</code> must be a
     * function. <code>me</code> could be an instance or could be a
     * prototype. This function cannot trivially wrap the same field on
     * the same object twice.
     *
     * @private
     * @param {Object} me The object to modify.
     * @param {string} name The field name to modify in the object.
     * @param {Function} f The function that should serve as wrapper.
     *
     */
    var wrap = function(me, name, f) {
        var mangled_name = "___" + name;
        me[mangled_name] = me[name];
        me[name] = function () {
            return f.call(this, me[mangled_name], name, arguments);
        };
    };
}

/**
 * Sets up a newWalker method in a prototype.
 *
 * @private
 * @param {Function} el_cls The class that will get the new method.
 * @param {Function} walker_cls The Walker class to instantiate.
 */
function addWalker(el_cls, walker_cls)
{
    el_cls.prototype.newWalker = function (name_resolver) {
        /* jshint newcap: false */
        return new walker_cls(this, name_resolver);
    };
}

/**
 * Factory method to create constructors that create singleton
 * objects. Upon first call, the constructor will return a new
 * object. Subsequent calls to the constructor return the same object.
 *
 * @private
 *
 * @param {Function} base The base class from which this constructor
 * should inherit. Note that inherit() should still be called outside
 * makeSingletonConstructor to setup inheritance.
 * @returns {Function} The new constructor.
 */
function makeSingletonConstructor(base) {
    function f() {
        if (f.prototype.__singleton_instance !== undefined)
            return f.prototype.__singleton_instance;

        /* jshint validthis: true */
        base.apply(this, arguments);

        f.prototype.__singleton_instance = this;
        return this;
    }

    return f;
}

// function EventSet() {
//     var args = Array.prototype.slice.call(arguments);
//     args.unshift(function (x) { return x.hash() });
//     HashSet.apply(this, args);
// }
// inherit(EventSet, HashSet);

// The naive Set implementation turns out to be faster than the
// HashSet implementation for how we are using it.

var EventSet = Set;

/**
 * @classdesc Immutable objects modeling XML Expanded Names.
 * @constructor
 *
 * @param {string} ns The namespace URI.
 * @param {string} name The local name of the entity.
 */
function EName(ns, name) {
    this.ns = ns;
    this.name = name;
}
/**
 * @returns {string} A string representing the expanded name.
 */
EName.prototype.toString = function () {
    return "{" + this.ns + "}" + this.name;
};

/**
 * Compares two expanded names.
 *
 * @param {module:patterns~EName} other The other object to compare
 * this object with.
 *
 * @returns {boolean} <code>true</code> if this object equals the other.
 */
EName.prototype.equal = function (other) {
    return this.ns === other.ns && this.name === other.name;
};

/**
 * Calls the <code>hash()</code> method on the object passed to it.
 *
 * @private
 * @param {Object} o An object that implements <code>hash()</code>.
 * @returns {boolean} The return value of <code>hash()</code>.
 */
function hashHelper(o) { return o.hash(); }

/**
 *
 * @classdesc This is the base class for all patterns created from the file
 * passed to constructTree. These patterns form a JavaScript representation of
 * the simplified RNG tree. The base class implements a leaf in the
 * RNG tree. In other words, it does not itself refer to children
 * Patterns. (To put it in other words, it has no subpatterns.)
 * @extends Object
 *
 * @constructor
 *
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 */
function Pattern(xml_path) {
    this.id = "P" + this.__newID();
    this.xml_path = xml_path;
}

inherit(Pattern, Object);

/**
 * The next id to associate to the next Pattern object to be
 * created. This is used so that {@link module:patterns~Pattern#hash
 * hash} can return unique values.
 *
 * @private
 */
Pattern.__id=0;

/**
 * Gets a new Pattern id.
 *
 * @private
 * @returns {integer} The new id.
 */
Pattern.prototype.__newID = function () {
    return Pattern.__id++;
};

/**
 * <p>This method is mainly used to be able to use Event objects in a
 * {@link module:hashstructs~HashSet HashSet} or a {@link
 * module:hashstructs~HashMap HashMap}.</p>
 *
 * <p>Returns a hash guaranteed to be unique to this object. There are
 * some limitations. First, if this module is instantiated twice, the
 * objects created by the two instances cannot mix without violating
 * the uniqueness guarantee. Second, the hash is a monotonically
 * increasing counter, so when it reaches beyond the maximum integer
 * that the JavaScript vm can handle, things go kaboom.</p>
 *
 * @returns {integer} A number unique to this object.
 */
Pattern.prototype.hash = function () { return this.id; };

/**
 * Resolve references to definitions.
 *
 * @private
 *
 * @param {Array} definitions The definitions that exist in this
 * grammar.
 *
 * @returns {Array|undefined} The references that cannot be resolved,
 * or ``undefined`` if no references cannot be resolved. The caller is
 * free to modify the value returned as needed.
 */
Pattern.prototype._resolve = function (definitions) {
    return undefined;
};

/**
 * <p>This method must be called after resolution has been
 * performed.  _prepare recursively calls children but does not
 * traverse ref-define boundaries to avoid infinite regress...</p>
 *
 * <p>This function now performs two tasks: a) it prepares the
 * attributes (Definition and Element objects maintain a pattern
 * which contains only attribute patterns, and nothing else), b)
 * it gathers all the namespaces seen in the schema.</p>
 *
 * @private
 * @param {Object} namespaces An object whose keys are the
 * namespaces seen in the schema. This method populates the object.
 *
 */
Pattern.prototype._prepare = function(namespaces)  {
    // nothing here
};


/**
 * Creates a new walker to walk this pattern.
 *
 * @returns {module:patterns~Walker} A walker.
 */
Pattern.prototype.newWalker = function () {
    throw new Error("must define newWalker method");
};

/**
 * Makes a deep copy (a clone) of this pattern.
 *
 * @returns {module:patterns~Pattern} A new copy.
 */
Pattern.prototype.clone = function () {
    return this._clone(new HashMap(hashHelper));
};

/**
 * Helper function for clone. Code that is not part of the
 * Pattern family would call clone() whereas Pattern and
 * its derived classes call _clone() with the appropriate memo.
 *
 * @private
 * @param {module:hashstructs~HashMap} memo A mapping of old object to
 * copy object. As a tree of patterns is being cloned, this memo is
 * populated. So if A is cloned to B then a mapping from A to B is
 * stored in the memo. If A is seen again in the same cloning
 * operation, then it will be substituted with B instead of creating a
 * new object.
 *
 * @returns An new object of the same class as the one being
 * cloned. The new object is a clone.
 */
Pattern.prototype._clone = function (memo) {
    var other = memo.has(this);
    if (other !== undefined)
        return other;
    other = new this.constructor();
    memo.add(this, other);
    this._copyInto(other, memo);
    return other;
};

/**
 * Helper method for clone() and _clone(). All classes deriving
 * from Pattern must implement their own version of this
 * function so that they copy and clone their fields as needed.
 *
 * @private
 *
 * @param {module:patterns~Pattern} obj Object into which we must copy
 * the fields of this object.
 *
 * @param {module:hashstructs~HashMap} memo The memo that contains the
 * copy mappings. See {@link module:patterns~Pattern.clone clone()} above.
 */
Pattern.prototype._copyInto = function (obj, memo) {
    obj.xml_path = this.xml_path;
};

/**
 * This method tests whether a pattern is an attribute pattern or
 * contains attribute patterns. This method does not cross element
 * boundaries. That is, if element X cannot have attributes of its own
 * but can contain elements that can have attributes, the return value
 * if this method is called on the pattern contained by element X's
 * pattern will be ``false``.
 *
 * @returns {boolean} True if the pattern is or has attributes. False
 * if not.
 */
Pattern.prototype._hasAttrs = function () {
    return false;
};

/**
 * Populates a memo with a mapping of (element name, [list of
 * patterns]). In a Relax NG schema, the same element name may appear
 * in multiple contexts, with multiple contents. For instance an
 * element named "name" could require the sequence of elements
 * "firstName", "lastName" in a certain context and text in a
 * different context. This method allows determining whether this
 * happens or not within a pattern.
 *
 * @private
 * @param {Object} memo The memo in which to store the information.
 */
Pattern.prototype._elementDefinitions = function (memo) {
    // By default we have no children.
};

/**
 * @classdesc Pattern objects of this class have exactly one child
 * pattern.
 * @extends module:patterns~Pattern
 * @private
 *
 * @constructor
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 */
function PatternOnePattern(xml_path) {
    Pattern.call(this, xml_path);
    this.pat = undefined;
}
inherit(PatternOnePattern, Pattern);

PatternOnePattern.prototype._resolve = function (definitions) {
    return this.pat._resolve(definitions);
};

PatternOnePattern.prototype._copyInto = function (obj, memo) {
    Pattern.prototype._copyInto.call(this, obj, memo);
    obj.pat = this.pat._clone(memo);
};

PatternOnePattern.prototype._prepare = function(namespaces)  {
    this.pat._prepare(namespaces);
};

PatternOnePattern.prototype._hasAttrs = function () {
    return this.pat._hasAttrs();
};

PatternOnePattern.prototype._elementDefinitions = function (memo) {
    this.pat._elementDefinitions(memo);
};



/**
 * @classdesc Pattern objects of this class have exactly two child patterns.
 * @extends module:patterns~Pattern
 *
 * @constructor
 * @private
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 */
function PatternTwoPatterns(xml_path) {
    Pattern.call(this, xml_path);
    this.pat_a = undefined;
    this.pat_b = undefined;
}
inherit(PatternTwoPatterns, Pattern);

PatternTwoPatterns.prototype._resolve = function (definitions) {
    var a = this.pat_a._resolve(definitions);
    var b = this.pat_b._resolve(definitions);
    if (a && b)
        return a.concat(b);

    if (a)
        return a;

    return b;
};

PatternTwoPatterns.prototype._copyInto = function (obj, memo) {
    Pattern.prototype._copyInto.call(this, obj, memo);
    obj.pat_a = this.pat_a._clone(memo);
    obj.pat_b = this.pat_b._clone(memo);
};

PatternTwoPatterns.prototype._prepare = function(namespaces)  {
    this.pat_a._prepare(namespaces);
    this.pat_b._prepare(namespaces);
};

PatternTwoPatterns.prototype._hasAttrs = function () {
    return this.pat_a._hasAttrs() || this.pat_b._hasAttrs();
};


PatternTwoPatterns.prototype._elementDefinitions = function (memo) {
    this.pat_a._elementDefinitions(memo);
    this.pat_b._elementDefinitions(memo);
};

/**
 * @classdesc <p>This class modelizes events occurring during parsing. Upon
 * encountering the start of a start tag, an "enterStartTag" event is
 * generated, etc. Event objects are held to be immutable. No
 * precautions have been made to enforce this. Users of these objects
 * simply must not modify them. Moreover, there is one and only one of
 * each event created.</p>
 *
 * <p>An event is made of a list of event parameters, with the first
 * one being the type of the event and the rest of the list varying
 * depending on this type.</p>
 *
 * @constructor
 *
 * @param args... The event parameters may be passed directly in the
 * call <code>(new Event(a, b, ...))</code> or the first call
 * parameter may be a list containing all the event parameters
 * <code>(new Event([a, b, ])</code>. All
 * of the event parameters must be strings.
 */
function Event() {
    var params;
    if (arguments[0] instanceof Array)
        params = arguments[0];
    else {
        // We do it this way to allow v8 to optimize the function.
        var lim = arguments.length;
        params = new Array(lim);
        for (var i = 0; i < lim; ++i)
            params[i] = arguments[i];
    }

    var key = params.join();

    // Ensure we have only one of each event created.
    var cached = Event.__cache[key];
    if (cached !== undefined)
        return cached;

    this.id = this.__newID();
    this.params = params;
    this.key = key;

    Event.__cache[key] = this;
    return this;
}

/**
 * The cache of Event objects. So that we create one and only one
 * Event object per run.
 *
 * @private
 */
Event.__cache = Object.create(null);

/**
 * The next id to associate to the next Event object to be
 * created. This is used so that {@link module:patterns~Event#hash
 * hash} can return unique values.
 *
 * @private
 */
Event.__id=0;

/**
 * Gets a new Event id.
 *
 * @private
 * @returns {integer} The new id.
 */
Event.prototype.__newID = function () {
    return Event.__id++;
};

/**
 * <p>This method is mainly used to be able to use Event objects in a
 * {@link module:hashstructs~HashSet HashSet} or a {@link
 * module:hashstructs~HashMap HashMap}.</p>
 *
 * <p>Returns a hash guaranteed to be unique to this object. There are
 * some limitations. First, if this module is instantiated twice, the
 * objects created by the two instances cannot mix without violating
 * the uniqueness guarantee. Second, the hash is a monotonically
 * increasing counter, so when it reaches beyond the maximum integer
 * that the JavaScript vm can handle, things go kaboom.</p>
 *
 * @returns {integer} A number unique to this object.
 */
Event.prototype.hash = function () { return this.id; };

/**
 * Is this Event an attribute event?
 *
 * @returns {boolean} <code>true</code> if the event is an attribute
 * event, <code>false</code> otherwise.
 */
Event.prototype.isAttributeEvent = function () {
    return  (this.params[0] === "attributeName" ||
             this.params[0] === "attributeValue");
};

/**
 * @returns {string} A string representation of the event.
 */
Event.prototype.toString = function () {
    return "Event: " + this.params.join(", ");
};


/**
 * Utility function used mainly in testing to transform a {@link
 * module:set~Set Set} of events into a string containing a tree
 * structure. The principle is
 * to combine events of a same type together and among events of a
 * same type combine those which are in the same namespace. So for
 * instance if there is a set of events that are all attributeName
 * events plus one leaveStartTag event, the output could be:
 *
 * <pre><code>
 * attributeName:
 * ..uri A:
 * ....name 1
 * ....name 2
 * ..uri B:
 * ....name 3
 * ....name 4
 * leaveStartTag
 * </code></pre>
 *
 * The dots above are to represent more visually the
 * indentation. Actual output does not contain leading dots.  In this
 * list there are two attributeName events in the "uri A" namespace
 * and two in the "uri B" namespace.
 *
 * @param {module:set~Set} evs Events to turn into a string.
 * @returns {string} A string which contains the tree described above.
 */
function eventsToTreeString(evs) {
    var hash_f = function (x) { return x; };
    var hash = new HashMap(hash_f);
    evs.forEach(function (ev) {
        var params = ev;
        if (ev instanceof Event)
            params = ev.params;

        var node = hash;
        for(var i = 0; i < params.length; ++i) {
            if (i === params.length - 1)
                // Our HashSet/Map cannot deal with undefined values.
                // So we mark leaf elements with the value false.
                node.add(params[i], false);
            else {
                var next_node = node.has(params[i]);
                if (next_node === undefined) {
                    next_node = new HashMap(hash_f);
                    node.add(params[i], next_node);
                }
                node = next_node;
            }

        }
    });

    var dumpTree = (function () {
        var dump_tree_buf = "";
        var dump_tree_indent = "    ";
        return function (hash, indent) {
            var ret = "";
            var keys = hash.keys();
            keys.sort();
            keys.forEach(function (key) {
                var sub = hash.has(key);
                if (sub !== false) {
                    ret += dump_tree_buf + key + ":\n";
                    dump_tree_buf += dump_tree_indent;
                    ret += dumpTree(hash.has(key));
                    dump_tree_buf =
                        dump_tree_buf.slice(dump_tree_indent.length);
                }
                else
                    ret += dump_tree_buf + key + "\n";
            });
            return ret;
        };
    })();

    return dumpTree(hash);
}

/**
 * Special event to which only the EmptyWalker responds positively.
 * @private
 */
var empty_event = new Event("<empty>");

/**
 * Return value for ``fireEvent`` methods. It is returned only for
 * text values and indicates that part of the text was matched. These
 * objects are immutable by convention.
 *
 * @private
 * @constructor
 * @param {integer} length The length of the part that was matched.
 * @property {integer} length The length that was passed during construction.
 */
function PartialMatch(length) {
    this.length = length;
}

/**
 * @classdesc Roughly speaking each {@link module:patterns~Pattern
 * Pattern} object has a corresponding Walker class that modelizes
 * an object which is able to walk the pattern to which it belongs. So
 * an Element has an ElementWalker and an Attribute has an
 * AttributeWalker. A Walker object responds to parsing events and
 * reports whether the structure represented by these events is
 * valid.
 *
 * This base class records only keeps a minimal number of properties
 * so that child classes can avoid keeping useless properties. A prime
 * example is the walker for &ltempty> which is a terminal walker (it
 * has no subwalker) so does not need to record the name resolver.
 *
 * Note that users of this API do not instantiate Walker objects
 * themselves.
 * @constructor
 */
function Walker() {
    this.id = "W" + this.__newID();
    this.possible_cached = undefined;
    this.suppressed_attributes = false;
    // if (DEBUG) {
    //     wrap(this, "_possible", possible_tracer);
    //     wrap(this, "fireEvent", fireEvent_tracer);
    //     wrap(this, "end", plain_tracer);
    //     wrap(this, "_suppressAttributes", plain_tracer);
    //     wrap(this, "_clone", plain_tracer);
    // }
}

/**
 * The next id to associate to the next Walker object to be
 * created. This is used so that {@link module:patterns~Walker#hash
 * hash} can return unique values.
 *
 * @private
 */
Walker.__id=0;

/**
 * Gets a new Walker id.
 *
 * @private
 * @returns {integer} The new id.
 */
Walker.prototype.__newID = function () {
    return Walker.__id++;
};

/**
 * <p>This method is mainly used to be able to use Walker objects in a
 * {@link module:hashstructs~HashSet HashSet} or a {@link
 * module:hashstructs~HashMap HashMap}.</p>
 *
 * <p>Returns a hash guaranteed to be unique to this object. There are
 * some limitations. First, if this module is instantiated twice, the
 * objects created by the two instances cannot mix without violating
 * the uniqueness guarantee. Second, the hash is a monotonically
 * increasing counter, so when it reaches beyond the maximum integer
 * that the JavaScript vm can handle, things go kaboom.</p>
 *
 * @returns {integer} A number unique to this object.
 */
Walker.prototype.hash = function () { return this.id; };

/**
 * Fetch the set of possible events at the current stage of parsing.
 *
 * @returns {module:set~Set} The set of events that can be fired
 * without resulting in an error.
 */
Walker.prototype.possible = function () {
    return new EventSet(this._possible());
};

/**
 * Helper method for possible(). The possible() method is designed
 * to be safe, in that the value it returns is not shared, so the
 * caller may change it without breaking anything. However, this
 * method returns a value that may not be modified by the
 * caller. It is used internally among the classes of this file to
 * save copying time.
 *
 * @private
 * @returns {module:set~Set} The set of events that can be fired without
 * resulting in an error.
 */
Walker.prototype._possible = function () {
    throw new Error("must be implemented by derived classes");
};

// These functions return true if there is no problem, or a list of
// ValidationError objects otherwise.

/**
 * Passes an event to the walker for handling. The Walker will
 * determine whether it or one of its children can handle the
 * event.
 *
 * @param ev The event to handle.
 * @returns
 * {false|undefined|module:patterns~PartialMatch|
    Array.<module:errors~ValidationError>}
 * The value <code>false</code> if there was no error. The value
 * <code>undefined</code> if no walker matches the pattern. A
 * ``PartialMatch`` object if a chunk of text was partially
 * matched. (Note that this value is used only internally.) Otherwise,
 * an array of {@link module:patterns~ValidationError ValidationError}
 * objects.
 */
Walker.prototype.fireEvent = function (ev) {
    throw new Error("must be implemented by derived classes");
};

/**
 * Can this Walker validly end after the previous event fired?
 *
 * @param {boolean} attribute ``true`` if calling this method while
 * processing attributes, ``false`` otherwise.
 *
 * @return {boolean} <code>true</code> if the walker can validly end
 * here. <code>false</code> otherwise.
 */
Walker.prototype.canEnd = function (attribute) {
    return true;
};

/**
 * This method ends the Walker processing. It should not see any
 * further events after end is called.
 *
 * @param {boolean} attribute ``true`` if calling this method while
 * processing attributes, ``false`` otherwise.
 *
 * @returns {boolean|Array.<module:patterns~ValidationError>}
 * <code>false</code> if the walker ended without error. Otherwise, a
 * list of {@link module:patterns~ValidationError ValidationError}
 * objects.
 */
Walker.prototype.end = function (attribute) {
    return false;
};

/**
 * Deep copy the Walker.
 *
 * @returns {Walker} A deep copy of the Walker.
 */
Walker.prototype.clone = function () {
    return this._clone(new HashMap(hashHelper));
};

/**
 * Helper function for clone. Code that is not part of the Walker
 * family would call clone() whereas Walker and its derived classes
 * call _clone() with the appropriate memo.
 *
 * @private
 * @param {module:hashstructs~HashMap} memo A mapping of old object to
 * copy object, passed to ``_copyInto``.
 *
 * @returns An new object of the same class as the one being
 * cloned. The new object is a clone.
 */
Walker.prototype._clone = function (memo) {
    // _clone does not need to use the memo because Walker objects
    // form a tree. There are no cycles so we can't see the same
    // object twice. However, all Walkers have a reference to a name
    // resolver and need to clone it too, only once. So the memo is
    // still needed.
    var other = new this.constructor();
    this._copyInto(other, memo);
    return other;
};

/**
 * Helper method for ``_copyInto``. This method should be called to
 * clone objects that do not participate in the ``clone``, ``_clone``,
 * ``_copyInto`` protocol. This typically means instance properties
 * that are not ``Walker`` objects and not immutable.
 *
 * This method will call a ``clone`` method on ``obj``, when it
 * determines that cloning must happen.
 *
 * @private
 * @param {Object} obj The object to clone.
 * @param {Object} memo A mapping of old object to copy object. As a
 * tree of patterns is being cloned, this memo is populated. So if A
 * is cloned to B then a mapping from A to B is stored in the memo. If
 * A is seen again in the same cloning operation, then it will be
 * substituted with B instead of creating a new object. This should be
 * the same object as the one passed to ``_clone`` and ``_copyInto``.
 * @returns {Object} A clone of ``obj``.
 */
Walker.prototype._cloneIfNeeded = function (obj, memo) {
    var other = memo.has(obj);
    if (other !== undefined)
        return other;
    other = obj.clone();
    memo.add(obj, other);
    return other;
};



/**
 * Helper method for clone() and _clone(). All classes deriving
 * from Walker must implement their own version of this
 * function so that they copy and clone their fields as needed.
 *
 * @private
 *
 * @param {module:patterns~Pattern} obj Object into which we must copy
 * the fields of this object.
 *
 * @param {module:hashstructs~HashMap} memo The memo that contains the
 * copy mappings.  See {@link module:patterns~Walker#clone clone()}
 * above.
 */
Walker.prototype._copyInto = function (obj, memo) {
    // We can share the same Set because once created the Set
    // in this.possible_cached is not altered.
    obj.possible_cached = this.possible_cached;
    obj.suppressed_attributes = this.suppressed_attributes;

};

/**
 * Helper function used to prevent Walker objects from reporting
 * attribute events as possible. In RelaxNG it is normal to mix
 * attributes and elements in patterns. However, XML validation
 * segregates attributes and elements. Once a start tag has been
 * processed, attributes are not possible until a new start tag
 * begins. For instance, if a Walker is processing <code>&lt;foo
 * a="1"></code>, as soon as the greater than symbol is encountered,
 * attribute
 * events are no longer possible. This function informs the Walker
 * of this fact.
 *
 * @private
 */
Walker.prototype._suppressAttributes = function () {
    throw new Error("must be implemented by derived classes");
};

/**
 * @classdesc Mixin designed to be used for {@link
 * module:patterns~Walker Walker} objects that can only have one
 * subwalker.
 * @mixin
 * @constructor
 * @private
 */
function SingleSubwalker ()
{
    throw new Error("not meant to be called");
}

SingleSubwalker.prototype._possible = function (ev) {
    return this.subwalker.possible();
};

SingleSubwalker.prototype.fireEvent = function (ev) {
    return this.subwalker.fireEvent(ev);
};

SingleSubwalker.prototype._suppressAttributes = function () {
    if (!this.suppressed_attributes) {
        this.suppressed_attributes = true;
        this.subwalker._suppressAttributes();
    }
};

SingleSubwalker.prototype.canEnd = function (attribute) {
    return this.subwalker.canEnd(attribute);
};

SingleSubwalker.prototype.end = function (attribute) {
    return this.subwalker.end(attribute);
};



/**
 * @classdesc Mixin designed to be used for {@link
 * module:patterns~Walker Walker} objects that cannot have any
 * subwalkers.
 * @mixin
 * @constructor
 * @private
 */
function NoSubwalker ()
{
    throw new Error("not meant to be called");
}


NoSubwalker.prototype._suppressAttributes = function () {
    this.suppressed_attributes = true;
};

NoSubwalker.prototype.canEnd = function (attribute) {
    return true;
};

NoSubwalker.prototype.end = function (attribute) {
    return false;
};

/**
 * @classdesc Pattern for <code>&lt;empty/></code>.
 *
 * @constructor
 * @private
 * @extends module:patterns~Pattern
 */
var Empty = makeSingletonConstructor(Pattern);

inherit(Empty, Pattern);

// No need for _copyInto

addWalker(Empty, EmptyWalker);


/**
 * @classdesc Walker for {@link module:patterns~Empty Empty}.
 * @extends module:patterns~Walker
 * @mixes module:patterns~NoSubwalker
 * @constructor
 * @private
 * @param {module:patterns~Empty} el The pattern for which this walker
 * was created.
 * @param {module:name_resolver~NameResolver} name_resolver Ignored by
 * this walker.
 */
function EmptyWalker(el) {
    Walker.call(this);
    this.possible_cached = new EventSet();
}
inherit(EmptyWalker, Walker);
implement(EmptyWalker, NoSubwalker);

EmptyWalker.prototype.possible = function () {
    // Save some time by avoiding calling _possible
    return new EventSet();
};

EmptyWalker.prototype._possible = function () {
    return this.possible_cached;
};

EmptyWalker.prototype.fireEvent = function (ev) {
    if ((ev === empty_event) ||
        ((ev.params[0] === "text") && (ev.params[1].trim() === "")))
        return false;

    return undefined;
};

var Param = makeSingletonConstructor(Pattern);
inherit(Param, Pattern);
addWalker(Param, TextWalker); // Cheat until we have a real Data library.

/**
 * @classdesc List pattern.
 * @extends module:patterns~PatternOnePattern
 * @private
 * @constructor
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {module:patterns~Pattern} pat The single child pattern.
 */
function List(xml_path, pat) {
    PatternOnePattern.call(this, xml_path);
    this.pat = pat;
}
inherit(List, PatternOnePattern);
addWalker(List, ListWalker);

/**
 * @classdesc Walker for {@link module:patterns~List List}.
 *
 * @extends module:patterns~Walker
 * @mixes module:patterns~SingleSubwalker
 * @private
 * @constructor
 * @param {module:patterns~List} el The pattern for which this
 * walker was created.
 * @param {module:name_resolver~NameResolver} name_resolver The name
 * resolver that can be used to convert namespace prefixes to
 * namespaces.
 */
function ListWalker(el, name_resolver) {
    Walker.call(this);
    this.el = el;
    this.name_resolver = name_resolver;
    this.subwalker = (el !== undefined) ? el.pat.newWalker(this.name_resolver)
        : undefined;
    this.seen_tokens = false;
    this.matched = false;
}

inherit(ListWalker, Walker);
implement(ListWalker, SingleSubwalker);

ListWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    obj.name_resolver = this._cloneIfNeeded(this.name_resolver, memo);
    obj.subwalker = this.subwalker._clone(memo);
    obj.seen_tokens = this.seen_tokens;
    obj.matched = this.matched;
};


ListWalker.prototype.fireEvent = function (ev) {
    // Only these two types can match.
    if (ev.params[0] !== "text")
        return undefined;

    var trimmed = ev.params[1].trim();

    // The list walker cannot send empty strings to its children
    // because it validates a list of **tokens**.
    if (trimmed === '')
        return false;

    this.seen_tokens = true;

    var tokens = trimmed.split(/\s+/);

    for(var i = 0; i < tokens.length; ++i) {
        var ret = this.subwalker.fireEvent(new Event(ev.params[0],
                                                     tokens[i]));
        if (ret !== false)
            return ret;
    }

    this.matched = true;
    return false;
};

ListWalker.prototype._suppressAttributes = function () {
    // Lists cannot contain attributes.
};

ListWalker.prototype.canEnd = function (attribute) {
    if (!this.seen_tokens)
        return (this.subwalker.fireEvent(empty_event) === false);
    return this.subwalker.canEnd(attribute);
};

ListWalker.prototype.end = function (attribute) {
    var ret = this.subwalker.end(attribute);
    if (ret !== false)
        return ret;

    if (this.canEnd(attribute))
        return false;

    return [new ValidationError("unfulfilled list")];
};

/**
 * @classdesc Value pattern.
 * @extends module:patterns~Pattern
 * @private
 * @constructor
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {string} value The value expected in the document.
 * @param {string|undefined} type The type of value. ``undefined``
 * means ``"token"``.
 * @param {string|undefined} datatype_library The URI of the datatype
 * library to use. ``undefined`` means use the builtin library.
 * @param {string|ns} ns The namespace in which to interpret the value.
 */
function Value(xml_path, value, type, datatype_library, ns) {
    Pattern.call(this, xml_path);
    this.type = type || "token";
    this.datatype_library = datatype_library || "";
    this.ns = ns || "";
    this.datatype = registry.get(this.datatype_library).types[this.type];
    if (!this.datatype)
        throw new Error("unkown type: " + type);
    this.raw_value = value;
    this._value = undefined;
}

inherit(Value, Pattern);
addWalker(Value, ValueWalker);

Value.prototype._copyInto = function (obj, memo) {
    Pattern.prototype._copyInto.call(this, obj, memo);
    obj.value = this.value;
    obj.raw_value = this.raw_value;
    obj.type = this.type;
    obj.datatype_library = this.datatype_library;
    obj.ns = this.ns;
    obj.datatype = this.datatype; // Immutable.
    obj._value = this._value;
};

Object.defineProperty(Value.prototype, "value", {
    get: function () {
        var ret = this._value;
        if (ret)
            return ret;

        // We construct a pseudo-context representing the context in the
        // schema file.
        var context;
        if (this.datatype.needs_context) {
            var nr = new name_resolver.NameResolver();
            nr.definePrefix("", this.ns);
            context = {resolver: nr};
        }
        ret = this._value = this.datatype.parseValue(this.raw_value, context);

        return ret;
    }
});

/**
 * @classdesc Walker for {@link module:patterns~Value Value}.
 *
 * @extends module:patterns~Walker
 * @private
 * @constructor
 * @param {module:patterns~Value} el The pattern for which this
 * walker was created.
 * @param {module:name_resolver~NameResolver} name_resolver The name
 * resolver that can be used to convert namespace prefixes to
 * namespaces.
 */
function ValueWalker(el, name_resolver) {
    Walker.call(this);
    this.el = el;
    this.name_resolver = name_resolver;
    this.matched = false;
    this.possible_cached =
        el ? new EventSet(new Event("text", el.raw_value)): undefined;
    this.context = (el && el.datatype.needs_context) ?
        {resolver: this.name_resolver}: undefined;
}
inherit(ValueWalker, Walker);

ValueWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    obj.name_resolver = this._cloneIfNeeded(this.name_resolver, memo);
    obj.context = this.context ? {resolver: obj.name_resolver}: undefined;
    obj.matched = this.matched;
    // possible_cached taken care of by Walker
};

ValueWalker.prototype._possible = function () {
    return this.possible_cached;
};

ValueWalker.prototype.fireEvent = function(ev) {
    if (this.matched)
        return undefined;

    if (ev.params[0] !== "text")
        return undefined;

    if (!this.el.datatype.equal(ev.params[1], this.el.value, this.context))
        return undefined;

    this.matched = true;
    this.possible_cached = new EventSet();
    return false;
};

ValueWalker.prototype.canEnd = function (attribute) {
    return this.matched || this.el.raw_value === "";
};

ValueWalker.prototype.end = function (attribute) {
    if (this.canEnd(attribute))
        return false;

    return [new ValidationError("value required: " + this.el.raw_value)];
};

ValueWalker.prototype._suppressAttributes = function () {
    // No child attributes.
};

/**
 * @classdesc Data pattern.
 * @extends module:patterns~Pattern
 * @private
 * @constructor
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {string|undefined} type The type of value. ``undefined``
 * means ``"token"``.
 * @param {string|undefined} datatype_library The URI of the datatype
 * library to use. ``undefined`` means use the builtin library.
 * @param {Array.<{name: string, value: string}>} params The
 * parameters from the RNG file.
 * @param {module:patterns~Pattern} except The exception pattern.
 */
function Data(xml_path, type, datatype_library, params, except) {
    Pattern.call(this, xml_path);
    this.type = type || "token";
    this.datatype_library = datatype_library || "";
    this.except = except;
    this.datatype = registry.get(this.datatype_library).types[this.type];
    if (!this.datatype)
        throw new Error("unkown type: " + type);
    this.rng_params = params || [];
    this._params = undefined;
}

inherit(Data, Pattern);
addWalker(Data, DataWalker);

Data.prototype._copyInto = function (obj, memo) {
    Pattern.prototype._copyInto.call(this, obj, memo);
    obj.type = this.type;
    obj.datatype_library = this.datatype_library;
    obj.except = this.except && this.except._clone(memo);
    obj.datatype = this.datatype; // Immutable
    obj.rng_params = this.rng_params; // Immutable
    obj._params = this._params; // Immutable
};

Object.defineProperty(Data.prototype, "params", {
    get: function () {
        var ret = this._params;
        if (ret)
            return ret;

        ret = this._params = this.datatype.parseParams(
            this.xml_path, this.rng_params);

        return ret;
    }
});

/**
 * @classdesc Walker for {@link module:patterns~Data Data}.
 *
 * @extends module:patterns~Walker
 * @private
 * @constructor
 * @param {module:patterns~Data} el The pattern for which this
 * walker was created.
 * @param {module:name_resolver~NameResolver} name_resolver The name
 * resolver that can be used to convert namespace prefixes to
 * namespaces.
 */
function DataWalker(el, name_resolver) {
    Walker.call(this);
    this.el = el;
    this.name_resolver = name_resolver;

    // An undefined el can happen when cloning.
    if (this.el) {
        // We completely ignore the possible exception when producing
        // the possibilities. There is no clean way to specify such an
        // exception.
        this.possible_cached =
            new EventSet(new Event("text", this.el.datatype.regexp));
        this.context = (this.el.datatype.needs_context) ?
            {resolver: this.name_resolver}: undefined;
    }

}
inherit(DataWalker, Walker);

DataWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    obj.name_resolver = this._cloneIfNeeded(this.name_resolver, memo);
    obj.context = this.context ? {resolver: obj.name_resolver}: undefined;
    obj.matched = this.matched;
    // possible_cached taken care of by Walker
};

DataWalker.prototype._possible = function () {
    return this.possible_cached;
};

DataWalker.prototype.fireEvent = function(ev) {
    if (this.matched)
        return undefined;

    if (ev.params[0] !== "text")
        return undefined;

    if (this.el.datatype.disallows(ev.params[1], this.el.params,
                                   this.context))
        return undefined;

    if (this.el.except) {
        var walker = this.el.except.newWalker(this.name_resolver);
        var except_ret = walker.fireEvent(ev);

        // False, so the except does match the text, and so this
        // pattern does not match it.
        if (except_ret === false)
            return undefined;

        // Otherwise, it is undefined, in which case it means the
        // except does not match the text, and we are fine. Or it
        // would be possible for the walker to have returned an error
        // but there is nothing we can do with such errors here.
    }

    this.matched = true;
    this.possible_cached = new EventSet();
    return false;
};

DataWalker.prototype.canEnd = function (attribute) {

    // If we matched, we are done. salve does not allow text that
    // appears in an XML element to be passed as two "text" events. So
    // there is nothing to come that could falsify the match. (If a
    // client *does* pass multiple text events one after the other, it
    // is using salve incorrectly.)
    if (this.matched)
        return true;

    // We have not matched anything. Therefore we have to check
    // whether we allow the empty string.
    if (this.el.except) {
        var walker = this.el.except.newWalker(this.name_resolver);
        if (walker.canEnd()) // Matches the empty string
            return false;
    }

    return !this.el.datatype.disallows("", this.el.params,
                                       this.context);
};

DataWalker.prototype.end = function (attribute) {
    if (this.canEnd(attribute))
        return false;

    return [new ValidationError("value required")];
};

DataWalker.prototype._suppressAttributes = function () {
    // No child attributes.
};



/**
 * @classdesc Pattern for <code>&lt;notAllowed/></code>.
 * @extends module:patterns~Pattern
 *
 * @constructor
 * @private
 */
var NotAllowed = makeSingletonConstructor(Pattern);
inherit(NotAllowed, Pattern);
addWalker(NotAllowed, NotAllowedWalker);

/**
 * @classdesc Walker for {@link module:patterns~NotAllowed NotAllowed}.
 *
 * @extends module:patterns~Walker
 * @private
 * @constructor
 * @param {module:patterns~NotAllowed} el The pattern for which this
 * walker was created.
 * @param {module:name_resolver~NameResolver} name_resolver Ignored by
 * this class.
 */
function NotAllowedWalker(el) {
    Walker.call(this);
    this.el = el;
    this.possible_cached = new EventSet();
}
inherit(NotAllowedWalker, Walker);

NotAllowedWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    // possible_cached taken care of by Walker
};

NotAllowedWalker.prototype.possible = function () {
    // Save some time by avoiding calling _possible
    return new EventSet();
};

NotAllowedWalker.prototype._possible = function () {
    return this.possible_cached;
};

NotAllowedWalker.prototype.fireEvent = function (ev) {
    return undefined; // we never match!
};

/**
 * @classdesc Pattern for <code>&lt;text/></code>.
 * @extends module:patterns~Pattern
 *
 * @constructor
 * @private
 */
var Text = makeSingletonConstructor(Pattern);
inherit(Text, Pattern);

addWalker(Text, TextWalker);

/**
 *
 * @classdesc Walker for {@link module:patterns~Text Text}
 * @extends module:patterns~Walker
 * @mixes module:patterns~NoSubwalker
 * @private
 * @constructor
 * @param {module:patterns~Text} el The pattern for which this walker
 * was constructed.
*/
function TextWalker (el) {
    Walker.call(this);
    this.possible_cached = new EventSet(TextWalker._text_event);
}
inherit(TextWalker, Walker);
implement(TextWalker, NoSubwalker);

// Events are constant so create the one we need just once.
TextWalker._text_event = new Event("text", /^.*$/);

TextWalker.prototype._possible = function () {
    return this.possible_cached;
};

TextWalker.prototype.fireEvent = function (ev) {
    return (ev.params[0] === "text") ? false: undefined;
};

/**
 * @classdesc A pattern for RNG references.
 * @extends module:patterns~Pattern
 * @private
 * @constructor
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {string} name The reference name.
 */
function Ref(xml_path, name) {
    Pattern.call(this, xml_path);
    this.name = name;
    this.resolves_to = undefined;
}
inherit(Ref, Pattern);

Ref.prototype._prepare = function () {
    // We do not cross ref/define boundaries to avoid infinite
    // loops.
    return;
};

//addWalker(Ref, RefWalker); No, see below
Ref.prototype._copyInto = function (obj, memo) {
    Pattern.prototype._copyInto.call(this, obj, memo);
    obj.name = this.name;
    obj.resolves_to = this.resolves_to;
};

Ref.prototype._resolve = function (definitions) {
    this.resolves_to = definitions[this.name];
    if (this.resolves_to === undefined)
        return [this];
    return undefined;
};

// This completely skips the creation of RefWalker and
// DefineWalker. This returns the walker for whatever it is that
// the Define element this refers to ultimately contains.
Ref.prototype.newWalker = function (name_resolver) {
    return this.resolves_to.pat.newWalker(name_resolver);
};

/**
 * @classdesc A pattern for &lt;oneOrMore>.
 * @extends module:patterns~Pattern
 *
 * @private
 * @constructor
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {Array.<module:patterns~Pattern>} pats The pattern contained
 * by this one.
 * @throws {Error} If <code>pats</code> is not of length 1.
 */
function OneOrMore(xml_path, pats) {
    PatternOnePattern.call(this, xml_path);
    // Undefined happens when cloning.
    if (pats !== undefined) {
        if (pats.length !== 1)
            throw new Error("OneOrMore needs exactly one pattern.");
        this.pat = pats[0];
    }
}

inherit(OneOrMore, PatternOnePattern);
addWalker(OneOrMore, OneOrMoreWalker);

/**
 *
 * @classdesc Walker for {@link module:patterns~OneOrMore OneOrMore}
 * @extends module:patterns~Walker
 *
 * @private
 * @constructor
 * @param {module:patterns~OneOrMore} el The pattern for which this
 * walker was created.
 * @param {module:name_resolver~NameResolver} name_resolver The name
 * resolver that can be used to convert namespace prefixes to
 * namespaces.
 */
function OneOrMoreWalker(el, name_resolver)
{
    Walker.call(this);
    this.seen_once = false;
    this.el = el;
    this.name_resolver = name_resolver;
    this.current_iteration = undefined;
    this.next_iteration = undefined;
}
inherit(OneOrMoreWalker, Walker);

OneOrMoreWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.seen_once = this.seen_once;
    obj.el = this.el;
    obj.name_resolver = this._cloneIfNeeded(this.name_resolver, memo);
    obj.current_iteration = (this.current_iteration !== undefined) ?
        this.current_iteration._clone(memo) : undefined;
    obj.next_iteration = (this.next_iteration !== undefined) ?
        this.next_iteration._clone(memo) : undefined;
};

OneOrMoreWalker.prototype._instantiateCurrentIteration = function () {
    if (this.current_iteration === undefined)
        this.current_iteration = this.el.pat.newWalker(this.name_resolver);
};

OneOrMoreWalker.prototype._instantiateNextIteration = function () {
    if (this.next_iteration === undefined) {
        this.next_iteration = this.el.pat.newWalker(this.name_resolver);

        // Whereas _suppressAttributes calls
        // _instantiateCurrentIteration() so that current_iteration is
        // always existing and its _suppressAttributes() method is
        // called before _suppressAttributes() returns, the same is
        // not true of next_iteration. So if we create it **after**
        // _suppressAttributes() was called we need to call
        // _suppressAttributes() on it.
        if (this.suppressed_attributes)
            this.next_iteration._suppressAttributes();
    }
};


OneOrMoreWalker.prototype._possible = function() {
    if (this.possible_cached !== undefined)
        return this.possible_cached;

    this._instantiateCurrentIteration();
    this.possible_cached = this.current_iteration._possible();

    if (this.current_iteration.canEnd()) {
        this.possible_cached = new EventSet(this.possible_cached);
        this._instantiateNextIteration();

        var next_possible = this.next_iteration._possible(this.name_resolver);

        this.possible_cached.union(next_possible);
    }

    return this.possible_cached;
};

OneOrMoreWalker.prototype.fireEvent = function(ev) {
    this.possible_cached = undefined;

    this._instantiateCurrentIteration();

    var ret = this.current_iteration.fireEvent(ev);
    if (ret === false)
        this.seen_once = true;

    if (ret !== undefined)
        return ret;

    if (this.seen_once && this.current_iteration.canEnd()) {
        ret = this.current_iteration.end();
        if (ret)
            throw new Error("internal error; canEnd() returns "+
                            "true but end() fails");

        this._instantiateNextIteration();
        var next_ret = this.next_iteration.fireEvent(ev);
        if (next_ret === false) {
            this.current_iteration = this.next_iteration;
            this.next_iteration = undefined;
        }
        return next_ret;
    }
    return undefined;
};

OneOrMoreWalker.prototype._suppressAttributes = function () {
    // A oneOrMore element can happen if we have the pattern
    // ``(attribute * { text })+`` for instance. Once converted to the
    // simplified RNG, it becomes:
    //
    // ``<oneOrMore><attribute><anyName/><rng:text/></attribute></oneOrMore>``
    //
    // An attribute in ``oneOrMore`` cannot happen when ``anyName`` is
    // not used because an attribute of any given name cannot be
    // repeated.
    //
    this._instantiateCurrentIteration();
    if (!this.suppressed_attributes) {
        this.suppressed_attributes = true;
        this.possible_cached = undefined; // No longer valid.
        this.current_iteration._suppressAttributes();

        if (this.next_iteration)
            this.next_iteration._suppressAttributes();
    }
};

OneOrMoreWalker.prototype.canEnd = function (attribute) {
    if (attribute) {
        if (!this.el.pat._hasAttrs())
            return true;

        this._instantiateCurrentIteration();

        return this.current_iteration.canEnd(true);
    }
    return this.seen_once && this.current_iteration.canEnd();
};

OneOrMoreWalker.prototype.end = function (attribute) {
    if (this.canEnd(attribute))
        return false;

    // Undefined current_iteration can happen in rare cases.
    this._instantiateCurrentIteration();

    // Release next_iteration, which we won't need anymore.
    this.next_iteration = undefined;
    return this.current_iteration.end(attribute);
};

/**
 * @classdesc A pattern for &lt;choice>.
 * @extends module:patterns~Pattern
 * @private
 * @constructor
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {Array.<module:patterns~Pattern>} pats The patterns
 * contained by this one.
 * @throws {Error} If <code>pats</code> is not of length 2.
*/
function Choice(xml_path, pats) {
    PatternTwoPatterns.call(this, xml_path);
    // Undefined happens when cloning.
    if (pats !== undefined) {
        if (pats.length !== 2)
            throw new Error(
                "ChoiceWalker does not work with " +
                    "Choices that have not exactly 2 elements");
        this.pat_a = pats[0];
        this.pat_b = pats[1];
    }
}

inherit(Choice, PatternTwoPatterns);
addWalker(Choice, ChoiceWalker);

/**
 * @classdesc Walker for {@link module:patterns~Choice Choice}
 * @extends module:patterns~Walker
 * @private
 * @constructor
 * @param {module:patterns~Choice} el The pattern for which this
 * walker was created.
 * @param {module:name_resolver~NameResolver} name_resolver The name
 * resolver that can be used to convert namespace prefixes to
 * namespaces.
 */
function ChoiceWalker(el, name_resolver) {
    Walker.call(this);
    this.el = el;
    this.name_resolver = name_resolver;
    this.chosen = false;

    this.walker_a = this.walker_b = undefined;
    this.instantiated_walkers = false;

}

inherit(ChoiceWalker, Walker);

ChoiceWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    obj.name_resolver = this._cloneIfNeeded(this.name_resolver, memo);
    obj.chosen = this.chosen;
    obj.walker_a = (this.walker_a !== undefined) ?
        this.walker_a._clone(memo):undefined;
    obj.walker_b = (this.walker_b !== undefined) ?
        this.walker_b._clone(memo): undefined;
    obj.instantiated_walkers = this.instantiated_walkers;
};

/**
 * Creates walkers for the patterns contained by this one. Calling
 * this method multiple times is safe as the walkers are created once
 * and only once.
 *
 * @private
 */
ChoiceWalker.prototype._instantiateWalkers = function () {
    if (!this.instantiated_walkers) {
        this.instantiated_walkers = true;

        this.walker_a = this.el.pat_a.newWalker(this.name_resolver);
        this.walker_b = this.el.pat_b.newWalker(this.name_resolver);
    }
};


ChoiceWalker.prototype._possible = function () {
    this._instantiateWalkers();
    if (this.possible_cached !== undefined)
        return this.possible_cached;

    this.possible_cached = (this.walker_a !== undefined) ?
        this.walker_a._possible() : undefined;

    if (this.walker_b !== undefined) {
        this.possible_cached = new EventSet(this.possible_cached);
        var possible_b = this.walker_b._possible();
        this.possible_cached.union(possible_b);
    }
    else if (this.possible_cached === undefined)
        this.possible_cached = new EventSet();

    return this.possible_cached;
};

ChoiceWalker.prototype.fireEvent = function(ev) {
    this._instantiateWalkers();

    this.possible_cached = undefined;
    // We purposely do not normalize this.walker_{a,b} to a boolean
    // value because we do want `undefined` to be the result if the
    // walkers are undefined.
    var ret_a = this.walker_a && this.walker_a.fireEvent(ev);
    var ret_b = this.walker_b && this.walker_b.fireEvent(ev);

    if (ret_a !== undefined) {
        this.chosen = true;
        if (ret_b === undefined) {
            this.walker_b = undefined;
            return ret_a;
        }
        return ret_a;
    }

    if (ret_b !== undefined) {
        this.chosen = true;
        // We do not need to test if ret_a is undefined because we
        // would not get here if it were not.
        this.walker_a = undefined;
        return ret_b;
    }

    return undefined;
};

ChoiceWalker.prototype._suppressAttributes = function () {
    this._instantiateWalkers();
    if (!this.suppressed_attributes) {
        this.possible_cached = undefined; // no longer valid
        this.suppressed_attributes = true;

        if (this.walker_a)
            this.walker_a._suppressAttributes();
        if (this.walker_b)
            this.walker_b._suppressAttributes();
    }
};

ChoiceWalker.prototype.canEnd = function (attribute) {
    this._instantiateWalkers();

    var ret_a = false;
    var ret_b = false;
    if (attribute) {
        ret_a = !this.el.pat_a._hasAttrs();
        ret_b = !this.el.pat_b._hasAttrs();
    }

    // The `!!` are to normalize to boolean values.
    ret_a = ret_a || (!!this.walker_a && this.walker_a.canEnd(attribute));
    ret_b = ret_b || (!!this.walker_b && this.walker_b.canEnd(attribute));

    // ChoiceWalker can end if any walker can end. The assignments
    // earlier ensure that the logic works.
    return ret_a || ret_b;
};

ChoiceWalker.prototype.end = function (attribute) {
    this._instantiateWalkers();

    if (this.canEnd(attribute)) return false;

    // The `!!` are to normalize to boolean values.
    var ret_a = !!this.walker_a && this.walker_a.end(attribute);
    var ret_b = !!this.walker_b && this.walker_b.end(attribute);

    if (!ret_a && !ret_b)
        return false;

    if (ret_a && !ret_b)
        return ret_a;

    if (!ret_a && ret_b)
        return ret_b;

    // If we are here both walkers exist and returned an error.
    var names_a = [];
    var names_b = [];
    var not_a_choice_error = false;
    this.walker_a.possible().forEach(function (ev) {
        if (ev.params[0] === "enterStartTag")
            names_a.push(ev.params[1]);
        else
            not_a_choice_error = true;
    });

    if (!not_a_choice_error) {
        this.walker_b.possible().forEach(function (ev) {
            if (ev.params[0] === "enterStartTag")
                names_b.push(ev.params[1]);
            else
                not_a_choice_error = true;
        });

        if (!not_a_choice_error)
            return [new ChoiceError(names_a, names_b)];
    }

    // If we get here, we were not able to raise a ChoiceError,
    // possibly because there was not enough information to decide
    // among the two walkers. Return whatever error comes first.
    return ret_a || ret_b;
};


/**
 * @classdesc A pattern for &lt;group>.
 * @extends module:patterns~PatternTwoPatterns
 *
 * @private
 * @constructor
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {Array.<module:patterns~Pattern>} pats The patterns
 * contained by this one.
 * @throws {Error} If <code>pats</code> is not of length 2.
 */
function Group(xml_path, pats) {
    PatternTwoPatterns.call(this, xml_path);
    // Undefined happens when cloning.
    if (pats !== undefined) {
        if (pats.length !== 2)
            throw new Error("GroupWalkers walk only groups of two elements!");
        this.pat_a = pats[0];
        this.pat_b = pats[1];
    }
}

inherit(Group, PatternTwoPatterns);
addWalker(Group, GroupWalker);

/**
 * @classdesc Walker for {@link module:patterns~Group Group}
 * @extends module:patterns~Walker
 * @private
 * @constructor
 * @param {module:patterns~Group} el The pattern for which this walker
 * was created.
 * @param {module:name_resolver~NameResolver} name_resolver The name
 * resolver that can be used to convert namespace prefixes to
 * namespaces.
 */
function GroupWalker(el, name_resolver) {
    Walker.call(this);
    this.el = el;
    this.name_resolver = name_resolver;

    this.hit_a = false;
    this.ended_a = false;
    this.hit_b = false;
    this.walker_a = this.walker_b = undefined;
}
inherit(GroupWalker, Walker);

GroupWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    obj.name_resolver = this._cloneIfNeeded(this.name_resolver, memo);
    obj.hit_a = this.hit_a;
    obj.ended_a = this.ended_a;
    obj.hit_b = this.hit_b;
    obj.walker_a = (this.walker_a !== undefined) ?
        this.walker_a._clone(memo) : undefined;
    obj.walker_b = (this.walker_b !== undefined) ?
        this.walker_b._clone(memo) : undefined;
};

/**
 * Creates walkers for the patterns contained by this one. Calling
 * this method multiple times is safe as the walkers are created once
 * and only once.
 *
 * @private
 */
GroupWalker.prototype._instantiateWalkers = function () {
    if (this.walker_a === undefined) {
        this.walker_a = this.el.pat_a.newWalker(this.name_resolver);
        this.walker_b = this.el.pat_b.newWalker(this.name_resolver);
    }
};

GroupWalker.prototype._possible = function () {
    this._instantiateWalkers();
    if (this.possible_cached !== undefined)
        return this.possible_cached;

    this.possible_cached = (!this.ended_a) ?
        this.walker_a._possible() : undefined;

    if (this.suppressed_attributes) {
        // If we are in the midst of processing walker a and it cannot
        // end yet, then we do not want to see anything from b.
        if (this.ended_a || this.walker_a.canEnd()) {
            this.possible_cached = new EventSet(this.possible_cached);
            this.possible_cached.union(this.walker_b._possible());
        }
    }
    else {
        var possible_b = this.walker_b._possible();

        // Attribute events are still possible event if the first
        // walker is not done with.
        if ((!this.ended_a || this.hit_b) && !this.walker_a.canEnd()) {
            // Narrow it down to attribute events...
            possible_b = possible_b.filter(function (x) {
                return x.isAttributeEvent();
            });
        }
        this.possible_cached = new EventSet(this.possible_cached);
        this.possible_cached.union(possible_b);
    }

    return this.possible_cached;
};

GroupWalker.prototype.fireEvent = function(ev) {
    this._instantiateWalkers();

    this.possible_cached = undefined;
    if (!this.ended_a) {
        var ret_a = this.walker_a.fireEvent(ev);
        if (ret_a !== undefined) {
            this.hit_a = true;
            return ret_a;
        }

        // We must return right away if walker_a cannot yet end. Only
        // attribute events are allowed to move forward.
        if (!ev.isAttributeEvent() && !this.walker_a.canEnd())
            return undefined;
    }

    var ret_b = this.walker_b.fireEvent(ev);
    if (ret_b !== undefined)
        this.hit_b = true;

    // Non-attribute event: if walker b matched the event then we
    // must end walker_a, if we've not already done so.
    if (!ev.isAttributeEvent() && ret_b !== undefined && !this.ended_a) {
        var end_ret = this.walker_a.end();
        this.ended_a = true;

        // Combine the possible errors.
        if (!ret_b)
            // ret_b must be false, because ret_b === undefined has
            // been eliminated above; toss it.
            ret_b = end_ret;
        else if (end_ret)
            ret_b = ret_b.concat(end_ret);
    }
    return ret_b;
};

GroupWalker.prototype._suppressAttributes = function () {
    this._instantiateWalkers();
    if (!this.suppressed_attributes) {
        this.possible_cached = undefined; // no longer valid
        this.suppressed_attributes = true;

        this.walker_a._suppressAttributes();
        this.walker_b._suppressAttributes();
    }
};

GroupWalker.prototype.canEnd = function (attribute) {
    this._instantiateWalkers();
    if (attribute) {
        var a_has = this.el.pat_a._hasAttrs();
        var b_has = this.el.pat_b._hasAttrs();
        if (a_has && b_has)
            return this.walker_a.canEnd(attribute) &&
            this.walker_b.canEnd(attribute);
        else if (a_has)
            return this.walker_a.canEnd(true);
        else if (b_has)
            return this.walker_b.canEnd(true);
        else
            return true;
    }

    return this.walker_a.canEnd(attribute) && this.walker_b.canEnd(attribute);
};

GroupWalker.prototype.end = function (attribute) {
    if (this.canEnd())
        return false;

    var ret;

    if (!this.ended_a) { // Don't end it more than once.
        ret = this.walker_a.end(attribute);
        if (ret)
            return ret;
    }

    ret = this.walker_b.end(attribute);
    if (ret)
        return ret;

    return false;
};

/**
 * @classdesc A pattern for &lt;interleave>.
 * @extends module:patterns~PatternTwoPatterns
 *
 * @private
 * @constructor
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {Array.<module:patterns~Pattern>} pats The patterns
 * contained by this one.
 * @throws {Error} If <code>pats</code> is not of length 2.
 */
function Interleave(xml_path, pats) {
    PatternTwoPatterns.call(this, xml_path);
    // Undefined happens when cloning.
    if (pats !== undefined) {
        if (pats.length !== 2)
            throw new Error("InterleaveWalkers walk only interleaves of " +
                            "two elements!");
        this.pat_a = pats[0];
        this.pat_b = pats[1];
    }
}

inherit(Interleave, PatternTwoPatterns);
addWalker(Interleave, InterleaveWalker);

/**
 * @classdesc Walker for {@link module:patterns~Interleave Interleave}
 * @extends module:patterns~Walker
 * @private
 * @constructor
 * @param {module:patterns~Interleave} el The pattern for which this walker
 * was created.
 * @param {module:name_resolver~NameResolver} name_resolver The name
 * resolver that can be used to convert namespace prefixes to
 * namespaces.
 */
function InterleaveWalker(el, name_resolver) {
    Walker.call(this);
    this.el = el;
    this.name_resolver = name_resolver;

    this.in_a = false;
    this.in_b = false;
    this.walker_a = this.walker_b = undefined;
}

inherit(InterleaveWalker, Walker);

InterleaveWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    obj.name_resolver = this._cloneIfNeeded(this.name_resolver, memo);
    obj.in_a = this.in_a;
    obj.in_b = this.in_b;
    obj.walker_a = this.walker_a && this.walker_a._clone(memo);
    obj.walker_b = this.walker_b && this.walker_b._clone(memo);
};

/**
 * Creates walkers for the patterns contained by this one. Calling
 * this method multiple times is safe as the walkers are created once
 * and only once.
 *
 * @private
 */
InterleaveWalker.prototype._instantiateWalkers = function () {
    if (!this.walker_a)
        this.walker_a = this.el.pat_a.newWalker(this.name_resolver);
    if (!this.walker_b)
        this.walker_b = this.el.pat_b.newWalker(this.name_resolver);
};

InterleaveWalker.prototype._possible = function () {
    this._instantiateWalkers();
    if (this.possible_cached !== undefined)
        return this.possible_cached;

    if (this.in_a && this.in_b)
        // It due to the restrictions imposed by Relax NG, it should
        // not be possible to be both in_a and in_b.
        throw new Error("impossible state");

    if (this.in_a && !this.walker_a.canEnd())
        this.possible_cached = this.walker_a._possible();
    else if (this.in_b && !this.walker_b.canEnd())
        this.possible_cached = this.walker_b._possible();

    if (!this.possible_cached) {
        this.possible_cached = this.walker_a.possible();
        this.possible_cached.union(this.walker_b._possible());
    }

    return this.possible_cached;
};

InterleaveWalker.prototype.fireEvent = function(ev) {
    this._instantiateWalkers();

    this.possible_cached = undefined;

    if (this.in_a && this.in_b)
        // It due to the restrictions imposed by Relax NG, it should
        // not be possible to be both in_a and in_b.
        throw new Error("impossible state");

    var ret_a, ret_b;
    if (!this.in_a && !this.in_b) {
        ret_a = this.walker_a.fireEvent(ev);
        if (ret_a === false) {
            this.in_a = true;
            return false;
        }
        else {
            // The constraints on interleave do not allow for two
            // child patterns of interleave to match. So if the first
            // walker matched, the second cannot. So we don't have to
            // fireEvent on the second walker if the first matched.
            ret_b = this.walker_b.fireEvent(ev);
            if (ret_b === false) {
                this.in_b = true;
                return false;
            }

            if (ret_b === undefined)
                return ret_a;
        }

        if (ret_a === undefined)
            return ret_b;

        return ret_a.concat(ret_b);
    }
    else if (this.in_a) {
        ret_a = this.walker_a.fireEvent(ev);
        if (ret_a || ret_a === false)
            return ret_a;

        // If we got here, ret_a === undefined
        ret_b = this.walker_b.fireEvent(ev);

        if (ret_b === false) {
            this.in_a = false;
            this.in_b = true;
            return false;
        }
    }
    else { // in_b
        ret_b = this.walker_b.fireEvent(ev);
        if (ret_b || ret_b === false)
            return ret_b;

        // If we got here, ret_b === undefined
        ret_a = this.walker_a.fireEvent(ev);

        if (ret_a === false) {
            this.in_a = true;
            this.in_b = false;
            return false;
        }
    }

    return undefined;
};

InterleaveWalker.prototype._suppressAttributes = function () {
    this._instantiateWalkers();
    if (!this.suppressed_attributes) {
        this.possible_cached = undefined; // no longer valid
        this.suppressed_attributes = true;

        this.walker_a._suppressAttributes();
        this.walker_b._suppressAttributes();
    }
};

InterleaveWalker.prototype.canEnd = function (attribute) {
    this._instantiateWalkers();
    return this.walker_a.canEnd(attribute) && this.walker_b.canEnd(attribute);
};

InterleaveWalker.prototype.end = function (attribute) {
    this._instantiateWalkers();
    var ret_a = this.walker_a.end(attribute);
    var ret_b = this.walker_b.end(attribute);

    if (ret_a && !ret_b)
        return ret_a;

    if (ret_b && !ret_a)
        return ret_b;

    if (!ret_a && !ret_b)
        return false;

    return ret_a.concat(ret_b);
};

/**
 * @classdesc A pattern for attributes.
 * @extends module:patterns~PatternOnePattern
 *
 * @private
 * @constructor
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {string} name The qualified name of the attribute.
 * @param {Array.<module:patterns~Pattern>} pats The pattern
 * contained by this one.
 * @throws {Error} If <code>pats</code> is not of length 1.
*/
function Attribute(xml_path, name, pats) {
    PatternOnePattern.call(this, xml_path);
    this.name = name;
    if (pats !== undefined) {
        if (pats.length !== 1)
            throw new Error("Attribute needs exactly one pattern.");
        this.pat = pats[0];
    }
}

inherit(Attribute, PatternOnePattern);
addWalker(Attribute, AttributeWalker);
Attribute.prototype._copyInto = function (obj, memo) {
    Pattern.prototype._copyInto.call(this, obj, memo);
    obj.name = this.name;
    obj.pat = this.pat;
};

Attribute.prototype._prepare = function (namespaces) {
    var nss = Object.create(null);
    this.name._recordNamespaces(nss);

    // A lack of namespace on an attribute should not be recorded.
    delete nss[""];

    // Copy the resulting namespaces.
    var keys = Object.keys(nss);
    for (var i = 0, key; (key = keys[i]); ++i)
        namespaces[key] = 1;
};

Attribute.prototype._hasAttrs = function () {
    return true;
};

/**
 * @classdesc Walker for {@link module:patterns~Attribute Attribute}
 * @extends module:patterns~Walker
 *
 * @private
 * @constructor
 * @param {module:patterns~Attribute} el The pattern for which this
 * walker was created.
 * @param {module:name_resolver~NameResolver} name_resolver The name
 * resolver that can be used to convert namespace prefixes to
 * namespaces.
 */
function AttributeWalker(el, name_resolver) {
    Walker.call(this);
    this.el = el;
    this.name_resolver = name_resolver;
    this.seen_name = false;
    this.seen_value = false;
    this.subwalker = undefined;

    this.attr_name_event = el && new Event("attributeName", el.name);
}
inherit(AttributeWalker, Walker);

AttributeWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    obj.name_resolver = this._cloneIfNeeded(this.name_resolver, memo);
    obj.seen_name = this.seen_name;
    obj.seen_value = this.seen_value;
    obj.subwalker = this.subwalker && this.subwalker._clone(memo);

    // No need to clone; values are immutable.
    obj.attr_name_event = this.attr_name_event;
};

AttributeWalker.prototype._possible = function () {
    // We've been suppressed!
    if (this.suppressed_attributes)
        return new EventSet();

    if (!this.seen_name)
        return new EventSet(this.attr_name_event);
    else if (!this.seen_value) {
        if (this.subwalker === undefined)
            this.subwalker = this.el.pat.newWalker(this.name_resolver);

        var sub = this.subwalker._possible();
        var ret = new EventSet();
        // Convert text events to attributeValue events.
        sub.forEach(function (ev) {
            if (ev.params[0] !== "text")
                throw new Error("unexpected event type: " + ev.params[0]);
            ret.add(new Event("attributeValue", ev.params[1]));
        });
        return ret;
    }
    else
        return new EventSet();
};

// _possible always return new sets.
AttributeWalker.prototype.possible = AttributeWalker.prototype._possible;

AttributeWalker.prototype.fireEvent = function (ev) {
    if (this.suppressed_attributes)
        return undefined;

    if (this.seen_name) {
        if (!this.seen_value && ev.params[0] === "attributeValue") {
            this.seen_value = true;

            if (!this.subwalker)
                this.subwalker = this.el.pat.newWalker(this.name_resolver);

            // Convert the attributeValue event to a text event.
            var text_ev = new Event("text", ev.params[1]);
            var ret = this.subwalker.fireEvent(text_ev);

            if (ret === undefined)
                return [new AttributeValueError("invalid attribute value",
                                                this.el.name)];
            else if (ret instanceof PartialMatch)
                return [new AttributeValueError("invalid attribute value",
                                               this.el.name)];

            // Attributes end immediately.
            if (ret === false)
                ret = this.subwalker.end();

            return ret;
        }
    }
    else if (ev.params[0] === "attributeName" &&
             this.el.name.match(ev.params[1], ev.params[2])) {
        this.seen_name = true;
        return false;
    }

    return undefined;
};

AttributeWalker.prototype._suppressAttributes = function () {
    this.suppressed_attributes = true;
};

AttributeWalker.prototype.canEnd = function (attribute) {
    return this.seen_value;
};

AttributeWalker.prototype.end = function (attribute) {
    if (!this.seen_name)
        return [new AttributeNameError("attribute missing", this.el.name)];
    else if (!this.seen_value)
        return [new AttributeValueError("attribute value missing",
                                        this.el.name)];
    return false;
};

/**
 * @classdesc A pattern for elements.
 * @extends module:patterns~PatternOnePattern
 * @private
 * @constructor
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {string} name The qualified name of the element.
 * @param {Array.<module:patterns~Pattern>} pats The pattern
 * contained by this one.
 * @throws {Error} If <code>pats</code> is not of length 1.
 */
function Element(xml_path, name, pats) {
    PatternOnePattern.call(this, xml_path);
    this.name = name;
    if (pats !== undefined) {
        if (pats.length !== 1)
            throw new Error("Element requires exactly one pattern.");
        this.pat = pats[0];
    }
}

inherit(Element, PatternOnePattern);
// addWalker(Element, ElementWalker); Nope... see below..
Element.prototype._copyInto = function (obj, memo) {
    PatternOnePattern.prototype._copyInto.call(this, obj, memo);
    obj.name = this.name;
};

Element.prototype._prepare = function (namespaces) {
    this.name._recordNamespaces(namespaces);
    this.pat._prepare(namespaces);
};

Element.prototype.newWalker = function (name_resolver) {
    if (this.pat instanceof NotAllowed)
        return this.pat.newWalker(name_resolver);

    return new ElementWalker(this, name_resolver);
};

Element.prototype._hasAttrs = function () {
    return false;
};

Element.prototype._elementDefinitions = function (memo) {
    var key = this.name.toString();
    if (memo[key] === undefined)
        memo[key] = [this];
    else
        memo[key].push(this);
};

/**
 *
 * @classdesc Walker for {@link module:patterns~Element Element}
 * @extends module:patterns~Walker
 * @private
 * @constructor
 * @param {module:patterns~Element} el The pattern for which this
 * walker was created.
 * @param {module:name_resolver~NameResolver} name_resolver The name
 * resolver that can be used to convert namespace prefixes to
 * namespaces.
 */
function ElementWalker(el, name_resolver) {
    Walker.call(this);
    this.el = el;
    this.name_resolver = name_resolver;
    this.seen_name = false;
    this.ended_start_tag = false;
    this.closed = false;
    this.walker = undefined;
    this.start_tag_event = el && new Event("enterStartTag", el.name);
    this.end_tag_event = undefined;
    this.bound_name = undefined;
}
inherit(ElementWalker, Walker);
// Reuse the same event object, since they are immutable
ElementWalker._leaveStartTag_event = new Event("leaveStartTag");

ElementWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    obj.name_resolver = this._cloneIfNeeded(this.name_resolver, memo);
    obj.seen_name = this.seen_name;
    obj.ended_start_tag = this.ended_start_tag;
    obj.closed = this.closed;
    obj.walker = (this.walker !== undefined) ?
        this.walker._clone(memo) : undefined;

    // No cloning needed since these are immutable.
    obj.start_tag_event = this.start_tag_event;
    obj.end_tag_event = this.end_tag_event;
    obj.bound_name = this.bound_name;
};

ElementWalker.prototype._possible = function () {
    if (!this.seen_name) {
        return new EventSet(this.start_tag_event);
    }
    else if (!this.ended_start_tag) {
        var all = this.walker._possible();
        var ret = new EventSet();
        // We use value_evs to record whether an attributeValue
        // is a possibility. If so, we must only return these
        // possibilities and no other.
        var value_evs = new EventSet();
        all.forEach(function (poss) {
            if (poss.params[0] === "attributeValue")
                value_evs.add(poss);
            else if (poss.isAttributeEvent())
                ret.add(poss);
        });

        if (value_evs.size())
            ret = value_evs;
        else if (this.walker.canEnd(true))
            ret.add(ElementWalker._leaveStartTag_event);

        return ret;
    }
    else if (!this.closed)
    {
        var posses = new EventSet(this.walker._possible());
        if (this.walker.canEnd())
            posses.add(this.end_tag_event);
        return posses;
    }
    else
    {
        return new EventSet();
    }
};

// _possible always returns new sets
ElementWalker.prototype.possible = ElementWalker.prototype._possible;

ElementWalker.prototype.fireEvent = function (ev) {
    var ret, errs, err, i;
    if (!this.ended_start_tag) {
        if (!this.seen_name) {
            if (ev.params[0] === "enterStartTag" &&
                this.el.name.match(ev.params[1], ev.params[2])) {
                this.walker = this.el.pat.newWalker(
                    this.name_resolver);
                this.seen_name = true;
                this.bound_name = new name_patterns.Name(
                    "", ev.params[1], ev.params[2]);
                this.end_tag_event = new Event("endTag",
                                               this.bound_name);
                return false;
            }
        }
        else if (ev.params[0] === "leaveStartTag") {
            this.ended_start_tag = true;

            errs = this.walker.end(true);
            ret = [];
            for(i = 0; (err = errs[i]); ++i) {
                if (err instanceof AttributeValueError ||
                    err instanceof AttributeNameError)
                    ret.push(err);
            }
            if (ret.length === 0)
                ret = false;

            // And suppress the attributes.
            this.walker._suppressAttributes();

            // We do not return undefined here
            return ret || false;
        }

        return (this.walker !== undefined) ?
            this.walker.fireEvent(ev): undefined;
    }
    else if (!this.closed) {
        ret = this.walker.fireEvent(ev);
        if (ret === undefined) {
            // Our subwalker did not handle the event, so we must
            // do it here.
            if  (ev.params[0] === "endTag") {
                if (this.bound_name.match(ev.params[1], ev.params[2])) {
                    this.closed = true;

                    errs = this.walker.end();
                    ret = [];

                    // Strip out the attributes errors as we've
                    // already reported them.
                    for(i = 0; (err = errs[i]); ++i) {
                        if (err instanceof AttributeValueError ||
                            err instanceof AttributeNameError)
                            continue;

                        ret.push(err);
                    }

                    return ret.length !== 0 && ret;
                }
            }
            else if (ev.params[0] === "leaveStartTag")
                return [new ValidationError(
                    "unexpected leaveStartTag event; " +
                        "it is likely that "+
                        "fireEvent is incorrectly called")];

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
    if (attribute)
        return true;
    return this.closed;
};

ElementWalker.prototype.end = function (attribute) {
    if (attribute)
        return false;

    var ret = [];
    if (!this.seen_name)
        ret.push(new ElementNameError("tag required", this.el.name));
    else if (!this.ended_start_tag || !this.closed) {
        if (this.walker !== undefined) {
            var errs = this.walker.end();
            if (errs)
                ret = errs;
        }
        ret.push(this.ended_start_tag ?
                 new ElementNameError("tag not closed",
                                      this.el.name) :
                 new ElementNameError("start tag not terminated",
                                      this.el.name));
    }

    if (ret.length > 0)
        return ret;

    return false;
};


/**
 * @classdesc A pattern for &lt;define>.
 * @extends module:patterns~PatternOnePattern
 * @private
 * @constructor
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {string} name The name of the definition.
 * @param {Array.<module:patterns~Pattern>} pats The pattern
 * contained by this one.
 * @throws {Error} If <code>pats</code> is not of length 1.
 */
function Define(xml_path, name, pats) {
    PatternOnePattern.call(this, xml_path);
    this.name = name;
    if (pats !== undefined) {
        if (pats.length !== 1)
            throw new Error("Define needs exactly one pattern.");
        this.pat = pats[0];
    }
}
inherit(Define, PatternOnePattern);
addWalker(Define, DefineWalker);

Define.prototype._copyInto = function (obj, memo) {
    PatternOnePattern.prototype._copyInto.call(this, obj, memo);
    obj.name = this.name;
};

/**
 * @classdesc Walker for {@link module:patterns~Define Define}
 * @extends module:patterns~Walker
 * @mixes module:patterns~SingleSubwalker
 * @private
 * @constructor
 * @param {module:patterns~Define} el The pattern for which this
 * walker was created.
 * @param {module:name_resolver~NameResolver} name_resolver The name
 * resolver that can be used to convert namespace prefixes to
 * namespaces.
 */
function DefineWalker(el, name_resolver) {
    Walker.call(this);
    this.el = el;
    this.name_resolver = name_resolver;
    this.subwalker = (el !== undefined) ? el.pat.newWalker(this.name_resolver)
        : undefined;
}
inherit(DefineWalker, Walker);
implement(DefineWalker, SingleSubwalker);

DefineWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    obj.name_resolver = this._cloneIfNeeded(this.name_resolver, memo);
    obj.subwalker = this.subwalker._clone(memo);
};

/**
 * @classdesc <p>This is an exception raised to indicate references to
 * undefined entities in a schema. If for instance element A has
 * element B as its children but B is not defined, then this exception
 * would be raised.</p>
 *
 * <p>This exception is indicative of an internal error because by the
 * time this module loads a schema, the schema should have been
 * simplified already and simplification should have failed due to the
 * unresolvable reference.</p>
 * @extends Error
 * @constructor
 *
 * @param {module:set~Set} references The set of references that could
 * not be resolved.
 */
function ReferenceError(references) {
    this.references = references;
}
inherit(ReferenceError, Error);

/**
 * @returns {string} A string representation of the error.
 */
ReferenceError.prototype.toString = function () {
    return "Cannot resolve the following references: " +
        this.references.toString();
};

/**
 * Create a Grammar object. Users of this library normally do not
 * create objects of this class themselves but rely on
 * constructTree().
 *
 * @constructor
 * @private
 * @param {string} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {module:patterns~Pattern} start The start pattern of this
 * grammar.
 * @param {Array.<module:patterns~Define>} definitions An array of {@link
 * module:patterns~Define Define} objects which contain all
 * definitions specified in this grammar.
 *
 * @throws {module:patterns~ReferenceError} When any definition in the
 * original schema refers to a schema entity which is not defined in
 * the schema.
 */
function Grammar(xml_path, start, definitions) {
    this.xml_path = xml_path;
    this.start = start;
    this.definitions = Object.create(null);
    this._element_definitions = undefined;
    this._namespaces = Object.create(null);
    var me = this;
    if (definitions) {
        definitions.forEach(function (x) {
            me.add(x);
        });
    }
    this._resolve();
    this._prepare(this._namespaces);
}
Grammar.prototype.definitions = undefined;
Grammar.prototype.start = undefined;

/**
 * Resolves references.
 *
 * @private
 *
 * @throws {module:patterns~ReferenceError} When any definition in the
 * original schema refers to a schema entity which is not defined in
 * the schema.
 */
Grammar.prototype._resolve = function () {
    var all = [];
    var ret;
    for (var d in this.definitions) {
        ret = this.definitions[d]._resolve(this.definitions);
        if (ret)
            all = all.concat(ret);
    }
    ret = this.start._resolve(this.definitions);
    if (ret)
        all = all.concat(ret);

    if (all.length)
        throw new ReferenceError(all);
};

/**
 * Adds a definition.
 *
 * @param {module:patterns~Define} d The definition to add.
 */
Grammar.prototype.add = function (d) {
    this.definitions[d.name] = d;
    if (d.name === "start")
        this.start = d;
};

/**
 * <p>This method must be called after resolution has been
 * performed.</p>
 *
 * <p>This function now performs two tasks: a) it prepares the
 * attributes (Definition and Element objects maintain a pattern
 * which contains only attribute patterns, and nothing else), b)
 * it gathers all the namespaces seen in the schema.</p>
 *
 * @private
 * @param {Object} namespaces An object whose keys are the
 * namespaces seen in the schema. This method populates the object.
 */
Grammar.prototype._prepare = function (namespaces) {
    this.start._prepare(namespaces);
    for (var d in this.definitions) {
        this.definitions[d]._prepare(namespaces);
    }
};

/**
 * Populates a memo with a mapping of (element name, [list of
 * patterns]). In a Relax NG schema, the same element name may appear
 * in multiple contexts, with multiple contents. For instance an
 * element named "name" could require the sequence of elements
 * "firstName", "lastName" in a certain context and text in a
 * different context. This method allows determining whether this
 * happens or not within a pattern.
 *
 * @private
 * @param {Object} memo The memo in which to store the information.
 */
Grammar.prototype._elementDefinitions = function (memo) {
    for (var d in this.definitions)
        this.definitions[d]._elementDefinitions(memo);
};

Object.defineProperty(Grammar.prototype, "element_definitions", {
    get: function () {
        var ret = this._element_definitions;
        if (ret)
            return ret;


        ret = this._element_definitions = Object.create(null);
        this._elementDefinitions(ret);
        return ret;
    }
});

/**
 * @returns {boolean} <code>true</code> if the schema is wholly context
 * independent. This means that each element in the schema can be
 * validated purely on the basis of knowing its expanded
 * name. <code>false</code> otherwise.
 */
Grammar.prototype.whollyContextIndependent = function () {
    var defs = this.element_definitions;
    for (var v in defs)
        if (defs[v].length > 1)
            return false;

    return true;
};

/**
 *
 * @returns {Array.<string>} An array of all namespaces used in the
 * schema. The array may contain two special values: ``*`` indicates
 * that there was an ``anyName`` element in the schema and thus that
 * it is probably possible to insert more than the namespaces listed
 * in the array, ``::except`` indicates that an ``except`` element is
 * affecting what namespaces are acceptable to the schema.
 */
Grammar.prototype.getNamespaces = function () {
    return Object.keys(this._namespaces);
};

addWalker(Grammar, GrammarWalker);

/**
 *
 * @classdesc Walker for {@link module:patterns~Grammar Grammar}
 * @extends module:patterns~Walker
 * @mixes module:patterns~SingleSubwalker
 * @private
 * @constructor
 * @param {module:patterns~Grammar} el The grammar for which this
 * walker was created.
 */
function GrammarWalker(el) {
    Walker.call(this);
    this.el = el;
    this._name_resolver = new name_resolver.NameResolver();
    this.subwalker = (el !== undefined) ?
        el.start.newWalker(this._name_resolver) : undefined;
    // A stack that keeps state for misplace elements. The elements of
    // this stack are either Array or Walker objects. They are arrays
    // when we are dealing with an element which is unknown to the
    // schema (or which cannot be unambigiously determined. They are
    // Walker objects when we can find a definition in the schema.
    this._misplaced_elements = [];
    this._swallow_attribute_value = false;
    this.suspended_ws = undefined;
    this.ignore_next_ws = false;
    this._prev_ev_was_text = false;
}

inherit(GrammarWalker, Walker);
implement(GrammarWalker, SingleSubwalker);

GrammarWalker.prototype.subwalker = undefined;
GrammarWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    obj.subwalker = this.subwalker._clone(memo);
    obj._misplaced_elements = [];
    for(var i = 0, mpe;
        (mpe = this._misplaced_elements[i]) !== undefined; ++i)
        obj._misplaced_elements.push(mpe instanceof Walker ?
                                   mpe._clone(memo) :
                                   mpe.concat([]));
    obj._swallow_attribute_value = this.swallow_attribute_value;
    obj._name_resolver = this._cloneIfNeeded(this._name_resolver, memo);
    obj.suspended_ws = this.suspended_ws;
    obj.ignore_next_ws = this.ignore_next_ws;
    obj._prev_ev_was_text = this._prev_ev_was_text;
};

/**
 * Resolves a name using the walker's own name resolver.
 * @param {string} name A qualified name.
 * @param {boolean} attribute Whether this qualified name refers to an
 * attribute.
 * @returns {module:patterns~EName|undefined} An expanded name, or
 * undefined if the name cannot be resolved.
 */
GrammarWalker.prototype.resolveName = function (name, attribute) {
    return this._name_resolver.resolveName(name, attribute);
};

/**
 * See {@link module:name_resolver~NameResolver.unresolveName
 * NameResolver.unresolveName} for the details.
 *
 * @param {string} uri The URI part of the expanded name.
 * @param {string} name The name part.
 * @returns {string|undefined} The qualified name that corresponds to
 * the expanded name, or <code>undefined</code> if it cannot be resolved.
 */
GrammarWalker.prototype.unresolveName = function (uri, name) {
    return this._name_resolver.unresolveName(uri, name);
};


/**
 * On a GrammarWalker this method cannot return
 * <code>undefined</code>. An undefined value would mean nothing
 * matched, which is a validation error.
 *
 * @param {module:patterns~Event} ev The event to fire.
 * @returns {false|Array.<module:patterns~ValidationError>} The value
 * <code>false</code> if there is no error or an array of
 * {@link module:patterns~ValidationError ValidationError} objects.
 * @throws {Error} When name resolving events
 * (<code>enterContext</code>, <code>leaveContext</code>, or
 * <code>definePrefix</code>) are passed while this walker was not
 * instructed to create its own name resolver or when trying to
 * process an event type unknown to salve.
 */
GrammarWalker.prototype.fireEvent = function (ev) {
    function combineWsErrWith(x) {
        if (ws_err === undefined)
            ws_err = [new ValidationError("text not allowed here")];

        if (ws_err === false)
            return x;

        if (x === false)
            return ws_err;

        if (x === undefined)
            throw new Error("undefined x");

        return ws_err.concat(x);
    }

    if (ev.params[0] === "enterContext" ||
        ev.params[0] === "leaveContext" ||
        ev.params[0] === "definePrefix")
    {
        switch (ev.params[0])
        {
        case "enterContext":
            this._name_resolver.enterContext();
            break;
        case "leaveContext":
            this._name_resolver.leaveContext();
            break;
        case "definePrefix":
            this._name_resolver.definePrefix(ev.params[1], ev.params[2]);
            break;
        }
        return false;
    }

    // Process whitespace nodes
    if (ev.params[0] === "text" && ev.params[1].trim() === "") {
        if (this.suspended_ws)
            this.suspended_ws += ev.params[1];
        else
            this.suspended_ws = ev.params[1];
        return false;
    }

    // This is the walker we must fire all our events on.
    var walker = (this._misplaced_elements.length > 0 &&
                  this._misplaced_elements[0] instanceof Walker) ?
            // This happens if we ran into a misplaced element that we were
            // able to infer.
            this._misplaced_elements[0] : this.subwalker;


    var ignore_next_ws_now = this.ignore_next_ws;
    this.ignore_next_ws = false;
    var ws_err = false;
    switch(ev.params[0]) {
    case "enterStartTag":
        // Absorb the whitespace: poof, gone!
        this.suspended_ws = undefined;
        break;
    case "text":
        if (this._prev_ev_was_text)
            throw new Error("fired two text events in a row: this is " +
                            "disallowed by salve");

        if (this.ignore_next_ws) {
            this.suspended_ws = undefined;
            var trimmed = ev.params[1].replace(/^\s+/, '');
            if (trimmed.length !== ev.params[1].length)
                ev = new Event("text", trimmed);
        }
        else if (this.suspended_ws) {
            ws_err = walker.fireEvent(new Event("text", this.suspended_ws));
            this.suspended_ws = undefined;
        }
        break;
    case "endTag":
        this.ignore_next_ws = true;
        /* falls through */
    default:
        // Process the whitespace that was suspended.
        if (this.suspended_ws && !ignore_next_ws_now)
            ws_err = walker.fireEvent(new Event("text", this.suspended_ws));
        this.suspended_ws = undefined;
    }

    // We can update it here because we're done examining the value
    // that was set from the previous call to fireEvent.
    this._prev_ev_was_text = (ev.params[0] === "text");

    if (this._misplaced_elements.length > 0 &&
        this._misplaced_elements[0] instanceof Array) {
        // We are in a misplaced element which is foreign to the
        // schema (or which cannot be infered unambiguously.
        var mpe = this._misplaced_elements[0];
        switch(ev.params[0]) {
        case "enterStartTag":
            mpe.unshift(ev.params.slice(1));
            break;
        case "endTag":
            mpe.shift();
            break;
        }

        // We're done with this context.
        if (!mpe.length)
            this._misplaced_elements.shift();

        return false;
    }

    // This would happen if the user puts an attribute on a tag that
    // does not allow one. Instead of generating errors for both the
    // attribute name and value, we generate an error for the name and
    // ignore the value.
    if (this.swallow_attribute_value) {
        // Swallow only one event.
        this.swallow_attribute_value = false;
        if (ev.params[0] === "attributeValue")
            return false;
        else
            return [new ValidationError("attribute value required")];
    }

    var ret = walker.fireEvent(ev);

    if (ret instanceof PartialMatch) {
        if (ev.params[0] !== "text")
            throw new Error("got PartialMatch when firing a non-text event");

        // Create a new event with the rest of the text and fire it.
        var rest = new Event("text", ev.params[1].slice(ret.length));
        return this.fireEvent(rest);
    }
    else if (ret === undefined) {
        switch(ev.params[0]) {
        case "enterStartTag":
            var name = new name_patterns.Name("",
                                              ev.params[1], ev.params[2]);
            ret = [new ElementNameError(
                "tag not allowed here",
                name)];

            // Try to infer what element is meant by this errant
            // tag. If we can't find a candidate, then fall back to a
            // dumb mode.
            var candidates = this.el.element_definitions[name.toString()];
            if (candidates && candidates.length === 1) {
                var new_walker = candidates[0].newWalker(this._name_resolver);
                this._misplaced_elements.unshift(new_walker);
                if (new_walker.fireEvent(ev) !== false)
                    throw new Error("internal error: the infered element " +
                                    "does not accept its initial event");
            }
            else
                // Dumb mode...
                this._misplaced_elements.unshift([ev.params.slice(1)]);
            break;
        case "endTag":
            ret = [new ElementNameError(
                "unexpected end tag",
                new name_patterns.Name("", ev.params[1], ev.params[2]))];
            break;
        case "attributeName":
            ret = [new AttributeNameError(
                "attribute not allowed here",
                new name_patterns.Name("", ev.params[1], ev.params[2]))];
            this.swallow_attribute_value = true;
            break;
        case "attributeValue":
            ret = [new ValidationError(
                "unexpected attributeValue event; it is likely "+
                    "that fireEvent is incorrectly called")];
            break;
        case "text":
            ret = [new ValidationError("text not allowed here")];
            break;
        case "leaveStartTag":
            // If the _misplaced_elements stack did not exist then we
            // would get here if a file being validated contains a tag
            // which is not allowed. An ElementNameError will already
            // have been issued. So rather than violate our contract
            // (which says no undefined value may be returned) or
            // require that callers do something special with
            // 'undefined' as a return value, just treat this event as
            // a non-error.
            //
            // But the stack exists, so we cannot get here. If we do
            // end up here, then there is an internal error somewhere.
            /* falls through */
        default:
            throw new Error("unexpected event type in " +
                            "GrammarWalker's fireEvent: " +
                            ev.params[0]);
        }
    }

    // Check whether the context should end
    if (this._misplaced_elements.length > 0 &&
        this._misplaced_elements[0] instanceof Walker) {
        walker = this._misplaced_elements[0];
        if (walker.canEnd()) {
            this._misplaced_elements.shift();
            var end_ret = walker.end();
            if (end_ret)
                ret = ret ? ret.concat(end_ret) : end_ret;
        }
    }

    return combineWsErrWith(ret);
};

GrammarWalker.prototype.possible = function (ev) {
    if (this._misplaced_elements.length) {
        var mpe = this._misplaced_elements[0];
        // Return an empty set if the tags are unknown to us.
        return mpe instanceof Walker ? mpe.possible() : new EventSet();
    }

    // There's no point in calling this._possible.
    return this.subwalker.possible();
};

GrammarWalker.prototype._suppressAttributes = function () {
    throw new Error("_suppressAttributes cannot be called on a GrammarWalker");
 };

exports.Event = Event;
exports.eventsToTreeString = eventsToTreeString;
exports.EName = EName;
exports.ReferenceError = ReferenceError;
exports.ValidationError = ValidationError;
exports.AttributeNameError = AttributeNameError;
exports.AttributeValueError = AttributeValueError;
exports.ElementNameError = ElementNameError;
exports.ChoiceError = ChoiceError;
exports.Grammar = Grammar;
exports.Walker = Walker;

//
// Things used only during testing.
//
var tret = {};

tret.GrammarWalker = GrammarWalker;
tret.Text = Text;

exports.__test = function () { return tret; };

//
// Exports which are meant for other modules internal to salve.
//
// DO NOT USE THIS OUTSIDE SALVE! THIS EXPORT MAY CHANGE AT ANY TIME!
// YOU'VE BEEN WARNED!
//
var name_patterns = require("./name_patterns");
exports.__protected = {
    Empty: Empty,
    Data: Data,
    List: List,
    Param: Param,
    Value: Value,
    NotAllowed: NotAllowed,
    Text: Text,
    Ref: Ref,
    OneOrMore: OneOrMore,
    Choice: Choice,
    Group: Group,
    Attribute: Attribute,
    Element: Element,
    Define: Define,
    Grammar: Grammar,
    EName: EName,
    Interleave: Interleave,
    Name: name_patterns.Name,
    NameChoice: name_patterns.NameChoice,
    NsName: name_patterns.NsName,
    AnyName: name_patterns.AnyName,
};

});

//  LocalWords:  namespaces validator namespace xmlns validators EOF
//  LocalWords:  lookahead enterStartTag attributeName newWalker URI
//  LocalWords:  makeSingletonConstructor HashSet constructTree RNG
//  LocalWords:  subpatterns hashstructs cleanAttrs fireEvent HashMap
//  LocalWords:  EName ValidationError msg modelizes args uri RelaxNG
//  LocalWords:  attributeValue leaveStartTag AttributeWalker API MPL
//  LocalWords:  ElementWalker subwalkers NotAllowed RefWalker Mixin
//  LocalWords:  DefineWalker oneOrMore ChoiceWalker subwalker Dubeau
//  LocalWords:  ChoiceError GroupWalker unresolvable addWalker el lt
//  LocalWords:  useNameResolver GrammarWalker formedness notAllowed
//  LocalWords:  ElementNameError GrammarWalker's Mangalam util oop
//  LocalWords:  CodeMirror tokenizer jshint newcap validthis canEnd
//  LocalWords:  SingleNameError NoSubwalker SingleSubwalker ATTRS ev
//  LocalWords:  endTag PatternTwoPatterns GroupWalkers rng attr vm
//  LocalWords:  PatternOnePattern enterContext leaveContext NG ret
//  LocalWords:  definePrefix firstName lastName ttt EventSet unshift
//  LocalWords:  suppressAttributes
