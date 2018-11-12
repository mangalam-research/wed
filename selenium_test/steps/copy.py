from nose.tools import assert_equal  # pylint: disable=E0611

import wedutil

@when(u'the user copies')
def step_impl(context):
    wedutil.copy(context.util)


@then(u'the clipboard contains')
def step_impl(context):
    driver = context.driver
    util = context.util

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

    clipboard = driver.execute_script("""
    const ret = __wedClipboard;
    delete window.__wedClipboard;
    return ret;
    """)

    for row in context.table.rows:
        data_type = row["type"]
        data = clipboard[data_type]
        assert_equal(data,
                     row["data"].replace("\\n", "\n")
                     .replace("\\s", " "))
