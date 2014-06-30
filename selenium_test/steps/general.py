from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
import selenium.webdriver.support.expected_conditions as EC
from nose.tools import assert_true, assert_equal  # pylint: disable=E0611

import wedutil
from ..util import get_element_parent_and_parent_text

# Don't complain about redefined functions
# pylint: disable=E0102


def no_before_unload(context):
    # IE 9 does not like setting onbeforeunload to undefined. So...
    context.driver.execute_script("window.onbeforeunload = function () {};")


def load_and_wait_for_editor(context, text=None, options=None, tooltips=False):
    no_before_unload(context)
    driver = context.driver
    util = context.util
    config = context.selenic_config
    server = config.WED_SERVER + "?mode=test"
    if text is not None:
        server = server + "&file=" + text

    if options is not None:
        server = server + "&options=" + options

    driver.get(server)

    wedutil.wait_for_editor(util)

    context.origin_object = driver.execute_script("""
    var tooltips = arguments[0];
    if (!tooltips) {
        // Turn off tooltips
        wed_editor.preferences.set("tooltips", false);

        // Delete all tooltips.
        jQuery(".tooltip").remove();
    }

    // This is bullshit to work around a Selenium limitation.
    jQuery("body").append(
        '<div id="origin-object" style=' +
        '"position: fixed; top: 0px; left: 0px; width:1px; height:1px;"/>');
    return jQuery("#origin-object")[0];
    """, tooltips)

    # For some reason, FF does not get focus automatically.
    # This counters the problem.
    if config.BROWSER == "FIREFOX":
        body = driver.find_element_by_css_selector(".wed-document")
        ActionChains(driver) \
            .move_to_element_with_offset(body, 1, 1) \
            .click() \
            .perform()


@when("the user loads the page")
def user_load(context):
    load_and_wait_for_editor(context)


@then("the editor shows a document")
def doc_appears(context):
    driver = context.driver
    WebDriverWait(driver, 2).until(
        EC.presence_of_element_located((By.CLASS_NAME, "_placeholder")))


@given("an empty document")
@given("an open document")
def open_doc(context):
    load_and_wait_for_editor(context)


@when("the user opens a new window")
def step_impl(context):
    driver = context.driver

    driver.execute_script("window.open('http://www.google.com')")
    driver.switch_to_window([x for x in driver.window_handles
                             if x != context.initial_window_handle][0])


@when("the user goes back to the initial window")
def step_impl(context):
    context.driver.close()
    context.driver.switch_to.window(context.initial_window_handle)


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
    element.click()
    wedutil.wait_for_caret_to_be_in(util, element)
    context.element_to_test_for_text = element
    assert_true(
        util.get_text_excluding_children(element).find(text) == -1)


@when('the user clicks on the start label of an element that does not '
      'contain "{text}"')
def step_impl(context, text):
    driver = context.driver

    button, parent, parent_text = get_element_parent_and_parent_text(
        driver, ".__start_label._title_label")
    button.click()
    assert_true(parent_text.find(text) == -1)
    context.element_to_test_for_text = parent


@when('the user resizes the window so that the end titleStmt label is '
      'next to the right side of the window')
def step_impl(context):
    util = context.util
    el = util.find_element((By.CSS_SELECTOR, ".__end_label._titleStmt_label"))

    # First, reduce the window size until the label is too big to find
    # in the editing pane and is thus moved down.
    initial_pos = util.element_screen_position(el)
    pos = initial_pos
    while pos["top"] == initial_pos["top"]:
        wedutil.set_window_size(util, pos["left"] + el.size["width"],
                                context.initial_window_size["height"])
        preceding_pos = pos
        pos = util.element_screen_position(el)

    # Then, increase the window size until the label is back on its
    # original line.
    pos_after_resize = pos
    # The 5 increment is arbitrary. Small enough to work, but not so small
    # that we spend an eternity finding the size.
    new_width = preceding_pos["left"] + el.size["width"] + 5
    while pos_after_resize["top"] != initial_pos["top"]:
        wedutil.set_window_size(util, new_width,
                                context.initial_window_size["height"])
        pos_after_resize = util.element_screen_position(el)
        new_width += 5


@when('the user resizes the window so that the editor pane has a vertical '
      'scrollbar')
def step_impl(context):
    util = context.util
    wedutil.set_window_size(util, 683, 741)


@when('the user resizes the window so that the last "term" element is no '
      'longer visible')
def step_impl(context):
    util = context.util
    term = util.find_elements((By.CLASS_NAME, "term"))[-1]

    size = dict(context.initial_window_size)

    while util.visible_to_user(term, ".wed-caret-layer"):
        size["height"] -= 15
        wedutil.set_window_size(util, size["width"], size["height"])


@when('the user resizes the window so that the editor pane will be offscreen')
def step_impl(context):
    util = context.util
    wedutil.set_window_size(util, 683, 500)


@when("the user scrolls the window down so that the editor's top is at the "
      "top of the window")
def step_impl(context):
    driver = context.driver
    util = context.util

    # We must not call it before the body is fully loaded.
    driver.execute_script("""
    delete window.__selenic_scrolled;
    jQuery(function () {
      window.scrollTo(0, wed_editor.$gui_root.offset().top);
      window.__selenic_scrolled = true;
    });
    """)

    def cond(*_):
        return driver.execute_script("""
        return window.__selenic_scrolled
        """)
    util.wait(cond)

    context.window_scroll_top = util.window_scroll_top()
    context.window_scroll_left = util.window_scroll_left()


@given(u"wait {x} seconds")
@when(u"wait {x} seconds")
def step_impl(context, x):
    import time
    time.sleep(float(x))


step_matcher("re")


@when("^(?:the user )?scrolls the editor pane (?P<choice>completely )?down$")
def step_impl(context, choice):
    driver = context.driver
    util = context.util

    if choice == "completely ":
        # We must not call it before the body is fully loaded.
        scroll_by = driver.execute_script("""
        return wed_editor.gui_root.scrollHeight;
        """)
    else:
        scroll_by = 10

    # We must not call it before the body is fully loaded.
    driver.execute_script("""
    var by = arguments[0];
    delete window.__selenic_scrolled;
    jQuery(function () {
      var top = window.wed_editor.$gui_root.scrollTop();
      window.wed_editor.$gui_root.scrollTop(top + by);
      window.__selenic_scrolled = true;
    });
    """, scroll_by)

    def cond(*_):
        return driver.execute_script("""
        return window.__selenic_scrolled;
        """)
    util.wait(cond)
    context.scrolled_editor_pane_by = scroll_by


@given(ur"^a document containing a top level element, a p element, "
       ur"and text.?$")
def open_simple_doc(context):
    load_and_wait_for_editor(
        context,
        text="/build/test-files/wed_test_data/source_converted.xml")


@given(ur"^a document with tooltips on")
def step_impl(context):
    load_and_wait_for_editor(
        context,
        text="/build/test-files/wed_test_data/source_converted.xml",
        tooltips=True)
    if context.util.ie:
        # For most browsers, this is not needed. However, in IE10, IE11,
        # some tooltip tests can fail if we do not move the mouse out of
        # the way first.
        ActionChains(context.driver) \
            .move_to_element_with_offset(context.origin_object, 0, 0) \
            .perform()


@given(ur"^a complex document without errors?$")
def open_simple_doc(context):
    load_and_wait_for_editor(
        context,
        text="/build/test-files/wed_test_data/complex_converted.xml")


@when(ur"^the user scrolls the window (?P<choice>completely down|down "
      ur"by (?P<by>\d+))$")
def step_impl(context, choice, by):
    driver = context.driver
    util = context.util

    if choice == "completely down":
        # We must not call it before the body is fully loaded.
        driver.execute_script("""
        delete window.__selenic_scrolled;
        jQuery(function () {
        window.scrollTo(0, document.body.scrollHeight);
        window.__selenic_scrolled = true;
        });
        """)
    else:
        # We must not call it before the body is fully loaded.
        driver.execute_script("""
        delete window.__selenic_scrolled;
        jQuery(function () {
        window.scrollTo(0, window.scrollY + arguments[0]);
        window.__selenic_scrolled = true;
        });
        """, by)

    def cond(*_):
        return driver.execute_script("""
        return window.__selenic_scrolled;
        """)
    util.wait(cond)

    context.window_scroll_top = util.window_scroll_top()
    context.window_scroll_left = util.window_scroll_left()


@then(ur"^the window's contents does not move.?$")
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
        return window.document.activeElement === wed_editor._$input_field[0];
        """)
    util.wait(cond)


@given("the first validation is complete")
@when("the first validation is complete")
def step_impl(context):
    wedutil.wait_for_first_validation_complete(context.util)


@given(r"^there is no (?P<what>.*)\.?$")
def step_impl(context, what):
    assert_equal(len(context.driver.find_elements_by_css_selector(
        ".teiHeader")),
        0)


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
