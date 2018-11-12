from nose.tools import assert_true  # pylint: disable=E0611

@then("there is a notification of kind {kind} saying")
def step_impl(context, kind):
    text = context.text.strip()
    driver = context.driver

    result = driver.execute_script("""
    const [kind, content] = arguments;
    const notification =
      document.querySelector("[data-notify='container']");
    if (!notification) {
      return [false, "there should be a notification"];
    }

    if (!notification.classList.contains(`alert-${kind}`)) {
      return [false, `the notification should be of kind ${kind}`];
    }

    const message =
      notification.querySelector("[data-notify='message']");
    if (!message) {
      return [false, "there should be a message"];
    }

    return [message.textContent === content,
            `the message should be ${content}`];
    """, kind, text)

    assert_true(result[0], result[1])
