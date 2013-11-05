<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" exclude-result-prefixes="rng">

<xsl:output method="xml"/>

<!-- 7.10
ns attributes are transferred through inheritance to the elements that need them; name, nsName, and value patterns need this attribute to support QName datatypes reliably. (Note that the ns attribute behaves like the default namespace in XML and isn't passed to attributes, which, by default, have no namespace URI.)
 -->

<xsl:template match="*|text()|@*">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="@ns"/>

<xsl:template match="rng:name|rng:nsName|rng:value">
	<xsl:copy>
		<xsl:attribute name="ns">
			<xsl:value-of select="ancestor-or-self::*[@ns][1]/@ns"/>
		</xsl:attribute>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

</xsl:stylesheet>
