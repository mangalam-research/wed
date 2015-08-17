import collections

# pylint: disable=no-name-in-module
from nose.tools import assert_equal

Case = collections.namedtuple('Case', ('input', 'output'))

XML_CASES = [
    Case("<p>Blah</p>", "Blah"),
    Case("<p a='>'><span>Blah</span></p>", "<span>Blah</span>"),
    Case("<p a='>'>text<span>Blah</span>more text</p>",
         "text<span>Blah</span>more text"),
    Case('<p b=">">Blah</p>', "Blah"),
    Case('<p a="blah>blah" b=\'blah>\'>Text<span a="blue">Blah</span></p>',
         'Text<span a="blue">Blah</span>')
]

step_matcher("re")


@then(u"the innerHTML field of XML nodes produces valid values")
def step_impl(context):
    driver = context.driver

    outputs = driver.execute_script("""
    var inputs = arguments[0];
    var parser = new DOMParser();
    var outputs = [];
    for(var i = 0, input; (input = inputs[i]); ++i) {
        var doc = parser.parseFromString(input, "text/xml");
        outputs.push(doc.firstChild.innerHTML);
    }
    return outputs
    """, [case.input for case in XML_CASES])

    for output, case in zip(outputs, XML_CASES):
        assert_equal(output, case.output)
