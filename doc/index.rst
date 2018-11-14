============
Introduction
============

Wed is a schema-aware editor for XML documents. It runs in a web
browser. Wed is used as part of the `Buddhist Translators Workbench
project <https://btw.mangalamresearch.org/>`_ as the central component
that enables a team of scholars to edit and manage lexicographical
articles.  We aim to make it extensible by means of a stable API, but
the API is likely to change quickly until we hit 1.0.

For now wed is not meant to be used alone. Rather, it is meant to be
incorporated into web applications that need to edit XML documents. It
is possible to use the :ref:`demo <demo_localstorage>` of wed based on
`localStorage` and load in it documents based on the TEI schema that
is bundled with the demo, and edit documents that conform to this
schema. So it would be possible to use wed as a generic XML
editor. However, since the demo does not offer any facility for users
to load arbitrary schemas, the usefulness of the demo as a generic XML
editor is currently quite limited. (Wed *itself* is quite capable of
loading arbitrary schemas. It's just that the *demo* offers no means
to do it.) We hope to lift this limitation and have wed be usable both
as an editor part of a larger web application **and** as a generic XML
editor but it may take a few more releases before this happens.

People who are actually editing documents using wed should read
:doc:`help`. You should also read it if you want to know about which
browsers wed supports.

People who would like to customize wed or create a mode for it should
consult:

* :doc:`usage` to learn how to use wed in their own application, or
  build and test it,

* :doc:`tech_notes` to learn about wed's internals, design decisions,
  or about more complex usage scenarios,

* the `API documentation <api/index.html>`_ to write modes or extensions for
  wed.

Table of Contents
=================

.. toctree::
   :maxdepth: 3

   demos
   help
   tutorials
   usage
   mode_design
   tech_notes

Downloads
=========

View on `Github <https://github.com/mangalam-research/wed>`_.

Download a `zip <https://github.com/mangalam-research/wed/zipball/master>`_
or `tarball <https://github.com/mangalam-research/wed/tarball/master>`_.

License
=======

Wed is released under the `Mozilla Public License version 2.0
<http://www.mozilla.org/MPL/2.0/>`_. Copyright Mangalam Research
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
..  LocalWords:  Dubeau LocalWords readme changelog tei textstructure
..  LocalWords:  github wed's HD
