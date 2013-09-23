# pylint: disable=E0611
from behave import When, Then, Given
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By

WED_SERVER = "http://localhost:8888/web/kitchen-sink.html?mode=test"


def no_before_unload(context):
    context.driver.execute_script("window.onbeforeunload = undefined;")


def load_and_wait_for_editor(context, text=None):
    no_before_unload(context)
    driver = context.driver
    if text is not None:
        server = WED_SERVER + "&file=" + text
    else:
        server = WED_SERVER

    driver.get(server)

    def condition(*_):
        return driver.execute_script(
            "return window.wed_editor && " +
            "wed_editor.getCondition('initialized');")

    WebDriverWait(driver, 15).until(condition)


@When("the user loads the page")
def user_load(context):
    load_and_wait_for_editor(context)


@Then("the editor shows a document")
def doc_appears(context):
    context.driver.find_element(By.CLASS_NAME, "_placeholder")


@Given("an open document")
def open_doc(context):
    load_and_wait_for_editor(context)


@Given("a document containing a top level element, a p element, and text.")
def open_simple_doc(context):
    load_and_wait_for_editor(
        context,
        text="/build/test-files/wed_test_data/source_converted.xml")
