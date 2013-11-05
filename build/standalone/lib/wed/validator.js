/**
 * @module validator
 * @desc This module is responsible for validating the document being
 * edited in wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:validator */ function (require, exports, module) {
"use strict";

var SimpleEventEmitter =
        require("./lib/simple_event_emitter").SimpleEventEmitter;
var validate = require("salve/validate");
var $ = require("jquery");
var util = require("./util");
var oop = require("./oop");

var _indexOf = Array.prototype.indexOf;

// validation_stage values

var START_TAG = 1;
var CONTENTS = 2;
var END_TAG = 3;

// Working state values

var INCOMPLETE = 1;
var WORKING = 2;
var INVALID = 3;
var VALID = 4;

exports.INCOMPLETE = INCOMPLETE;
exports.WORKING = WORKING;
exports.INVALID = INVALID;
exports.VALID = VALID;

/**
 * @classdesc A document validator.
 * @mixes module:lib/simple_event_emitter~SimpleEventEmitter
 *
 * @constructor
 * @param {String} schema A path to the schema to pass to salve for
 * validation. This is a path that will be interpreted by
 * RequireJS. The schema must have already been prepared for use by
 * salve. See salve's documentation.
 * @param {Node} root The root of the DOM tree to validate. This root
 * contains the document to validate but is not
 * <strong>part</strong> of it.
 */
function Validator(schema, root) {
    // Call the constructor for our mixin
    SimpleEventEmitter.call(this);

    this.schema = schema;

    this.root = root;
    this._timeout = 200;
    this._max_timespan = 100;
    this._timeout_id = undefined;
    this._initialized = false;
    this._errors = [];
    this._tree = undefined;
    this._bound_wrapper = this._workWrapper.bind(this);

    // Validation state
    this._events = [];
    this._validation_walker = undefined;
    this._working_state = undefined;
    this._part_done = 0;
    this._validation_stage = CONTENTS;
    this._previous_child = null;
    this._validation_stack = [new ProgressState(0, 1)];
    this._cur_el = this.root;
    // This prevents an infinite loop when speculativelyValidate is
    // called to validate a text node.
    $(this._cur_el).data("wed_event_index_after_start", this._events.length);

    this._setWorkingState(INCOMPLETE);

}

oop.implement(Validator, SimpleEventEmitter);

/**
 * Starts the background validation process. If the Validator object
 * is not initialized yet, this will initialize it.
 */
Validator.prototype.start = function () {
    if (this._timeout_id !== undefined)
        this.stop();

    // The timeout here is set to 0 so that we start working ASAP.
    // The timeout value is really meant to be used when we finish one
    // run of work and must wait before starting the *next* one.
    if (!this._initialized)
        this.initialize(function () {
            this._setWorkingState(WORKING, this._part_done);
            this._workWrapper();
        }.bind(this));
    else {
        this._setWorkingState(WORKING, this._part_done);
        this._workWrapper();
    }
};

/**
 * Create the structures needed for the Validator to run.
 *
 * @param {Function} done This function will be called once the
 * Validator is initialized. This is necessary because some of the
 * work to be done is asynchronous.
 */
Validator.prototype.initialize = function (done) {
    $.get(require.toUrl(this.schema), function (x) {
        this._tree = validate.constructTree(x);
        this._validation_walker = this._tree.newWalker();
        this._validation_walker.useNameResolver();
        this._initialized = true;
        done();
    }.bind(this), "text").fail(function (jqXHR, textStatus, errorThrown) {
        throw new Error(textStatus + " " + errorThrown);
    });
};

/**
 * Get the namespaces defined in the schema passed to the
 * Validator. It is a fatal error to call this on an uninitialized
 * Validator.
 *
 * @returns {Array.<String>} The namespaces known to the schema.
 * @throws {Error} If called on uninitialized validator
 */
Validator.prototype.getSchemaNamespaces = function () {
    if (!this._initialized)
        throw new Error("calling getSchemaNamespaces on uninitialized " +
                        "validator");
    return this._tree.getNamespaces();
};


/**
 * Get the namespaces used in the document. This method does not cache
 * its information and scan the whole document independently of the
 * current validation status. It is okay to call it on an
 * uninitialized Validator because it does not use the regular
 * validation machinery.
 *
 * @returns {Object} An object whose keys are namespace prefixes and
 * values are lists of namespace URIs.  The values are lists because
 * prefixes can be redefined in a document.
 */
Validator.prototype.getDocumentNamespaces = function () {
    var ret = {};


    // The default mapping is the value of xmlns set on the very first
    // element that has a value for it.
    var $def = $(this.root).find("[data-wed-xmlns]");
    if ($def.length)
        ret[""] = [$def.attr("data-wed-xmlns")];

    function _process(node) {
        var attr_ix_lim = node.attributes.length;
        for(var attr_ix = 0; attr_ix < attr_ix_lim; ++attr_ix) {
            var attr = node.attributes[attr_ix];
            if (attr.name.lastIndexOf("data-wed-xmlns---", 0) === 0) {
                var key = attr.name.slice(17);
                var array = ret[key];
                if (!array)
                    array = ret[key] = [];
                array.push(attr.value);
            }
        }

        node = node.firstChild;
        while (node) {
            if (node.nodeType === Node.ELEMENT_NODE)
                _process(node);
            node = node.nextSibling;
        }
    }

    _process(this.root);
    return ret;
};


/**
 * Convenience method. The bound version of this method
 * (<code>this._bound_wrapper</code>) is what is called by the
 * timeouts to perform the background validation.
 *
 * @private
 */
Validator.prototype._workWrapper = function () {
    this._restarting = false;
    if (this._work())
        this._timeout_id = window.setTimeout(this._bound_wrapper,
                                             this._timeout);
};

/**
 * Controller method for the background validation. Keeps the validator
 * running only until done or until the maximum time span for one run
 * of the validator is reached.
 *
 * @private
 * @returns {Boolean} False if there is no more work to do. True
 * otherwise.
 */
Validator.prototype._work = function () {
    if (!this._initialized)
        return true;

    var start_date = new Date();
    while (true) {
        // Give a chance to other operations to work.
        if ((this._max_timespan > 0) &&
            (new Date() - start_date) >= this._max_timespan)
            return true;

        var ret = this._cycle();
        if (!ret)
            return false;
    }
    return true;
};

/**
 * Performs one cycle of validation. "One cycle" is an arbitrarily
 * small unit of work.
 *
 * @private
 * @returns {Boolean} False if there is no more work to be done. True
 * otherwise.
 * @throws {Error} When there is an internal error.
 */
Validator.prototype._cycle = function () {
    // Damn hoisting
    var event_result, ename, attr_ix, attr, name;

    var walker = this._validation_walker;

    var portion = this._validation_stack[0].portion;

    stage_change:
    while (true) {
        var $cur_el = $(this._cur_el);
        switch(this._validation_stage) {
        case START_TAG:
            this._validation_stack.unshift(
                new ProgressState(this._part_done, portion));

            // These are currently not needed:
            // $cur_el.data("wed_state_index_before", this._events.length - 1);
            // $cur_el.data("wed_event_index_before", this._events.length - 1);

            // Phantoms do not fire events, nor do "_real _text"
            // elements, nor do placeholders, or carets
            if (!$cur_el.hasClass("_phantom_wrap") &&
                !$cur_el.is("._real._text, ._placeholder, ._wed_caret")) {

                // Handle namespace declarations. Yes, this must
                // happen before we deal with the tag name.
                this._fireAndProcessEvent(
                    walker, new validate.Event("enterContext"),
                    this._cur_el, 0);
                var attr_ix_lim = this._cur_el.attributes.length;
                for(attr_ix = 0; attr_ix < attr_ix_lim; ++attr_ix) {
                    attr = this._cur_el.attributes[attr_ix];
                    if (attr.name === "data-wed-xmlns")
                        this._fireAndProcessEvent(
                            walker, new validate.Event("definePrefix",
                                                       "", attr.value),
                            this._cur_el, 0);
                    else if (attr.name.lastIndexOf("data-wed-xmlns---",
                                                   0) === 0)
                        this._fireAndProcessEvent(
                            walker, new validate.Event("definePrefix",
                                                       attr.name.slice(17),
                                                       attr.value),
                            this._cur_el, 0);
                }
                // Enter the start tag. The 1st class name is
                // always the name of the tag in the original XML.
                name = this._cur_el.className.split(" ", 1)[0];
                ename = walker.resolveName(name);
                var cur_el_ix = this._cur_el.parentNode ?
                        _indexOf.call(
                            this._cur_el.parentNode.childNodes, this._cur_el):
                        undefined;
                this._fireAndProcessEvent(
                    walker,
                    new validate.Event("enterStartTag", ename.ns, ename.name),
                    this._cur_el.parentNode, cur_el_ix);

                // Find all attributes, fire events for them. We
                // should not get any errors here, since the user
                // does not get to set these manually. An error
                // here would indicate an internal error.
                for(attr_ix = 0; attr_ix < attr_ix_lim; ++attr_ix) {
                    attr = this._cur_el.attributes[attr_ix];
                    // Skip those attributes which do not encode
                    // an original attribute or which are
                    // namespace attributes.
                    if ((attr.name.lastIndexOf("data-wed-", 0) !== 0) ||
                        (attr.name === "data-wed-xmlns") ||
                        (attr.name.lastIndexOf("data-wed-xmlns", 0) === 0))
                        continue;
                    var attr_name = util.decodeAttrName(attr.name);
                    ename = walker.resolveName(attr_name, true);
                    this._fireAndProcessEvent(
                        walker,
                        new validate.Event("attributeName",
                                           ename.ns, ename.name),
                        this._cur_el, 0);
                    this._fireAndProcessEvent(
                        walker,
                        new validate.Event("attributeValue", attr.value),
                        this._cur_el, 0);
                }

                    // Leave the start tag.
                this._fireAndProcessEvent(
                    walker, new validate.Event("leaveStartTag"),
                    this._cur_el, 0);
            }

            this._validation_stage = CONTENTS;
            $cur_el.data("wed_event_index_after_start",
                                      this._events.length);
            return true; // state change
            // break would be unreachable.
        case CONTENTS:
            var node = (this._previous_child === null)  ?
                // starting from scratch
                this._cur_el.firstChild :
                // already validation contents
                this._previous_child.nextSibling;

            while (node !== null) {
                switch(node.nodeType) {
                case Node.TEXT_NODE:
                    // We want to fire an event only if the text node
                    // is not just whitespace or if text is possible.
                    event_result = this._fireTextEventIfNeeded(node, walker);
                    if (event_result)
                        this._processEventResult(
                            event_result, node,
                            _indexOf.call(node.parentNode.childNodes, node));
                    break;
                case Node.ELEMENT_NODE:
                    if (!$(node).hasClass("_phantom")) {
                        portion /= $cur_el.children().length;
                        this._cur_el = node;
                        this._validation_stage = START_TAG;
                        this._previous_child = null;
                        continue stage_change;
                    }
                    // else we do nothing because it is phantom.
                    break;
                default:
                    throw new Error("unexpected node type: " + node.nodeType);
                }
                node = node.nextSibling;
            }

            if (node === null)
                this._validation_stage = END_TAG;
            break;
        case END_TAG:
            // We've reached the end...
            if (this._cur_el === this.root) {
                event_result = walker.end();
                if (event_result)
                    this._processEventResult(event_result, this._cur_el,
                                             this._cur_el.childNodes.length);
                this._part_done = 1;
                this._setWorkingState(this._errors.length > 0 ? INVALID :
                                      VALID);
                $(this._cur_el).data("wed_event_index_after",
                                     this._events.length);
                this.stop();
                return false;
            }

            // we need it later
            var original_element = this._cur_el;
            // Phantoms do not generate events, nor do "_real
            // _text" elements.
            if (!$cur_el.hasClass("_phantom_wrap") &&
                !$cur_el.is("._real._text, ._placeholder, ._wed_caret")) {
                // The 1st class name is always the name of the
                // tag in the original XML.
                name = this._cur_el.className.split(" ", 1)[0];
                ename = walker.resolveName(name);
                this._fireAndProcessEvent(
                    walker,
                    new validate.Event("endTag", ename.ns, ename.name),
                    this._cur_el, this._cur_el.childNodes.length);
                this._fireAndProcessEvent(
                    walker, new validate.Event("leaveContext"),
                    this._cur_el, this._cur_el.childNodes.length);
            }

            // Go back to the parent
            this._previous_child = this._cur_el;
            this._cur_el = this._cur_el.parentNode;

            if (this._cur_el !== this.root) {
                this._validation_stack.shift();
                this._part_done =
                    this._validation_stack[0].part_done += portion;
                portion = this._validation_stack[0].portion;
            }

            this._setWorkingState(WORKING, this._part_done);

            $(original_element).data("wed_event_index_after",
                                     this._events.length);
            this._validation_stage = CONTENTS;
            return true; // state_change

            // break; would be unreachable
        default:
            throw new Error("unexpected state");
        }
    }
};

/**
 * Stops background validation.
 */
Validator.prototype.stop = function () {
    if (this._timeout_id !== undefined)
        window.clearTimeout(this._timeout_id);
    this._timeout_id = undefined;

    // We are stopping prematurely, update the state
    if (this._working_state === WORKING)
        this._setWorkingState(INCOMPLETE);
};

/**
 * Restarts validation from a specific point. After the call returns,
 * the background validation will be in effect. (So calling it on a
 * stopped validator has the  side effect of starting it.)
 *
 * @param {Node} node The element to start validation from.
 */
Validator.prototype.restartAt = function (node) {
    if (this._working_state === WORKING)
        this.stop();
    if (this._initialized && !this._restarting) {
        this._restarting = true;
        this._resetTo(node);
    }
    this.start();
};

/**
 * Resets validation to continue from a specific point. Any further
 * work done by the validator will start from the point specified.
 *
 * @private
 * @param {Node} node The element to start validation from.
 * @event module:validator~Validator#reset-errors
 */
Validator.prototype._resetTo = function (node) {
    // An earlier implementation was trying to be clever and to avoid
    // restarting much earlier than strictly needed. That ended up
    // being more costly than doing this primitive restart from 0 no
    // matter what. Eventually, Validator should be updated so that on
    // large documents, restarting from a location towards the end
    // does not require revalidating the whole document. For now,
    // since wed is used for smallish documents, it would be a
    // premature optimization.

    $(this.root).findAndSelf("*").removeData(
        ["wed_event_index_after", "wed_event_index_after_start"]);
    this._validation_stage = CONTENTS;
    this._previous_child = null;
    this._validation_walker = this._tree.newWalker();
    this._validation_walker.useNameResolver();
    this._events = [];
    this._cur_el = this.root;
    this._part_done = 0;
    this._errors = [];
    /**
     * Tells the listener that it must reset its list of errors.
     *
     * @event module:validator~Validator#reset-errors
     * @type {Object}
     * @property {Integer} at The index of the first error that must
     * be deleted. This error and all those after it must be deleted.
     */

    this._emit("reset-errors", { at: 0 });
};

/**
 * Sets the working state of the validator. Emits a "state-update"
 * event if the state is really new.
 *
 * @private
 * @param new_state The new state of the validator.
 * @emits module:validator~Validator#state-update
 */
Validator.prototype._setWorkingState = function (new_state) {
    if (this._working_state !== new_state || new_state === WORKING) {
        this._working_state = new_state;
        /**
         * Tells the listener that the validator has changed state.
         *
         * @event module:validator~Validator#state-update
         */
        this._emit("state-update");
    }
};

/**
 * Gets the validator working state.
 * @returns {Object} An object with two fields. The field
 * <code>state</code> is the actual working state. The field
 * <code>part_done</code> is the part of the validation done so far.
 */
Validator.prototype.getWorkingState = function () {
    return {
        state: this._working_state,
        part_done: this._part_done
    };
};

/**
 * Processes the result of firing a tag event. It will emit an "error"
 * event for each error.
 *
 * @private
 * @param result The result of the walker's <code>fireEvent</code> call.
 * @param {Node} node The data node to which the result belongs.
 * @param {Integer} index The index into <code>node</code> to which the
 * result belongs.
 * @emits module:validator~Validator#error
 */
Validator.prototype._processEventResult = function (result, node, index) {
    for(var ix = 0, err; (err = result[ix]) !== undefined; ++ix) {
        this._errors.push(err);
        /**
         * Tells the listener that an error has occurred.
         *
         * @event module:validator~Validator#error
         * @type {Object}
         * @property {Object} error The validation error.
         * @property {Node} node The node where the error occurred.
         * @property {Integer} index The index in this node.
         */
        this._emit("error", { error: err, node: node, index: index});
    }
};

/**
 * Convenience method to fire events.
 *
 * @private
 * @param {module:validate~Walker} walker The walker on which to fire events.
 * @param {module:validate~Event} event The event to fire.
 * @param {Node} el The DOM node associated with this event.
 * @param {Integer} ix The index into <code>el</code> associated with this
 event.
 */
Validator.prototype._fireAndProcessEvent = function (walker, event, el, ix) {
    this._events.push(event);
    var event_result = walker.fireEvent(event);
    if (event_result)
        this._processEventResult(event_result, el, ix);
};

/**
 * <p>Convenience method. This method will fire a text event only if
 * warranted, that is, if either the text node is non empty or if the
 * current location in validation accepts text nodes.</p>
 *
 * <p>Rationale: a non-empty text node must fire a text
 * event. However, if a text node is empty it is relevant for
 * validation only if it appears in a context where text is
 * expected.</p>
 *
 * @private
 * @param {Node} text_node The text node for which the method might
 * fire an event.
 * @param {module:validate~Walker} walker The walker on which to fire
 * events.
 * @param {Boolean} [dont_record=false] If true means do not record
 * the event among the list of events. This is necessary for some
 * speculative parsing operations.
 *
 * @returns The same possible values a walker returns.
 */

Validator.prototype._fireTextEventIfNeeded = function (text_node, walker,
                                                       dont_record) {
    if (($.trim(text_node.nodeValue).length > 0) ||
        (walker.possible().filter(function (x) {
            return x[0] === 'text';
        }).length > 0)) {
        var event = new validate.Event("text");
        if (!dont_record)
            this._events.push(event);
        return walker.fireEvent(event);
    }

    // Behave the same as when an event has been fired without error.
    return false;
};

/**
 * <p>Force immediate validation up to the point specified by the
 * parameters. These parameters are interpreted in the same way a DOM
 * caret is.</p>
 *
 * <p>There is one exception in the way the <code>container, index</code>
 * pair is interpreted. If the container is the
 * <code>root</code> that was passed when constructing the Validator,
 * then setting <code>index</code> to a negative value will result in
 * the validation validating all elements <strong>and</strong>
 * considering the document complete. So unclosed tags or missing
 * elements will be reported. Otherwise, the validation goes up the
 * <code>index</code> but considers the document incomplete, and won't
 * report the errors that are normally reported at the end of a
 * document. For instance, unclosed elements won't be reported.</p>
 *
 * @private
 * @param {Node} container
 * @param {Integer} index
 * @throws {Error} If <code>container</code> is not of element or text type.
 */
Validator.prototype._validateUpTo = function (container, index) {
    var $container = $(container);

    // Set these to reasonable defaults. The rest of the code is
    // dedicated to changing these values to those necessary depending
    // on specifics of what is passed to the method.
    var $to_inspect = $container;
    var data_key = "wed_event_index_after";

    // This function could be called with container === root if the
    // document is empty or if the user has the caret before the start
    // tag of the first element of the actual structure we want to
    // validate or after the end tag of that element.
    if (container === this.root && index <= 0) {
        // We're before the top element, no events to fire.
        if (index === 0)
            return;
        // default values of $to_inspect and data_key are what we want
    }
    else {
        // Damn hoisting.
        var $prev;
        switch(container.nodeType) {
        case Node.TEXT_NODE:
            $prev = $(container).prev("._real, ._phantom_wrap");

            if ($prev.length > 0)
                $to_inspect = $prev;
            else {
                $to_inspect =  $(container.parentNode);
                data_key = "wed_event_index_after_start";
            }
            break;
        case Node.ELEMENT_NODE:
            var node = container.childNodes[index];

            $prev = (node === undefined) ?
                $(container).children("._real, ._phantom_wrap").last() :
                $(node).prev("._real, ._phantom_wrap");

            if ($prev.length > 0)
                $to_inspect = $prev;
            else
                // $to_inspect's default is fine
                data_key = "wed_event_index_after_start";
            break;
        default:
            throw new Error("unexpected node type: " + container.nodeType);
        }
    }

    while($to_inspect.data(data_key) === undefined)
        this._cycle();
};

/**
 * @classdesc Exception to be raised if we can't find our place in the events
 * list. It is only to be raised by code in this module but the
 * documentation is left public for diagnosis purposes.
 * @extends Error
 *
 * @constructor
 */
function EventIndexException ()
{
    Error.call(this, "undefined event_index; "+
               "_validateUpTo should have taken care of that");
}

oop.inherit(EventIndexException, Error);

/**
 * Gets the walker which would represent the state of parsing at the
 * point expressed by the parameters. See {@link
 * module:validator~Validator#_validateUpTo _validateUpTo} for the
 * details of how these parameters are interpreted.
 *
 * @private
 *
 * @param {Node} container
 * @param {Integer} index
 * @returns {module:validate~Walker} The walker.
 * @throws {EventIndexException} If it runs out of events or computes
 * an event index that makes no sense.
 */
Validator.prototype._getWalkerAt = function(container, index) {
    // Make sure we have the data we need.
    this._validateUpTo(container, index);

    // Damn hoisting.
    var walker, ix;
    // This function could be called with container === root if the
    // document is empty or if the user has the caret before the start
    // tag of the first element of the actual structure we want to
    // validate or after the end tag of that element.
    if (container === this.root && index <= 0) {
        walker = this._tree.newWalker();
        walker.useNameResolver();

        // We're before the top element, no events to fire.
        if (index === 0)
            return walker;

        event_index = $(container).data("wed_event_index_after");
        if (event_index === undefined)
            throw new EventIndexException();

        // We're past the top element, fire all events.
        for(ix= 0; ix < this._events.length; ++ix)
            walker.fireEvent(this._events[ix]);
        return walker;
    }

    // Damn hoisting
    var $prev, event_index;
    switch(container.nodeType) {
    case Node.TEXT_NODE:
        $prev = $(container).prev("._real, ._phantom_wrap");

        event_index =
            ($prev.length > 0) ? $prev.data("wed_event_index_after") :
            $(container.parentNode).data("wed_event_index_after_start");

        if (event_index === undefined)
            throw new EventIndexException();

        walker = this._tree.newWalker();
        walker.useNameResolver();
        for(ix = 0; ix < event_index; ++ix)
            walker.fireEvent(this._events[ix]);

        // We will attempt to fire a text event either if our location
        // is inside the current text node or if another text node
        // appeared between this text node and the previous element
        // found.
        if (index > 0 ||
            $prev.nextUntil(container).filter(function (x) {
                return this.nodeType === Node.TEXT_NODE ||
                    $(this).hasClass("_text");
            }).length > 0)
            this._fireTextEventIfNeeded(container, walker, true);

        break;
    case Node.ELEMENT_NODE:
        var node = container.childNodes[index];

        $prev = (node === undefined) ?
            $(container).children("._real, ._phantom_wrap").last() :
            $(node).prev("._real, ._phantom_wrap");

        event_index =
            ($prev.length > 0) ? $prev.data("wed_event_index_after") :
            $(container).data("wed_event_index_after_start");

        if (event_index === undefined)
            throw new EventIndexException();

        walker = this._tree.newWalker();
        walker.useNameResolver();
        for(ix = 0; ix < event_index; ++ix)
            walker.fireEvent(this._events[ix]);

        // We will attempt to fire a text event if another
        // text node appeared between this text node and the
        // previous element found.
        if (((node === undefined) ? $prev.nextAll() :
             $prev.nextUntil(node)).filter(function (x) {
            return this.nodeType === Node.TEXT_NODE ||
                $(this).hasClass("_text");
        }).length > 0)
            this._fireTextEventIfNeeded(container, walker, true);

        break;
    default:
        throw new Error("unexpected node type: " + container.nodeType);
    }

    return walker;
};

/**
 * Returns the set of possible events for the location specified by
 * the parameters. See {@link module:validator~Validator#_validateUpTo
 * _validateUpTo} for the details of how these parameters are
 * interpreted. A "possible event" is an event that if fired won't
 * result in a validation error.
 *
 * @param {Node} container
 * @param {Integer} index
 * @returns {module:validate~EventSet} A set of possible events.
 */
Validator.prototype.possibleAt = function (container, index) {
    var walker = this._getWalkerAt(container, index);
    return walker.possible();
};

/**
 * <p>Validate a DOM fragment as if it were present at the point
 * specified in the parameters in the DOM tree being validated.</p>
 *
 * <p>WARNING: This method will not catch unclosed elements. This is
 * because the fragment is not considered to be a "complete"
 * document. Unclosed elements or fragments that are not well-formed
 * must be caught by other means.</p>
 *
 * @param {Node} container The location in the tree to start at.
 * @param {Integer} index The location in the tree to start at.
 * @param {Node} to_parse The fragment to parse.
 * @returns {Array.<Object>|false} Returns an array of errors if there
 * is an error. Otherwise returns false.
 */
Validator.prototype.speculativelyValidate = function (container, index,
                                                      to_parse) {
    if (!this._initialized)
        throw new Error("uninitialized Validator");

    var $clone = $(to_parse).clone();
    var $root = $("<div>");
    $root.append($clone);

    // We create a new validator with the proper state to parse the
    // fragment we've been given.
    var dup = new Validator(this.schema, $root.get(0));

    dup._validation_walker = this._getWalkerAt(container, index).clone();

    dup._tree = this._tree; // _tree is immutable so we can share.
    dup._initialized = true;

    // This forces validating the whole fragment
    dup._validateUpTo($root.get(0), 1);
    if (dup._errors.length)
        return dup._errors;

    return false;
};

//
// Private helper functions and classes
//

/**
 * @classdesc Data structure for recording progress.
 *
 * @private
 * @constructor
 * @param {Float} part_done The part of the document done so far.
 * @param {Float} portion A ProgressState object is created in
 * relation to an element. The element covers portion X of the total
 * document. This parameter should be X.
 */
function ProgressState(part_done, portion) {
    this.part_done = part_done;
    this.portion = portion;
}



exports.Validator = Validator;

});

//  LocalWords:  revalidating inspect's leaveContext leaveStartTag el
//  LocalWords:  attributeValue endTag attributeName enterContext DOM
//  LocalWords:  SimpleEventEmitter namespace mixin ProgressState oop
//  LocalWords:  validateUpTo unclosed fireEvent definePrefix xmlns
//  LocalWords:  speculativelyValidate RequireJS enterStartTag MPL
//  LocalWords:  namespaces validator Mangalam Dubeau nextSibling
//  LocalWords:  findandself prev whitespace boolean jquery util
//  LocalWords:  jQuery
