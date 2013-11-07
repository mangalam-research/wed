BUILD_API_DIR=build/api

######################
# From here on comes from the original makefiles.
# Can be deleted up to "New material" below
######################


HTML_TARGETS:=$(patsubst %.rst,%.html,$(wildcard *.rst))

JSDOC3=jsdoc
RST2HTML?=rst2html

.PHONY: doc
doc: rst-doc
	$(JSDOC3) -c jsdoc.conf.json -d $(BUILD_API_DIR)/ -r lib

rst-doc: $(HTML_TARGETS)

# rst2html does not seem to support rewriting relative
# urls. So we produce the html in our root.
%.html: %.rst
# The perl script is an ugly hack. It would erroneously mangle
# plaintext that would happen to match the pattern. We need a better
# solution eventually.
	$(RST2HTML) $< | perl -np -e 's/href="(.*?)\.rst(#.*?)"/href="$$1.html$$2"/g' > $@

#############################
# New material follows
#############################


BUILD_DIR=build
GH_PAGES_INT=$(BUILD_DIR)/merged_gh_pages
GH_PAGES_BUILD=gh-pages-build
GH_PAGES_SRC=doc
GH_PAGES_API_DIR=$(GH_PAGES_BUILD)/api
MAKE=make

.PHONY: clean
clean:
	-rm -rf $(BUILD_DIR)
	-rm -f $(HTML_TARGETS)
	-rm -rf $(GH_PAGES_BUILD)

.PHONY: gh-pages
gh-pages: doc
# the "doc" target currently converts rsts in the main directory; this is not
# necessary for gh-pages (though it isn't that big a deal to create these files)
	mkdir -p $(GH_PAGES_INT)
	cp -p CHANGELOG.rst $(GH_PAGES_INT)
	cp -p $(GH_PAGES_SRC)/*.rst $(GH_PAGES_INT)
	cp -p $(GH_PAGES_SRC)/conf.py $(GH_PAGES_INT)
	cp -rp $(GH_PAGES_SRC)/_templates $(GH_PAGES_INT)
	cp -rp $(GH_PAGES_SRC)/_static $(GH_PAGES_INT)
	cp -rp $(GH_PAGES_SRC)/Makefile $(GH_PAGES_INT)
	$(MAKE) -C $(GH_PAGES_INT) html
	cd $(ROOT_DIR)
	mkdir -p $(GH_PAGES_BUILD)
	cp -rp $(GH_PAGES_INT)/_build/html/* $(GH_PAGES_BUILD)/
	mkdir -p $(GH_PAGES_API_DIR)
	cp -rp $(BUILD_API_DIR)/* $(GH_PAGES_API_DIR)/
