from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By

# Don't complain about redefined functions
# pylint: disable=E0102

step_matcher("re")


@when(ur"the user moves the mouse over a start label")
def step_impl(context):
    driver = context.driver
    util = context.util

    label = util.find_element(
        (By.CSS_SELECTOR, ".__start_label._teiHeader_label"))

    ActionChains(driver) \
        .move_to_element(label) \
        .perform()


@when(ur"the user moves the mouse off the start label")
def step_impl(context):
    driver = context.driver
    util = context.util

    body = util.find_element((By.TAG_NAME, "body"))

    ActionChains(driver) \
        .move_to_element_with_offset(body, 10, 10) \
        .perform()


@when(ur"the user clicks")
def step_impl(context):
    driver = context.driver
    ActionChains(driver) \
        .click() \
        .perform()


@then(ur"a tooltip comes up")
def step_impl(context):
    util = context.util

    util.find_element((By.CSS_SELECTOR, ".tooltip"))


@given(ur"there are no tooltips")
@then(ur"there are no tooltips")
def step_impl(context):
    context.util.wait(lambda driver:
                      len(driver.find_elements_by_css_selector(".tooltip")) ==
                      0)
