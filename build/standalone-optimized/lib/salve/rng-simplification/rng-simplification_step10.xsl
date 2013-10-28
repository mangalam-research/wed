<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" exclude-result-prefixes="rng">

<xsl:output method="xml"/>

<!-- 7.13
define, oneOrMore, zeroOrMore, optional, list, and mixed patterns are transformed to have exactly one child pattern. If they have more than one pattern, these patterns are wrapped into a group pattern.

element patterns follow a similar rule and are transformed to have exactly one name class and a single child pattern.

except patterns and name classes are also transformed to have exactly one child pattern, but since they have a different semantic, their child elements are wrapped in a choice element.

If an attribute pattern has no child pattern, a text pattern is added.

The group and interleave patterns and the choice pattern and name class are recursively transformed to have exactly two subelements: if it has only one child, it's replaced by this child. If it has more than two children, the first two child elements are combined into a new element until there are exactly two child elements.
-->

<xsl:template match="*|text()|@*">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="rng:define[count(*)>1]|rng:oneOrMore[count(*)>1]|rng:zeroOrMore[count(*)>1]|rng:optional[count(*)>1]|rng:list[count(*)>1]|rng:mixed[count(*)>1]">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:call-template name="reduce7.13">
			<xsl:with-param name="node-name" select="'rng:group'"/>
		</xsl:call-template>
	</xsl:copy>
</xsl:template>

<xsl:template match="rng:except[count(*)>1]">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:call-template name="reduce7.13">
			<xsl:with-param name="node-name" select="'rng:choice'"/>
		</xsl:call-template>
	</xsl:copy>
</xsl:template>

<xsl:template match="rng:attribute[count(*) =1]">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates select="*"/>
		<rng:text/>
	</xsl:copy>
</xsl:template>

<xsl:template match="rng:element[count(*)>2]">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates select="*[1]"/>
		<xsl:call-template name="reduce7.13">
			<xsl:with-param name="left" select="*[4]"/>
			<xsl:with-param name="node-name" select="'rng:group'"/>
			<xsl:with-param name="out">
				<rng:group>
					<xsl:apply-templates select="*[2]"/>
					<xsl:apply-templates select="*[3]"/>
				</rng:group>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:copy>
</xsl:template>

<xsl:template match="rng:group[count(*)=1]|rng:choice[count(*)=1]|rng:interleave[count(*)=1]">
	<xsl:apply-templates select="*"/>
</xsl:template>

<xsl:template match="rng:group[count(*)>2]|rng:choice[count(*)>2]|rng:interleave[count(*)>2]" name="reduce7.13">
	<xsl:param name="left" select="*[3]"/>
	<xsl:param name="node-name" select="name()"/>
	<xsl:param name="out">
		<xsl:element name="{$node-name}" namespace="{namespace-uri()}">
			<xsl:apply-templates select="*[1]"/>
			<xsl:apply-templates select="*[2]"/>
		</xsl:element>
	</xsl:param>
	<xsl:choose>
		<xsl:when test="$left">
			<xsl:variable name="newOut">
				<xsl:element name="{$node-name}" namespace="{namespace-uri()}">
					<xsl:copy-of select="$out"/>
					<xsl:apply-templates select="$left"/>
				</xsl:element>
			</xsl:variable>
			<xsl:call-template name="reduce7.13">
				<xsl:with-param name="left" select="$left/following-sibling::*[1]"/>
				<xsl:with-param name="out" select="$newOut"/>
				<xsl:with-param name="node-name" select="$node-name"/>
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:copy-of select="$out"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>
