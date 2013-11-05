<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" exclude-result-prefixes="rng">

<xsl:output method="xml"/>

<!-- 7.19
The names of the named patterns are then changed so as to be unique across the whole schema; the references to these named patterns are changed accordingly.

A top-level grammar and its start element are created, if not already present. All the named patterns become children in this top-level grammar, parentRef elements are replaced by ref elements, and all other grammar and start elements are replaced by their child elements.
 -->

<xsl:template match="*|text()|@*">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="/rng:grammar">
	<rng:grammar>
		<xsl:apply-templates/>
		<xsl:apply-templates select="//rng:define" mode="step7.19-define"/>
	</rng:grammar>
</xsl:template>

<xsl:template match="/*[not(self::rng:grammar)]">
	<rng:grammar>
		<rng:start>
			<xsl:copy>
				<xsl:apply-templates select="@*"/>
				<xsl:apply-templates/>
			</xsl:copy>
		</rng:start>
	</rng:grammar>
</xsl:template>

<xsl:template match="rng:define|rng:define/@name|rng:ref/@name|rng:parentRef/@name"/>

<xsl:template match="rng:define" mode="step7.19-define">
	<xsl:copy>
		<xsl:attribute name="name">
			<xsl:value-of select="concat(@name, '-', generate-id())"/>
		</xsl:attribute>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="rng:grammar">
	<xsl:apply-templates select="rng:start/*"/>
</xsl:template>

<xsl:template match="rng:ref">
	<xsl:copy>
		<xsl:attribute name="name">
			<xsl:value-of select="concat(@name, '-', generate-id(ancestor::rng:grammar[1]/rng:define[@name=current()/@name]))"/>
		</xsl:attribute>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="rng:parentRef">
	<rng:ref>
		<xsl:attribute name="name">
			<xsl:value-of select="concat(@name, '-', generate-id(ancestor::rng:grammar[2]/rng:define[@name=current()/@name]))"/>
		</xsl:attribute>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</rng:ref>
</xsl:template>

</xsl:stylesheet>
