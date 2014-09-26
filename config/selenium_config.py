import os
import subprocess
import json

from selenium.webdriver.firefox.webdriver import FirefoxProfile, FirefoxBinary
from selenium.webdriver.chrome.options import Options
import selenic

#
# LOGS determines whether Selenium tests will capture logs. Turning it
# on makes the tests much slower.
#
if "LOGS" not in globals():
    LOGS = False


class Config(selenic.Config):

    def make_selenium_desired_capabilities(self):
        ret = super(Config, self).make_selenium_desired_capabilities()

        if self.browser == "INTERNETEXPLORER":
            ret["requireWindowFocus"] = True

        ret["tags"] = [self.browser]
        return ret

#
# SELENIUM_NAME will appear suffixed after the default "Wed Test" name...
#
name = "Wed Test"
suffix = os.environ.get("SELENIUM_NAME", None)
if suffix:
    name += ": " + suffix

# Grab the current build number.
describe = subprocess.check_output(["git", "describe"])
# Grab the current reported version of wed
with open("package.json") as pk:
    version_data = json.load(pk)
version = version_data["version"]

caps = {
    # We have to turn this on...
    "nativeEvents": True,
    "name": name,
    # As of 2014-06-30 2.42.2 fails to load on Saucelabs...
    "selenium-version": "2.41.0",
    "chromedriver-version": "2.10",
    "build": "version: " + version + ", git describe: " + describe
}

if not LOGS:
    caps["record-screenshots"] = "false"
    caps["record-video"] = "false"
    caps["record-logs"] = "false"
    caps["sauce-advisor"] = "false"


config = Config("Linux", "FIREFOX", "28")
config = Config("Linux", "CHROME", "36")

config = Config("Windows 8.1", "CHROME", "36", caps, remote=True)
config = Config("Windows 8.1", "CHROME", "35", caps, remote=True)
config = Config("Windows 8.1", "CHROME", "34", caps, remote=True)

config = Config("Windows 8.1", "FIREFOX", "28", caps, remote=True)
config = Config("Windows 8.1", "FIREFOX", "27", caps, remote=True)

config = Config("Windows 8", "INTERNETEXPLORER", "10", caps, remote=True)
config = Config("Windows 8.1", "INTERNETEXPLORER", "11", caps, remote=True)


# As of 07292014 Chrome 36 is not yet available on OS X from
# Saucelabs.

config = Config("OS X 10.6", "CHROME", "35", caps, remote=True)
config = Config("OS X 10.6", "CHROME", "34", caps, remote=True)

#
# FAILING COMBINATIONS
#
# No support for native events yet:
#
# config = Config("Windows 8.1", "FIREFOX", "29", caps, remote=True)
#
# Fails due to a resizing bug in Selenium:
#
# config = Config("Windows 8.1", "FIREFOX", "26", caps, remote=True)
#
# FF does not support native events in OS X.
#
# config = Config("OS X 10.6", "FIREFOX", "26", caps, remote=True)
# config = Config("OS X 10.6", "FIREFOX", "27", caps, remote=True)
#
# Just fails:
#
# config = Config("Windows 7", "INTERNETEXPLORER", "9",
#                 caps, remote=True)
#

#
# The config is obtained from the TEST_BROWSER environment variable.
#
browser_env = os.environ.get("TEST_BROWSER", None)
parts = browser_env.split(",")
CONFIG = selenic.get_config(
    platform=parts[0] or None, browser=parts[1] or None,
    version=parts[2] or None)

if config.browser == "CHROME":
    CHROME_OPTIONS = Options()
    #
    # This prevents getting message shown in Chrome about
    # --ignore-certificate-errors
    #
    # --test-type is an **experimental** option. Reevaluate this
    # --use.
    #
    CHROME_OPTIONS.add_argument("test-type")

profile = FirefoxProfile()
# profile.set_preference("webdriver.log.file", "/tmp/firefox_webdriver.log")
# profile.set_preference("webdriver.firefox.logfile", "/tmp/firefox.log")
FIREFOX_PROFILE = profile

# May be required to get native events.
# FIREFOX_BINARY = FirefoxBinary("/home/ldd/src/firefox-24/firefox")

#
# Location of our server. Changing this use standalone rather than
# standalone-optimized will run the tests on the non-optimized version
# of the code.
#
WED_SERVER = "http://localhost:8888/forever/build/standalone-optimized"
