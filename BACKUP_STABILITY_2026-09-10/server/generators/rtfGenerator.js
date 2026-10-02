/**
 * ==========================================================
 * TRULEXITY RTF REPORT GENERATOR
 * ==========================================================
 */

export async function generateRTF({
  reportId = "",
  title = "",
  summary = "",
  analysis = "",
  recommendations = "",
  sources = [],
}) {
  const sourceText = (sources || []).join("\\line ");

  return `{\\rtf1\\ansi\\deff0

{\\b TRULEXITY AI Analysis Report}\\par
\\par

{\\b Report ID:} ${reportId}\\par
{\\b Title:} ${title}\\par
{\\b Generated At:} ${new Date().toISOString()}\\par

\\par
{\\b Summary}\\par
${summary}\\par

\\par
{\\b Analysis}\\par
${analysis}\\par

\\par
{\\b Recommendations}\\par
${recommendations}\\par

\\par
{\\b Sources}\\par
${sourceText}\\par

\\par
{\\b Platform:} Trulexity\\par
{\\b Version:} 1.0\\par
{\\b Format:} RTF\\par

}`;
}