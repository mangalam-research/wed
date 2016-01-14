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

    if context.tunnel:
        context.tunnel.send_signal(signal.SIGTERM)
        context.tunnel = None

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

    if context.builder and context.builder.post_execution:
        context.builder.post_execution()


def start_server(context):
    builder = context.builder
    port = outil.get_unused_port() if not builder.remote else \
        outil.get_unused_sauce_port()

    if port is None:
        raise Exception("unable to find a port for the server")

    port = str(port)
    context.server_port = port

    def start():
        # Start a server just for our tests...
        context.server = subprocess.Popen(["node", "./server.js",
                                           "server", "localhost:" + port])
        # This is the address at which we can control the server
        # locally.
        local_server = "http://localhost:" + port + builder.WED_ROOT
        ssh_tunnel = builder.WED_SSH_TUNNEL
        if builder.remote and ssh_tunnel:
            builder.WED_SERVER = "{0}:{1}{2}".format(
                ssh_tunnel["server"],
                ssh_tunnel["server_port"],
                builder.WED_ROOT)
        else:
            builder.WED_SERVER = local_server

        context.local_server = local_server

        # Try pinging the server util we get a positive response or we've
        # tried enough times to declare failure
        tries = 0
        success = False
        while not success and tries < 10:
            try:
                control(local_server, 'ping', 'failed to ping')
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
    context.sc_tunnel_tempdir = None

    context.selenium_quit = os.environ.get("SELENIUM_QUIT")
    userdata = context.config.userdata
    context.builder = builder = Builder(conf_path, userdata)
    desired_capabilities = {}
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
        visible = context.selenium_quit in ("never", "on-success")
        context.display = Display(visible=visible, size=(1024, 768))
        context.display.start()
        builder.update_ff_binary_env('DISPLAY')
        context.wm = subprocess.Popen(["openbox", "--sm-disable"])
    else:
        context.display = None
        context.wm = None

        ssh_tunnel = builder.WED_SSH_TUNNEL
        if not ssh_tunnel:
            sc_tunnel_id = os.environ.get("SC_TUNNEL_ID")
            if not sc_tunnel_id:
                user, key = builder.SAUCELABS_CREDENTIALS.split(":")
                context.tunnel, sc_tunnel_id, \
                    context.sc_tunnel_tempdir = \
                    outil.start_sc(builder.SC_TUNNEL_PATH, user, key)
            desired_capabilities["tunnel-identifier"] = sc_tunnel_id
        else:
            context.tunnel = \
                subprocess.Popen(
                    ["ssh", ssh_tunnel["ssh_to"],
                     "-R", str(ssh_tunnel["ssh_port"]) + ":localhost:" +
                     context.server_port, "-N"])

    driver = builder.get_driver(desired_capabilities)
    context.driver = driver
    context.util = selenic.util.Util(driver,
                                     # Give more time if we are remote.
                                     4 if builder.remote else 2)
    # Without this, window sizes vary depending on the actual browser
    # used.
    context.initial_window_size = {"width": 1020, "height": 700}
    context.initial_window_handle = driver.current_window_handle

    # IE and Chrome must use nativeEvents. Firefox no longer supports
    # them. It is unclear whether Edge will...
    if context.util.ie or context.util.chrome:
        assert_true(
            driver.desired_capabilities["nativeEvents"],
            "Wed's test suite require that native events be available; "
            "you may have to use a different version of your browser, "
            "one for which Selenium supports native events.")

    behave_wait = os.environ.get("BEHAVE_WAIT_BETWEEN_STEPS")
    context.behave_wait = behave_wait and float(behave_wait)

    context.behave_captions = os.environ.get("BEHAVE_CAPTIONS")

    context.selenium_logs = os.environ.get("SELENIUM_LOGS", False)

    server_thread.join()

    # IE 10 has a problem with self-signed certificates. Selenium
    # cannot tell IE 10 to ignore these problems. Here we work around
    # the issue. This problem occurs only if we are using an SSH
    # tunnel rather than sauce connect.
    if ssh_tunnel and context.util.ie \
       and context.builder.config.version == "10":
        driver.get(builder.WED_SERVER + "/blank")
        # Tried using, execute_script. Did not seem to work.
        driver.get(
            "javascript:((link = document.getElementById("
            "'overridelink')) && link.click())")

    context.start_time = time.time()


def control(server, command, errmsg):
    params = {"command": command}
    resp = requests.post(urljoin(server, '/build/ajax/control'), params)
    assert resp.json() == {}, errmsg


def reset(server):
    control(server, 'reset', 'failed to reset')


def before_scenario(context, scenario):
    driver = context.driver

    if context.active_tag_matcher.should_exclude_with(scenario.effective_tags):
        scenario.skip(reason="Disabled by an active tag")
        return

    if context.behave_captions:
        # We send a comment as a "script" so that we get something
        # in the record of Selenium commands.
        driver.execute_script("// SCENARIO: " + scenario.name + "\n")
    driver.set_window_size(context.initial_window_size["width"],
                           context.initial_window_size["height"])
    driver.set_window_position(0, 0)
    reset(context.local_server)


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

    # Perform this query only if SELENIUM_LOGS is on.
    if context.selenium_logs:
        logs = driver.execute_script("""
        return window.selenium_log;
        """)
        if logs:
            print("")
            print("JavaScript log:")
            print("\n".join(repr(x) for x in logs))
            print("")
            driver.execute_script("""
            window.selenium_log = [];
            """)


def after_all(context):
    print("Elapsed between before_all and after_all:",
          str(datetime.timedelta(seconds=time.time() - context.start_time)))
    cleanup(context, False)
    dump_config(context.builder)
