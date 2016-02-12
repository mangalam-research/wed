/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
require.config({
 baseUrl: 'lib/',
 paths: {
   browser_test: '../../../browser_test',
   jquery: 'external/jquery',
   bootstrap: 'external/bootstrap/js/bootstrap.min',
   log4javascript: 'external/log4javascript',
   'jquery.bootstrap-growl': 'external/jquery.bootstrap-growl',
   'font-awesome': 'external/font-awesome',
   'pubsub-js': 'external/pubsub',
   xregexp: 'external/xregexp',
   text: 'requirejs/text',
   localforage: 'external/localforage',
   async: 'external/async',
   angular: 'external/angular',
   bootbox: 'external/bootbox',
   typeahead: 'external/typeahead.bundle.min',
   urijs: 'external/urijs',
   interact: 'external/interact.min',
   'merge-options': 'external/merge-options',
   'is-plain-obj': 'external/is-plain-obj'
 },
 packages: [
     {
         name: "lodash",
         location: "external/lodash"
     }
 ],
 shim: {
   xregexp: {
     // RequireJS wants to have this here even if the ``init`` field
     // makes it pointless.
     exports: "XRegExp",
     // We do it this way because salve is developed in Node and in
     // Node when we require XRegExp we get a module which has an
     // XRegExp field on it.
     init: function () { return {XRegExp: XRegExp}; }
   },
   bootstrap: {
     deps: ["jquery"],
     exports: "jQuery.fn.popover",
     init: function () { jQuery.noConflict() }
   },
   'external/rangy/rangy-core': {
     exports: "rangy",
     init: function() { return this.rangy; }
   },
   'external/rangy/rangy-selectionsaverestore': {
     deps: ["external/rangy/rangy-core"],
     exports: "rangy.modules.SaveRestore"
   },
   'jquery.bootstrap-growl': {
     deps: ["jquery", "bootstrap"],
     exports: "jQuery.bootstrapGrowl"
   },
   log4javascript: {
       exports: "log4javascript"
   },
   angular: {
       // AngularJS can use jQuery optionally. However, in our application
       // we MUST have jQuery loaded and available for Angular to use it.
       deps: ["jquery"],
       exports: "angular"
   },
   bootbox: {
       deps: ["bootstrap"],
       exports: "bootbox"
   },
   typeahead: {
       deps: ['jquery'],
       exports: 'Bloodhound'
   }
 },
 config: {
     'wed/wed': {
         schema: '../../../schemas/tei-simplified-rng.js',
         mode: {
             path: 'wed/modes/generic/generic',
             options: {
                 meta: {
                     path: 'wed/modes/generic/metas/tei_meta',
                     options: {
                         metadata: '../../../../../schemas/tei-metadata.json'
                     }
                 }
             }
         },
         // You certainly do not want this in actual deployment.
         ajaxlog: {
             url: "/build/ajax/log.txt"
         },
         // You certainly do not want this in actual deployment.
         save: {
             path: 'wed/savers/ajax',
             options: {
                 url: "/build/ajax/save.txt"
             }
         }
     }
 },
 waitSeconds: 12,
 enforceDefine: true
});

//  LocalWords:  popup onerror findandself jQuery Dubeau MPL Mangalam
//  LocalWords:  txt tei ajax jquery
