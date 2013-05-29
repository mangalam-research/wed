define(function (require, exports, module) {
'use strict';

var util = require("./util");
var $ = require("jquery");

function Decorator(domlistener, editor) {
    this._domlistener = domlistener;
    this._editor = editor;
}

exports.Decorator = Decorator;

(function () {
    this.init = function ($root) {
        this._domlistener.addHandler("added-element",
                                     "._real, ._phantom, ._phantom_wrap",
                                     this.contentEditableHandler.bind(this));

        this._domlistener.addHandler("children-changed",
                                     "._real, ._phantom_wrap",
                                     this.childrenChangedHandler.bind(this));
                                     

        var $contents = $root.contents();
        $root.empty();
        this._domlistener.startListening();
        $root.append($contents);
    };

    /**
     * This function adds a separator between each child element of the
     * element passed as <code>el</code>. The function only considers
     * _real elements.
     *
     */
    this.listDecorator = function (el, sep) {
    // We expect to work with a homogeneous list. That is, all
        // children the same element.
        var name_map = {};
        $(el).children('._real').each(function () {
            name_map[util.getOriginalName(this)] = 1;
        });
        
        var tags = Object.keys(name_map);
        if (tags.length > 1)
            throw new Error("calling listDecorator on a non-homogeneous list.");
        
        if (tags.length === 0)
            return; // Nothing to work with
        
        // First drop all children that are separators
        $(el).children('[data-wed--separator-for]').remove();
        
        var tag_name = tags[0];
        
        // If sep is a string, create an appropriate div.
        if (typeof sep === "string") 
            sep = $('<div class="_text">' + sep + "</div>");
        
        $(sep).addClass('_phantom');
        $(sep).attr('data-wed--separator-for', tag_name);
        
        var first = true;
        $(el).children('._real').each(function () {
            if (!first) 
                $(this).before(sep.clone());
            else
                first = false;
        });
    };

    this.addRemListElementHandler = function (sep, $root, $parent, $previous_sibling, $next_sibling, $element) {
        this.listDecorator($parent, sep);
    };

    this.includeListHandler = function (sep, $root, $element) {
        this.listDecorator($element, sep);
    };

    this.contentEditableHandler = function ($root, $parent, $previous_sibling, $next_sibling, $element) { 
        $element.findAndSelf('._phantom').attr("contenteditable", "false");
        $element.findAndSelf('._phantom_wrap').attr("contenteditable", "false");
        $element.findAndSelf('._real').attr("contenteditable", "true");
    };

    this.elementDecorator = function ($root, el, pre_context_handler, post_context_handler) {
        var $el = $(el);
        el = $el.get(0);
        var orig_name = util.getOriginalName(el);
        // _[name]_label is used locally to make the function idempotent.
        var cls = "_" + util.escapeCSSClass(orig_name) + "_label";
        $(el).children().remove("." + cls);
        var $pre = $('<span class="_gui _phantom _start_button ' + cls + ' _button label label-info">' + orig_name + '<i class="icon-chevron-right"></i></span>');
        $(el).prepend($pre);
        var $post = $('<span class="_gui _phantom _end_button ' + cls + ' _button label label-info"><i class="icon-chevron-left"></i>' + orig_name + '</span>');
        $(el).append($post);
        
        // Setup a handler so that clicking one label highlights it and
        // the other label.
        var data = {'$root': $root, '$pre': $pre, '$post': $post};
        $pre.click(data, elementButtonHandler);
        $post.click(data, elementButtonHandler);

        if (pre_context_handler !== undefined)
            $pre.on('contextmenu', pre_context_handler);
        else
            $pre.on('contextmenu', false);

        if (post_context_handler !== undefined)
            $post.on('contextmenu', post_context_handler);
        else
            $post.on('contextmenu', false);
    };

    this.childrenChangedHandler = function ($root, $added, 
                                            $removed, $target) {
        if ($added.length > 0)
            $target.remove("._placeholder");
    };

}).call(Decorator.prototype);

function elementButtonHandler(ev) {
    var data = ev.data;
    var $root = data.$root;
    $root.find('.label-warning').removeClass("label-warning").addClass("label-info");
    data.$pre.removeClass("label-info").addClass("label-warning");
    data.$post.removeClass("label-info").addClass("label-warning");
}


});
