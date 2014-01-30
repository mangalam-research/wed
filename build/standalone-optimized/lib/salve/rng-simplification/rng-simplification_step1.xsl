<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:rng="http://relaxng.org/ns/structure/1.0" exclude-result-prefixes="rng">

<xsl:output method="xml"/>

<!-- 7.7
externalRef patterns are replaced by the content of the resource referenced by their href attributes. All the simplification steps up to this one must be recursively applied during this replacement to make sure all schemas are merged at the same level of simplification.
-->

<!-- Original directory of the file we are simplifying. -->
<xsl:param name="originalDir"/>

<xsl:template match="*|text()|@*">
  <xsl:copy>
    <xsl:apply-templates select="@*"/>
    <xsl:apply-templates/>
  </xsl:copy>
</xsl:template>

<xsl:template match="rng:externalRef">
  <xsl:element name="{local-name(document(@href)/*)}"
               namespace="http://relaxng.org/ns/structure/1.0">
    <xsl:if test="not(document(@href)/*/@ns) and @ns">
      <xsl:attribute name="ns">
	<xsl:value-of select="@ns"/>
      </xsl:attribute>
    </xsl:if>
    <xsl:variable name="sourceDir">
      <xsl:call-template name="joinpaths">
        <xsl:with-param name="first" select="$originalDir"/>
        <xsl:with-param name="second">
          <xsl:call-template name="dirname">
            <xsl:with-param name="path" select="@href"/>
          </xsl:call-template>
        </xsl:with-param>
      </xsl:call-template>
    </xsl:variable>
    <xsl:call-template name="include">
      <xsl:with-param name="nodes"
                      select="document(@href)/*/@*|document(@href)/*/*|document(@href)/*/text()"/>
      <xsl:with-param name="sourceDir" select="$sourceDir"/>
    </xsl:call-template>
  </xsl:element>
</xsl:template>

<!-- 7.8 The schemas referenced by include patterns are read and all
     the simplification steps up to this point are recursively applied
     to these schemas. Their definitions are overridden by those found
     in the include pattern itself when overrides are used. The
     content of their grammar is added in a new div pattern to the
     current schema. The div pattern is needed temporarily to carry
     namespace information to the next sequence of steps.
-->

<xsl:template match="rng:include">
  <rng:div>
    <xsl:copy-of select="@*[name() != 'href']"/>
    <xsl:copy-of select="*"/>
    <xsl:variable name="sourceDir">
      <xsl:call-template name="joinpaths">
        <xsl:with-param name="first" select="$originalDir"/>
        <xsl:with-param name="second">
          <xsl:call-template name="dirname">
            <xsl:with-param name="path" select="@href"/>
          </xsl:call-template>
        </xsl:with-param>
      </xsl:call-template>
    </xsl:variable>
    <xsl:call-template name="include">
      <xsl:with-param
          name="nodes"
          select="document(@href)/rng:grammar/*[not(self::rng:start or self::rng:define)]"/>
      <xsl:with-param name="sourceDir" select="$sourceDir"/>
    </xsl:call-template>
    <xsl:call-template name="include">
      <xsl:with-param
          name="nodes"
          select="document(@href)/rng:grammar/rng:start[not(current()/rng:start)]"/>
      <xsl:with-param name="sourceDir" select="$sourceDir"/>
    </xsl:call-template>
    <xsl:call-template name="include">
      <xsl:with-param
          name="nodes"
          select="document(@href)/rng:grammar/rng:define[not(@name = current()/rng:define/@name)]"/>
      <xsl:with-param name="sourceDir" select="$sourceDir"/>
    </xsl:call-template>
  </rng:div>
</xsl:template>

<xsl:template name="include">
  <xsl:param name="nodes"/>
  <xsl:param name="sourceDir"/>
  <xsl:for-each select="$nodes">
    <xsl:choose>
      <!-- Test whether the current node is @href. The count rigmarole
           is what determines that this node is an attribute node. -->
      <xsl:when test="count(../@*) = count(.|../@*) and name() = 'href'">
        <xsl:attribute name="href">
          <xsl:call-template name="joinpaths">
            <xsl:with-param name="first" select="$sourceDir"/>
            <xsl:with-param name="second" select="."/>
          </xsl:call-template>
        </xsl:attribute>
      </xsl:when>
      <xsl:otherwise>
        <xsl:copy>
          <xsl:call-template name="include">
            <xsl:with-param name="nodes" select="*|text()|@*"/>
            <xsl:with-param name="sourceDir" select="$sourceDir"/>
          </xsl:call-template>
        </xsl:copy>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:for-each>
</xsl:template>

<!-- Utilities -->

<!-- Joins two paths together. -->
<xsl:template name="joinpaths">
  <xsl:param name="first"/>
  <xsl:param name="second"/>
  <xsl:choose>
    <xsl:when test="contains($second, ':') or starts-with($second, '/')">
      <xsl:value-of select="$second"/>
    </xsl:when>
    <xsl:when test="substring($first, string-length($first)) = '/'">
      <xsl:value-of select="concat($first, $second)"/>
    </xsl:when>
    <xsl:otherwise>
      <xsl:value-of select="concat($first, '/', $second)"/>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<!-- Computes the dirname part of a path. -->
<xsl:template name="dirname">
  <xsl:param name="path"/>
  <xsl:if test="contains($path, '/')">
    <xsl:value-of select="concat(substring-before($path, '/'), '/')" />
    <xsl:call-template name="dirname">
      <xsl:with-param name="path" select="substring-after($path, '/')" />
    </xsl:call-template>
  </xsl:if>
</xsl:template>


</xsl:stylesheet>
