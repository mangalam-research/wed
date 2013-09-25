import os

_dirname = os.path.dirname(__file__)

conf_path = os.path.join(os.path.dirname(_dirname),
                         "build", "config", "selenium_test_config.py")
conf = {"__file__": conf_path}
execfile(conf_path, conf)


def before_all(context):
    context.driver = conf["get_driver"]()


def after_all(context):
    driver = context.driver
    conf["set_test_status"](driver.session_id, not context.failed)
    if not context.failed:
        driver.quit()
