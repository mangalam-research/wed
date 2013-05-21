DEV=0

# Should be the last part of the URL beginning with
# https://rangy.googlecode.com/files/
RANGY_FILE=rangy-1.3alpha.772.tar.gz

JQUERY_FILE=jquery-1.9.1.js

BOOTSTRAP_FILE=bootstrap.zip

REQUIREJS_FILE=http://requirejs.org/docs/release/2.1.6/comments/require.js
REQUIREJS_BASE=$(notdir $(REQUIREJS_FILE))

TEXT_PLUGIN_FILE=https://raw.github.com/requirejs/text/latest/text.js
TEXT_PLUGIN_BASE=$(notdir $(TEXT_PLUGIN_FILE))

LIB_FILES:=$(shell find lib -type f -not -name "*_flymake.*")
STANDALONE_LIB_FILES:=$(foreach f,$(LIB_FILES),build/standalone/$f)

.PHONY: all build-dir build
all: build

build-dir: 
	-@[ -e build ] || mkdir build

build: | build-standalone build-test-files

build-standalone: $(STANDALONE_LIB_FILES) build/standalone/lib/rangy build/standalone/lib/$(JQUERY_FILE) build/standalone/lib/bootstrap build/standalone/lib/requirejs/require.js build/standalone/lib/requirejs/text.js build/standalone/lib/chai.js build/standalone/lib/mocha/mocha.js build/standalone/lib/mocha/mocha.css build/standalone/lib/salve

build-test-files: build/test-files/to_parse_converted.xml build/test-files/percent_to_parse_converted.xml

build/test-files/%_converted.xml: browser_test/%.xml
	-[ -e $(dir $@) ] || mkdir -p $(dir $@)
	saxon -s:$< -o:$@ -xsl:lib/wed/xml-to-html.xsl


build/standalone/lib/%: lib/%
	-[ -e $(dir $@) ] || mkdir -p $(dir $@)
	cp $< $@

build/standalone: | build-dir
	-mkdir $@

downloads:
	mkdir $@

downloads/$(RANGY_FILE): | downloads
	(cd downloads; wget 'https://rangy.googlecode.com/files/$(RANGY_FILE)' )

downloads/$(JQUERY_FILE): | downloads
	(cd downloads; wget 'http://code.jquery.com/$(JQUERY_FILE)' )

downloads/$(BOOTSTRAP_FILE): | downloads
	(cd downloads; wget 'http://twitter.github.io/bootstrap/assets/$(BOOTSTRAP_FILE)')

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

build/standalone/lib/requirejs: | build/standalone/lib
	-mkdir $@

build/standalone/lib/requirejs/%: downloads/% | build/standalone/lib/requirejs 
	cp $< $@

# The following targets need to have an order dependency on the top
# directories so that when a new version is install, the target is
# rebuilt. This is necessary because npm preserves the modification
# times of the files *inside* the packages.

build/standalone/lib/chai.js: node_modules/chai/chai.js | node_modules/chai
	cp $< $@

build/standalone/lib/mocha/%: node_modules/mocha/% | node_modules/mocha
	-mkdir $(dir $@)
	cp $< $@

build/standalone/lib/salve: node_modules/salve/build/lib/salve
	cp -rp $< $@
# Sometimes the modification date on the top directory does not
# get updated, so:
	touch $@
