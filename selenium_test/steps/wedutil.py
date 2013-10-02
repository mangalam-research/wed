from selenic import util

import time


def wait_for_caret_to_be_in(driver, element):
    def condition(*_):
        return driver.execute_script("""
        var $ = jQuery;
        var element = arguments[0];
        var caret = wed_editor.getCaret();
        var ret = $(caret[0]).closest(element).length > 0;
        return ret;
        """, element)
    util.wait(driver, condition)


def caret_selection_pos(driver):
    """
    Gets the ``x, y`` position of the caret relative to the
    screen. The ``y`` coordinate is set to the middle of the caret's
    height to avoid boundary conditions.

    :param driver: The Selenium driver to operate on.
    :returns: The position.
    :rtype: ``{"left": x, "top": y}`` where ``x`` and ``y`` are
            the coordinates.
    """
    pos = driver.execute_script("""
    var pos = wed_editor._$fake_caret.offset();
    pos.top += wed_editor._$fake_caret.height() / 2;
    return pos;
    """)

    # ChromeDriver chokes on float values.
    pos["left"] = int(pos["left"])
    pos["top"] = int(pos["top"])
    return pos


def select_text(driver, start, end):
    """
    Sends commands to a Selenium driver to select text.

    :param driver: The Selenium driver to operate on.
    :param start: The start coordinates where to start the selection.
    :type start: ``{"left": x, "top": y}`` where ``x`` and ``y`` are
                 the coordinates.
    :param end: The end coordinates where to end the selection.
    :type end: ``{"left": x, "top": y}`` where ``x`` and ``y`` are
                 the coordinates.
    """

    #
    # This does not work...
    #
    # from selenium.webdriver.common.action_chains import ActionChains
    #
    # gui_root = driver.find_element_by_class_name("wed-document")
    #
    # ActionChains(driver)\
    #     .move_to_element_with_offset(gui_root, start["left"], start["top"])\
    #     .click_and_hold()\
    #     .move_to_element_with_offset(gui_root, end["left"], end["top"])\
    #     .release()\
    #     .perform()
    #
    # So...
    #

    driver.execute_script("""
    var $ = jQuery;
    var start = arguments[0];
    var end = arguments[1];
    var $gui_root = wed_editor.$gui_root;
    var event = new $.Event("mousedown");
    event.pageX = start.left;
    event.pageY = start.top;
    event.which = 1;
    $gui_root.trigger(event);
    setTimeout(function () {
    var event = new $.Event("mousemove");
    event.pageX = end.left;
    event.pageY = end.top;
    $gui_root.trigger(event);
    setTimeout(function () {
    var event = new $.Event("mouseup");
    event.pageX = end.left;
    event.pageY = end.top;
    event.which = 1;
    $gui_root.trigger(event);
    }, 10);
    }, 10);
    """, start, end)
    time.sleep(0.2)
