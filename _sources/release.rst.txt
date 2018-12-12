Here is a series of steps that should typically be used to release new
versions of wed.

The following assumes that `origin` is **a private fork** and
`upstream` is the main repository for wed.

The following steps assume that you've already run ``gulp test`` and
the Selenium tests beforehand and that they passed.

1. Test that the documentation can be generated without errors::

    ``rm -rf gh-pages; gulp gh-pages --force-gh-pages-build``

2. ``$ git flow release start [new version, **without** the `v`]``

3. ``$ versync -b [new version]``

4. ``$ npm shrinkwrap --dev`` We have to shrinkwrap so as to update the
   version number recorded in the file.

5. Perform whatever other changes must happen and commit.

6. ``$ gulp test``

7. ``$ gulp pack-notest`` This will test packaging wed and installing
   in a temporary directory. The ``notest`` bit prevents Selenium
   tests from running.

8. ``$ git flow release finish [version]``

9. ``$ gulp publish``

10. ``$ git push origin : --follow-tags``

11. ``$ git push upstream : --follow-tags``

12. Switch to the main branch and issue ``gulp gh-pages``.

13. Publish the documentation: take the result of the directory named
    ``gh-pages``, copy it to the ``gh-pages`` branch, commit it
    and push it to ``upstream``.
