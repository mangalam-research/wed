-include local.mk

#
# Customizable variables. Set them in a local.mk file rather than
# modify this file. What follows are the default values.
#

# jsdoc command.
JSDOC3?=jsdoc

# rst2html command.
RST2HTML?=rst2html

# Build a development version? Set to 1 if yes.
DEV?=0

# The makefile still has support for producing a bootstrap 2
# build. This is there mainly for historical reasons, in case we ever
# want to support boostrap 2 again. Right now, setting this to version
# other than 3 will produce a build that will use version 2 files but
# this build won't run because the js code expects a version 3 API. In
# all likelihood, this support will be removed the day we are sure
# that we won't ever support bootstrap 2.

# Bootstrap version to build.
BOOTSTRAP?=3

# Parameters to pass to mocha, like "--grep foo".
MOCHA_PARAMS?=

#
# End of customizable variables.
#

# Should be the last part of the URL beginning with
# https://rangy.googlecode.com/files/
RANGY_FILE=rangy-1.3alpha.772.tar.gz

JQUERY_FILE=jquery-1.9.1.js

ifeq ($(BOOTSTRAP),3)
BOOTSTRAP_PATH=https://github.com/twbs/bootstrap/releases/download/v3.0.0-rc1/
BOOTSTRAP_FILE=bs-v3.0.0-rc1-dist.zip
else
BOOTSTRAP_PATH=http://twitter.github.io/bootstrap/assets/
BOOTSTRAP_FILE=bootstrap.zip
endif # BOOTSTRAP

REQUIREJS_FILE=http://requirejs.org/docs/release/2.1.6/comments/require.js
REQUIREJS_BASE=$(notdir $(REQUIREJS_FILE))

TEXT_PLUGIN_FILE=https://raw.github.com/requirejs/text/latest/text.js
TEXT_PLUGIN_BASE=$(notdir $(TEXT_PLUGIN_FILE))

LIB_FILES:=$(shell find lib -type f -not -name "*_flymake.*")
STANDALONE_LIB_FILES:=$(foreach f,$(LIB_FILES),$(patsubst %.less,%.css,build/standalone/$f))
TEST_DATA_FILES:=$(shell find browser_test -type f -name "*.xml")
CONVERTED_TEST_DATA_FILES:=$(foreach f,$(TEST_DATA_FILES),$(patsubst browser_test/%.xml,build/test-files/%_converted.xml,$f))

.PHONY: all build-dir build
all: build

build-dir:
	-@[ -e build ] || mkdir build

build: | build-standalone

build-standalone: $(STANDALONE_LIB_FILES) build/standalone/lib/rangy build/standalone/lib/$(JQUERY_FILE) build/standalone/lib/bootstrap build/standalone/lib/requirejs/require.js build/standalone/lib/requirejs/text.js build/standalone/lib/chai.js build/standalone/lib/mocha/mocha.js build/standalone/lib/mocha/mocha.css build/standalone/lib/salve

build-test-files: $(CONVERTED_TEST_DATA_FILES)

build/test-files/%_converted.xml: browser_test/%.xml build/standalone/lib/wed/xml-to-html.xsl test/xml-to-html-tei.xsl
	-[ -e $(dir $@) ] || mkdir -p $(dir $@)
	(if grep "http://www.tei-c.org/ns/1.0" $<; then \
		saxon -s:$< -o:$@ -xsl:test/xml-to-html-tei.xsl; else \
		saxon -s:$< -o:$@ -xsl:lib/wed/xml-to-html.xsl; \
	fi)




build/standalone/lib/%: lib/%
	-[ -e $(dir $@) ] || mkdir -p $(dir $@)
	cp $< $@

build/standalone/lib/%.css: lib/%.less
	lessc $< $@

build/standalone: | build-dir
	-mkdir $@

downloads:
	mkdir $@

downloads/$(RANGY_FILE): | downloads
	(cd downloads; wget 'https://rangy.googlecode.com/files/$(RANGY_FILE)' )

downloads/$(JQUERY_FILE): | downloads
	(cd downloads; wget 'http://code.jquery.com/$(JQUERY_FILE)' )

downloads/$(BOOTSTRAP_FILE): | downloads
	(cd downloads; wget '$(BOOTSTRAP_PATH)$(BOOTSTRAP_FILE)')

downloads/$(REQUIREJS_BASE): | downloads
	(cd downloads; wget $(REQUIREJS_FILE))

downloads/$(TEXT_PLUGIN_BASE): | downloads
	(cd downloads; wget $(TEXT_PLUGIN_FILE))

node_modules/%:
	npm install

build/standalone/lib/rangy: downloads/$(RANGY_FILE) | build/standalone
	-mkdir -p $@
	rm -rf $@/*
	tar -xzf $< --strip-components=1 -C $@
ifdef DEV
	mv $@/uncompressed/* $@
endif # ifdef(DEV)
	rm -rf $@/uncompressed

build/standalone/lib/$(JQUERY_FILE): downloads/$(JQUERY_FILE) | build/standalone/lib
	-mkdir $(dir $@)
	cp $< $@

build/standalone/lib/bootstrap: downloads/$(BOOTSTRAP_FILE) | build/standalone/lib
	-mkdir $(dir $@)
	rm -rf $@/*
	unzip -d $(dir $@) $<
ifeq ($(BOOTSTRAP),3) # Bootstrap 3 puts everything in a dist/ subdirectory
	-mkdir $@
	mv $(dir $@)/dist/* $@
	rm -rf $(dir $@)/dist
endif
# unzip preserves the creation date of the bootstrap directory. Which
# means that downloads/bootstrap.zip would likely be more recent than
# the top level directory. This would trigger this target needlessly
# so, touch it.
	touch $@

build/standalone/lib/requirejs: | build/standalone/lib
	-mkdir $@

build/standalone/lib/requirejs/%: downloads/% | build/standalone/lib/requirejs
	cp $< $@

# The following targets need to have an order dependency on the top
# directories so that when a new version is installed, the target is
# rebuilt. This is necessary because npm preserves the modification
# times of the files *inside* the packages.

build/standalone/lib/chai.js: node_modules/chai/chai.js | node_modules/chai
	cp $< $@

build/standalone/lib/mocha/%: node_modules/mocha/% | node_modules/mocha
	-mkdir $(dir $@)
	cp $< $@

build/standalone/lib/salve: node_modules/salve/build/lib/salve
	rm -rf $@
	cp -rp $< $@
# Sometimes the modification date on the top directory does not
# get updated, so:
	touch $@

.PHONY: test
test: build | build-test-files
	semver-sync -v
	mocha $(MOCHA_PARAMS)

.PHONY: doc
doc: README.html
	$(JSDOC3) -c jsdoc.conf.json -d build/doc -r lib
# rst2html does not seem to support rewriting relative
# urls. So we produce the html in our root.

README.html: README.rst
	$(RST2HTML) $< $@

.PHONY: clean
clean:
	-rm -rf build
	-rm README.html

.PHONY: distclean
distclean: clean
	-rm -rf downloads
