Feature: validation errors

Background: a complex document.
  Given a complex document without errors

Scenario: errors are listed in the error panel
  When the user introduces an error in the document
  Then 3 errors appear in the error panel

Scenario: clicking an error in the error panel
  When the user introduces an error in the document
  Then 3 errors appear in the error panel
  When the user clicks the last error in the error panel
  Then the last error marker is fully visible.
