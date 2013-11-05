<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" exclude-result-prefixes="rng">

<xsl:output method="xml"/>

<!-- 7.14
mixed patterns are transformed into interleave patterns between their unique child pattern and a text pattern.
 -->

<xsl:template match="*|text()|@*">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="rng:mixed">
	<rng:interleave>
		<xsl:apply-templates/>
		<rng:text/>
	</rng:interleave>
</xsl:template>

</xsl:stylesheet>
