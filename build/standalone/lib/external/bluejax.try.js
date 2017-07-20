/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2016 Louis-Dominique Dubeau
 */
/* global define module require */
(function boot(root, factory) {
  "use strict";

  // The other branches here are actually tested in Mocha, but we cannot *right
  // now* combine the Mocha coverage with the Karma one. So we mark them as
  // ignored.

  /* istanbul ignore else */
  if (typeof define === "function" && define.amd) {
    define(["jquery"], factory);
  }
  /* istanbul ignore next */
  else if (typeof module === "object" && module.exports) {
    // eslint-disable-next-line global-require
    module.exports = factory(require("jquery"));
  }
  /* istanbul ignore next */
  else {
    /* global jQuery */
    root.bluejax = root.bluejax || {};
    root.bluejax.try = factory(jQuery);
  }
}(this, function factory($) {
  "use strict";

  var jqueryMajor = parseInt($.fn.jquery.split(".", 1)[0]);

  // We need this function to handle the ``context`` option. Specifically, when
  // we copy the options we must copy everything *except* ``context``.
  function copyAjaxOptions(options) {
    var savedContext = options.context;
    delete options.context;

    var ret = $.extend(true, {}, options);
    if (savedContext) {
      ret.context = savedContext;
      options.context = savedContext;
    }
    return ret;
  }

  // Extract the Bluejax options from the arguments that were passed to our
  // function. This also normalizes arguments of the signature ``url, settings``
  // to a single ``settings`` object that contains the URL. (See the
  // ``jQuery.ajax`` documentation to see what we are talking about.)
  function extractBluejaxOptions(args) {
    var bluejaxOptions;
    var cleanedOptions;
    var first = args[0];

    if (args.length === 1) {
      if (typeof first !== "object") {
      // We only have a single argument which is not an object. Treat it as the
      // URL.
        cleanedOptions = { url: first };
      }
      else {
        // Our single argument is an object, treat it as ``settings`` in the
        // ``jQuery.ajax`` signature. We copy it because we're going to modify
        // it.
        cleanedOptions = first;
      }
    }
    else if (args.length === 2) {
      // We have two arguments, combine into a single ``settings``.
      cleanedOptions = args[1];
      cleanedOptions.url = first;
    }
    else {
      throw Error("we support 1 or 2 args, got " + args.length);
    }

    bluejaxOptions = cleanedOptions.bluejaxOptions;
    if (bluejaxOptions) {
      cleanedOptions = copyAjaxOptions(cleanedOptions);
      // Grab the copy we've just made.
      bluejaxOptions = cleanedOptions.bluejaxOptions;
      delete cleanedOptions.bluejaxOptions;
    }
    else {
      bluejaxOptions = {};
    }

    // ``bluejaxOptions`` now only contains the options that pertain to
    // Bluejax. ``cleanedOptions`` is what should be passed to ``jQuery.ajax``.
    return [bluejaxOptions, cleanedOptions];
  }

  // Determine whether the error is due to a network problem. We do not perform
  // diagnosis on errors like an HTTP status code of 400 because errors like
  // these are an indication that the application was not queried properly
  // rather than a problem with the server being inaccessible or a network
  // issue. So we need to distinguish network issues from the rest.
  function stockShouldRetry(jqXHR, textStatus) {
    // We don't want to retry when a HTTP error occurred.
    return (jqXHR.status === 0) && (textStatus !== "parsererror") &&
      (textStatus !== "abort");
  }

  // This is the core of the library.
  function Wrapper(originalSettings, jqOptions, bluejaxOptions) {
    this.shouldRetry = bluejaxOptions.shouldRetry || stockShouldRetry;
    this.jqOptions = jqOptions;

    if (bluejaxOptions.tries === undefined) {
      bluejaxOptions.tries = 1;
    }
    this.tries = bluejaxOptions.tries;

    var saved = this.saved = {
      complete: undefined,
      error: undefined,
      statusCode: undefined,
      success: undefined,
    };

    var name;
    this.callbackContext = jqOptions.context || originalSettings;
    delete jqOptions.context;
    for (name in saved) { // eslint-disable-line guard-for-in
      saved[name] = jqOptions[name];
      delete jqOptions[name];
    }

    var me = this;
    var wrapperXhr = this.wrapperXhr = {
      readyState: 0,

      getResponseHeader: function getResponseHeader(key) {
        return this.latestXhr.getResponseHeader(key);
      },

      getAllResponseHeaders: function getAllResponseHeaders() {
        return this.latestXhr.getAllResponseHeaders();
      },

      setRequestHeader: function setRequestHeader(_name, _value) {
        // eslint-disable-next-line no-console
        console.warn("called setRequestHeader a wrapperXhr");
        return this;
      },

      overrideMimeType: function overrideMimeType(_type) {
        // eslint-disable-next-line no-console
        console.warn("called overrideMimeType on a wrapperXhr");
        return this;
      },

      statusCode: function overrideMimeType(_map) {
        // eslint-disable-next-line no-console
        console.warn("called statusCode on a wrapperXhr");
        return this;
      },

      // Cancel the request
      abort: function abort(statusText) {
        var ret = this.latestXhr.abort(statusText);
        me.transferToWrapper(this.latestXhr);
        return ret;
      },
    };

    var deferred = this.deferred = $.Deferred(); // eslint-disable-line new-cap
    deferred.promise(wrapperXhr);

    // eslint-disable-next-line new-cap
    var completeDeferred = $.Callbacks("once memory");

    // jQuery 3 and higher does not support the success, error and complete
    // handlers.  So we do not want to create them for those versions.
    if (jqueryMajor < 3) {
      wrapperXhr.success = wrapperXhr.done;
      wrapperXhr.error = wrapperXhr.fail;
      wrapperXhr.complete = completeDeferred.add;
    }

    // We do not do "statusCode" because it is special.
    completeDeferred.add(saved.complete);
    wrapperXhr.done(saved.success);
    wrapperXhr.fail(saved.error);
  }

  // Transfer properties from an xhr object to the wrapper.
  Wrapper.prototype.transferToWrapper = function transferToWrapper(xhr) {
    var names = ["readyState", "status", "statusText", "responseXML",
                 "responseText"];
    for (var i = 0; i < names.length; ++i) {
      var name = names[i];
      this.wrapperXhr[name] = xhr[name];
    }
  };

  // Handle calling the handlers in the statusCode setting.
  Wrapper.prototype.handleStatusCode = function handleStatusCode(status, args) {
    var map = this.saved.statusCode;
    if (!map) {
      return;
    }

    var fn = map[status];
    if (fn) {
      fn.apply(this.callbackContext, args);
    }
  };

  // Perform one try.
  Wrapper.prototype.iterate = function iterate() {
    this.tries -= 1;
    var thisXhr = $.ajax(this.jqOptions);

    this.wrapperXhr.latestXhr = thisXhr;

    thisXhr.fail(this.failed.bind(this)).done(this.succeeded.bind(this));
    this.transferToWrapper(thisXhr);
  };

  // Handle a query failure by checking whether we should retry,
  // or terminating now.
  Wrapper.prototype.failed = function failed(jqXHR, textStatus, errorThrown) {
    this.transferToWrapper(jqXHR);

    // If we are done with tries or if we should not retry, then terminate now.
    if (this.tries < 1 || !this.shouldRetry(jqXHR, textStatus, errorThrown)) {
      this.deferred.rejectWith(this.callbackContext, [this.wrapperXhr,
                                                      textStatus, errorThrown]);
      this.handleStatusCode(jqXHR.status, [this.wrapperXhr,
                                           textStatus, errorThrown]);
    }
    else {
      // Otherwise, we try again.
      this.iterate();
    }
  };

  // Handle a query success.
  Wrapper.prototype.succeeded = function succeeded(data, textStatus, jqXHR) {
    this.transferToWrapper(jqXHR);
    this.deferred.resolveWith(this.callbackContext, [data, textStatus,
                                                     this.wrapperXhr]);
    this.handleStatusCode(jqXHR.status, [data, textStatus, this.wrapperXhr]);
  };

  function perform(originalSettings, jqOptions, bluejaxOptions) {
    var wrapper = new Wrapper(originalSettings, jqOptions, bluejaxOptions);
    wrapper.iterate();
    return wrapper.wrapperXhr;
  }

  // We need this so that we can use ``make``. The ``override`` parameter is
  // used solely by ``make`` to pass the options that the user specified on
  // ``make``.
  function _ajax(url, settings, override) {
    // We just need to split up the arguments and pass them to ``iterate``.
    var originalArgs = settings ? [url, settings] : [url];
    var originalSettings = settings || url;
    var extracted = extractBluejaxOptions(originalArgs);
    // We need a copy here so that we do not mess up what the user passes to us.
    var bluejaxOptions = $.extend(true, {}, override, extracted[0]);
    var jqOptions = extracted[1];
    return perform(originalSettings, jqOptions, bluejaxOptions);
  }

  // The public face of ``_ajax``.
  function ajax(url, settings) {
    return _ajax(url, settings);
  }

  // Make function that will always use some custom options.
  function make(options) {
    return function customAjax(url, settings) {
      return _ajax(url, settings, options);
    };
  }


  var exports = {
    ajax: ajax,
    make: make,
    perform: perform,
    extractBluejaxOptions: extractBluejaxOptions,
  };

  // ``semver-sync`` detects an assignment to ``exports.version`` and uses the
  // string literal for matching. Messing with this line could make
  // ``semver-sync`` fail.
  exports.version = "1.0.0";

  return exports;
}));
