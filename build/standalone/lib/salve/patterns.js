/**
 * @module patterns
 * @desc Classes that model RNG patterns.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
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

        var name_or_path = function(el) {
            return (el !== undefined) ?
                ((el.name !== undefined) ?
                 (" named " + el.name.toString())
                 : (" with path " + el.xml_path)) : "";
        };

        call_dump = function (msg, name, me) {
            trace(buf + msg + name + " on class " + me.constructor.name +
                  " id " + me.id +
                  ((me.el !== undefined)?name_or_path(me.el):name_or_path(me)));
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
 * @returns {module:set~Set} The set of references that cannot be
 * resolved. This should be empty if everything has been
 * resolved. The caller is free to modify the value returned as
 * needed.
 */
Pattern.prototype._resolve = function (definitions) {
    return new Set();
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
 * Helper method for _prepare(). This method will remove all
 * non-attribute children among the patterns of this object,
 * recursively. So after returning, this object contains only
 * attributes and the Patterns necessary to contain them.
 *
 * This is a destructive operation: it modifies the object on
 * which it is called. Expected to be called on patterns that have
 * been cloned from the original tree.
 *
 * This method crosses the ref-define boundaries.
 *
 * @private
 *
 * @returns {undefined|module:patterns~Pattern} The pattern itself, if after
 * transformation it has attributes among its patterns. Undefined if
 * the pattern needs to be tossed because it does not contain any
 * attributes.
 */

Pattern.prototype._keepAttrs = function () {
    // No children, toss.
    return undefined;
};

/**
 * <p>Helper method for _prepare(). This method goes through the
 * children of this object to clean out Patterns that are no longer
 * needed once non-attribute Patterns have been removed. For instance,
 * a group which used to contain an element and an attribute will
 * contain only an attribute once the element has been removed. This
 * group has effectively become meaningless so _cleanAttrs would
 * modify the tree to replace the group with its child. Supposing that
 * <code>a</code> and <code>c</code> are attributes, <code>b</code> is
 * an element:</p>
 *
 * <pre><code>Group(Group(a, b), c) -> Group(a, c)</code></pre>
 *
 * <p>This is a destructive operation: it modifies the object on which
 * it is called. Expected to be called on patterns that have been
 * cloned from the original tree.</p>
 *
 * @private
 *
 * @returns {undefined|Array} A report of the form <code>[el,
 * flag]</code>. The <code>el</code> element is the pattern which
 * replaces the pattern on which the method was called. The
 * <code>flag</code> element tells whether there has been a
 * modification inside <code>el</code>. The return value is undefined
 * when the pattern needs to be tossed.
 */
Pattern.prototype._cleanAttrs = function () {
    return undefined;
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
    return new Set(this.pat._resolve(definitions));
};

PatternOnePattern.prototype._copyInto = function (obj, memo) {
    Pattern.prototype._copyInto.call(this, obj, memo);
    obj.pat = this.pat._clone(memo);
};

PatternOnePattern.prototype._prepare = function(namespaces)  {
    this.pat._prepare(namespaces);
};

PatternOnePattern.prototype._keepAttrs = function () {
    var pats = [];
    var atts = this.pat._keepAttrs();
    if (atts !== undefined) {
        this.pat = atts;
        return this;
    }

    // No children, toss.
    return undefined;
};

PatternOnePattern.prototype._cleanAttrs = function () {
    var modified = false;

    var atts = this.pat._cleanAttrs();

    if (atts !== undefined) {
        if (atts[0] instanceof Empty)
            return undefined;

        this.pat = atts[0];
        modified = atts[1];
        return [this, modified];
    }

    return undefined;
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
    var set = this.pat_a._resolve(definitions);
    set.union(this.pat_b._resolve(definitions));
    return set;
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

PatternTwoPatterns.prototype._keepAttrs = function () {
    var pats = [];
    var atts = this.pat_a._keepAttrs();
    if (atts !== undefined)
        pats.push(atts);

    atts = this.pat_b._keepAttrs();
    if (atts !== undefined)
        pats.push(atts);

    if (pats.length > 0)
    {
        this.pats = pats;
        return this;
    }

    // No children, toss.
    return undefined;
};

/**
 * Cleans the attributes in the two patterns contained by this one.
 *
 * @private
 * @returns {undefined|Array} A value to be interpreted as in the same way as
 * the return value of {@link module:~validate~Pattern#_cleanAttrs _cleanAttrs}.
 */
PatternTwoPatterns.prototype._cleanAttrsFromPat = function () {
    var modified = false;
    var pats = [];
    var atts = this.pat_a._cleanAttrs();
    if (atts !== undefined) {
        pats.push(atts[0]);
        modified = atts[1];
    }
    atts = this.pat_b._cleanAttrs();
    if (atts !== undefined) {
        pats.push(atts[0]);
        modified = modified || atts[1];
    }

    if (pats.length === 0)
        return undefined;

    return [pats, modified];
};

PatternTwoPatterns.prototype._cleanAttrs = function () {
    var cleaned = this._cleanAttrsFromPat();
    if (cleaned === undefined)
        return undefined;
    var pats = cleaned[0];

    // After modifications we don't allow anything...
    if ((pats.length === 1) && (pats[0] instanceof Empty))
        return undefined;

    this.pat_a = pats[0];
    this.pat_b = pats[1];

    return [this, cleaned[1]];
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
    var params = (arguments[0] instanceof Array) ?
        arguments[0] :
        Array.prototype.slice.call(arguments);

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
    //  wrap(this, "_possible", possible_tracer);
    //  wrap(this, "fireEvent", fireEvent_tracer);
    //  //wrap(this, "end", plain_tracer);
    //  //wrap(this, "_suppressAttributes", plain_tracer);
    //  //wrap(this, "_clone", plain_tracer);
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
 * @return {boolean} <code>true</code> if the walker can validly end
 * here. <code>false</code> otherwise.
 */
Walker.prototype.canEnd = function () {
    return true;
};

/**
 * This method ends the Walker processing. It should not see any
 * further events after end is called.
 *
 * @returns {boolean|Array.<module:patterns~ValidationError>}
 * <code>false</code> if the walker ended without error. Otherwise, a
 * list of {@link module:patterns~ValidationError ValidationError}
 * objects.
 */
Walker.prototype.end = function () {
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
 * copy object. As a tree of patterns is being cloned, this memo is
 * populated. So if A is cloned to B then a mapping from A to B is
 * stored in the memo. If A is seen again in the same cloning
 * operation, then it will be substituted with B instead of creating a
 * new object.
 *
 * @returns An new object of the same class as the one being
 * cloned. The new object is a clone.
 */
Walker.prototype._clone = function (memo) {
    var other = memo.has(this);
    if (other !== undefined)
        return other;
    other = new this.constructor();
    memo.add(this, other);
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

SingleSubwalker.prototype.canEnd = function () {
    return this.subwalker.canEnd();
};

SingleSubwalker.prototype.end = function () {
    return this.subwalker.end();
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

NoSubwalker.prototype.canEnd = function () {
    return true;
};

NoSubwalker.prototype.end = function () {
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

Empty.prototype._keepAttrs = function () {
    return this;
};

Empty.prototype._cleanAttrs = function () {
    return [this, false];
};

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

ListWalker.prototype.canEnd = function () {
    if (!this.seen_tokens)
        return (this.subwalker.fireEvent(empty_event) === false);
    return this.subwalker.canEnd();
};

ListWalker.prototype.end = function () {
    var ret = this.subwalker.end();
    if (ret !== false)
        return ret;

    if (this.canEnd())
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
    // We construct a pseudo-context representing the context in the
    // schema file.
    var context;
    if (this.datatype.needs_context) {
        var nr = new name_resolver.NameResolver();
        nr.definePrefix("", this.ns);
        context = {resolver: nr};
    }
    this.value = this.datatype.parseValue(value, context);
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
};

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
    this.possible_cached = new EventSet(new Event("text", el.raw_value));
    this.context = (this.el.datatype.needs_context) ?
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

ValueWalker.prototype.canEnd = function () {
    return this.matched || this.el.raw_value === "";
};

ValueWalker.prototype.end = function () {
    if (this.canEnd())
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
 * @param {Array.<{name: string, value: string}>} params The parameters.
 * @param {module:patterns~Except} except The exception pattern.
 */
function Data(xml_path, type, datatype_library, params, except) {
    Pattern.call(this, xml_path);
    this.type = type || "token";
    this.datatype_library = datatype_library || "";
    this.except = except;
    this.datatype = registry.get(this.datatype_library).types[this.type];
    if (!this.datatype)
        throw new Error("unkown type: " + type);
    this.params = this.datatype.parseParams(xml_path, params || []);
}

inherit(Data, Pattern);
addWalker(Data, DataWalker);

Data.prototype._copyInto = function (obj, memo) {
    Pattern.prototype._copyInto.call(this, obj, memo);
    obj.type = this.type;
    obj.datatype_library = this.datatype_library;
    obj.params = this.params; // Immutable
    obj.except = this.except && this.except._clone(memo);
    obj.datatype = this.datatype; // Immutable
};

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

    if (this.el.datatype.disallows(ev.params[1], this.el.params, this.context))
        return undefined;

    this.matched = true;
    this.possible_cached = new EventSet();
    return false;
};

DataWalker.prototype.canEnd = function () {
    return this.matched || !this.el.datatype.disallows("", this.el.params,
                                                       this.context);
};

DataWalker.prototype.end = function () {
    if (this.canEnd())
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
TextWalker._text_event = new Event("text", "*");

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
        return new Set(this);
    return new Set();
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
OneOrMore.prototype._cleanAttrs = function () {
    return [this.pat, true];
};

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

OneOrMoreWalker.prototype._possible = function() {
    if (this.possible_cached !== undefined)
        return this.possible_cached;

    if (this.current_iteration === undefined)
        this.current_iteration = this.el.pat.newWalker(this.name_resolver);

    this.possible_cached = this.current_iteration._possible();

    if (this.current_iteration.canEnd()) {
        this.possible_cached = new EventSet(this.possible_cached);
        if (this.next_iteration === undefined) {
            this.next_iteration = this.el.pat.newWalker(this.name_resolver);
        }

        var next_possible = this.next_iteration._possible(this.name_resolver);

        this.possible_cached.union(next_possible);
    }

    return this.possible_cached;
};

OneOrMoreWalker.prototype.fireEvent = function(ev) {
    this.possible_cached = undefined;

    if (this.current_iteration === undefined)
        this.current_iteration = this.el.pat.newWalker(this.name_resolver);

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

        if (this.next_iteration === undefined)
            this.next_iteration = this.el.pat.newWalker(this.name_resolver);

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
    // A oneOrMore element cannot have an attribute as a child.
};

OneOrMoreWalker.prototype.canEnd = function () {
    return this.seen_once && this.current_iteration.canEnd();
};

OneOrMoreWalker.prototype.end = function () {
    // Undefined current_iteration can happen in rare case.
    if (this.current_iteration === undefined)
        this.current_iteration = this.el.pat.newWalker(this.name_resolver);

    // Release next_iteration, which we won't need anymore.
    this.next_iteration = undefined;
    return this.current_iteration.end();
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

Choice.prototype._cleanAttrs = function () {
    var cleaned = this._cleanAttrsFromPat();
    if (cleaned === undefined)
        return undefined;
    var pats = cleaned[0];

    if (pats.length === 1) {
        // After modifications we don't allow anything...
        if (pats[0] instanceof Empty)
            return undefined;

        // The remaining element had a partner that disappeared.
        return [new Choice(this.xml_path + " %CLEAN ATTRS%",
                           [pats[0], new Empty()]), true];
    }

    this.pat_a = pats[0];
    this.pat_b = pats[1];

    return [this, cleaned[1]];
};

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
    this.done = false;

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
    obj.done = this.done;
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
    if (this.done)
        return undefined;

    this._instantiateWalkers();

    this.possible_cached = undefined;
    var ret_a = (this.walker_a !== undefined) ?
            this.walker_a.fireEvent(ev): undefined;
    var ret_b = (this.walker_b !== undefined) ?
            this.walker_b.fireEvent(ev): undefined;

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

        if (this.walker_a !== undefined)
            this.walker_a._suppressAttributes();
        if (this.walker_b !== undefined)
            this.walker_b._suppressAttributes();
    }
};

ChoiceWalker.prototype.canEnd = function () {
    this._instantiateWalkers();

    var walker_a_ret = (this.walker_a !== undefined) ?
            this.walker_a.canEnd() : true;
    var walker_b_ret = (this.walker_b !== undefined) ?
            this.walker_b.canEnd() : true;

    // Before any choice has been made, a ChoiceWalker can end if
    // any subwalker can end. Once a choice has been made, the
    // ChoiceWalker can end only if the chosen walker can end. The
    // assignments earlier ensure that the logic works.
    return (this.chosen) ? (walker_a_ret && walker_b_ret) :
        (walker_a_ret || walker_b_ret);
};

ChoiceWalker.prototype.end = function () {
    this.done = true;

    this._instantiateWalkers();

    if (this.canEnd()) return false;

    var walker_a_ret = (this.walker_a !== undefined) ?
            this.walker_a.end() : false;

    var walker_b_ret = (this.walker_b !== undefined) ?
            this.walker_b.end() : false;

    if (!walker_a_ret && !walker_b_ret)
        return false;

    if (walker_a_ret && !walker_b_ret)
        return walker_a_ret;

    if (!walker_a_ret && walker_b_ret)
        return walker_b_ret;

    // If we are here both walkers exist and returned an error.
    var names_a = [];
    var names_b = [];
    var not_a_choice_error = false;
    this.walker_a.possible().forEach(function (ev) {
        if (ev.params[0] === "enterStartTag")
            names_a.push(new EName(ev.params[1], ev.params[2]));
        else
            not_a_choice_error = true;
    });

    if (!not_a_choice_error) {
        this.walker_b.possible().forEach(function (ev) {
            if (ev.params[0] === "enterStartTag")
                names_b.push(new EName(ev.params[1], ev.params[2]));
            else
                not_a_choice_error = true;
        });

        if (!not_a_choice_error)
            return [new ChoiceError(names_a, names_b)];
    }

    // If we get here, we were not able to raise a ChoiceError,
    // possibly because there was not enough information to decide
    // among the two walkers. Return whatever error comes first.
    return walker_a_ret || walker_b_ret;
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

Group.prototype._cleanAttrs = function () {
    var cleaned = this._cleanAttrsFromPat();
    if (cleaned === undefined)
        return undefined;
    var pats = cleaned[0];

    if (pats.length === 1) {
        if (pats[0] instanceof Empty)
            return undefined;

        return [pats[0], true];
    }

    this.pat_a = pats[0];
    this.pat_b = pats[1];

    return [this, cleaned[1]];
};

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

GroupWalker.prototype.canEnd = function () {
    this._instantiateWalkers();
    return this.walker_a.canEnd() && this.walker_b.canEnd();
};

GroupWalker.prototype.end = function () {
    this._instantiateWalkers();
    var ret;

    if (!this.ended_a) { // Don't end it more than once.
        ret = this.walker_a.end();
        if (ret)
            return ret;
    }

    ret = this.walker_b.end();
    if (ret)
        return ret;

    return false;
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
    // A lack of namespace on an attribute should not be recorded.
    if (this.name.ns !== "")
        namespaces[this.name.ns] = 1;
};

Attribute.prototype._keepAttrs = function () {
    return this;
};

Attribute.prototype._cleanAttrs = function () {
    return [this, false];
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

    if (el !== undefined) {
        this.attr_name_event = new Event("attributeName",
                                         el.name.ns, el.name.name);
        this.attr_value_event = new Event("attributeValue", "*");
    }
    else
        this.attr_name_event = this.attr_value_event = undefined;
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
    obj.attr_value_event = this.attr_value_event;
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
             ev.params[1] === this.el.name.ns &&
             ev.params[2] === this.el.name.name) {
        this.seen_name = true;
        return false;
    }

    return undefined;
};

AttributeWalker.prototype._suppressAttributes = function () {
    this.suppressed_attributes = true;
};

AttributeWalker.prototype.canEnd = function () {
    return this.suppressed_attributes || this.seen_value;
};

AttributeWalker.prototype.end = function () {
    if (this.suppressed_attributes)
        return false;

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
    // Initialized to undefined. Once set to something else, it
    // remains immutable.
    this.attr_pat = undefined;
    this.attr_pat_valid = false;
}

inherit(Element, PatternOnePattern);
// addWalker(Element, ElementWalker); Nope... see below..
Element.prototype._copyInto = function (obj, memo) {
    PatternOnePattern.prototype._copyInto.call(this, obj, memo);
    obj.name = this.name;
    obj.attr_pat = this.attr_pat;
    obj.attr_pat_valid = this.attr_pat_valid;
};

Element.prototype._prepare = function (namespaces) {
    namespaces[this.name.ns] = 1;
    // Do it only if we've not done it.
    if (!this.attr_pat_valid) {
        // We must clone our pats into attr_pats
        this.pat._prepare(namespaces);
        var attrs = this.pat.clone()._keepAttrs();
        if (attrs !== undefined) {
            var me = this;
            // We must clean as long as the tree is modified...
            var cleaned = [undefined, true];
            while (cleaned && cleaned[1])
            {
                cleaned = attrs._cleanAttrs();
                attrs = cleaned && cleaned[0];
            }
            me.attr_pat = attrs;
        }
        this.attr_pat_valid = true;
    }
};

Element.prototype.newWalker = function (name_resolver) {
    if (this.pat instanceof NotAllowed)
        return this.pat.newWalker(name_resolver);

    return new ElementWalker(this, name_resolver);
};

Element.prototype._keepAttrs = function () {
    return undefined;
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
    this.captured_attr_events = [];
    if (el !== undefined) {
        this.start_tag_event = new Event("enterStartTag", el.name.ns,
                                         el.name.name);
        this.end_tag_event = new Event("endTag", this.el.name.ns,
                                       this.el.name.name);
    }
    else
        this.start_tag_event = this.end_tag_event = undefined;
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
    obj.captured_attr_events = this.captured_attr_events.concat([]);

    // No cloning needed since these are immutable.
    obj.start_tag_event = this.start_tag_event;
    obj.end_tag_event = this.end_tag_event;
};

ElementWalker.prototype._possible = function () {
    if (!this.seen_name) {
        return new EventSet(this.start_tag_event);
    }
    else if (!this.ended_start_tag) {
        // If we can have attributes, then...
        if (this.el.attr_pat !== undefined) {
            var all = this.walker._possible();
            var ret = new EventSet();
            // We use value_ev to record whether an attributeValue
            // is a possibility. If so, we must only return this
            // possibility and no other.
            var value_ev;
            all.forEach(function (poss) {
                if (poss.params[0] === "attributeValue")
                    value_ev = poss;
                if (poss.isAttributeEvent())
                    ret.add(poss);
            });

            if (value_ev)
                ret = new EventSet(value_ev);

            if (this.walker.canEnd())
                ret.add(ElementWalker._leaveStartTag_event);

            return ret;
        }
        // No attributes possible.
        return new EventSet(ElementWalker._leaveStartTag_event);
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

// _possible always return new sets
ElementWalker.prototype.possible = ElementWalker.prototype._possible;

ElementWalker.prototype.fireEvent = function (ev) {
    var ret;
    if (!this.ended_start_tag) {
        if (!this.seen_name) {
            if (ev.params[0] === "enterStartTag" &&
                ev.params[1] === this.el.name.ns &&
                ev.params[2] === this.el.name.name) {
                if (this.el.attr_pat !== undefined)
                    this.walker = this.el.attr_pat.newWalker(
                        this.name_resolver);
                this.seen_name = true;
                return false;
            }
        }
        else if (ev.params[0] === "leaveStartTag") {
            this.ended_start_tag = true;

            if (this.walker !== undefined)
                ret = this.walker.end();

            // We've left the start tag, create a new walker and hit it
            // with the attributes we've seen.
            this.walker = this.el.pat.newWalker(this.name_resolver);
            var me = this;
            this.captured_attr_events.forEach(function (ev) {
                me.walker.fireEvent(ev);
            });
            // And suppress the attributes.
            this.walker._suppressAttributes();

            // We do not return undefined here
            return ret || false;
        }

        if (ev.isAttributeEvent())
            this.captured_attr_events.push(ev);

        return (this.walker !== undefined) ?
            this.walker.fireEvent(ev): undefined;
    }
    else if (!this.closed) {
        ret = this.walker.fireEvent(ev);
        if (ret === undefined) {
            // Our subwalker did not handle the event, so we must
            // do it here.
            if  (ev.params[0] === "endTag") {
                if (ev.params[1] === this.el.name.ns &&
                    ev.params[2] === this.el.name.name) {
                    this.closed = true;
                    return this.walker.end();
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

ElementWalker.prototype.canEnd = function () {
    return this.closed;
};

ElementWalker.prototype.end = function (ev) {
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
    this.attr_pat = undefined;
    this.attr_pat_valid = false;
}
inherit(Define, PatternOnePattern);
addWalker(Define, DefineWalker);

Define.prototype._copyInto = function (obj, memo) {
    PatternOnePattern.prototype._copyInto.call(this, obj, memo);
    obj.name = this.name;
    obj.attr_pat = this.attr_pat;
    obj.attr_pat_valid = this.attr_pat_valid;
};

Define.prototype._prepare = function (namespaces) {
    // Do it only if we've not done it.
    if (!this.attr_pat_valid) {
        // We must clone our pats into attr_pats
        this.pat._prepare(namespaces);
        var attrs = this.pat.clone()._keepAttrs();
        this.attr_pat = attrs;
        this.attr_pat_valid = true;
    }
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
    this.definitions = [];
    this.element_definitions = Object.create(null);
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
    var ret = new Set();
    for (var d in this.definitions)
        ret.union(this.definitions[d]._resolve(this.definitions));
    ret.union(this.start._resolve(this.definitions));
    if (ret.size() > 0)
        throw new ReferenceError(ret);
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

/**
 * @returns {boolean} <code>true</code> if the schema is wholly context
 * independent. This means that each element in the schema can be
 * validated purely on the basis of knowing its expanded
 * name. <code>false</code> otherwise.
 */
Grammar.prototype.whollyContextIndependent = function () {
    var memo = this.element_definitions;
    this._elementDefinitions(memo);
    for (var v in memo)
        if (memo[v].length > 1)
            return false;

    return true;
};

/**
 *
 * @returns {Array.<string>} An array of all namespaces used in
 * the schema.
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
    this._foreign_stack = [];
    this._swallow_attribute_value = false;
    this.suspended_ws = undefined;
    this.ignore_next_ws = false;
}

inherit(GrammarWalker, Walker);
implement(GrammarWalker, SingleSubwalker);

GrammarWalker.prototype.subwalker = undefined;
GrammarWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    obj.subwalker = this.subwalker._clone(memo);
    obj._foreign_stack = this._foreign_stack.concat([]);
    obj._swallow_attribute_value = this.swallow_attribute_value;
    obj._name_resolver = this._cloneIfNeeded(this._name_resolver, memo);
    obj.suspended_ws = this.suspended_ws;
    obj.ignore_next_ws = this.ignore_next_ws;
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

    var ignore_next_ws_now = this.ignore_next_ws;
    this.ignore_next_ws = false;
    var ws_err = false;
    switch(ev.params[0]) {
    case "enterStartTag":
        // Absorb the whitespace: poof, gone!
        this.suspended_ws = undefined;
        break;
    case "text":
        if (this.ignore_next_ws) {
            this.suspended_ws = undefined;
            var trimmed = ev.params[1].replace(/^\s+/, '');
            if (trimmed.length !== ev.params[1].length)
                ev = new Event("text", trimmed);
        }
        else if (this.suspended_ws) {
            ws_err = this.subwalker.fireEvent(new Event("text",
                                                        this.suspended_ws));
            this.suspended_ws = undefined;
        }
        break;
    case "endTag":
        this.ignore_next_ws = true;
        /* falls through */
    default:
        // Process the whitespace that was suspended.
        if (this.suspended_ws && !ignore_next_ws_now)
            ws_err = this.subwalker.fireEvent(new Event("text",
                                                        this.suspended_ws));
        this.suspended_ws = undefined;
    }

    //
    // The foreign stack allows salve to avoid outputting a whole
    // slew of errors when a document contains a tag which is not
    // allowed by the schema. If salve did not do this, then a
    // structure like <x a="q" b="c"><z>ttt</z></x> when x is not
    // allowed would generate errors for the presence of <x> and
    // </x> for the presence of <z> and </z>, for the presence of
    // a and b and for "q" and "c" and for "ttt", when the main
    // issue is that <x> is not allowed in the first place.
    //
    // Salve does not check for well-formedness while the foreign
    // stack is in effect. In the sequence <a>foo</b>, the closing
    // tag will end the stack just as surely as if it had been
    // </a>, and salve will resume outputting errors.
    //
    // Well-formedness checks should be done by the parser which
    // feeds events to salve.
    //

    if (this._foreign_stack.length > 0) {
        switch(ev.params[0]) {
        case "enterStartTag":
            this._foreign_stack.unshift(ev.params.slice(1));
            break;
        case "endTag":
            this._foreign_stack.shift();
            break;
        }
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

    var ret = this.subwalker.fireEvent(ev);
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
            ret = [new ElementNameError(
                "tag not allowed here",
                new EName(ev.params[1], ev.params[2]))];
            this._foreign_stack = [ev.params.slice(1)];
            break;
        case "endTag":
            ret = [new ElementNameError(
                "unexpected end tag",
                new EName(ev.params[1], ev.params[2]))];
            break;
        case "attributeName":
            ret = [new AttributeNameError(
                "attribute not allowed here",
                new EName(ev.params[1], ev.params[2]))];
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
            // If the foreign stack did not exist then we would
            // get here if a file being validated contains a tag
            // which is not allowed. An ElementNameError will
            // already have been issued. So rather than violate
            // our contract (which says no undefined value may be
            // returned) or require that callers do something
            // special with 'undefined' as a return value, just
            // treat this event as a non-error.
            //
            // But the foreign stack exists, so we cannot get
            // here. If we do end up here, then there is an
            // internal error somewhere.
            /* falls through */
        default:
            throw new Error("unexpected event type in " +
                            "GrammarWalker's fireEvent: " +
                            ev.params[0]);
        }
    }
    return combineWsErrWith(ret);
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

//
// Things used only during testing.
//
var tret = {};

tret.GrammarWalker = GrammarWalker;
tret.Walker = Walker;
tret.Text = Text;

exports.__test = function () { return tret; };

//
// Exports which are meant for other modules internal to salve.
//
// DO NOT USE THIS OUTSIDE SALVE! THIS EXPORT MAY CHANGE AT ANY TIME!
// YOU'VE BEEN WARNED!
//
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
    EName: EName
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
