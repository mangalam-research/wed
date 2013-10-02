import os

from nose.tools import assert_raises  # pylint: disable=E0611
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import TimeoutException

from selenic import util

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


def after_scenario(context, _scenario):
    driver = context.driver
    #
    # Make sure we did not trip a fatal error.
    #
    assert_raises(TimeoutException,
                  util.find_element, driver,
                  (By.CLASS_NAME, "wed-fatal-modal"))
    #
    # On Firefox, some of the tests may leave the browser's context menu open.
    # This closes it for the next scenario. It has otherwise no effect.
    #
    driver.find_element_by_tag_name("body").send_keys(Keys.ESCAPE)


def after_all(context):
    driver = context.driver
    config.set_test_status(driver.session_id, not context.failed)
    if not context.failed and "BEHAVE_NO_QUIT" not in os.environ:
        driver.quit()
