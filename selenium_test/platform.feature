#
# The presence of this feature here is mostly a matter of convenience,
# given that we need to be able to run this test on multiple platforms
# and that the only way to do this is by making it a test here.
#
Feature: Handle Platform Variations
  Wed should be able to handle the difference among browsers gracefully.

Scenario: Handle Platform Variations
  Given the platform variation page is loaded
  Then wed handles platform variations

@only.with_browser=ie
Scenario: Check that innerHTML on XML nodes produces valid values.
  Given the platform variation page is loaded
  Then the innerHTML field of XML nodes produces valid values
