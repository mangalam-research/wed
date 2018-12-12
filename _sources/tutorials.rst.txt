Tutorials
=========

Please refer to :ref:`help_keyboard_shortcut` if you need to figure out what
keyboard shortcuts to use for various operations.

Unit Selection Mode
-------------------

.. note:: The operations copy, cut, paste, copy-add and cut-add are only
          available as keyboard shortcuts. Consult :ref:`help_keyboard_shortcut`
          for the specific shortcuts that pertain to your platform.

Copying Attributes
~~~~~~~~~~~~~~~~~~

In this tutorial, you will copy one attribute from one element to another.

1. Load in your editor the file `<./tutorial_data/unit_selection.xml>`_.

2. Switch to unit selection mode. Either by clicking on the toolbar button, or
   using the keyboard shortcut.

   .. figure:: tutorial_images/copying_attributes_set_mode.png
      :align: center
      :alt: Shows the selection mode is unit.

3. Move the caret into the value of the ``rend`` attribute of the first ``p``
   element in ``body``. The specific location in the value does not matter.

   .. figure:: tutorial_images/copying_attributes_caret_in_rend.png
      :align: center
      :alt: Shows the caret in the value of the ``rend`` attribute.

4. Copy. You will not see any changes to the document.

5. Move the caret into the ``div`` element.

   .. figure:: tutorial_images/copying_attributes_caret_in_div.png
      :align: center
      :alt: Shows the caret in the ``div`` element.

   .. note:: In this example, we move the caret between the start and end label
             of the ``div`` element, but you could just as well move the caret
             in any location inside the start label or the end label of the
             ``div`` element, and get the same final result.

6. Paste. The end result should be like in the following figure. The difference
   from the original document is that the ``div`` element has acquired a new
   attribute ``rend`` with the value ``rend_value``.

   .. figure:: tutorial_images/copying_attributes_final.png
      :align: center
      :alt: The final result of the tutorial.

Cutting Attributes
~~~~~~~~~~~~~~~~~~

Follow the same steps as the previous tutorial, but in step 4, do a cut instead
of a copy. The end result should be like in the following figure.

   .. figure:: tutorial_images/cutting_attributes_final.png
      :align: center
      :alt: The final result of the tutorial.

The difference from end result of the previous tutorial is that the ``rend``
attribute is no longer present on the ``p`` element from which it was cut.

Copy-Adding Attributes
~~~~~~~~~~~~~~~~~~~~~~

In this tutorial, you will copy multiple attributes from multiple elements to
another element. In order to do this, you will use the copy-add operation.

1. Load in your editor the file `<./tutorial_data/unit_selection.xml>`_.

2. Switch to unit selection mode. Either by clicking on the toolbar button, or
   using the keyboard shortcut.

   .. figure:: tutorial_images/copy_adding_attributes_set_mode.png
      :align: center
      :alt: Shows the selection mode is unit.

3. Move the caret into the value of the ``rend`` attribute of the first ``p``
   element in ``body``. The specific location in the value does not matter.

   .. figure:: tutorial_images/copy_adding_attributes_caret_in_rend.png
      :align: center
      :alt: Shows the caret in the value of the ``rend`` attribute.

4. Copy. You will not see any changes to the document.

5. Move the caret into the value of the ``sample`` attribute of ``div``
   element. The specific location in the value does not matter.

   .. figure:: tutorial_images/copy_adding_attributes_caret_in_sample.png
      :align: center
      :alt: Shows the caret in the value of the ``sample`` attribute.

6. **Copy-add.** You will not see any changes to the document.

7. Move the caret into the second ``p`` element in ``body``.

   .. figure:: tutorial_images/copy_adding_attributes_caret_in_second_p.png
      :align: center
      :alt: Shows the caret in the second ``p`` element.

   .. note:: In this example, we move the caret between the start and end label
             of the ``p`` element, but you could just as well move the caret in
             any location inside the start label or the end label of the ``p``
             element, and get the same final result.

8. Paste. The end result should be like in the following figure. The difference
   from the original document is that the second ``p`` element in ``body``:

   * had its ``rend`` attribute value changed from ``abc`` to ``rend_value``,

   * and has a new ``sample`` attribute which is empty.

   .. figure:: tutorial_images/copy_adding_attributes_final.png
      :align: center
      :alt: The final result of the tutorial.

If you did not get the expected result, one common mistake is doing a *copy*
instead of a *copy-add* in step 6. Make sure you are doing a *copy-add*.

Cut-Adding Attributes
~~~~~~~~~~~~~~~~~~~~~

Follow the same steps as the previous tutorial, but in step 4, do a cut instead
of a copy, and in step 6 do as cut-add instead of a copy-add. The end result
should be like in the following figure.

   .. figure:: tutorial_images/cut_adding_attributes_final.png
      :align: center
      :alt: The final result of the tutorial.

The difference from end result of the previous tutorial is that the ``rend``
attribute is no longer present on the ``p`` element from which it was cut, and
the ``sample`` attribute is no longer present from the ``div`` attribute from
which it was cut.

If you did not get the expected result, one common mistake is doing a *cut*
instead of a *cut-add* in step 6. Make sure you are doing a *cut-add*.

Copying Elements
~~~~~~~~~~~~~~~~

In this tutorial, you will copy an element.

1. Load in your editor the file `<./tutorial_data/unit_selection.xml>`_.

2. Switch to unit selection mode. Either by clicking on the toolbar button, or
   using the keyboard shortcut.

   .. figure:: tutorial_images/copying_elements_set_mode.png
      :align: center
      :alt: Shows the selection mode is unit.

3. Move the caret into the text of the first ``p`` element in ``body``. The
   specific location of the caret in the text does not matter.

   .. figure:: tutorial_images/copying_elements_caret_in_first_paragraph.png
      :align: center
      :alt: Shows the caret in the text of the first paragraph.

   .. note:: Placing the caret in the end label of ``p``, or in the start label
             of ``p`` *but outside any of the attributes* would yield the same
             results.

4. Copy. You will not see any changes to the document.

5. Move the caret into the ``div`` element.

   .. figure:: tutorial_images/copying_elements_caret_in_div.png
      :align: center
      :alt: Shows the caret in the ``div`` element.

   .. note:: When pasting elements, the caret *cannot* be on a start or end
             label. The caret must be *inside* an element to indicate
             specifically where to put the element.

6. Paste. The end result should be like in the following figure. The difference
   from the original document is that the ``div`` element now contains a copy of
   the first ``p`` element in ``body``.

   .. figure:: tutorial_images/copying_elements_final.png
      :align: center
      :alt: The final result of the tutorial.

Cutting Elements
~~~~~~~~~~~~~~~~

Follow the same steps as the previous tutorial, but in step 4, do a cut instead
of a copy. The end result should be like in the following figure.

   .. figure:: tutorial_images/cutting_elements_final.png
      :align: center
      :alt: The final result of the tutorial.

The difference from end result of the previous tutorial is that the element
which was originally the first ``p`` element in ``body`` is absent.

Copy-Adding Elements
~~~~~~~~~~~~~~~~~~~~

In this tutorial, you will copy-add two elements and paste them somewhere else.

1. Load in your editor the file `<./tutorial_data/unit_selection.xml>`_.

2. Switch to unit selection mode. Either by clicking on the toolbar button, or
   using the keyboard shortcut.

   .. figure:: tutorial_images/copy_adding_elements_set_mode.png
      :align: center
      :alt: Shows the selection mode is unit.

3. Move the caret into the ``title`` element. The specific location of the caret
   in the text does not matter.

   .. figure:: tutorial_images/copy_adding_elements_caret_in_title.png
      :align: center
      :alt: Shows the caret in the text of ``title``.

   .. note:: Placing the caret in the end label of ``title``, or in the start
             label of ``title`` *but outside any of the attributes* would yield
             the same results.

4. Copy. You will not see any changes to the document.

5. Move the caret into the text of the first ``p`` element in ``body``. The
   specific location of the caret in the text does not matter.

   .. figure:: tutorial_images/copy_adding_elements_caret_in_first_paragraph.png
      :align: center
      :alt: Shows the caret in the text of the first paragraph.

   .. note:: Placing the caret in the end label of ``p``, or in the start label
             of ``p`` *but outside any of the attributes* would yield the same
             results.

6. **Copy-add**. You will not see any changes to the document.

7. Move the caret into the ``div`` element.

   .. figure:: tutorial_images/copy_adding_elements_caret_in_div.png
      :align: center
      :alt: Shows the caret in the ``div`` element.

   .. note:: When pasting elements, the caret *cannot* be on a start or end
             label. The caret must be *inside* an element to indicate
             specifically where to put the element.

8. Paste. The end result should be like in the following figure. The difference
   from the original document is that the ``div`` element now contains a copy of
   the ``title`` element and a copy of first ``p`` element in ``body``.

   .. figure:: tutorial_images/copy_adding_elements_final.png
      :align: center
      :alt: The final result of the tutorial.

.. note:: The order in which you add elements to the clipboard determines the
          order in which they appear when pasted. If you add, in order, the
          elements ``a``, ``b`` and ``c``. Then they'll appear in this order
          when paste. However, if you add in the order ``a``, ``c``,
          ``b``. They'll appear in this order when pasted.

If you did not get the expected result, one common mistake is doing a *copy*
instead of a *copy-add* in step 6. Make sure you are doing a *copy-add*.


Cut-Adding Elements
~~~~~~~~~~~~~~~~~~~

Follow the same steps as the previous tutorial, but in step 4, do a cut instead
of a copy, and in step 6 do a cut-add instead of a copy-add. The end result
should be like in the following figure.

   .. figure:: tutorial_images/cut_adding_elements_final.png
      :align: center
      :alt: The final result of the tutorial.

The difference from end result of the previous tutorial is that the ``title``
element is gone from its original position and the element which was originally
the first ``p`` element in ``body`` is absent.

If you did not get the expected result, one common mistake is doing a *cut*
instead of a *cut-add* in step 6. Make sure you are doing a *cut-add*.
