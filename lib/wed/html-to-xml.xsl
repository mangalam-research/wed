<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:internal="internal"
    exclude-result-prefixes="xs"
    version="2.0">

  <xsl:preserve-space  elements="*"/>

  <xsl:output method="xml" indent="no"/>

  <xsl:function name="internal:prefix-to-uri" >
    <xsl:param name="node"/>
    <xsl:param name="qname"/>
    <xsl:variable name="prefix" select="substring-before($qname, ':')"/>
    <xsl:if test="$prefix != ''">
      <xsl:variable name="local-declaration"
                    select="$node/@*[local-name() =
                            concat('data-wed-xmlns---', $prefix)]"/>
      <xsl:value-of select="if ($local-declaration) then
                            $local-declaration else
                            internal:prefix-to-uri($node/.., $prefix)"/>
    </xsl:if>
  </xsl:function>

  <xsl:template match="xhtml:div">
    <xsl:variable name="qname" select="tokenize(@class, '\s+')[1]"/>
    <xsl:variable name="prefix" select="substring-before($qname, ':')"/>
    <xsl:variable name="uri" select="internal:prefix-to-uri(., $qname)"/>
    <xsl:element name="{$qname}" namespace="{$uri}">
      <!-- Handle the defaut namespace. -->
      <xsl:if test="@data-wed-xmlns">
        <xsl:namespace name="" select="@data-wed-xmlns"/>
      </xsl:if>
      <xsl:for-each select="@*[starts-with(local-name(), 'data-wed-') and
                            not(starts-with(local-name(), 'data-wed-xmlns'))]">
        <xsl:variable name="qname"
                      select="replace(replace(substring-after(local-name(),
                              'data-wed-'), '^([^-]+)---([^-])', '$1:$2'),
                              '----', '---')"/>
        <xsl:attribute name="{$qname}"
                       namespace="{internal:prefix-to-uri(.., $qname)}">
          <xsl:apply-templates select="."/>
        </xsl:attribute>
      </xsl:for-each>
      <xsl:apply-templates/>
    </xsl:element>
  </xsl:template>

  <!-- Safety net -->
  <xsl:template match="*">
    <xsl:message terminate="yes">Unexpected element <xsl:value-of
    select="name()"/>.</xsl:message>
  </xsl:template>

  <xsl:template match="text()">
    <xsl:copy-of select="."/>
  </xsl:template>
</xsl:stylesheet>
