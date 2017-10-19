from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import MoveTargetOutOfBoundsException

from selenic.util import Condition, Result
# pylint: disable=no-name-in-module
from nose.tools import assert_true, assert_equal

step_matcher("re")


@when(ur"the user introduces an error in the document")
def step_impl(context):
    driver = context.driver
    util = context.util

    title = util.find_element((By.CSS_SELECTOR,
                               ".__start_label._title_label"))
    context.clicked_element = title

    ActionChains(driver)\
        .click(title)\
        .perform()

    context.execute_steps(u"""
    When the user types DELETE
    """)


@then(ur"(?P<count>\d+) errors appear in the error panel")
def step_impl(context, count):
    driver = context.driver
    util = context.util

    def cond(*_):
        return driver.execute_script("""
        var count = arguments[0];
        return jQuery("#sb-errorlist").children().length === count;
        """, int(count))

    util.wait(cond)


@when(ur"the user clicks the (?P<which>first|last) error in the error "
      ur"panel")
def step_impl(context, which):
    driver = context.driver
    util = context.util

    el = driver.execute_script("""
        var which = arguments[0];
        var $ = jQuery;
        var $collapse = $("#sb-errors-collapse");
        if (!$collapse.is(".in"))
            $collapse.collapse('show');
        var $children = $("#sb-errorlist").children();
        var el;
        switch (which) {
        case "first":
            el = $children[0];
            break;
        case "last":
            el = $children.last()[0];
            break;
        default:
            throw new Error("unknown which value: " + which);
        }
        el.scrollIntoView();
        return el;
        """, which)

    def cond(*_):
        # Wait until it is fully opened. Otherwise, the click may hit
        # the screen at a location through which the element is
        # transiting.
        if not driver.execute_script("""
        return jQuery("#sb-errors-collapse").is(".in");
        """):
            return False

        if not el.is_displayed():
            return False

        ret = False
        try:
            el.click()
            ret = True
        except MoveTargetOutOfBoundsException:
            pass
        return ret

    util.wait(cond)


@then(ur"the (?P<which>first|last) error marker is fully visible\.?")
def step_impl(context, which):
    driver = context.driver
    util = context.util

    def check(*_):
        ret = driver.execute_script("""
        var which = arguments[0];
        var $ = jQuery;
        var $children = $("#sb-errorlist a");
        var el;
        switch (which) {
        case "first":
            el = $children[0];
            break;
        case "last":
            el = $children.last()[0];
            break;
        default:
            throw new Error("unknown which value: " + which);
        }
        var href = el.attributes.href.value;
        if (href[0] !== "#")
            throw new Error("unexpected link");

        var target = document.getElementById(href.slice(1));
        var scroller_rect = wed_editor.scroller.getBoundingClientRect();
        var target_rect = target.getBoundingClientRect();
        function rectToObj(rect) {
            return {top: rect.top, bottom: rect.bottom,
                    left: rect.left, right: rect.right};
        }
        return {target: rectToObj(target_rect),
                scroller: rectToObj(scroller_rect)};
        """, which)

        target = ret["target"]
        scroller = ret["scroller"]
        if target["top"] < scroller["top"]:
            return Result(False, "error marker above window")

        if target["bottom"] > scroller["bottom"]:
            return Result(False, "error marker below window")

        if target["left"] < scroller["left"]:
            return Result(False, "error marker to left of window")

        if target["right"] > scroller["right"]:
            return Result(False, "error marker to right of window")

        return Result(True, None)

    ret = Condition(util, check).wait()
    assert_true(ret, ret.payload)


@then(ur'the (?P<which>first|last) error says "(?P<what>.*?)"\.?')
def step_impl(context, which, what):
    driver = context.driver
    util = context.util

    def check(*_):
        ret = driver.execute_script("""
        var which = arguments[0];
        var $ = jQuery;
        var $children = $("#sb-errorlist a");
        var el;
        switch (which) {
        case "first":
            el = $children[0];
            break;
        case "last":
            el = $children.last()[0];
            break;
        default:
            throw new Error("unknown which value: " + which);
        }
        return el.textContent;
        """, which)

        # Sigh... Firefox will come close but not quite, so...
        return Result(ret == what, ret)

    ret = Condition(util, check).wait().payload
    assert_equal(ret, what)
