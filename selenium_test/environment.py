import os
import time
from urlparse import urljoin
import subprocess
import atexit
import signal
import threading
import datetime
import httplib

from slugify import slugify
import requests
from requests.exceptions import ConnectionError
from pyvirtualdisplay import Display

# pylint: disable=E0611
from nose.tools import assert_true, assert_false

from behave.tag_matcher import ActiveTagMatcher
from selenic import Builder, outil
import selenic.util

_dirname = os.path.dirname(__file__)

conf_path = os.path.join(os.path.dirname(_dirname),
                         "build", "config", "selenium_config.py")


def dump_config(builder):
    print("***")
    print(builder.config)
    print("***")


def cleanup(context, failed):
    driver = context.driver
    builder = context.builder

    selenium_quit = context.selenium_quit
    actually_quit = not ((selenium_quit in ("never", "on-enter")) or
                         (context.failed and selenium_quit ==
                          "on-success"))
    if driver:
        try:
            builder.set_test_status(not (failed or context.failed))
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

    if context.tunnel_id:
        # The tunnel was created by selenic, ask selenic to kill it.
        builder.stop_tunnel()
        context.tunnel_id = None

    if context.tunnel:
        # Tunnel created by us...
        context.tunnel.send_signal(signal.SIGTERM)
        context.tunnel = None

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

    if context.builder and context.builder.post_execution:
        context.builder.post_execution()


def start_server(context):
    builder = context.builder
    port = builder.get_unused_port()

    if port is None:
        raise Exception("unable to find a port for the server")

    port = str(port)
    context.server_port = port

    def start():
        # Start a server just for our tests...
        context.server = subprocess.Popen(["node", "./misc/server.js",
                                           "localhost:" + port])
        # This is the address at which we can control the server
        # locally.
        local_server = "http://localhost:" + port + builder.WED_ROOT
        local_unoptimized_server = "http://localhost:" + port + \
                                   builder.WED_UNOPTIMIZED_ROOT
        ssh_tunnel = builder.WED_SSH_TUNNEL
        if builder.remote and ssh_tunnel:
            builder.WED_SERVER = "{0}:{1}{2}".format(
                ssh_tunnel["server"],
                ssh_tunnel["server_port"],
                builder.WED_ROOT)
            builder.WED_UNOPTIMIZED_SERVER = "{0}:{1}{2}".format(
                ssh_tunnel["server"],
                ssh_tunnel["server_port"],
                builder.WED_UNOPTIMIZED_ROOT)
        else:
            builder.WED_SERVER = local_server
            builder.WED_UNOPTIMIZED_SERVER = local_unoptimized_server

        context.local_server = local_server

        # Try pinging the server util we get a positive response or we've
        # tried enough times to declare failure
        tries = 0
        success = False
        while not success and tries < 10:
            try:
                requests.get(urljoin(local_server, '/blank'))
                success = True
            except ConnectionError:
                time.sleep(0.5)
                tries += 1

        if not success:
            raise Exception("cannot contact server")

    thread = threading.Thread(target=start, name="Server Start Thread")
    thread.start()
    return thread

screenshots_dir_path = os.path.join("test_logs", "screenshots")


def setup_screenshots(context):
    now = datetime.datetime.now().replace(microsecond=0)
    this_screenshots_dir_path = os.path.join(screenshots_dir_path,
                                             now.isoformat())

    os.makedirs(this_screenshots_dir_path)
    latest = os.path.join(screenshots_dir_path, "LATEST")
    try:
        os.unlink(latest)
    except OSError as ex:
        if ex.errno != 2:
            raise

    os.symlink(os.path.basename(this_screenshots_dir_path),
               os.path.join(screenshots_dir_path, "LATEST"))
    context.screenshots_dir_path = this_screenshots_dir_path


class Top(object):
    driver_meta = None
    driver = None
    util = None
    initial_window_size = None
    initial_window_handle = None


def before_all(context):
    atexit.register(cleanup, context, True)

    # We set these to None explicity so that the cleanup code can run
    # through without error. It assumes that these fields exist.
    context.builder = None
    context.driver = None
    context.wm = None
    context.display = None
    context.server = None
    context.tunnel = None
    context.tunnel_id = None

    context.selenium_quit = os.environ.get("SELENIUM_QUIT")
    userdata = context.config.userdata
    context.builder = builder = Builder(conf_path, userdata)
    ssh_tunnel = None
    dump_config(builder)

    setup_screenshots(context)

    browser_to_tag_value = {
        "INTERNETEXPLORER": "ie",
        "CHROME": "ch",
        "FIREFOX": "ff",
        "EDGE": "edge"
    }

    values = {
        'browser': browser_to_tag_value[builder.config.browser],
    }

    platform = builder.config.platform
    if platform.startswith("OS X "):
        values['platform'] = 'osx'
    elif platform.startswith("WINDOWS "):
        values['platform'] = 'win'
    elif platform == "LINUX" or platform.startswith("LINUX "):
        values['platform'] = 'linux'

    # We have some cases that need to match a combination of platform
    # and browser
    values['platform_browser'] = values['platform'] + "," + values['browser']

    context.active_tag_matcher = ActiveTagMatcher(values)

    server_thread = start_server(context)

    if not builder.remote:
        visible = context.selenium_quit in ("never", "on-success", "on-enter")
        context.display = Display(visible=visible, size=(1024, 768))
        context.display.start()
        builder.update_ff_binary_env('DISPLAY')
        context.wm = subprocess.Popen(["openbox", "--sm-disable"])
    else:
        context.display = None
        context.wm = None

        ssh_tunnel = builder.WED_SSH_TUNNEL
        if not ssh_tunnel:
            tunnel_id = os.environ.get("TUNNEL_ID")
            if not tunnel_id:
                context.tunnel_id = builder.start_tunnel()
            else:
                builder.set_tunnel_id(tunnel_id)
        else:
            context.tunnel = \
                subprocess.Popen(
                    ["ssh", ssh_tunnel["ssh_to"],
                     "-R", str(ssh_tunnel["ssh_port"]) + ":localhost:" +
                     context.server_port, "-N"])

    behave_wait = os.environ.get("BEHAVE_WAIT_BETWEEN_STEPS")
    context.behave_wait = behave_wait and float(behave_wait)

    context.behave_captions = os.environ.get("BEHAVE_CAPTIONS")

    context.selenium_logs = os.environ.get("SELENIUM_LOGS", False)

    server_thread.join()

    context.start_time = time.time()
    context.top = Top()


def dump_javascript_log(context):
    driver = context.driver
    # Perform this query only if SELENIUM_LOGS is on.
    if context.selenium_logs:
        logs = driver.execute_script("""
        var log = window.selenium_log;
        window.selenium_log = [];
        return log;
        """)
        print("")
        if logs:
            print("JavaScript log:")
            print("\n".join(repr(x) for x in logs))
        else:
            print("JavaScript log empty")
        print("")


class DriverMeta(object):
    __counter = 0

    def __init__(self):
        self.number = DriverMeta.__counter
        DriverMeta.__counter += 1
        self.failed = False
        self.scenarios = 0


def before_feature(context, feature):
    if "skip" in feature.tags:
        feature.skip("The feature was marked with @skip")

    if context.top.driver is None:
        builder = context.builder
        driver_meta = context.top.driver_meta = DriverMeta()
        driver = context.top.driver = builder.get_driver({
            "name": "Wed Test ({})".format(driver_meta.number),
        })
        util = context.top.util = selenic.util.Util(driver,
                                                    # Give more time if we are
                                                    # remote.
                                                    4 if builder.remote else 2)
        # Without this, window sizes vary depending on the actual browser
        # used.
        context.top.initial_window_size = {"width": 1020, "height": 700}
        context.top.initial_window_handle = driver.current_window_handle

        # IE and Chrome must use nativeEvents. Firefox no longer supports
        # them. It is unclear whether Edge will...
        if util.chrome:
            assert_true(
                driver.desired_capabilities["nativeEvents"],
                "Wed's test suite require that native events be available; "
                "you may have to use a different version of your browser, "
                "one for which Selenium supports native events.")

    # Drop some values into the context object itself for ease of access.
    context.util = context.top.util
    context.driver = context.top.driver
    context.initial_window_handle = context.top.initial_window_handle


def after_feature(context, feature):
    driver = context.top.driver
    builder = context.builder
    driver_meta = context.top.driver_meta

    # Because we cycle drivers, we have to record that the driver has a failed
    # test in order to mark the test as failed on the remote service side.
    if feature.status == "failed":
        driver_meta.failed = True

    # We cycle drivers only if we are remote and we're dealing with a
    # "problematic" brower. Firefox and Chrome don't need cycling the driver,
    # but IE and Edge do.
    if builder.remote and \
       driver is not None and \
       (context.util.ie or context.util.edge) and \
       driver_meta.scenarios > 30:

        failed = driver_meta.failed
        builder.set_test_status(failed)

        selenium_quit = context.selenium_quit
        actually_quit = not ((selenium_quit == "on-enter") or
                             (failed and selenium_quit == "on-success"))
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
        context.top.driver = None


def before_scenario(context, scenario):
    if "skip" in scenario.effective_tags:
        scenario.skip("The scenario was marked with @skip")
        return

    if context.active_tag_matcher.should_exclude_with(scenario.effective_tags):
        scenario.skip("Disabled by an active tag")
        return

    driver = context.driver

    if context.behave_captions:
        # We send a comment as a "script" so that we get something
        # in the record of Selenium commands.
        driver.execute_script("// SCENARIO: " + scenario.name + "\n")
    driver.set_window_size(context.top.initial_window_size["width"],
                           context.top.initial_window_size["height"])
    driver.set_window_position(0, 0)

    context.top.driver_meta.scenarios += 1


def after_scenario(context, scenario):
    if "skip" in scenario.status:
        return

    driver = context.driver

    # Close all extra tabs.
    handles = driver.window_handles
    if handles:
        for handle in handles:
            if handle != context.top.initial_window_handle:
                driver.switch_to_window(handle)
                driver.close()
        driver.switch_to_window(context.top.initial_window_handle)

    #
    # Make sure we did not trip a fatal error.
    #
    status = driver.execute_async_script("""
    var done = arguments[0];

    window.onbeforeunload = function () {};

    if (typeof require === "undefined") {
        done({ loadError: "no require" });
        return;
    }

    if (!require.defined) {
        done({ loadError: "no require.defined" });
        return;
    }

    var onerror_defined = require.defined("wed/onerror");

    define("undefined", function () { return undefined; });

    var deps = [];
    deps.push(onerror_defined ? "wed/onerror" : "undefined");

    require(deps, function (onerror) {
      var terminating = onerror && onerror.is_terminating();
      done({ terminating: !!terminating });
    }, function (err) {
      done({ loadError: err.toString() });
    });
    """)
    dump_javascript_log(context)
    if "loadError" in status:
        assert_false(status["loadError"])
    assert_false(status["terminating"],
                 "should not have experienced a fatal error")

    # We move to a blank page so as to stop any interaction with the database
    # and then we delete it manually. This is a safer approach than trying to
    # stop actions on an actual test page.
    driver.get(context.builder.WED_SERVER + "/blank.html")
    status = driver.execute_async_script("""
    var done = arguments[0];

    var req = indexedDB.deleteDatabase("wed");
    req.onsuccess = function () {
      done([true, ""]);
    };

    req.onerror = function () {
      done([false, "Error!"]);
    };

    req.onblocked = function () {
      done([false, "Blocked!"]);
    };
    """)

    if not status[0]:
        assert_true(status[0], status[1])


def before_step(context, step):
    if context.behave_captions:
        # We send a comment as a "script" so that we get something
        # in the record of Selenium commands.
        context.driver.execute_script("// STEP: " + step.keyword + " " +
                                      step.name + "\n")
    if context.behave_wait:
        time.sleep(context.behave_wait)


def after_step(context, step):
    driver = context.driver
    if step.status == "failed":
        name = os.path.join(context.screenshots_dir_path,
                            slugify(context.scenario.name + "_" +
                                    step.name) + ".png")
        driver.save_screenshot(name)
        print("")
        print("Captured screenshot:", name)
        print("")

    dump_javascript_log(context)


def after_all(context):
    print("Elapsed between before_all and after_all:",
          str(datetime.timedelta(seconds=time.time() - context.start_time)))
    cleanup(context, False)
    dump_config(context.builder)
