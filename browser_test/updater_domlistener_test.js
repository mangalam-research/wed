define(["mocha/mocha", "chai", "jquery", "wed/updater_domlistener",
       "./domlistener_generic_test", "wed/tree_updater"],
function (mocha, chai, $, domlistener, generic, tree_updater) {

generic(mocha, chai, $, domlistener, "updater_domlistener", tree_updater.TreeUpdater);

});
