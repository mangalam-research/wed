import re

from selenium.webdriver.common.action_chains import ActionChains
import selenium.webdriver.support.expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.wait import TimeoutException

import selenic.util

from nose.tools import assert_equal, assert_true, \
    assert_not_equal  # pylint: disable=E0611

import wedutil

from ..util import Trigger, get_element_parent_and_parent_text, \
    get_real_siblings

step_matcher("re")


@Given("that a context menu is open")
def context_menu_is_open(context):
    context.execute_steps(u"""
    When the user uses the mouse to bring up the context menu on text
    Then a context menu appears
    """)


@When("the user uses the mouse to bring up the context menu on a placeholder")
def on_placeholder(context):
    driver = context.driver
    util = context.util

    placeholder = util.find_element((By.CLASS_NAME, "_placeholder"))
    assert_true(util.visible_to_user(placeholder),
                "must be visible to the user; otherwise this step "
                "is not something the user can do")
    ActionChains(driver) \
        .context_click(placeholder) \
        .perform()
    context.context_menu_trigger = Trigger(util, placeholder)
    context.context_menu_for = placeholder


@When("the user (?:uses the mouse to bring|brings) up the context "
      "menu on the start label of the top element")
def context_menu_on_start_label_of_top_element(context):
    driver = context.driver
    util = context.util

    button = util.find_element((By.CSS_SELECTOR,
                                ".__start_label ._element_name"))
    ActionChains(driver)\
        .context_click(button)\
        .perform()


@When("the user (?:uses the mouse to bring|brings) up the context "
      "menu on the start label of an element")
def context_menu_on_start_label_of_element(context):
    # We use the first paragraph for this one.
    driver = context.driver
    util = context.util

    button, parent, _ = get_element_parent_and_parent_text(
        driver, ".__start_label._p_label")
    ActionChains(driver)\
        .context_click(button)\
        .perform()
    context.context_menu_trigger = Trigger(util, button)
    context.context_menu_for = parent


@When("the user brings up the context menu on the end titleStmt label")
def context_menu_on_start_label_of_element(context):
    # We use the first paragraph for this one.
    driver = context.driver
    util = context.util

    button, parent, _ = get_element_parent_and_parent_text(
        driver, ".__end_label._titleStmt_label")
    ActionChains(driver)\
        .context_click(button)\
        .perform()
    context.context_menu_trigger = Trigger(util, button)
    context.context_menu_for = parent


@given(u'that the user has brought up the context menu over the '
       u'(?P<which>start|end) label of an element')
def step_impl(context, which):
    context.execute_steps(u"""
    When the user brings up the context menu on the {0} label of an element
    Then a context menu is visible close to where the user invoked it
    """.format(which))


@When("the user uses the mouse to bring up the context menu on the start "
      "label of another element")
def context_menu_on_start_label_of_element(context):
    # We use the first title for this one.
    driver = context.driver
    util = context.util

    clicked = context.clicked_element
    button, parent, _ = get_element_parent_and_parent_text(
        driver, ".__end_label._sourceDesc_label")

    assert_not_equal(clicked, button)
    ActionChains(driver)\
        .context_click(button)\
        .perform()
    context.context_menu_trigger = Trigger(util, button)
    context.context_menu_for = parent


@When("the user uses the mouse to bring up the context menu on the end label "
      "of the top element")
def context_menu_on_end_label_of_top_element(context):
    driver = context.driver
    util = context.util

    button, parent = driver.execute_script("""
    var button = jQuery(".__end_label").get(-1);
    button.scrollIntoView();
    return [button, button.parentNode];
    """)
    ActionChains(driver)\
        .context_click(button)\
        .perform()
    context.context_menu_trigger = Trigger(util, button)
    context.context_menu_for = parent


@When("the user (?:uses the mouse to bring|brings) up the context menu on "
      "the end label of an element")
def context_menu_on_end_label_of_element(context):
    driver = context.driver
    util = context.util

    button, parent, _ = get_element_parent_and_parent_text(
        driver, ".__end_label._p_label")
    ActionChains(driver)\
        .context_click(button)\
        .perform()
    context.context_menu_trigger = Trigger(util, button)
    context.context_menu_for = parent


@When("the user uses the mouse to bring up the context menu on text")
def context_menu_on_text(context):
    driver = context.driver
    util = context.util

    element = util.find_element((By.CLASS_NAME, "title"))
    ActionChains(driver)\
        .move_to_element(element)\
        .context_click()\
        .perform()
    context.context_menu_trigger = Trigger(util, element)
    context.context_menu_for = None


@when("the user brings up the context menu on uneditable text")
def context_menu_on_uneditable_text(context):
    driver = context.driver
    util = context.util

    element, parent, _ = get_element_parent_and_parent_text(
        driver, ".ref>._phantom._text")
    ActionChains(driver)\
        .move_to_element(element)\
        .context_click()\
        .perform()

    context.context_menu_trigger = Trigger(util, element)
    context.context_menu_for = parent

    context.execute_steps(u"""
    Then a context menu is visible close to where the user invoked it
    """)


@When("the user uses the mouse to bring up a context menu outside wed")
def context_menu_outside_wed(context):
    driver = context.driver

    # Getting a browser context menu is problematic because there is
    # no cross browser way to dismiss it. So prevent it from comming
    # up but record the event.
    driver.execute_script("""
    var $ = jQuery;
    delete window.__selenic_contextmenu;
    $("body").on("contextmenu.selenium.testing", function () {
       window.__selenic_contextmenu = true;
       return false;
    });
    """)

    # By the time we get here "body" is sure to be present.
    body = driver.find_element_by_tag_name("body")
    ActionChains(driver)\
        .move_to_element_with_offset(body, 0, 0)\
        .context_click()\
        .perform()

    # Check that we did intercept the event.
    assert_true(driver.execute_script("""
    return window.__selenic_contextmenu;
    """))


@When("the user clicks outside the context menu")
def user_clicks_outside_context_menu(context):
    driver = context.driver
    util = context.util

    title = util.find_element((By.CLASS_NAME, "title"))
    # This simulates a user whose hand is not completely steady.
    ActionChains(driver)\
        .move_to_element(title)\
        .move_by_offset(-10, 0)\
        .click_and_hold()\
        .move_by_offset(-1, 0)\
        .release()\
        .perform()


@Then("a context menu appears")
def context_menu_appears(context):
    util = context.util

    util.find_element((By.CLASS_NAME, "wed-context-menu"))


@Then(r'the context menu (?P<exists>contains|does not contain) choices '
      r'for (?P<kind>.*?)\.?')
def context_choices_insert(context, exists, kind):
    util = context.util

    exists = True if exists == "contains" else False

    search_for = None
    if kind == "inserting new elements":
        search_for = "^Create new [^ ]+$"
    elif kind == "creating elements before the selected element":
        search_for = "^Create new .+? before"
    elif kind == "creating elements after the selected element":
        search_for = "^Create new .+? after"
    elif kind == "wrapping text in new elements":
        search_for = "^Wrap in "
    else:
        raise ValueError("can't search for choices of this kind: " + kind)

    if exists:
        count = len(util.find_descendants_by_text_re(".wed-context-menu",
                                                     search_for))
        assert_not_equal(count, 0, "there should be options")
    else:
        # We first need to make sure the menu is up because
        # find_descendants_by_text_re will return immediately.
        util.find_element((By.CLASS_NAME, "wed-context-menu"))
        count = len(util.find_descendants_by_text_re(".wed-context-menu",
                                                     search_for, True))
        assert_equal(count, 0, "there should not be options")


@Then(r'a choice for creating a new '
      r'note after this element is below the editor pane\.?')
def context_choices_insert(context):
    util = context.util
    driver = context.driver

    search_for = '^Create new note after'

    items = util.find_descendants_by_text_re(".wed-context-menu", search_for)
    assert_not_equal(len(items), 0, "Number of elements found")

    item = items[0]
    assert_true(driver.execute_script("""
    var el = arguments[0];

    var $element = jQuery(el);
    var $guiRoot = wed_editor.$guiRoot;
    var pos = $element.offset();
    var gui_pos = $guiRoot.offset();
    pos.top = pos.top - gui_pos.top;
    return pos.top > $guiRoot.outerHeight();
    """, item), "Outside editor panel")


@Given("(?:a|the) context menu is not visible")
@Then("(?:a|the) context menu is not visible")
def context_menu_is_not_visible(context):
    wedutil.wait_until_a_context_menu_is_not_visible(context.util)


@Then("a context menu is visible close to where the user invoked it")
def step_impl(context):
    util = context.util

    menu = util.find_element((By.CLASS_NAME, "wed-context-menu"))
    # The click was in the middle of the trigger.
    trigger = context.context_menu_trigger
    target = trigger.location
    size = trigger.size  # Read just once = 1 network roundtrip.
    target["left"] += size["width"] / 2
    target["top"] += size["height"] / 2
    assert_equal(selenic.util.locations_within(
        util.element_screen_position(menu), target, 10), '')


@Then("(?:a|the) context menu is visible")
def step_impl(context):
    util = context.util
    util.find_element((By.CLASS_NAME, "wed-context-menu"))


@When("the context menu's filter field has focus")
def step_impl(context):
    util = context.util

    def cond(driver):
        return driver.execute_script("""
        var filter = document.querySelector(".wed-context-menu input");
        return document.activeElement === filter;
        """)

    util.wait(cond)


@Then("a context menu is visible and completely inside the window")
def step_impl(context):
    util = context.util

    # Yep, we must use the dropdown-menu for this.
    menu = util.find_element((By.CSS_SELECTOR,
                              ".wed-context-menu>.dropdown-menu"))
    assert_true(util.completely_visible_to_user(menu),
                "menu is completely visible")

    # This is a check that without the adjustment made to show the
    # whole menu, the menu would overflow outside the editing pane. (A
    # freakishly small menu would not overflow, for instance, and we
    # would not be testing what we think we are testing.)
    gui_root = wedutil.gui_root(util)
    assert_true(context.context_menu_trigger.location["left"] -
                util.element_screen_position(gui_root)["left"] +
                menu.size["width"] > gui_root.size["width"],
                "the menu would otherwise overflow")


@When(ur"the user uses the keyboard to bring up the context menu on "
      ur"(?P<choice>a placeholder|text)")
def step_impl(context, choice):
    driver = context.driver
    util = context.util

    if choice == "a placeholder":
        parent, where = driver.execute_script("""
        var $ph = jQuery("._placeholder");
        var $parent = $ph.closest("._real");
        return [$parent[0], $ph[0]];
        """)
    elif choice == "text":
        where = util.find_element((By.CLASS_NAME, "title"))
        parent = where
    else:
        raise ValueError("unknown choice: " + choice)

    max_tries = 5
    while True:
        # IF YOU CHANGE THIS, CHANGE THE TRIGGER
        wedutil.click_until_caret_in(util, where)
        util.ctrl_equivalent_x("/")
        try:
            # We don't want to check too fast so we do use an explicit
            # wait by way of ``util``.
            util.find_element((By.CLASS_NAME, "wed-context-menu"))
            # If we get here, the menu exists.
            break
        except TimeoutException:
            # The menu did not come up. Probably something messed up
            # the caret between ``click_until_caret_in`` and
            # ``ctrl_equivalent_x``. Try again or decide that it just
            # won't happen.
            max_tries -= 1
            if max_tries == 0:
                raise Exception("tried multiple times to bring up "
                                "the contextual menu, but was "
                                "unsuccessful")

    # THIS TRIGGER WORKS ONLY BECAUSE OF .click(where) above.
    context.context_menu_trigger = Trigger(util, where)
    context.context_menu_for = parent


@when(ur"the user uses the keyboard to bring up the context menu")
def step_impl(context):
    driver = context.driver
    util = context.util

    # Set it only if we don't already have one.
    if not getattr(context, "context_menu_trigger", None):
        pos = wedutil.caret_selection_pos(driver)
        trigger = Trigger(location={"left": int(pos["left"]),
                                    "top": int(pos["top"])},
                          size={'width': 0, 'height': 0})
        context.context_menu_trigger = trigger
        context.context_menu_for = None

    util.ctrl_equivalent_x("/")


@then(ur"the user can bring up a context menu with the keyboard\.?")
def step_impl(context):

    # Reset the trigger so that we pick up a new trigger.
    context.context_menu_trigger = None

    context.execute_steps(u"""
    When the user uses the keyboard to bring up the context menu
    Then a context menu is visible close to where the user invoked it
    """)


@when(u'the user brings up the context menu on the selection')
def step_impl(context):
    driver = context.driver

    pos = wedutil.point_in_selection(driver)

    # Selenium does not like floats.
    trigger = Trigger(location={"left": int(pos["x"]), "top": int(pos["y"])},
                      size={'width': 0, 'height': 0})

    ActionChains(driver) \
        .move_to_element_with_offset(context.origin_object, pos["x"],
                                     pos["y"]) \
        .context_click() \
        .perform()

    context.context_menu_trigger = trigger
    context.context_menu_for = None


@given(u'that the user has brought up the context menu over a selection')
def step_impl(context):
    context.execute_steps(u"""
    When the user selects text
    And the user brings up the context menu on the selection
    Then a context menu is visible close to where the user invoked it
    And the context menu contains choices for wrapping text in new elements.
    """)


@when(ur'the user clicks (?P<choice>the first context menu option|a choice '
      ur'for wrapping text in new elements|'
      ur'a choice for creating an element (?:before|after) the selected '
      ur'element|'
      ur'a choice for creating a new (?P<new>.*)|'
      ur'the choice named "(?P<name>.*)")')
def step_impl(context, choice, new=None, name=None):
    util = context.util
    driver = context.driver

    # The following branches also normalize ``choice`` to shorter values
    if choice == "the first context menu option":
        choice = "first"
        link = util.wait(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, ".wed-context-menu li>a")))
    elif choice == "a choice for wrapping text in new elements":
        choice = "wrap"
        link = util.wait(EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT,
                                                     "Wrap in ")))
    elif (choice ==
          "a choice for creating an element before the selected element"):
        choice = "before"
        link = [x for x in util.find_descendants_by_text_re(
            ".wed-context-menu", "^Create new .+? before")
            if x.tag_name == "a"][0]
        util.wait(lambda *_: link.is_displayed())
    elif (choice ==
          "a choice for creating an element after the selected element"):
        choice = "after"
        link = [x for x in util.find_descendants_by_text_re(
            ".wed-context-menu", "^Create new .+? after")
            if x.tag_name == "a"][0]
        util.wait(lambda *_: link.is_displayed())
    elif choice.startswith("a choice for creating a new"):
        choice = "new"
        link = util.wait(EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT,
                                                     "Create new " + new)))
    elif choice.startswith("the choice named"):
        choice = None
        link = util.wait(EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT,
                                                     name)))
    else:
        raise ValueError("can't handle this type of choice: " + choice)

    # Record some information likely to be useful later.
    for_element = getattr(context, "context_menu_for", None)
    if for_element:
        info = {}
        context.context_menu_pre_transformation_info = info
        if choice in ("before", "after"):
            info["preceding"], info["following"] = \
                get_real_siblings(driver, for_element)
        elif choice == "new":
            info["children"] = driver.execute_script("""
            return jQuery(arguments[0]).children("._real").toArray();
            """, for_element)
    context.clicked_context_menu_item = \
        util.get_text_excluding_children(link).strip()

    # On Edge, the autoscrolling is crap. It brings the element only half into
    # view.
    if util.edge:
        driver.execute_script("arguments[0].scrollIntoView();", link)

    link.click()


@then(u'the first context menu option is "(?P<text>.*?)"')
def step_impl(context, text):
    driver = context.driver

    actual = driver.execute_script("""
    return document.querySelector(".wed-context-menu li>a").textContent.trim();
    """)
    assert_equal(actual, text)


@when(u'the user moves with the keyboard to a choice '
      u'for wrapping text in new elements')
def step_impl(context):
    driver = context.driver
    util = context.util

    link = util.wait(EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT,
                                                 "Wrap in ")))

    while not (driver.switch_to_active_element() == link):
        ActionChains(driver) \
            .send_keys(Keys.ARROW_DOWN) \
            .perform()

    context.clicked_context_menu_item = \
        util.get_text_excluding_children(link).strip()


@When(ur"the user clicks on a placeholder that will serve to bring up "
      ur"a context menu")
def step_impl(context):
    driver = context.driver
    util = context.util

    where = util.find_element((By.CLASS_NAME, "_placeholder"))

    ActionChains(driver)\
        .click(where) \
        .perform()

    context.context_menu_trigger = Trigger(util, where)
    context.context_menu_for = where


items_re = re.compile(r"(?:\s*,\s*|\s+and\s+)")
items_cleanup_re = re.compile(r"(?:^['\"]|['\"]$)")


@then(ur"the context menu contains options of the (?:(?P<what>kind|type)s? "
      ur"(?P<items>.*?)|other (?P<other>kind|type))\.?")
def step_impl(context, what=None, items=None, other=None):
    if items:
        expected = set([items_cleanup_re.sub('', i)
                        for i in items_re.split(items)])
    else:
        expected = set()
        expected.add("others")

    what = what or other

    # We reuse this set for diagnosis purposes...
    actual = set()

    def cond(driver):
        links = driver.execute_script("""
        var els = document.querySelectorAll(".wed-context-menu li>a");
        var ret = [];
        for(var i = 0, el; (el = els[i]) !== undefined; ++i)
            ret.push(el.textContent.trim());
        return ret;
        """)

        actual.clear()
        if what == "kind":
            for link in links:
                if link.startswith("Create new"):
                    actual.add("add")
                elif link.startswith("Delete "):
                    actual.add("delete")
                elif link.startswith("Element's documentation") or \
                        link in ("Test draggable", "Test resizable",
                                 "Test draggable resizable"):
                    actual.add("others")
                elif link == "Test typeahead":
                    actual.add("others")
                elif link.startswith("Split "):
                    # This is of kind transform in the code but for testing
                    # purposes it is "others"
                    actual.add("others")
                elif link.startswith("Unwrap "):
                    actual.add("unwrap")
                elif link.startswith("Wrap "):
                    actual.add("wrap")
                else:
                    raise Exception("can't analyse link: " + link)
        else:
            for link in links:
                if link.find("Add @") != -1 or \
                   link == "Delete this attribute":
                    actual.add("attribute")
                elif link.startswith("Element's documentation"):
                    actual.add("others")
                elif link.startswith("Create new") or\
                        link.startswith("Delete ") or \
                        link.startswith("Unwrap ") or \
                        link.startswith("Wrap ") or \
                        link.startswith("Split "):
                    actual.add("element")
                else:
                    raise Exception("can't analyse link: " + link)

        return actual == expected

    try:
        context.util.wait(cond)
    except TimeoutException:
        # This provides better diagnosis than a timeout error...
        assert_equal(actual, expected)


FILTER_TO_INDEX = ["transform", "add", "delete", "wrap", "unwrap",
                   "other", "element", "attribute", "other"]


@when(ur'the user clicks on the filter to show only options of '
      ur'(?P<what>kind|type) (?P<item>.*?)')
def step_impl(context, item, what):
    driver = context.driver
    item = items_cleanup_re.sub('', item)
    try:
        index = FILTER_TO_INDEX.index(item)
    except ValueError:
        raise ValueError("can't process item: " + item)

    # "other" appears twice in the list so...
    if what == "type" and item == "other":
        index = len(FILTER_TO_INDEX) - 1

    buttons = driver.find_elements_by_css_selector(
        ".wed-context-menu li:first-child button")

    buttons[index].click()


@then(ur'the context menu contains only the option "(?P<option>.*?)"')
def step_impl(context, option):

    def cond(driver):
        links = driver.execute_script("""
        var els = document.querySelectorAll(".wed-context-menu li>a");
        var ret = [];
        for(var i = 0, el; (el = els[i]) !== undefined; ++i)
            ret.push(el.textContent.trim());
        return ret;
        """)

        return links == [option]

    context.util.wait(cond)


@then(ur'the context menu contains (?P<choice>more than one option|'
      '3 options)')
def step_impl(context, choice):

    if choice == "more than one option":
        def cond(driver):
            els = driver.find_elements_by_css_selector(
                ".wed-context-menu li>a")
            return len(els) > 1
    else:
        def cond(driver):
            els = driver.find_elements_by_css_selector(
                ".wed-context-menu li>a")
            return len(els) == 3

    context.util.wait(cond)
