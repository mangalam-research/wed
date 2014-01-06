from selenium.webdriver.common.action_chains import ActionChains
# pylint: disable=E0611
from nose.tools import assert_true, assert_equal, assert_false
from selenium.webdriver.support.ui import WebDriverWait
import selenium.webdriver.support.expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

import wedutil
import selenic.util

# Don't complain about redefined functions
# pylint: disable=E0102

step_matcher("re")


@when(u"^an element's label has been clicked$")
def step_impl(context):
    context.execute_steps(u"""
    When the user clicks on an element's label
    Then the label changes to show it is selected
    And the caret disappears
    """)


@when(u"^the user clicks on text$")
def step_impl(context):
    driver = context.driver
    util = context.util
    element = util.find_element((By.CSS_SELECTOR, ".title"))

    rect = driver.execute_script("""
    var title = arguments[0];
    var text = title.childNodes[1]; // At index 0 is the opening label.
    var range = title.ownerDocument.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 1);
    return range.getBoundingClientRect();
    """, element)

    last_click = {"left": int(rect["left"]), "top": int(rect["top"])}
    ActionChains(driver) \
        .move_to_element_with_offset(context.origin_object, last_click["left"],
                                     last_click["top"]) \
        .click() \
        .perform()

    context.last_click = last_click


@then(u"^the caret is at the last click's position\.?$")
def step_impl(context):
    driver = context.driver

    last_click = context.last_click
    caret_pos = wedutil.caret_pos(driver)

    assert_equal(selenic.util.locations_within(caret_pos, last_click, 0), "")


@when(u"^the user clicks on "
      u"(?:an element's label|the end label of an element)$")
def step_impl(context):
    driver = context.driver
    util = context.util

    button = util.find_element((By.CSS_SELECTOR, ".__end_label._title_label"))
    parent = button.find_element_by_xpath("..")
    context.clicked_element = button
    context.clicked_element_parent = parent
    context.clicked_element_parent_initial_text = \
        util.get_text_excluding_children(parent)
    assert_true("_label_clicked" not in button.get_attribute("class").split())
    ActionChains(driver)\
        .click(button)\
        .perform()


@when(ur'^(?:the user )?clicks on the start label of (?P<choice>an element|'
      ur'the first "p" element in "body")$')
def step_impl(context, choice):
    driver = context.driver
    util = context.util

    if choice == "an element":
        button = util.find_element((By.CSS_SELECTOR,
                                    ".__start_label._p_label"))
    elif choice == 'the first "p" element in "body"':
        button = util.find_element((By.CSS_SELECTOR,
                                    ".body .__start_label._p_label"))
    else:
        raise ValueError("unexpected choice: " + choice)

    context.clicked_element = button
    assert_true("_label_clicked" not in button.get_attribute("class").split())
    ActionChains(driver)\
        .click(button)\
        .perform()


@then(u'^the label changes to show it is selected$')
def step_impl(context):
    button = context.clicked_element
    assert_true("_label_clicked" in button.get_attribute("class").split())


@when(u"^(?:the user )?hits the (?P<choice>right|left) arrow$")
def step_impl(context, choice):
    driver = context.driver

    context.caret_position_before_arrow = wedutil.caret_pos(driver)

    key = Keys.ARROW_RIGHT if choice == "right" else Keys.ARROW_LEFT
    ActionChains(driver)\
        .send_keys(key)\
        .perform()


@then(u'^the label of the element that has the context menu is selected.?$')
def step_impl(context):
    trigger = context.context_menu_trigger
    assert_true("_label_clicked" in trigger.el.get_attribute("class").split())


@then(u'^no label is selected$')
def step_impl(context):
    util = context.util
    util.wait_until_not(EC.presence_of_element_located(
        (By.CLASS_NAME, "_label_clicked")))


@then(u'^the caret disappears$')
def step_impl(context):
    driver = context.driver
    WebDriverWait(driver, 2).until_not(EC.presence_of_element_located(
        (By.CLASS_NAME, "_wed_caret")))


# This is also our default for when a mechanism is not specified.
@when(u'^the user selects text(?:|$)(?P<direction>(?:| backwards))'
      ur'(?: with the mouse)?(?:\.)?$')
def step_impl(context, direction):
    driver = context.driver
    util = context.util

    direction = direction.strip()

    element = util.find_element((By.CSS_SELECTOR,
                                 ".__start_label._title_label"))
    parent = element.find_element_by_xpath("..")
    element.click()
    wedutil.wait_for_caret_to_be_in(util, parent)

    # From the label to before the first letter and then past the
    # first letter.
    ActionChains(driver)\
        .send_keys(*[Keys.ARROW_RIGHT] * 2)\
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

    assert_true(util.is_something_selected(), "something must be selected")

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
                                 ".__start_label._title_label"))

    if direction == "":
        # From the label to before the first letter and then past the
        # first letter.
        ActionChains(driver)\
            .click(element)\
            .send_keys(*[Keys.ARROW_RIGHT] * 2)\
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
            .send_keys(*[Keys.ARROW_RIGHT] * (2 + 2))\
            .perform()

         # This moves two caracters to the left with shift down.
        ActionChains(driver)\
            .key_down(Keys.SHIFT)\
            .send_keys(*[Keys.ARROW_LEFT] * 2)\
            .key_up(Keys.SHIFT)\
            .perform()
    else:
        raise ValueError("unexpected direction: " + direction)

    assert_true(util.is_something_selected(), "something must be selected")

    parent = element.find_element_by_xpath("..")
    text = util.get_text_excluding_children(parent)
    context.expected_selection = text[1:3]


@when(u'^the user selects the whole text of an element$')
def step_impl(context):
    driver = context.driver
    util = context.util

    element = util.find_element((By.CSS_SELECTOR,
                                 ".__start_label._title_label"))
    parent = element.find_element_by_xpath("..")

    # From the label to before the first letter.
    ActionChains(driver)\
        .click(element) \
        .send_keys(*[Keys.ARROW_RIGHT] * 1)\
        .perform()

    # This moves 4 characters to the right
    ActionChains(driver)\
        .key_down(Keys.SHIFT)\
        .send_keys(*[Keys.ARROW_RIGHT] * 4)\
        .key_up(Keys.SHIFT)\
        .perform()

    assert_true(util.is_something_selected(), "something must be selected")
    text = util.get_selection_text()
    assert_equal(text, "abcd", "expected selection")

    context.expected_selection = text
    context.selection_parent = parent
    context.caret_position = wedutil.caret_pos(driver)


@when(u'^the user cuts$')
def step_impl(context):
    driver = context.driver
    ActionChains(driver)\
        .key_down(Keys.CONTROL) \
        .send_keys("x") \
        .key_up(Keys.CONTROL) \
        .perform()


@then(u'^the text is cut$')
def step_impl(context):
    util = context.util
    parent = context.selection_parent

    # It may take a bit.
    util.wait(lambda *_: not len(util.get_text_excluding_children(parent)))


@then(ur"^the selection is restored to what it was before the context menu "
      "appeared\.?$")
def step_impl(context):
    util = context.util

    util.wait(lambda *_: util.get_selection_text() ==
              context.expected_selection)


step_matcher("parse")


# This is also our default for when a mechanism is not specified.
@when(u'the user selects text and ends on an element label')
def step_impl(context):
    driver = context.driver
    util = context.util

    element = util.find_element((By.CSS_SELECTOR,
                                 ".__start_label._title_label"))
    # This is where our selection will end
    end = util.element_screen_center(element)
    end["left"] += 2  # Move it off-center for this test

    parent = element.find_element_by_xpath("..")
    element.click()
    wedutil.wait_for_caret_to_be_in(util, parent)

    # From the label to before the first letter and then past the
    # first letter.
    ActionChains(driver)\
        .send_keys(*[Keys.ARROW_RIGHT] * 2)\
        .perform()

    # We need to get the location of the caret.
    start = wedutil.caret_selection_pos(driver)

    wedutil.select_text(driver, start, end)

    assert_true(util.is_something_selected(), "something must be selected")

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


@when("the user selects a region that is malformed")
def step_impl(context):
    driver = context.driver
    util = context.util

    element = util.find_element((By.CSS_SELECTOR,
                                 ".__start_label._title_label"))

    # From the label to before the first letter and then past the
    # first letter.
    ActionChains(driver)\
        .click(element)\
        .send_keys(*[Keys.ARROW_RIGHT] * 3)\
        .perform()

    # This moves 9 caracters to the right with shift down.
    ActionChains(driver)\
        .key_down(Keys.SHIFT)\
        .send_keys(*[Keys.ARROW_RIGHT] * 9)\
        .key_up(Keys.SHIFT)\
        .perform()

    assert_true(util.is_something_selected(), "something must be selected")
