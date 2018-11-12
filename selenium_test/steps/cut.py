from behave import step_matcher
from nose.tools import assert_true  # pylint: disable=E0611

import wedutil

step_matcher("re")

@when(u"the user cuts")
def step_impl(context):
    wedutil.cut(context.util)


@then(u"the text is (?P<negation>not )?cut")
def step_impl(context, negation=None):
    util = context.util
    parent = context.selection_parent

    test = lambda *_: not len(util.get_text_excluding_children(parent)) \
        if negation is None else \
        lambda *_: len(util.get_text_excluding_children(parent))

    # It may take a bit.
    util.wait(test)


@then(u"the attribute contains no text")
def step_impl(context):
    result = context.driver.execute_script("""
    const { node } = wed_editor.caretManager.getDataCaret();
    if (!(node instanceof Attr || node.nodeType === Node.ATTRIBUTE_NODE)) {
      return [false, "data caret should be in an attribute"];
    }

    return [node.value === "", "the attribute value should be empty"];
    """)

    assert_true(result[0], result[1])
