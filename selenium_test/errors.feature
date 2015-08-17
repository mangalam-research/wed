Feature: validation errors

Scenario: errors are listed in the error panel
  Given a complex document without errors
  When the user introduces an error in the document
  Then 3 errors appear in the error panel

Scenario: clicking an error in the error panel
  Given a complex document without errors
  When the user introduces an error in the document
  Then 3 errors appear in the error panel
  When the user clicks the last error in the error panel
  Then the last error marker is fully visible.

Scenario: an error that appears on an invisible DOM element
  Given a document without "text"
  Then 2 errors appear in the error panel
  And the first error says "must choose either facsimile, sourceDoc or text"
  When the user clicks the first error in the error panel
  Then the first error marker is fully visible.
  When the user clicks on the end label of an element
  And the user decreases the label visibility level
  And the user clicks the first error in the error panel
  Then the first error marker is fully visible.
