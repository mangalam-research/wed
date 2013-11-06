 # pylint: disable=E0611
from nose.tools import assert_equal, assert_is_not_none


step_matcher("re")


@then(ur"^the selection is wrapped in a new element.?$")
def step_impl(context):
    util = context.util

    item = context.clicked_context_menu_item
    if not item.startswith("Wrap in "):
        raise ValueError("unexpected item value: " + item)

    element_name = item[len("Wrap in"):]
    parent = context.selection_parent

    child = parent.find_element_by_class_name(element_name)
    assert_equal(util.get_text_excluding_children(child),
                 context.expected_selection)


@then(ur"^a new element is inserted before the selected element.?$")
def step_impl(context):
    for_element = context.context_menu_for
    info = context.context_menu_pre_transformation_info
    assert_is_not_none(for_element)
    preceding = for_element.find_elements_by_xpath("preceding-sibling::*")
    following = for_element.find_elements_by_xpath("following-sibling::*")
    assert_equal(len(info["preceding"]) + 1, len(preceding))
    assert_equal(len(info["following"]), len(following))


@then(ur"^a new element is inserted after the selected element.?$")
def step_impl(context):
    for_element = context.context_menu_for
    info = context.context_menu_pre_transformation_info
    assert_is_not_none(for_element)
    preceding = for_element.find_elements_by_xpath("preceding-sibling::*")
    following = for_element.find_elements_by_xpath("following-sibling::*")
    assert_equal(len(info["preceding"]), len(preceding))
    assert_equal(len(info["following"]) + 1, len(following))
