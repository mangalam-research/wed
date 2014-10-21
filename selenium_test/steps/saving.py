from urlparse import urljoin
import json
import re

import requests

from nose.tools import assert_equal  # pylint: disable=E0611
from behave import step_matcher


step_matcher("re")


@when('^the user saves$')
def step_impl(context):
    util = context.util
    util.ctrl_equivalent_x('S')

last_obj_re = re.compile('.*}{')


@then('^the data saved is properly serialized$')
def step_impl(context):
    resp = requests.get(urljoin(context.selenic.WED_SERVER,
                                "/build/ajax/save.txt"))
    expected = {
        u'command': u'save',
        u'data': u"""\
<TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader><fileDesc>\
<titleStmt><title>abcd</title></titleStmt><publicationStmt><p/>\
</publicationStmt><sourceDesc><p/></sourceDesc></fileDesc></teiHeader>\
<text><body><p><hi/>Blah blah <term>blah</term> blah.</p>\
<p><term>blah</term></p><p><ref/></p><p><hi>a</hi><hi>b</hi>c</p>\
<p>abcdefghij</p><p>aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\
<hi>aaaaaaaa aaaaaaaaaaa</hi>abcd</p><p>abcd abcd abcd abcd abcd abcd abcd \
abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd \
abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd \
abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd abcd \
abcd abcd abcd abcd abcd abcd abcd abcd</p>\
<p rend="rend_value" style="style_value">Blah</p><p rend="abc">Blah</p>\
<p part="">Blah</p><div sample=""/></body></text></TEI>"""

    }
    print resp.text.replace('\n***\n', '').strip()
    text = resp.text.replace('\n***\n', '').strip()
    text = last_obj_re.sub('{', text)
    actual = json.loads(text)
    # We don't care about the version here.
    del actual["version"]
    assert_equal(actual, expected)
