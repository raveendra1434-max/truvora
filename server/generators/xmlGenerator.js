/**
 * ==========================================================
 * TRUVORA XML REPORT GENERATOR
 * ==========================================================
 */

export async function generateXML({
  reportId = "",
  title = "",
  summary = "",
  analysis = "",
  recommendations = "",
  sources = [],
}) {
  const sourceXML = (sources || [])
    .map((source) => `<source>${source}</source>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<truvoraReport>
  <reportId>${reportId}</reportId>
  <title>${title}</title>
  <generatedAt>${new Date().toISOString()}</generatedAt>

  <summary><![CDATA[
${summary}
  ]]></summary>

  <analysis><![CDATA[
${analysis}
  ]]></analysis>

  <recommendations><![CDATA[
${recommendations}
  ]]></recommendations>

  <sources>
${sourceXML}
  </sources>

  <metadata>
    <platform>Truvora</platform>
    <version>1.0</version>
    <format>xml</format>
  </metadata>
</truvoraReport>`;
}