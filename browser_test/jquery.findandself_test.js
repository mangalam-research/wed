define(["mocha/mocha", "chai", "jquery", "wed/jquery.findandself"], 
function (mocha, chai, $, _) {
    var assert = chai.assert;
    describe("jQuery.findAndSelf", function () {

        var $data = $("#data");
        var $root;
        beforeEach(function () {
            $root = $("<ul data-foo='foo'><li data-foo='bar'><p data-foo='foo'>bar</p></li></ul>");
            $data.append($root);
        });

        it("matches self and descendants", function () {
            var $result = $root.findAndSelf("[data-foo='foo']");
            assert.equal($result.length, 2);
            assert.equal($result[0].nodeName, 'UL');
            assert.equal($result[1].nodeName, 'P');
        });

        it("matches descendants", function () {
            var $result = $root.findAndSelf("[data-foo='bar']");
            assert.equal($result.length, 1);
            assert.equal($result[0].nodeName, 'LI');
        });

        afterEach(function () {
            $data.empty();
        });

    });

});
