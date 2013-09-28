from selenium.webdriver.support.ui import WebDriverWait
import selenium.webdriver.support.expected_conditions as EC


def find_element(driver, locator):
    return WebDriverWait(driver, 2).until(
        EC.presence_of_element_located(locator))


def find_elements(driver, locator):
    return WebDriverWait(driver, 2).until(
        EC.presence_of_all_elements_located(locator))


def get_text_excluding_children(driver, element):
    return driver.execute_script("""
    return jQuery(arguments[0]).contents().filter(function() {
        return this.nodeType == Node.TEXT_NODE;
    }).text();
    """, element)


def get_selection_text(driver):
    """
    Gets the text of the current selection.

    .. node:: This function requires that ``rangy`` be installed.

    :returns: The text.
    :rtype: class:`basestring`
    """
    return driver.execute_script("""
    return rangy.getSelection(window).toString()
    """)


def wait(driver, condition):
    return WebDriverWait(driver, 2).until(condition)
