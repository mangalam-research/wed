from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By

from selenic import util

# Don't complain about redefined functions
# pylint: disable=E0102


@when(u'the user deletes all text letter by letter in an element')
def step_impl(context):
    driver = context.driver
    element = util.find_element(driver,
                                (By.CSS_SELECTOR,
                                 "._start_button._title_label"))
    context.emptied_element = element.find_element_by_xpath("..")
    keys = [Keys.ARROW_RIGHT] + [Keys.DELETE] * 20
    ActionChains(driver)\
        .click(element)\
        .send_keys(*keys)\
        .perform()


#
# This was an attempt at turning on an input method in the browser. As
# of 20130926, does not seem possible to do.
#
@when(u'the user turns on the input method')
def step_impl(context):
    driver = context.driver
    ActionChains(driver)\
        .key_down(Keys.CONTROL)\
        .key_down(Keys.ALT)\
        .send_keys(Keys.SPACE)\
        .key_up(Keys.ALT)\
        .key_up(Keys.CONTROL)\
        .perform()


@when(u'the user types "{text}"')
def step_impl(context, text):
    driver = context.driver
    ActionChains(driver)\
        .send_keys(text)\
        .perform()


@then(u'a placeholder is present in the element')
def step_impl(context):
    driver = context.driver
    element = context.emptied_element
    util.wait(driver,
              lambda *_: element.find_element(By.CLASS_NAME, "_placeholder"))


@then(u'"{text}" is in the text')
def step_impl(context, text):
    driver = context.driver

    def condition(*_):
        el_text = util.get_text_excluding_children(
            driver, context.element_to_test_for_text)
        return el_text.find(text) != -1
    util.wait(driver, condition)
