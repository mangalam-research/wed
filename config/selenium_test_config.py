import httplib
import base64
try:
    import json
except ImportError:
    import simplejson as json
import os

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
    else:
        driver = webdriver.Chrome(local_conf["CHROMEDRIVER_PATH"])

    return driver


def set_test_status(jobid, passed=True):
    if os.environ.get("SELENIUM_SAUCELABS"):
        (username, key) = local_conf["SAUCELABS_CREDENTIALS"].split(":")
        creds = base64.encodestring('%s:%s' % (username, key))[:-1]

        conn = httplib.HTTPConnection("saucelabs.com")
        conn.request('PUT', '/rest/v1/%s/jobs/%s' % (username, jobid),
                     json.dumps({"passed": passed}),
                     headers={"Authorization": "Basic " + creds})
        return conn.getresponse() == 200
    else:
        return True
