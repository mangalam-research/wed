import urllib
import os

from slugify import slugify
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
import selenium.webdriver.support.expected_conditions as EC
# pylint: disable=E0611
from nose.tools import assert_true, assert_equal
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoAlertPresentException

import wedutil
from ..util import get_element_parent_and_parent_text, wait_for_editor

# Don't complain about redefined functions
# pylint: disable=E0102


def load_and_wait_for_editor(context, text=None, options=None,
                             tooltips=False, schema=None):
    driver = context.driver
    builder = context.builder
    server = builder.WED_SERVER + "/kitchen-sink.html?"

    query = {
        "mode": "test",
        "nodemo": "1"
    }

    if text is not None:
        query["file"] = "../standalone/" + text

    if options is not None:
        query["options"] = options

    if schema is not None:
        query["schema"] = schema

    server += urllib.urlencode(query)

    driver.get(server)
    wait_for_editor(context, tooltips)


@when("the user loads the page")
def user_load(context):
    load_and_wait_for_editor(context)


@then("the editor shows a document")
def doc_appears(context):
    driver = context.driver
    WebDriverWait(driver, 2).until(
        EC.presence_of_element_located((By.CLASS_NAME, "_placeholder")))


@given("an empty document")
def open_doc(context):
    load_and_wait_for_editor(context)


@given("an empty docbook document")
def step_impl(context):
    load_and_wait_for_editor(context, schema="@docbook")


@when("the user opens a new window")
def step_impl(context):
    driver = context.driver

    context.caret_screen_position_before_focus_loss = \
        wedutil.caret_screen_pos(driver)

    driver.execute_script("window.open('http://www.google.com')")
    driver.switch_to_window([x for x in driver.window_handles
                             if x != context.initial_window_handle][0])


@then("a second window (or tab) is open")
def step_impl(context):
    util = context.util

    util.wait(lambda driver: len(driver.window_handles) == 2)


@when("the user goes back to the initial window")
def step_impl(context):
    context.driver.close()
    context.driver.switch_to.window(context.initial_window_handle)
    context.util.wait(
        lambda driver: driver.execute_script("return document.hasFocus();"))


@given("an empty document with autoinsert off")
def step_impl(context):
    load_and_wait_for_editor(context, options="noautoinsert")


@given("an empty document with a mode that has ambiguous insertion of "
       "fileDesc")
def step_impl(context):
    load_and_wait_for_editor(context, options="ambiguous_fileDesc_insert")


@given("an empty document with a mode that has interactive insertion of "
       "fileDesc")
def step_impl(context):
    load_and_wait_for_editor(context, options="fileDesc_insert_needs_input")


@when('the user clicks on text that does not contain "{text}"')
def step_impl(context, text):
    driver = context.driver
    util = context.util

    element = util.find_clickable_element((By.CLASS_NAME, "title"))
    ActionChains(driver) \
        .click(element) \
        .perform()
    wedutil.wait_for_caret_to_be_in(util, element)
    context.element_to_test_for_text = element
    assert_true(
        util.get_text_excluding_children(element).find(text) == -1)
    context.caret_screen_position = wedutil.caret_screen_pos(driver)


@when('the user clicks on the start label of an element that does not '
      'contain "{text}"')
def step_impl(context, text):
    driver = context.driver

    button, parent, parent_text = get_element_parent_and_parent_text(
        driver, ".__start_label._title_label")
    button.click()
    assert_true(parent_text.find(text) == -1)
    context.element_to_test_for_text = parent


@when('the user adds text to the title so that the titleStmt label is '
      'next to the right side of the window')
def step_impl(context):
    util = context.util
    driver = context.driver

    label = util.find_element((By.CSS_SELECTOR,
                               ".__end_label._titleStmt_label"))
    title = util.find_element((By.CSS_SELECTOR, ".titleStmt>.title"))
    ActionChains(driver)\
        .click(title)\
        .perform()

    initial_pos = util.element_screen_position(label)
    pos = initial_pos
    while pos["top"] == initial_pos["top"]:
        ActionChains(driver)\
            .send_keys("AAAAAA")\
            .perform()
        label = util.find_element((By.CSS_SELECTOR,
                                   ".__end_label._titleStmt_label"))
        pos = util.element_screen_position(label)

    while pos["top"] != initial_pos["top"]:
        ActionChains(driver)\
            .send_keys(Keys.BACKSPACE)\
            .perform()
        label = util.find_element((By.CSS_SELECTOR,
                                   ".__end_label._titleStmt_label"))
        pos = util.element_screen_position(label)


@when('the user resizes the window so that the editor pane has a vertical '
      'scrollbar')
def step_impl(context):
    util = context.util
    wedutil.set_window_size(util, 683, 741)


@when('the user resizes the window so that the editor pane will be offscreen')
def step_impl(context):
    util = context.util
    wedutil.set_window_size(util, 683, 500)


@when("the user scrolls the window down so that the editor's top is at the "
      "top of the window")
def step_impl(context):
    driver = context.driver
    util = context.util

    driver.execute_script("""
    window.scrollTo(0,
      document.querySelector(".wed-scroller").getBoundingClientRect().top +
      document.body.scrollTop);
    """)

    context.window_scroll_top = util.window_scroll_top()
    context.window_scroll_left = util.window_scroll_left()


@given(u"wait {x} seconds")
@when(u"wait {x} seconds")
def step_impl(context, x):
    import time
    time.sleep(float(x))


step_matcher("re")


@when("(?:the user )?scrolls the editor pane (?P<choice>completely )?down")
def step_impl(context, choice):
    driver = context.driver
    util = context.util
    pos_before = getattr(context, "caret_screen_position",
                         None)

    scroll_by = None if choice == "completely " else 10
    scroll_top = driver.execute_script("""
    var by = arguments[0];
    var scroller = document.querySelector(".wed-scroller");
    if (!by) {
      by = scroller.scrollHeight;
    }
    scroller.scrollTop += by;
    return scroller.scrollTop;
    """, scroll_by)

    context.scrolled_editor_pane_by = scroll_by
    context.editor_pane_new_scroll_top = scroll_top

    if pos_before is not None:
        # Wait until the caret actually change position.
        def cond2(driver):
            pos = wedutil.caret_screen_pos(driver)
            return pos if pos_before != pos else False

        util.wait(cond2)


@then("the editor pane did not scroll")
def step_impl(context):
    scroll_top = context.editor_pane_new_scroll_top

    new_scroll_top = context.driver.execute_script(
        "return  window.wed_editor.scroller.scrollTop;")

    # On IE 10 something causes the scroll to shift a tiny bit. It is
    # unclear what causes this.
    if context.util.ie and int(context.builder.config.version) <= 10:
        assert_true(abs(scroll_top - new_scroll_top) <= 2,
                    "the scroll top should be within 2 pixels")
    else:
        assert_equal(scroll_top, new_scroll_top,
                     "the scroll top should not have changed")


@given(ur"a document containing a top level element, a p element, "
       ur"and text\.?")
def open_simple_doc(context):
    load_and_wait_for_editor(
        context,
        text="lib/tests/wed_test_data/source_converted.xml")


@given(ur"a document that has multiple top namespaces\.?")
def open_simple_doc(context):
    load_and_wait_for_editor(
        context,
        text="lib/tests/wed_test_data/multiple_top_namespaces_converted.xml",
        schema="@math")


@given(ur"a document with tooltips on")
def step_impl(context):
    load_and_wait_for_editor(
        context,
        text="lib/tests/wed_test_data/source_converted.xml",
        tooltips=True)
    if context.util.ie:
        # For most browsers, this is not needed. However, in IE10, IE11,
        # some tooltip tests can fail if we do not move the mouse out of
        # the way first.
        ActionChains(context.driver) \
            .move_to_element_with_offset(context.origin_object, 0, 0) \
            .perform()


@given(ur"a complex document without errors?")
def open_simple_doc(context):
    load_and_wait_for_editor(
        context,
        text="lib/tests/wed_test_data/complex_converted.xml")


@given(ur'a document without "hi"')
def open_simple_doc(context):
    load_and_wait_for_editor(
        context,
        text="lib/tests/wed_test_data/nohi_converted.xml")


@given(ur'a document without "text"')
def open_simple_doc(context):
    load_and_wait_for_editor(
        context,
        text="lib/tests/wed_test_data/notext_converted.xml")


@when(ur"the user scrolls the window (?P<choice>completely down|down "
      ur"by (?P<by>\d+))")
def step_impl(context, choice, by):
    driver = context.driver
    util = context.util

    by = None if by is None else int(by)

    driver.execute_script("""
    var by = arguments[0];
    window.scrollTo(0, by ? (window.scrollY + by) :
                         document.body.scrollHeight);
    """, by)

    context.window_scroll_top = util.window_scroll_top()
    context.window_scroll_left = util.window_scroll_left()


@then(ur"the window's contents does not move\.?")
def step_impl(context):
    util = context.util

    assert_equal(util.window_scroll_top(), context.window_scroll_top,
                 "top must not have changed")
    assert_equal(util.window_scroll_left(), context.window_scroll_left,
                 "left must not have changed")


@then("the editor pane has focus")
def step_impl(context):
    driver = context.driver
    util = context.util

    def cond(*_):
        return driver.execute_script("""
        return window.document.activeElement === wed_editor.$inputField[0];
        """)
    util.wait(cond)


@given(r"there is no (?P<what>.*)\.?")
def step_impl(context, what):
    assert_equal(len(context.driver.find_elements_by_css_selector(
        ".teiHeader")), 0)


@when("the user clicks in an element excluded from blur")
def step_impl(context):
    driver = context.driver

    el = driver.execute_script("""
    var $button = jQuery("<button>Foo</button>");

    // Necessary to prevent the browser from moving the focus.
    $button.mousedown(false);
    $button.click(false);
    jQuery(document.body).append($button);
    wed_editor.excludeFromBlur($button);
    return $button[0];
    """)

    el.click()


@given("the platform variation page is loaded")
def step_impl(context):
    config = context.builder.config
    context.driver.get(context.builder.WED_UNOPTIMIZED_SERVER +
                       "/platform_test.html?platform=" +
                       urllib.quote(config.platform) +
                       "&browser=" + urllib.quote(config.browser) +
                       "&version=" + urllib.quote(config.version))

# These are the basic templates for each browser. The values are later
# adjusted during the test to take into account version numbers or OS.
_BROWSER_TO_VALUES = {
    "CHROME": {
        u"CHROME": True,
        u"FIREFOX": False,
        u"FIREFOX_24": False,
        u"GECKO": False,
        u"MSIE_TO_10": False,
        u"MSIE_11_AND_UP": False,
        u"MSIE": False,
        u"OSX": False,
        u"WINDOWS": False,
        u"EDGE": False,
    },
    "FIREFOX": {
        u"CHROME": False,
        u"FIREFOX": True,
        u"FIREFOX_24": False,
        u"GECKO": True,
        u"MSIE_TO_10": False,
        u"MSIE_11_AND_UP": False,
        u"MSIE": False,
        u"OSX": False,
        u"WINDOWS": False,
        u"EDGE": False,
    },
    "INTERNETEXPLORER": {
        u"CHROME": False,
        u"FIREFOX": False,
        u"FIREFOX_24": False,
        u"GECKO": False,
        u"MSIE_TO_10": False,
        u"MSIE_11_AND_UP": False,
        u"MSIE": True,
        u"OSX": False,
        u"WINDOWS": False,
        u"EDGE": False,
    },
    "EDGE": {
        u"CHROME": False,
        u"FIREFOX": False,
        u"FIREFOX_24": False,
        u"GECKO": False,
        u"MSIE_TO_10": False,
        u"MSIE_11_AND_UP": False,
        u"MSIE": False,
        u"OSX": False,
        u"WINDOWS": False,
        u"EDGE": True,
    }
}


@then("wed handles platform variations")
def step_impl(context):
    config = context.builder.config
    util = context.util

    def check(driver):
        # Check that the parameters were properly passed.
        ret = \
            driver.execute_script("""
return [window.test_platform, window.test_browser, window.test_version];
            """)

        return False if None in ret else ret

    test_platform, test_browser, test_version = util.wait(check)

    assert_equal(test_platform, config.platform)
    assert_equal(test_browser, config.browser)
    assert_equal(test_version, config.version)

    #
    # Test that the browsers module is able to detect what it needs
    # correctly, and that the platform is patched as needed.
    #
    # Note that the tests for matches() are not meant to exhaustively
    # test the browser.
    #
    browsers, match_tests = context.driver.execute_async_script("""
    var done = arguments[0];
    require(["wed/browsers"], function (browsers) {
        var match_tests = [];
        function match_test(name, result) {
            match_tests.push({name: name, result: result});
        }
        match_test("positive match", document.body.matches("body"));
        match_test("negative match", !document.body.matches("foo"));
        done([browsers,  match_tests]);
    });
    """)
    expected_values = _BROWSER_TO_VALUES[config.browser]

    if config.browser == "INTERNETEXPLORER":
        if int(config.version) <= 10:
            expected_values[u"MSIE_TO_10"] = True
        else:
            expected_values[u"MSIE_11_AND_UP"] = True
    elif config.browser == "FIREFOX" and config.version == "24":
        expected_values[u"FIREFOX_24"] = True

    if config.platform.startswith("OS X "):
        expected_values[u"OSX"] = True
    elif config.platform.startswith("WINDOWS "):
        expected_values[u"WINDOWS"] = True

    assert_equal(browsers, expected_values)
    for result in match_tests:
        assert_true(result[u"result"], result[u"name"] + " should be true")


@when('the input field is focused')
def step_impl(context):
    context.driver.execute_script("""
    wed_editor.$inputField[0].focus();
    """)


@then("a help dialog is visible")
def step_impl(context):
    head = context.util.find_element(
        (By.CSS_SELECTOR, ".modal.in .modal-header h3"))
    assert_equal(head.text, "Help")


@when('the user clicks the help link in the dialog')
def step_impl(context):
    context.handles_before_help_link_click = context.driver.window_handles
    link = context.util.find_element(
        (By.CSS_SELECTOR, ".modal.in .modal-body a"))
    link.click()


@then("the help opens in a new tab")
def step_impl(context):

    def check(driver):
        return len(driver.window_handles) == \
            len(context.handles_before_help_link_click) + 1

    context.util.wait(check)


@then("take screenshot named (?P<name>.*?)\.?")
def step_impl(context, name):
    fname = os.path.join(context.screenshots_dir_path,
                         slugify(name) + ".png")
    context.driver.save_screenshot(fname)
    print("")
    print("Captured screenshot:", fname)
    print("")
