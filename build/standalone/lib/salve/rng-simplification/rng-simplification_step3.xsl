<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" exclude-result-prefixes="rng">

<xsl:output method="xml"/>

<!-- 7.3
Text nodes containing only whitespace are removed, except when found in value and param elements. Whitespace is normalized in name, type, and combine attributes and in name elements
-->

<xsl:template match="*|text()|@*">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="text()[normalize-space(.)='' and not(parent::rng:param or parent::rng:value)]"/>

<xsl:template match="@name|@type|@combine">
	<xsl:attribute name="{name()}">
		<xsl:value-of select="normalize-space(.)"/>
	</xsl:attribute>
</xsl:template>

<xsl:template match="rng:name/text()">
	<xsl:value-of select="normalize-space(.)"/>
</xsl:template>

</xsl:stylesheet>
