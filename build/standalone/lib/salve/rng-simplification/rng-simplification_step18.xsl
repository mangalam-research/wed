<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" xmlns:exsl="http://exslt.org/common" extension-element-prefixes="exsl" exclude-result-prefixes="exsl rng">

<xsl:output method="xml"/>

<!-- 7.22
Remove empty elements that have no effect.

Move useful empty elements so that they are the first child in choice elements.
 -->

<xsl:template match="*|text()|@*">
	<xsl:param name="updated" select="0"/>
	<xsl:copy>
		<xsl:if test="$updated != 0">
			<xsl:attribute name="updated"><xsl:value-of select="$updated"/></xsl:attribute>
		</xsl:if>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="@updated"/>

<xsl:template match="/rng:grammar">
	<xsl:variable name="thisIteration-rtf">
		<xsl:copy>
			<xsl:apply-templates select="@*"/>
			<xsl:apply-templates/>
		</xsl:copy>
	</xsl:variable>
	<xsl:variable name="thisIteration" select="exsl:node-set($thisIteration-rtf)"/>
	<xsl:choose>
		<xsl:when test="$thisIteration//@updated">
			<xsl:apply-templates select="$thisIteration/rng:grammar"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:copy-of select="$thisIteration-rtf"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="rng:choice[*[1][not(self::rng:empty)] and *[2][self::rng:empty]]">
	<xsl:copy>
		<xsl:attribute name="updated">1</xsl:attribute>
		<xsl:apply-templates select="*[2]" />
		<xsl:apply-templates select="*[1]" />
	</xsl:copy>
</xsl:template>

<xsl:template match="rng:group[count(rng:empty)=1]|rng:interleave[count(rng:empty)=1]">
	<xsl:apply-templates select="*[not(self::rng:empty)]">
		<xsl:with-param name="updated" select="1"/>
	</xsl:apply-templates>
</xsl:template>

<xsl:template match="rng:group[count(rng:empty)=2]|rng:interleave[count(rng:empty)=2]|rng:choice[count(rng:empty)=2]|rng:oneOrMore[rng:empty]">
	<rng:empty updated="1"/>
</xsl:template>

</xsl:stylesheet>
