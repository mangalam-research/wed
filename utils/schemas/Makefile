SALVE_ROOT=~/src/git-repos/salve/
SIMPLIFY=salve-simplify
RNG_TO_JS=$(SALVE_ROOT)/lib/salve/rng-to-js.xsl

out/btw-storage.js:

out/btw-storage.rng: btw-storage.xml
	roma --xsl=/usr/share/xml/tei/stylesheet --noxsd --nodtd $< out 

out/btw-storage-simplified.rng: out/btw-storage.rng
	$(SIMPLIFY) $< $@

out/btw-storage.js: out/btw-storage-simplified.rng
	xsltproc $(RNG_TO_JS) $< > $@

clean:
	rm -rf out


