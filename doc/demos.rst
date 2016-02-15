Demos
=====

Wed can work with any schema (minus the limitations of
salve). However, the wed is bundled with a single TEI schema that uses
these TEI modules: ``tei``, ``core``, ``textstructure`` and
``header``. So this is what the demo is currently limited to. Future
versions of the demo will allow loading arbitrary schemas. Wed itself
is capable of loading other schemas.

Note that Wed does not support old browsers, mobile devices, oddball,
or unpopular browsers. Your notion of "old" might differ from
ours. See :ref:`help_browser_requirements` section in :doc:`usage`.

See :doc:`help` to learn what wed can do. Note that saving **works
only in the demo that uses local storage**.

.. _demo_localstorage:

Using Local Storage
-------------------

You can run a demo that uses your browser's own storage facilities to
store documents. This demo does not come with documents, **so you'd
have to load one of your documents into it.** Bear in mind the schema
that wed currently supports. Point your browser `here
<build/standalone/files.html>`__ to load this demo. You will then have
to upload your file.

Using a Server
--------------

This demo is configured as if there was a server to receive the saved
data. However, it is not possible to configure ``github.io`` to act as
the kind of server needed for actually saving. **Wed will fail if you
try to save.** Rest assured that the saving functionality works, but
it needs a server able to handle AJAX calls. Github.io is not able to
do this.

You can load:

* an `empty TEI document <build/standalone/kitchen-sink.html>`_ using a
  vanilla TEI schema.

* an `empty DocBook document
  <build/standalone/kitchen-sink.html?schema=%40docbook>`_.

* `Sketch for a medical education
  <build/standalone/kitchen-sink.html?file=/wed/build/samples/
  sketch_for_a_medical_education.xml>`_, a sample TEI document from the
  Oxford Text Archive.

* a `sample DocBook document
  <build/standalone/kitchen-sink.html?file=/wed/build/samples/
  docbook_book.xml&schema=%40docbook>`_.
