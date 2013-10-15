from selenium.webdriver.common.action_chains import ActionChains
import selenium.webdriver.support.expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

import selenic.util

from nose.tools import assert_equal, assert_true  # pylint: disable=E0611

import wedutil

step_matcher("re")


class Trigger(object):
    location = None
    size = None


@Given("that a context menu is open")
def context_menu_is_open(context):
    context.execute_steps(u"""
    When the user uses the mouse to bring up the context menu on text
    Then a context menu appears
    """)


@When("the user uses the mouse to bring up the context menu on a placeholder")
def on_placeholder(context):
    driver = context.driver
    util = context.util

    placeholder = util.find_element((By.CLASS_NAME, "_placeholder"))
    ActionChains(driver) \
        .context_click(placeholder) \
        .perform()
    context.context_menu_trigger = placeholder


@When("the user uses the mouse to bring up the context menu on the start "
      "label of the top element")
def context_menu_on_start_label_of_top_element(context):
    driver = context.driver
    util = context.util

    button = util.find_element((By.CLASS_NAME, "_start_button"))
    ActionChains(driver)\
        .context_click(button)\
        .perform()
    context.context_menu_trigger = button


@When("the user uses the mouse to bring up the context menu on the start "
      "label of an element")
def context_menu_on_start_label_of_element(context):
    driver = context.driver
    util = context.util

    button = util.find_element((By.CSS_SELECTOR, "._start_button._p_label"))
    ActionChains(driver)\
        .context_click(button)\
        .perform()
    context.context_menu_trigger = button


@When("the user uses the mouse to bring up the context menu on the end label "
      "of the top element")
def context_menu_on_end_label_of_top_element(context):
    driver = context.driver
    util = context.util

    button = util.find_elements((By.CLASS_NAME, "_end_button"))[-1]
    driver.execute_script("""
    arguments[0].scrollIntoView();
    """, button)
    ActionChains(driver)\
        .context_click(button)\
        .perform()
    context.context_menu_trigger = button


@When("the user uses the mouse to bring up the context menu on the end label "
      "of an element")
def context_menu_on_end_label_of_element(context):
    driver = context.driver
    util = context.util

    button = util.find_element((By.CSS_SELECTOR, "._end_button._p_label"))
    ActionChains(driver)\
        .context_click(button)\
        .perform()
    context.context_menu_trigger = button


@When("the user uses the mouse to bring up the context menu on text")
def context_menu_on_text(context):
    driver = context.driver
    util = context.util

    element = util.find_element((By.CLASS_NAME, "title"))
    ActionChains(driver)\
        .move_to_element(element)\
        .context_click()\
        .perform()
    context.context_menu_trigger = element


@When("the user uses the mouse to bring up a context menu outside wed")
def context_menu_outside_wed(context):
    driver = context.driver

    # Getting a browser context menu is problematic because there is
    # no cross browser way to dismiss it. So prevent it from comming
    # up but record the event.
    driver.execute_script("""
    var $ = jQuery;
    delete window.__selenic_contextmenu;
    $("body").on("contextmenu.selenium.testing", function () {
       window.__selenic_contextmenu = true;
       return false;
    });
    """)

    # By the time we get here "body" is sure to be present.
    body = driver.find_element_by_tag_name("body")
    ActionChains(driver)\
        .move_to_element_with_offset(body, 0, 0)\
        .context_click()\
        .perform()

    # Check that we did intercept the event.
    assert_true(driver.execute_script("""
    return window.__selenic_contextmenu;
    """))


@When("the user clicks outside the context menu")
def user_clicks_outside_context_menu(context):
    driver = context.driver
    util = context.util

    title = util.find_element((By.CLASS_NAME, "title"))
    # This simulates a user whose hand is not completely steady.
    ActionChains(driver)\
        .move_to_element(title)\
        .move_by_offset(-10, 0)\
        .click_and_hold()\
        .move_by_offset(-1, 0)\
        .release()\
        .perform()


@Then("a context menu appears")
def context_menu_appears(context):
    util = context.util

    util.find_element((By.CLASS_NAME, "wed-context-menu"))


@Then(r'^the context menu contains choices for (?P<kind>.*?)(?:\.|$)')
def context_choices_insert(context, kind):
    util = context.util

    cm = util.find_element((By.CLASS_NAME, "wed-context-menu"))

    search_for = None
    if kind == "inserting new elements":
        search_for = "Create new "
    elif kind == "wrapping text in new elements":
        search_for = "Wrap in "
    else:
        raise ValueError("can't search for choices of this kind: " + kind)

    cm.find_element(By.PARTIAL_LINK_TEXT, search_for)


@Given("a context menu is not visible")
@Then("a context menu is not visible")
def context_menu_is_not_visible(context):
    wedutil.wait_until_a_context_menu_is_not_visible(context.util)


@Then("a context menu is visible close to where the user clicked")
def step_impl(context):
    util = context.util

    menu = util.find_element((By.CLASS_NAME, "wed-context-menu"))
    # The click was in the middle of the trigger.
    trigger = context.context_menu_trigger
    target = trigger.location
    target["x"] += trigger.size["width"] / 2
    target["y"] += trigger.size["height"] / 2
    assert_equal(selenic.util.locations_within(menu.location, target, 10), '')


@When("the user uses the keyboard to bring up the context menu on a "
      "placeholder")
def step_impl(context):
    driver = context.driver
    util = context.util

    placeholder = util.find_element((By.CLASS_NAME, "_placeholder"))
    ActionChains(driver) \
        .click(placeholder) \
        .perform()
    # Because we use the keyboard, the caret is our reference
    caret = util.find_element((By.CLASS_NAME, "_wed_caret"))

    # Mock it. The caret could move or disappear.
    trigger = Trigger()
    trigger.location = caret.location
    trigger.size = caret.size
    trigger.size["width"] = 0

    ActionChains(driver) \
        .key_down(Keys.CONTROL) \
        .send_keys("/") \
        .key_up(Keys.CONTROL) \
        .perform()

    context.context_menu_trigger = trigger


@when(u'the user brings up the context menu on the selection')
def step_impl(context):
    driver = context.driver

    pos = wedutil.point_in_selection(driver)

    # Selenium does not like floats.
    pos["x"] = int(pos["x"])
    pos["y"] = int(pos["y"])

    trigger = Trigger()
    trigger.location = pos
    trigger.size = {'width': 0, 'height': 0}

    ActionChains(driver) \
        .move_to_element_with_offset(context.origin_object, pos["x"],
                                     pos["y"]) \
        .context_click() \
        .perform()

    context.context_menu_trigger = trigger


@given(u'^that the user has brough up the context menu over a selection$')
def step_impl(context):
    context.execute_steps(u"""
    When the user selects text
    And the user brings up the context menu on the selection
    Then a context menu is visible close to where the user clicked
    And the context menu contains choices for wrapping text in new elements.
    """)


@when(u'^the user clicks (?P<choice>the first context menu option|a choice '
      u'for wrapping text in new elements)$')
def step_impl(context, choice):
    util = context.util

    if choice == "the first context menu option":
        link = util.wait(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, ".wed-context-menu li>a")))
    elif choice == "a choice for wrapping text in new elements":
        link = util.wait(EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT,
                                                     "Wrap in ")))
    else:
        raise ValueError("can't handle this type of choice: " + choice)
    context.clicked_context_menu_item = \
        util.get_text_excluding_children(link).strip()
    link.click()
