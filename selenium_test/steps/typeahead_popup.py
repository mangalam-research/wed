from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from nose.tools import assert_equal, assert_true
from selenic.util import Result, Condition

step_matcher("re")


@when(ur"(?P<step>the user opens the typeahead popup"
      ur"(?P<where> at the end of the title text)?)")
@given("(?P<step>that a typeahead popup is open)")
def step_impl(context, step, where=None):
    driver = context.driver
    util = context.util

    if step.startswith("that a typeahead"):
        element, ph = driver.execute_script("""
        var ph = document.querySelector(".p>._placeholder");
        return [ph.parentNode, ph];
        """)
        ActionChains(driver) \
            .click(ph) \
            .perform()
        # ph.click()
    elif where:
        element = driver.execute_script("""
        var title = document.querySelector("._real.title");
        var text;
        var child = title.firstChild;
        while (child && !text) {
            if (child.nodeType === Node.TEXT_NODE)
                text = child;
            child = child.nextSibling;
        }
        wed_editor.caretManager.setCaret(text, text.length);
        return title;
        """)
    else:
        element = None

    util.ctrl_equivalent_x("/")

    context.context_menu_for = element
    context.execute_steps(u"""
    When the user clicks the choice named "Test typeahead"
    """)

    def check(driver):
        ret = driver.execute_script("""
        var input = document.querySelector(
          '.wed-typeahead-popup input.tt-input');
        if (!input)
          return [false, "cannot find input element"];
        return [document.activeElement === input, "input not focused"];
        """)
        return Result(ret[0], ret[1])

    result = Condition(util, check).wait()
    assert_true(result, result.payload)

    # Move the mouse pointer out of the way. The problem is that if we leave he
    # mouse pointer where it is, then it is hovering over the completion
    # menu. This is a problem because the hover is treated as a user action,
    # and the choice under the mouse pointer is effectively selected. It did
    # not use to be a problem but a change in Selenium or Chrome made it an
    # issue. :-/
    ActionChains(driver) \
        .move_to_element(context.origin_object) \
        .perform()


@then("the typeahead popup is not visible")
def step_impl(context):
    util = context.util

    util.wait(
        lambda driver:
        len(driver.find_elements_by_class_name("wed-typeahead-popup")) == 0)


@then("the typeahead popup's action (?P<is_>is|is not) performed")
def step_impl(context, is_):
    util = context.util

    element = context.context_menu_for
    expected = "Test 0" if is_ == "is" else ""
    assert_equal(util.get_text_excluding_children(element), expected)


@when(ur"the user clicks the first typeahead choice")
def step_impl(context):
    util = context.util

    element = util.find_element(
        (By.CSS_SELECTOR, ".wed-typeahead-popup .tt-menu .tt-suggestion"))
    element.click()


@when(ur"the user clicks outside the typeahead")
def step_impl(context):
    util = context.util

    title = util.find_element((By.CLASS_NAME, "title"))
    ActionChains(context.driver) \
        .click(title) \
        .perform()


@then(ur"the typeahead popup's choice list has a vertical scrollbar")
def step_impl(context):
    def check(driver):
        return driver.execute_script("""
        var menu = document.getElementsByClassName("tt-menu")[0];
        var menu_style = window.getComputedStyle(menu);
        var left_border =
          Number(menu_style.getPropertyValue("border-left-width")
            .replace("px", ""));
        var right_border =
          Number(menu_style.getPropertyValue("border-right-width")
            .replace("px", ""));
        return menu.clientWidth <
          menu.offsetWidth - left_border - right_border;
        """)

    context.util.wait(check)


@then(ur"the typeahead popup is visible and completely inside the window")
def step_impl(context):
    util = context.util

    popup = util.find_element((By.CLASS_NAME, "wed-typeahead-popup"))
    assert_true(util.completely_visible_to_user(popup),
                "menu is completely visible")


@then(ur'the typeahead popup overflows the editor pane')
def step_impl(context):
    driver = context.driver

    assert_true(driver.execute_script("""
    var dropdown = document.querySelector(".wed-typeahead-popup .tt-menu");
    var scroller = document.getElementsByClassName("wed-scroller")[0];
    var rect = dropdown.getBoundingClientRect();
    var scroller_rect = scroller.getBoundingClientRect();
    return rect.bottom > scroller_rect.bottom;
    """), "the typeahead should overflow the editor pane")


@when(ur"the user clicks the last visible completion")
def step_impl(context):
    driver = context.driver

    x, y = driver.execute_script("""
    var dropdown = document.querySelector(".wed-typeahead-popup .tt-menu");
    var rect = dropdown.getBoundingClientRect();
    return [rect.left + rect.width / 2, rect.bottom - 5];
    """)
    ActionChains(driver) \
        .move_to_element_with_offset(context.origin_object, x, y) \
        .click() \
        .perform()


@then(ur"dump caret position")
def step_impl(context):
    driver = context.driver
    print(driver.execute_script("""
    var caret = wed_editor.caretManager.caret;
    if (!caret)
      return "no caret!"
    return [caret.node.innerHTML, caret.offset];
    """))
    print("")


@then(ur"the typeahead popup shows suggestions")
def step_impl(context):
    util = context.util

    assert_true(len(util.find_elements(
        (By.CSS_SELECTOR, ".wed-typeahead-popup .tt-menu .tt-suggestion"))))
