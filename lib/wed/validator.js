/**
 * @module validator
 * @desc This module is responsible for validating the document being
 * edited in wed.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:validator */ function (require, exports, module) {
"use strict";

var SimpleEventEmitter =
        require("./lib/simple_event_emitter").SimpleEventEmitter;
var salve = require("salve");
var $ = require("jquery");
var oop = require("./oop");
var dloc = require("./dloc");
var domutil = require("./domutil");
var indexOf = domutil.indexOf;
var isAttr = domutil.isAttr;

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
// This does NOT mean that using this strategy is valid elsewhere in
// wed or in other projects.
//


/**
 * @classdesc A document validator. The validator assumes that the DOM
 * tree it uses for validation is always normalized: that is, there
 * are no empty text nodes and there cannot be two adjacent text
 * nodes.
 * @mixes module:lib/simple_event_emitter~SimpleEventEmitter
 *
 * @constructor
 * @param {string|module:salve/validate~Grammar} schema A path to the
 * schema to pass to salve for validation. This is a path that will be
 * interpreted by RequireJS. The schema must have already been
 * prepared for use by salve. See salve's documentation. Or this can
 * be a ``Grammar`` object that has already been produced from
 * ``salve``'s ``constructTree``.
 * @param {Node} root The root of the DOM tree to validate. This root
 * contains the document to validate but is not
 * @param {module:mode~Mode} [mode] The mode that is currently in use.
 * <strong>part</strong> of it.
 */
function Validator(schema, root, mode) {
    // Call the constructor for our mixin
    SimpleEventEmitter.call(this);

    this.schema = schema;

    this.root = root;
    this.mode = mode;
    this._cycle_entered = 0;
    this._timeout = 200;
    this._max_timespan = 100;
    this._timeout_id = undefined;
    this._initialized = false;
    this._restarting = false;
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
    this._walker_cache = Object.create(null);
    this._walker_cache_max = -1;
    // The distance between walkers under which we skip saving a
    // walker in the cache.
    this._walker_cache_gap = 100;

    // This prevents an infinite loop when speculativelyValidate is
    // called to validate a text node.
    this._cur_el.wed_event_index_after_start = this._events.length;

    this._setWorkingState(INCOMPLETE, 0);

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
            this._timeout_id = window.setTimeout(this._bound_wrapper,
                                                 this._timeout);
        }.bind(this));
    else {
        this._setWorkingState(WORKING, this._part_done);
        this._timeout_id = window.setTimeout(this._bound_wrapper,
                                             this._timeout);
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
    if (this.schema instanceof salve.Grammar) {
        this._tree = this.schema;
        this._validation_walker = this._tree.newWalker();
        this._initialized = true;
        done();
    }
    else {
        $.get(require.toUrl(this.schema), function (x) {
            this._tree = salve.constructTree(x);
            this._validation_walker = this._tree.newWalker();
            this._initialized = true;
            done();
        }.bind(this), "text").fail(function (jqXHR, textStatus, errorThrown) {
            throw new Error(textStatus + " " + errorThrown);
        });
    }
};

/**
 * Get the namespaces defined in the schema passed to the
 * Validator. It is a fatal error to call this on an uninitialized
 * Validator.
 *
 * @returns {Array.<string>} The namespaces known to the schema.
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


    function _process(node) {
        var attr_ix_lim = node.attributes.length;
        for(var attr_ix = 0; attr_ix < attr_ix_lim; ++attr_ix) {
            var attr = node.attributes[attr_ix];
            if (attr.name.lastIndexOf("xmlns", 0) === 0) {
                var key = attr.name.slice(6);
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

    _process(this.root.firstChild);
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
 * @returns {boolean} False if there is no more work to do. True
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

//
// These are constants. So create them once rather than over and over
// again.
//
var _enter_context_event = new salve.Event("enterContext");
var _leave_start_tag_event = new salve.Event("leaveStartTag");
var _leave_context_event = new salve.Event("leaveContext");

/**
 * Performs one cycle of validation. "One cycle" is an arbitrarily
 * small unit of work.
 *
 * @private
 * @returns {boolean} False if there is no more work to be done. True
 * otherwise.
 * @throws {Error} When there is an internal error.
 */
Validator.prototype._cycle = function () {

    // If we got here after a restart, then we've finished restarting.
    // If we were not restarting, then this is a noop.
    this._restarting = false;

    //
    // This check is meant to catch problems that could be hard to
    // diagnose if wed or one of its modes had a bug such that
    // `_cycle` is reentered from `_cycle`. This could happen during
    // error processing, for instance. Error processing causes wed to
    // process the errors, which causes changes in the GUI tree, which
    // *could* (this would be a bug) cause the code of a mode to
    // execute something like `getErrorsFor`, which could cause
    // `_cycle` to be reentered.
    //
    if (this.cycle_entered > 0)
        throw new Error("internal error: _cycle is being reentered");

    if (this.cycle_entered < 0)
        throw new Error("internal error: _cycle_entered negative");

    //
    // IMPORTANT: This variable must be decremented before exiting
    // this method. A try...finally statement is not used here because
    // it would prevent some virtual machines from optimizing this
    // function.
    //
    this.cycle_entered++;

    // Damn hoisting
    var event_result, ename, attr_ix, attr, name;

    var walker = this._validation_walker;

    var stack = this._validation_stack;
    var portion = stack[0].portion;
    var events = this._events;
    var stage = this._validation_stage;

    stage_change:
    while (true) {
        var cur_el = this._cur_el;
        switch(stage) {
        case START_TAG:
            stack.unshift(new ProgressState(this._part_done, portion));

            // These are currently not needed:
            // $cur_el.data("wed_state_index_before", events.length - 1);
            // $cur_el.data("wed_event_index_before", events.length - 1);

            // Handle namespace declarations. Yes, this must
            // happen before we deal with the tag name.
            this._fireAndProcessEvent(
                walker, _enter_context_event, cur_el, 0);
            var attr_ix_lim = cur_el.attributes.length;
            for(attr_ix = 0; attr_ix < attr_ix_lim; ++attr_ix) {
                attr = cur_el.attributes[attr_ix];
                if (attr.name === "xmlns")
                    this._fireAndProcessEvent(
                        walker, new salve.Event("definePrefix",
                                                   "", attr.value),
                        cur_el, 0);
                else if (attr.name.lastIndexOf("xmlns:", 0) === 0)
                    this._fireAndProcessEvent(
                        walker, new salve.Event("definePrefix",
                                                   attr.name.slice(6),
                                                   attr.value),
                        cur_el, 0);
            }
            ename = walker.resolveName(cur_el.tagName);
            // Check whether this element is going to be allowed only
            // due to a wildcard.
            this._setPossibleDueToWildcard(cur_el, walker, "enterStartTag",
                                          ename.ns, ename.name);
            this._fireAndProcessEvent(
                walker,
                new salve.Event("enterStartTag", ename.ns, ename.name),
                cur_el.parentNode, cur_el.parentNode && cur_el);
            cur_el.wed_event_index_before_attributes = events.length;

            this._fireAttributeEvents(walker, cur_el);
            cur_el.wed_event_index_after_attributes = events.length;

            // Leave the start tag.
            this._fireAndProcessEvent(
                walker, _leave_start_tag_event, cur_el, 0);

            stage = this._validation_stage = CONTENTS;
            cur_el.wed_event_index_after_start = events.length;
            this.cycle_entered--;
            return true; // state change
            // break would be unreachable.
        case CONTENTS:
            var node = (this._previous_child === null)  ?
                // starting from scratch
                cur_el.firstChild :
                // already validation contents
                this._previous_child.nextSibling;

            while (node !== null) {
                switch(node.nodeType) {
                case Node.TEXT_NODE:
                    var event = new salve.Event("text", node.data);
                    event_result = walker.fireEvent(event);
                    if (event_result)
                        this._processEventResult(
                            event_result, node.parentNode,
                            indexOf(node.parentNode.childNodes, node));
                    break;
                case Node.ELEMENT_NODE:
                    portion /= cur_el.childElementCount;
                    this._cur_el = cur_el = node;
                    stage = this._validation_stage = START_TAG;
                    this._previous_child = null;
                    continue stage_change;
                default:
                    throw new Error("unexpected node type: " + node.nodeType);
                }
                node = node.nextSibling;
            }

            if (node === null)
                stage = this._validation_stage = END_TAG;
            break;
        case END_TAG:
            // We've reached the end...
            if (cur_el === this.root) {
                event_result = walker.end();
                if (event_result)
                    this._processEventResult(event_result, cur_el,
                                             cur_el.childNodes.length);
                this._runDocumentValidation();
                this._setWorkingState(this._errors.length > 0 ? INVALID :
                                      VALID, 1);
                cur_el.wed_event_index_after = events.length;
                this.stop();
                this.cycle_entered--;
                return false;
            }

            // we need it later
            var original_element = cur_el;
            ename = walker.resolveName(cur_el.tagName);
            this._fireAndProcessEvent(
                walker,
                new salve.Event("endTag", ename.ns, ename.name),
                cur_el, cur_el.childNodes.length);
            this._fireAndProcessEvent(
                walker, _leave_context_event,
                cur_el, cur_el.childNodes.length);

            // Go back to the parent
            this._previous_child = cur_el;
            this._cur_el = cur_el = cur_el.parentNode;

            var next_done = this._part_done;
            if (cur_el !== this.root) {
                stack.shift();
                var first = stack[0];
                next_done = first.part_done += portion;
                portion = first.portion;
            }

            this._setWorkingState(WORKING, next_done);

            original_element.wed_event_index_after = this._events.length;
            stage = this._validation_stage = CONTENTS;
            this.cycle_entered--;
            return true; // state_change

            // break; would be unreachable
        default:
            throw new Error("unexpected state");
        }
    }

    this.cycle_entered--;
};

/**
 * Runs document-wide validation specific to the mode passed to
 * the validator.
 *
 * @private
 * @emits module:validator~Validator#error
 */
Validator.prototype._runDocumentValidation = function () {
    if (!this.mode)
        return;

    var errors = this.mode.validateDocument();
    for (var i = 0, error; (error = errors[i]); ++i)
        this._processError(error);
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
        this._setWorkingState(INCOMPLETE, this._part_done);
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

    // We use `this._restarting` to avoid a costly reinitialization if
    // this method is called twice in a row before any work has had a
    // chance to be done.
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
 * @emits module:validator~Validator#reset-errors
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

    function erase(el) {
        el.wed_event_index_after = undefined;
        el.wed_event_index_after_start = undefined;
        el.wed_event_index_before_attributes = undefined;
        el.wed_event_index_after_attributes = undefined;
        el.wed_possible_due_to_wildcard = undefined;
        var child = el.firstElementChild;
        while(child) {
            erase(child);
            child = child.nextElementSibling;
        }
    }
    erase(this.root);
    this._validation_stage = CONTENTS;
    this._previous_child = null;
    this._validation_walker = this._tree.newWalker();
    this._events = [];
    this._cur_el = this.root;
    this._part_done = 0;
    this._errors = [];
    this._walker_cache = Object.create(null);
    this._walker_cache_max = -1;
    /**
     * Tells the listener that it must reset its list of errors.
     *
     * @event module:validator~Validator#reset-errors
     * @type {Object}
     * @property {integer} at The index of the first error that must
     * be deleted. This error and all those after it must be deleted.
     */

    this._emit("reset-errors", { at: 0 });
};

/**
 * Sets the working state of the validator. Emits a "state-update"
 * event if the state has changed.
 *
 * @private
 * @param new_state The new state of the validator.
 * @param new_done The new portion of work done.
 * @emits module:validator~Validator#state-update
 */
Validator.prototype._setWorkingState = function (new_state, new_done) {
    var changed = false;
    if (this._working_state !== new_state) {
        this._working_state = new_state;
        changed = true;
    }

    if (this._part_done !== new_done) {
        this._part_done = new_done;
        changed = true;
    }

    if (changed) {
        /**
         * Tells the listener that the validator has changed state.
         *
         * @event module:validator~Validator#state-update
         */
        this._emit("state-update", { state: new_state, part_done: new_done });
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
 * @param {integer} index The index into <code>node</code> to which the
 * result belongs.
 * @emits module:validator~Validator#error
 */
Validator.prototype._processEventResult = function (result, node, index) {
    for(var ix = 0, err; (err = result[ix]) !== undefined; ++ix) {
        var error_data = { error: err, node: node, index: index};
        this._processError(error_data);
    }
};

/**
 * This method should be called whenever a new error is detected. It
 * records the error and emits the corresponding event.
 *
 * @private
 * @param {module:validator~Validator#event:error} error The error found.
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
    this._emit("error", error);
};


/**
 * Fires all the attribute events for a given element.
 * @private
 */
Validator.prototype._fireAttributeEvents = function (walker, el) {
    // Find all attributes, fire events for them.
    for(var i = 0, attr; (attr = el.attributes[i]); ++i) {
        // Skip those attributes which are namespace attributes.
        if ((attr.name === "xmlns") ||
            (attr.name.lastIndexOf("xmlns", 0) === 0))
            continue;
        this._fireAttributeNameEvent(walker, el, attr);
        this._fireAndProcessEvent(
            walker,
            new salve.Event("attributeValue", attr.value), attr, 0);
    }
};

/**
 * Fires an attributeName event.
 * @private
 */
Validator.prototype._fireAttributeNameEvent = function (walker, el, attr) {
    var attr_name = attr.name;
    var ename = walker.resolveName(attr_name, true);
    this._setPossibleDueToWildcard(attr, walker, "attributeName",
                                   ename.ns, ename.name);
    this._fireAndProcessEvent(
        walker,
        new salve.Event("attributeName", ename.ns, ename.name), attr, 0);
};


/**
 * Convenience method to fire events.
 *
 * @private
 * @param {module:validate~Walker} walker The walker on which to fire events.
 * @param {module:validate~Event} event The event to fire.
 * @param {Node} [el] The DOM node associated with this event. Both ``el``
 * and ``ix`` can be undefined for events that have no location
 * associated with them.
 * @param {integer|Node} [ix] The index into <code>el</code> associated with this
 * event, or a ``Node`` which must be a child of ``el``. The index will
 * be computed from the location of the child passed as this parameter
 * in ``el``.
 */
Validator.prototype._fireAndProcessEvent = function (walker, event, el, ix) {
    this._events.push(event);
    var event_result = walker.fireEvent(event);
    if (event_result) {
        if (el && ix && typeof ix !== "number") {
            ix = el ? indexOf(el.childNodes, ix) : undefined;
        }
        this._processEventResult(event_result, el, ix);
    }
};

/**
 * Force an immediate validation which is guaranteed to go at least up
 * to the point specified by ``container, index``, exclusively. These
 * parameters are interpreted in the same way a DOM caret is.
 *
 * If the validation has not yet reached the location specified,
 * validation will immediately be performed to reach the point. If the
 * validation has already reached this point, then this call is a
 * no-op.
 *
 * There is one exception in the way the ``container, index`` pair is
 * interpreted. If the container is the ``root`` that was passed when
 * constructing the Validator, then setting ``index`` to a negative
 * value will result in the validation validating all elements **and**
 * considering the document complete. So unclosed tags or missing
 * elements will be reported. Otherwise, the validation goes up the
 * ``index`` but considers the document incomplete, and won't report
 * the errors that are normally reported at the end of a document. For
 * instance, unclosed elements won't be reported.
 *
 * @private
 * @param {Node} container The location up to where to validate.
 * @param {integer} index The location up to where to validate.
 * @param {boolean} [attributes=false] Whether we are interested to
 * validate up to and including the attribute events of the node
 * pointed to by ``container, index``. The validation ends before leaving
 * the start tag.
 * @throws {Error} If <code>container</code> is not of element or text type.
 */
Validator.prototype._validateUpTo = function (container, index, attributes) {
    attributes = !!attributes; // Normalize.
    if (attributes && (!container.childNodes ||
                       container.childNodes[index].nodeType !==
                       Node.ELEMENT_NODE))
        throw new Error("trying to validate after attributes but before " +
                        "the end of the start tag on a " +
                        "node which is not an element node");

    // Set these to reasonable defaults. The rest of the code is
    // dedicated to changing these values to those necessary depending
    // on specifics of what is passed to the method.
    var to_inspect = container;
    var data_key = "wed_event_index_after";

    // This function could be called with container === root if the
    // document is empty or if the user has the caret before the start
    // tag of the first element of the actual structure we want to
    // validate or after the end tag of that element.
    if (container === this.root && index <= 0) {
        if (attributes) {
            data_key = "wed_event_index_after_attributes";
            to_inspect = container.childNodes[index];
        }
        else if (index === 0)
            // We're before the top element, no events to fire.
            return;
        // default values of to_inspect and data_key are what we want
    }
    else {
        // Damn hoisting.
        var prev;
        if (isAttr(container)) {
            to_inspect = container.ownerElement;
            data_key = "wed_event_index_before_attributes";
        }
        else {
            switch(container.nodeType) {
            case Node.TEXT_NODE:
                to_inspect = container.previousElementSibling;
                if (!to_inspect) {
                    to_inspect =  container.parentNode;
                    data_key = "wed_event_index_after_start";
                }
                break;
            case Node.ELEMENT_NODE:
            case Node.DOCUMENT_FRAGMENT_NODE:
            case Node.DOCUMENT_NODE:
                var node = container.childNodes[index];

                prev = !node ?
                    container.lastElementChild : node.previousElementSibling;

                if (prev)
                    to_inspect = prev;
                // to_inspect's default is fine for the next few options
                else {
                    if (attributes) {
                        data_key = "wed_event_index_after_attributes";
                        to_inspect = node;
                    }
                    else
                        data_key = "wed_event_index_after_start";
                }
                break;
            default:
                throw new Error("unexpected node type: " + container.nodeType);
            }
        }
    }

    while(to_inspect[data_key] === undefined)
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
    Error.captureStackTrace(this, this.constructor);
}

oop.inherit(EventIndexException, Error);

/**
 * Gets the walker which would represent the state of parsing at the
 * point expressed by the parameters. See {@link
 * module:validator~Validator#_validateUpTo _validateUpTo} for the
 * details of how these parameters are interpreted.
 *
 * **The walker returned by this function is not guaranteed to be a
 *    new instance. Callers should not modify the walker returned but
 *    instead clone it.**
 *
 * @private
 *
 * @param {Node} container
 * @param {integer} index
 * @param {boolean} [attributes=false] Whether we are interested to
 * validate up to but not including the attribute events of the node
 * pointed to by ``container, index``. If ``true`` the walker returned
 * will have all events fired on it up to, and including, those
 * attribute events on the element pointed to by ``container, index``.
 * @returns {module:validate~Walker} The walker.
 * @throws {EventIndexException} If it runs out of events or computes
 * an event index that makes no sense.
 */
Validator.prototype._getWalkerAt = function(container, index, attributes) {
    attributes = !!attributes; // Normalize.
    if (attributes && (!container.childNodes ||
                       container.childNodes[index].nodeType !==
                       Node.ELEMENT_NODE))
        throw new Error("trying to get a walker for attribute events on a " +
                        "node which is not an element node");

    // Make sure we have the data we need.
    this._validateUpTo(container, index, attributes);

    // This function could be called with container === root if the
    // document is empty or if the user has the caret before the start
    // tag of the first element of the actual structure we want to
    // validate or after the end tag of that element.
    if (container === this.root && index <= 0) {
        if (!attributes) {
            // We're before the top element, no events to fire.
            if (index === 0)
                return this._tree.newWalker();

            // _validateUpTo ensures that the current walker held by
            // the validator is what we want. We can just return it
            // here because it is the caller's reponsibility to either
            // not modify it or clone it.
            return this._validation_walker;
        }
    }

    //
    // Perceptive readers will notice that the caching being done here
    // could be more aggressive. It turns out that the cases where we
    // have to clone the walker after getting it from the cache are
    // not that frequently used, so there is little to gain from being
    // more aggressive. Furthermore, it is likely that the caching
    // system will change when we implement a saner way to reset
    // validation and segment large documents into smaller chunks.
    //

    var me = this;
    function readyWalker(event_index) {
        if (event_index === undefined)
            throw new EventIndexException();

        var cache = me._walker_cache;
        var max = me._walker_cache_max;

        var walker = cache[event_index];
        if (walker)
            return walker;

        //
        // Scan the cache for a walker we could use... rather than
        // start from zero.
        //
        // There is no point in trying to be clever by using
        // me._walker_cache_gap to start our search. If _getWalkerAt
        // is called with decreasing positions in the document, then
        // the gap is meaningless for our search. (Such scenario is
        // not a normal usage pattern for _getWalkerAt but it *can*
        // happen so we cannot assume that it won't happen.)
        //
        // Also, the following approach is a bit crude but trying to
        // be clever with Object.keys() and then searching through a
        // sorted list does not yield an appreciable
        // improvement. Maybe on very large documents it would but
        // this module will have to be redesigned to tackle that so
        // there's no point now to be cleverer than this. We also
        // tested using a sparse Array for the cache and got visibly
        // worse performance. And we tested to see if a flag
        // indicating if the cache has anything in it would help avoid
        // doing a long search but it maked things worse. Basically,
        // it seems that the typical usage pattern of _getWalkerAt is
        // such that it will usually be called in increasing order of
        // position in the document.
        //
        var search_ix = event_index;
        if (search_ix >= max) {
            search_ix = max;
            walker = cache[search_ix];
        }
        else {
            while (!walker && --search_ix >= 0)
                walker = cache[search_ix];
        }

        if (walker) {
            walker = walker.clone();
        }
        else {
            walker = me._tree.newWalker();
            search_ix = 0;
        }

        for(var ix = search_ix; ix < event_index; ++ix)
            walker.fireEvent(me._events[ix]);

        // This is a bit arbitrary to find a balance between caching
        // too much information and spending too much time computing
        // walkers.
        if (event_index - search_ix >= me._walker_cache_gap) {
            cache[event_index] = walker;
            me._walker_cache_max = Math.max(event_index, max);
        }

        return walker;
    }

    // Damn hoisting.
    var walker, ix;
    function fireTextEvent(text_node) {
        var event = new salve.Event("text", text_node.data);
        walker.fireEvent(event);
    }

    // Damn hoisting
    var prev, event_index, walker_disp;
    if (isAttr(container)) {
        var el = container.ownerElement;
        walker = readyWalker(el.wed_event_index_before_attributes);

        // Don't fire on namespace attributes.
        if (!(container.name === "xmlns" || container.prefix === "xmlns")) {
            walker = walker.clone();
            this._fireAttributeNameEvent(walker, el, container);
        }
    }
    else {
        switch(container.nodeType) {
        case Node.TEXT_NODE:
            prev = container.previousElementSibling;
            walker = readyWalker(
                prev ? prev.wed_event_index_after :
                    container.parentNode.wed_event_index_after_start);

            // We will attempt to fire a text event if our location
            // is inside the current text node.
            //
            // A previous version of this code was also checking whether
            // there is a text node between this text node and prev but
            // this cannot happen because the tree on which validation is
            // performed cannot have two adjacent text nodes. It was also
            // checking whether there was a _text element between prev
            // and this text node but this also cannot happen.
            if (index > 0) {
                walker = walker.clone();
                fireTextEvent(container);
            }

            break;
        case Node.ELEMENT_NODE:
        case Node.DOCUMENT_NODE:
        case Node.DOCUMENT_FRAGMENT_NODE:
            var node = container.childNodes[index];

            if (!attributes) {
                prev = !node ? container.lastElementChild :
                    node.previousElementSibling;

                event_index = prev ? prev.wed_event_index_after :
                    container.wed_event_index_after_start;
            }
            else
                event_index = node.wed_event_index_after_attributes;

            walker = readyWalker(event_index);

            if (!attributes) {
                // We will attempt to fire a text event if another text node
                // appeared between the node we care about and the element
                // just before it.
                var prev_sibling = node && node.previousSibling;
                if (prev_sibling &&
                    // If the previous sibling is the same as the previous
                    // *element* sibbling, then there is nothing *between*
                    // that we need to take care of.
                    prev_sibling !== prev) {
                    if (prev_sibling.nodeType === Node.TEXT_NODE) {
                        walker = walker.clone();
                        fireTextEvent(prev_sibling);
                    }
                }
            }
            break;
        default:
            throw new Error("unexpected node type: " + container.nodeType);
        }
    }

    return walker;
};

/**
 * Returns the set of possible events for the location specified by
 * the parameters.
 *
 * @param {module:dloc~DLoc} loc Location at which to get possibilities.
 * @param {boolean} [attributes=false] Whether we are interested in
 * the attribute events of the node pointed to by ``container,
 * index``. If ``true`` the node pointed to by ``container, index``
 * must be an element, and the returned set will contain attribute
 * events.
 * @returns {module:validate~EventSet} A set of possible events.
 *
 * @also
 *
 * @param {Node} container Together with ``index`` this parameter is
 * interpreted to form a location as would be specified by a {@link
 * module:dloc~DLoc DLoc} object.
 * @param {integer} index Together with ``container`` this parameter
 * is interpreted to form a location as would be specified by a
 * {@link module:dloc~DLoc DLoc} object.
 * @param {boolean} [attributes=false]
 * @returns {module:validate~EventSet} A set of possible events.
 */
Validator.prototype.possibleAt = function (container, index, attributes) {
    if (container instanceof dloc.DLoc) {
        attributes = index;
        index = container.offset;
        container = container.node;
    }
    var walker = this._getWalkerAt(container, index, attributes);
    // Calling possible does not *modify* the walker.
    return walker.possible();
};


/**
 * Finds the locations in a node where a certain validation event is
 * possible.
 *
 * @param {Node} container A node.
 * @param {module:validate~Event} event The event to search for. The event
 * should be presented in the same format used for ``fireEvent``.
 * @returns {Array.<integer>} The locations in <code>container</code>
 * where the event is possible.
 */
Validator.prototype.possibleWhere = function (container, event) {
    var ret = [];
    for(var index = 0; index <= container.childNodes.length; ++index) {
        var possible = this.possibleAt(container, index);
        if (possible.has(event))
            ret.push(index);
        else if (event.params[0] === "enterStartTag" ||
                 event.params[0] === "attributeName") {
            // In the case where we have a name pattern as the 2nd
            // parameter, and this pattern can be complex or have
            // wildcards, then we have to check all events one by one
            // for a name pattern match. (While enterStartTag, endTag
            // and attributeName all have name patterns, endTag cannot
            // be complex or allow wildcards because what it allows
            // much match the tag that started the current element.
            var as_array = possible.toArray();
            for (var ix = 0, candidate; (candidate = as_array[ix]); ++ix) {
                if (candidate.params[0] === event.params[0] &&
                    candidate.params[1].match(event.params[1],
                                              event.params[2])) {
                    ret.push(index);
                    break;
                }
            }
        }
    }
    return ret;
};



/**
 * Validate a DOM fragment as if it were present at the point
 * specified in the parameters in the DOM tree being validated.
 *
 * WARNING: This method will not catch unclosed elements. This is
 * because the fragment is not considered to be a "complete"
 * document. Unclosed elements or fragments that are not well-formed
 * must be caught by other means.
 *
 * @param {module:dloc~DLoc} loc The location in the tree to start at.
 * @param {Node|Array.<Node>} to_parse The fragment to parse.
 * @returns {Array.<Object>|false} Returns an array of errors if there
 * is an error. Otherwise returns false.
 *
 * @also
 *
 * @param {Node} container The location in the tree to start at.
 * @param {integer} index The location in the tree to start at.
 * @param {Node|Array.<Node>} to_parse The fragment to parse.
 * @returns {Array.<Object>|false} Returns an array of errors if there
 * is an error. Otherwise returns false.
 */
Validator.prototype.speculativelyValidate = function (container, index,
                                                      to_parse) {
    if (!this._initialized)
        throw new Error("uninitialized Validator");

    if (container instanceof dloc.DLoc) {
        to_parse = index;
        index = container.offset;
        container = container.node;
    }

    var clone;
    if (to_parse instanceof Array) {
        clone = container.ownerDocument.createDocumentFragment();
        for(var i = 0, limit = to_parse.length; i < limit; ++i)
            clone.insertBefore(to_parse[i].cloneNode(true), null);
    }
    else
        clone = to_parse.cloneNode(true);

    var root = container.ownerDocument.createElement("div");
    root.insertBefore(clone, null);

    return this.speculativelyValidateFragment(container, index, root);
};

/**
 * Validate a DOM fragment as if it were present at the point
 * specified in the parameters in the DOM tree being validated.
 *
 * WARNING: This method will not catch unclosed elements. This is
 * because the fragment is not considered to be a "complete"
 * document. Unclosed elements or fragments that are not well-formed
 * must be caught by other means.
 *
 * @param {module:dloc~DLoc} loc The location in the tree to start at.
 * @param {Node} to_parse The fragment to parse. This fragment must
 * not be part of the tree that the validator normally validates. (It
 * can be **cloned** from that tree.) This fragment must contain a
 * single top level element which has only one child. This child is
 * the element that will actually be parsed.
 * @returns {Array.<Object>|false} Returns an array of errors if there
 * is an error. Otherwise returns false.
 *
 * @also
 *
 * @param {Node} container The location in the tree to start at.
 * @param {integer} index The location in the tree to start at.
 * @param {Node} to_parse The fragment to parse. See above.
 * @returns {Array.<Object>|false} Returns an array of errors if there
 * is an error. Otherwise returns false.
 */
Validator.prototype.speculativelyValidateFragment = function (container, index,
                                                              to_parse) {
    if (container instanceof dloc.DLoc) {
        to_parse = index;
        index = container.offset;
        container = container.node;
    }

    if (!this._initialized)
        throw new Error("uninitialized Validator");

    if (to_parse.nodeType !== Node.ELEMENT_NODE)
        throw new Error("to_parse is not an element");

    // We create a new validator with the proper state to parse the
    // fragment we've been given.
    var dup = new Validator(this._tree, to_parse);

    // We have to clone the walker to prevent messing up the internal
    // cache.
    dup._validation_walker = this._getWalkerAt(container, index).clone();

    dup._tree = this._tree; // _tree is immutable so we can share.
    dup._initialized = true;

    // This forces validating the whole fragment
    dup._validateUpTo(to_parse, to_parse.childNodes.length);
    if (dup._errors.length)
        return dup._errors;

    return false;
};

/**
 * Obtain the validation errors that belong to a specific node.
 *
 * The term "that belong to" has a specific meaning here:
 *
 * - An error in the contents of an element belongs to the element
 *   whose contents are incorrect. For instance if in the sequence
 *   ``<foo><blip/></foo>`` the tag ``<blip/>`` is out of place, then
 *   the error belongs to the node for the element ``foo``, not the
 *   node for the element ``blip``.
 *
 * - Attribute errors belong to the element node to which the
 *   attributes belong.
 *
 * - Errors produced by {@link module:mode~Mode#validateDocument
 *   validateDocument} can refer to any node of the document. However,
 *   for the purpose of this method, they are not considered to
 *   *belong* to the node passed to the method.
 *
 * @param {Node} node The node whose errors we want to get.
 * @returns {Array.<module:validator~Validator#event:error>} The errors.
 */
Validator.prototype.getErrorsFor = function (node) {
    // Validate to after the closing tag of the node.
    this._validateUpTo(node.parentNode,
                       indexOf(node.parentNode.childNodes, node) + 1);
    var ret = [];
    for(var i = 0, limit = this._errors.length; i < limit; ++i) {
        var error_data = this._errors[i];
        if (error_data.node === node)
            ret.push(error_data);
    }
    return ret;
};

// This private utility function checks whether an event is possible
// only because there is a name_pattern wildcard that allows it.
function isPossibleDueToWildcard(walker, event_name, ns, name) {
    var evs = walker.possible().toArray();
    var matched = false;
    for (var ev_ix = 0, ev; (ev = evs[ev_ix]); ++ev_ix) {
        if (ev.params[0] !== event_name)
            continue;
        var name_pattern = ev.params[1];
        var matches = name_pattern.match(ns, name);

        // Keep track of whether it ever matched anything.
        matched = matched || matches;

        // We already know that it matches, and this is not merely due
        // to a wildcard.
        if (matches && !name_pattern.wildcardMatch(ns, name))
            return false;
    }

    // If it never matched any pattern at all, then we must return
    // false.  If we get here and matched is true then it means that
    // it matched all patterns due to wildcards.
    return matched;
}

/**
 * Sets a flag indicating whether a node is possible only due to a
 * name pattern wildcard, and emits an event if setting the flag is a
 * change from the previous value of the flag. It does this by
 * inspecting the event that would be fired when ``node`` is
 * validated. The parameters ``event_name``, ``ns`` and ``name`` are
 * used to determine what we are looking for among possible events.
 *
 * @param {Node} node The node we want to check.
 * @param {module:validate~Walker} walker A walker whose last fired event
 * is the one just before the event that would be fired when
 * validating ``node``.
 * @param {string} event_name The event name we are interested in.
 * @param {string} ns The namespace to use with the event.
 * @param {string} name The name to use with the event.
 * @emits module:validator~Validator#event:possible-due-to-wildcard-change
 *
 */
Validator.prototype._setPossibleDueToWildcard = function (node, walker,
                                                          event_name,
                                                          ns, name) {
    var previous = node.wed_possible_due_to_wildcard;
    var possible = isPossibleDueToWildcard(walker, event_name, ns, name);
    node.wed_possible_due_to_wildcard = possible;
    if (previous === undefined || previous !== possible) {
        /**
         * Tells the listener that a node's flag indicating whether it
         * is possible only due to a wildcard has changed.
         *
         * @event module:validator~Validator#possible-due-to-wildcard-change
         * @type {Node} The node whose flag has changed.
         */
        this._emit("possible-due-to-wildcard-change", node);
    }
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
//  LocalWords:  prev whitespace boolean jquery util
