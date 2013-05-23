define(function (require, exports, module) {
"use strict";

var SimpleEventEmitter = require("./lib/simple_event_emitter").SimpleEventEmitter;
var validate = require("salve/validate");
var $ = require("jquery");
var util = require("./util");
var oop = require("./oop");

// parsing_stage values

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

function Parser(schema, resolver, root) {
    // Call the constructor for our mixin
    SimpleEventEmitter.call(this);

    this.schema = schema;
    this.resolver = resolver;
    
    this.root = root;
    this._timeout = 200;
    // _max_cycles is meant to be used only in testing.
    this._max_cycles = 0;
    this._max_timespan = 100;
    this._timeout_id = undefined;
    this._initialized = false;
    this._errors = [];
    this._tree = undefined;
    this._bound_wrapper = this._workWrapper.bind(this);

    // Parsing state
    this._events = [];
    this._parsing_walker = undefined;
    this._working_state = undefined;
    this._part_done = 0;
    this._parsing_stage = CONTENTS;
    this._previous_child = null;
    this._parsing_stack = [new ParsingState(0, 1)];
    this._element_to_parse = null;

    this._setWorkingState(INCOMPLETE);

}

oop.implement(Parser, SimpleEventEmitter);

(function () {
    this.start = function () {
        if (this._timeout_id !== undefined)
            this.stop();

        if (!this._initialized)
            this._initialize(function () {
                this._timeout_id = window.setTimeout(this._bound_wrapper, this._timeout);
            }.bind(this));
        else
            this._timeout_id = window.setTimeout(this._bound_wrapper, this._timeout);
        this._setWorkingState(WORKING, this._part_done);
    };

    this._initialize = function (done) {
        require(["requirejs/text!" + this.schema], function(x) {
            this._tree = validate.constructTree(x);
            this._parsing_walker = this._tree.newWalker();
            this._element_to_parse = this.root;
            this._initialized = true;
            done();
        }.bind(this));
    };

    this._workWrapper = function () {
        this._restarting = false;
        if (this._work())
            this._timeout_id = window.setTimeout(this._bound_wrapper, this._timeout);
    };

    this._work = function () {
        if (!this._initialized)
            return true;

        var event_result;
        
        var start_date = new Date();
        var cycles = 0;
        state_change: 
        while (true) {

            if ((this._max_cycles > 0) && cycles >= this._max_cycles)
                return true;

            cycles++;

            // Give a chance to other operations to work.
            if ((this._max_timespan > 0) && (new Date() - start_date) >= this._max_timespan)
                return true;

            var walker = this._parsing_walker;

            var portion = this._parsing_stack[0].portion;

            stage_change:
            while (true) {
                var $element_to_parse = $(this._element_to_parse);
                switch(this._parsing_stage) {
                case START_TAG:
                    // These are currently not needed:
                    // $element_to_parse.data("wed_state_index_before", this._events.length - 1);
                    // $element_to_parse.data("wed_event_index_before", this._events.length - 1);


                    // Phantoms do not fire events, nor do "_real
                    // _text" elements, nor do placeholders
                    if (!$element_to_parse.hasClass("_phantom_wrap") && 
                        !$element_to_parse.is("._real._text, ._placeholder")) {
                        // Enter the start tag
                        // The 1st class name is always the name of the tag in the
                        // original XML.
                        var name = this._element_to_parse.className.split(" ", 1)[0];
                        var ename = this.resolver.resolveName(name);
                        this._fireAndProcessEvent(
                            walker,
                            new validate.Event("enterStartTag", 
                                               ename.ns, 
                                               ename.name), 
                            this._element_to_parse);

                        // Find all attributes, fire events for
                        // them. We should not get any errors here,
                        // since the user does not get to set these
                        // manually. An error here would indicate an
                        // internal error.
                        var attr_ix_lim = this._element_to_parse.attributes.length
                        for(var attr_ix = 0; attr_ix < attr_ix_lim; ++attr_ix) {
                            var attr = this._element_to_parse.attributes[attr_ix];
                            if (attr.name.lastIndexOf("data-wed-", 0) !== 0)
                                continue;
                            var attr_name = util.decodeAttrName(attr.name);
                            var ename = this.resolver.resolveName(attr_name, true);
                            this._fireAndProcessEvent(
                                walker,
                                new validate.Event("attributeName", 
                                                   ename.ns, 
                                                   ename.name), 
                                this._element_to_parse);
                            this._fireAndProcessEvent(
                                walker,
                                new validate.Event("attributeValue", 
                                                   attr.value), 
                                this._element_to_parse);
                        }

                        // Leave the start tag.
                        this._fireAndProcessEvent(
                            walker,
                            new validate.Event("leaveStartTag"), 
                            this._element_to_parse);
                    }
                    
                    this._parsing_stage = CONTENTS;
                    $element_to_parse.data("wed_event_index_after_start", this._events.length - 1);
                    continue state_change;
                    // break would be unreachable.
                case CONTENTS:
                    var node = (this._previous_child === null)  ? 
                        // starting from scratch
                        this._element_to_parse.firstChild : 
                        // already parsing contents
                        this._previous_child.nextSibling;

                    while (node !== null) { 
                        switch(node.nodeType) {
                        case Node.TEXT_NODE:
                            // We want to fire an event only if the
                            // text node is not just white space or if
                            // text is possible.
                            event_result = this._fireTextEventIfNeeded(node, walker);
                            if (event_result !== true) 
                                // XXX
                                console.log("XXX text error");
                            break;
                        case Node.ELEMENT_NODE:
                            if (!$(node).hasClass("_phantom")) {
                                portion /= $element_to_parse.children().length;
                                this._parsing_stack.unshift(new ParsingState(this._part_done, portion));
                                this._element_to_parse = node;
                                this._parsing_stage = START_TAG;
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
                        this._parsing_stage = END_TAG;
                    break;
                case END_TAG:
                    // We've reached the end...
                    if (this._element_to_parse === this.root) {
                        event_result = walker.end();
                        if (event_result !== true)
                            this._processTagEventResult(event_result, this._element_to_parse);
                        this._part_done = 1;
                        this._setWorkingState(this._errors.length > 0 ? INVALID : VALID);
                        this.stop();
                        return false;
                    }

                    var original_element = this._element_to_parse; // we need it later
                    // Phantoms do not generate events, nor do "_real
                    // _text" elements.
                    if (!$element_to_parse.hasClass("_phantom_wrap") && 
                        !$element_to_parse.is("._real._text, ._placeholder")) {
                        // The 1st class name is always the name of the tag in the
                        // original XML.
                        var name = this._element_to_parse.className.split(" ", 1)[0];
                        var ename = this.resolver.resolveName(name);
                        this._fireAndProcessEvent(
                            walker, 
                            new validate.Event("endTag", 
                                               ename.ns, 
                                               ename.name),
                            this._element_to_parse);
                    }

                    // Go back to the parent
                    this._previous_child = this._element_to_parse;
                    this._element_to_parse = this._element_to_parse.parentNode;
                    
                    if (this._element_to_parse !== this.root) {
                        this._parsing_stack.shift();
                        this._part_done = this._parsing_stack[0].part_done += portion;
                        portion = this._parsing_stack[0].portion;
                    }

                    this._setWorkingState(WORKING, this._part_done);

                    $(original_element).data("wed_event_index_after", 
                                             this._events.length - 1);
                    this._parsing_stage = CONTENTS;
                    continue state_change;
                    
                    // break; would be unreachable
                default:
                    throw new Error("unexpected state");
                }
            }
        }
        return true;
    };
    
    this.stop = function () {
        if (this._timeout_id !== undefined) 
            window.clearTimeout(this._timeout_id);
        this._timeout_id = undefined;

        // We are stopping prematurely, update the state
        if (this._working_state === WORKING)
            this._setWorkingState(INCOMPLETE);
    };

    this.restartAt = function (element) {
        if (this._working_state === WORKING) 
            this.stop();
        if (this._initialized && !this._restarting) {
            this._restarting = true;
            $(this.root).findAndSelf("*").removeData(
                ["wed_event_index_after", "wed_event_index_after_start"]);
            this._parsing_stage = CONTENTS;
            this._previous_child = null;
            this._parsing_walker = this._tree.newWalker();
            this._events = [];
            this._element_to_parse = this.root;
            this._part_done = 0;
            this._errors = [];
            this._emit("reset-errors", { at: 0 });
        }
        this.start();
    };

    this._setWorkingState = function (new_state) {
        if (this._working_state !== new_state || new_state === WORKING) {
            this._working_state = new_state;
            this._emit("state-update");
        }
    };

    this.getWorkingState = function () {
        return {
            state: this._working_state,
            part_done: this._part_done
        };
    };

    this._processTagEventResult = function (result, element) {
        this._errors.push(result);
        this._emit("error", { error: result, 
                              element: element});
    };
 
    this._fireAndProcessEvent = function (walker, event, element_to_parse) {
        this._events.push(event);
        var event_result = walker.fireEvent(event);
        if (event_result !== true)
            this._processTagEventResult(event_result, element_to_parse);
        
    };

    this._fireTextEventIfNeeded = function (text_node, walker) {
        if (($.trim(text_node.nodeValue).length > 0) ||
            (walker.possible().filter(function (x) {
                return x[0] === 'text';
            }).length > 0)) {
            var event = new validate.Event("text");
            this._events.push(event);
            return walker.fireEvent(event);
        }
        
        // Behave the same as when an event has been fired without error.
        return true;
    };

    // The meaning of container and index is the same as for selection
    // ranges.
    this.possibleAt = function (container, index) {

        // This function could be called with container === root if
        // the document is empty or if the user has the caret before
        // the start tag of the first element of the actual structure
        // we want to parse or after the end tag of that element.

        if (container === this.root) {
            var walker = this._tree.newWalker();

            // We're before the top element, no events to fire.
            if (index === 0) 
                return walker.possible();

            // We're past the top element, fire all events.
            for(var ix= 0; ix < this._events.length; ++ix)
                walker.fireEvent(this._events[ix]);
            return walker.possible();
        }

        var evs = [];
        switch(container.nodeType) {
        case Node.TEXT_NODE:
            var $prev = $(container).prev("._real, ._phantom_wrap");

            var event_index = 
                ($prev.length > 0) ? $prev.data("wed_event_index_after") :
                $(container.parentNode).data("wed_event_index_after_start");

            var walker = this._tree.newWalker();
            for(var ix = 0; ix <= event_index; ++ix) {
                walker.fireEvent(this._events[ix]);
            }

            // We have will attempt to fire a text event either if our
            // location is inside the current text node or if another
            // text node appeared between this text node and the
            // previous element found.
            if (index > 0 || 
                 $prev.nextUntil(container).filter(function (x) {
                return this.nodeType === Node.TEXT_NODE || 
                    $(this).hasClass("_text");
                 }).length > 0)
                fireTextEventIfNeeded(container, walker);

            evs = walker.possible();
            break;
        case Node.ELEMENT_NODE:
            var node = container.childNodes[index];

            var $prev = (node === undefined) ? 
                $(container).children("._real, ._phantom_wrap").last() : 
                $(node).prev("._real, ._phantom_wrap");

            var event_index = 
                ($prev.length > 0) ? $prev.data("wed_event_index_after") :
                $(container).data("wed_event_index_after_start");
            
            var walker = this._tree.newWalker();
            for(var ix = 0; ix <= event_index; ++ix) {
                walker.fireEvent(this._events[ix]);
            }

            // We will attempt to fire a text event if another
            // text node appeared between this text node and the
            // previous element found.
            if (((node === undefined) ? $prev.nextAll() : $prev.nextUntil(node)).filter(function (x) {
                return this.nodeType === Node.TEXT_NODE || 
                    $(this).hasClass("_text");
                 }).length > 0) {
                if (fireTextEventIfNeeded(container, walker) === true)
                    evs = walker.possible();
            }
            else
                evs = walker.possible();
            break;
        default:
            throw new Error("unexpected node type: " + container.nodeType);
        }

        return evs;
    };
}).call(Parser.prototype);

//
// Private helper functions and classes
//

/*

Elements of interest are those which are of the "_real" class Text
nodes are of interest. Nothing else is of interest.

*/

function ParsingState(part_done, portion) {
    this.part_done = part_done;
    this.portion = portion;
}


function fireTextEventIfNeeded(text_node, walker) {
    if (($.trim(text_node.nodeValue).length > 0) ||
        (walker.possible().filter(function (x) {
            return x[0] === 'text';
        }).length > 0)) {
        
        return walker.fireEvent(new validate.Event("text"));
    }
    
    // Behave the same as when an event has been fired without error.
    return true;
}



// Exports

exports.Parser = Parser;

});
