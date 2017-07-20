/**
 * Editing actions.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(["require", "exports", "module"], function (require, exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     *
     * Actions model "things the user can do." These can be contextual menu items,
     * menu items, buttons, keybindings, etc. The base class is always enabled but
     * derived classes can set their own enabled state depending on whatever
     * conditions they choose.
     */
    var Action = (function () {
        /*
         * @param editor The editor to which this action belongs.
         *
         * @param desc A simple string description of the action.
         *
         * @param abbreviatedDesc An abbreviated description, suitable to put into a
         * button, for instance.
         *
         * @param icon HTML code that represents an icon for this action. This can be
         * a simple string or something more complex.
         *
         * @param needsInput Indicates whether this action needs input from the
         * user. For instance, an action which brings up a modal dialog to ask
         * something of the user must have this parameter set to ``true``. It is
         * important to record whether an action needs input because, to take one
         * example, the ``autoinsert`` logic will try to insert automatically any
         * element it can. However, doing this for elements that need user input will
         * just confuse the user (or could cause a crash). Therefore, it is important
         * that the insertion operations for such elements be marked with
         * ``needsInput`` set to ``true`` so that the ``autoinsert`` logic backs off
         * from trying to insert these elements.
         */
        function Action(editor, desc, abbreviatedDesc, icon, needsInput) {
            if (icon === void 0) { icon = ""; }
            if (needsInput === void 0) { needsInput = false; }
            this.editor = editor;
            this.desc = desc;
            this.abbreviatedDesc = abbreviatedDesc;
            this.icon = icon;
            this.needsInput = needsInput;
            this._enabled = true;
            this.needsInput = !!needsInput; // normalize value
            this.boundHandler = this.eventHandler.bind(this);
            this.boundTerminalHandler = this.terminalEventHandler.bind(this);
        }
        /**
         * An event handler. By default just calls [[execute]]. You probably want to
         * use [[boundHandler]] rather than rebind this method. This handler always
         * returns ``undefined`` and calls ``preventDefault()`` on the event passed to
         * it.
         *
         * @param ev The DOM event.
         */
        Action.prototype.eventHandler = function (ev) {
            this.execute(ev.data);
            ev.preventDefault();
        };
        /**
         * An event handler. By default just calls [[eventHandler]]. You probably want
         * to use [[boundTerminalHandler]] rather than rebind this method.  This
         * handler always returns false and calls ``preventDefault()`` and
         * ``stopPropagation`` on the event passed to it.
         *
         * @param ev The DOM event.
         *
         * @returns False.
         */
        Action.prototype.terminalEventHandler = function (ev) {
            this.eventHandler(ev);
            ev.preventDefault();
            ev.stopPropagation();
            return false;
        };
        /**
         * Gets a description for this action.
         *
         * @returns A description for the action.
         */
        Action.prototype.getDescription = function () {
            return this.desc;
        };
        /**
         * Gets a description for this action, contextualized by the data passed.
         *
         * @param data The same data that would be passed to [[execute]].
         *
         * @returns The description.
         */
        Action.prototype.getDescriptionFor = function (data) {
            return this.getDescription();
        };
        /**
         * Gets the abbreviated description for this action.
         *
         * @returns The abbreviated description.
         */
        Action.prototype.getAbbreviatedDescription = function () {
            return this.abbreviatedDesc;
        };
        /**
         * Gets the icon.
         *
         * @returns The icon. This is an HTML string.
         */
        Action.prototype.getIcon = function () {
            return this.icon;
        };
        /**
         * This method returns the icon together with the description for the
         * data passed as parameter.
         *
         * @param data The same data that would be passed to [[execute]].
         *
         * @returns The icon and the description, combined for presentation.
         */
        Action.prototype.getLabelFor = function (data) {
            var desc = this.getDescriptionFor(data);
            var icon = this.getIcon();
            if (icon !== "" && desc !== "") {
                return icon + " " + desc;
            }
            if (icon !== "") {
                return icon;
            }
            return desc;
        };
        /**
         * Converts this action to a string. By default calls [[getDescription]].
         */
        Action.prototype.toString = function () {
            return this.getDescription();
        };
        /**
         * Returns whether or not the action is currently enabled.
         */
        Action.prototype.getEnabled = function () {
            return this._enabled;
        };
        return Action;
    }());
    exports.Action = Action;
});
//  LocalWords:  keybindings html oop Mangalam MPL Dubeau

//# sourceMappingURL=action.js.map
