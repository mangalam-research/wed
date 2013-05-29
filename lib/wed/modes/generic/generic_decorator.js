define(function (require, exports, module) {
'use strict';

var Decorator = require("wed/decorator").Decorator;
var oop = require("wed/oop");
var $ = require("jquery");
var util = require("wed/util");

function GenericDecorator(domlistener, editor) {
    Decorator.apply(this, arguments);
    domlistener.addHandler("included-element",
                           util.classFromOriginalName("*"),
                           function ($root, el) {
                               this.elementDecorator(
                                   $root, el,
                                   util.eventHandler(this._contextMenuHandler.bind(this)));
                           }.bind(this));
}

oop.inherit(GenericDecorator, Decorator);

(function () {
    this._contextMenuHandler = function (ev, jQthis) {
        // Dismiss any old stuff.
        this._editor.dismissMenu();
        var $dropdown = $("<div class='dropdown'>");
        var $menu = $("<ul class='dropdown-menu' role='menu'>");
        var node = $(jQthis).parents('._real').first().get(0);
        if (node.parentNode !== this._editor.root) {
            var orig = util.getOriginalName(node);
            var trs = this._editor.tr.getTagTransformations("unwrap", orig);
            if (trs !== undefined) {
                trs.forEach(function (tr) {
                    var $a = $("<a tabindex='-1' href='#'>" + 
                               tr.getDescriptionFor(orig) + "</a>");
                    $a.click({'tr': tr, 'node': node, 
                              'element_name': orig }, 
                             this._editor._fireTransformation.bind(this._editor));
                    $menu.append($("<li>").append($a));
                }.bind(this));
            }

            // There's no menu to display, so let the event bubble up.
            if ($menu.children().length === 0)
                return true;

            $menu.css("overflow-y", "auto");
            $dropdown.css("top", ev.pageY);
            $dropdown.css("left", ev.pageX);
            $dropdown.css("max-height", window.innerHeight - 
                          (ev.pageY - $(window).scrollTop()));

            $dropdown.append($menu);

            $(this._editor.menu_layer).prepend($dropdown);
            $menu.dropdown('toggle');
            $menu.on('keydown', util.eventHandler(this._editor._menuHandler.bind(this._editor)));
            $menu.find('a').on(
                'keydown', 
                util.eventHandler(this._editor._menuItemHandler.bind(this._editor)));
            this._editor.pushSelection();
            $menu.find('a').first().focus();
            return false;
        }
    };
}).call(GenericDecorator.prototype);

exports.GenericDecorator = GenericDecorator;

});
