/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright 2016 Louis-Dominique Dubeau
 */
/* global define module require */
(function boot(root, factory) {
  "use strict";

  if (typeof define === "function" && define.amd) {
    define(["bluejax.try", "jquery", "bluebird"], factory);
  }
  else if (typeof module === "object" && module.exports) {
    /* eslint-disable global-require */
    module.exports = factory(require("bluejax.try"),
                             require("jquery"), require("bluebird"));
  }
  else {
    /* global jQuery Promise */
    root.bluejax = factory(root.bluejax.try, jQuery, Promise);
  }
}(this, function factory(bluetry, $, Promise) {
  "use strict";

  // Utility function for class inheritance.
  function inherit(inheritor, inherited) {
    inheritor.prototype = Object.create(inherited.prototype);
    inheritor.prototype.constructor = inheritor;
  }

  // Utility function for classes that are derived from Error. The prototype
  // name is initially set to some generic value which is not particularly
  // useful. This fixes the problem. We have to pass an explicit string through
  // `name` because on some platforms we cannot count on `cls.name`.
  function rename(cls, name) {
    try {
      Object.defineProperty(cls, "name", { value: name });
    }
    catch (ex) {
      // Trying to defineProperty on `name` fails on Safari with a TypeError.
      if (!(ex instanceof TypeError)) {
        throw ex;
      }
    }
    cls.prototype.name = name;
  }

  // Base class of all errors raised by this library. All errors raised by this
  // library are subclasses of this class. The library never creates instances
  // of this class that are not instances of children of this class (i.e. no
  // ``new GeneralAjaxError(...)``).
  function GeneralAjaxError(jqXHR, textStatus, errorThrown, options) {
    this.jqXHR = jqXHR;
    this.textStatus = textStatus;
    this.errorThrown = errorThrown;

    // ``captureStackTrace`` is not always available.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    else {
      // This will work on many platforms.
      var fakeError = new Error();
      if (fakeError.stack) {
        this.stack = fakeError.stack;
      }
      // However, IE11 and some other platforms do not set the stack until
      // the error is thrown.
      else {
        try {
          throw fakeError;
        }
        catch (ex) {
          this.stack = ex.stack;
        }
      }
    }

    // We try to produce a message that says something useful.
    var message = "Ajax operation failed";
    if (errorThrown) {
      message += ": " + errorThrown + " (" + jqXHR.status + ")";
    }
    else if (textStatus) {
      message += ": " + textStatus;
    }
    message += ".";

    // The user wanted verbose errors to be thrown, so be verbose.
    if (options) {
      message += " Called with: " + JSON.stringify(options);
    }

    this.message = message;
  }

  inherit(GeneralAjaxError, Error);
  rename(GeneralAjaxError, "GeneralAjaxError");

  //
  // The possible values of ``jqXHR.textStatus`` are: ``"success"``,
  // ``"notmodified"``, ``"nocontent"``, ``"error"``, ``"timeout"``,
  // ``"abort"``, or ``"parsererror"``.
  //
  // The values "success" or "notmodified" cannot happen when we raise errors
  // because they are successes.
  //
  // We do not create a more specialized error class for nocontent because
  // that's a kind of buggy state anyway. See this bug report:
  // https://bugs.jquery.com/ticket/13654
  //
  // So the remaining cases are ``"timeout"``, ``"abort"``,
  // ``"parsererror"``. The ``error`` case is special. It is either an HTTP
  // error (an HTTP status different from 200), ``"http"`` in the list here, or
  // it is some other sort of error, ``"ajax"`` in the list.
  var names = ["timeout", "abort", "parsererror", "ajax", "http"];

  // A convenient map used to convert status text to error class.
  var statusToError = {};

  // A map of error class name to actual class.
  var errors = {};

  for (var i = 0; i < names.length; ++i) {
    var name = names[i];
    var className;

    // We convert the name from our array into the real name we want to give to
    // the class (e.g. ``"timeout"`` > ``TimeoutError``.
    if (name !== "parsererror") {
      className = name[0].toUpperCase() + name.slice(1) + "Error";
    }
    else {
      // The default code would yield ParsererrorError.
      className = "ParserError";
    }

    // eslint-disable-next-line func-names
    var cls = function () {
      GeneralAjaxError.apply(this, arguments);
    };

    statusToError[name] = cls;
    errors[className] = cls;
    inherit(cls, GeneralAjaxError);
    rename(cls, className);
  }

  // Given a ``jqXHR`` that failed, create an error object.
  function makeError(jqXHR, textStatus, errorThrown, options) {
    var Constructor = statusToError[textStatus];

    // We did not find anything in the map, which would happen if the textStatus
    // was "error". Determine whether an ``HttpError`` or an ``AjaxError`` must
    // be thrown.
    if (!Constructor) {
      Constructor = statusToError[(jqXHR.status !== 0) ? "http" : "ajax"];
    }

    return new Constructor(jqXHR, textStatus, errorThrown, options);
  }

  // Base class for all errors raised that have to do with network connectivity.
  function ConnectivityError(message, original) {
    GeneralAjaxError.call(this);
    this.message = message;
    this.originalError = original;
  }

  errors.ConnectivityError = ConnectivityError;
  inherit(ConnectivityError, GeneralAjaxError);
  rename(ConnectivityError, "ConnectivityError");

  function BrowserOfflineError(original) {
    ConnectivityError.call(this, "your browser is offline", original);
  }

  errors.BrowserOfflineError = BrowserOfflineError;
  inherit(BrowserOfflineError, ConnectivityError);
  rename(BrowserOfflineError, "BrowserOfflineError");

  function ServerDownError(original) {
    ConnectivityError.call(this, "the server appears to be down", original);
  }

  errors.ServerDownError = ServerDownError;
  inherit(ServerDownError, ConnectivityError);
  rename(ServerDownError, "ServerDownError");

  function NetworkDownError(original) {
    ConnectivityError.call(this, "the network appears to be down", original);
  }

  errors.NetworkDownError = NetworkDownError;
  inherit(NetworkDownError, ConnectivityError);
  rename(NetworkDownError, "NetworkDownError");

  // For the ``ajax()`` function cannot use:
  //
  // return Promise.resolve($.ajax.apply($.ajax, arguments))
  //     .catch(function (e) {
  //        throw new GeneralAjaxError(e.jqXHR, e.textStatus, e.errorThrown);
  //      });
  //
  // Because what is passed to ``.catch`` is the ``jqXHR`` (so the
  // code above cannot work). ``textStatus`` and ``errorThrown`` are
  // lost.
  //
  // We furthermore cannot use:
  //
  // return Promise.resolve(
  //        $.ajax.apply($.ajax, arguments)
  //            .fail(function (...) {
  //                throw new GeneralAjaxError(...);
  //            }));
  //
  // Because there exist conditions under which $.ajax will fail
  // immediately, call the ``.fail`` handler immediately and cause
  // the exception to be raised before ``Promise.resolve`` has been
  // given a chance to work. This means that some ajax errors won't
  // be catchable through ``Promise.catch``.
  //

  // Make sure ``url`` is unique. We do this by appending a query parameter with
  // the current time. This is done to bust caches.
  function dedupURL(url) {
    // If there is no query yet, we just add a query, otherwise we add a
    // parameter to the query.
    url += (url.indexOf("?") < 0) ? "?" : "&_=";
    return url + Date.now();
  }

  // If ``url`` ends with a forward slash and does not have a query yet, make it
  // point to ``favicon.ico``, which is an easy URL to use for checking if a
  // server is up. The favicon would normally be relatively small. The root of a
  // site like google.com is likely to be much bigger than the favicon. Some
  // sites may have specialized URLs for this, which is why if ``url`` does not
  // end with a forward slash or a query, we do not modify
  // it. (E.g. http://example.com/ping would not be modified.)
  function normalizeURL(url) {
    if (url[url.length - 1] === "/" && url.indexOf("?") < 0) {
      url += "favicon.ico";
    }

    return url;
  }

  // This is called once we know a) the browser is not offline but b) we cannot
  // reach the server that should serve our request.
  function connectionCheck(error, diagnose) {
    var servers = diagnose.knownServers;

    // Nothing to check so we fail immediately.
    if (!servers || servers.length === 0) {
      throw new ServerDownError(error);
    }

    // We check all the servers that the user asked to check. If none respond,
    // we blame the network. Otherwise, we blame the server.
    return Promise.all(servers.map(function urlToAjax(url) {
      // eslint-disable-next-line no-use-before-define
      return ajax({ url: dedupURL(normalizeURL(url)), timeout: 1000 })
        .reflect();
    })).filter(function filterSuccessfulServers(result) {
      return result.isFulfilled();
    }).then(function checkAnyFullfilled(fulfilled) {
      if (fulfilled.length === 0) {
        throw new NetworkDownError(error);
      }

      throw new ServerDownError(error);
    });
  }

  // This is called when our tries all failed. This function attempts to figure
  // out where the issue is.
  function diagnoseIt(error, diagnose) {
    // The browser reports being offline, blame the problem on this.
    if (("onLine" in navigator) && !navigator.onLine) {
      throw new BrowserOfflineError(error);
    }

    var serverURL = diagnose.serverURL;
    var check;
    // If the user gave us a server URL to check whether the server is up at
    // all, use it. If that failed, then we need to check the connection. If we
    // do not have a server URL, then we need to check the connection right
    // away.
    if (serverURL) {
      // eslint-disable-next-line no-use-before-define
      check = ajax({ url: dedupURL(normalizeURL(serverURL)) })
        .catch(function failed() {
          return connectionCheck(error, diagnose);
        });
    }
    else {
      check = connectionCheck(error, diagnose);
    }

    return check.then(function success() {
      // All of our checks passed... and we have no tries left, so just rethrow
      // what we would have thrown in the first place.
      throw error;
    });
  }

  // Determine whether the error is due to a network problem. We do not perform
  // diagnosis on errors like an HTTP status code of 400 because errors like
  // these are an indication that the application was not queried properly
  // rather than a problem with the server being inaccessible or a network
  // issue. So we need to distinguish network issues from the rest.
  function isNetworkIssue(error) {
    // We don't want to retry when a HTTP error occurred.
    return !(error instanceof errors.HttpError) &&
      !(error instanceof errors.ParserError) &&
      !(error instanceof errors.AbortError);
  }

  // This is the core of the functionality provided by Bluejax.
  function doit(originalArgs, originalSettings, jqOptions, bjOptions) {
    var xhr;
    var p = new Promise(function resolver(resolve, reject) {
      xhr = bluetry.perform.call(this, originalSettings, jqOptions, bjOptions);
      function succeded(data, textStatus, jqXHR) {
        resolve(bjOptions.verboseResults ? [data, textStatus, jqXHR] : data);
      }

      function failed(jqXHR, textStatus, errorThrown) {
        var error = makeError(
          jqXHR, textStatus, errorThrown,
          bjOptions.verboseExceptions ? originalArgs : null);

        if (!isNetworkIssue(error)) {
          // As mentioned earlier, errors that are not due to the network cause
          // an immediate rejection: no diagnosis.
          reject(error);
        }
        else {
          // Move to perhaps diagnosing what could be the problem.
          var diagnose = bjOptions.diagnose;
          if (!diagnose || !diagnose.on) {
            // The user did not request diagnosis: fail now.
            reject(error);
          }
          else {
            // Otherwise, we perform the requested diagnosis.  We cannot just
            // call ``reject`` with the return value of ``diagnoseIt``, as the
            // rejection value would be a promise and not an error. (``resolve``
            // assimilates promises, ``reject`` does not).
            resolve(diagnoseIt(error, diagnose));
          }
        }
      }

      xhr.fail(failed).done(succeded);
    });

    return { xhr: xhr, promise: p };
  }

  // We need this so that we can use ``make``. The ``override`` parameter is
  // used solely by ``make`` to pass the options that the user specified on
  // ``make``.
  function _ajax$(url, settings, override) {
    // We just need to split up the arguments and pass them to ``doit``.
    var originalArgs = settings ? [url, settings] : [url];
    var originalSettings = settings || url;
    var extracted = bluetry.extractBluejaxOptions(originalArgs);
    // We need a copy here so that we do not mess up what the user passes to us.
    var bluejaxOptions = $.extend({}, override, extracted[0]);
    var cleanedOptions = extracted[1];
    return doit(originalArgs, originalSettings, cleanedOptions, bluejaxOptions);
  }

  function _ajax(url, settings, override) {
    return _ajax$(url, settings, override).promise;
  }

  // The public face of ``_ajax``.
  function ajax(url, settings) {
    return _ajax(url, settings);
  }

  function ajax$(url, settings) {
    return _ajax$(url, settings);
  }

  function make(options, field) {
    return function customAjax(url, settings) {
      var ret = _ajax$(url, settings, options);

      if (!field) {
        return ret;
      }

      return ret[field];
    };
  }

  var exports = {
    try: bluetry,
    ajax: ajax,
    ajax$: ajax$,
    GeneralAjaxError: GeneralAjaxError,
    make: make,
  };

  // ``semver-sync`` detects an assignment to ``exports.version`` and uses the
  // string literal for matching. Messing with this line could make
  // ``semver-sync`` fail.
  exports.version = "1.1.0";

  // Export the errors.
  for (var x in errors) { // eslint-disable-line guard-for-in
    exports[x] = errors[x];
  }

  return exports;
}));

//  LocalWords:  jquery eslint jQuery GeneralAjaxError captureStackTrace jqXHR
//  LocalWords:  textStatus notmodified nocontent parsererror http ajax func
//  LocalWords:  TimeoutError ParsererrorError ParserError HttpError AjaxError
//  LocalWords:  Bluejax url bluejaxOptions defaultOptions cleanedOptions MPL
//  LocalWords:  errorThrown onLine favicon ico google diagnoseIt doit semver
