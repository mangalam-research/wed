from nose.tools import assert_true  # pylint: disable=E0611

from selenic.util import Condition, Result
import wedutil

@when(u'the user pastes')
def step_impl(context):
    wedutil.paste(context.util)


@then(u'the text is pasted')
def step_impl(context):
    util = context.util
    parent = context.selection_parent
    text = context.expected_selection

    # It may take a bit.
    util.wait(lambda *_: util.get_text_excluding_children(parent) == text)


@then(ur'the text is pasted into the new paragraph')
def step_impl(context):

    def cond(driver):
        text = driver.execute_script("""
        var ps = wed_editor.dataRoot.querySelectorAll("body>p");
        var p = ps[ps.length - 1];
        return p.innerHTML;
        """)
        return Result(text == context.expected_selection_serialization,
                      text)

    ret = Condition(context.util, cond).wait()
    assert_true(ret,
                ret.payload + " should equal " +
                context.expected_selection_serialization)
