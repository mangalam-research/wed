<xsl:stylesheet
    xmlns="http://www.tei-c.org/ns/1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:rng="http://relaxng.org/ns/structure/1.0"
    xmlns:l="local-stuff"
    version="1.0"
    exclude-result-prefixes="xs rng"
    >
  <xsl:output method="text"/>

  <xsl:param name="output-paths" select="false()"/>
  <xsl:param name="output-version" select="1"/>

  <xsl:template match="/">
    <xsl:choose>
      <xsl:when test="$output-version=0">
        <xsl:apply-templates/>
      </xsl:when>
      <xsl:when test="$output-version>=1">
        <xsl:text>{"v":</xsl:text>
        <xsl:value-of select="$output-version"/>
        <xsl:text>,"o":</xsl:text>
        <xsl:value-of select="not($output-paths) * 1"/>
        <xsl:text>,"d":</xsl:text>
        <xsl:apply-templates/>
        <xsl:text>}</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="output-version-abort"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="*">
    <xsl:call-template name="generate-new"/>
  </xsl:template>

  <xsl:template match="rng:grammar">
    <xsl:call-template name="generate-new"/>
  </xsl:template>

  <xsl:template match="rng:ref|rng:define">
    <xsl:call-template name="generate-new">
      <xsl:with-param name="first" select="@name"/>
      <xsl:with-param name="rest" select="*"/>
    </xsl:call-template>
  </xsl:template>

  <xsl:template match="rng:ref/@name|rng:define/@name">
    <xsl:text>"</xsl:text><xsl:value-of select="."/><xsl:text>"</xsl:text>
  </xsl:template>

  <xsl:variable name="name-to-type-table" select="document('')/xsl:stylesheet/l:table"/>

  <xsl:key name="type-lookup" match="l:table/l:x" use="@name"/>

  <l:table>
    <!-- Array = 0 is hardcoded elsewhere in this file. So don't change
         it! -->
    <l:x name="Array">0</l:x>
    <l:x name="Empty">1</l:x>
    <l:x name="Data">2</l:x>
    <l:x name="List">3</l:x>
    <l:x name="Param">4</l:x>
    <l:x name="Value">5</l:x>
    <l:x name="NotAllowed">6</l:x>
    <l:x name="Text">7</l:x>
    <l:x name="Ref">8</l:x>
    <l:x name="OneOrMore">9</l:x>
    <l:x name="Choice">10</l:x>
    <l:x name="Group">11</l:x>
    <l:x name="Attribute">12</l:x>
    <l:x name="Element">13</l:x>
    <l:x name="Define">14</l:x>
    <l:x name="Grammar">15</l:x>
    <l:x name="EName">16</l:x>
  </l:table>

  <xsl:template name="name-to-type">
    <xsl:param name="name"/>
    <!-- XSLT ver 1 does not have $top, hence the loop -->
    <xsl:for-each select="$name-to-type-table">
      <xsl:value-of select="key('type-lookup', $name)"/>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="output-version-abort">
    <xsl:message terminate="yes">can't handle output-version: <xsl:value-of select="$output-version"/></xsl:message>
  </xsl:template>

  <xsl:template match="rng:name">
    <xsl:choose>
      <xsl:when test="$output-version=0">
        <xsl:text>{"type":"EName","args":["</xsl:text>
        <xsl:apply-templates select="@ns"/>
        <xsl:text>","</xsl:text>
        <xsl:apply-templates/>
        <xsl:text>"]}</xsl:text>
      </xsl:when>
      <xsl:when test="$output-version=1">
        <xsl:text>[</xsl:text>
        <xsl:call-template name="name-to-type">
          <xsl:with-param name="name">EName</xsl:with-param>
        </xsl:call-template>
        <xsl:text>,"</xsl:text>
        <xsl:apply-templates select="@ns"/>
        <xsl:text>","</xsl:text>
        <xsl:apply-templates/>
        <xsl:text>"]</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="output-version-abort"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="rng:start">
    <xsl:apply-templates select="*"/>
  </xsl:template>

  <xsl:template match="rng:group|rng:choice|rng:oneOrMore">
    <xsl:call-template name="generate-new">
      <xsl:with-param name="first" select="QQQQ"/> <!-- Empty set -->
    </xsl:call-template>
  </xsl:template>

  <xsl:template match="*" mode="name">
    <xsl:text>/</xsl:text><xsl:value-of select="local-name()"/>
    <xsl:if test="rng:name">
      <xsl:text>[@name='</xsl:text><xsl:apply-templates select="rng:name" mode="name"/><xsl:text>']</xsl:text>
    </xsl:if>
    <xsl:if test="@name">
      <xsl:text>[@name='</xsl:text><xsl:apply-templates select="@name" mode="name"/><xsl:text>']</xsl:text>
    </xsl:if>
  </xsl:template>

  <xsl:template match="rng:name" mode="name">
    <xsl:apply-templates/>
  </xsl:template>

  <xsl:template name="generate-new">
    <xsl:param name="name" select="local-name()"/>
    <xsl:param name="first" select="*[1]"/>
    <xsl:param name="rest" select="*[position() > count($first)]"/>
    <xsl:if test="position() != 1">
      <xsl:text>,</xsl:text>
    </xsl:if>
    <xsl:call-template name="generate-new-start">
      <xsl:with-param name="name" select="$name"/>
    </xsl:call-template>
    <xsl:choose>
      <xsl:when test="$output-version=0">
        <xsl:text>"args":["</xsl:text>
        <xsl:if test="$output-paths">
          <xsl:apply-templates select="ancestor-or-self::*" mode="name"/>
        </xsl:if>
        <xsl:text>"</xsl:text>
        <xsl:if test="count($first) > 0 or $rest">
          <xsl:text>,</xsl:text>
        </xsl:if>
        <xsl:if test="count($first)>0">
          <xsl:apply-templates select="$first"/>
          <xsl:if test="$rest">
	    <xsl:text>,</xsl:text>
          </xsl:if>
        </xsl:if>
        <xsl:if test="$rest">
          <xsl:text>[</xsl:text><xsl:apply-templates select="$rest"/><xsl:text>]</xsl:text>
        </xsl:if>
        <xsl:text>]}</xsl:text>
      </xsl:when>
      <xsl:when test="$output-version=1">
        <xsl:if test="$output-paths">
          <xsl:text>"</xsl:text>
          <xsl:apply-templates select="ancestor-or-self::*" mode="name"/>
          <xsl:text>"</xsl:text>
        </xsl:if>
        <xsl:if test="count($first) > 0 or $rest">
          <xsl:text>,</xsl:text>
        </xsl:if>
        <xsl:if test="count($first)>0">
          <xsl:apply-templates select="$first"/>
          <xsl:if test="$rest">
	    <xsl:text>,</xsl:text>
          </xsl:if>
        </xsl:if>
        <xsl:if test="$rest">
          <!-- 0 means Array. -->
          <xsl:text>[0,</xsl:text>
          <xsl:apply-templates select="$rest"/>
          <xsl:text>]</xsl:text>
        </xsl:if>
        <xsl:text>]</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="output-version-abort"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="generate-new-start">
    <xsl:param name="name" select="local-name()"/>
    <xsl:choose>
      <xsl:when test="$output-version=0">
        <xsl:text>{"type":"</xsl:text><xsl:value-of select="concat(translate(substring($name, 1, 1), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), substring($name, 2))"/><xsl:text>",</xsl:text>
      </xsl:when>
      <xsl:when test="$output-version=1">
        <xsl:text>[</xsl:text>
        <xsl:call-template name="name-to-type">
          <xsl:with-param name="name" select="concat(translate(substring($name, 1, 1), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), substring($name, 2))"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="output-version-abort"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

</xsl:stylesheet>
