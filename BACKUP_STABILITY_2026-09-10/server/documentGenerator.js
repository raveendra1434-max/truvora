import { createMetadata } from "./utils/metadata.js";
import { formatReport } from "./utils/reportFormatter.js";

function prepareDocument(data, type) {

  const metadata = createMetadata(
    data.reportId,
    type.toUpperCase()
  );

  const report = formatReport({
    title: data.title,
    summary: data.summary,
    analysis: data.analysis,
    recommendations: data.recommendations,
    sources: data.sources || []
  });

  return {
  metadata,
  report,

  toc: [
    {
      no: 1,
      title: "Executive Summary",
      page: 3
    },
    {
      no: 2,
      title: "Detailed Analysis",
      page: 3
    },
    {
      no: 3,
      title: "Recommendations",
      page: 4
    },
    {
      no: 4,
      title: "Sources",
      page: 4
    }
  ]
};
}

export { prepareDocument };