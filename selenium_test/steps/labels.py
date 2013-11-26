from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from nose.tools import assert_equal, assert_true  # pylint: disable=E0611

import wedutil
import selenic.util

step_matcher("re")


@Given(ur"^the label visiblity level is at (?P<level>\d+).?$")
def step_impl(context, level):
    util = context.util

    level = int(level)
    assert_equal(wedutil.get_label_visibility_level(util), level)

    labels = util.find_elements((By.CSS_SELECTOR, ".wed-document ._label"))
    assert_true(len(labels))
    # Saving the labels themselves is pointless because redecoration
    # can destroy the elements that are now in the GUI.
    context.number_of_visible_labels = sum(1 for x in labels
                                           if x.is_displayed())


@When(ur"^(?:the user )?(?P<choice>decreases|increases) the label visibility "
      ur"level$")
def step_impl(context, choice):
    driver = context.driver
    util = context.util

    if choice == "decreases":
        key = "["
    elif choice == "increases":
        key = "]"
    else:
        raise ValueError("unexpected choice: " + choice)

    initial_level = wedutil.get_label_visibility_level(util)
    context.caret_position_before_label_visibility_change = \
        wedutil.caret_pos(driver)

    ActionChains(driver) \
        .key_down(Keys.CONTROL) \
        .send_keys(key) \
        .key_up(Keys.CONTROL) \
        .perform()

    # We don't allow the increase or decrease to do nothing.
    if choice == "decreases":
        expected = initial_level - 1
    elif choice == "increases":
        expected = initial_level + 1
    else:
        raise ValueError("unexpected choice: " + choice)

    util.wait(lambda *_: wedutil.get_label_visibility_level(util) == expected)


@Then("^no labels are visible$")
def step_impl(context):
    util = context.util

    labels = util.find_elements((By.CSS_SELECTOR, ".wed-document ._label"))
    assert_true(len(labels))

    util.wait(lambda *_: all(not el.is_displayed() for el in labels))


@Then("^more labels are visible$")
def step_impl(context):
    util = context.util
    labels = util.find_elements((By.CSS_SELECTOR, ".wed-document ._label"))
    number_of_visible_labels = sum(1 for x in labels if x.is_displayed())

    util.wait(lambda *_: number_of_visible_labels >
              context.number_of_visible_labels)


@Then("^the caret is at the same position on the screen.?$")
def step_impl(context):
    driver = context.driver

    before = context.caret_position_before_label_visibility_change

    after = wedutil.caret_pos(driver)

    # Some platforms use float dimensions so there may be rounding off
    # errors.
    assert_equal(selenic.util.locations_within(before, after, 1), '')
