<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    version="2.0">

  <xsl:import href="../misc/xml-to-html.xsl"/>
  <xsl:strip-space elements="*"/>
  <xsl:preserve-space elements="tei:p tei:cit tei:lbl tei:quote"/>
</xsl:stylesheet>
