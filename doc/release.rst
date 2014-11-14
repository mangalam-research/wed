Here is a series of steps that should typically be used to release new
versions of wed.

The following assumes that `origin` is **a private fork** and
`upstream` is the main repository for wed.

1. ``$ git flow release start [new version, **without** the `v`]``

2. ``$ semver-sync -b [new version]``

3. Perform whatever other changes must happen and commit.

4. ``$ make test``

5. ``$ make dist-notest`` This will test packaging wed and installing
   in a temporary directory. The ``notest`` bit prevents Selenium
   tests from running. You'll run them in a later step.

6. Open the in-browser tests in the browser and run them.

7. Run the Selenium tests. This has to be done for each platform
   listed in ``selenium_config.py``.

8. ``$ git flow release finish [version]``

9. ``$ npm publish``

10. ``$ git push origin : --follow-tags``

11. ``$ git push upstream : --follow-tags``

12. Switch to the main branch and issue ``make gh-pages-build``.

13. Publish the documentation: take the result of the directory named
    ``gh-pages-build``, copy it to the ``gh-pages`` branch, commit it
    and push it to ``upstream``.
