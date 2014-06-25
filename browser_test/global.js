/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(function (require, exports, module) {
'use strict';
var chai = require("chai");
var $ = require("jquery");

var assert = chai.assert;

function reset(done) {
    $.post('/build/ajax/control', {command: 'reset'},
           function (data) {
        assert.deepEqual(data, {});
        done();
    }).fail(function () { throw new Error("failed to reset"); });
}

exports.reset = reset;

function fail_on_save(done) {
    reset(function () {
        $.post('/build/ajax/control', {command: 'fail_on_save', value: 1},
               function (data) {
            assert.deepEqual(data, {});
            done();
        }).fail(function () { throw new Error("failed to set fail_on_save"); });
    });
}

exports.fail_on_save = fail_on_save;

function no_response_on_save(done) {
    reset(function () {
        $.post('/build/ajax/control', {command: 'no_response_on_save',
                                       value: 1},
               function (data) {
            assert.deepEqual(data, {});
            done();
        }).fail(function () {
            throw new Error("failed to set no_response_on_save"); });
    });
}

exports.no_response_on_save = no_response_on_save;

});

//  LocalWords:  Mangalam MPL Dubeau jQuery jquery ajax chai
