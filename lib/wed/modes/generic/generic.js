/**
 * @module modes/generic/generic
 * @desc The main module for the generic mode.
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
define(/** @lends module:modes/generic/generic*/function f(require, exports) {
  "use strict";

  var Mode = require("../../mode").BaseMode;
  var NameResolver = require("salve").NameResolver;
  var oop = require("../../oop");
  var GenericDecorator = require("./generic_decorator").GenericDecorator;
  var makeTagTr = require("./generic_tr").makeTagTr;
  var $ = require("jquery");
  var object_check = require("../../object_check");
  var Promise = require("bluebird");

  /**
   * @classdesc This is the class that implements the generic
   * mode. This mode decorates all the elements of the file being
   * edited. On the basis of the schema used by wed for validation, it
   * allows the addition of the elements authorized by the schema.
   *
   * Recognized options:
   *
   * - ``meta``: this option can be a path (a string) pointing to a
   *   module that implements the meta object needed by the mode. Or it
   *   can be an object of the form:
   *
   *         {
   *             path: "path/to/the/meta",
   *             options: {
   *                 // Meta-specific options.
   *             }
   *         }
   *
   * - ``autoinsert``: whether or not to fill newly inserted elements as
   *   much as possible. If this option is true, then when inserting a
   *   new element, the mode will try to detect whether the element has
   *   any mandatory children and if so will add these children to the
   *   element. For instance, if ``foo`` is invalid without the child
   *   ``baz`` then when inserting ``foo`` in the document, the
   *   following structure would be inserted
   *   ``<foo><baz></baz></foo>``. This automatic insertion of children
   *   happens only in non-ambiguous cases. Taking the same example as
   *   before, if ``foo`` could contain ``a`` or ``b``, then the mode
   *   won't add any children. This option is ``true`` by default.
   *
   * @alias Mode
   * @constructor
   * @extends module:mode~Mode
   * @param {module:wed~Editor} editor The editor with which the mode is
   * being associated.
   * @param {Object} options The options for the mode.
   */
  // eslint-disable-next-line no-unused-vars
  function GenericMode(editor, options) {
    Mode.apply(this, arguments);

    if (this.constructor === GenericMode) {
      // Set our metadata.
      this.wedOptions.metadata = {
        name: "Generic",
        authors: ["Louis-Dominique Dubeau"],
        description:
        "This is a basic mode bundled with wed and which can, " +
          "and probably should be used as the base for other modes.",
        license: "MPL 2.0",
        copyright:
        "2013, 2014 Mangalam Research Center for Buddhist Languages",
      };
    }
    // else it is up to the derived class to set it.

    var template = {
      meta: true,
      autoinsert: false,
    };

    var ret = object_check.check(template, this.options);

    if (this.options.autoinsert === undefined) {
      this.options.autoinsert = true;
    }

    var errors = [];
    if (ret.missing) {
      ret.missing.forEach(function each(name) {
        errors.push("missing option: " + name);
      });
    }

    if (ret.extra) {
      ret.extra.forEach(function each(name) {
        errors.push("extra option: " + name);
      });
    }

    if (errors.length) {
      throw new Error("incorrect options: " + errors.join(", "));
    }
    this.wedOptions.attributes = "edit";
  }

  oop.inherit(GenericMode, Mode);

  GenericMode.prototype.init = function init() {
    var superInit = Mode.prototype.init;
    var initial;
    if (superInit) {
      initial = superInit.apply(this, arguments);
    }
    else {
      initial = Promise.resolve();
    }
    this._tag_tr = makeTagTr(this.editor);
    return initial
      .then(function aferInitial() {
        var options = this.options;
        var resolved = $.extend(true, {}, options);
        if (options && options.meta) {
          var meta = resolved.meta;
          if (typeof meta === "string") {
            meta = resolved.meta = {
              path: meta,
            };
          }
          else if (typeof meta.path !== "object") {
            return this.editor.runtime.resolveModules(meta.path)
              .then(function loaded(mods) {
                var mod = mods[0];
                resolved.meta.path = mod;
                this.options = resolved;
              }.bind(this));
          }
        }

        return undefined;
      }.bind(this))
      .then(function afterResolved() {
        var MetaClass = this.options.meta.path.Meta;
        this._meta = new MetaClass(this.editor.runtime, this.options.meta.options);
        return this._meta.init();
      }.bind(this)).then(function metaReady() {
        this._resolver = new NameResolver();
        var mappings = this._meta.getNamespaceMappings();
        Object.keys(mappings).forEach(function each(key) {
          this._resolver.definePrefix(key, mappings[key]);
        }.bind(this));
      }.bind(this));
  };


  GenericMode.prototype.getAbsoluteResolver = function getAbsoluteResolver() {
    return this._resolver;
  };

  GenericMode.prototype.makeDecorator = function makeDecorator() {
    var obj = Object.create(GenericDecorator.prototype);
    var args = Array.prototype.slice.call(arguments);
    args = [this, this._meta, this.options].concat(args);
    GenericDecorator.apply(obj, args);
    return obj;
  };

  /**
   * Returns a short description for an element. The element should be
   * named according to the mappings reported by the resolve returned by
   * {@link module:mode~Mode#getAbsoluteResolver
   * getAbsoluteResolver}. The generic mode delegates the call to the
   * meta object it was asked to use.
   *
   * @param {string} name The name of the element.
   * @returns {string|null|undefined} The description. If the value
   * returned is ``undefined``, then the description is not available. If the
   * value returned is ``null``, the description has not been loaded
   * yet.
   */
  GenericMode.prototype.shortDescriptionFor =
    function shortDescriptionFor(name) {
      return this._meta.shortDescriptionFor(name);
    };

  /**
   * Returns a URL to the documentation for an element. The element
   * should be named according to the mappings reported by the resolve
   * returned by {@link module:mode~Mode#getAbsoluteResolver
   * getAbsoluteResolver}. The generic mode delegates the call to the
   * meta object it was asked to use.
   *
   * @param {string} name The name of the element.
   * @returns {string|null|undefined} The URL. If the value returned is
   * ``undefined``, then URL is not available. If the value returned is
   * ``null``, the URL has not been loaded yet.
   */
  Mode.prototype.documentationLinkFor = function documentationLinkFor(name) {
    return this._meta.documentationLinkFor(name);
  };

  /**
   * The generic mode's implementation merely returns what it has stored
   * in its transformation registry.
   */
  Mode.prototype.getContextualActions =
    // eslint-disable-next-line no-unused-vars
    function getContextualActions(type, tag, container, offset) {
      if (!(type instanceof Array)) {
        type = [type];
      }

      var ret = [];
      for (var ix = 0; ix < type.length; ix++) {
        var val = this._tag_tr[type[ix]];
        if (val !== undefined) {
          ret.push(val);
        }
      }
      return ret;
    };

  exports.Mode = GenericMode;
});

//  LocalWords:  gui jquery Mangalam MPL Dubeau
