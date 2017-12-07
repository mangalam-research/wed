from selenium.webdriver.common.by import By

step_matcher("re")


@When(ur'the user clicks the toolbar button "(?P<name>.*?)"')
def step_impl(context, name):
    button = context.util.find_element(
        (By.CSS_SELECTOR,
         ".wed-toolbar [data-original-title='{}']".format(name)))
    button.click()
