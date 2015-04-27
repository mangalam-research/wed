Here is a series of steps that should typically be used to release new
versions of wed.

The following assumes that `origin` is **a private fork** and
`upstream` is the main repository for wed.

The following steps assume that you've already run ``make test`` and
the Selenium tests beforehand and that they passed.

1. Test that the documentation can be generated without errors::

    ``rm -rf gh-pages-build; make gh-pages-build FORCE_GH_PAGES_BUILD=1``

2. ``$ git flow release start [new version, **without** the `v`]``

3. ``$ semver-sync -b [new version]``

4. Perform whatever other changes must happen and commit.

5. ``$ make test``

6. ``$ make dist-notest`` This will test packaging wed and installing
   in a temporary directory. The ``notest`` bit prevents Selenium
   tests from running.

7. ``$ git flow release finish [version]``

8. ``$ make publish``

9. ``$ git push origin : --follow-tags``

10. ``$ git push upstream : --follow-tags``

11. Switch to the main branch and issue ``make gh-pages-build``.

12. Publish the documentation: take the result of the directory named
    ``gh-pages-build``, copy it to the ``gh-pages`` branch, commit it
    and push it to ``upstream``.
