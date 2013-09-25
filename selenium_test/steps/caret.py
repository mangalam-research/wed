from selenium.webdriver.common.action_chains import ActionChains
from nose.tools import assert_true  # pylint: disable=E0611
from selenium.webdriver.support.ui import WebDriverWait
import selenium.webdriver.support.expected_conditions as EC
from selenium.webdriver.common.by import By


# Don't complain about redefined functions
# pylint: disable=E0102


@when(u"the user clicks on an element's label")
def step_impl(context):
    driver = context.driver
    button = driver.find_elements_by_css_selector("._end_button._p_label")[0]
    context.clicked_element = button
    assert_true("_button_clicked" not in button.get_attribute("class").split())
    ActionChains(driver)\
        .click(button)\
        .perform()


@then(u'the label changes to show it is selected')
def step_impl(context):
    button = context.clicked_element
    assert_true("_button_clicked" in button.get_attribute("class").split())


@then(u'the caret disappears')
def step_impl(context):
    driver = context.driver
    WebDriverWait(driver, 2).until_not(EC.presence_of_element_located(
        (By.CLASS_NAME, "_wed_caret")))
