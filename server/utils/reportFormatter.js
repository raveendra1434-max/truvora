function formatReport({
  title,
  summary,
  analysis,
  recommendations,
  sources = [],
}) {
  return {
    title: title || "AI Analysis Report",

    summary: {
      title: "Executive Summary",
      content: summary || "No summary available.",
    },

    analysis: {
      title: "Detailed Analysis",
      content: analysis || "No analysis available.",
    },

    recommendations: {
      title: "Recommendations",
      content:
        recommendations ||
        "Review this AI-generated report before making important decisions.",
    },

    sources: {
      title: "Sources",
      content:
        sources.length > 0
          ? sources.join("\n")
          : "No external sources.",
    },
  };
}

export { formatReport };