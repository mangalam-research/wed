Introduction
============

Wed is a schema-aware editor for XML documents. It runs in a web
browser. It is alpha software. We aim to make it extensible, but the
API is likely to change quickly for now. Please see our Documentation_
for details about how to use wed in your own project.

Demo
=====

You can run the demo with:

* an `empty document <build/standalone/kitchen-sink.html>`_ using a
  vanilla TEI schema.

* `Sketch for a medical education
  <build/standalone/kitchen-sink.html?file=/wed/build/samples/
  sketch_for_a_medical_education.xml>`_, a sample document from the
  Oxford Text Archive.

Here are some limitations of the demo:

* Wed does not support old browsers, mobile devices, oddball, or
  unpopular browsers. Your notion of "old" might differ from ours.

* Wed will fail if you try to save. Rest assured that the saving
  functionality works, but it needs a server able to handle AJAX
  calls. Github.io is not able to do this.

* Autosave is turned off, for the reason given above.

Things you can do:

* Use the left mouse button to bring up a context menu. Such a menu
  exists for starting tags and all positions that are editable. This
  menu allows inserting elements.  Ctrl-/ also brings up this menu.

* Insert text where text is valid.

* Ctrl-[ to reduce the :ref:`label visibility <label_visibility>` level.

* Ctrl-[ to increase the label visibility level.

* Ctrl-Z to undo.

* Ctrl-Y to redo.

* Ctrl-C to copy.

* Ctrl-V to paste.

* Ctrl-X to cut.

  .. warning:: Browsers put significant obstacles into the path of any
               JavaScript code that wants to handle cutting
               itself. (It is a security issue.) Consequently, it is
               possible that cutting won't work on your platform. Wed
               *cannot* verify that cutting *will* work on your
               platform and cannot for now *reliably* issue warnings
               about problems. So... it is possible that if you try to
               cut, the selected data will be deleted from the editing
               screen but will **not** be copied into the clipboard.


* Using Ctrl-S to save does not work, for the reasons given above.

Documentation
=============

For information about building wed and using it on your own site, see
the :doc:`usage`. For advanced usage
information and information about wed's internals, see the :doc:`tech_notes`.

People who would like to customize wed or create a mode for it should
consult the `API documentation <api/index.html>`_.

Downloads
=========

View on `Github <https://github.com/mangalam-research/wed>`_.

Download a `zip <https://github.com/mangalam-research/wed/zipball/master>`_
or `tarball <https://github.com/mangalam-research/wed/tarball/master>`_.

License
=======

Wed is released under the `Mozilla Public License version 2.0
<http://www.mozilla.org/MPL/2.0/>`_. Copyright 2013, 2014 Mangalam Research
Center for Buddhist Languages, Berkeley, CA.

Credits
=======

Wed is designed and developed by Louis-Dominique Dubeau (`@lddubeau
<https://github.com/lddubeau>`_), Director of Software Development for
the Buddhist Translators Workbench project, Mangalam Research Center
for Buddhist Languages.

.. image:: https://secure.gravatar.com/avatar/7fc4e7a64d9f789a90057e7737e39b2a
   :target: http://www.mangalamresearch.org/

This software has been made possible in part by a Level I Digital
Humanities Start-up Grant and a Level II Digital Humanities Start-up
Grant from the National Endowment for the Humanities (grant numbers
HD-51383-11 and HD-51772-13). Any views, findings, conclusions, or
recommendations expressed in this software do not necessarily
represent those of the National Endowment for the Humanities.

.. image:: http://www.neh.gov/files/neh_logo_horizontal_rgb.jpg
   :target: http://www.neh.gov/


..  LocalWords:  API README html Github TEI xml io Ctrl Mangalam api
..  LocalWords:  Dubeau LocalWords readme changelog
