<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" xmlns:exsl="http://exslt.org/common" extension-element-prefixes="exsl" exclude-result-prefixes="exsl rng">

<xsl:output method="xml"/>

<!-- 7.21
Recursively escalate notAllowed patterns, when they are located where their effect is such that their parent pattern itself is notAllowed. Remove choices that are notAllowed. (Note that this simplification doesn't cross element boundaries, so element foo { notAllowed } isn't transformed into notAllowed.)
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
		<xsl:when test="$thisIteration//@updated|$thisIteration//processing-instruction('updated')">
			<xsl:apply-templates select="$thisIteration/rng:grammar"/>
		</xsl:when>
		<xsl:otherwise>
			<xsl:copy-of select="$thisIteration-rtf"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="rng:choice[count(rng:notAllowed)=1]">
	<xsl:apply-templates select="*[not(self::rng:notAllowed)]">
		<xsl:with-param name="updated" select="1"/>
	</xsl:apply-templates>
</xsl:template>

<xsl:template match="rng:attribute[rng:notAllowed]|rng:list[rng:notAllowed]|rng:group[rng:notAllowed]|rng:interleave[rng:notAllowed]|rng:oneOrMore[rng:notAllowed]|rng:choice[count(rng:notAllowed) = 2]">
	<rng:notAllowed updated="1"/>
</xsl:template>

<xsl:template match="rng:except[rng:notAllowed]">
  <xsl:processing-instruction name="updated"/>
</xsl:template>

</xsl:stylesheet>
