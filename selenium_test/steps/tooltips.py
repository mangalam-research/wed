from selenium.webdriver.common.action_chains import ActionChains
# pylint: disable=E0611
from nose.tools import assert_true, assert_equal, assert_false
from selenium.webdriver.support.ui import WebDriverWait
import selenium.webdriver.support.expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# Don't complain about redefined functions
# pylint: disable=E0102

step_matcher("re")


@when(ur"^the user moves the mouse over a start label$")
def step_impl(context):
    driver = context.driver
    util = context.util

    label = util.find_element((By.CSS_SELECTOR, ".__start_label"))

    ActionChains(driver) \
        .move_to_element(label) \
        .perform()


@then(ur"^a tooltip comes up")
def step_impl(context):
    util = context.util

    util.find_element((By.CSS_SELECTOR, ".tooltip"))


@given(ur"^there are no tooltips")
@then(ur"^there are no tooltips")
def step_impl(context):
    context.util.wait(lambda driver:
                      len(driver.find_elements_by_css_selector(".tooltip"))
                      == 0)
