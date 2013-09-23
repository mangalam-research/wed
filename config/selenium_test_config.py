import os
import imp
from selenium import webdriver

_dirname = os.path.dirname(__file__)

local_conf = {}
execfile(os.path.join(_dirname, "selenium_local_config.py"), local_conf)


def get_driver():
    if os.environ.get("SELENIUM_SAUCELABS"):
        desired_capabilities = webdriver.DesiredCapabilities.CHROME
        desired_capabilities['platform'] = 'Linux'
        desired_capabilities['name'] = 'Wed test'

        driver = webdriver.Remote(
            desired_capabilities=desired_capabilities,
            command_executor="http://" +
            local_conf["SAUCELABS_CREDENTIALS"] +
            "@ondemand.saucelabs.com:80/wd/hub"
        )
        driver.implicitly_wait(10)
    else:
        driver = webdriver.Chrome(local_conf["CHROMEDRIVER_PATH"])
        driver.implicitly_wait(2)

    return driver
