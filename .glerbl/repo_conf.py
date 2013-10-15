import sys
import os

dirname = os.path.dirname(__file__)

python_path = os.path.join(os.path.dirname(dirname), "selenium_test", "lib")
if "PYTHONPATH" not in os.environ:
    os.environ["PYTHONPATH"] = python_path
else:
    os.environ["PYTHONPATH"] = python_path + ":" + os.environ["PYTHONPATH"]

checks = {
    'pre-commit': [
        # BEFORE_COMMIT in the root of the working tree can be used as
        # reminder to do something before the next commit.
        "no_before_commit",

        # We only allow ASCII filenames.
        "no_non_ascii_filenames",

        # We don't allow trailing whitespaces.
        "no_trailing_whitespace",

        # Python files must conform to PEP8
        "python_pep8",

        # Python files must not have trailing semicolons
        "python_no_trailing_semicolon"
    ]
}
