import os

from nose.tools import assert_raises  # pylint: disable=E0611
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import TimeoutException
from selenium.webdriver.common.action_chains import ActionChains

import selenic.util

_dirname = os.path.dirname(__file__)

local_conf_path = os.path.join(os.path.dirname(_dirname),
                               "build", "config", "selenium_local_config.py")

conf_path = os.path.join(os.path.dirname(_dirname),
                         "build", "config", "selenium_test_config.py")

conf = {"__file__": conf_path}
execfile(conf_path, conf)

config = conf["Config"](local_conf_path)


def before_all(context):
    context.driver = config.get_driver()
    context.util = selenic.util.Util(context.driver)


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
        driver.set_window_size(context.before_scenario_window_size["width"],
                               context.before_scenario_window_size["height"])


def after_all(context):
    driver = context.driver
    config.set_test_status(driver.session_id, not context.failed)
    if not context.failed and "BEHAVE_NO_QUIT" not in os.environ:
        driver.quit()
