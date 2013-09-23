import os

_dirname = os.path.dirname(__file__)

conf_path = os.path.join(os.path.dirname(_dirname),
                         "build", "config", "selenium_test_config.py")
conf = {"__file__": conf_path}
execfile(conf_path, conf)


def before_all(context):
    context.driver = conf["get_driver"]()


def after_all(context):
    context.driver.quit()
