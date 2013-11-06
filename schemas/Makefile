# Local makefile for when once in a while we need to regenerate these
# schemas.

all: tei-simplified-rng.js simplified-rng.js

tei-simplified-rng.js: myTEI.rng
simplified-rng.js: simple.rng

%.js: %.rng
	salve-convert $< $@
