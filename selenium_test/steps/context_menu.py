from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
import selenium.webdriver.support.expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

import selenic.util

from nose.tools import assert_equal, assert_true  # pylint: disable=E0611

step_matcher("re")


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


@When("the user clicks the first context menu option")
def user_clicks_first_context_menu_option(context):
    driver = context.driver
    link = WebDriverWait(driver, 2).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR,
                                    ".wed-context-menu li>a")))
    link.click()


@Then("a context menu appears")
def context_menu_appears(context):
    util = context.util

    util.find_element((By.CLASS_NAME, "wed-context-menu"))


@Then(r'^the context menu contains choices for inserting new elements')
def context_choices_insert(context):
    util = context.util

    cm = util.find_element((By.CLASS_NAME, "wed-context-menu"))
    cm.find_element(By.PARTIAL_LINK_TEXT, "Create new ")


@Given("a context menu is not visible")
@Then("a context menu is not visible")
def context_menu_does_not_visible(context):
    driver = context.driver
    WebDriverWait(driver, 2).until_not(EC.presence_of_element_located(
        (By.CLASS_NAME, "wed-context-menu")))


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
    class Mock(object):
        pass
    trigger = Mock()
    trigger.location = caret.location  # pylint: disable=W0201
    trigger.size = caret.size  # pylint: disable=W0201
    trigger.size["width"] = 0

    ActionChains(driver) \
        .key_down(Keys.CONTROL) \
        .send_keys("/") \
        .key_up(Keys.CONTROL) \
        .perform()

    context.context_menu_trigger = trigger
