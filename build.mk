-include local.mk

#
# Customizable variables. Set them in a local.mk file rather than
# modify this file. What follows are the default values.
#

# saxon command
SAXON?=saxon

# jsdoc command.
JSDOC3?=node_modules/.bin/jsdoc

# wget command.
WGET?=wget

# jsdoc3 templates
JSDOC3_DEFAULT_TEMPLATE?=node_modules/jsdoc/templates/default

ifeq ($(wildcard $(JSDOC3_DEFAULT_TEMPLATE)),)
$(error JSDOC3_DEFAULT_TEMPLATE must be set to the path of jsdoc3's default template)
endif

# rst2html command.
RST2HTML?=rst2html

# Location of TEI's odd2html.xsl transform.
ODD2HTML?=/usr/share/xml/tei/stylesheet/odds/odd2html.xsl

# Build a development version? Set to 1 if yes.
DEV?=0

# Parameters to pass to mocha, like "--grep foo".
MOCHA_PARAMS?=

# Parameters to pass to behave
BEHAVE_PARAMS?=

# The TEI hierarchy to use. This is the default location on
# Debian-type systems.
TEI?=/usr/share/xml/tei/stylesheet

# Skip the semver check. You should NOT set this in local.mk but use
# it on the command line:
#
# $ make SKIP_SEMVER=1 test
#
SKIP_SEMVER?=

#
# Unset to avoid the optimization target being built by default.
#
OPTIMIZE_BY_DEFAULT?=1

#
# End of customizable variables.
#


WGET:=$(WGET) --no-use-server-timestamps

# Should be the last part of the URL beginning with
# https://rangy.googlecode.com/files/
RANGY_FILE=rangy-1.3alpha.804.tar.gz

JQUERY_FILE=jquery-2.1.1.js

BOOTSTRAP_URL=https://github.com/twbs/bootstrap/releases/download/v3.1.1/bootstrap-3.1.1-dist.zip #https://github.com/twbs/bootstrap/releases/download/v3.0.3/bootstrap-3.0.3-dist.zip
BOOTSTRAP_BASE=$(notdir $(BOOTSTRAP_URL))
FONTAWESOME_PATH=http://fontawesome.io/assets/font-awesome-4.2.0.zip
FONTAWESOME_BASE=$(notdir $(FONTAWESOME_PATH))

TEXT_PLUGIN_FILE=https://raw.github.com/requirejs/text/latest/text.js
TEXT_PLUGIN_BASE=$(notdir $(TEXT_PLUGIN_FILE))

LOG4JAVASCRIPT_FILE=http://downloads.sourceforge.net/project/log4javascript/log4javascript/1.4.6/log4javascript-1.4.6.zip
LOG4JAVASCRIPT_BASE=$(notdir $(LOG4JAVASCRIPT_FILE))

BOOTSTRAP_GROWL_FILE=https://github.com/ifightcrime/bootstrap-growl/archive/v1.1.0.zip
BOOTSTRAP_GROWL_BASE=bootstrap-growl-$(notdir $(BOOTSTRAP_GROWL_FILE))

PURL_URL=https://github.com/allmarkedup/purl/archive/v2.3.1.zip
PURL_BASE=purl-$(notdir $(PURL_URL))

CLASSLIST_URL=https://github.com/eligrey/classList.js/archive/master.zip
CLASSLIST_BASE=classList.zip

# Only the less files that we compile.
COMPILED_LESS_FILES:=$(wildcard lib/wed/*.less)

# Only the less files meant to be included.
INC_LESS_FILES:=$(shell find lib/wed/less-inc -name "*.less")

LIB_FILES:=$(shell find lib -type f -not -name "*_flymake.*" -not -name "*.less") $(COMPILED_LESS_FILES)

STANDALONE_LIB_FILES:=$(foreach path,$(foreach f,$(LIB_FILES),$(patsubst %.less,%.css,$f)) $(INC_LESS_FILES),build/standalone/$(path))

PERCENT:=%
TEST_DATA_DIRS:=$(wildcard browser_test/*_data)
# Directories for which we simply copy the files.
TEST_DATA_DIRS_COPY:=browser_test/convert_test_data
# Directories for which we convert the files to HTML.
TEST_DATA_DIRS_CONVERT_TO_HTML:=$(foreach d,dloc guiroot tree_updater,browser_test/$(d)_test_data)
$(info $(TEST_DATA_DIRS_CONVERT_TO_HTML))

# Directories for which we convert the files to XML.
TEST_DATA_DIRS_CONVERT_TO_XML:=$(filter-out $(TEST_DATA_DIRS_COPY:%=%$(PERCENT)) $(TEST_DATA_DIRS_CONVERT_TO_HTML:%=%$(PERCENT)),$(TEST_DATA_DIRS))

SOURCE_DATA_FILES:=$(shell find browser_test -type f -print)
SOURCE_DATA_FILES_COPY:=$(filter $(TEST_DATA_DIRS_COPY:%=%$(PERCENT)),$(SOURCE_DATA_FILES))
SOURCE_DATA_FILES_CONVERT_TO_HTML:=$(filter $(TEST_DATA_DIRS_CONVERT_TO_HTML:%=%$(PERCENT)),$(SOURCE_DATA_FILES))
SOURCE_DATA_FILES_CONVERT_TO_XML:=$(filter $(TEST_DATA_DIRS_CONVERT_TO_XML:%=%$(PERCENT)),$(SOURCE_DATA_FILES))

DEST_DATA_FILES_COPY:=$(SOURCE_DATA_FILES_COPY:browser_test/%=build/test-files/%)
DEST_DATA_FILES_CONVERT_TO_HTML:=$(SOURCE_DATA_FILES_CONVERT_TO_HTML:browser_test/%.xml=build/test-files/%_converted.xml)
DEST_DATA_FILES_CONVERT_TO_XML:=$(SOURCE_DATA_FILES_CONVERT_TO_XML:browser_test/%.xml=build/test-files/%_converted.xml)
DEST_DATA_FILES:=$(DEST_DATA_FILES_COPY) $(DEST_DATA_FILES_CONVERT_TO_HTML) $(DEST_DATA_FILES_CONVERT_TO_XML)

# Use $(sort ...) to remove duplicates.
HTML_TARGETS:=$(patsubst %.rst,%.html,$(wildcard *.rst))
SCHEMA_TARGETS:=$(patsubst %,build/%,$(wildcard schemas/*.js)) build/schemas/tei-metadata.json build/schemas/tei-doc
SAMPLE_TARGETS:=$(patsubst sample_documents/%,build/samples/%,$(wildcard sample_documents/*.xml))

# The list of files and directories to grab from lodash.
LODASH_FILES:=main.js modern package.json
LODASH_BUILD_FILES:=$(addprefix build/standalone/lib/external/lodash/,$(LODASH_FILES))

.DELETE_ON_ERROR:

.PHONY: all build-dir build
all: build

build-dir:
	-@[ -e build ] || mkdir build

#
# We do this so that using :: for build-deployment works. If we try to
# use a per-target variable assignment then the :: targets don't work.
#
gh-pages-build:
	@if [ `git rev-parse --abbrev-ref HEAD`!="master" ]; then \
	    echo "***"; \
	    echo "Not on master branch. Don't build gh-pages-build on"; \
	    echo "a branch other than master."; \
	    echo "***"; \
	    exit 1; \
	fi
	$(MAKE) -f build.mk BUILD_DEPLOYMENT_TARGET:=$@ DEPLOYMENT_INCLUDES_DOC=1 build-deployment

.PHONY: build-deployment
build-deployment::
	@if [ -z "$(BUILD_DEPLOYMENT_TARGET)" ]; then \
		echo "Build deployment target not set."; \
		exit 1; \
	fi
ifndef UNSAFE_DEPLOYMENT
# Refuse to run if the tree is unclean.
	node misc/generate_build_info.js > /dev/null
endif # UNSAFE_DEPLOYMENT

.PHONY: $(BUILD_DEPLOYMENT_TARGET).phony
$(BUILD_DEPLOYMENT_TARGET).phony: $(and $(DEPLOYMENT_INCLUDES_DOC),doc)
	rm -rf $(BUILD_DEPLOYMENT_TARGET)
	mkdir $(BUILD_DEPLOYMENT_TARGET)
	rm -rf build/merged-gh-pages
	cp -rp doc build/merged-gh-pages
	$(MAKE) -C build/merged-gh-pages html
	cp -rp build/merged-gh-pages/_build/html/* $(BUILD_DEPLOYMENT_TARGET)
	cp -rp build/api $(BUILD_DEPLOYMENT_TARGET)

build-deployment:: build $(BUILD_DEPLOYMENT_TARGET).phony
	mkdir $(BUILD_DEPLOYMENT_TARGET)/build
	cp -rp build/ks build/samples build/schemas \
		build/standalone build/standalone-optimized \
		$(BUILD_DEPLOYMENT_TARGET)/build
	for dist in standalone standalone-optimized; do \
		config=$(BUILD_DEPLOYMENT_TARGET)/build/$$dist/requirejs-config.js; \
		mv $$config $$config.t; \
		node misc/modify_config.js -d config.wed/wed.ajaxlog \
			-d config.wed/wed.save -d paths.browser_test \
			$$config.t > $$config; \
		rm $$config.t; \
		rm $(BUILD_DEPLOYMENT_TARGET)/build/$$dist/test.html; \
		rm $(BUILD_DEPLOYMENT_TARGET)/build/$$dist/wed_test.html; \
	done

build: | $(and $(OPTIMIZE_BY_DEFAULT),build-standalone-optimized) build-standalone

build-config: $(CONFIG_TARGETS) | build/config

build/config: | build-dir
	mkdir $@

ifneq ($(filter clean,$(MAKECMDGOALS)),clean)
# See Makefile for the flip side of this.
include $(CONFIG_DEPS)
endif

# Here are the actual targets that build the actual config files.
build/config/%:
	cp $< $@

build/config/nginx.conf:
	sed -e's;@PWD@;$(PWD);'g $< > $@

build-standalone: build-only-standalone build-ks-files build-config build-schemas build-samples build/ajax

build-only-standalone: $(STANDALONE_LIB_FILES) build/standalone/test.html build/standalone/wed_test.html build/standalone/kitchen-sink.html build/standalone/platform_test.html build/standalone/requirejs-config.js build/standalone/lib/external/rangy build/standalone/lib/external/$(JQUERY_FILE) build/standalone/lib/external/bootstrap build/standalone/lib/requirejs/require.js build/standalone/lib/requirejs/text.js build/standalone/lib/salve build/standalone/lib/external/log4javascript.js build/standalone/lib/external/jquery.bootstrap-growl.js build/standalone/lib/external/font-awesome build/standalone/lib/external/pubsub.js build/standalone/lib/external/xregexp.js build/standalone/lib/external/classList.js $(LODASH_BUILD_FILES) build/standalone/lib/wed/build-info.js

ifndef NO_NEW_BUILDINFO
# Force rebuilding
.PHONY: build/standalone/lib/wed/build-info.js
endif # NO_NEW_BUILDINFO
build/standalone/lib/wed/build-info.js:
	node misc/generate_build_info.js --unclean --module > $@

build/standalone/requirejs-config.js: build/config/requirejs-config-dev.js
	cp $< $@

build/standalone/%.html: web/%.html
	cp $< $@

build-standalone-optimized: build-standalone build/standalone-optimized build/standalone-optimized/requirejs-config.js build/standalone-optimized/test.html build/standalone-optimized/wed_test.html build/standalone-optimized/kitchen-sink.html build/standalone-optimized/platform_test.html

build/standalone-optimized/requirejs-config.js: build/config/requirejs-config-optimized.js | build/standalone-optimized
	cp $< $@

build/standalone-optimized: requirejs.build.js $(shell find build/standalone -type f)
# The || in the next command is because DELETE_ON_ERROR does not
# delete *directories*. So we have to do it ourselves.
	node_modules/requirejs/bin/r.js -o $< || (rm -rf $@ && exit 1)

build/standalone-optimized/%.html: web/%.html
	cp $< $@

build/config/requirejs-config-optimized.js: misc/create_optimized_config.js build/config/requirejs-config-dev.js requirejs.build.js
	node $(word 1,$^) --skip lodash $(word 2,$^) $(word 3,$^) > build/config/requirejs-config-optimized.js

build-ks-files: build/ks/purl.js

build-schemas: $(SCHEMA_TARGETS)

build/schemas:
	-mkdir -p $@

build/schemas/%: schemas/% | build/schemas
	cp $< $@

schemas/out/myTEI.xml.compiled: schemas/myTEI.xml
	roma2 --xsl=$(TEI) --compile --nodtd --noxsd $< schemas/out
# Deal with a bug in roma. This should eventually be removed once roma is fixed.
	if [ -e schemas/out/schemas/myTEI.xml.compiled ]; then \
		mv schemas/out/schemas/myTEI.xml.compiled $@; \
		rm -rf schemas/out/schemas; \
	fi

schemas/out/myTEI.json: schemas/out/myTEI.xml.compiled
	saxon -xsl:/usr/share/xml/tei/stylesheet/odds/odd2json.xsl -s:$< -o:$@ callback=''

build/schemas/tei-metadata.json: schemas/out/myTEI.json
# The --dochtml string is a path that is meaningful at run time.
	bin/tei-to-generic-meta-json \
		--dochtml "../../../../../schemas/tei-doc/"\
		--ns tei=http://www.tei-c.org/ns/1.0 $< $@

build/schemas/tei-doc: schemas/out/myTEI.xml.compiled
	-rm -rf $@
	-mkdir $@
	$(SAXON) -s:$< -xsl:$(ODD2HTML) STDOUT=false splitLevel=0 outputDir=$@

build-samples: $(SAMPLE_TARGETS)

build/samples:
	-mkdir -p $@

build/samples/%: sample_documents/% | build/samples test/xml-to-xml-tei.xsl
	(if grep "http://www.tei-c.org/ns/1.0" $<; then \
		$(SAXON) -s:$< -o:$@ -xsl:test/xml-to-xml-tei.xsl; else \
		cp $<  $@; \
	fi)

build-test-files: $(DEST_DATA_FILES) build/ajax

$(DEST_DATA_FILES_CONVERT_TO_XML): build/test-files/%_converted.xml: browser_test/%.xml test/xml-to-xml-tei.xsl
	-[ -e $(dir $@) ] || mkdir -p $(dir $@)
	(if grep "http://www.tei-c.org/ns/1.0" $<; then \
		$(SAXON) -s:$< -o:$@ -xsl:test/xml-to-xml-tei.xsl; else \
		cp $< $@; \
	fi)

$(DEST_DATA_FILES_CONVERT_TO_HTML): build/test-files/%_converted.xml: browser_test/%.xml lib/wed/xml-to-html.xsl test/xml-to-html-tei.xsl
	-[ -e $(dir $@) ] || mkdir -p $(dir $@)
	(if grep "http://www.tei-c.org/ns/1.0" $<; then \
		$(SAXON) -s:$< -o:$@ -xsl:test/xml-to-html-tei.xsl; else \
		$(SAXON) -s:$< -o:$@ -xsl:lib/wed/xml-to-html.xsl; \
	fi)

$(DEST_DATA_FILES_COPY): build/test-files/%: browser_test/%
	-[ -e $(dir $@) ] || mkdir -p $(dir $@)
	cp $< $@

build/standalone/lib/%: lib/%
	-[ -e $(dir $@) ] || mkdir -p $(dir $@)
	cp $< $@

build/standalone/lib/external:
	mkdir -p $@

wed.css_CSS_DEPS=build/standalone/lib/external/bootstrap/css/bootstrap.css

build/standalone/lib/external/bootstrap/css/bootstrap.css: build/standalone/lib/external/bootstrap

.SECONDEXPANSION:
build/standalone/lib/wed/%.css: lib/wed/%.less lib/wed/less-inc/* $$($$(notdir $$@)_CSS_DEPS)
	node_modules/.bin/lessc --include-path=./lib/wed/less-inc/ $< $@

build/standalone build/ajax: | build-dir
	-mkdir $@

downloads:
	mkdir $@

downloads/$(RANGY_FILE): | downloads
	(cd downloads; $(WGET) 'https://rangy.googlecode.com/files/$(RANGY_FILE)' )

downloads/$(JQUERY_FILE): | downloads
	(cd downloads; $(WGET) 'http://code.jquery.com/$(JQUERY_FILE)' )

downloads/$(BOOTSTRAP_BASE): | downloads
	(cd downloads; $(WGET) -O $(BOOTSTRAP_BASE) '$(BOOTSTRAP_URL)')

downloads/$(FONTAWESOME_BASE): | downloads
	(cd downloads; $(WGET) '$(FONTAWESOME_PATH)')

downloads/$(TEXT_PLUGIN_BASE): | downloads
	(cd downloads; $(WGET) $(TEXT_PLUGIN_FILE))

downloads/$(LOG4JAVASCRIPT_BASE): | downloads
	(cd downloads; $(WGET) $(LOG4JAVASCRIPT_FILE))

downloads/$(BOOTSTRAP_GROWL_BASE): | downloads
	(cd downloads; $(WGET) -O $(BOOTSTRAP_GROWL_BASE) $(BOOTSTRAP_GROWL_FILE))

downloads/$(PURL_BASE): | downloads
	(cd downloads; $(WGET) -O $(PURL_BASE) $(PURL_URL))

downloads/$(CLASSLIST_BASE): | downloads
	(cd downloads; $(WGET) -O $(CLASSLIST_BASE) $(CLASSLIST_URL))



node_modules/%:
	npm install

build/standalone/lib/external/rangy: downloads/$(RANGY_FILE) | build/standalone/lib/external
	-mkdir -p $@
	rm -rf $@/*
	tar -xzf $< --strip-components=1 -C $@
ifneq ($(DEV),0)
	mv $@/uncompressed/* $@
endif # ifneq ($(DEV),0)
	rm -rf $@/uncompressed

build/standalone/lib/external/$(JQUERY_FILE): downloads/$(JQUERY_FILE) | build/standalone/lib/external
	-mkdir $(dir $@)
	cp $< $@

build/standalone/lib/external/bootstrap: downloads/$(BOOTSTRAP_BASE) | build/standalone/lib/external
	-rm -rf $@
	-mkdir $@
	-rm -rf downloads/$(BOOTSTRAP_BASE:.zip=)
	unzip -d downloads/ $<
	mv downloads/$(BOOTSTRAP_BASE:.zip=)/* $@
	rm -rf downloads/$(BOOTSTRAP_BASE:.zip=)
# unzip preserves the creation date of the bootstrap directory. Which
# means that downloads/bootstrap.zip would likely be more recent than
# the top level directory. This would trigger this target needlessly
# so, touch it.
	touch $@

build/standalone/lib/external/font-awesome: downloads/$(FONTAWESOME_BASE) | build/standalone/lib//external
	-rm -rf $@
	mkdir $@
	unzip -d downloads/ $<
	mv downloads/$(FONTAWESOME_BASE:.zip=)/* $@
	rm -rf downloads/$(FONTAWESOME_BASE:.zip=)
	rm -rf $@/scss
	rm -rf $@/less
	touch $@

build/standalone/lib/external/jquery.bootstrap-growl.js: downloads/$(BOOTSTRAP_GROWL_BASE) | build/standalone/lib/external
	unzip -d $(dir $@) $<
ifneq ($(DEV),0)
	mv $(dir $@)/bootstrap-growl-*/jquery.bootstrap-growl.js $@
else
	mv $(dir $@)/bootstrap-growl-*/jquery.bootstrap-growl.min.js $@
endif
	rm -rf $(dir $@)/bootstrap-growl-*
	touch $@

build/standalone/lib/requirejs: | build/standalone/lib
	-mkdir $@

build/standalone/lib/requirejs/require.js: node_modules/requirejs/require.js | build/standalone/lib/requirejs
	cp $< $@

build/standalone/lib/requirejs/text.js: downloads/text.js | build/standalone/lib/requirejs
	cp $< $@

build/standalone/lib/external/log4javascript.js: downloads/$(LOG4JAVASCRIPT_BASE) | build/standalone/lib/external
	-mkdir $(dir $@)
	unzip -d $(dir $@) $< log4javascript-*/js/*.js
ifneq ($(DEV),0)
	mv $(dir $@)/log4javascript-*/js/log4javascript_uncompressed.js $@
else
	mv $(dir $@)/log4javascript-*/js/log4javascript.js $@
endif
	rm -rf $(dir $@)/log4javascript-*
	touch $@

build/standalone/lib/external/pubsub.js: node_modules/pubsub-js/src/pubsub.js | build/standalone/lib/external
	cp $< $@

build/standalone/lib/external/xregexp.js: node_modules/salve/node_modules/xregexp/xregexp-all.js | build/standalone/lib/external
	cp $< $@

build/standalone/lib/external/lodash:
	mkdir -p $@

build/standalone/lib/external/lodash/%: node_modules/lodash-amd/% | build/standalone/lib/external/lodash
	cp -rp $< $@

build/standalone/lib/external/classList.js: downloads/$(CLASSLIST_BASE) | build/standalone/lib/external
	-mkdir -p $(dir $@)
	unzip -d $(dir $@) $< classList.js-*/*.js
	mv $(dir $@)/classList.js-*/classList.js $@
	rm -rf $(dir $@)/classList.js-*
	touch $@

# The following targets need to have an order dependency on the top
# directories so that when a new version is installed, the target is
# rebuilt. This is necessary because npm preserves the modification
# times of the files *inside* the packages.

build/standalone/lib/salve: node_modules/salve/lib/salve
	rm -rf $@
	cp -rp $< $@
# Sometimes the modification date on the top directory does not
# get updated, so:
	touch $@

build/ks:
	mkdir $@

build/ks/purl.js: downloads/$(PURL_BASE) | build/ks
	rm -rf $@
	unzip -j -d $(dir $@) $< */$(notdir $@)
	touch $@

.PHONY: test
test: build-standalone | build-test-files
ifndef SKIP_SEMVER
	semver-sync -v
endif
	mocha $(MOCHA_PARAMS)

.PHONY: selenium-test
selenium-test: build-config
	python misc/check_selenium_config.py
	$(MAKE) -f build.mk build build-test-files
	behave $(BEHAVE_PARAMS) selenium_test

.PHONY: selenium_test/%.feature
selenium_test/%.feature: build-config
	python misc/check_selenium_config.py
	$(MAKE) -f build.mk build build-test-files
	behave $(BEHAVE_PARAMS) $@

.PHONY: doc
doc: rst-doc jsdoc3-doc

JSDOC3_TEMPLATE_TARGETS=$(patsubst $(JSDOC3_DEFAULT_TEMPLATE)/%,build/jsdoc_template/%,$(shell find $(JSDOC3_DEFAULT_TEMPLATE) -type f))

.PHONY: jsdoc3-doc
jsdoc3-doc: $(JSDOC3_TEMPLATE_TARGETS) build/jsdoc_template/static/styles/mangalam.css
	$(JSDOC3) -c jsdoc.conf.json -d build/api -r lib doc/api_intro.md

$(JSDOC3_TEMPLATE_TARGETS): build/jsdoc_template/%: $(JSDOC3_DEFAULT_TEMPLATE)/%
	-mkdir -p $(dir $@)
	cp $< $@

build/jsdoc_template/static/styles/mangalam.css: misc/jsdoc_template/mangalam.css
	-mkdir -p $(dir $@)
	cp $< $@

build/jsdoc_template/tmpl/layout.tmpl:  misc/jsdoc_template/layout.tmpl
	-mkdir -p $(dir $@)
	cp $< $@

build/jsdoc_template/publish.js:  misc/jsdoc_template/publish.js
	-mkdir -p $(dir $@)
	cp $< $@

rst-doc: $(HTML_TARGETS)

# rst2html does not seem to support rewriting relative
# urls. So we produce the html in our root.
%.html: %.rst
# The perl script is an ugly hack. It would erroneously mangle
# plaintext that would happen to match the pattern. We need a better
# solution eventually.
	$(RST2HTML) $< | perl -np -e 's/href="(.*?)\.rst(#.*?)"/href="$$1.html$$2"/g' > $@

#
# The target dist is not optimized. Issuing consecutive `make dist`
# commands will just recopy everything even if none of the sources
# have changed.
#
.PHONY: dist
dist: test selenium-test
	rm -rf build/wed-*.tgz
	rm -rf build/dist
	mkdir -p build/dist
	cp -rp build/standalone build/dist
	cp -rp build/standalone-optimized build/dist
	cp -rp bin build/dist
	cp NPM_README.md build/dist/README.md
	cp package.json build/dist
	(cd build; npm pack dist)
	rm -rf build/t
	mkdir -p build/t/node_modules
	(cd build/t; npm install ../wed-*.tgz)
	rm -rf build/t

.PHONY: dist-notest
dist-notest: build
	rm -rf build/wed-*.tgz
	rm -rf build/dist
	mkdir -p build/dist
	cp -rp build/standalone build/dist
	cp -rp build/standalone-optimized build/dist
	cp -rp bin build/dist
	cp NPM_README.md build/dist/README.md
	cp package.json build/dist
	(cd build; npm pack dist)
	rm -rf build/t
	mkdir -p build/t/node_modules
	(cd build/t; npm install ../wed-*.tgz)
	rm -rf build/t

.PHONY: publish
publish: dist
	npm publish build/dist

.PHONY: clean
clean::
	-rm -rf build
	-rm $(HTML_TARGETS)
	-rm -rf gh-pages-build

.PHONY: distclean
distclean: clean
	-rm -rf downloads
