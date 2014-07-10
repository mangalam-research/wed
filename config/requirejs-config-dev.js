/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
require.config({
 baseUrl: 'lib/',
 paths: {
   browser_test: '../../../browser_test',
   jquery: 'external/jquery-1.11.0',
   bootstrap: 'external/bootstrap/js/bootstrap.min',
   log4javascript: 'external/log4javascript',
   'jquery.bootstrap-growl': 'external/jquery.bootstrap-growl',
   'font-awesome': 'external/font-awesome',
   'pubsub-js': 'external/pubsub',
   xregexp: 'external/xregexp',
   text: 'requirejs/text'
 },
 packages: [
     {
         name: "lodash",
         location: "external/lodash"
     }
 ],
 shim: {
   xregexp: {
     exports: "XRegExp",
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
             url: "/build/ajax/save.txt"
         }
     }
 },
 waitSeconds: 12,
 enforceDefine: true
});

//  LocalWords:  popup onerror findandself jQuery Dubeau MPL Mangalam
//  LocalWords:  txt tei ajax jquery
