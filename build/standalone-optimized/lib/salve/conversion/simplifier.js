/**
 * @module conversion/simplifier
 * @desc Simplification support for trees produced by the {@link
 * module:conversion/parser parser} module.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2013, 2014 Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:conversion/simplifier */
    function (require, exports, module) {
'use strict';

var Element = require("./parser").Element;
var uri = require("uri-js");
var parser = require("./parser");
var sax = require("sax");
var name_resolver = require("../name_resolver");
var _ = require("lodash");

function replaceElWith(el, replacement) {
    var parent = el.parent;
    parent.children[parent.children.indexOf(el)] = replacement;
    el.parent = null;
}

function removeEl(el) {
    var parent = el.parent;
    parent.children.splice(parent.children.indexOf(el), 1);
    el.parent = null;
}

function getFirstChildByLocalName(el, name) {
    var ret = findFirstChildByLocalName(el, name);

    if (ret === null)
        throw new Error("child not found!");

    return ret;
}

function findFirstChildByLocalName(el, name) {
    var children = el.children;
    for (var i = 0, child; (child = children[i]); ++i) {
        if (typeof child === "string")
            continue;

        if (child.node.local === name)
            return child;
    }

    return null;
}

function findFirstDescendantByLocalName(el, name) {
    var children = el.children;
    for (var i = 0, child; (child = children[i]); ++i) {
        if (typeof child === "string")
            continue;

        if (child.node.local === name)
            return child;

        var found = findFirstDescendantByLocalName(child, name);
        if (found)
            return found;
    }

    return null;
}

function findDescendantsByLocalName(el, name) {
    var ret = [];
    var children = el.children;
    for (var i = 0, child; (child = children[i]); ++i) {
        if (typeof child === "string")
            continue;

        if (child.node.local === name)
            ret.push(child);

        var found = findDescendantsByLocalName(child, name);
        if (found)
            ret = ret.concat(found);
    }

    return ret;
}

function findBase(el, document_base) {
    if (!el.node)
        return document_base;

    var attrs = el.node.attributes;
    var this_base = attrs["xml:base"];
    if (this_base) {
        this_base = this_base.value;
        return uri.resolve(
            el.parent ? findBase(el.parent, document_base) : document_base,
            this_base);
    }

    return el.parent ? findBase(el.parent, document_base) : document_base;
}

var RELAXNG_URI = "http://relaxng.org/ns/structure/1.0";

function step0(tree) {
    function dropForeign(el) {
        var node = el.node;
        if (node.uri !== RELAXNG_URI)
            removeEl(el);
        var attrs = node.attributes;
        // We move all RNG nodes into the default namespace.
        node.prefix = "";
        node.name = el.node.local;
        Object.keys(attrs).forEach(function (name) {
            var attr = attrs[name];

            // We don't drop these just yet.
            if (attr.prefix === "xml")
                return;

            if (attr.uri !== RELAXNG_URI &&
                attr.uri !== "")
                delete attrs[name];

            if (attr.uri === RELAXNG_URI) {
                // We move all RNG nodes into the default namespace.
                attrs.prefix = "";
                attrs.name = attrs.local;
            }
        });

        for (var i = 0, child; (child = el.children[i]); ++i)
            dropForeign(child);
    }

    dropForeign(tree);

    // At this point all elements that are not in the Relax NG
    // namespace have been removed. All attributes that are not in no
    // namespace, in the Relax NG namespace, or in the XML namespace
    // have been removed. The "xmlns..." attributes are also gone.

    var xmlns = tree.node.attributes.xmlns;
    if (xmlns)
        xmlns.value = RELAXNG_URI;
    else {
        var xmlns_attr = {
            name: "xmlns",
            prefix: "xmlns",
            uri: name_resolver.XMLNS_NAMESPACE,
            value: RELAXNG_URI,
            local: ""
        };
        tree.node.attributes.xmlns = xmlns_attr;
    }
}

function step1(tree, document_base) {
    step0(tree);
    var handlers = {
        externalRef: function (el) {
            var current_base = findBase(el, document_base);
            var resolved = uri.resolve(current_base,
                                       el.node.attributes.href.value);
            if (typeof window !== "undefined") {
                throw new Error("the simplifier currently does not " +
                                "support resolving externalRef in " +
                                "the browser");
            }
            var fs = require("fs");
            var source = fs.readFileSync(resolved).toString();
            var p = new parser.ConversionParser(
                sax.parser(true, {xmlns: true}));
            p.sax_parser.write(source).close();
            var tree = p.tree;
            step1(tree, resolved);
            var ns = el.node.attributes.ns;
            var tree_ns = tree.node.attributes.ns;
            if (ns && !tree_ns) {
                tree.node.attributes.ns = _.cloneDeep(ns);
            }

            // Since step1, and consequently step0, have been applied
            // to this tree, its only namespace is the Relax NG one,
            // and it is the default namespace. So we can remove it to
            // avoid redeclaring it.
            delete tree.node.attributes.xmlns;
            replaceElWith(el, tree);
        },
        include: function (el) {
            var current_base = findBase(el, document_base);
            var resolved = uri.resolve(current_base,
                                       el.node.attributes.href.value);
            if (typeof window !== "undefined") {
                throw new Error("the simplifier currently does not " +
                                "support resolving externalRef in " +
                                "the browser");
            }
            var fs = require("fs");
            var source = fs.readFileSync(resolved).toString();
            var p = new parser.ConversionParser(
                sax.parser(true, {xmlns: true}));
            p.sax_parser.write(source).close();
            var tree = p.tree;
            step1(tree, resolved);
            // Since step1, and consequently step0, have been applied
            // to this tree, its only namespace is the Relax NG one,
            // and it is the default namespace. So we can remove it to
            // avoid redeclaring it.
            delete tree.node.attributes.xmlns;
            if (tree.node.local !== "grammar")
                throw new Error("include does not point to a document " +
                                "that has a grammar element as root");
            var include_node = el.node;
            var include_starts = findDescendantsByLocalName(el, "start");
            var grammar_starts = findDescendantsByLocalName(tree, "start");
            if (include_starts.length) {
                if (!grammar_starts.length)
                    throw new Error("include contains start element " +
                                    "but grammar does not");
                grammar_starts.forEach(function (start) {
                    removeEl(start);
                });
            }

            var include_defs = findDescendantsByLocalName(el, "define");
            var grammar_defs = findDescendantsByLocalName(tree, "define");
            function getName(def) {
                return def.node.attributes.name.value;
            }
            var include_defs_map = _.indexBy(include_defs, getName);
            var grammar_defs_map = _.groupBy(grammar_defs, getName);
            _.forOwn(include_defs_map, function (def, name) {
                var grammar_defs = grammar_defs_map[name];
                if (!grammar_defs)
                    throw new Error("include has define with name " +
                                    name + " which is not present in " +
                                    "grammar");
                grammar_defs.forEach(function (grammar_def) {
                    removeEl(grammar_def);
                });
            });
            el.node.name = "div";
            el.node.local = "div";
            delete el.node.attributes.href;
            tree.node.name = "div";
            tree.node.local = "div";
            // Insert the grammar element (now named "div") into the
            // include element (also now named "div").
            el.children.unshift(tree);
            tree.parent = el;
        }
    };

    function walk(el) {
        for (var i = 0, child; (child = el.children[i]); ++i) {
            if (typeof child !== "string")
                walk(child);
        }

        var node = el.node;
        var handler = handlers[node.local];

        if (!handler)
            return;

        handler(el);
    }

    walk(tree);

    // At this point it is safe to drop all the attributes in the XML
    // namespace. "xml:base" in particular is no longer of any use.
    function dropForeignAttrs(el) {
        var node = el.node;
        var attrs = node.attributes;
        Object.keys(attrs).forEach(function (name) {
            var attr = attrs[name];

            if (name === "xmlns")
                return;

            if (attr.uri !== RELAXNG_URI &&
                attr.uri !== "")
                delete attrs[name];
        });

        for (var i = 0, child; (child = el.children[i]); ++i)
            dropForeignAttrs(child);
    }
    dropForeignAttrs(tree);

}

function step16(tree) {
    var removed_defines = {};

    function removeDefs(el) {
        var node = el.node;
        switch(node.local) {
        case "grammar":
            // Only grammar needs to have its children checked...
            // We scan from the end because define elements are removed!
            for (var i = el.children.length - 1, child;
                 (child = el.children[i]); --i) {
                if (typeof child !== "string")
                    removeDefs(child);
            }
            break;
        case "define":
            var element = findFirstChildByLocalName(el, "element");
            if (!element)
                removeEl(el);

            removed_defines[el.node.attributes.name.value] = el;
            break;
        }
    }

    removeDefs(tree);

    var handlers = {
        element: function (el) {
            // If an element is not appearing in a define element,
            // then create one for it.
            var parent = el.parent;
            if (parent.node.local !== "define") {
                var name_el = getFirstChildByLocalName(el, "name");
                var el_name = name_el.children[0];
                var name = "__" + el_name + "-elt-" + element_count;

                var ref_node = {
                    local: "ref",
                    name: "ref",
                    attributes: { name: { value: name } }
                };
                var ref_el = new Element(null, ref_node);
                replaceElWith(el, ref_el);

                var def_node = {
                    local: "define",
                    name: "define",
                    attributes: { name: { value: name } }
                };
                var def_el = new Element(grammar_element, def_node);
                def_el.children = [el];
                el.parent = def_el;
            }
            return null;
        },
        ref: function (el) {
            // If a reference is to a definition that does not contain
            // an element element as the top element, move the
            // definition in place of the ref.
            var name = el.node.attributes.name.value;
            var def = removed_defines[name];
            if (def) {
                // We have to clone the definition because it could be
                // referred multiple times.
                var clone = def.children[0].clone();
                replaceElWith(el, clone);
                return clone;
            }
            return null;
        }
    };

    var element_count = 0;
    var grammar_element;
    function walk(el) {
        var node = el.node;

        if (node.local === "grammar")
            grammar_element = el;

        if (node.local === "element")
            element_count++;

        var handler = handlers[node.local];

        if (handler) {
            var repl = handler(el);
            // The element was replaced, continue our walk with the
            // replacement.
            if (repl)
                el = repl;
        }

        for (var i = 0, child; (child = el.children[i]); ++i) {
            if (typeof child !== "string")
                walk(child);
        }
    }

    walk(tree);
}

function step17(tree) {

    var handlers = {
        choice: function (first_na, second_na, count_na, el) {
            switch (count_na) {
            case 1:
                // A choice with exactly one notAllowed is replaced with the
                // other child of the choice.
                replaceElWith(el, el.children[first_na ? 1 : 0]);
                break;
            case 2:
                // A choice with two notAllowed is replaced with notAllowed.
                replaceElWith(el, el.children[0]);
                break;
            }
        },
        attribute: function (first_na, second_na, count_na, el) {
            // An attribute (or list, group, interleave, oneOrMore)
            // with at least one notAllowed is replaced with notAllowed.
            replaceElWith(el, el.children[first_na ? 0: 1]);
        },
        except: function (first_na, second_na, count_na, el) {
            // An except with notAllowed is removed.
            removeEl(el);
        }
    };

    handlers.list = handlers.group = handlers.interleave =
        handlers.oneOrMore = handlers.attribute;

    function walk(el) {
        for (var i = 0, child; (child = el.children[i]); ++i) {
            if (typeof child !== "string")
                walk(child);
        }

        var node = el.node;

        if (!el.children.length)
            return;

        var handler = handlers[node.local];

        if (!handler)
            return;

        var first_na = el.children[0].node.local === "notAllowed" ? 1 : 0;
        var second_na = (el.children[1] &&
                            el.children[1].node.local === "notAllowed") ? 1 : 0;
        var count_na = first_na + second_na;

        if (!count_na)
            return;

        handler(first_na, second_na, count_na, el);
    }

    walk(tree);
}

function step18(tree) {
    var handlers = {
        choice: function (first_empty, second_empty, count_empty, el) {
            if (second_empty) {
                if (!first_empty) {
                    // If a choice has empty in the 2nd position, the
                    // children are swapped.
                    var tmp = el.children[0];
                    el.children = [el.children[1], el.children[0]];
                }
                else
                    // A choice with two empty elements is replaced
                    // with empty.
                    replaceElWith(el, el.children[0]);
            }
        },
        group: function (first_empty, second_empty, count_empty, el) {
            switch(count_empty) {
            case 1:
                // A group (or interleave) with only one empty element
                // is replaced with the non-empty one.
                replaceElWith(el, el.children[ first_empty ? 1 : 0]);
                break;
            case 2:
                // A group (or interleave) with two empty elements is
                // replaced with empty.
                replaceElWith(el, el.children[0]);
                break;
            }
        },
        oneOrMore: function (first_empty, second_empty, count_empty, el) {
            // A oneOrMore with an empty element is replaced with
            // empty. (This won't be called if there are no empty
            // elements in the oneOrMore so we don't test here.)
            replaceElWith(el, el.children[0]);
        }
    };

    handlers.interleave = handlers.group;

    function walk(el) {
        for (var i = 0, child; (child = el.children[i]); ++i) {
            if (typeof child !== "string")
                walk(child);
        }

        var node = el.node;

        if (!el.children.length)
            return;

        var handler = handlers[node.local];

        if (!handler)
            return;

        var first_empty = el.children[0].node.local === "empty" ? 1 : 0;
        var second_empty = (el.children[1] &&
                            el.children[1].node.local === "empty") ? 1 : 0;
        var count_empty = first_empty + second_empty;

        if (!count_empty)
            return;

        handler(first_empty, second_empty, count_empty, el);
    }

    walk(tree);
}


// findBase is not meant to be a general-purpose function but we
// cannot test it if it is not exported.
exports.findBase = findBase;
exports.step1 = step1;
exports.step16 = step16;
exports.step17 = step17;
exports.step18 = step18;

});
