from nose.tools import assert_equal  # pylint: disable=E0611

import wedutil

@when(u'the user copies')
def step_impl(context):
    wedutil.copy(context.util)


@when(u'the user copy-adds')
def step_impl(context):
    wedutil.copy_add(context.util)


def get_clipboard(driver, util):
    #
    # Browsers disallow just polling the clipboard randomly. So to work
    # around that, we set an element on which we have a "paste" handler
    # which allows us to read the clipboard.
    #
    # However, there's an issue with this method. Suppose a copy handler
    # which sets the data on the clipboard so that MIME type A is
    # associated with an empty string, and MIME type B is associated
    # with some non-empty string value. In Chrome, when the paste event
    # is processed, the clipboard data on the paste event will only
    # contain information for MIME type B. It is as if MIME type A was
    # never set in the first place. This seems to be some sort of
    # normalization happening behind the scenes.
    #
    # So we cannot distinguish between a MIME type not having been set
    # at all, and a MIME type set to the empty string.
    #

    driver.execute_script("""
    const fake = document.createElement("input");
    window.__wedClipboard = {};
    fake.addEventListener("paste", function (ev) {
      const cd = ev.clipboardData;
      for (const type of cd.types) {
        __wedClipboard[type] = cd.getData(type);
      }

      document.body.removeChild(fake);
    });
    document.body.appendChild(fake);
    fake.focus();
    """)

    wedutil.paste(util)

    return driver.execute_script("""
    const ret = __wedClipboard;
    delete window.__wedClipboard;
    // We must refocus the editor.
    wed_editor.caretManager.focusInputField();
    return ret;
    """)


@then(u'the clipboard contains')
def step_impl(context):
    driver = context.driver
    util = context.util

    clipboard = get_clipboard(driver, util)

    for row in context.table.rows:
        data_type = row["type"]
        data = clipboard[data_type]
        assert_equal(data,
                     row["data"].replace("\\n", "\n")
                     .replace("\\s", " "))


@then(u'the clipboard is empty')
def step_impl(context):
    driver = context.driver
    util = context.util

    clipboard = get_clipboard(driver, util)

    assert_equal(len(clipboard), 0, "the clipboard should be empty")
