import os
import time

# pylint: disable=E0611
from nose.tools import assert_raises, assert_true
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import TimeoutException

import selenic.util
import wedutil

_dirname = os.path.dirname(__file__)

local_conf_path = os.path.join(os.path.dirname(_dirname),
                               "build", "config", "selenium_local_config.py")

conf_path = os.path.join(os.path.dirname(_dirname),
                         "build", "config", "selenium_test_config.py")

conf = {"__file__": conf_path}
execfile(conf_path, conf)

config = conf["Config"](local_conf_path)


def before_all(context):
    driver = config.get_driver()
    context.driver = driver
    context.util = selenic.util.Util(driver,
                                     # Give more time if we are remote.
                                     4 if config.remote else 2)
    context.selenic_config = config
    # Without this, window sizes vary depending on the actual browser
    # used.
    context.initial_window_size = {"width": 1020, "height": 560}
    assert_true(driver.desired_capabilities["nativeEvents"],
                "Wed's test suite require that native events be available; "
                "you may have to use a different version of your browser, "
                "one for which Selenium supports native events.")

    behave_wait = os.environ.get("BEHAVE_WAIT_BETWEEN_STEPS")
    context.behave_wait = behave_wait and float(behave_wait)

    context.behave_captions = os.environ.get("BEHAVE_CAPTIONS")


def skip_if_needed(context, entity):
    if (context.util.osx and "fails_if:osx" in entity.tags) or \
       (context.util.windows and context.util.firefox and
            "fails_if:win,ff" in entity.tags):
        entity.mark_skipped()


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


def before_scenario(context, scenario):
    driver = context.driver

    if context.behave_captions:
        # We send a comment as a "script" so that we get something
        # in the record of Selenium commands.
        driver.execute_script("// SCENARIO: " + scenario.name + "\n")
    driver.set_window_size(context.initial_window_size["width"],
                           context.initial_window_size["height"])
    context.initial_window_handle = driver.current_window_handle


def after_scenario(context, _scenario):
    driver = context.driver
    util = context.util

    #
    # Make sure we did not trip a fatal error.
    #
    with util.local_timeout(0.1):
        assert_raises(TimeoutException, util.find_element,
                      (By.CLASS_NAME, "wed-fatal-modal"))

    # Close all extra tabs.
    for handle in driver.window_handles:
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
    driver = context.driver
    config.set_test_status(driver.session_id, not context.failed)
    selenium_quit = os.environ.get("SELENIUM_QUIT")
    if not ((selenium_quit == "never") or
            (context.failed and selenium_quit == "on-success")):
        driver.quit()
