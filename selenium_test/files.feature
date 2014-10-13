Feature: file management in local storage
 Users who do not have a full-fledged server solution want to be able to
 use a kind of file system.

Scenario: the files database is initially empty
 When the user opens the files page
 Then there are no files

Scenario: uploading a file
 When the user opens the files page
 Then there are no files
 When sets the uploading field to upload "sketch_for_a_medical_education.xml"
 Then there is one file
 And file 1 is titled "sketch_for_a_medical_education.xml", has never been saved, has been uploaded recently, and has never been downloaded

Scenario: adding a new file
 When the user opens the files page
 Then there are no files
 When clicks the "New File" button
 And gives the new file the name "test.xml"
 Then there is one file
 And file 1 is titled "test.xml", has never been saved, has been uploaded recently, and has never been downloaded

Scenario: deleting a file and accepting the operation
 When the user opens the files page with a "test.xml" file already loaded
 Then there is one file
 When the user deletes file 1
 And accepts the deletion dialog
 Then there are no files

Scenario: deleting a file but canceling the operation
 When the user opens the files page with a "test.xml" file already loaded
 Then there is one file
 When the user deletes file 1
 And cancels the deletion dialog
 Then there is one file

Scenario: overwriting a file and accepting the operation
 When the user opens the files page with a "test.xml" file already loaded
 Then there is one file
 And the file "test.xml" has the contents "preloaded!"
 When the user clicks the "New File" button
 And gives the new file the name "test.xml"
 And accepts the overwrite dialog
 Then there is one file
 And file 1 is titled "test.xml", has never been saved, has been uploaded recently, and has never been downloaded
 And the file "test.xml" has the contents ""

Scenario: overwriting a file and canceling the operation
 When the user opens the files page with a "test.xml" file already loaded
 Then there is one file
 And the file "test.xml" has the contents "preloaded!"
 When the user clicks the "New File" button
 And gives the new file the name "test.xml"
 And cancels the overwrite dialog
 Then there is one file
 And the file "test.xml" has the contents "preloaded!"

Scenario: downloading a file
 When the user opens the files page with a "test.xml" file already loaded
 Then there is one file
 And file 1 is titled "test.xml", has never been saved, has been uploaded recently, and has never been downloaded
 When the user downloads file 1
 Then file 1 is titled "test.xml", has never been saved, has been uploaded, and has been downloaded recently

Scenario: clearing the local storage and accepting the operation
 When the user opens the files page with a "test.xml" file already loaded
 Then there is one file
 When the user clicks the "Clear Local Storage" button
 And accepts the clear local storage dialog
 Then there are no files

Scenario: clearing the local storage and canceling the operation
 When the user opens the files page with a "test.xml" file already loaded
 Then there is one file
 When the user clicks the "Clear Local Storage" button
 And cancels the clear local storage dialog
 Then there is one file

Scenario: saving a file
 When the user opens the files page with a "test.xml" file already loaded, and empty
 And the user clicks the link "test.xml"
 Then the file is loaded in the editor
 When the user saves
 Then the modification status shows the document is unmodified
 When the user clicks the link "Go to File Management"
 Then there is one file
 And file 1 is titled "test.xml", has been saved recently, has been uploaded, and has never been downloaded
 And the file "test.xml" contains a minimal document
