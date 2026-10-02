import { createObjectCsvWriter } from "csv-writer";

export async function generateCSV({
  outputPath,
  reportId,
  title,
  summary,
  analysis,
  recommendations,
  sources,
}) {
  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: "section", title: "Section" },
      { id: "content", title: "Content" },
    ],
  });

  await csvWriter.writeRecords([
    {
      section: "Report ID",
      content: reportId,
    },
    {
      section: "Title",
      content: title,
    },
    {
  section: "Summary",
  content: summary
    ?.replace(/\r\n/g, "\n")
    ?.replace(/\n/g, "\r\n"),
},
    {
      section: "Analysis",
      content: analysis,
    },
    {
      section: "Recommendations",
      content: recommendations,
    },
    {
      section: "Sources",
      content: Array.isArray(sources)
        ? sources.join(" | ")
        : sources,
    },
  ]);

  return outputPath;
}