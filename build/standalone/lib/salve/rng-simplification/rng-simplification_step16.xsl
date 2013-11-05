<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" exclude-result-prefixes="rng">

<xsl:output method="xml"/>

<!-- 7.20 
For each element that isn't the unique child of a define element, a named pattern is created to embed its definition.

For each named pattern that isn't embedded, a single element pattern is suppressed. References to this named pattern are replaced by its definition.
-->

<xsl:template match="*|text()|@*">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="/rng:grammar">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
		<xsl:apply-templates select="//rng:element[not(parent::rng:define)]" mode="step7.20-define"/>
	</xsl:copy>
</xsl:template>

<xsl:template match="rng:element" mode="step7.20-define">
	<rng:define name="__{rng:name}-elt-{generate-id()}">
		<xsl:copy>
			<xsl:apply-templates select="@*"/>
			<xsl:apply-templates/>
		</xsl:copy>
	</rng:define>
</xsl:template>

<xsl:template match="rng:element[not(parent::rng:define)]">
	<rng:ref name="__{rng:name}-elt-{generate-id()}"/>
</xsl:template>

<xsl:template match="rng:define[not(rng:element)]"/>

<xsl:template match="rng:ref[@name=/*/rng:define[not(rng:element)]/@name]">
	<xsl:apply-templates select="/*/rng:define[@name=current()/@name]/*"/>
</xsl:template>

</xsl:stylesheet>
