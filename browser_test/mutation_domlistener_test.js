define(["mocha/mocha", "chai", "jquery", "wed/mutation_domlistener",
       "./domlistener_generic_test"],
function (mocha, chai, $, domlistener, generic) {

generic(mocha, chai, $, domlistener, "mutation_domlistener", null);

});
