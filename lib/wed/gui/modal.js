/**
 * @module gui/modal
 * @desc Modal dialog boxes.
 * @author Louis-Dominique Dubeau
 */
define(/** @lends module:gui/modal */ function (require, exports, module) {
'use strict';

var $ = require("jquery");

function Modal() {
    // tabindex needed to make keyboard stuff work... grumble...
    // https://github.com/twitter/bootstrap/issues/4663
    this._$dom = $(
        '\
<div class="modal hide fade" tabindex="1">\
  <div class="modal-header">\
    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
    <h3>Untitled</h3>\
  </div>\
  <div class="modal-body">\
    <p>No body.</p>\
  </div>\
  <div class="modal-footer">\
    <p>No footer.</p>\
  </div>\
</div>');
    this._$header = this._$dom.find(".modal-header");
    this._$body = this._$dom.find(".modal-body");
    this._$footer = this._$dom.find(".modal-footer");
}

Modal.prototype.getDOM = function () {
    return this._$dom;
};

Modal.prototype.setTitle = function (title) {
    this._$header.find("h3").remove();
    var $h3 = $("<h3>");
    $h3.append(title);
    this._$header.append($h3);
};

Modal.prototype.setBody = function (body) {
    this._$body.empty();
    this._$body.append(body);
};

Modal.prototype.setFooter = function (footer) {
    this._$footer.empty();
    this._$footer.append(footer);
};

Modal.prototype.setToOkCancel = function () {
    this.setFooter(
        '<a href="#" class="btn btn-primary" data-dismiss="modal">Ok</a>\
         <a href="#" class="btn" data-dismiss="modal">Cancel</a>');
};

Modal.prototype.setToYesNo = function () {
    this.setFooter(
        '<a href="#" class="btn btn-primary" data-dismiss="modal">Yes</a>\
         <a href="#" class="btn" data-dismiss="modal">No</a>');
};

Modal.prototype.modal = function () {
    this._$dom.modal();
};



exports.Modal = Modal;

});
