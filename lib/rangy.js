/**
* @author Louis-Dominique Dubeau
* @license MPL 2.0
* @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
*/
// This is an ad-hoc script that loads rangy. Basically the issue is
// that rangy-core must be loaded first, then all modules must be
// loaded and then rangy.init() must be called once AFTER ALL rangy
// modules are loaded.
//
// RequireJS ensures ordering based on dependencies but there is still
// a certain level of indeterminacy (so long as dependencies are
// maintained) so if module A requires rangy-core but NOT
// rangy-selectionsaverestore, and module B requires rangy-core AND
// rangy-selectionsaverestore, it is possible to have a load order of:
//
// * rangy-core

// * A, which calls rangy.init()
//
// * (Request for rangy-core again which is a noop.)
//
// * rangy-selectionsaverestore
//
// * B, which calls rangy.init() which is a noop.
//
// But B wants to use the methods declared by
// rangy-selectionsaverestore, which are not available because
// rangy.init() was called before rangy-selectionsaverestore was
// loaded.
//
// I did not find a nice, simple way to fix this issue with shims,
// hence this file.
//
define(["external/rangy/rangy-core",
        "external/rangy/rangy-selectionsaverestore"],
function (core, saverestore) {

core.init();

return core;

});

//  LocalWords:  RequireJS Mangalam MPL Dubeau noop init hoc
//  LocalWords:  selectionsaverestore
