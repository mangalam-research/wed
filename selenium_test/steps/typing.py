from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By

from nose.tools import assert_equal  # pylint: disable=E0611
from behave import step_matcher

import wedutil

# Don't complain about redefined functions
# pylint: disable=E0102


@when(u'the user deletes all text letter by letter in an element')
def step_impl(context):
    driver = context.driver
    util = context.util

    element = util.find_element((By.CSS_SELECTOR,
                                 ".__start_label._title_label"))
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
    util = context.util

    element = context.emptied_element
    util.wait(lambda *_: element.find_element(By.CLASS_NAME, "_placeholder"))


@then(u'"{text}" is in the text')
def step_impl(context, text):
    driver = context.driver
    util = context.util

    def condition(*_):
        el_text = util.get_text_excluding_children(
            context.element_to_test_for_text)
        return el_text.find(text) != -1
    util.wait(condition)

step_matcher('re')


@when(u'^the user types (?P<choice>ESCAPE|DELETE|BACKSPACE)$')
def step_impl(context, choice):
    driver = context.driver
    key = getattr(Keys, choice)
    ActionChains(driver)\
        .send_keys(key)\
        .perform()


@then(u'^the last letter of the element\'s text is deleted$')
def step_impl(context):
    driver = context.driver
    util = context.util
    initial_pos = context.caret_position_before_arrow

    util.wait(lambda *_: initial_pos != wedutil.caret_pos(driver))

    initial = context.clicked_element_parent_initial_text
    parent = context.clicked_element_parent
    final = util.get_text_excluding_children(parent)
    assert_equal(initial[:-1], final, "edited text")
