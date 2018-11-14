# All these tests are turned off in Chrome on OS X. There's something that
# prevents Cmd-C, Cmd-X, Cmd-V triggered from Selenium from working in OS
# X. It's been that way for years. Manual testing indicates the code works, and
# most likely if it works in Chrome on Linux, then it works on OS X too.
#
# Previous versions of wed handled copy/cut/paste differently and we could at
# least simulate some operations, but the latest code relies on the Clipboard
# API and thus the old simulation do not work: we have to generate the
# copy/cut/paste events from "real" user interactions.
@not.with_platform_browser=osx,ch
Feature: copying, cutting and pasting

# A lot of the tests are turned off for Edge due to stupid bugs in Edge.

@not.with_browser=edge
Scenario: span mode: copying a well-formed selection
  Given a document containing a top level element, a p element, and text.
  When the user selects the whole text of the first paragraph in "body"
  And the user copies
  Then the clipboard contains
  | type       | data                                                                  |
  | text/plain | Blah blah blah blah.                                                  |
  | text/xml   | Blah blah <term xmlns="http://www.tei-c.org/ns/1.0">blah</term> blah. |

@not.with_browser=edge
Scenario: span mode: copying a malformed selection as text
  Given a document containing a top level element, a p element, and text.
  When the user selects a region that is malformed
  And the user copies
  Then there is a notification of kind warning saying
"""
Selection is not well-formed XML, and consequently was copied naively.
"""
  And the clipboard contains
  | type       | data                                               |
  | text/plain | cd < title  < titleStmt \n publicationStmt >\s\n\s |

@not.with_browser=edge
Scenario: span mode: copying attribute text
  Given a document containing a top level element, a p element, and text.
  When the user selects the whole text of an attribute
  And the user copies
  Then the clipboard contains
  | type       | data       |
  | text/plain | rend_value |

@not.with_browser=edge
Scenario: unit mode: copying attributes
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the first attribute of the first element in "body"
  And the user copies
  Then the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" rend="rend_value"/> |
  When the user clicks on the second attribute of the first element in "body"
  And the user copies
  Then the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" style="style_value"/> |

@not.with_browser=edge
Scenario: unit mode: copy-adding attributes
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the first attribute of the first element in "body"
  And the user copy-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" rend="rend_value"/> |
  When the user clicks on the second attribute of the first element in "body"
  And the user copy-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" rend="rend_value" style="style_value"/> |

@not.with_browser=edge
Scenario: unit mode: copying elements
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the start label of the first element in "body"
  And the user copies
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="rend_value" style="style_value">Blah</p> |
  When the user clicks on the start label of the second element in "body"
  And the user copies
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="abc">Blah</p> |

@not.with_browser=edge
Scenario: unit mode: copy-adding elements
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the start label of the first element in "body"
  And the user copy-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="rend_value" style="style_value">Blah</p> |
  When the user clicks on the start label of the second element in "body"
  And the user copy-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="rend_value" style="style_value">Blah</p><p xmlns="http://www.tei-c.org/ns/1.0" rend="abc">Blah</p> |

@not.with_browser=edge
Scenario: unit mode: copy-adding elements after attributes does not mix elements and attributes
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the first attribute of the first element in "body"
  And the user copy-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" rend="rend_value"/> |
  When the user clicks on the start label of the second element in "body"
  And the user copy-adds
  Then there is a notification of kind danger saying
"""
The data to add to the clipboard is not of the same kind as the data already in the clipboard. Operation aborted.
"""
  And the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" rend="rend_value"/> |

@not.with_browser=edge
Scenario: unit mode: copy-adding attributes after elements does not mix elements and attributes
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the start label of the second element in "body"
  And the user copy-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="abc">Blah</p> |
  When the user clicks on the first attribute of the first element in "body"
  And the user copy-adds
  Then there is a notification of kind danger saying
"""
The data to add to the clipboard is not of the same kind as the data already in the clipboard. Operation aborted.
"""
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="abc">Blah</p> |

@not.with_browser=edge
Scenario: span mode: cutting a well-formed selection
  Given a document containing a top level element, a p element, and text.
  When the user selects the whole text of the first paragraph in "body"
  And the user cuts
  Then the clipboard contains
  | type       | data                                                                  |
  | text/plain | Blah blah blah blah.                                                  |
  | text/xml   | Blah blah <term xmlns="http://www.tei-c.org/ns/1.0">blah</term> blah. |
  And the text is cut

Scenario: span mode: cutting a malformed selection
  Given a document containing a top level element, a p element, and text.
  When the user selects a region that is malformed
  And the user cuts
  Then there is a notification of kind danger saying
"""
Selection is not well-formed XML, and consequently the selection cannot be cut.
"""
  And the text is not cut

@not.with_browser=edge
Scenario: span mode: cutting attribute text
  Given a document containing a top level element, a p element, and text.
  When the user selects the whole text of an attribute
  And the user cuts
  Then the clipboard contains
  | type       | data       |
  | text/plain | rend_value |
  And the attribute contains no text

@not.with_browser=edge
Scenario: span mode: cutting from a readonly element
  Given a document with readonly elements
  When the user selects the whole text of a readonly element with the text "abc"
  And the user cuts
  Then the current element has the text "abc"

@not.with_browser=edge
Scenario: span mode: cutting from a readonly attribute
  Given a document with readonly elements
  When the user selects the whole text of a readonly attribute with the text "x"
  And the user cuts
  Then the current attribute has the text "x"

@not.with_browser=edge
Scenario: unit mode: cutting attributes
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the first attribute of the first element in "body"
  Then the caret is in an element with the attributes
  | name  | ns | value       |
  | rend  |    | rend_value  |
  | style |    | style_value |
  When the user cuts
  Then the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" rend="rend_value"/> |
  And the caret is in an element with the attributes
  | name  | ns | value       |
  | style |    | style_value |
  # The caret is now in the 2nd attribute, so we are cutting it with the
  # next operation.
  When the user cuts
  Then the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" style="style_value"/> |
  And the caret is in an element with no attributes
  # We deleted all attributes, so the caret is now in the element itself.
  And the caret is in the first element in "body"

@not.with_browser=edge
Scenario: unit mode: cut-adding attributes
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the first attribute of the first element in "body"
  Then the caret is in an element with the attributes
  | name  | ns | value       |
  | rend  |    | rend_value  |
  | style |    | style_value |
  When the user cut-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" rend="rend_value"/> |
  And the caret is in an element with the attributes
  | name  | ns | value       |
  | style |    | style_value |
  # The caret is now in the 2nd attribute, so we are cutting it with the
  # next operation.
  When the user cut-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" rend="rend_value" style="style_value"/> |
  And the caret is in an element with no attributes
  # We deleted all attributes, so the caret is now in the element itself.
  And the caret is in the first element in "body"

@not.with_browser=edge
Scenario: unit mode: cutting elements
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the start label of the first element in "body"
  Then the caret is in an element with the attributes
  | name  | ns | value       |
  | rend  |    | rend_value  |
  | style |    | style_value |
  When the user cuts
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="rend_value" style="style_value">Blah</p> |
  And the caret is in an element with the attributes
  | name  | ns | value |
  | rend  |    | abc   |
  When the user cuts
  Then the clipboard contains
  | type       | data                                                       |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="abc">Blah</p> |
  And the caret is in an element with the attributes
  | name   | ns | value |
  | sample |    |       |

@not.with_browser=edge
Scenario: unit mode: cut-adding elements
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the start label of the first element in "body"
  Then the caret is in an element with the attributes
  | name  | ns | value       |
  | rend  |    | rend_value  |
  | style |    | style_value |
  When the user cut-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="rend_value" style="style_value">Blah</p> |
  And the caret is in an element with the attributes
  | name  | ns | value |
  | rend  |    | abc   |
  When the user cut-adds
  Then the clipboard contains
  | type       | data                                                       |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="rend_value" style="style_value">Blah</p><p xmlns="http://www.tei-c.org/ns/1.0" rend="abc">Blah</p> |
  And the caret is in an element with the attributes
  | name   | ns | value |
  | sample |    |       |

@not.with_browser=edge
Scenario: unit mode: cut-adding elements after attributes does not mix elements and attributes
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the first attribute of the first element in "body"
  Then the caret is in an element with the attributes
  | name  | ns | value       |
  | rend  |    | rend_value  |
  | style |    | style_value |
  When the user cut-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" rend="rend_value"/> |
  And the caret is in an element with the attributes
  | name  | ns | value       |
  | style |    | style_value |
  When the user clicks on the start label of the second element in "body"
  Then the caret is in an element with the attributes
  | name | ns | value |
  | rend |    | abc   |
  When the user cut-adds
  Then there is a notification of kind danger saying
"""
The data to add to the clipboard is not of the same kind as the data already in the clipboard. Operation aborted.
"""
  And the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" rend="rend_value"/> |
  And the caret is in an element with the attributes
  | name | ns | value |
  | rend |    | abc   |

@not.with_browser=edge
Scenario: unit mode: cut-adding attributes after elements does not mix elements and attributes
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the start label of the first element in "body"
  Then the caret is in an element with the attributes
  | name  | ns | value       |
  | rend  |    | rend_value  |
  | style |    | style_value |
  When the user cut-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="rend_value" style="style_value">Blah</p> |
  When the user clicks on the first attribute of the first element in "body"
  Then the caret is in an element with the attributes
  | name | ns | value |
  | rend |    | abc   |
  When the user cut-adds
  Then there is a notification of kind danger saying
"""
The data to add to the clipboard is not of the same kind as the data already in the clipboard. Operation aborted.
"""
  And the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="rend_value" style="style_value">Blah</p> |
  And the caret is in an element with the attributes
  | name | ns | value |
  | rend |    | abc   |


@not.with_browser=edge
Scenario: unit mode: cutting a readonly attribute
  Given a document with readonly elements
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks in the text of a readonly attribute with the text "x"
  Then the caret is in an element with the attributes
  | name      | ns                            | value       |
  | xmlns:foo | http://www.w3.org/2000/xmlns/ | uri         |
  | baz       |                               | x           |
  | foo:baz   | uri                           | x           |
  When the user cuts
  Then the caret is in an element with the attributes
  | name      | ns                            | value       |
  | xmlns:foo | http://www.w3.org/2000/xmlns/ | uri         |
  | baz       |                               | x           |
  | foo:baz   | uri                           | x           |

@not.with_browser=edge
Scenario: unit mode: cutting a readonly element
  Given a document with readonly elements
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks in the text of a readonly element with the text "abc"
  Then the caret is in an element with the attributes
  | name      | ns                            | value       |
  | xmlns:foo | http://www.w3.org/2000/xmlns/ | uri         |
  | baz       |                               | x           |
  | foo:baz   | uri                           | x           |
  When the user cuts
  Then the caret is in an element with the attributes
  | name      | ns                            | value       |
  | xmlns:foo | http://www.w3.org/2000/xmlns/ | uri         |
  | baz       |                               | x           |
  | foo:baz   | uri                           | x           |

@not.with_browser=edge
Scenario: span mode: pasting text
  Given a document containing a top level element, a p element, and text.
  When the user selects the whole text of an element
  And the user cuts
  Then the text is cut
  When the user pastes
  Then the text is pasted

@not.with_browser=edge
Scenario: span mode: pasting text that triggers an input trigger
  Given a document without "hi"
  When the user selects the whole text of the first paragraph in "body"
  And the user cuts
  And the user uses the keyboard to bring up the context menu
  And the user clicks a choice for creating a new hi
  And the user pastes
  Then the first "hi" in body has the text "A"
  And the second "hi" in body has the text "B"

@not.with_browser=edge
Scenario: span mode: pasting text that triggers an input trigger outside an element that should trigger it
  Given a document without "hi"
  When the user selects the whole text of the first paragraph in "body"
  And the user cuts
  Then the text is cut
  When the user pastes
  Then the first paragraph in body has the text "A;B"

@not.with_browser=edge
Scenario: span mode: pasting XML
  Given a document containing a top level element, a p element, and text.
  When the user selects the whole contents of the first paragraph in "body"
  And the user cuts
  And the user clicks on the end label of the last paragraph
  And the user hits the right arrow
  And the user brings up the context menu
  And the user clicks a choice for creating a new p
  And the user pastes
  Then the text is pasted into the new paragraph

@not.with_browser=edge
Scenario: span mode: pasting in a readonly element
  Given a document with readonly elements
  When the user selects the whole text of an element
  And the user copies
  And the user clicks in the text of a readonly element with the text "abc"
  And the user pastes
  Then the current element has the text "abc"

@not.with_browser=edge
Scenario: span mode: pasting in a readonly attribute
  Given a document with readonly elements
  When the user selects the whole text of an element
  And the user copies
  And the user clicks in the text of a readonly attribute with the text "x"
  And the user pastes
  Then the current attribute has the text "x"

@not.with_browser=edge
Scenario: unit mode: pasting attributes
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the first attribute of the first element in "body"
  And the user copy-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" rend="rend_value"/> |
  When the user clicks on the second attribute of the first element in "body"
  And the user copy-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <wed:attributes xmlns:wed="http://mangalamresearch.org/ns/wed/clipboard" rend="rend_value" style="style_value"/> |
  When the user clicks on the start label of the first "div" element in "body"
  Then the caret is in an element with the attributes
  | name   | ns | value |
  | sample |    |       |
  # The clipboard "remembers" what mode it was in. So switching the mode has no
  # effect.
  When the user switches to span selection mode
  Then the selection mode is span
  When the user pastes
  Then the caret is in an element with the attributes
  | name   | ns | value       |
  | sample |    |             |
  | rend   |    | rend_value  |
  | style  |    | style_value |

@not.with_browser=edge
Scenario: unit mode: pasting elements
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the start label of the first element in "body"
  And the user copy-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="rend_value" style="style_value">Blah</p> |
  When the user clicks on the start label of the second element in "body"
  And the user copy-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="rend_value" style="style_value">Blah</p><p xmlns="http://www.tei-c.org/ns/1.0" rend="abc">Blah</p> |
  When the user clicks on the start label of the first element in "body"
  And the user clicks on the end label of the last paragraph
  And the user hits the right arrow
  And the user brings up the context menu
  And the user clicks a choice for creating a new p
  Then the current element has the text ""
  # Switching the mode has no effect.
  When the user switches to span selection mode
  Then the selection mode is span
  When the user pastes
  Then the current element has the text "BlahBlah"
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user cuts
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0"><p rend="rend_value" style="style_value">Blah</p><p rend="abc">Blah</p></p>  |

@not.with_browser=edge
Scenario: unit mode: pasting elements into attributes
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the start label of the first element in "body"
  And the user copy-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="rend_value" style="style_value">Blah</p> |
  When the user clicks on the first attribute of the first element in "body"
  Then the caret is in an element with the attributes
  | name  | ns | value       |
  | rend  |    | rend_value  |
  | style |    | style_value |
  When the user pastes
  Then the caret is in an element with the attributes
  | name  | ns | value           |
  | rend  |    | rend_Blahvalue  |
  | style |    | style_value     |

@not.with_browser=edge
Scenario: unit mode: pasting elements where they cannot
  Given a document for testing unit selection mode
  When the user switches to unit selection mode
  Then the selection mode is unit
  When the user clicks on the start label of the first element in "body"
  And the user copy-adds
  Then the clipboard contains
  | type       | data |
  | text/xml   | <p xmlns="http://www.tei-c.org/ns/1.0" rend="rend_value" style="style_value">Blah</p> |
  When the user clicks on the end label of an element
  And the user pastes
  Then there is a notification of kind danger saying
"""
Cannot paste the content here.
"""
