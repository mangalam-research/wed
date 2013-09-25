from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
import selenium.webdriver.support.expected_conditions as EC
from selenium.webdriver.common.by import By
import util

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
    placeholder = util.find_element(driver, (By.CLASS_NAME, "_placeholder"))
    ActionChains(driver) \
        .context_click(placeholder) \
        .perform()


@When("the user brings up the context menu on the start label of the "
      "top element")
def context_menu_on_start_label_of_top_element(context):
    driver = context.driver
    button = util.find_element(driver, (By.CLASS_NAME, "_start_button"))
    ActionChains(driver)\
        .context_click(button)\
        .perform()


@When("the user brings up the context menu on the start label of an "
      "element")
def context_menu_on_start_label_of_element(context):
    driver = context.driver
    button = util.find_element(driver,
                               (By.CSS_SELECTOR, "._start_button._p_label"))
    ActionChains(driver)\
        .context_click(button)\
        .perform()


@When("the user brings up the context menu on the end label of the "
      "top element")
def context_menu_on_end_label_of_top_element(context):
    driver = context.driver
    button = util.find_elements(driver, (By.CLASS_NAME, "_end_button"))[-1]
    ActionChains(driver)\
        .context_click(button)\
        .perform()


@When("the user brings up the context menu on the end label of an "
      "element")
def context_menu_on_end_label_of_element(context):
    driver = context.driver
    button = util.find_element(driver,
                               (By.CSS_SELECTOR, "._end_button._p_label"))
    ActionChains(driver)\
        .context_click(button)\
        .perform()


@When("the user brings up the context menu on text")
def context_menu_on_text(context):
    driver = context.driver
    element = util.find_element(driver, (By.CLASS_NAME, "title"))
    ActionChains(driver)\
        .move_to_element(element)\
        .context_click()\
        .perform()


@When("the user brings up a context menu outside wed")
def context_menu_outside_wed(context):
    driver = context.driver
    # By the time we get here "body" is sure to be present.
    body = driver.find_element_by_tag_name("body")
    ActionChains(driver)\
        .move_to_element_with_offset(body, 0, 0)\
        .context_click()\
        .perform()


@When("the user clicks outside the context menu")
def user_clicks_outside_context_menu(context):
    driver = context.driver
    title = util.find_element(driver, (By.CLASS_NAME, "title"))
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
    driver = context.driver
    util.find_element(driver, (By.CLASS_NAME, "wed-context-menu"))


@Then(r'^the context menu contains choices for inserting new elements')
def context_choices_insert(context):
    driver = context.driver
    cm = util.find_element(driver, (By.CLASS_NAME, "wed-context-menu"))
    cm.find_element(By.PARTIAL_LINK_TEXT, "Create new ")


@Then("a context menu is not visible")
def context_menu_does_not_appears(context):
    driver = context.driver
    WebDriverWait(driver, 2).until_not(EC.presence_of_element_located(
        (By.CLASS_NAME, "wed-context-menu")))
