# Local makefile for when once in a while we need to regenerate these
# schemas.

.SECONDEXPANSION:
all: tei-simplified-rng.js simplified-rng.js tei-math-rng.js

tei-simplified-rng.js: myTEI.rng
simplified-rng.js: simple.rng
tei-math-rng.js: tei-math.rng

%.js:
	salve-convert --allow-incomplete-types=1 $< $@
