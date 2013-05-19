define(function (require, exports, module) {
"use strict";
var validate = require("salve/validate");
var $ = require("jquery");
var util = require("./util");

// parsing_stage values

var START_TAG = 1;
var CONTENTS = 2;
var END_TAG = 3;

// Working state values

var STOPPED = 1;
var WORKING = 2;
var INVALID = 3;
var VALID = 4;

function Parser(schema, resolver, root, state_div, error_list) {
    this.schema = schema;
    this.resolver = resolver;
    
    this.root = root;
    this._timeout = 200;
    this._max_timespan = 100;
    this._timeout_id = undefined;
    this._initialized = false;
    this._errors = [];
    this._tree = undefined;
    this._bound_wrapper = this._workWrapper.bind(this);

    // Parsing state
    this._states = [];
    this._events = [];
    this._parsing_walker = undefined;
    this._working_state = undefined;
    this._part_done = 0;
    this._last_done_shown = 0;
    this._parsing_stage = CONTENTS;

    this.$state_div = $(state_div);
    this.$error_list = $(error_list);

    // So that we can show state...
    if (this.$state_div.length === 0)
        throw new Error("editor must have a #tmp-state div.");


    if (this.$error_list.length === 0)
        throw new Error("editor must have a #sb-errorlist list.");

    this._setWorkingState(STOPPED);

}

(function () {
    this.start = function () {
        if (this._timeout_id !== undefined)
            this.stop();

        if (this._states.length === 0) { // create initial state
            var me = this;
            require(["requirejs/text!" + this.schema], function(x) {
                me._tree = validate.constructTree(x);
                me._states = [new State(0, me.root)];
                me._parsing_walker = me._tree.newWalker();
                me._initialized = true;
                me._timeout_id = window.setTimeout(me._bound_wrapper, me._timeout);
            });
        }
        else
            this._timeout_id = window.setTimeout(this._bound_wrapper, this._timeout);
        this._setWorkingState(WORKING, this._part_done);
    };

    this._workWrapper = function () {
        if (this._work())
            this._timeout_id = window.setTimeout(this._bound_wrapper, this._timeout);
    };

    this._work = function () {
        if (!this._initialized)
            return true;

        var event_result;
        
        var start_date = new Date();
        state_change: 
        while (true) {

            // Give a chance to other operations to work.
            if ((this._max_timespan > 0) && (new Date() - start_date) >= this._max_timespan) {
                // Save what must be saved
                
                return true;
            }

            var current_state = this._states[this._states.length - 1];
            var walker = this._parsing_walker;

            // We copy all the values locally
            var number = current_state.number;
            var element_to_parse = current_state.element_to_parse;
            var previous_child = current_state.previous_child;
            var portion = current_state.portion;

            stage_change:
            while (true) {
                var $element_to_parse = $(element_to_parse);
                switch(this._parsing_stage) {
                case START_TAG:
                    // These are currently not needed:
                    // $element_to_parse.data("wed_state_index_before", this._events.length - 1);
                    // $element_to_parse.data("wed_event_index_before", this._events.length - 1);


                    // Phantoms do not fire events, nor do "_real
                    // _text" elements.
                    if (!$element_to_parse.hasClass("_phantom_wrap") && 
                        !$element_to_parse.is("._real._text")) {
                        // Enter the start tag
                        // The 1st class name is always the name of the tag in the
                        // original XML.
                        var name = element_to_parse.className.split(" ", 1)[0];
                        var ename = this.resolver.resolveName(name);
                        this._fireAndProcessEvent(
                            walker,
                            new validate.Event("enterStartTag", 
                                               ename.ns, 
                                               ename.name), 
                            element_to_parse);

                        // Find all attributes, fire events for
                        // them. We should not get any errors here,
                        // since the user does not get to set these
                        // manually. An error here would indicate an
                        // internal error.
                        var attr_ix_lim = element_to_parse.attributes.length
                        for(var attr_ix = 0; attr_ix < attr_ix_lim; ++attr_ix) {
                            var attr = element_to_parse.attributes[attr_ix];
                            if (attr.name.lastIndexOf("data-wed-", 0) !== 0)
                                continue;
                            var attr_name = util.decodeAttrName(attr.name);
                            var ename = this.resolver.resolveName(attr_name, true);
                            this._fireAndProcessEvent(
                                walker,
                                new validate.Event("attributeName", 
                                                   ename.ns, 
                                                   ename.name), 
                                element_to_parse);
                            this._fireAndProcessEvent(
                                walker,
                                new validate.Event("attributeValue", 
                                                   attr.value), 
                                element_to_parse);
                        }

                        // Leave the start tag.
                        this._fireAndProcessEvent(
                            walker,
                            new validate.Event("leaveStartTag"), 
                            element_to_parse);
                    }
                    
                    var new_state = new State(
                        ++number,
                        element_to_parse,
                        null,
                        current_state.part_done,
                        portion
                    );
                    this._parsing_stage = CONTENTS;
                    this._states.push(new_state);
                    $element_to_parse.data("wed_state_index_after_start", new_state.number);
                    $element_to_parse.data("wed_event_index_after_start", this._events.length - 1);
                    continue state_change;
                    // break would be unreachable.
                case CONTENTS:
                    var node = (previous_child === null)  ? 
                        // starting from scratch
                        element_to_parse.firstChild : 
                        // already parsing contents
                        previous_child.nextSibling;

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
                            if (!$(node).hasClass("_phantom") && 
                                !$(node).hasClass("_placeholder")) {
                                portion /= $element_to_parse.children().length;
                                element_to_parse = node;
                                this._parsing_stage = START_TAG;
                                previous_child = null;
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
                    if (element_to_parse === this.root) {
                        event_result = walker.end();
                        if (event_result !== true)
                            this.processTagEventResult(event_result, element_to_parse);
                        this.stop();
                        return false;
                    }

                    var original_element = element_to_parse; // we need it later
                    // Phantoms do not generate events, nor do "_real
                    // _text" elements.
                    if (!$element_to_parse.hasClass("_phantom_wrap") && 
                        !$element_to_parse.is("._real._text")) {
                        // The 1st class name is always the name of the tag in the
                        // original XML.
                        var name = element_to_parse.className.split(" ", 1)[0];
                        var ename = this.resolver.resolveName(name);
                        this._fireAndProcessEvent(
                            walker, 
                            new validate.Event("endTag", 
                                               ename.ns, 
                                               ename.name));
                    }

                    previous_child = element_to_parse;
                    element_to_parse = element_to_parse.parentNode;
                    
                    if (element_to_parse !== this.root) {
                        var after_start_state = 
                            this._states[$(element_to_parse).data("wed_state_index_after_start")];

                        this._part_done = after_start_state.part_done += portion;
                        portion = after_start_state.portion;
                    }

                    this._setWorkingState(WORKING, this._part_done);

                    // We save the state after having processed the
                    // closing tag.
                    var new_state = new State(
                        ++number,
                        element_to_parse,
                        previous_child,
                        this._part_done,
                        portion);
                    this._states.push(new_state);
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
        this._setWorkingState(this._errors.length > 0 ? INVALID : VALID);
    };

    this.restartAt = function (element) {
        if (this._states.length > 0) {
            var $elements = $();
            this._states.forEach(function (state) {
                $elements.add(state.element_to_parse);
            });
            $elements.removeData(
                ["wed_state_index_after_start", "wed_event_index_after", 
                 "wed_event_index_after_start"]);
            this._states = [new State(0, this.root)];
            this._parsing_stage = CONTENTS;
            this._parsing_walker = this._tree.newWalker();
            this._events = [];
            this._part_done = 0;
            this._last_done_shown = 0;
        }
        this.start();
    };

    var state_to_str = {};
    state_to_str[STOPPED] = "stopped";
    state_to_str[WORKING] = "working";
    state_to_str[INVALID] = "invalid";
    state_to_str[VALID] = "valid";

    this._setWorkingState = function (new_state) {
        if (this._working_state !== new_state || new_state === WORKING) {
            this._working_state = new_state;
            
            var message = state_to_str[new_state];
            if (new_state === WORKING) {

                // Do not show changes less than 5%
                if (this._part_done - this._last_done_shown < 0.05)
                    return;

                message += " " + ((this._part_done * 100) >> 0) + "%";
                this._last_done_shown = this._part_done;
            }
            
            this.$state_div.text(message);
        }
    };

    this.processTagEventResult = function (result, element) {
        this._errors.push(result);

        if (element.id === "")
            element.id = util.newGenericID();
        
        var $item = $("<li><a href='#" + element.id + "'>" + result + "</li>");
        this.$error_list.append($item);
    };
 
    this._fireAndProcessEvent = function (walker, event, element_to_parse) {
        this._events.push(event);
        var event_result = walker.fireEvent(event);
        if (event_result !== true)
            this.processTagEventResult(event_result, element_to_parse);
        
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
        if (container === this.root)
            // empty document
            return this._tree.newWalker().possible();

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
                 }).length > 0) {
                if (fireTextEventIfNeeded(container, walker) === true)
                    evs = walker.possible();
            }
            else
                evs = walker.possible();
            break;
        case Node.ELEMENT_NODE:
            var node = container.childNodes[index];

            var $prev = $(node).prev("._real, ._phantom_wrap");

            var event_index = 
                ($prev.length > 0) ? $prev.data("wed_event_index_after") :
                $(container).data("wed_event_index_after_start");
            
            var walker = this._tree.newWalker();
            for(var ix = 0; ix <= event_index; ++ix) {
                walker.fireEvent(this._events[ix]);
            }

            // We have will attempt to fire a text event if another
            // text node appeared between this text node and the
            // previous element found.
            if ($prev.nextUntil(container).filter(function (x) {
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

The parser stores a start state and end state with each element of
interest that it encounters:

* The start state is the state just *after* the start tag of this
  element is parsed but *before* any children are parsed.

* The end state is the state just *after* the end tag of this element is
  parsed.

Phantoms also get state information so that later we do not have to
worry about phantom elements when seeking state information.

Starting from the begnning of the DOM tree, each recorded state has a
state number starting with 0. When an element is edited all states
that have a number greater than its start state are declared invalid
(purged).

*/

function State(number, element_to_parse, previous_child, part_done, portion) {
    this.number = number;
    this.element_to_parse = element_to_parse;
    this.previous_child = (previous_child !== undefined && 
                           previous_child !== null) ? previous_child : null;

    // This is the part of the document done before we started
    // processing the element_to_parse.
    this.part_done = (part_done !== undefined) ? part_done: 0;
    // The "parental portion" is the portion of the document that the
    // parent represents.
    this.portion = (portion !== undefined) ? portion : 1;
    if ((this.element_to_parse === null) || (this.element_to_parse === undefined))
        throw new Error(this.element_to_parse);
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
