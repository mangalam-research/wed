from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from behave import step_matcher
from nose.tools import assert_equal

import wedutil

step_matcher('re')


@given(ur'a modal is not visible')
def step_impl(context):
    visible_modals = context.driver.find_elements_by_css_selector(".modal.in")
    assert_equal(len(visible_modals), 0, "no modal should be visible")


@given(ur'the user has brought up a (?P<kind>draggable|resizable) modal')
def step_impl(context, kind):
    util = context.util
    driver = context.driver

    element = util.find_element((By.CSS_SELECTOR, ".title"))
    ActionChains(driver) \
        .click(element) \
        .perform()
    wedutil.wait_for_caret_to_be_in(util, element)

    context.execute_steps(u"""
    When the user uses the keyboard to bring up the context menu
    Then a context menu is visible close to where the user invoked it
    When the user clicks the choice named "Test {0}"
    """.format(kind))


@then(ur'the user can drag the modal')
def step_impl(context):
    util = context.util
    driver = context.driver

    draggable = util.find_element(
        (By.CSS_SELECTOR, '.modal.in .modal-content'))

    orig_pos = util.element_screen_position(draggable)

    header = util.find_element((By.CSS_SELECTOR, '.modal.in .modal-header'))

    ActionChains(driver) \
        .drag_and_drop_by_offset(header, 10, 10) \
        .perform()

    new_pos = util.element_screen_position(draggable)

    assert_equal(orig_pos["top"] + 10, new_pos["top"],
                 "the top position should be 10 more than it was")
    assert_equal(orig_pos["left"] + 10, new_pos["left"],
                 "the left position should be 10 more than it was")


@then(ur'the user can resize the modal')
def step_impl(context):
    util = context.util
    driver = context.driver

    resizable = util.find_element(
        (By.CSS_SELECTOR, '.modal.in .modal-content'))

    # This first move is to ensure we are well inside the region in
    # which we are allowed to resize before we start the
    # test. Otherwise, the actual test will fail because some of the
    # movement will be recorded outside the allowed zone and will not
    # register. (We'll narrow the window by less than the amount of
    # pixels we move.
    orig_size = resizable.size

    print(orig_size)
    ActionChains(driver) \
        .move_to_element_with_offset(resizable,
                                     orig_size["width"] - 2,
                                     orig_size["height"] - 2) \
        .click_and_hold() \
        .move_by_offset(-50, 0) \
        .release() \
        .perform()

    # Actual test
    orig_size = resizable.size

    ActionChains(driver) \
        .move_to_element_with_offset(resizable,
                                     orig_size["width"] - 2,
                                     orig_size["height"] - 2) \
        .perform()

    ActionChains(driver) \
        .click_and_hold() \
        .move_by_offset(-10, 10) \
        .release() \
        .perform()

    new_size = resizable.size

    print(driver.execute_script("""
    return arguments[0].getBoundingClientRect();
    """, resizable))
    assert_equal(orig_size["height"] + 10, new_size["height"],
                 "the height should be 10 more than it was")
    assert_equal(orig_size["width"] - 10, new_size["width"],
                 "the width should be 10 less than it was")
