Feature: save
 Users want to be able to save.

Background: a simple document.
  Given a document containing a top level element, a p element, and text.

Scenario: serializes namespaces properly
  When the user clicks on the start label of the first "p" element in "body"
  And the user hits the right arrow
  And the user uses the keyboard to bring up the context menu
  And the user clicks a choice for creating a new hi
  And the user saves
  Then the data saved is properly serialized

Scenario: reloading a modified document brings up a prompt
  Given that the user has deleted all the text in an element
  When the user reloads
  Then a reload prompt with the text "The document has unsaved modifications. Do you really want to leave without saving?" comes up
  When the user dismisses the alert
  # There is no need for an additional line here. If the alert is not
  # dismissed the cleanup code for the scenario will fail.

Scenario: reloading an unmodified document does not bring up a prompt
  When the user reloads
  # There is no need for an additional line here. If an alert comes
  # up, the cleanup code for the scenario will fail.
