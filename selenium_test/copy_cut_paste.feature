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
Scenario: copying a well-formed selection
  Given a document containing a top level element, a p element, and text.
  When the user selects the whole text of the first paragraph in "body"
  And the user copies
  Then the clipboard contains
  | type       | data                                                                  |
  | text/plain | Blah blah blah blah.                                                  |
  | text/xml   | Blah blah <term xmlns="http://www.tei-c.org/ns/1.0">blah</term> blah. |

@not.with_browser=edge
Scenario: copying a malformed selection as text
  Given a document containing a top level element, a p element, and text.
  When the user selects a region that is malformed
  And the user copies
  Then there is a notification of kind warning saying
"""
Selection is not well-formed XML, and consequently was copied as text.
"""
  And the clipboard contains
  | type       | data                                               |
  | text/plain | cd < title  < titleStmt \n publicationStmt >\s\n\s |

@not.with_browser=edge
Scenario: copying attribute text
  Given a document containing a top level element, a p element, and text.
  When the user selects the whole text of an attribute
  And the user copies
  Then the clipboard contains
  | type       | data       |
  | text/plain | rend_value |


@not.with_browser=edge
Scenario: cutting a well-formed selection
  Given a document containing a top level element, a p element, and text.
  When the user selects the whole text of the first paragraph in "body"
  And the user cuts
  Then the clipboard contains
  | type       | data                                                                  |
  | text/plain | Blah blah blah blah.                                                  |
  | text/xml   | Blah blah <term xmlns="http://www.tei-c.org/ns/1.0">blah</term> blah. |
  And the text is cut

Scenario: cutting a malformed selection
  Given a document containing a top level element, a p element, and text.
  When the user selects a region that is malformed
  And the user cuts
  Then there is a notification of kind danger saying
"""
Selection is not well-formed XML, and consequently the selection cannot be cut.
"""
  And the text is not cut

@not.with_browser=edge
Scenario: cutting attribute text
  Given a document containing a top level element, a p element, and text.
  When the user selects the whole text of an attribute
  And the user cuts
  Then the clipboard contains
  | type       | data       |
  | text/plain | rend_value |
  And the attribute contains no text

@not.with_browser=edge
Scenario: cutting from a readonly element
  Given a document with readonly elements
  When the user selects the whole text of a readonly element with the text "abc"
  And the user cuts
  Then the current element has the text "abc"

@not.with_browser=edge
Scenario: cutting from a readonly attribute
  Given a document with readonly elements
  When the user selects the whole text of a readonly attribute with the text "x"
  And the user cuts
  Then the current attribute has the text "x"

@not.with_browser=edge
Scenario: pasting text
  Given a document containing a top level element, a p element, and text.
  When the user selects the whole text of an element
  And the user cuts
  Then the text is cut
  When the user pastes
  Then the text is pasted

@not.with_browser=edge
Scenario: pasting text that triggers an input trigger
  Given a document without "hi"
  When the user selects the whole text of the first paragraph in "body"
  And the user cuts
  And the user uses the keyboard to bring up the context menu
  And the user clicks a choice for creating a new hi
  And the user pastes
  Then the first "hi" in body has the text "A"
  And the second "hi" in body has the text "B"

@not.with_browser=edge
Scenario: pasting text that triggers an input trigger outside an element that should trigger it
  Given a document without "hi"
  When the user selects the whole text of the first paragraph in "body"
  And the user cuts
  Then the text is cut
  When the user pastes
  Then the first paragraph in body has the text "A;B"

@not.with_browser=edge
Scenario: pasting XML
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
Scenario: pasting in a readonly element
  Given a document with readonly elements
  When the user selects the whole text of an element
  And the user copies
  And the user clicks in the text of a readonly element with the text "abc"
  And the user pastes
  Then the current element has the text "abc"

  @not.with_browser=edge
Scenario: pasting in a readonly attribute
  Given a document with readonly elements
  When the user selects the whole text of an element
  And the user copies
  And the user clicks in the text of a readonly attribute with the text "x"
  And the user pastes
  Then the current attribute has the text "x"
