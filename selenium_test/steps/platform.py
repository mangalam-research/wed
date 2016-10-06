import collections

from nose.tools import assert_equal, assert_true

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


@then(u"normalize is a polyfill")
def step_impl(context):
    driver = context.driver

    assert_true(driver.execute_script("""
    return ('prototype' in Node.prototype.normalize);
    """), "normalize should be a polyfill")


@then(u"normalize joins adjacent text nodes")
def step_impl(context):
    driver = context.driver

    results = driver.execute_script("""
    var top = document.createElement("div");
    top.appendChild(document.createTextNode("a"));
    top.appendChild(document.createTextNode("b"));
    var child = document.createElement("p");
    child.appendChild(document.createTextNode("a"));
    child.appendChild(document.createTextNode("b"));
    top.appendChild(child);
    top.normalize();

    return [top.childNodes.length,
            top.innerHTML,
            child.childNodes.length,
            child.innerHTML];
    """)

    assert_equal(results[0], 2, "the top should have 2 children")
    assert_equal(results[1], "ab<p>ab</p>")
    assert_equal(results[2], 1, "the p element should have one child")
    assert_equal(results[3], "ab")


@then(u"normalize deletes empty text nodes")
def step_impl(context):
    driver = context.driver

    results = driver.execute_script("""
    var frag = document.createDocumentFragment();
    var child = document.createElement("p");
    child.appendChild(document.createTextNode(""));
    frag.appendChild(child);
    frag.appendChild(document.createTextNode(""));
    frag.normalize();

    return [frag.childNodes.length, child.childNodes.length];
    """)

    assert_equal(results[0], 1, "the fragment should have one child")
    assert_equal(results[1], 0, "the p element should have no children")


@then(u"String.prototype.repeat works")
def step_impl(context):
    results = context.driver.execute_script("""
    return [
      "".repeat(10),
      "a".repeat(0),
      "b".repeat(3),
    ];
    """)

    assert_equal(results[0], "")
    assert_equal(results[1], "")
    assert_equal(results[2], "bbb")
