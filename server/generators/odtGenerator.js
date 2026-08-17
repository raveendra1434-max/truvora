/**
 * ==========================================================
 * TRUVORA ODT REPORT GENERATOR
 * ==========================================================
 */

export async function generateODT({
  reportId = "",
  title = "",
  summary = "",
  analysis = "",
  recommendations = "",
  sources = [],
}) {
  const sourceText = (sources || []).join("\n");

  return `
TRUVORA AI Analysis Report

Report ID: ${reportId}

Title: ${title}

Generated At: ${new Date().toISOString()}

==================================================

SUMMARY

${summary}

==================================================

ANALYSIS

${analysis}

==================================================

RECOMMENDATIONS

${recommendations}

==================================================

SOURCES

${sourceText}

==================================================

Platform : Truvora
Version  : 1.0
Format   : ODT
`;
}