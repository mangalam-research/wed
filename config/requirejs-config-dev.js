require.config({
 baseUrl: '/build/standalone/lib/',
 paths: {
   'jquery': 'jquery-1.9.1',
   'bootstrap': 'bootstrap/js/bootstrap.min',
   'glyphicons': 'glyphicons',

     // This is required by the testing framework.
   'test': '../../../browser_test/'
 },
 shim: {
   'bootstrap': {
     deps: ["jquery"],
     exports: "jQuery.fn.popover"
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
   'mocha/mocha': {
     exports: "mocha",
     init: function () { this.mocha.setup('bdd'); return this.mocha; }
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
         }
     }
 },
 enforceDefine: true
});
