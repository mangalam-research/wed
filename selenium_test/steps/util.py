from selenium.webdriver.support.ui import WebDriverWait
import selenium.webdriver.support.expected_conditions as EC


def find_element(driver, locator):
    return WebDriverWait(driver, 2).until(
        EC.presence_of_element_located(locator))


def find_elements(driver, locator):
    return WebDriverWait(driver, 2).until(
        EC.presence_of_all_elements_located(locator))


def wait(driver, condition):
    return WebDriverWait(driver, 2).until(condition)
