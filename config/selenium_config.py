import os
import re
import shutil
import subprocess
import json
import inspect

from selenium.webdriver.firefox.webdriver import FirefoxProfile,  \
    FirefoxBinary
from selenium.webdriver.chrome.options import Options
import selenic

filename = inspect.getframeinfo(inspect.currentframe()).filename
dirname = os.path.dirname(os.path.abspath(filename))

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
    "selenium-version": "2.43.0",
    "chromedriver-version": "2.11",
    "build": "version: " + version + ", git describe: " + describe
}

if not LOGS:
    caps["record-screenshots"] = "false"
    caps["record-video"] = "false"
    caps["record-logs"] = "false"
    caps["sauce-advisor"] = "false"

with open(os.path.join(dirname, "./browsers.txt")) as browsers:
    for line in browsers.readlines():
        line = line.strip()
        if line.startswith("#") or len(line) == 0:
            continue  # Skip comments and blank lines
        parts = line.split(",")
        if len(parts) == 3:
            Config(*parts)
        elif len(parts) == 4:
            assert parts[-1].upper() == "REMOTE"
            parts = parts[:-1] + [caps, True]
            Config(*parts)
        else:
            raise ValueError("bad line: " + line)
#
# The config is obtained from the TEST_BROWSER environment variable.
#
browser_env = os.environ.get("TEST_BROWSER", None)
if browser_env:
    # When invoked from a Jenkins setup, the spaces that would
    # normally appear in names like "Windows 8.1" will appear as
    # underscores instead. And the separators will be "|" rather than
    # ",".
    parts = re.split(r"[,|]", browser_env.replace("_", " "))
    CONFIG = selenic.get_config(
        platform=parts[0] or None, browser=parts[1] or None,
        version=parts[2] or None)

    if CONFIG.browser == "CHROME":
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
    # profile.set_preference("webdriver.log.file",
    #                        "/tmp/firefox_webdriver.log")
    # profile.set_preference("webdriver.firefox.logfile",
    #                         "/tmp/firefox.log")

    #
    # This turns off the downloading prompt in FF.
    #
    tmp_path = "selenium_tests/tmp"
    shutil.rmtree(tmp_path, True)
    os.makedirs(tmp_path)
    profile.set_preference("browser.download.folderList", 2)
    profile.set_preference("browser.download.manager.showWhenStarting",
                           False)
    profile.set_preference("browser.download.dir", tmp_path)
    profile.set_preference(
        "browser.helperApps.neverAsk.saveToDisk", "text/xml")
    FIREFOX_PROFILE = profile

    def post_execution():
        shutil.rmtree(tmp_path, True)

# May be required to get native events.
# FIREFOX_BINARY = FirefoxBinary("/home/ldd/src/firefox-24/firefox")

#
# Location of our server. Changing this use standalone rather than
# standalone-optimized will run the tests on the non-optimized version
# of the code.
#
WED_ROOT = "/forever/build/standalone-optimized"
