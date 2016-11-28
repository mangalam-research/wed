Feature: save
 Users want to be able to save.

Scenario: serializes namespaces properly
  Given a document containing a top level element, a p element, and text.
  When the user clicks on the start label of the first "p" element in "body"
  And the user hits the right arrow
  And the user uses the keyboard to bring up the context menu
  And the user clicks a choice for creating a new hi
  And the user saves
  Then the data saved is properly serialized

Scenario: serializes multiple top namespaces properly
  Given a document that has multiple top namespaces
  When the user clicks on the start label of the first "p" element in "body"
  And the user hits the right arrow
  And the user uses the keyboard to bring up the context menu
  And the user clicks a choice for creating a new hi
  And the user saves
  Then the data saved is properly serialized

#
# We no longer perform the reload tests through Selenium. Around the
# time of Chrome 52-53, Selenium started hanging on driver.refresh()
# if onbeforeunload showed a dialog box. This seems to be a bug in
# Chrome or chromedriver or something. Rather than chase the bug,
# we've dropped these tests here and instead check in wed_test.js that
# onbeforeunload returns expected values. This won't trap issues with
# bizarro platforms, unfortunately but that was the expedient thing to
# do.
#

#
# Scenario: reloading a modified document brings up a prompt
#   Given a document containing a top level element, a p element, and text.
#   And that the user has deleted all the text in an element
#   When the user reloads
#   And the user cancels the alert
#   And waits for the editor

# Scenario: reloading an unmodified document does not bring up a prompt
#   Given a document containing a top level element, a p element, and text.
#   When the user reloads
#   And waits for the editor
