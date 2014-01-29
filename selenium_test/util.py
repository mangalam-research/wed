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
