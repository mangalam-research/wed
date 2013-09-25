from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
import util

# Don't complain about redefined functions
# pylint: disable=E0102


@when(u'the user deletes all text letter by letter in an element')
def step_impl(context):
    driver = context.driver
    element = util.find_element(driver,
                                (By.CSS_SELECTOR,
                                 "._start_button._title_label"))
    keys = [Keys.ARROW_RIGHT] + [Keys.DELETE] * 20
    ActionChains(driver)\
        .click(element)\
        .send_keys(*keys)\
        .perform()
    context.emptied_element = element.parent


@then(u'a placeholder is present in the element')
def step_impl(context):
    driver = context.driver
    element = context.emptied_element
    util.wait(driver,
              lambda *_: element.find_element(By.CLASS_NAME, "_placeholder"))
