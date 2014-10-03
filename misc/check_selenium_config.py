import os
from selenic import Builder
_dirname = os.path.dirname(__file__)

local_conf_path = os.path.join(os.path.dirname(_dirname),
                               "build", "config", "selenium_config.py")

builder = Builder(local_conf_path)

print "***"
print builder.config
print "***"
