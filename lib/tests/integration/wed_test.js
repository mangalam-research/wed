/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(function f(require) {
  "use strict";
  var chai = require("chai");
  var global = require("../global");
  var $ = require("jquery");
  var wed = require("wed/wed");
  var key_constants = require("wed/key-constants");
  var onerror = require("wed/onerror");
  var log = require("wed/log");
  var salve = require("salve");
  var globalConfig = require("global-config");
  var mergeOptions = require("merge-options");

  var _slice = Array.prototype.slice;

  var base_options = {
    schema: "/build/schemas/tei-simplified-rng.js",
    mode: {
      path: "wed/modes/test/test-mode",
      options: {
        metadata: "/build/schemas/tei-metadata.json",
      },
    },
  };
  var assert = chai.assert;

  var wedframe = window.parent.document.getElementById("wedframe");
  var wedwin = wedframe.contentWindow;
  var src_stack = ["../wed_test_data/server_interaction_converted.xml"];
  var option_stack = [base_options];

  function mergeWithGlobal(options) {
    var ret;
    // Simulate the old ignore_module_config.
    if (options.ignore_module_config) {
      ret = mergeOptions({}, options);
      delete ret.ignore_module_config;
    }
    else {
      ret = mergeOptions({}, globalConfig.config, options);
    }
    return ret;
  }

  // Utility to check whether we have stray timeouts. This is usually not used
  // but we want to have it at hand for diagnosis. So:
  //
  // eslint-disable-next-line no-unused-vars
  function patchTimeouts(window) {
    var timeouts = [];

    var old_st = window.setTimeout;
    window.setTimeout = function setTimeout() {
      var ret;
      if (typeof arguments[0] === "function") {
        var fn = arguments[0];
        var fn_args = _slice.call(arguments, 2);
        ret = old_st(function timeout() {
          /* eslint-disable no-console */
          console.log("timeout executed", ret);
          /* eslint-enable */

          // Remove the timeout from the list.
          var ix = timeouts.indexOf(ret);
          if (ix >= 0) {
            timeouts.splice(ix, ret);
          }
          fn.apply(this, fn_args);
        }, arguments[1]);
      }
      else {
        // We don't support the first argument being something
        // else than a function. We'll get erroneous uncleared
        // timeouts but, oh well.
        ret = old_st.apply(this, arguments);
      }
      /* eslint-disable no-console */
      console.log("setTimeout returned", ret, "from", arguments);
      console.log(new Error().stack);
      /* eslint-enable */
      timeouts.push(ret);
      return ret;
    };

    var old_ct = window.clearTimeout;
    window.clearTimeout = function clearTimeout() {
      /* eslint-disable no-console */
      console.log("clearTimeout", arguments);
      console.log(new Error().stack);
      /* eslint-enable */
      var ix = timeouts.indexOf(arguments[0]);
      if (ix >= 0) {
        timeouts.splice(ix, 1);
      }
      return old_ct.apply(this, arguments);
    };

    window.checkTimeouts = function checkTimeouts() {
      /* eslint-disable no-console */
      console.log("uncleared", timeouts);
      /* eslint-enable */
      timeouts = [];
    };
  }

  describe("wed", function wedBlock() {
    describe("(state-sensitive)", function stateSensitive() {
      // These are tests that required a brand new editor. Since it is costly to
      // create a new editor for each individual test, we don't want to put in
      // this `describe` the tests that don't need such initialization.

      before(function before(done) {
        // Resolve the schema to a grammar.
        $.get(require.toUrl(base_options.schema), function success(x) {
          base_options.schema = salve.constructTree(x);
          done();
        }, "text").fail(
          function fail(jqXHR, textStatus, errorThrown) {
            throw new Error(textStatus + " " + errorThrown);
          });
      });

      var force_reload = false;
      var editor;
      beforeEach(function beforeEach(done) {
        require(["text!" + src_stack[0]], function loaded(data) {
          var wedroot = wedwin.document.getElementById("wedroot");
          editor = new wed.Editor(wedroot, mergeWithGlobal(option_stack[0]));
          editor.init(data)
            .then(function initialized() {
              done();
            });
        });
        force_reload = false;
      });

      afterEach(function afterEach(done) {
        if (editor) {
          editor.destroy();
        }
        editor = undefined;

        // We read the state, reset, and do the assertion later so
        // that if the assertion fails, we still have our reset.
        var was_terminating = onerror.is_terminating();

        // We don't reload our page so we need to do this.
        onerror.__test.reset();
        log.clearAppenders();
        assert.isFalse(was_terminating,
                       "test caused an unhandled exception to occur");

        if (force_reload) {
          wedframe.onload = function onload() {
            wedframe.onload = undefined;
            done();
          };
          wedwin.location.reload();
        }
        else {
          done();
        }
      });

      describe("fails as needed and recovers:", function failsAndRecovers() {
        // Yes, we reset before and after.
        beforeEach(function beforeEach(done) {
          global.reset(done);
        });

        afterEach(function afterEach(done) {
          global.reset(done);
        });

        it("tells the user to reload when save fails hard", function test(done) {
          function doit() {
            var $modal = onerror.__test.$modal;
            $modal.on("shown.bs.modal", function shown() {
              // Prevent a reload.
              onerror.__test.reset();
              done();
            });

            editor.type(key_constants.CTRLEQ_S);
          }

          global.no_response_on_save(doit);
        });

        it("warns of disconnection when the server returns a bad status",
           function test(done) {
             function doit() {
               var $modal = editor.modals.getModal("disconnect").getTopLevel();
               $modal.on("shown.bs.modal", function shown() {
                 editor.saver.events.subscribe(function saved(ev) {
                   if (ev.name !== "Saved") {
                     return;
                   }

                   // Was saved on retry!

                   // This allows us to let the whole save process run its
                   // course before we declare it done.
                   setTimeout(done, 0);
                 });
                 // Reset so that the next save works.
                 global.reset(function reset() {
                   // This triggers a retry.
                   $modal.modal("hide");
                 });
               });

               editor.type(key_constants.CTRLEQ_S);
             }

             global.fail_on_save(doit);
           });

        it("brings up a modal when the document was edited by someone else",
           function test(done) {
             function doit() {
               var $modal = editor.modals.getModal("editedByOther").getTopLevel();
               $modal.on("shown.bs.modal", function shown() {
                 // Prevent a reload.
                 $modal.off("hidden.bs.modal.modal");
                 $modal.modal("hide");
                 done();
               });

               editor.type(key_constants.CTRLEQ_S);
             }

             global.precondition_fail_on_save(doit);
           });

        it("brings up a modal when there is a new version of the editor",
           function test(done) {
             function doit() {
               var $modal = editor.modals.getModal("tooOld").getTopLevel();
               $modal.on("shown.bs.modal", function shown() {
                 // Prevent a reload.
                 $modal.off("hidden.bs.modal.modal");
                 $modal.modal("hide");
                 done();
               });

               editor.type(key_constants.CTRLEQ_S);
             }

             global.too_old_on_save(doit);
           });

        it("does not attempt recovery when save fails hard",
           function test(done) {
             function doit() {
               var $modal = onerror.__test.$modal;
               $modal.on("shown.bs.modal", function shown() {
                 // The data was saved even though the server
                 // replied with an HTTP error code.
                 $.get("/build/ajax/save.txt", function success(data) {
                   var obj = {
                     command: "save",
                     version: wed.version,
                     data:
                     "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p/></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>",
                   };
                   var expected = "\n***\n" + JSON.stringify(obj);
                   assert.equal(data, expected);
                   // Prevent a reload.
                   onerror.__test.reset();
                   done();
                 });
               });

               editor.type(key_constants.CTRLEQ_S);
             }

             global.no_response_on_save(doit);
           });

        it("attempts recovery on uncaught exception", function test(done) {
          // We can't just raise an exception because mocha will intercept it
          // and it will never get to the onerror handler. If we raise the error
          // in a timeout, it will go straight to onerror.

          window.setTimeout(function timeout() {
            window.setTimeout(function timeout2() {
              $.get("/build/ajax/save.txt", function success(data) {
                var obj = {
                  command: "recover",
                  version: wed.version,
                  data:
                  "<TEI xmlns=\"http://www.tei-c.org/ns/1.0\">\
<teiHeader><fileDesc><titleStmt><title>abcd</title></titleStmt>\
<publicationStmt><p/></publicationStmt><sourceDesc><p/></sourceDesc>\
</fileDesc></teiHeader><text><body><p>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p></body></text></TEI>" };
                var expected = "\n***\n" + JSON.stringify(obj);
                assert.equal(data, expected);
                onerror.__test.reset();
                done();
              });
            }, 1000);
            throw new Error("I'm failing!");
          }, 5);
        });
      });
    });
  });
});

//  LocalWords:  rng wedframe RequireJS dropdown Ctrl Mangalam MPL
//  LocalWords:  Dubeau previousSibling nextSibling abcd jQuery xmlns
//  LocalWords:  sourceDesc publicationStmt titleStmt fileDesc txt
//  LocalWords:  ajax xml moveCaretRight moveCaretLeft teiHeader html
//  LocalWords:  innerHTML nodeValue seekCaret nodeToPath pathToNode
//  LocalWords:  mouseup mousedown unhandled requirejs btn gui metas
//  LocalWords:  wedroot tei domutil onerror jquery chai
