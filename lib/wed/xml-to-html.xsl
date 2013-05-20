<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet 
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    version="2.0">

  <xsl:strip-space elements="*"/>

  <xsl:output method="xhtml" indent="no" omit-xml-declaration="yes"/>
  
  <xsl:template match="*" name="copy">
    <!-- We encode attributes here in the following way:

         1. A sequence of three dashes or more gains a dash. So three
         dashes becomes 4, 4 becomes 5, etc.
         
         2. A colon (which should be present only to mark the prefix,
         becomes a sequence of three dashes.
    -->
    <div><xsl:attribute name="class" select="concat(name(), ' _real')"/><xsl:for-each select="@*"><xsl:attribute name="data-wed-{replace(replace(name(), '--(-+)', '---($1)'), ':', '---')}" select="."/></xsl:for-each><xsl:apply-templates select="node()"/></div>
  </xsl:template>

  <xsl:template match="text()">
    <xsl:copy-of select="."/>
  </xsl:template>
</xsl:stylesheet>
