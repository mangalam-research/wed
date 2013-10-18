/**
 * @module gui/modal
 * @desc Modal dialog boxes.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:gui/modal */ function (require, exports, module) {
'use strict';

var $ = require("jquery");
var util = require("../util");
var log = require("../log");
require("bootstrap");

/**
 * @classdesc <p>A modal needs to be created only once per instance of wed. After
 * creation it must be installed into the DOM tree of the page on
 * which it is going to be used. The method {@link
 * module:gui/modal~Modal#getTopLevel getTopLevel} must be used to get the top
 * level DOM element of the modal which will be inserted into the
 * page. Once inserted, the modal is ready to be used once, twice, or
 * more times. It need not be removed, re-created, etc. The method
 * {@link module:gui/modal~Modal#modal modal} just needs to be called
 * each time the modal must be displayed.</p>
 *
 * <p>A typical usage scenario would be:</p>
 *
 * <pre>
 *   // Modal setup.
 *   mymodal = new Modal();
 *   mymodal.setTitle("My modal");
 *   mymodal.setBody(...);
 *   mymodal.addYesNo();
 *   // This is a generic example of how to add the modal to a page.
 *   // See {@link module:wed wed} for how to do it for wed.
 *   $("body").append(mymodal.getTopLevel());
 *
 *   ...
 *
 *   // Modal use
 *   mymodal.modal(function () {...});
 *   switch(mymodal.getClickedAsText()) {...}
 *
 *   ...
 *
 *   // A second use of the same modal
 *   mymodal.modal(function () {...});
 *   switch(mymodal.getClickedAsText()) {...}
 * </pre>
 *
 * <p>If the same modal must be displayed on two different pages, then
 * two Modal objects should be created, one per page.</p>
 *
 * @constructor
 */
function Modal() {
    // tabindex needed to make keyboard stuff work... grumble...
    // https://github.com/twitter/bootstrap/issues/4663
    this._$dom = $(
       '\
<div class="modal" style="position: absolute" tabindex="1">\
  <div class="modal-dialog">\
    <div class="modal-content">\
      <div class="modal-header">\
        <button type="button" class="close" data-dismiss="modal" \
         aria-hidden="true">&times;</button>\
        <h3>Untitled</h3>\
      </div>\
      <div class="modal-body">\
        <p>No body.</p>\
      </div>\
      <div class="modal-footer">\
      </div>\
    </div>\
  </div>\
</div>');
    this._$header = this._$dom.find(".modal-header");
    this._$body = this._$dom.find(".modal-body");
    this._$footer = this._$dom.find(".modal-footer");
    this._$dom.on('click', '.btn', log.wrap(function (ev) {
        this._$clicked = $(ev.currentTarget);
        return true;
    }.bind(this)));

    this._$dom.on('shown.bs.modal.modal',
                  log.wrap(this._handleShown.bind(this)));

    this._$clicked = undefined;
}

/**
 * @returns {jQuery} The top level node of the modal, to be inserted
 * into a page.
 */
Modal.prototype.getTopLevel = function () {
    return this._$dom;
};

/**
 * @param title Can be anything <code>jQuery(x)</code>
 * accepts.
 */
Modal.prototype.setTitle = function (title) {
    this._$header.find("h3").remove();
    var $h3 = $("<h3>");
    $h3.append(title);
    this._$header.append($h3);
};

/**
 * @param body Can be anything <code>jQuery(x)</code> accepts.
 */
Modal.prototype.setBody = function (body) {
    this._$body.empty();
    this._$body.append(body);
};

/**
 * @param footer Can be anything <code>jQuery(x)</code> accepts.
 */
Modal.prototype.setFooter = function (footer) {
    this._$footer.empty();
    this._$footer.append(footer);
};

/**
 * @param name Can be anything <code>jQuery(x)</code> accepts,
 * minimally a string but could be a more complex html structure.
 * @param {Boolean} is_primary True if the button is primary. A modal
 * takes only one primary button but no check is made by this method
 * to prevent it. The primary button is the one clicked if the user
 * hits enter.
 * @returns {jQuery} The jQuery object for the button.
 */
Modal.prototype.addButton = function (name, is_primary) {
    var $button = $('<a href="#" class="btn" data-dismiss="modal">' +
                    name + '</a>');
    $button.addClass(is_primary ? "btn-primary": "btn-default");
    this._$footer.append($button);
    return $button;
};

/**
 * Adds one Ok and one Cancel button.
 *
 * @returns {Array.<jQuery>} The two buttons added.
 */
Modal.prototype.addOkCancel = function () {
    return [this.addButton("Ok", true),
            this.addButton("Cancel")];
};

/**
 * Adds one Yes and one No button.
 *
 * @returns {Array.<jQuery>} The two buttons added.
 */
Modal.prototype.addYesNo = function () {
    return [this.addButton("Yes", true),
            this.addButton("No")];
};

/**
 * Returns the primary button.
 *
 * @returns {jQuery} The primary button.
 */
Modal.prototype.getPrimary = function () {
    return this._$footer.find(".btn-primary");
};

/**
 * @param {Function} callback A callback to call when the modal is
 * dismissed by the user. This modal would typically inspect the modal
 * to determine what the user did, and potentially clean up after
 * itself. The callback is left out if the modal is merely for
 * informational purposes.
 */
Modal.prototype.modal = function (callback) {
    this._$clicked = undefined;
    if (callback)
        this._$dom.one("hidden.bs.modal.modal", log.wrap(callback));
    this._$dom.modal();
};

/**
 * @returns {jQuery} The button that was clicked. Could be undefined
 * if the modal disappeared without being normally dismissed or if the
 * modal has not been used yet.
 */
Modal.prototype.getClicked = function () {
    return this._$clicked;
};

/**
 * @returns {String} The text of the button that was clicked. Could be
 * undefined if the modal disappeared without being normally dismissed
 * or if the modal has not been used yet.
 */
Modal.prototype.getClickedAsText = function () {
    if (this._$clicked === undefined)
        return undefined;

    return this._$clicked.text();
};

/**
 * TBA
 * @private
 * @param {TBA} ev TBA
*/
Modal.prototype._handleShown = function (ev) {
    var height = this._$dom.parent().height();
    this._$body.css("max-height", height - this._$header.height() -
                    this._$footer.height());
};

exports.Modal = Modal;

});

//  LocalWords:  getTopLevel util tabindex btn param jQuery bs jshint
//  LocalWords:  validthis href html jquery pre mymodal setTitle
//  LocalWords:  setBody addYesNo getClickedAsText

//  LocalWords:  domutil jquery util whitespace pathToNode nodeToPath
//  LocalWords:  contenteditable abcd abfoocd cd insertIntoText lt
//  LocalWords:  Prepend deleteText jQuery getSelectionRange prev
//  LocalWords:  lastChild makeCutFunction deleteNode mergeTextNodes
//  LocalWords:  jshint validthis insertNodeAt insertFragAt versa

//  LocalWords:  domlistener jquery findandself lt ul li nextSibling
//  LocalWords:  MutationObserver previousSibling jQuery LocalWords
// LocalWords:  Dubeau MPL Mangalam jquery validator util domutil oop
// LocalWords:  domlistener wundo jqutil gui onerror mixins html DOM
// LocalWords:  jQuery href sb nav ul li navlist errorlist namespaces
// LocalWords:  contenteditable Ok Ctrl listDecorator tabindex nbsp
// LocalWords:  unclick enterStartTag unlinks startContainer dropdown
// LocalWords:  startOffset endContainer endOffset mousedown
