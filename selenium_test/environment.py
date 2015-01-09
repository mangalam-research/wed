import os
import time
from urlparse import urljoin
import subprocess
import atexit
import signal
import threading
import shutil
import datetime
import httplib

import requests
from requests.exceptions import ConnectionError
from pyvirtualdisplay import Display

# pylint: disable=E0611
from nose.tools import assert_true, assert_false

from selenic import Builder, outil
import selenic.util

_dirname = os.path.dirname(__file__)

conf_path = os.path.join(os.path.dirname(_dirname),
                         "build", "config", "selenium_config.py")

builder = Builder(conf_path)


def dump_config():
    print "***"
    print builder.config
    print "***"


def cleanup(context, failed):
    driver = context.driver

    selenium_quit = context.selenium_quit
    actually_quit = not ((selenium_quit in ("never", "on-enter")) or
                         (context.failed and selenium_quit ==
                          "on-success"))
    if driver:
        try:
            builder.set_test_status(
                driver.session_id, not (failed or context.failed))
        except httplib.HTTPException:
            # Ignore cases where we can't set the status.
            pass

        if actually_quit:
            # Yes, we trap every possible exception. There is not much
            # we can do if the driver refuses to stop.
            try:
                driver.quit()
            except:
                pass
        elif selenium_quit == "on-enter":
            raw_input("Hit enter to quit")
            try:
                driver.quit()
            except:
                pass
        context.driver = None

    if context.sc_tunnel:
        context.sc_tunnel.send_signal(signal.SIGTERM)
        context.sc_tunnel = None

    if context.sc_tunnel_tempdir:
        shutil.rmtree(context.sc_tunnel_tempdir, True)
        context.sc_tunnel_tempdir = None

    if actually_quit:
        if context.wm:
            context.wm.send_signal(signal.SIGTERM)
            context.wm = None

        if context.display:
            context.display.stop()
            context.display = None

    if context.server:
        context.server.send_signal(signal.SIGTERM)
        context.server = None

    if context.selenic.post_execution:
        context.selenic.post_execution()


def start_server(context):
    port = outil.get_unused_port() if not builder.remote else \
        outil.get_unused_sauce_port()

    if port is None:
        raise Exception("unable to find a port for the server")

    port = str(port)

    def start():
        # Start a server just for our tests...
        context.server = subprocess.Popen(["node", "./server.js",
                                           "localhost:" + port])
        builder.WED_SERVER = "http://localhost:" + port + builder.WED_ROOT

        # Try pinging the server util we get a positive response or we've
        # tried enough times to declare failure
        tries = 0
        success = False
        while not success and tries < 10:
            try:
                control(builder.WED_SERVER, 'ping', 'failed to ping')
                success = True
            except ConnectionError:
                time.sleep(0.5)
                tries += 1

        if not success:
            raise Exception("cannot contact server")

    thread = threading.Thread(target=start, name="Server Start Thread")
    thread.start()
    return thread


def before_all(context):
    atexit.register(cleanup, context, True)
    dump_config()

    server_thread = start_server(context)

    context.selenium_quit = os.environ.get("SELENIUM_QUIT")

    context.sc_tunnel = None
    context.sc_tunnel_tempdir = None
    desired_capabilities = {}
    if not builder.remote:
        visible = context.selenium_quit in ("never", "on-success")
        context.display = Display(visible=visible, size=(1024, 768))
        context.display.start()
        builder.update_ff_binary_env('DISPLAY')
        context.wm = subprocess.Popen(["openbox", "--sm-disable"])
    else:
        context.display = None
        context.wm = None

        sc_tunnel_id = os.environ.get("SC_TUNNEL_ID")
        if not sc_tunnel_id:
            user, key = builder.SAUCELABS_CREDENTIALS.split(":")
            context.sc_tunnel, sc_tunnel_id, \
                context.sc_tunnel_tempdir = \
                outil.start_sc(builder.SC_TUNNEL_PATH, user, key)
        desired_capabilities["tunnel-identifier"] = sc_tunnel_id

    driver = builder.get_driver(desired_capabilities)
    context.driver = driver
    context.util = selenic.util.Util(driver,
                                     # Give more time if we are remote.
                                     4 if builder.remote else 2)
    context.selenic = builder
    # Without this, window sizes vary depending on the actual browser
    # used.
    context.initial_window_size = {"width": 1020, "height": 700}
    context.initial_window_handle = driver.current_window_handle
    assert_true(driver.desired_capabilities["nativeEvents"],
                "Wed's test suite require that native events be available; "
                "you may have to use a different version of your browser, "
                "one for which Selenium supports native events.")

    behave_wait = os.environ.get("BEHAVE_WAIT_BETWEEN_STEPS")
    context.behave_wait = behave_wait and float(behave_wait)

    context.behave_captions = os.environ.get("BEHAVE_CAPTIONS")

    context.selenium_logs = os.environ.get("SELENIUM_LOGS", False)

    server_thread.join()
    context.start_time = time.time()

FAILS_IF = "fails_if:"
ONLY_FOR = "only_for:"


def skip_if_needed(context, entity):
    fails_if = []
    for tag in entity.tags:
        if tag.startswith(FAILS_IF):
            fails_if.append(tag[len(FAILS_IF):])

    for spec in fails_if:
        if spec == "osx":
            if context.util.osx:
                entity.mark_skipped()
        elif spec == "win,ff":
            if context.util.windows and context.util.firefox:
                entity.mark_skipped()
        elif spec == "ie":
            if context.util.ie:
                entity.mark_skipped()
        else:
            raise ValueError("can't interpret fails_if:" + spec)

    only_for = []
    for tag in entity.tags:
        if tag.startswith(ONLY_FOR):
            only_for.append(tag[len(ONLY_FOR):])

    for spec in only_for:
        # Only implemented as much as needed here.
        if spec == "ie":
            if not context.util.ie:
                entity.mark_skipped()
        else:
            raise ValueError("can't interpret only_for:" + spec)


def before_feature(context, feature):
    # Some tests cannot be performed on some OSes due to limitations
    # in Selenium or the browser or the OS or what-have-you. There is
    # no real equivalent available to perform these tests so we just
    # skip them.

    skip_if_needed(context, feature)

    # If we're already skipping the feature, we don't need to check
    # individual scenarios.
    if not feature.should_skip:
        for scenario in feature.scenarios:
            skip_if_needed(context, scenario)


def control(server, command, errmsg):
    params = {"command": command}
    resp = requests.post(urljoin(server, '/build/ajax/control'), params)
    assert resp.json() == {}, errmsg


def reset(server):
    control(server, 'reset', 'failed to reset')


def before_scenario(context, scenario):
    driver = context.driver

    if context.behave_captions:
        # We send a comment as a "script" so that we get something
        # in the record of Selenium commands.
        driver.execute_script("// SCENARIO: " + scenario.name + "\n")
    driver.set_window_size(context.initial_window_size["width"],
                           context.initial_window_size["height"])
    driver.set_window_position(0, 0)
    reset(context.selenic.WED_SERVER)


def after_scenario(context, _scenario):
    driver = context.driver

    #
    # Make sure we did not trip a fatal error.
    #
    terminating = context.driver.execute_async_script("""
    var done = arguments[0];

    window.onbeforeunload = function () {};

    if (typeof require === "undefined" || !require.defined) {
        done(false);
        return;
    }

    var onerror_defined = require.defined("wed/onerror");

    define("undefined", function () { return undefined; });

    var deps = [];
    deps.push(onerror_defined ? "wed/onerror" : "undefined");

    deps = deps.concat(require.defined("wed/savers/localforage") ?
      ["wed/savers/localforage", "localforage"] : ["undefined", "undefined"]);

    require(deps, function (onerror, saver, lf) {
      var terminating = onerror && onerror.is_terminating();
      // This clears localforage on pages where it has been loaded
      // and configured by Wed code. We detect this by checking whether the
      // saver has been loaded.
      if (saver) {
        saver.config();
        lf.clear().then(function () {
            // This rigmarole is required to work around a bug in IndexedDB.
            //
            // See https://github.com/mozilla/localForage/issues/154
            //
            // We're basically polling until the length of the database is 0.
            //
            function check() {
                lf.length(function (length) {
                    if (length)
                        setTimeout(check, 100);
                    else {
                        done(terminating);
                        return;
                    }
                });
            }
            check();
        });
      }
      else {
          done(terminating);
          return;
      }
    });
    """)
    assert_false(terminating, "should not have experienced a fatal error")

    # Close all extra tabs.
    handles = driver.window_handles
    if handles:
        for handle in handles:
            if handle != context.initial_window_handle:
                driver.switch_to_window(handle)
                driver.close()
        driver.switch_to_window(context.initial_window_handle)


def before_step(context, step):
    if context.behave_captions:
        # We send a comment as a "script" so that we get something
        # in the record of Selenium commands.
        context.driver.execute_script("// STEP: " + step.keyword + " "
                                      + step.name +
                                      "\n")
    if context.behave_wait:
        time.sleep(context.behave_wait)


def after_step(context, _step):
    driver = context.driver
    # Perform this query only if SELENIUM_LOGS is on.
    if context.selenium_logs:
        logs = driver.execute_script("""
        return window.selenium_log;
        """)
        if logs:
            print
            print "JavaScript log:"
            print "\n".join(repr(x) for x in logs)
            print
            driver.execute_script("""
            window.selenium_log = [];
            """)


def after_all(context):
    print "Elapsed between before_all and after_all:", \
        str(datetime.timedelta(seconds=time.time() - context.start_time))
    cleanup(context, False)
    dump_config()
