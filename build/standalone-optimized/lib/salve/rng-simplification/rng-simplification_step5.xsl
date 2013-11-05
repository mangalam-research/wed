<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" exclude-result-prefixes="rng">

<xsl:output method="xml"/>

<!-- 7.5 
If not specified, the type attributes of the value pattern are defaulted to the token datatype from the built in datatype library
-->

<xsl:template match="*|text()|@*">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="rng:value[not(@type)]/@datatypeLibrary"/>

<xsl:template match="rng:value[not(@type)]">
	<rng:value type="token" datatypeLibrary="">
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</rng:value>
</xsl:template>

</xsl:stylesheet>
