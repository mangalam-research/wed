
from nose.tools import assert_equal  # pylint: disable=E0611


@then("the selection is wrapped in a new element.")
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
