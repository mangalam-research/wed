<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
		xmlns="http://www.tei-c.org/ns/1.0"
		xmlns:tei="http://www.tei-c.org/ns/1.0"
		xmlns:btw="http://lddubeau.com/ns/btw-storage"
		xmlns:xs="http://www.w3.org/2001/XMLSchema"                
	version="2.0">
  <xsl:namespace-alias stylesheet-prefix="#default" result-prefix="#default"/>
  <!-- Note that comments and embedded documents are ignored. -->
  <xsl:template name="copy" match="@*|*|processing-instruction()|text()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()|processing-instruction()"/>
    </xsl:copy>
  </xsl:template>
  
  <xsl:template match="/">
    <TEI xml:lang="en">
      <teiHeader>
	<fileDesc>
	  <titleStmt>
	    <title>
	      <xsl:apply-templates select="btw:entry/tei:form/tei:orth[1]" mode="title"/>
	    </title>
	    <author>XXX Blah</author>
	  </titleStmt>
	  <publicationStmt>
	    <publisher>Mangalam Research Center for the Buddhist Languages</publisher>
	  </publicationStmt>
	  <sourceDesc>
	    <p>Born digital.</p>
	  </sourceDesc>
	</fileDesc>
	<encodingDesc>
	  <editorialDecl>
	    <quotation marks="all">
	      <p>This document already contains all the quotation
	      marks that the author(s) deemed necessary. Later
	      processors should not add marks if they want to
	      faithfully represent the source.</p>
	    </quotation>
	  </editorialDecl>
	</encodingDesc>
      </teiHeader>
      <text>
	<body>
	  <xsl:apply-templates/>
	</body>
      </text>
    </TEI>
  </xsl:template>

  <xsl:template match="btw:entry">
    <div>
      <head><xsl:apply-templates select="tei:form/tei:orth[1]/text()"/></head>
      <entry>
	<xsl:apply-templates select="tei:form"/>
      </entry>
      <xsl:apply-templates select="node() except tei:form"/>
      <div>
	<head></head>
	<p>[<abbr corresp="/abbr/{@authority}"><xsl:value-of select="@authority"/></abbr>]</p>
      </div>
    </div>
  </xsl:template>

  <xsl:template match="tei:sense">
    <xsl:if test="@type">
      <xsl:message terminate="yes">tei:sense elements may not have @type.</xsl:message>
    </xsl:if>
    <seg type="sense">
      <xsl:apply-templates select="@*|node()"/>
    </seg>
  </xsl:template>

  <xsl:template match="tei:div">
    <xsl:copy>
      <xsl:choose>
	<xsl:when test="@type='definition'">
	  <head>[definition]</head>
	</xsl:when>
	<xsl:when test="@type='classical-examples'">
	  <head>[classical examples]</head>
	</xsl:when>
	<xsl:when test="@type='semantic-fields'">
	  <head>[semantic fields]</head>
	</xsl:when>
	<xsl:when test="@type='etymology'">
	  <head>[etymology]</head>
	</xsl:when>
	<xsl:when test="@type='other-sample-contexts'">
	  <head>[other sample contexts]</head>
	</xsl:when>
	<xsl:when test="@type='discussions'">
	  <head>[discussions in dictionaries and secondary literature]</head>
	</xsl:when>
	<xsl:when test="@type='linguistic-considerations'">
	  <head>[additional linguistic considerations]</head>
	</xsl:when>
	<xsl:otherwise>
	  <xsl:message terminate="yes">unhandled div type: <xsl:value-of select="@type"/></xsl:message>
	</xsl:otherwise>
      </xsl:choose>
      <xsl:apply-templates select="*"/>
    </xsl:copy>
  </xsl:template>

  <xsl:template match="tei:xr[1]">
    <div>
      <head>[related terms]</head>
      <entryFree>
	<xsl:apply-templates select=". union following-sibling::tei:xr" mode="xr"/>
      </entryFree>
    </div>
  </xsl:template>

  <xsl:template match="tei:xr" mode="xr">
    <xsl:copy>
      <xsl:apply-templates select="node()|@*"/>
    </xsl:copy>
  </xsl:template>

  <!-- Do nothing -->
  <xsl:template match="tei:xr"/>


  <xsl:template match="btw:translations[@type='classical']">
    <div type="btw:classical-translations">
      <head>[classical equivalents]</head>
      <p>
	<xsl:apply-templates/>
      </p>
    </div>
  </xsl:template>

  <xsl:template match="btw:translations[@type='contemporary-translations']">
    <div type="btw:contemporary-translations">
      <head>[equivalents, translation and paraphrases in contemporary scholarship]</head>
      <p>
	<xsl:apply-templates/>
      </p>
    </div>
  </xsl:template>

  <xsl:template match="btw:translations">
    <xsl:message terminate="yes">Unknown btw:translations usage.</xsl:message>
  </xsl:template>

  <xsl:template match="btw:lang">
    <seg type="btw:lang">
      <xsl:apply-templates select="@*|node()"/>
    </seg>
  </xsl:template>


  <xsl:template match="tei:orth" mode="title">
    <xsl:copy-of select="@xml:lang"/>
    <xsl:apply-templates select="*|text()"/>
  </xsl:template>

  <!-- Normalize to tei:bibl/tei:ref -->
  <xsl:template match="tei:cit/tei:ref[count(preceding-sibling::*) = 0 or preceding-sibling::*[position() = last() and not(self::tei:ref)]]">
    <bibl>
      <xsl:next-match/>
      <!-- This selects all the following siblings which are tei:ref
           and who have a list of preceding sibling in which the first
           element is tei:ref.
       -->
      <xsl:apply-templates select="following-sibling::tei:ref[preceding-sibling::*[self::tei:ref and position() = last()]]"/>
    </bibl>
  </xsl:template>

</xsl:stylesheet> 
