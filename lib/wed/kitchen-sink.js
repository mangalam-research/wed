/**
 * @module kitchen-sink
 * @desc A demo module for wed
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2014 Mangalam Research Center for Buddhist Languages
 */
define([], function () {

// NOTE: PURL MUST HAVE BEEN LOADED WITH A <script> TAG.
var purled = purl();
var mode = purled.param('mode');
var file = purled.param('file');
var localstorage = purled.param('localstorage');
var options_param = purled.param('options');

if (file !== undefined && localstorage !== undefined)
    throw new Error("file and localstorage defined: use one or " +
                    "the other");

function launch(text, options) {
    options = options || {};
    require(["wed/wed", "jquery"], function (wed, $) {
        $(function () {
            var $widget = $("#widget");
            if (mode)
                options.mode = { path: mode };

            if (options_param === "noautoinsert")
                options.mode.options = { autoinsert: false };

            if (options_param === "ambiguous_fileDesc_insert")
                options.mode.options = { ambiguous_fileDesc_insert: true };

            if (options_param === "fileDesc_insert_needs_input")
                options.mode.options = { fileDesc_insert_needs_input: true };

            window.wed_editor = new wed.Editor();
            window.wed_editor.init($widget[0], options, text);
        });
    });
}

if (localstorage) {
    // Show the link...
    var file_management_link = document.getElementById("fm-link");
    file_management_link.style.display = "";
    require(["localforage", "wed/savers/localforage"], function (
        localforage, wed_localforage) {
        wed_localforage.config();
        localforage.getItem(localstorage).then(function (value) {
            launch(value.data, {
                save: {
                    path: "wed/savers/localforage",
                    options: {
                        name: localstorage
                    }
                }
            });
        });
    });
}
else if (file) {
    require(["text!" + file], function (text) {
        launch(text);
    });
}
else
    launch();


});
