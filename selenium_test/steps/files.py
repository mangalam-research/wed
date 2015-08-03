import os

from selenium.webdriver.common.action_chains import ActionChains
import selenium.webdriver.support.expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoAlertPresentException
# pylint: disable=no-name-in-module
from nose.tools import assert_true, assert_equal, assert_is_none
from selenic.util import Result, Condition

from ..util import wait_for_editor

step_matcher('re')


@when(ur'the user opens the files page(?P<already> with a "test.xml" file '
      ur'already loaded(?P<empty>, and empty)?)?')
def step_impl(context, already=None, empty=None):
    driver = context.driver
    util = context.util
    builder = context.builder

    driver.get(builder.WED_SERVER + "/files.html")

    if already:
        contents = "" if empty else "preloaded!"
        # This may be the first page loaded in a test. When on
        # SauceLabs, the time it takes to load can be considerable,
        # hence the local timeout.
        with util.local_timeout(10):
            error = driver.execute_async_script("""
            var contents = arguments[0];
            var done = arguments[1];
            require(["angular", "localforage", "wed/savers/localforage"],
            function (ng, lf, saver) {
                saver.config();
                lf.setItem("test.xml",
                           saver.makeFileRecord("test.xml", contents),
                           function () {
                    var scope = ng.element(
                                    '[ng-controller="files-controller"]')
                        .scope();
                    // If scope is not set, we have not initialized
                    // angular yet.
                    if (scope)
                        scope.$apply('refresh()');
                    done();
                });
            }, function (err) {
               done(err);
            });
            """, contents)
            assert_is_none(error)

    # This will hold the state for the tests
    context.previous_file_state = {}


@then(ur'there (?P<count>are no files|is one file)')
def step_impl(context, count):
    util = context.util

    if count == "are no files":
        def check(driver):
            ret = driver.execute_script("""
            var table = document.getElementById("files-table");
            if (!table)
                return [false, "the table is being manipulated"];
            if (table.parentNode.style.display === "none")
                return [false, "the table is hidden"];
            var td = document.querySelector("tr.files-table-empty");
            return [!td.classList.contains("ng-hide"),
                    "the empty table element is hidden"];
            """)
            return Result(ret[0], ret[1])
    elif count == "is one file":
        def check(driver):
            ret = driver.execute_script("""
            var count = arguments[0];
            var table = document.getElementById("files-table");
            if (!table)
                return [false, "the table is being manipulated"];
            if (table.parentNode.style.display === "none")
                return [false, "the table is hidden"];
            var td = document.querySelector("tr.files-table-empty");
            if (!td.classList.contains("ng-hide"))
                return [false, "the element for the empty list is not hidden"];
            var trs = document.querySelectorAll(
                "#files-table>tbody>tr:not(.ng-hide)");
            // We have one header row
            var data_count = trs.length - 1;
            if (data_count !== count)
                return [false, "data row count incorrect: " + data_count];
            if (!trs[data_count].classList.contains("last"))
                return [false, "last row is not present"];
            return [true, ""];
            """, 1)
            return Result(ret[0], ret[1])

    # This may be the first test in a scenario. When on SauceLabs, the
    # time it takes to load can be considerable, hence the local
    # timeout.
    with util.local_timeout(10):
        result = Condition(util, check).wait()

    assert_true(result, result.payload)


@then(ur'file (?P<number>\d+) is titled "(?P<name>.*?)", has '
      ur'(?P<saved>(?:never )?been saved(?: recently)?), has '
      ur'(?P<uploaded>been uploaded(?: recently)?), and has '
      ur'(?P<downloaded>(?:never )?been downloaded(?: recently)?)')
def step_impl(context, number, name, saved, uploaded, downloaded):
    if saved == "never been saved":
        saved = "never"
    elif saved == "been saved recently":
        saved = "recent"
    else:
        raise ValueError("unknown saved value: " + saved)

    if uploaded == "been uploaded recently":
        uploaded = "recent"
    elif uploaded == "been uploaded":
        uploaded = "not never"
    else:
        raise ValueError("unknown uploaded value: " + uploaded)

    if downloaded == "never been downloaded":
        downloaded = "never"
    elif downloaded == "been downloaded recently":
        downloaded = "recent"
    else:
        raise ValueError("unknown downloaded value: " + downloaded)

    util = context.util

    try:
        prev_file_state = context.previous_file_state[name]
    except KeyError:
        never = {"literal": "never", "seq": 0}
        prev_file_state = {
            "saved": never, "uploaded": never, "downloaded": never,
            "exists": False}

    def check(driver):
        file_state = get_file_state(context, name)

        def check_date(value, name):
            if value == "never":
                if file_state[name]["literal"] != "never":
                    return [False,
                            name + " is " + file_state[name]["literal"]]
            elif value == "not never":
                if file_state[name]["literal"] == "never":
                    return [False, "never been " + name]
            elif file_state[name]["seq"] <= prev_file_state[name]["seq"]:
                return [False, "not " + name + " recently"]
            return False

        ret = check_date(saved, "saved")
        if ret:
            return Result(ret[0], ret[1])

        ret = check_date(uploaded, "uploaded")
        if ret:
            return Result(ret[0], ret[1])

        ret = check_date(downloaded, "downloaded")
        if ret:
            return Result(ret[0], ret[1])

        return Result(True, "no errors")

    result = Condition(util, check).wait()
    assert_true(result, result.payload)


def get_file_state(context, name):
    driver = context.driver
    return driver.execute_script("""
    var name = arguments[0];

    var never = {literal: "never", seq: 0};
    function handleDate(cell) {
        var text = cell.textContent;
        return text === "never" ? never :
            {literal: text, seq: Date.parse(text.replace(/\u200E/g, ''))};
    }

    var trs = document.querySelectorAll("#files-table>tbody>tr");
    var tr = Array.prototype.filter.call(trs, function (tr) {
        var tds = tr.getElementsByTagName("td");
        if (!tds.length)
            return false;
        return tds[0].textContent === name;
    })[0];

    var saved, uploaded, downloaded, exists;
    if (!tr) {
        exists = false;
        saved = never;
        uploaded = never;
        downloaded = never;
    }
    else {
        exists = true;
        var tds = tr.getElementsByTagName("td");

        saved = handleDate(tds[1]);
        uploaded = handleDate(tds[2]);
        downloaded = handleDate(tds[3]);
    }
    return { saved: saved, uploaded: uploaded, downloaded: downloaded,
             exists: exists };
    """, name)


@when(ur'(?:the user )?sets the uploading field to upload "(?P<name>.*?)"')
def step_impl(context, name):
    driver = context.driver
    file_el = driver.find_element_by_id("load-file")
    context.previous_file_state[name] = get_file_state(context, name)
    file_el.send_keys(os.path.abspath("sample_documents/" + name))


@when(ur'(?:the user )?gives the new file the name "(?P<name>.*?)"')
def step_impl(context, name):
    driver = context.driver
    util = context.util
    field = util.wait(EC.visibility_of_element_located(
        (By.CSS_SELECTOR, ".bootbox .bootbox-input")))
    field.send_keys(name)
    driver.find_element_by_css_selector(
        ".bootbox .btn.btn-primary").click()


@when(ur'(?:the user )?downloads file (?P<number>\d+)')
def step_impl(context, number):
    driver = context.driver
    button = driver.execute_script("""
    var number = arguments[0];
    return document.querySelector("#files-table>tbody>tr:nth-of-type(" +
                                   (number + 1) + ") a.btn[title='Download']");
    """, int(number))
    button.click()
    # This acutally is needed only in IE and works only in IE.
    try:
        driver.switch_to.alert.dismiss()
    except NoAlertPresentException:
        pass


@when(ur'(?:the user )?deletes file (?P<number>\d+)')
def step_impl(context, number):
    driver = context.driver
    driver.find_element_by_css_selector(
        "#files-table>tbody>tr:nth-of-type({0}) a.btn[title='Delete']"
        .format((int(number) + 1))).click()


@when(ur'(?:the user )?(?P<choice>accepts|cancels) the '
      ur'(?:deletion|overwrite|clear local storage) dialog')
def step_impl(context, choice):
    util = context.util
    driver = context.driver

    if choice == "accepts":
        selector = ".bootbox .btn.btn-danger"
    else:
        selector = ".bootbox .btn.btn-primary"

    el = util.wait(EC.element_to_be_clickable((By.CSS_SELECTOR, selector)))
    ActionChains(driver) \
        .click(el) \
        .perform()


@then(ur'the file "(?P<name>.*?)" has the contents "(?P<contents>.*)"')
@then(ur'the file "(?P<name>.*?)" contains a minimal document')
def step_impl(context, name, contents=None):
    driver = context.driver

    ret = driver.execute_async_script("""
    var name = arguments[0];
    var done = arguments[1];
    require(["localforage", "wed/savers/localforage"], function (lf, saver) {
        saver.config();
        lf.getItem(name).then(function (item) {
            done([null, item.data]);
        });
    }, function (err) {
        done([err, null]);
    });
    """, name)
    assert_is_none(ret[0])

    if contents is None:
        contents = '<TEI xmlns="http://www.tei-c.org/ns/1.0"/>'

    # Normalize IE's idiotic serialization.
    actual = ret[1].replace(' />', '/>')

    assert_equal(actual, contents)


@then(ur'the file is loaded in the editor')
def step_impl(context):
    wait_for_editor(context)
