from nose.tools import assert_raises  # pylint: disable=E0611
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException

# The * import above is not enough for pylint to know what @When,
# @Then, etc, are available.
#
# pylint: disable=E0602

step_matcher("re")


@Given("that a context menu is open")
def context_menu_is_open(context):
    context.execute_steps(u"""
    When the user brings up the context menu on text
    Then a context menu appears
    """)


@When("the user brings up the context menu on a placeholder")
def on_placeholder(context):
    driver = context.driver
    placeholder = driver.find_elements_by_class_name("_placeholder")[0]
    ActionChains(driver) \
        .context_click(placeholder) \
        .perform()


@When("the user brings up the context menu on the start label of the "
      "top element")
def context_menu_on_start_label_of_top_element(context):
    driver = context.driver
    button = driver.find_elements_by_class_name("_start_button")[0]
    ActionChains(driver)\
        .context_click(button)\
        .perform()


@When("the user brings up the context menu on the start label of an "
      "element")
def context_menu_on_start_label_of_top_element(context):
    driver = context.driver
    button = driver.find_elements_by_css_selector("._start_button._p_label")[0]
    ActionChains(driver)\
        .context_click(button)\
        .perform()


@When("the user brings up the context menu on the end label of the "
      "top element")
def context_menu_on_end_label_of_top_element(context):
    driver = context.driver
    button = driver.find_elements_by_class_name("_end_button")[-1]
    ActionChains(driver)\
        .context_click(button)\
        .perform()


@When("the user brings up the context menu on the end label of an "
      "element")
def context_menu_on_start_label_of_element(context):
    driver = context.driver
    button = driver.find_elements_by_css_selector("._end_button._p_label")[0]
    ActionChains(driver)\
        .context_click(button)\
        .perform()


@When("the user brings up the context menu on text")
def context_menu_on_end_label_of_element(context):
    driver = context.driver
    element = driver.find_elements_by_class_name("title")[0]
    ActionChains(driver)\
        .move_to_element(element)\
        .context_click()\
        .perform()


@When("the user brings up a context menu outside wed")
def context_menu_outside_wed(context):
    driver = context.driver
    html = driver.find_element_by_tag_name("body")
    ActionChains(driver)\
        .move_to_element_with_offset(html, 0, 0)\
        .context_click()\
        .perform()


@When("the user clicks outside the context menu")
def user_clicks_outside_context_menu(context):
    driver = context.driver
    title = driver.find_elements_by_class_name("title")[0]
    # This simulates a user whose hand is not completely steady.
    ActionChains(driver)\
        .move_to_element(title)\
        .move_by_offset(-5, 0)\
        .click_and_hold()\
        .move_by_offset(-6, 0)\
        .release()\
        .perform()


@Then("a context menu appears")
def context_menu_appears(context):
    driver = context.driver
    driver.find_element_by_class_name("wed-context-menu")


@Then(r'^the context menu contains choices for inserting new elements')
def context_choices_insert(context):
    driver = context.driver
    cm = driver.find_element_by_class_name("wed-context-menu")
    cm.find_element_by_partial_link_text("Create new ")


@Then("a context menu is not visible")
def context_menu_does_not_appears(context):
    driver = context.driver
    assert_raises(NoSuchElementException,
                  driver.find_element_by_class_name,
                  "wed-context-menu")
