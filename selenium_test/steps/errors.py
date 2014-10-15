from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import MoveTargetOutOfBoundsException

from selenic.util import Condition, Result
# pylint: disable=no-name-in-module
from nose.tools import assert_true

step_matcher("re")


@when(ur"^the user introduces an error in the document$")
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


@then(ur"^3 errors appear in the error panel$")
def step_impl(context):
    driver = context.driver
    util = context.util

    def cond(*_):
        return driver.execute_script("""
        return jQuery("#sb-errorlist").children().length === 3;
        """)

    util.wait(cond)


@when(ur"^the user clicks the last error in the error panel$")
def step_impl(context):
    driver = context.driver
    util = context.util

    el = driver.execute_script("""
        var $ = jQuery;
        var $collapse = $("#sb-errors-collapse");
        if (!$collapse.is(".in"))
            $collapse.collapse('show');
        var $errors = $("#sb-errorlist");
        var $last = $errors.children().last();
        $last[0].scrollIntoView();
        return $last[0];
        """)

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


@then(ur"^the last error marker is fully visible\.?$")
def step_impl(context):
    driver = context.driver
    util = context.util

    def check(*_):
        top = driver.execute_script("""
        var errors = document.getElementsByClassName("wed-validation-error");
        var last = errors[errors.length - 1];
        // Get the position relative to the scroller element.
        return last.getBoundingClientRect().top -
            wed_editor._scroller.getBoundingClientRect().top;
        """)

        # Sigh... Firefox will come close but not quite, so...
        return Result(abs(top) < 5, top)

    ret = Condition(util, check).wait().payload
    assert_true(abs(ret) < 5, "the top should be within -5 and 5 (got: " +
                str(ret))
