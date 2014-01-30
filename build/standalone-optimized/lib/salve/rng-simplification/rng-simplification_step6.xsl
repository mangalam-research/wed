<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" exclude-result-prefixes="rng">

<xsl:output method="xml"/>

<!-- 7.9
The name attribute of the element and attribute patterns is replaced by the name element, a name class that matches only a single name.
 -->

<xsl:template match="*|text()|@*">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="@name[parent::rng:element|parent::rng:attribute]"/>

<xsl:template match="rng:element[@name]|rng:attribute[@name]">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:if test="self::rng:attribute and not(@ns)">
			<xsl:attribute name="ns"/>
		</xsl:if>
		<rng:name>
			<xsl:value-of select="@name"/>
		</rng:name>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

</xsl:stylesheet>
