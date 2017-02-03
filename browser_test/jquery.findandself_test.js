/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(function f(require) {
  "use strict";
  var chai = require("chai");
  var $ = require("jquery");
  require("wed/jquery.findandself");

  var assert = chai.assert;
  describe("jQuery.findAndSelf", function findAndSelf() {
    var $data = $("#data");
    var $root;
    beforeEach(function beforeEach() {
      $root = $("<ul data-foo='foo'><li data-foo='bar'>\
                  <p data-foo='foo'>bar</p></li></ul>");
      $data.append($root);
    });

    it("matches self and descendants", function test() {
      var $result = $root.findAndSelf("[data-foo='foo']");
      assert.equal($result.length, 2);
      assert.equal($result[0].nodeName, "UL");
      assert.equal($result[1].nodeName, "P");
    });

    it("matches descendants", function test() {
      var $result = $root.findAndSelf("[data-foo='bar']");
      assert.equal($result.length, 1);
      assert.equal($result[0].nodeName, "LI");
    });

    afterEach(function afterEach() {
      $data.empty();
    });
  });
});

//  LocalWords:  findAndSelf Mangalam MPL Dubeau li ul findandself
//  LocalWords:  jquery jQuery chai
