import os
from selenic import configs
import argparse
_dirname = os.path.dirname(__file__)

parser = argparse.ArgumentParser()
parser.add_argument('--jenkins', action="store_true",
                    help='output values for Jenkins')
options = parser.parse_args()

local_conf_path = os.path.join(os.path.dirname(_dirname),
                               "build", "config", "selenium_config.py")

execfile(local_conf_path)

if not options.jenkins:
    for c in configs:
        print c.as_parameter()
else:
    vals = [c.as_parameter("|").replace(" ", "_") for c in configs]
    print "TEST_BROWSER=" + ' '.join(vals)
