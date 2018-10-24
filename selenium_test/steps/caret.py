from selenium.webdriver.common.action_chains import ActionChains
# pylint: disable=E0611
from nose.tools import assert_true, assert_equal, assert_not_equal, \
    assert_false
import selenium.webdriver.support.expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

import wedutil
import selenic.util

from selenium_test.util import get_element_parent_and_parent_text

# Don't complain about redefined functions
# pylint: disable=E0102

step_matcher("re")


def select_text(context, start, end):
    """
    Sends commands to a Selenium driver to select text.

    :param driver: The Selenium driver to operate on.
    :param start: The start coordinates where to start the selection.
    :type start: ``{"left": x, "top": y}`` where ``x`` and ``y`` are
                 the coordinates.
    :param end: The end coordinates where to end the selection.
    :type end: ``{"left": x, "top": y}`` where ``x`` and ``y`` are
                 the coordinates.
    """

    driver = context.driver
    origin = context.origin_object

    ActionChains(driver)\
        .move_to_element_with_offset(origin, start["left"], start["top"])\
        .click_and_hold()\
        .move_to_element_with_offset(origin, end["left"], end["top"])\
        .release()\
        .perform()


@when(u"an element's label has been clicked")
def step_impl(context):
    context.execute_steps(u"""
    When the user clicks on an element's label
    Then the label changes to show it is selected
    """)


@when(u"the user clicks on text")
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
    // Just returning does not work with IEDriver...
    // return range.getBoundingClientRect();
    var rect = range.getBoundingClientRect();
    var ret = {};
    for (var x in rect)
        ret[x] = rect[x];
    return ret;
    """, element)

    last_click = {"left": round(rect["left"]) + 2,
                  "top": int(rect["top"] + rect["height"] / 2)}

    ActionChains(driver) \
        .move_to_element_with_offset(context.origin_object, last_click["left"],
                                     last_click["top"]) \
        .click() \
        .perform()

    context.last_click = last_click


@then(u"the caret is at the last click's position\.?")
def step_impl(context):
    driver = context.driver

    last_click = context.last_click
    caret_pos = wedutil.caret_selection_pos(driver)

    assert_equal(selenic.util.locations_within(caret_pos, last_click,
                                               5), "")


@then(ur"the caret is at the last position before the focus was lost\.?")
def step_impl(context):
    context.util.wait(lambda driver:
                      context.caret_screen_position_before_focus_loss ==
                      wedutil.caret_screen_pos(driver))


@then(u"the selection is the same as before the focus was lost")
def step_impl(context):
    util = context.util

    assert_equal(util.get_selection_text(), context.expected_selection)


@when(u"the user clicks on "
      u"(?P<what>an element's label|the end label of an element|"
      u'the end label of the last paragraph|'
      u'the end label of the first "addrLine" element)')
def step_impl(context, what):
    driver = context.driver
    util = context.util

    if what in ("an element's label", "the end label of an element"):
        selector = ".__end_label._title_label"
    elif what == "the end label of the last paragraph":
        selector = ".body .__end_label._p_label:last"
    elif what == 'the end label of the first "addrLine" element':
        selector = ".__end_label._addrLine_label"
    else:
        raise Exception("unknown choice: " + what)

    # Faster than using 4 Selenium operations.
    button, parent, button_class, parent_text = driver.execute_script("""
    var selector = arguments[0];

    var button = jQuery(selector)[0];
    var parent = button.parentNode;
    var parent_text = jQuery(parent).contents().filter(function() {
       return this.nodeType == Node.TEXT_NODE;
    }).text();
    // We need this because the Edge driver chokes on properly
    // scrolling the element when we do .click(button)
    button.scrollIntoView();
    return [button, parent, button.className, parent_text];
    """, selector)
    context.clicked_element = button
    context.clicked_element_parent = parent
    context.clicked_element_parent_initial_text = parent_text
    assert_true("_label_clicked" not in button_class.split())
    ActionChains(driver)\
        .click(button)\
        .perform()
    context.context_menu_for = None


@when(u"the user clicks on "
      u"(?P<what>|the start label of an element which has )"
      u"an attribute value that takes completions")
def step_impl(context, what):
    util = context.util
    driver = context.driver

    selector = ".body>.div:nth-of-type(11)>.__start_label._div_label " + \
               ("._attribute_value" if what == "" else "._element_name")
    where = util.find_element((By.CSS_SELECTOR, selector))
    ActionChains(driver) \
        .move_to_element(where) \
        .click() \
        .perform()


@when(ur'(?:the user )?clicks on the start label of (?P<choice>an element|'
      ur'the first "(?P<element>.*?)" element in "body")')
def step_impl(context, choice, element=None):
    driver = context.driver
    util = context.util

    if choice == "an element":
        button = util.find_element((By.CSS_SELECTOR,
                                    ".__start_label._p_label"))
    elif element is not None:
        element = element.replace(":", ur"\:")
        button = util.find_element((By.CSS_SELECTOR,
                                    ".body .__start_label._" + element +
                                    "_label"))
    else:
        raise ValueError("unexpected choice: " + choice)

    context.clicked_element = button
    assert_true("_label_clicked" not in button.get_attribute("class").split())
    ActionChains(driver)\
        .click(button)\
        .perform()


@then(u'the label changes to show it is selected')
def step_impl(context):
    button = context.clicked_element
    assert_true("_label_clicked" in button.get_attribute("class").split())


@then(u'the caret is in the element name in the label')
def step_impl(context):
    util = context.util
    button = context.clicked_element
    en = button.find_element_by_class_name("_element_name")
    wedutil.wait_for_caret_to_be_in(util, en)

_CHOICE_TO_ARROW = {
    "down": Keys.ARROW_DOWN,
    "right": Keys.ARROW_RIGHT,
    "left": Keys.ARROW_LEFT
}


@when(u"(?:the user )?hits the (?P<choice>right|left|down) arrow")
def step_impl(context, choice):
    driver = context.driver

    context.caret_position_before_arrow = wedutil.caret_screen_pos(
        driver)

    key = _CHOICE_TO_ARROW[choice]
    ActionChains(driver)\
        .send_keys(key)\
        .perform()


@then(u'the label of the element that has the context menu is selected.?')
def step_impl(context):
    trigger = context.context_menu_trigger
    assert_true("_label_clicked" in trigger.el.get_attribute("class").split())


@then(u'no label is selected')
def step_impl(context):
    util = context.util
    util.wait_until_not(EC.presence_of_element_located(
        (By.CLASS_NAME, "_label_clicked")))


# This is also our default for when a mechanism is not specified.
@when(u'the user selects text(?P<direction>(?:| backwards))'
      ur'(?: with the mouse)?\.?')
def step_impl(context, direction):
    driver = context.driver
    util = context.util

    direction = direction.strip()

    element, parent, parent_text = get_element_parent_and_parent_text(
        driver, ".__start_label._title_label")
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
        select_text(context, start, end)
    elif direction == "backwards":
        select_text(context, end, start)
    else:
        raise ValueError("unexpected direction: " + direction)

    context.expected_selection = parent_text[1:3]
    context.selection_parent = parent
    context.caret_screen_position = wedutil.caret_screen_pos(driver)


@when(u'the user selects text(?P<direction>.*?) with the keyboard')
def step_impl(context, direction):
    direction = direction.strip()
    driver = context.driver
    util = context.util

    if direction == "":
        keys = (
            # From the label to before the first letter and then past the
            # first letter.
            [Keys.ARROW_RIGHT] * 2 +
            # This moves two caracters to the right with shift down.
            [Keys.SHIFT] + [Keys.ARROW_RIGHT] * 2 + [Keys.SHIFT])
    elif direction == "backwards":
        keys = (
            # From the label to before the first letter and then past the
            # first letter, and then two more to the right.
            [Keys.ARROW_RIGHT] * (2 + 2) +
            # This moves two caracters to the left with shift down.
            [Keys.SHIFT] + [Keys.ARROW_LEFT] * 2 + [Keys.SHIFT])
    else:
        raise ValueError("unexpected direction: " + direction)

    element, _, parent_text = get_element_parent_and_parent_text(
        driver, ".__start_label._title_label")

    ActionChains(driver)\
        .click(element)\
        .perform()

    util.send_keys(element, keys)

    assert_true(util.is_something_selected(), "something must be selected")

    context.expected_selection = parent_text[1:3]


@when(u'the user selects the whole text of '
      u'(?P<what>an element|the first title element|'
      u'the first paragraph in "body")')
def step_impl(context, what):
    driver = context.driver
    util = context.util

    if what == "an element":
        what = "the first title element"

    if what == "the first title element":
        selector = ".__start_label._title_label"
    elif what == 'the first paragraph in "body"':
        selector = ".body .__start_label._p_label"
    else:
        raise ValueError("unknown value for what: " + what)

    element, parent, parent_text = get_element_parent_and_parent_text(
        driver, selector)

    ActionChains(driver)\
        .click(element) \
        .perform()

    util.send_keys(element,
                   # From the label to before the first letter.
                   [Keys.ARROW_RIGHT] +
                   # This select the whole text of the element.
                   [Keys.SHIFT] + [Keys.ARROW_RIGHT] * len(parent_text) +
                   [Keys.SHIFT])

    assert_true(util.is_something_selected(), "something must be selected")
    text = util.get_selection_text()
    assert_equal(text, parent_text, "expected selection")

    context.expected_selection = text
    context.selection_parent = parent
    context.caret_screen_position = wedutil.caret_screen_pos(driver)


@when(u'the user selects the whole contents of the first paragraph in '
      ur'"body"')
def step_impl(context):
    driver = context.driver
    util = context.util

    p = util.find_element((By.CSS_SELECTOR, ".body .p"))

    text = wedutil.select_contents_directly(util, p)

    context.expected_selection_serialization = driver.execute_script("""
    var data_node = wed_editor.toDataNode(arguments[0]);
    var range = document.createRange();
    range.selectNodeContents(data_node);
    var clone = range.cloneContents();
    var parser = new window.DOMParser();
    var doc = parser.parseFromString("<div></div>", "text/xml");
    while(clone.firstChild)
      doc.firstChild.appendChild(clone.firstChild);
    return doc.firstChild.innerHTML;
    """, p)

    context.expected_selection = text
    context.selection_parent = p
    context.caret_screen_position = wedutil.caret_screen_pos(driver)


@when(u'the user selects the "(?P<what>.*?)" of the first title')
def step_impl(context, what):
    driver = context.driver
    util = context.util

    parent = util.find_element((By.CSS_SELECTOR, ".title"))
    label = parent.find_element_by_css_selector(".__start_label._title_label")

    if label.is_displayed():
        ActionChains(driver) \
            .click(label) \
            .perform()
    else:
        ActionChains(driver) \
            .move_to_element_with_offset(parent, 1, 1) \
            .click() \
            .perform()

    # We need to find the text inside the title element
    text = util.get_text_excluding_children(parent)
    start_index = text.find(what)
    assert_true(start_index >= 0, "should have found the text")
    if start_index > 0:
        util.send_keys(parent,
                       # Move the caret to the start of the selection
                       # we want.
                       [Keys.ARROW_RIGHT] * (start_index +
                                             1 if label.is_displayed() else 0))

    start = wedutil.caret_selection_pos(driver)
    util.send_keys(parent,
                   # Move to the end of the selection we want.
                   [Keys.ARROW_RIGHT] * len(what))
    end = wedutil.caret_selection_pos(driver)

    # We don't want to be too close to the edge to handle a problem when
    # labels are. The problem is that when the labels are invisible they
    # have 0 width and it is possible at least that the caret could be
    # put over the invisible label. (That is, instead of the caret being
    # put after the invisible start label, it would be put before the
    # invisible start label.) When a user selects manually, the visual
    # feedback tends to prevent this. In testing, we achieve the same
    # through shifting the boundaries inwards a bit.
    #
    # Note that we've deemed it unnecessary to change the
    # caret/selection code of wed to prevent the caret from moving over
    # an invisible label. The fix would be rather complicated but
    # selecting text by mouse when labels are invisible is a bit dodgy
    # **at any rate**, and we're not going to work around this
    # dodginess. For now, at least.
    start["left"] += 5
    end["left"] -= 5

    select_text(context, start, end)
    assert_equal(util.get_selection_text(), what,
                 "the selected text should be what we wanted to select")
    context.selection_parent = parent
    context.caret_screen_position = wedutil.caret_screen_pos(driver)
    context.element_to_test_for_text = parent


@then(u'the text "abcd" is selected')
def step_impl(context):
    util = context.util

    text = util.get_selection_text()
    assert_equal(text, "abcd", "expected selection")


@when(u'the user cuts')
def step_impl(context):
    wedutil.cut(context.util)


@when(u'the user pastes')
def step_impl(context):
    wedutil.paste(context.util)


@then(u'the text is cut')
def step_impl(context):
    util = context.util
    parent = context.selection_parent

    # It may take a bit.
    util.wait(lambda *_: not len(util.get_text_excluding_children(parent)))


@then(u'the text is pasted')
def step_impl(context):
    util = context.util
    parent = context.selection_parent
    text = context.expected_selection

    # It may take a bit.
    util.wait(lambda *_: util.get_text_excluding_children(parent) == text)


@then(ur"the selection is restored to what it was before the context menu "
      "appeared\.?")
def step_impl(context):
    util = context.util

    util.wait(lambda *_: util.get_selection_text() ==
              context.expected_selection)


@when(ur"the user selects text on (?P<what>an element's label|phantom text)")
def step_impl(context, what):
    driver = context.driver
    label = what == "an element's label"
    selector = ".__end_label._title_label>*" if label else "._text._phantom"

    # Faster than using 4 Selenium operations.
    label, start, end = driver.execute_script("""
    var selector = arguments[0];
    var label = arguments[1];

    var el = jQuery(selector)[0];
    el.scrollIntoView();
    var text = label ? el.firstChild.firstChild : el.firstChild;
    var range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, text.nodeValue.length);
    var rect = range.getBoundingClientRect();
    return [el.parentNode,
            {left: rect.left + 5, top: rect.top + rect.height / 2},
            {left: rect.right - 5, top: rect.top + rect.height / 2}];
    """, selector, label)

    context.clicked_element = label

    select_text(context, start, end)


@given(ur"there is a paragraph that spans multiple lines")
def step_impl(context):
    driver = context.driver

    distance_test, p, start_label, end_label = driver.execute_script("""
    var p = document.querySelectorAll(".body>.p")[6];
    var start_label = p.querySelector(".__start_label._p_label");
    var end_label = p.querySelector(".__end_label._p_label");
    var start_rect = start_label.getBoundingClientRect();
    var end_rect = end_label.getBoundingClientRect();
    // A minium distance of 20 pixels is an arbitrary minimum.
    return [end_rect.top > start_rect.bottom + 20, p, start_label, end_label];
    """)

    assert_true(distance_test, "the labels are not at the desired distance")

    end_label.click()

    # Both must be displayed.
    assert_true(start_label.is_displayed(),
                "the start label should be visible")
    assert_true(end_label.is_displayed(), "the end label should be visible")

    context.multiline_paragraph = p


@when("the user clicks on the last character of the paragraph")
def step_impl(context):
    driver = context.driver
    p = context.multiline_paragraph
    end_label = p.find_element_by_css_selector(".__end_label._p_label")
    end_label.click()
    ActionChains(driver) \
        .send_keys([Keys.ARROW_LEFT]) \
        .perform()
    pos = wedutil.caret_selection_pos(driver)
    ActionChains(driver) \
        .send_keys([Keys.ARROW_LEFT]) \
        .perform()
    pos2 = wedutil.caret_selection_pos(driver)
    ActionChains(driver) \
        .move_to_element_with_offset(context.origin_object,
                                     round(pos["left"] + pos2["left"] / 2),
                                     pos["top"]) \
        .click() \
        .perform()


@then("the caret is set to the last character of the paragraph")
def step_impl(context):
    driver = context.driver
    p = context.multiline_paragraph
    labels = p.find_elements_by_css_selector(
        ".__end_label._p_label._label_clicked")

    assert_equal(len(labels), 0, "the end label should not be clicked")

    # Move onto the label
    ActionChains(driver) \
        .send_keys([Keys.ARROW_RIGHT]) \
        .perform()

    labels = p.find_elements_by_css_selector(
        ".__end_label._p_label._label_clicked")
    assert_equal(len(labels), 1, "the end label should be clicked")


@when(ur"the user clicks on a gui control that contains only text")
def step_impl(context):
    driver = context.driver
    button = driver.find_element_by_class_name("_gui_test")
    button.click()

step_matcher("parse")


# This is also our default for when a mechanism is not specified.
@when(u'the user selects text and ends on an element label')
def step_impl(context):
    driver = context.driver
    util = context.util

    element, parent, parent_text = get_element_parent_and_parent_text(
        driver, ".__start_label._title_label")

    # This is where our selection will end
    end = util.element_screen_center(element)
    end["left"] += 2  # Move it off-center for this test

    element.click()
    wedutil.wait_for_caret_to_be_in(util, parent)

    # From the label to before the first letter and then past the
    # first letter.
    ActionChains(driver)\
        .send_keys(*[Keys.ARROW_RIGHT] * 2)\
        .perform()

    # We need to get the location of the caret.
    start = wedutil.caret_selection_pos(driver)

    select_text(context, start, end)

    assert_true(util.is_something_selected(), "something must be selected")

    context.expected_selection = parent_text[0:1]
    context.selection_parent = parent
    context.caret_screen_position = wedutil.caret_screen_pos(driver)


@then(u'the text is selected')
def step_impl(context):
    util = context.util

    assert_equal(util.get_selection_text(), context.expected_selection)


@when(u"the user clicks on the editor's scrollbar so that the click "
      u"does not move the editor's contents")
def step_impl(context):
    driver = context.driver
    util = context.util

    context.window_scroll_top = util.window_scroll_top()
    context.window_scroll_left = util.window_scroll_left()

    wed = util.find_element((By.CLASS_NAME, "wed-scroller"))

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
    util = context.util
    prev_pos = context.caret_screen_position

    util.wait(lambda *_: wedutil.caret_screen_pos(driver)["top"] ==
              prev_pos["top"] - context.scrolled_editor_pane_by)


@when("the user selects a region that is malformed")
def step_impl(context):
    driver = context.driver
    util = context.util

    element = util.find_element((By.CSS_SELECTOR,
                                 ".__start_label._title_label"))

    ActionChains(driver)\
        .click(element)\
        .perform()

    # On IE, sending the keys to the element itself does not work.
    send_to = element if driver.name != "internet explorer" else \
        util.find_element((By.CSS_SELECTOR, ".wed-document"))

    util.send_keys(send_to,
                   # From the label to before the first letter and then past
                   # the first letter.
                   [Keys.ARROW_RIGHT] * 3 +
                   # This moves 9 caracters to the right with shift down.
                   [Keys.SHIFT] + [Keys.ARROW_RIGHT] * 9 + [Keys.SHIFT])

    assert_true(util.is_something_selected(), "something must be selected")


@when(ur'the user clicks on uneditable text whose parent does not contain "A"')
def step_impl(context):
    driver = context.driver

    el, _, parent_text = get_element_parent_and_parent_text(driver, ".ref")

    ActionChains(driver)\
        .move_to_element_with_offset(el, 1, 1)\
        .click()\
        .perform()

    assert_true(parent_text.find("A") == -1)


@then(u'the uneditable text\'s parent contains "A"')
def step_impl(context):
    driver = context.driver

    _, _, parent_text = get_element_parent_and_parent_text(driver, ".ref")

    assert_true(parent_text.find("A") != -1)


@then(ur"no text is selected")
def step_impl(context):
    util = context.util
    assert_false(util.is_something_selected(), "nothing must be selected")


@when(ur"the user clicks outside the editor pane")
def step_impl(context):
    body = context.driver.find_element_by_tag_name("body")
    ActionChains(context.driver) \
        .move_to_element_with_offset(body, 1, 1) \
        .click() \
        .perform()


@when(ur"the user clicks in the middle of a piece of text")
def step_impl(context):
    util = context.util
    driver = context.driver
    button = util.find_element(
        (By.CSS_SELECTOR, ".body .__start_label._p_label"))
    ActionChains(driver)\
        .click(button)\
        .send_keys([Keys.ARROW_RIGHT] * 6) \
        .perform()

    context.caret_path = driver.execute_script("""
    var caret = wed_editor.caretManager.getDataCaret();
    return [wed_editor.dataUpdater.nodeToPath(caret.node), caret.offset];
    """)

    pos = wedutil.caret_selection_pos(driver)
    # First click away so that the caret is no longer where we left it
    # and the subsequent click moves it again.
    el_pos = util.element_screen_position(button)
    ActionChains(driver) \
        .click(button) \
        .move_to_element_with_offset(button,
                                     pos["left"] - el_pos["left"] + 1,
                                     pos["top"] - el_pos["top"]) \
        .click() \
        .perform()


@then(ur"the caret is set next to the clicked location")
def step_impl(context):
    driver = context.driver
    caret_path = driver.execute_script("""
    var caret = wed_editor.caretManager.getDataCaret();
    return [wed_editor.dataUpdater.nodeToPath(caret.node), caret.offset];
    """)
    assert_equal(context.caret_path, caret_path)
