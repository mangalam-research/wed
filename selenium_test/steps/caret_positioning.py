import collections

from selenium.webdriver.common.action_chains import ActionChains

# pylint: disable=E0611
from nose.tools import assert_true

import wedutil

# Don't complain about redefined functions
# pylint: disable=E0102

step_matcher("re")

Spec = collections.namedtuple('Spec', ('label', 'offset'))


DIRECTION_TO_SPEC = {
    "right": Spec("end", 20),
    "left": Spec("start", -20)
}


@when(u"the user clicks to the (?P<direction>right|left) of the "
      ur"last (?P<what>.*?) element")
def step_impl(context, direction, what):
    driver = context.driver

    spec = DIRECTION_TO_SPEC[direction]

    el = driver.find_elements_by_css_selector(
        ".__{0}_label._{1}_label".format(spec.label, what))

    offset = spec.offset

    # It is an offset from the border of the label.
    if offset > 0:
        offset += el[-1].size["width"]

    ActionChains(driver) \
        .move_to_element_with_offset(el[-1], offset, 1) \
        .click() \
        .perform()

ORDER_TO_POS = {
    "first": 0,
    "last": -1,
    "second": 1
}


@then(ur'the caret is in the (?P<order>last|first|second) '
      ur'"(?P<what>.*?)" element')
def step_impl(context, order, what):
    driver = context.driver
    util = context.util

    position = ORDER_TO_POS[order]

    el = driver.find_elements_by_css_selector("." + what)[position]

    wedutil.wait_for_caret_to_be_in(util, el)


@then(ur"the (?P<label>end|start) label of the last (?P<what>.*?) "
      ur"element is selected")
def step_impl(context, label, what):
    driver = context.driver

    el = driver.find_elements_by_css_selector(
        ".__{0}_label._{1}_label".format(label, what))[-1]

    assert_true("_label_clicked" in el.get_attribute("class").split())
