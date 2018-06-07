/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
require.config({
  baseUrl: "lib/",
  paths: {
    jquery: "external/jquery",
    bootstrap: "external/bootstrap/js/bootstrap.min",
    log4javascript: "external/log4javascript",
    "font-awesome": "external/font-awesome",
    xregexp: "external/xregexp",
    text: "requirejs/text",
    optional: "requirejs/optional",
    localforage: "external/localforage",
    angular: "external/angular",
    bootbox: "external/bootbox",
    typeahead: "external/typeahead.jquery.min",
    bloodhound: "external/bloodhound.min",
    urijs: "external/urijs",
    interact: "external/interact.min",
    "merge-options": "external/merge-options",
    "is-plain-obj": "external/is-plain-obj",
    bluebird: "external/bluebird",
    "last-resort": "external/last-resort",
    "rangy-core": "external/rangy/rangy-core",
    "rangy-textrange": "external/rangy/rangy-textrange",
    salve: "external/salve.min",
    "salve-dom": "external/salve-dom.min",
    "bootstrap-notify": "external/bootstrap-notify",
    dexie: "external/dexie.min",
    bluejax: "external/bluejax",
    "bluejax.try": "external/bluejax.try",
    slug: "external/slug",
    ajv: "external/ajv.min",
    diff: "external/diff",
  },
  packages: [
    {
      name: "lodash",
      location: "external/lodash",
    },
  ],
  map: {
    "*": {
      // This is needed due to the disconnect between the hardcoded name
      // in the file that is shipped by interactjs and the name of the npm
      // package.
      interactjs: "interact",
      bootstrap: "wed/patches/bootstrap",
      "wed/modes/generic/metadata-schema.json": "json!wed/modes/generic/metadata-schema.json",
      "wed/wed-options-schema.json": "json!wed/wed-options-schema.json",
      "wed/options-schema.json": "json!wed/options-schema.json",
      rangy: "wed/glue/rangy-glue",
      rxjs: "external/rxjs/index",
      "rxjs/operators": "external/rxjs/operators/index",
    },
    "wed/patches/bootstrap": {
      bootstrap: "bootstrap",
    },
    // bootbox is buggy. It only requires jquery but it needs bootstrap too.
    // Loading bootstrap works due to the init we have below which makes
    // bootstrap return $.
    bootbox: {
      jquery: "bootstrap",
    },
    "wed/glue/rangy-glue": {
      rangy: "rangy-core",
    },
    rangy: {
      rangy: "rangy",
    },
  },
  shim: {
    bootstrap: {
      deps: ["jquery"],
      exports: "jQuery.fn.popover",
      init: function init($) {
        "use strict";

        return $;
      },
    },
    angular: {
       // AngularJS can use jQuery optionally. However, in our application
       // we MUST have jQuery loaded and available for Angular to use it.
      deps: ["jquery"],
      exports: "angular",
    },
  },
  waitSeconds: 12,
  enforceDefine: true,
});

//  LocalWords:  popup onerror findandself jQuery Dubeau MPL Mangalam
//  LocalWords:  txt tei ajax jquery
