<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" exclude-result-prefixes="rng">

<xsl:output method="xml"/>

<!-- 7.18
In each grammar, multiple start elements and multiple define elements with the same name are combined as defined by their combine attribute.
 -->

<xsl:template match="*|text()|@*">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="@combine"/>
<xsl:template match="rng:start[preceding-sibling::rng:start]|rng:define[@name=preceding-sibling::rng:define/@name]"/>

<xsl:template match="rng:start[not(preceding-sibling::rng:start) and following-sibling::rng:start]">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:call-template name="start7.18"/>
	</xsl:copy>
</xsl:template>

<xsl:template name="start7.18">
	<xsl:param name="left" select="following-sibling::rng:start[2]"/>
	<xsl:param name="node-name" select="concat('rng:',parent::*/rng:start/@combine)"/>
	<xsl:param name="out">
		<xsl:element name="{$node-name}">
			<xsl:apply-templates select="*"/>
			<xsl:apply-templates select="following-sibling::rng:start[1]/*"/>
		</xsl:element>
	</xsl:param>
	<xsl:choose>
		<xsl:when test="$left/*">
			<xsl:variable name="newOut">
				<xsl:element name="{$node-name}">
					<xsl:copy-of select="$out"/>
					<xsl:apply-templates select="$left/*"/>
				</xsl:element>
			</xsl:variable>
			<xsl:call-template name="start7.18">
				<xsl:with-param name="left" select="$left/following-sibling::rng:start[1]"/>
				<xsl:with-param name="node-name" select="$node-name"/>
				<xsl:with-param name="out" select="$newOut"/>
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:copy-of select="$out"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="rng:define[not(@name=preceding-sibling::rng:define/@name) and @name=following-sibling::rng:define/@name]">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:call-template name="define7.18"/>
	</xsl:copy>
</xsl:template>

<xsl:template name="define7.18">
	<xsl:param name="left" select="following-sibling::rng:define[@name=current()/@name][2]"/>
	<xsl:param name="node-name" select="concat('rng:',parent::*/rng:define[@name=current()/@name]/@combine)"/>
	<xsl:param name="out">
		<xsl:element name="{$node-name}">
			<xsl:apply-templates select="*"/>
			<xsl:apply-templates select="following-sibling::rng:define[@name=current()/@name][1]/*"/>
		</xsl:element>
	</xsl:param>
	<xsl:choose>
		<xsl:when test="$left/*">
			<xsl:variable name="newOut">
				<xsl:element name="{$node-name}">
					<xsl:copy-of select="$out"/>
					<xsl:apply-templates select="$left/*"/>
				</xsl:element>
			</xsl:variable>
			<xsl:call-template name="define7.18">
				<xsl:with-param name="left" select="$left/following-sibling::rng:define[@name=current()/@name][1]"/>
				<xsl:with-param name="node-name" select="$node-name"/>
				<xsl:with-param name="out" select="$newOut"/>
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:copy-of select="$out"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>
