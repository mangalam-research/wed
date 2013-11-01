from selenium.webdriver.common.action_chains import ActionChains
from nose.tools import assert_true, assert_equal  # pylint: disable=E0611
from selenium.webdriver.support.ui import WebDriverWait
import selenium.webdriver.support.expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

import wedutil

# Don't complain about redefined functions
# pylint: disable=E0102


@when(u"the user clicks on an element's label")
def step_impl(context):
    driver = context.driver
    util = context.util

    button = util.find_element((By.CSS_SELECTOR, "._end_button._p_label"))
    context.clicked_element = button
    assert_true("_button_clicked" not in button.get_attribute("class").split())
    ActionChains(driver)\
        .click(button)\
        .perform()


@when(u"the user hits the right arrow")
def step_impl(context):
    driver = context.driver
    ActionChains(driver)\
        .send_keys(Keys.ARROW_RIGHT)\
        .perform()


@then(u'the label changes to show it is selected')
def step_impl(context):
    button = context.clicked_element
    assert_true("_button_clicked" in button.get_attribute("class").split())


@then(u'no label is selected')
def step_impl(context):
    util = context.util
    util.wait_until_not(EC.presence_of_element_located(
        (By.CLASS_NAME, "_button_clicked")))


@then(u'the caret disappears')
def step_impl(context):
    driver = context.driver
    WebDriverWait(driver, 2).until_not(EC.presence_of_element_located(
        (By.CLASS_NAME, "_wed_caret")))

step_matcher("re")


# This is also our default for when a mechanism is not specified.
@when(u'^the user selects text(?:|$)(?P<direction>(?:| backwards))'
      ur'(?: with the mouse)?(?:\.)?$')
def step_impl(context, direction):
    driver = context.driver
    util = context.util

    direction = direction.strip()

    element = util.find_element((By.CSS_SELECTOR,
                                 "._start_button._title_label"))
    parent = element.find_element_by_xpath("..")
    element.click()
    wedutil.wait_for_caret_to_be_in(util, parent)

    # From the label to before the first letter and then past the
    # first letter.
    ActionChains(driver)\
        .send_keys(*[Keys.ARROW_RIGHT] * 3)\
        .perform()

    # We need to get the location of the caret.
    start = wedutil.caret_selection_pos(driver)
    # This moves two characters to the right
    ActionChains(driver)\
        .send_keys(*[Keys.ARROW_RIGHT] * 2)\
        .perform()
    end = wedutil.caret_selection_pos(driver)

    if direction == "":
        wedutil.select_text(driver, start, end)
    elif direction == "backwards":
        wedutil.select_text(driver, end, start)
    else:
        raise ValueError("unexpected direction: " + direction)

    text = util.get_text_excluding_children(parent)
    context.expected_selection = text[1:3]
    context.selection_parent = parent
    context.caret_position = wedutil.caret_pos(driver)


@when(u'the user selects text(?P<direction>.*?) with the keyboard')
def step_impl(context, direction):
    direction = direction.strip()
    driver = context.driver
    util = context.util

    element = util.find_element((By.CSS_SELECTOR,
                                 "._start_button._title_label"))

    if direction == "":
        # From the label to before the first letter and then past the
        # first letter.
        ActionChains(driver)\
            .click(element)\
            .send_keys(*[Keys.ARROW_RIGHT] * 3)\
            .perform()

         # This moves two caracters to the right with shift down.
        ActionChains(driver)\
            .key_down(Keys.SHIFT)\
            .send_keys(*[Keys.ARROW_RIGHT] * 2)\
            .key_up(Keys.SHIFT)\
            .perform()
    elif direction == "backwards":
        # From the label to before the first letter and then past the
        # first letter, and then two more to the right.
        ActionChains(driver)\
            .click(element)\
            .send_keys(*[Keys.ARROW_RIGHT] * (3 + 2))\
            .perform()

         # This moves two caracters to the left with shift down.
        ActionChains(driver)\
            .key_down(Keys.SHIFT)\
            .send_keys(*[Keys.ARROW_LEFT] * 2)\
            .key_up(Keys.SHIFT)\
            .perform()
    else:
        raise ValueError("unexpected direction: " + direction)

    parent = element.find_element_by_xpath("..")
    text = util.get_text_excluding_children(parent)
    context.expected_selection = text[1:3]


step_matcher("parse")


# This is also our default for when a mechanism is not specified.
@when(u'the user selects text and ends on an element label')
def step_impl(context):
    driver = context.driver
    util = context.util

    element = util.find_element((By.CSS_SELECTOR,
                                 "._start_button._title_label"))
    # This is where our selection will end
    end = util.element_screen_center(element)

    parent = element.find_element_by_xpath("..")
    element.click()
    wedutil.wait_for_caret_to_be_in(util, parent)

    # From the label to before the first letter and then past the
    # first letter.
    ActionChains(driver)\
        .send_keys(*[Keys.ARROW_RIGHT] * 3)\
        .perform()

    # We need to get the location of the caret.
    start = wedutil.caret_selection_pos(driver)

    wedutil.select_text(driver, start, end)

    text = util.get_text_excluding_children(parent)
    context.expected_selection = text[0:1]
    context.selection_parent = parent
    context.caret_position = wedutil.caret_pos(driver)


@then(u'the text is selected')
def step_impl(context):
    driver = context.driver
    util = context.util

    assert_equal(util.get_selection_text(), context.expected_selection)


@when(u"the user clicks on the editor's scrollbar so that the click "
      u"does not move the editor's contents")
def step_impl(context):
    driver = context.driver
    util = context.util

    context.window_scroll_top = util.window_scroll_top()
    context.window_scroll_left = util.window_scroll_left()

    wed = util.find_element((By.CLASS_NAME, "wed-document"))

    scroll_top = util.scroll_top(wed)

    # This location guarantees that we are hitting the scrollbar at the top
    # and should not move the editor's contents
    ActionChains(driver) \
        .move_to_element_with_offset(wed, wed.size["width"] - 1, 1) \
        .click() \
        .perform()

    # Make sure we did nothing.
    assert_equal(scroll_top, util.scroll_top(wed))


@then("the caret moves up relative to the browser window.")
def step_impl(context):
    driver = context.driver
    prev_pos = context.caret_position

    pos = wedutil.caret_pos(driver)

    assert_equal(prev_pos["top"] - context.scrolled_editor_pane_by, pos["top"])
