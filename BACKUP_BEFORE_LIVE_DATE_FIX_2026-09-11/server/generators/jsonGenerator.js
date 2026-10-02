/**
 * ==========================================================
 * TRULEXITY JSON REPORT GENERATOR
 * ==========================================================
 */

export async function generateJSON({
  reportId = "",
  title = "",
  summary = "",
  analysis = "",
  recommendations = "",
  sources = [],
}) {
  return {
    success: true,

    report: {
      id: reportId,
      title,
      generatedAt: new Date().toISOString(),

      content: {
        summary,
        analysis,
        recommendations,
      },

      sources: Array.isArray(sources) ? sources : [],

      metadata: {
        platform: "Trulexity",
        version: "1.0",
        format: "json",
      },
    },
  };
}