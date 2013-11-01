#
# The make system is divided in two pieces: this file and
# build.mk. Doing it this way enables us to *force* a dependency
# recalculation every time make is run. (.PHONY by itself in a single
# Makefile does not work because the dependencies are not *reread*
# immediately. Does not work, period. Yes, we've tried.)
#

export
CONFIG_TARGETS:=$(sort $(foreach f,$(shell find config local_config -type f -printf '%P\n'),$(patsubst %,build/config/%,$f)))
CONFIG_DEPS:=$(CONFIG_TARGETS:=.d)
PASS_THROUGH:= all test selenium-test gh-pages-build build-test-files build-deployment

.PHONY: $(PASS_THROUGH) clean

$(PASS_THROUGH): $(CONFIG_DEPS)
	$(MAKE) -f build.mk $@

clean:
	$(MAKE) -f build.mk $@

build/config:
	-mkdir -p $@

#
# What we've got here is a poor man's dependency calculation system.
#
# The .d files record whether make is to take the source for the
# corresponding file in build/config from config or local_config.
#

.PHONY: $(CONFIG_DEPS)
$(CONFIG_DEPS): DEP_FOR=$(@:.d=)
$(CONFIG_DEPS): DEP_FOR_BASE=$(notdir $(DEP_FOR))
$(CONFIG_DEPS): | build/config
	@echo "Computing $@"
	@if [ -e local_config/$(DEP_FOR_BASE) ]; then \
		echo '$(DEP_FOR): local_config/$(DEP_FOR_BASE)' > $@.t; \
	else \
		echo '$(DEP_FOR): config/$(DEP_FOR_BASE)' > $@.t; \
	fi
# If the dependencies have changed in any way, delete the target so that it
# is rebuilt.
	@if ! diff -qN $@.t $@ > /dev/null; then \
		rm -rf $(DEP_FOR); \
		mv $@.t $@; \
	else \
		rm $@.t; \
	fi
