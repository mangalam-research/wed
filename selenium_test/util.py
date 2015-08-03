import wedutil
from selenium.webdriver.common.action_chains import ActionChains


class Trigger(object):
    util = None
    el = None
    _location = None
    _size = None

    def __init__(self, util=None, element=None, location=None, size=None):
        """
        A target can be associated with an actual element. In this
        case, the constructor should be called with ``util`` and
        ``element`` set. Or a target can be just a set of coordinates
        and dimensions. In this case, the constructor should be called
        with ``location`` and ``size`` set. (Other combinations have
        undefined behavior: garbage in, garbage out.) Note that in the
        former case, the location and dimensions of the target may
        change when the element moves or is resized, in latter case,
        the location and dimensions are constant. (This is important
        if testing cases where the screen has been scrolled after the
        target was created).

         :param util: Selenic's util object.
        :param element: The element to which this trigger corresponds.
        :type element: :class:`selenium.webdriver.remote.webelement.WebElement`
        :param location: The location of the trigger.
        :type location: :class:`dict` of the format ``{'left': x
                        corrdinate, 'top': y coordinate}``
        :param size: The size of the trigger.
        :type size: :class:`dict` of the format ``{'width': width of
                    the target, 'height': height of the target}``

        """
        if element:
            self.util = util
            self.el = element
        else:
            self._location = location
            self._size = size

    @property
    def location(self):
        if self._location:
            return self._location
        else:
            return self.util.element_screen_position(self.el)

    @property
    def size(self):
        if self._size:
            return self._size
        else:
            return self.el.size


def get_element_parent_and_parent_text(driver, selector):
    """
    Given a CSS selector, return the element found, its parent and the
    text of the parent, excluding any children.
    """
    return driver.execute_script("""
    var button = jQuery(arguments[0])[0];
    var parent = button.parentNode;
    var parent_text = jQuery(parent).contents().filter(function() {
       return this.nodeType == Node.TEXT_NODE;
    }).text();
    return [button, parent, parent_text];
    """, selector)


def get_real_siblings(driver, element):
    """
    Returns a couple whose first member is the list of siblings before
    ``element``, and the second member is the list of siblings after
    ``element``. All siblings must be of the ``_real`` class.
    """
    preceding, following = driver.execute_script("""
    var el = arguments[0];
    var before = [];
    var after = [];
    var child = el.parentNode.firstElementChild;
    var into = before;

    while(child) {
        if (child === el)
            into = after;
        else if (child.classList.contains("_real"))
            into.push(child);
        child = child.nextElementSibling;
    }
    return [before, after];
    """, element)

    return (preceding, following)


def wait_for_editor(context, tooltips=False):
    util = context.util
    driver = context.driver
    builder = context.builder
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
    if builder.config.browser == "FIREFOX":
        body = driver.find_element_by_css_selector(".wed-document")
        ActionChains(driver) \
            .move_to_element_with_offset(body, 1, 1) \
            .click() \
            .perform()
