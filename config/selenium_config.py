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
# False (or anything considered False): no logging.
#
# True: turns logging on but **automatically turned off in builders!**
# (Builders = buildbot, jenkins, etc.)
#
# "force": turns logging on, **even when using builders**.
#
#
if "LOGS" not in globals():
    LOGS = False

# If we are running in something like Buildbot or Jenkins, we don't
# want to have the logs be turned on because we forgot to turn them
# off. So unless LOGS is set to "force", we turn off the logs when
# running in that environment.
if LOGS and LOGS != "force" and \
   (os.environ.get('BUILDBOT') or os.environ.get('JENKINS_HOME')):
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
    "selenium-version": "2.45.0",
    # We cannot yet use 2.14 due to the change in how an element's
    # center is determined.
    #
    # AND SEE BELOW FOR A SPECIAL CASE.
    #
    "chromedriver-version": "2.13",
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

            # We have to use 2.12 with CH 39 on Windows to avoid a bug
            # in 2.13. Without this change the test suite will hang on
            # the 41st scenario. It really does not matter which
            # scenario ends up being the 41st. I've tried replicating
            # the issue with simplified code but it has not worked.
            if parts[0].lower().startswith("windows ") and \
               parts[1].lower() == "ch" and parts[2] == "39":
                caps = dict(caps)
                caps["chromedriver-version"] = "2.12"

            # Here we add the capabilities to the arguments we use to
            # call Config.
            parts = parts[:-1] + [caps, True]
            Config(*parts)
        else:
            raise ValueError("bad line: " + line)

# Support for older versions of our build setup which do not use builder_args
if 'builder_args' not in globals():
    builder_args = {
        # The config is obtained from the TEST_BROWSER environment variable.
        'browser': os.environ.get("TEST_BROWSER", None)
    }

# The 'browser' argument determines what browser we load.
browser_env = builder_args.get('browser', None)
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

#
# This is a setting local to this project. When set to an object:
#
# - The test suite does not start sauce connect.
#
# - The test suite starts ssh btw according to the configuration to
#   which WED_SSH_TUNNEL is set. It should be a dictionary with the
#   keys:
#
#   + "ssh_to": "foo@bar"
#
#      The username@address where to connect.
#
#   + "ssh_port": 2001
#
#      This is the port on which the remove server is redirecting
#      connections. SSH will listen on this port and tunnel
#      connections to the machine on which the test suite is running.
#
#   + "server": "https://something..."
#
#      The address of the server that will serve the contents for
#      the test.
#
#   +  "server_port": 2000
#
#      This is the port on which the remote server is listening for
#      incoming connections.
#
WED_SSH_TUNNEL = False
