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
    context.util = selenic.util.Util(driver)
    context.selenic_config = config
    # Without this, window sizes vary depending on the actual browser
    # used.
    driver.set_window_size(1020, 560)
    assert_true(driver.desired_capabilities["nativeEvents"],
                "Wed's test suite require that native events be available; "
                "you may have to use a different version of your browser, "
                "one for which Selenium supports native events.")

    behave_wait = os.environ.get("BEHAVE_WAIT_BETWEEN_STEPS")
    context.behave_wait = behave_wait and float(behave_wait)


def before_scenario(context, _scenario):
    driver = context.driver
    context.before_scenario_window_size = driver.get_window_size()


def after_scenario(context, _scenario):
    driver = context.driver
    util = context.util
    #
    # Make sure we did not trip a fatal error.
    #
    with util.local_timeout(0.5):
        assert_raises(TimeoutException,
                      util.find_element,
                      (By.CLASS_NAME, "wed-fatal-modal"))

    window_size = driver.get_window_size()
    if window_size != context.before_scenario_window_size:
        wedutil.set_window_size(util,
                                context.before_scenario_window_size["width"],
                                context.before_scenario_window_size["height"])


def before_step(context, _step):
    if context.behave_wait:
        time.sleep(context.behave_wait)


def after_all(context):
    driver = context.driver
    config.set_test_status(driver.session_id, not context.failed)
    selenium_quit = os.environ.get("SELENIUM_QUIT")
    if not ((selenium_quit == "never") or
            (context.failed and selenium_quit == "on-success")):
        driver.quit()
