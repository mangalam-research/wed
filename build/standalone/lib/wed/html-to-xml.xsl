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
    <xsl:param name="prefix"/>
    <xsl:choose>
      <xsl:when test="$prefix='xml'">
        <xsl:value-of select='"http://www.w3.org/XML/1998/namespace"'/>
      </xsl:when>
      <xsl:when test="not($node)"/>
      <xsl:otherwise>
      <xsl:variable name="local-declaration"
                    select="if ($prefix = '') then $node/@data-wed-xmlns
                            else $node/@*[local-name() =
                                    concat('data-wed-xmlns---', $prefix)]"/>
      <xsl:value-of select="if ($local-declaration != '') then
                            $local-declaration else
                            internal:prefix-to-uri($node/.., $prefix)"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>

  <xsl:function name="internal:qname-to-uri" >
    <xsl:param name="node"/>
    <xsl:param name="qname"/>
    <xsl:variable name="prefix" select="substring-before($qname, ':')"/>
    <xsl:value-of select="internal:prefix-to-uri($node, $prefix)"/>
  </xsl:function>

  <xsl:template match="xhtml:div">
    <xsl:variable name="qname" select="tokenize(@class, '\s+')[1]"/>
    <xsl:variable name="uri" select="internal:qname-to-uri(., $qname)"/>
    <xsl:element name="{$qname}" namespace="{$uri}">
      <!-- Handle the defaut namespace. -->
      <xsl:if test="@data-wed-xmlns">
        <xsl:namespace name="" select="@data-wed-xmlns"/>
      </xsl:if>
      <!-- Handle the other namespaces. -->
      <xsl:for-each select="@*[starts-with(local-name(), 'data-wed-xmlns---')]">
        <xsl:namespace
            name="{substring-after(local-name(), 'data-wed-xmlns---')}"
            select="."/>
      </xsl:for-each>
      <!-- Handle the other attributes. -->
      <xsl:for-each select="@*[starts-with(local-name(), 'data-wed-') and
                            not(starts-with(local-name(), 'data-wed-xmlns'))]">
        <xsl:variable name="qname"
                      select="replace(replace(substring-after(local-name(),
                              'data-wed-'), '^([^-]+)---([^-])', '$1:$2'),
                              '----', '---')"/>
        <xsl:variable name="prefix" select="substring-before($qname, ':')"/>
        <xsl:choose>
          <!-- No empty namespace on attribues! -->
          <xsl:when test="$prefix">
            <xsl:attribute name="{$qname}"
                           namespace="{internal:qname-to-uri(.., $qname)}">
              <xsl:apply-templates select="."/>
            </xsl:attribute>
          </xsl:when>
          <xsl:otherwise>
            <xsl:attribute name="{$qname}">
              <xsl:apply-templates select="."/>
            </xsl:attribute>
          </xsl:otherwise>
        </xsl:choose>
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
