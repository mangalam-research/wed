<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" exclude-result-prefixes="rng">

<xsl:output method="xml"/>

<!-- 7.7 
externalRef patterns are replaced by the content of the resource referenced by their href attributes. All the simplification steps up to this one must be recursively applied during this replacement to make sure all schemas are merged at the same level of simplification.
-->

<xsl:template match="*|text()|@*">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="rng:externalRef">
	<xsl:element name="{local-name(document(@href)/*)}" namespace="http://relaxng.org/ns/structure/1.0">
		<xsl:if test="not(document(@href)/*/@ns) and @ns">
			<xsl:attribute name="ns">
				<xsl:value-of select="@ns"/>
			</xsl:attribute>
		</xsl:if>
		<xsl:copy-of select="document(@href)/*/@*"/>
		<xsl:copy-of select="document(@href)/*/*|document(@href)/*/text()"/>
	</xsl:element>
</xsl:template>

<!-- 7.8 
The schemas referenced by include patterns are read and all the simplification steps up to this point are recursively applied to these schemas. Their definitions are overridden by those found in the include pattern itself when overrides are used. The content of their grammar is added in a new div pattern to the current schema. The div pattern is needed temporarily to carry namespace information to the next sequence of steps.
-->

<xsl:template match="rng:include">
	<rng:div>
		<xsl:copy-of select="@*[name() != 'href']"/>
		<xsl:copy-of select="*"/>
		<xsl:copy-of select="document(@href)/rng:grammar/rng:start[not(current()/rng:start)]"/>
		<xsl:copy-of select="document(@href)/rng:grammar/rng:define[not(@name = current()/rng:define/@name)]"/>
	</rng:div>
</xsl:template>

</xsl:stylesheet>
