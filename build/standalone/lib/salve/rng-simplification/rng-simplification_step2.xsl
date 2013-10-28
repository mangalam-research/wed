<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:nsp="namespace_declaration" xmlns:rng="http://relaxng.org/ns/structure/1.0" exclude-result-prefixes="rng">

<xsl:output method="xml"/>

<!-- 7.2 
Annotations (i.e., attributes and elements from foreign namespaces) are removed.
nsp:* are the markups used as a work-around the fact that xslt namespace axis is not supported in firefox
-->

<xsl:template match="rng:*|nsp:*|text()|@*[namespace-uri()='']">
	<xsl:copy>
		<xsl:apply-templates select="@*"/>
		<xsl:apply-templates/>
	</xsl:copy>
</xsl:template>

<xsl:template match="*|@*"/>

</xsl:stylesheet>
