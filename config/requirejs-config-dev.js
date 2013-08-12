require.config({
 baseUrl: '/build/standalone/lib/',
 paths: {
   'jquery': 'jquery-1.9.1',
   'bootstrap': 'bootstrap/js/bootstrap.min',
     // This is required by the testing framework.
   'test': '../../../browser_test/'
 },
 shim: {
   'bootstrap': {
     deps: ["jquery"],
     exports: "jQuery.fn.popover",
     init: function () { jQuery.noConflict() }
   },
   'bootstrap-contextmenu': {
     deps: ["bootstrap"],
     exports: "jQuery.fn.contextmenu"
   },
   'rangy/rangy-core': {
     exports: "rangy",
     init: function() { return this.rangy; }
   },
   'rangy/rangy-selectionsaverestore': {
     deps: ["rangy/rangy-core"],
     exports: "rangy.modules.SaveRestore"
   },
   'wed/jquery.findandself': {
     deps: ["jquery"],
     exports: "jQuery.fn.findAndSelf"
   },
   'jquery.bootstrap-growl': {
     deps: ["jquery", "bootstrap"],
     exports: "jQuery.bootstrapGrowl"
   },
   'mocha/mocha': {
     exports: "mocha",
     init: function () { this.mocha.setup('bdd'); return this.mocha; }
   },
   'log4javascript': {
       exports: "log4javascript"
   }
 },
 config: {
     'wed/wed': {
         schema: 'test/tei-simplified-rng.js',
         mode: {
             path: 'wed/modes/generic/generic',
             options: {
                 meta: 'wed/modes/generic/metas/tei_meta'
             }
         },
         // You certainly do not want this in actual deployment.
         ajaxlog: {
             url: "/build/ajax/log.txt"
         },
         }
     }
 },
 enforceDefine: true
});
