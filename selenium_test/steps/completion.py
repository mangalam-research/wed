from selenium.webdriver.common.by import By
# pylint: disable=E0611
from nose.tools import assert_equal, assert_true

step_matcher("re")


@then("a (?P<what>completion|replacement) menu is visible")
def step_impl(context, what):
    context.util.find_element((By.CLASS_NAME,
                               "wed-{}-menu".format(what)))


@then("a (?P<what>completion|replacement) menu is not visible")
def step_impl(context, what):
    context.util.wait_until_not(
        lambda driver: driver.find_element_by_class_name(
            "wed-{}-menu".format(what)))


@then("the first item of the (?P<what>completion|replacement) menu is "
      "focused")
def step_impl(context, what):
    context.util.find_element((By.CSS_SELECTOR,
                               ".wed-{}-menu li a:focus".format(what)))


@then("the completion text is inserted")
def step_impl(context):
    driver = context.driver

    text = driver.execute_script("""
    return document.querySelector(
        ".body>.div:nth-of-type(11)>.__start_label._div_label "+
        "._attribute_value").textContent;
    """)
    assert_equal(text, "initial")


@then("the text is replaced with the selected replacement menu item")
def step_impl(context):
    driver = context.driver

    text = driver.execute_script("""
    return document.querySelector(
        ".body>.div:nth-of-type(11)>.__start_label._div_label "+
        "._attribute_value").textContent;
    """)
    assert_equal(text, "medial")


@then('the completion menu has only one option named "initial" and the '
      'prefix "i" is in bold')
def step_impl(context):
    driver = context.driver

    result = driver.execute_script("""
    var options = document.querySelectorAll(".wed-completion-menu li a")
    if (options.length !== 1)
      return [false, "has " + options.length + " option(s)"];
    if (options[0].textContent !== "initial")
      return [false, "the text is not 'initial'"];
    var bold = options[0].firstElementChild;
    if (!bold || bold.textContent !== 'i')
      return [false, "the prefix is not bold"];
    return [true, undefined];
    """)
    assert_true(result[0], result[1])


@when("the user brings up the replacement menu")
def step_impl(context):
    context.util.ctrl_equivalent_x("?")
