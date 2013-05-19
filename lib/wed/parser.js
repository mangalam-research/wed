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
    this._last_done_shown = 0;
    this._parsing_stage = CONTENTS;
    this._previous_child = null;
    this._parsing_stack = [new ParsingState(0, 1)];
    this._element_to_parse = null;

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
                    // _text" elements.
                    if (!$element_to_parse.hasClass("_phantom_wrap") && 
                        !$element_to_parse.is("._real._text")) {
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
                            if (!$(node).hasClass("_phantom") && 
                                !$(node).hasClass("_placeholder")) {
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
                            this.processTagEventResult(event_result, this._element_to_parse);
                        this.stop();
                        return false;
                    }

                    var original_element = this._element_to_parse; // we need it later
                    // Phantoms do not generate events, nor do "_real
                    // _text" elements.
                    if (!$element_to_parse.hasClass("_phantom_wrap") && 
                        !$element_to_parse.is("._real._text")) {
                        // The 1st class name is always the name of the tag in the
                        // original XML.
                        var name = this._element_to_parse.className.split(" ", 1)[0];
                        var ename = this.resolver.resolveName(name);
                        this._fireAndProcessEvent(
                            walker, 
                            new validate.Event("endTag", 
                                               ename.ns, 
                                               ename.name));
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
        this._setWorkingState(this._errors.length > 0 ? INVALID : VALID);
    };

    this.restartAt = function (element) {
        if (this._initialized) {
            $(this.root).findAndSelf("*").removeData(
                ["wed_event_index_after", "wed_event_index_after_start"]);
            this._parsing_stage = CONTENTS;
            this._previous_child = null;
            this._parsing_walker = this._tree.newWalker();
            this._events = [];
            this._element_to_parse = this.root;
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
