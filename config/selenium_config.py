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

# Support for older versions of our build setup which do not use builder_args
if 'builder_args' not in globals():
    builder_args = {
        # The config is obtained from the TEST_BROWSER environment variable.
        'browser': os.environ.get("TEST_BROWSER", None),
        'service': "saucelabs"
    }

if 'REMOTE_SERVICE' not in globals():
    REMOTE_SERVICE = builder_args.get("service")

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

# Detect whether we are running in a builder like Buildbot. (Note that
# this is unrelated to selenic's Builder class.)
in_builder = os.environ.get('BUILDBOT')

# If we are running in a builder, we don't want to have the logs be
# turned on because we forgot to turn them off. So unless LOGS is set
# to "force", we turn off the logs when running in that environment.
if LOGS and LOGS != "force" and in_builder:
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
    "name": name,
    # We have to turn this on...
    "nativeEvents": True,
    # We cannot yet use 2.14 due to the change in how an element's
    # center is determined.
    #
    # AND SEE BELOW FOR A SPECIAL CASE.
    #
    "build": "version: " + version + ", git describe: " + describe
}

selenium_version = "2.49.0"

if REMOTE_SERVICE == "saucelabs":
    caps.update({
        "selenium-version": selenium_version,
        "chromedriver-version": "2.30",
    })

    if not LOGS:
        caps.update({
            "record-screenshots": "false",
            "record-video": "false",
            "record-logs": "false",
            "sauce-advisor": "false"
        })

elif REMOTE_SERVICE == "browserstack":
    caps.update({
        'project': 'Wed',
        'browserstack.selenium_version': selenium_version,
    })

    if LOGS:
        caps.update({
            'browserstack.debug': True
        })
    else:
        caps.update({
            'browserstack.video': False
        })


with open(os.path.join(dirname, "./browsers.txt")) as browsers:
    for line in browsers.readlines():
        line = line.strip()
        if line.startswith("#") or len(line) == 0:
            continue  # Skip comments and blank lines
        parts = line.split(",")
        if len(parts) == 3:
            parts = parts + [caps, False]
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
                if REMOTE_SERVICE == "saucelabs":
                    caps["chromedriver-version"] = "2.12"

            # Here we add the capabilities to the arguments we use to
            # call Config.
            parts = parts[:-1] + [caps, True]
            Config(*parts)
        else:
            raise ValueError("bad line: " + line)

# The 'browser' argument determines what browser we load.
browser_env = builder_args.get(
    'browser',
    # Yep, we now have a default! But not when we are running in a builder.
    # In a builder we have to explicitly tell what browser we want.
    'Linux,CH,' if not in_builder else None)

if browser_env is None:
    raise ValueError("you must specify a browser to run")

parts = [part or None for part in browser_env.split(",")]
CONFIG = selenic.get_config(platform=parts[0], browser=parts[1],
                            version=parts[2])

if CONFIG.browser == "CHROME":
    CHROME_OPTIONS = Options()
    #
    # This prevents getting message shown in Chrome about
    # --ignore-certificate-errors
    #
    # --test-type is an **experimental** option. Reevaluate this
    # use.
    #
    CHROME_OPTIONS.add_argument("test-type")

    #
    # We force touch-events to be enabled. Why? At some point
    # along the line, Chrome gained the ability to tell whether
    # there is touch-enabled hardware on Debian. It is unclear
    # what gave it this capability. (It is not based on Chrome's
    # version as version 43 used to not detect touch capabilities
    # on Debian but later gained the capability. Is it an upgrade
    # to Gnome that made the difference??)
    #
    # Bootstrap does things differently depending on whether touch
    # events are available or not. Unfortunately an Xvfb session
    # won't report touch to be available even if the host X server
    # supports it. So we force it to be able to test for it. Touch
    # is becoming mainstream.
    #
    CHROME_OPTIONS.add_argument("touch-events")

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

if CONFIG.remote and not REMOTE_SERVICE:
    raise ValueError("you must pass a service argument to behave")

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
