/**
 * @module validate
 * @desc RNG-based validator.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */

define(/** @lends module:validate */ function (require, exports, module) {
'use strict';

var name_resolver = require("./name_resolver");

exports.version = "0.14.2";

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
     * @param {String} name The field name to modify in the object.
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
    el_cls.prototype.newWalker = function () {
        /* jshint newcap: false */
        return new walker_cls(this);
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
 * @param {String} ns The namespace URI.
 * @param {String} name The local name of the entity.
 */
function EName(ns, name) {
    this.ns = ns;
    this.name = name;
}
/**
 * @returns {String} A string representing the expanded name.
 */
EName.prototype.toString = function () {
    return "{" + this.ns + "}" + this.name;
};

/**
 * Compares two expanded names.
 *
 * @param {module:validate~EName} other The other object to compare
 * this object with.
 *
 * @returns {Boolean} <code>true</code> if this object equals the other.
 */
EName.prototype.equal = function (other) {
    return this.ns === other.ns && this.name === other.name;
};

/**
 * Calls the <code>hash()</code> method on the object passed to it.
 *
 * @private
 * @param {Object} o An object that implements <code>hash()</code>.
 * @returns {Boolean} The return value of <code>hash()</code>.
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
 * @param {String} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 */
function Pattern(xml_path) {
    this.id = this.__newID();
    this.xml_path = xml_path;
}

inherit(Pattern, Object);

/**
 * The next id to associate to the next Pattern object to be
 * created. This is used so that {@link module:validate~Pattern#hash
 * hash} can return unique values.
 *
 * @private
 */
Pattern.__id=0;

/**
 * Gets a new Pattern id.
 *
 * @private
 * @returns {Integer} The new id.
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
 * increasing counter, so when it reaches beyond the maximum Integer
 * that the JavaScript vm can handle, things go kaboom.</p>
 *
 * @returns {Integer} A number unique to this object.
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
 * @returns {module:validate~Walker} A walker.
 */
Pattern.prototype.newWalker = function () {
    throw new Error("must define newWalker method");
};

/**
 * Makes a deep copy (a clone) of this pattern.
 *
 * @returns {module:validate~Pattern} A new copy.
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
 * @param {module:validate~Pattern} obj Object into which we must copy
 * the fields of this object.
 *
 * @param {module:hashstructs~HashMap} memo The memo that contains the
 * copy mappings. See {@link module:validate~Pattern.clone clone()} above.
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
 * @returns {undefined|module:validate~Pattern} The pattern itself, if after
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
 * @extends module:validate~Pattern
 * @private
 *
 * @constructor
 * @param {String} xml_path This is a string which uniquely identifies
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
 * @extends module:validate~Pattern
 *
 * @constructor
 * @private
 * @param {String} xml_path This is a string which uniquely identifies
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
    if ((pats.length == 1) && (pats[0] instanceof Empty))
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
 * @classdesc The fireEvent methods return an array of objects of this
 * class to notify the caller of errors in the file being validated.
 *
 * @constructor
 *
 * @param {String} msg The error message.
 */
function ValidationError(msg) {
    this.msg = msg;
    // May be useful for debugging:
    // this.stack_trace = new Error().stack;
}

/**
 * @returns {String} The text representation of the error.
 */
ValidationError.prototype.toString = function() { return this.msg; };

/**
 * This method provides the caller with the list of all names that
 * are used in the error message.
 *
 * @returns {Array.<module:validate~EName>} The list of names used in the
 * error message.
 */
ValidationError.prototype.getNames = function () {
    return [];
};

/**
 * <p>This method transforms the ValidationError object to a string
 * but uses the names in the parameter passed to it to format the
 * string.</p>
 *
 * <p>Since salve does not support namespaces, someone using salve
 * would typically use this method so as to replace the Expanded
 * Names passed in error messages with qualified names.</p>
 *
 * @param {Array.<String>} names The array of names to use. This
 * should be an array of the same length as that returned by
 * <code>getNames()</code>, with each name replaced with a corresponding string.
 *
 * @returns {String} The object formatted as a string.
 */
ValidationError.prototype.toStringWithNames = function (names) {
    // We do not have names in ValidationError
    return this.msg;
};


/**
 * @classdesc This class serves as a base for all those errors that
 * have only one name involved.
 *
 * @constructor
 * @extends module:validate~ValidationError
 * @param {String} msg The error message.
 * @param {module:validate~EName} name The name of the XML entity at stake.
 */
function SingleNameError(msg, name) {
    ValidationError.call(this, msg);
    this.name = name;
}
inherit(SingleNameError, ValidationError);

SingleNameError.prototype.toString = function() {
    return this.toStringWithNames([this.name]);
};

SingleNameError.prototype.getNames = function () {
    return [this.name];
};

SingleNameError.prototype.toStringWithNames = function (names) {
    return this.msg + ": " + names[0];
};


/**
 * @classdesc Error returned when an attribute name is invalid.
 *
 * @constructor
 * @extends module:validate~SingleNameError
 * @param {String} msg The error message.
 * @param {module:validate~EName} name The name of the attribute at stake.
 */
function AttributeNameError() {
    SingleNameError.apply(this, arguments);
}
inherit(AttributeNameError, SingleNameError);

/**
 * @classdesc Error returned when an attribute value is invalid.
 *
 * @constructor
 * @extends module:validate~SingleNameError
 * @param {String} msg The error message.
 * @param {module:validate~EName} name The name of the attribute at stake.
 */
function AttributeValueError() {
    SingleNameError.apply(this, arguments);
}
inherit(AttributeValueError, SingleNameError);

/**
 * @classdesc Error returned when an element is invalid.
 *
 * @constructor
 * @extends module:validate~SingleNameError
 * @param {String} msg The error message.
 * @param {module:validate~EName} name The name of the element at stake.
 */
function ElementNameError() {
    SingleNameError.apply(this, arguments);
}
inherit(ElementNameError, SingleNameError);

/**
 * @classdesc Error returned when choice was not satisfied.
 *
 * @constructor
 * @extends module:validate~ValidationError
 * @param {Array.<module:validate~EName>} names_a The name of the first
 * XML entities at stake.
 * @param {Array.<module:validate~EName>} names_b The name of the second
 * XML entities at stake.
 */
function ChoiceError(names_a, names_b) {
    ValidationError.call(this, "");
    this.names_a = names_a;
    this.names_b = names_b;
}
inherit(ChoiceError, ValidationError);

ChoiceError.prototype.toString = function() {
    return this.toStringWithNames(this.names_a.concat(this.names_b));
};

ChoiceError.prototype.getNames = function () {
    return this.names_a.concat(this.names_b);
};

ChoiceError.prototype.toStringWithNames = function (names) {
    var first = names.slice(0, this.names_a.length);
    var second = names.slice(this.names_a.length);
    return "must choose either " + first.join(", ") +
        " or " + second.join(", ");
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
}

/**
 * The cache of Event objects. So that we create one and only one
 * Event object per run.
 *
 * @private
 */
Event.__cache = {};

/**
 * The next id to associate to the next Event object to be
 * created. This is used so that {@link module:validate~Event#hash
 * hash} can return unique values.
 *
 * @private
 */
Event.__id=0;

/**
 * Gets a new Event id.
 *
 * @private
 * @returns {Integer} The new id.
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
 * increasing counter, so when it reaches beyond the maximum Integer
 * that the JavaScript vm can handle, things go kaboom.</p>
 *
 * @returns {Integer} A number unique to this object.
 */
Event.prototype.hash = function () { return this.id; };

/**
 * We have a very primitive form of pattern matching. Right now
 * the only special case is a form of attributeValue events
 * expecting anything. This form has "*" as the second parameter
 * that forms the event. So the event Event("attributeValue",
 * "blah") would also match Event("attributeValue", "*") and
 * calling this method on Event("attributeValue", "blah") would
 * return the two events.
 *
 * @returns {Array} The events that would match this event.
 *
 */
Event.prototype.matchingEvents = function () {
    if (this.params[0] === "attributeValue")
        return [this, new Event("attributeValue", "*")];
    return [this];
};

/**
 * Is this Event an attribute event?
 *
 * @returns {Boolean} <code>true</code> if the event is an attribute
 * event, <code>false</code> otherwise.
 */
Event.prototype.isAttributeEvent = function () {
    return  (this.params[0] == "attributeName" ||
             this.params[0] == "attributeValue");
};

/**
 * @returns {String} A string representation of the event.
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
 * @returns {String} A string which contains the tree described above.
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
            if (i == params.length - 1)
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
 * @classdesc <p>Roughly speaking each {@link module:validate~Pattern
 * Pattern} object has a corresponding Walker class that modelizes
 * an object which is able to walk the pattern to which it belongs. So
 * an Element has an ElementWalker and an Attribute has an
 * AttributeWalker. A Walker object responds to parsing events and
 * reports whether the structure represented by these events is
 * valid.</p>
 *
 * <p>Note that users of this API do not instantiate Walker objects
 * themselves.</p>
 * @constructor
 */
function Walker() {
    this.id = this.__newID();
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
 * created. This is used so that {@link module:validate~Walker#hash
 * hash} can return unique values.
 *
 * @private
 */
Walker.__id=0;

/**
 * Gets a new Walker id.
 *
 * @private
 * @returns {Integer} The new id.
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
 * increasing counter, so when it reaches beyond the maximum Integer
 * that the JavaScript vm can handle, things go kaboom.</p>
 *
 * @returns {Integer} A number unique to this object.
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
 * @returns {false|undefined|Array.<module:validate~ValidationError>} The value
 * <code>false</code> if there was no error. The value
 * <code>undefined</code> if no walker matches the pattern. Otherwise,
 * an array of {@link module:validate~ValidationError ValidationError}
 * objects.
 */
Walker.prototype.fireEvent = function (ev) {
    throw new Error("must be implemented by derived classes");
};

/**
 * Can this Walker validly end after the previous event fired?
 *
 * @return {Boolean} <code>true</code> if the walker can validly end
 * here. <code>false</code> otherwise.
 */
Walker.prototype.canEnd = function () {
    return true;
};

/**
 * This method ends the Walker processing. It should not see any
 * further events after end is called.
 *
 * @returns {Boolean|Array.<module:validate~ValidationError>}
 * <code>false</code> if the walker ended without error. Otherwise, a
 * list of {@link module:validate~ValidationError ValidationError}
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
 * Helper method for clone() and _clone(). All classes deriving
 * from Walker must implement their own version of this
 * function so that they copy and clone their fields as needed.
 *
 * @private
 *
 * @param {module:validate~Pattern} obj Object into which we must copy
 * the fields of this object.
 *
 * @param {module:hashstructs~HashMap} memo The memo that contains the
 * copy mappings.  See {@link module:validate~Walker#clone clone()}
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
 * module:validate~Walker Walker} objects that can only have one
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
 * module:validate~Walker Walker} objects that cannot have any
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
 * @extends module:validate~Pattern
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
 * @classdesc Walker for {@link module:validate~Empty Empty}.
 * @extends module:validate~Walker
 * @mixes module:validate~NoSubwalker
 * @constructor
 * @private
 * @param {module:validate~Empty} el The pattern for which this walker
 * was created.
 */
function EmptyWalker (el) {
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

EmptyWalker.prototype.fireEvent = function () {
    // Never matches anything.
    return undefined;
};

var Data = makeSingletonConstructor(Pattern);
inherit(Data, Pattern);
addWalker(Data, TextWalker); // Cheat until we have a real Data library.

var List = makeSingletonConstructor(Pattern);
inherit(List, Pattern);
addWalker(List, TextWalker); // Cheat until we have a real Data library.

var Param = makeSingletonConstructor(Pattern);
inherit(Param, Pattern);
addWalker(Param, TextWalker); // Cheat until we have a real Data library.

var Value = makeSingletonConstructor(Pattern);
inherit(Value, Pattern);
addWalker(Value, TextWalker); // Cheat until we have a real Data library.

/**
 * @classdesc Pattern for <code>&lt;notAllowed/></code>.
 * @extends module:validate~Pattern
 *
 * @constructor
 * @private
 */
var NotAllowed = makeSingletonConstructor(Pattern);
inherit(NotAllowed, Pattern);
// NotAllowed has no walker.

/**
 * @classdesc Pattern for <code>&lt;text/></code>.
 * @extends module:validate~Pattern
 *
 * @constructor
 * @private
 */
var Text = makeSingletonConstructor(Pattern);
inherit(Text, Pattern);

addWalker(Text, TextWalker);

/**
 *
 * @classdesc Walker for {@link module:validate~Text Text}
 * @extends module:validate~Walker
 * @mixes module:validate~NoSubwalker
 * @private
 * @constructor
 * @param {module:validate~Text} el The pattern for which this walker
 * was constructed.
*/
function TextWalker (el) {
    Walker.call(this);
    this.possible_cached = new EventSet(TextWalker._text_event);
}
inherit(TextWalker, Walker);
implement(TextWalker, NoSubwalker);

// Events are constant so create the one we need just once.
TextWalker._text_event = new Event("text");

TextWalker.prototype._possible = function () {
    return this.possible_cached;
};

TextWalker.prototype.fireEvent = function (ev) {
    return  (ev.params.length === 1 && ev.params[0] == "text") ? false:
        undefined;
};

/**
 * @classdesc A pattern for RNG references.
 * @extends module:validate~Pattern
 * @private
 * @constructor
 * @param {String} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {String} name The reference name.
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
Ref.prototype.newWalker = function () {
    return this.resolves_to.pat.newWalker();
};

/**
 * @classdesc Walker for {@link module:validate~Ref Ref}
 * @extends module:validate~Walker
 * @mixes module:validate~SingleSubwalker
 * @private
 * @constructor
 * @param {module:validate~Ref} el The pattern for which this walker
 * was created.
 */
function RefWalker(el) {
    Walker.call(this);
    this.el = el;
    this.subwalker = (el !== undefined) ? el.resolves_to.newWalker(): undefined;
}
inherit(RefWalker, Walker);

implement(RefWalker, SingleSubwalker);

RefWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    obj.subwalker = this.subwalker._clone(memo);
};

/**
 * @classdesc A pattern for &lt;oneOrMore>.
 * @extends module:validate~Pattern
 *
 * @private
 * @constructor
 * @param {String} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {Array.<module:validate~Pattern>} pats The pattern contained
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
 * @classdesc Walker for {@link module:validate~OneOrMore OneOrMore}
 * @extends module:validate~Walker
 *
 * @private
 * @constructor
 * @param {module:validate~OneOrMore} el The pattern for which this
 * walker was created.
 */
function OneOrMoreWalker(el)
{
    Walker.call(this);
    this.seen_once = false;
    this.el = el;
    this.current_iteration = undefined;
    this.next_iteration = undefined;
}
inherit(OneOrMoreWalker, Walker);

OneOrMoreWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.seen_once = this.seen_once;
    obj.el = this.el;
    obj.current_iteration = (this.current_iteration !== undefined) ?
        this.current_iteration._clone(memo) : undefined;
    obj.next_iteration = (this.next_iteration !== undefined) ?
        this.next_iteration._clone(memo) : undefined;
};

OneOrMoreWalker.prototype._possible = function() {
    if (this.possible_cached !== undefined)
        return this.possible_cached;

    if (this.current_iteration === undefined)
        this.current_iteration = this.el.pat.newWalker();

    this.possible_cached = this.current_iteration._possible();

    if (this.current_iteration.canEnd()) {
        this.possible_cached = new EventSet(this.possible_cached);
        if (this.next_iteration === undefined) {
            this.next_iteration = this.el.pat.newWalker();
        }

        var next_possible = this.next_iteration._possible();

        this.possible_cached.union(next_possible);
    }

    return this.possible_cached;
};

OneOrMoreWalker.prototype.fireEvent = function(ev) {
    this.possible_cached = undefined;

    if (this.current_iteration === undefined)
        this.current_iteration = this.el.pat.newWalker();

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
            this.next_iteration = this.el.pat.newWalker();

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
        this.current_iteration = this.el.pat.newWalker();

    // Release next_iteration, which we won't need anymore.
    this.next_iteration = undefined;
    return this.current_iteration.end();
};

/**
 * @classdesc A pattern for &lt;choice>.
 * @extends module:validate~Pattern
 * @private
 * @constructor
 * @param {String} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {Array.<module:validate~Pattern>} pats The patterns
 * contained by this one.
 * @throws {Error} If <code>pats</code> is not of length 2.
*/
function Choice(xml_path, pats) {
    PatternTwoPatterns.call(this, xml_path);
    // Undefined happens when cloning.
    if (pats !== undefined) {
        if (pats.length != 2)
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
 * @classdesc Walker for {@link module:validate~Choice Choice}
 * @extends module:validate~Walker
 * @private
 * @constructor
 * @param {module:validate~Choice} el The pattern for which this
 * walker was created.
 */
function ChoiceWalker(el) {
    Walker.call(this);
    this.el = el;
    this.chosen = false;

    this.walker_a = this.walker_b = undefined;
    this.instantiated_walkers = false;
    this.done = false;

}

inherit(ChoiceWalker, Walker);

ChoiceWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
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

        this.walker_a = this.el.pat_a.newWalker();
        this.walker_b = this.el.pat_b.newWalker();
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
 * @extends module:validate~PatternTwoPatterns
 *
 * @private
 * @constructor
 * @param {String} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {Array.<module:validate~Pattern>} pats The patterns
 * contained by this one.
 * @throws {Error} If <code>pats</code> is not of length 2.
 */
function Group(xml_path, pats) {
    PatternTwoPatterns.call(this, xml_path);
    // Undefined happens when cloning.
    if (pats !== undefined) {
        if (pats.length != 2)
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
 * @classdesc Walker for {@link module:validate~Group Group}
 * @extends module:validate~Walker
 * @private
 * @constructor
 * @param {module:validate~Group} el The pattern for which this walker
 * was created.
 */
function GroupWalker(el) {
    Walker.call(this);
    this.el = el;

    this.hit_a = false;
    this.ended_a = false;
    this.hit_b = false;
    this.walker_a = this.walker_b = undefined;
}
inherit(GroupWalker, Walker);

GroupWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
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
        this.walker_a = this.el.pat_a.newWalker();
        this.walker_b = this.el.pat_b.newWalker();
    }
};

GroupWalker.prototype._possible = function () {
    this._instantiateWalkers();
    if (this.possible_cached !== undefined)
        return this.possible_cached;

    this.possible_cached = (!this.ended_a) ?
        this.walker_a._possible() : undefined;

    // If we are in the midst of processing walker a and it cannot
    // end yet, then we do not want to see anything from b.
    if (!this.hit_a || this.ended_a || this.walker_a.canEnd()) {
        this.possible_cached = new EventSet(this.possible_cached);
        var possible_b = this.walker_b._possible();

        if ((!this.ended_a || this.hit_b) && !this.walker_a.canEnd()) {
            possible_b = new EventSet(possible_b);
            // Narrow it down to attribute events...
            possible_b = possible_b.filter(function (x) {
                return x.isAttributeEvent();
            });
        }
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
 * @extends module:validate~PatternOnePattern
 *
 * @private
 * @constructor
 * @param {String} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {String} name The qualified name of the attribute.
 * @param {Array.<module:validate~Pattern>} pats The pattern
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
 * @classdesc Walker for {@link module:validate~Attribute Attribute}
 * @extends module:validate~Walker
 *
 * @private
 * @constructor
 * @param {module:validate~Attribute} el The pattern for which this
 * walker was created.
 */
function AttributeWalker(el) {
    Walker.call(this);
    this.el = el;
    this.seen_name = false;
    this.seen_value = false;

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
    obj.seen_name = this.seen_name;
    obj.seen_value = this.seen_value;

    // No need to clone; values are immutable.
    obj.attr_name_event = this.attr_name_event;
    obj.attr_value_event = this.attr_value_event;
};

AttributeWalker.prototype._possible = function () {
    // We've been suppressed!
    if (this.suppressed_attributes) return new EventSet();

    if (!this.seen_name)
        return new EventSet(this.attr_name_event);
    else if (!this.seen_value)
        return new EventSet(this.attr_value_event);
    else
        return new EventSet();
};

// _possible always return new sets.
AttributeWalker.prototype.possible = AttributeWalker.prototype._possible;

AttributeWalker.prototype.fireEvent = function (ev) {
    if (this.suppressed_attributes)
        return undefined;

    if (this.seen_name) {
        if (!this.seen_value && ev.params[0] == "attributeValue")
        {
            this.seen_value = true;
            return false;
        }
    }
    else if (ev.params[0] == "attributeName" &&
             ev.params[1] == this.el.name.ns &&
             ev.params[2] == this.el.name.name) {
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
 * @extends module:validate~PatternOnePattern
 * @private
 * @constructor
 * @param {String} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {String} name The qualified name of the element.
 * @param {Array.<module:validate~Pattern>} pats The pattern
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

Element.prototype.newWalker = function () {
    if (this.pat instanceof NotAllowed)
        return new DisallowedElementWalker(this);

    return new ElementWalker(this);
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
 * @classdesc Walker for {@link module:validate~Element Element}
 * @extends module:validate~Walker
 * @private
 * @constructor
 * @param {module:validate~Element} el The pattern for which this
 * walker was created.
 */
function ElementWalker(el) {
    Walker.call(this);
    this.el = el;
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
            if (ev.params[0] == "enterStartTag" &&
                ev.params[1] == this.el.name.ns &&
                ev.params[2] == this.el.name.name) {
                if (this.el.attr_pat !== undefined)
                    this.walker = this.el.attr_pat.newWalker();
                this.seen_name = true;
                return false;
            }
        }
        else if (ev.params[0] == "leaveStartTag") {
            this.ended_start_tag = true;

            if (this.walker !== undefined)
                ret = this.walker.end();

            // We've left the start tag, create a new walker and hit it
            // with the attributes we've seen.
            this.walker = this.el.pat.newWalker();
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
            if  (ev.params[0] == "endTag") {
                if (ev.params[1] == this.el.name.ns &&
                    ev.params[2] == this.el.name.name) {
                    this.closed = true;
                    return this.walker.end();
                }
            }
            else if (ev.params[0] == "leaveStartTag")
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
 * @classdesc Walker for {@link module:validate~Element Element}. An
 * instance of this class is used when an Element happens to not allow
 * any contents.
 *
 * @extends module:validate~Walker
 * @private
 * @constructor
 * @param {module:validate~Element} el The pattern for which this
 * walker was created.
 */
function DisallowedElementWalker(el) {
    Walker.call(this);
    this.el = el;
    this.possible_cached = new EventSet();
}
inherit(DisallowedElementWalker, Walker);

DisallowedElementWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    // possible_cached taken care of by Walker
};

DisallowedElementWalker.prototype._possible = function () {
    return this.possible_cached;
};

DisallowedElementWalker.prototype.fireEvent = function (ev) {
    return undefined; // we never match!
};

/**
 * @classdesc A pattern for &lt;define>.
 * @extends module:validate~PatternOnePattern
 * @private
 * @constructor
 * @param {String} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {String} name The name of the definition.
 * @param {Array.<module:validate~Pattern>} pats The pattern
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
 * @classdesc Walker for {@link module:validate~Define Define}
 * @extends module:validate~Walker
 * @mixes module:validate~SingleSubwalker
 * @private
 * @constructor
 * @param {module:validate~Define} el The pattern for which this
 * walker was created.
 */
function DefineWalker(el) {
    Walker.call(this);
    this.el = el;
    this.subwalker = (el !== undefined) ? el.pat.newWalker() : undefined;
}
inherit(DefineWalker, Walker);
implement(DefineWalker, SingleSubwalker);

DefineWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
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
 * @returns {String} A string representation of the error.
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
 * @param {String} xml_path This is a string which uniquely identifies
 * the element from the simplified RNG tree. Used in debugging.
 * @param {module:validate~Pattern} start The start pattern of this
 * grammar.
 * @param {Array.<module:validate~Define>} definitions An array of {@link
 * module:validate~Define Define} objects which contain all
 * definitions specified in this grammar.
 *
 * @throws {module:validate~ReferenceError} When any definition in the
 * original schema refers to a schema entity which is not defined in
 * the schema.
 */
function Grammar(xml_path, start, definitions) {
    this.xml_path = xml_path;
    this.start = start;
    this.definitions = [];
    this.element_definitions = {};
    this._namespaces = Object.create(null);
    var me = this;
    definitions.forEach(function (x) {
        me.add(x);
    });
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
 * @throws {module:validate~ReferenceError} When any definition in the
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
 * @param {module:validate~Define} d The definition to add.
 */
Grammar.prototype.add = function (d) {
    this.definitions[d.name] = d;
    if (d.name == "start")
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
 * @returns {Boolean} <code>true</code> if the schema is wholly context
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
 * @returns {Array.<String>} An array of all namespaces used in
 * the schema.
 */
Grammar.prototype.getNamespaces = function () {
    return Object.keys(this._namespaces);
};

addWalker(Grammar, GrammarWalker);

/**
 *
 * @classdesc Walker for {@link module:validate~Grammar Grammar}
 * @extends module:validate~Walker
 * @mixes module:validate~SingleSubwalker
 * @private
 * @constructor
 * @param {module:validate~Grammar} el The grammar for which this
 * walker was created.
 */
function GrammarWalker(el) {
    Walker.call(this);
    this.el = el;
    this.subwalker = (el !== undefined) ? el.start.newWalker() : undefined;
    this._foreign_stack = [];
    this._name_resolver = undefined;
}
inherit(GrammarWalker, Walker);
implement(GrammarWalker, SingleSubwalker);

GrammarWalker.prototype.subwalker = undefined;
GrammarWalker.prototype._copyInto = function (obj, memo) {
    Walker.prototype._copyInto.call(this, obj, memo);
    obj.el = this.el;
    obj.subwalker = this.subwalker._clone(memo);
    obj._foreign_stack = this._foreign_stack.concat([]);
    if (this._name_resolver)
        obj._name_resolver = this._name_resolver.clone();
};

/**
 * Instructs the walker to create its own name resolver to handle
 * namespace declarations.
 *
 * @throws {Error} If this function has previously been called on the
 * current walker
 */

GrammarWalker.prototype.useNameResolver = function() {
    if (this._name_resolver)
        throw new Error("called useNameResolver twice on the same walker");
    this._name_resolver = new name_resolver.NameResolver();
};

/**
 * Resolves a name using the walker's own name resolver.
 * @param {String} name A qualified name.
 * @param {Boolean} attribute Whether this qualified name refers to an
 * attribute.
 * @returns {module:validate~EName|undefined} An expanded name, or
 * undefined if the name cannot be resolved.
 * @throws {Error} If {@link
 * module:validate~GrammarWalker#useNameResolver useNameResolver} was
 * not called to create a resolver, or if the name is malformed.
 */
GrammarWalker.prototype.resolveName = function (name, attribute) {
    if (!this._name_resolver)
        throw new Error("resolveName needs a name resolver");
    return this._name_resolver.resolveName(name, attribute);
};

/**
 * See {@link module:name_resolver~NameResolver.unresolveName
 * NameResolver.unresolveName} for the details.
 *
 * @param {String} uri The URI part of the expanded name.
 * @param {String} name The name part.
 * @returns {String|undefined} The qualified name that corresponds to
 * the expanded name, or <code>undefined</code> if it cannot be resolved.
 * @throws {Error} If {@link
 * module:validate~GrammarWalker.useNameResolver useNameResolver} was
 * not called to create a resolver.
 */
GrammarWalker.prototype.unresolveName = function (uri, name) {
    if (!this._name_resolver)
        throw new Error("unresolveName needs a name resolver");
    return this._name_resolver.unresolveName(uri, name);
};


/**
 * On a GrammarWalker this method cannot return
 * <code>undefined</code>. An undefined value would mean nothing
 * matched, which is a validation error.
 *
 * @param {module:validate~Event} ev The event to fire.
 * @returns {false|Array.<module:validate~ValidationError>} The value
 * <code>false</code> if there is no error or an array of
 * {@link module:validate~ValidationError ValidationError} objects.
 * @throws {Error} When name resolving events
 * (<code>enterContext</code>, <code>leaveContext</code>, or
 * <code>definePrefix</code>) are passed while this walker was not
 * instructed to create its own name resolver or when trying to
 * process an event type unknown to salve.
 */
GrammarWalker.prototype.fireEvent = function (ev) {
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

    if (ev.params[0] === "enterContext" ||
        ev.params[0] === "leaveContext" ||
        ev.params[0] === "definePrefix")
    {
        if (!this._name_resolver)
            throw new Error("event " + ev.params[0] +
                            " needs a name resolver");
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

    var ret = this.subwalker.fireEvent(ev);
    if (ret === undefined) {
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
    return ret;
};

GrammarWalker.prototype._suppressAttributes = function () {
    throw new Error("_suppressAttributes cannot be called on a GrammarWalker");
 };



//
// MODIFICATIONS TO THIS TABLE MUST BE REFLECTED IN rng-to-js.xsl
//
var name_to_constructor = {
    // Array = 0 is hard-coded elsewhere in the conversion code so don't
    // change it.
    0: Array,
    Empty: Empty,
    1: Empty,
    Data: Data,
    2: Data,
    List: List,
    3: List,
    Param: Param,
    4: Param,
    Value: Value,
    5: Value,
    NotAllowed: NotAllowed,
    6: NotAllowed,
    Text: Text,
    7: Text,
    Ref: Ref,
    8: Ref,
    OneOrMore: OneOrMore,
    9: OneOrMore,
    Choice: Choice,
    10: Choice,
    Group: Group,
    11: Group,
    Attribute: Attribute,
    12: Attribute,
    Element: Element,
    13: Element,
    Define: Define,
    14: Define,
    Grammar: Grammar,
    15: Grammar,
    EName: EName,
    16: EName
};

/**
 * Resolves an array according to format V0. For each element, if the
 * element is an array, it is resolved. If the element is an object,
 * then the object is constructed. Otherwise, the element remains as
 * is.
 *
 * @private
 * @param {Array} arr The array to resolve.
 */
function _resolveArray(arr) {
    for (var el_ix = 0, el; (el = arr[el_ix]) !== undefined; el_ix++) {
        if (el instanceof Array)
            _resolveArray(el);
        else if (typeof el === "object")
            arr[el_ix] = _constructObject(el);
        // else leave as is
    }
}

/**
 * Applies a constructor.
 *
 * @private
 * @param {Function} ctor The constructor to apply.
 * @param {Array} args The arguments to pass to the constructor.
 * @returns {Object} An object created by the constructor.
 */
function _applyConstructor(ctor, args) {
    var new_obj = Object.create(ctor.prototype);
    var ctor_ret = ctor.apply(new_obj, args);

    // Some constructors return a value; make sure to use it!
    return ctor_ret !== undefined ? ctor_ret: new_obj;
}

/**
 * Constructs an object according to format V0. In effect, converts
 * the Object created from the JSON representation to a JavaScript
 * Object of the proper class.
 *
 * @private
 * @param {Object} obj The object read from the JSON string.
 * @returns {Object} An object of the proper class.
 * @throws {Error} If the object is malformed, or has a type unknown
 * to salve.
 */
function _constructObject(obj) {
    var type = obj.type;
    if (type === undefined)
        throw new Error("object without type: " + obj);

    var ctor = name_to_constructor[type];
    if (ctor === undefined)
        throw new Error("undefined type: " + type);

    // It is possible to have objects without argument list.
    var args = obj.args;
    if (args !== undefined)
        _resolveArray(args);

    return _applyConstructor(ctor, args);
}

//
// MODIFICATIONS TO THESE VARIABLES MUST BE REFLECTED IN rng-to-js.xsl
//
var ARRAY_TYPE_ARRAY = 0;
var ARRAY_TYPE_OBJECT = 1;

// This is a bit field
var OPTION_NO_PATHS = 1;
// var OPTION_WHATEVER = 2;
// var OPTION_WHATEVER_PLUS_1 = 4;
// etc...

//
// MODIFICATIONS TO THIS FUNCTION MUST BE REFLECTED IN rng-to-js.xsl
//

/**
 * Resolve an array according to format V1. For each element, if the
 * element is an array, it is resolved. If the element is an object,
 * then the object is constructed. Otherwise, the element remains as
 * is.
 *
 * @private
 * @param {Array} arr The array to resolve.
 * @param {Object} options The options in the file being converted.
 * @throws {Error} If the array is malformed.
 * @returns {Array} The resolved array.
 */
function _resolveArrayV1(arr, options) {
    if (arr[0] !== 0)
        throw new Error("array type not 0, but " + arr[0] +
                        " for array " + arr);

    var ret = [];
    for (var el_ix = 1, el; (el = arr[el_ix]) !== undefined; el_ix++) {
        if (el instanceof Array) {
            if (el[0] !== 0)
                ret.push(_constructObjectV1(el, options));
            else
                ret.push(_resolveArrayV1(el, options));
        }
        else
            ret.push(el);
    }
    return ret;
}

//
// MODIFICATIONS TO THIS FUNCTION MUST BE REFLECTED IN rng-to-js.xsl
//
/**
 * Converts a V1 representation of a JavaScript object into an Object
 * of the proper class.
 *
 * @private
 * @param {Array} array The array representing the object.
 * @param {Object} options The options in the file being converted.
 * @throws {Error} If the object is malformed.
 * @returns {Object} An object of the proper class.
 */
function _constructObjectV1(array, options) {
    if (array.length < 1)
        throw new Error("array too small to contain object");

    var type = array[0];
    if (type === undefined)
        throw new Error("object without type: " + util.inspec(array));

    var ctor = name_to_constructor[type];
    if (ctor === undefined)
        throw new Error("undefined type: " + type);

    if (ctor === Array)
        throw new Error("trying to build array with _constructObjectV1");

    var add_path = (options & OPTION_NO_PATHS) && ctor !== EName;

    var args;
    if (array.length > 1) {
        args = array.slice(1);
        if (add_path)
            args.unshift("");
        args.unshift(0);
        args = _resolveArrayV1(args, options);
    }
    else if (add_path)
        args = [""];
    else
        args = [];

    return _applyConstructor(ctor, args);
}

//
// MODIFICATIONS TO THIS FUNCTION MUST BE REFLECTED IN rng-to-js.xsl
//
/**
 * Constructs a tree of patterns from a JSON representation of a RNG
 * schema. This representation must have been created by simplifying
 * the original RNG and then converting it with the
 * <code>rng-to-js.xsl</code> transformation provided with salve.
 *
 * @param {String} code The JSON representation.
 * @throws {Error} When the version of the JSON representation is not
 * supported.
 * @returns {module:validate~Pattern} The tree.
 */
function constructTree(code) {
    var parsed = JSON.parse(code);
    if (typeof(parsed) === 'object' && !parsed.v) {
        return _constructObject(parsed);
    }
    else {
        var version = parsed.v;
        var options = parsed.o;
        if (version === 1)
            return _constructObjectV1(parsed.d, options);
        else
            throw new Error("unknown version: " + version);
    }
}

exports.constructTree = constructTree;
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

});

// LocalWords:  namespaces validator namespace xmlns validators EOF
// LocalWords:  lookahead enterStartTag attributeName newWalker URI
// LocalWords:  makeSingletonConstructor HashSet constructTree RNG el
// LocalWords:  subpatterns hashstructs HashMap cleanAttrs fireEvent
// LocalWords:  EName ValidationError msg modelizes args uri API MPL
// LocalWords:  attributeValue leaveStartTag AttributeWalker RelaxNG
// LocalWords:  ElementWalker subwalkers Mixin NotAllowed RefWalker
// LocalWords:  DefineWalker oneOrMore ChoiceWalker subwalker Dubeau
// LocalWords:  ChoiceError GroupWalker addWalker unresolvable util
// LocalWords:  useNameResolver GrammarWalker formedness notAllowed
// LocalWords:  ElementNameError GrammarWalker's Mangalam CodeMirror
// LocalWords:  tokenizer oop jshint newcap validthis SingleNameError
// LocalWords:  lt NoSubwalker SingleSubwalker canEnd ATTRS endTag ev
// LocalWords:  PatternTwoPatterns GroupWalkers PatternOnePattern rng
// LocalWords:  attr enterContext leaveContext definePrefix js xsl vm
// LocalWords:  _constructObjectV NG firstName lastName ret ttt JSON
