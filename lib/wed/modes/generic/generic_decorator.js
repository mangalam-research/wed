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
        var node = $(jQthis).parents('._real').first().get(0);
        var menu_items = [];
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
                    menu_items.push($("<li>").append($a).get(0));
                }.bind(this));
            }

            // There's no menu to display, so let the event bubble up.
            if (menu_items === 0)
                return true;

            this._editor.displayContextMenu(pos.pageX, pos.pageY, 
                                            menu_items);
            return false;
        }
    };
}).call(GenericDecorator.prototype);

exports.GenericDecorator = GenericDecorator;

});
