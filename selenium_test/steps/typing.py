import re

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
    element, context.emptied_element = driver.execute_script("""
    var el = document.querySelector(".__start_label._title_label");
    return [el, el.parentNode];
    """)

    context.element_to_test_for_text = context.emptied_element
    keys = [Keys.ARROW_RIGHT] + [Keys.DELETE] * 20
    ActionChains(driver)\
        .click(element)\
        .send_keys(*keys)\
        .perform()


@given(u'that the user has deleted all the text in an element')
def step_impl(context):
    context.execute_steps(u"""
    When the user deletes all text letter by letter in an element
    Then a placeholder is present in the element
    """)


#
# This was an attempt at turning on an input method in the browser. As
# of 20130926, does not seem possible to do.
#
# @when(u'the user turns on the input method')
# def step_impl(context):
#     driver = context.driver
#     ActionChains(driver)\
#         .key_down(Keys.CONTROL)\
#         .key_down(Keys.ALT)\
#         .send_keys(Keys.SPACE)\
#         .key_up(Keys.ALT)\
#         .key_up(Keys.CONTROL)\
#         .perform()


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


@then(u'ESCAPE is not in the text')
def step_impl(context):
    util = context.util

    def condition(*_):
        el_text = util.get_text_excluding_children(
            context.element_to_test_for_text)
        return el_text.find(u"\u001b") == -1
    util.wait(condition)


@when(u'the user types (?P<choice>ENTER|ESCAPE|DELETE|BACKSPACE|F1)')
def step_impl(context, choice):
    driver = context.driver
    key = getattr(Keys, choice)
    ActionChains(driver)\
        .send_keys(key)\
        .perform()


@when(u'the user undoes')
def step_impl(context):
    context.util.ctrl_equivalent_x("z")


@then(u'the last letter of the element\'s text is deleted')
def step_impl(context):
    driver = context.driver
    util = context.util
    initial_pos = context.caret_position_before_arrow

    util.wait(lambda *_: initial_pos != wedutil.caret_screen_pos(driver))

    initial = context.clicked_element_parent_initial_text
    parent = context.clicked_element_parent
    final = util.get_text_excluding_children(parent)
    assert_equal(initial[:-1], final, "edited text")


@then(ur'the (?P<ordinal>first|second) (?P<what>".*?"|paragraph) in body has '
      ur'the text "(?P<text>.*)"')
def step_impl(context, ordinal, what, text):
    util = context.util
    index = 0 if ordinal == "first" else 1

    if what == "paragraph":
        what = "p"
    else:
        what = what[1:-1]  # drop the quotes.

    els = util.find_elements((By.CSS_SELECTOR, ".body ." +
                              what.replace(":", ur"\:")))

    def cond(*_):
        return util.get_text_excluding_children(els[index]) == text
    util.wait(cond)


@when(ur'the user closes the pasting modal by accepting it')
def step_impl(context):
    button = context.util.find_element(
        (By.CSS_SELECTOR, ".modal.in .btn-primary"))
    button.click()


@then(ur'the text is pasted after the last paragraph')
def step_impl(context):

    def cond(driver):
        text = driver.execute_script("""
        var ps = wed_editor.dataRoot.querySelectorAll("body>p");
        var p = ps[ps.length - 1];
        return p.nextSibling.textContent;
        """)
        return text == context.expected_selection_serialization

    context.util.wait(cond)
