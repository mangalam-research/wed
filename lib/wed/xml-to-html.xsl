<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet 
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    exclude-result-prefixes="xs"
    version="2.0">

  <xsl:preserve-space  elements="*"/>

  <xsl:output method="xhtml" indent="no" omit-xml-declaration="yes"/>
  
  <xsl:template match="*" name="copy">
    <!-- We encode attributes here in the following way:

         1. A sequence of three dashes or more gains a dash. So three
         dashes becomes 4, 4 becomes 5, etc.
         
         2. A colon (which should be present only to mark the prefix,
         becomes a sequence of three dashes.
    -->
    <div><xsl:call-template name="handleNamespaceChanges"/><xsl:attribute name="class" select="concat(name(), ' _real')"/><xsl:for-each select="@*"><xsl:attribute name="data-wed-{replace(replace(name(), '--(-+)', '---$1'), ':', '---')}" select="."/></xsl:for-each><xsl:apply-templates select="node()"/></div>
  </xsl:template>

  <xsl:template name="handleNamespaceChanges">
    <xsl:variable name="current-node" select="."/>
    <xsl:variable name="at-root" select=". eq /"/>
    <!-- The variable prefixes will contain all the namespaces for
         which we have to produce attributes. Note that we exclude the
         xml prefix because it has a value which is determined by the
         XML standard. -->
    <!-- A or B would not work here unless Xpath 1.0 compatibility is
         turned on. So we use if ... then ... else ... -->
    <xsl:variable name="prefixes" as="xs:string *" select="(if ($at-root) then in-scope-prefixes(.) else in-scope-prefixes(.)[namespace-uri-for-prefix(., $current-node) != namespace-uri-for-prefix(., $current-node/..)])[. != 'xml']"/>
    <xsl:for-each select="$prefixes">
      <xsl:attribute name="data-wed-xmlns{if (. = '') then '' else concat('---', replace(., '--(-+)', '---$1'))}" select="namespace-uri-for-prefix(., $current-node)"/>
    </xsl:for-each>
  </xsl:template>

  <xsl:template match="text()">
    <xsl:copy-of select="."/>
  </xsl:template>
</xsl:stylesheet>
