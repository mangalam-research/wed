define(["require", "exports", "module", "interact", "jquery", "../browsers", "bootstrap"], function (require, exports, module, interact, $, browsers) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This records changes in such a way that if any of the changes cannot take
     * effect, then all the changes are "rolled back". It is called pseudo-atomic
     * because it is not really meant to track any changes that do not happen
     * through instances of this class. This is needed because we are changing the
     * size of multiple elements, and beyond a certain "smallness", some elements
     * won't register any change in dimensions (perhaps due to "min-..." styles.
     */
    var PseudoAtomicRectChange = (function () {
        function PseudoAtomicRectChange() {
            this.changes = [];
            this.rolledback = false;
        }
        PseudoAtomicRectChange.prototype.updateElementRect = function (el, dx, dy) {
            // If we've already rolled back, we don't do anything.
            if (this.rolledback) {
                return;
            }
            var rect = el.getBoundingClientRect();
            // This works around a fractional pixel issue in IE. We set the element to
            // the dimensions returned by getBoundingClientRect and then reacquire the
            // dimensions to account for any funny adjustments IE may decide to do.
            if (browsers.MSIE) {
                el.style.width = rect.width + "px";
                el.style.height = rect.height + "px";
                rect = el.getBoundingClientRect();
            }
            var width = rect.width + dx;
            var height = rect.height + dy;
            el.style.width = width + "px";
            el.style.height = height + "px";
            this.changes.push({ el: el, rect: rect });
            var newRect = el.getBoundingClientRect();
            // Check whether the change "took". If not, roll back.
            if (newRect.width !== width || newRect.height !== height) {
                this.rollback();
            }
        };
        PseudoAtomicRectChange.prototype.rollback = function () {
            var changes = this.changes;
            for (var _i = 0, changes_1 = changes; _i < changes_1.length; _i++) {
                var change = changes_1[_i];
                var el = change.el;
                var rect = change.rect;
                el.style.width = rect.width + "px";
                el.style.height = rect.height + "px";
            }
            this.rolledback = true;
        };
        return PseudoAtomicRectChange;
    }());
    /**
     * A modal needs to be created only once per instance of wed. After creation it
     * must be installed into the DOM tree of the page on which it is going to be
     * used. The method [[Modal.getTopLevel]] must be used to get the top level DOM
     * element of the modal which will be inserted into the page. Once inserted, the
     * modal is ready to be used once, twice, or more times. It need not be removed,
     * re-created, etc. The method [[Modal.modal]] just needs to be called each time
     * the modal must be displayed.
     *
     * A typical usage scenario would be:
     *
     * <pre>
     *   // Modal setup.
     *   mymodal = new Modal();
     *   mymodal.setTitle("My modal");
     *   mymodal.setBody(...);
     *   mymodal.addYesNo();
     *   // This is a generic example of how to add the modal to a page.
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
     * If the same modal must be displayed on two different pages, then two Modal
     * objects should be created, one per page.
     */
    var Modal = (function () {
        function Modal(options) {
            var _this = this;
            options = options != null ? options : {};
            // tabindex needed to make keyboard stuff work... grumble...
            // https://github.com/twitter/bootstrap/issues/4663
            // tslint:disable-next-line:no-jquery-raw-elements
            this._$dom = $("\
<div class=\"modal\" style=\"position: absolute\" tabindex=\"1\">\
  <div class=\"modal-dialog\">\
    <div class=\"modal-content\">\
      <div class=\"modal-header\">\
        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" \
         aria-hidden=\"true\">&times;</button>\
        <h3 class=\"modal-title\">Untitled</h3>\
      </div>\
      <div class=\"modal-body\">\
        <p>No body.</p>\
      </div>\
      <div class=\"modal-footer\">\
      </div>\
    </div>\
  </div>\
</div>");
            this._$header = this._$dom.find(".modal-header");
            this._$body = this._$dom.find(".modal-body");
            this._$footer = this._$dom.find(".modal-footer");
            this._$dom.on("click", ".btn", function (ev) {
                _this._$clicked = $(ev.currentTarget);
                return true;
            });
            this._$dom.on("shown.bs.modal.modal", this._handleShown.bind(this));
            var content = this._$dom.find(".modal-content")[0];
            var body = this._$body[0];
            var win = body.ownerDocument.defaultView;
            var $dom = this._$dom;
            if (options.resizable) {
                body.style.overflow = "auto";
                // We listen to resizestart and resizeend to deal with the following
                // scenario: the user starts resizing the modal, it goes beyond the limits
                // of how big it can be resized, the mouse pointer moves outside the modal
                // window and the user releases the button when the pointer is
                // outside. Without the use of ignoreBackdropClick, this causes the modal
                // to close.
                interact(content)
                    .resizable({})
                    .on("resizestart", function () {
                    var modal = $dom.data("bs.modal");
                    if (modal == null) {
                        return; // Deal with edge cases.
                    }
                    // Prevent modal closure.
                    modal.ignoreBackdropClick = true;
                })
                    .on("resizeend", function () {
                    // We use a setTimeout otherwise we turn ignoreBackdropClick too soon.
                    setTimeout(function () {
                        var modal = $dom.data("bs.modal");
                        if (modal == null) {
                            return; // Deal with edge cases.
                        }
                        modal.ignoreBackdropClick = false;
                    }, 0);
                })
                    .on("resizemove", function (event) {
                    var target = event.target;
                    var change = new PseudoAtomicRectChange();
                    change.updateElementRect(target, event.dx, event.dy);
                    change.updateElementRect(body, event.dx, event.dy);
                });
            }
            if (options.draggable) {
                interact(this._$header[0])
                    .draggable({
                    restrict: {
                        restriction: {
                            left: 0,
                            top: 0,
                            right: win.innerWidth - 10,
                            bottom: win.innerHeight - 10,
                        },
                    },
                })
                    .on("dragmove", function (event) {
                    var target = content;
                    target.style.left = event.clientX - event.clientX0 + "px";
                    target.style.top = event.clientY - event.clientY0 + "px";
                });
            }
        }
        /**
         * @returns The top level node of the modal, to be inserted
         * into a page.
         */
        Modal.prototype.getTopLevel = function () {
            return this._$dom;
        };
        /**
         * Set the title of this modal.
         */
        Modal.prototype.setTitle = function (title) {
            var $h3 = this._$header.find("h3");
            $h3.empty();
            $h3.append(title);
        };
        /**
         * Set the body of this modal.
         */
        Modal.prototype.setBody = function (body) {
            this._$body.empty();
            this._$body.append(body);
        };
        /**
         * Set the footer of this modal.
         */
        Modal.prototype.setFooter = function (footer) {
            this._$footer.empty();
            this._$footer.append(footer);
        };
        /**
         * @param name The name of the button.
         *
         * @param isPrimary True if the button is primary. A modal takes only one
         * primary button but no check is made by this method to prevent it. The
         * primary button is the one clicked if the user hits enter.
         *
         * @returns The jQuery object for the button.
         */
        Modal.prototype.addButton = function (name, isPrimary) {
            if (isPrimary === void 0) { isPrimary = false; }
            var button = this._$dom[0].ownerDocument.createElement("a");
            button.href = "#";
            button.className = "btn";
            button.setAttribute("data-dismiss", "modal");
            button.textContent = name;
            button.classList.add(isPrimary ? "btn-primary" : "btn-default");
            this._$footer.append(button);
            return $(button);
        };
        /**
         * Adds one Ok and one Cancel button.
         *
         * @returns The two buttons added.
         */
        Modal.prototype.addOkCancel = function () {
            return [this.addButton("Ok", true), this.addButton("Cancel")];
        };
        /**
         * Adds one Yes and one No button.
         *
         * @returns The two buttons added.
         */
        Modal.prototype.addYesNo = function () {
            return [this.addButton("Yes", true), this.addButton("No")];
        };
        /**
         * Returns the primary button.
         *
         * @returns The primary button.
         */
        Modal.prototype.getPrimary = function () {
            return this._$footer.find(".btn-primary");
        };
        /**
         * @param callback A callback to call when the modal is dismissed by the
         * user. This modal would typically inspect the modal to determine what the
         * user did, and potentially clean up after itself. The callback is left out
         * if the modal is merely for informational purposes.
         */
        Modal.prototype.modal = function (callback) {
            this._$clicked = undefined;
            if (callback !== undefined) {
                this._$dom.one("hidden.bs.modal.modal", callback);
            }
            this._$dom.modal();
        };
        /**
         * @returns The button that was clicked. Could be undefined if the modal
         * disappeared without being normally dismissed or if the modal has not been
         * used yet.
         */
        Modal.prototype.getClicked = function () {
            return this._$clicked;
        };
        /**
         * @returns The text of the button that was clicked. Could be undefined if the
         * modal disappeared without being normally dismissed or if the modal has not
         * been used yet.
         */
        Modal.prototype.getClickedAsText = function () {
            if (this._$clicked === undefined) {
                return undefined;
            }
            return this._$clicked.text();
        };
        /**
         * Handles the ``shown`` event.
         *
         * @param {Event} ev The DOM event.
         */
        Modal.prototype._handleShown = function () {
            var win = this._$dom[0].ownerDocument.defaultView;
            var winHeight = win.innerHeight;
            var dialog = this._$dom.find(".modal-dialog")[0];
            var rect = dialog.getBoundingClientRect();
            var computedStyle = window.getComputedStyle(dialog);
            // eslint-disable-next-line no-mixed-operators
            var diff = -rect.top + (winHeight - rect.height) -
                parseInt(computedStyle.marginBottom);
            var dialogMaxHeight = rect.height + diff;
            dialog.style.maxHeight = dialogMaxHeight + "px";
            var content = this._$dom.find(".modal-content")[0];
            content.style.maxHeight = dialogMaxHeight + "px";
        };
        return Modal;
    }());
    exports.Modal = Modal;
});
//  LocalWords:  Ok DOM gui Mangalam MPL Dubeau getClickedAsText pre
//  LocalWords:  addYesNo setBody setTitle mymodal jquery html href
//  LocalWords:  bs jQuery param btn tabindex util getTopLevel

//# sourceMappingURL=modal.js.map
