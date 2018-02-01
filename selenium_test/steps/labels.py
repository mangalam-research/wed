from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from nose.tools import assert_equal, assert_true  # pylint: disable=E0611

import wedutil
import selenic.util

step_matcher("re")


def get_labels_stats(driver):
    return driver.execute_script("""
    var $labels = jQuery(".wed-document ._label");
    return [$labels.length, $labels.filter(function () {
        return window.getComputedStyle(this, null).display != "none";
    }).length];
    """)


@Given(ur"the label visiblity level is at (?P<level>\d+).?")
def step_impl(context, level):
    driver = context.driver
    util = context.util

    level = int(level)
    assert_equal(wedutil.get_label_visibility_level(util), level)

    n_labels, n_displayed = get_labels_stats(driver)
    assert_true(n_labels)
    # Saving the labels themselves is pointless because redecoration
    # can destroy the elements that are now in the GUI.
    context.number_of_visible_labels = n_displayed


@When(ur"(?:the user )?(?P<choice>decreases|increases) the label visibility "
      ur"level")
def step_impl(context, choice):
    driver = context.driver
    util = context.util

    initial_level = wedutil.get_label_visibility_level(util)
    context.caret_position_before_label_visibility_change = \
        wedutil.caret_screen_pos(driver)

    # We don't allow the increase or decrease to do nothing.
    if choice == "decreases":
        expected = initial_level - 1
    elif choice == "increases":
        expected = initial_level + 1
    else:
        raise ValueError("unexpected choice: " + choice)

    if not util.osx:
        util.ctrl_x({
            "decreases": "[",
            "increases": "]",
        }[choice])

    else:
        # On OSX, we have to use the toolbar.
        context.execute_steps(u"""\
When the user clicks the toolbar button "{}"
        """.format({
            "decreases": "Decrease label visibility level",
            "increases": "Increase label visibility level",
        }[choice]))

    util.wait(lambda *_: wedutil.get_label_visibility_level(util) == expected)


@Then("no labels are visible")
def step_impl(context):
    util = context.util

    def cond(*_):
        n_labels, n_displayed = get_labels_stats(context.driver)
        assert_true(n_labels)
        return n_displayed == 0

    util.wait(cond)


@Then("more labels are visible")
def step_impl(context):
    util = context.util

    def cond(*_):
        _, n_displayed = get_labels_stats(context.driver)
        return n_displayed > context.number_of_visible_labels

    util.wait(cond)


@Then("the caret is at the same position on the screen\.?")
def step_impl(context):
    driver = context.driver

    before = context.caret_position_before_label_visibility_change

    after = wedutil.caret_screen_pos(driver)

    # Some platforms use float dimensions so there may be rounding off
    # errors.
    assert_equal(selenic.util.locations_within(before, after, 1), '')
