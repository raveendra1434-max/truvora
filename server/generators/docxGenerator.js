import fs from "fs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export async function generateDOCX({
  outputPath,
  reportId,
  title,
  summary,
  analysis,
  recommendations,
  sources
}) {

  const doc = new Document({
    sections: [
      {
        children: [

          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: "TRULEXITY GLOBAL AI",
                bold: true,
                size: 36
              })
            ]
          }),

          new Paragraph({
            children: [
              new TextRun(`Report ID: ${reportId}`)
            ]
          }),

          new Paragraph({
            children: [
              new TextRun(`Generated: ${new Date().toLocaleString()}`)
            ]
          }),

          new Paragraph({ text: "" }),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            text: title || "AI Report"
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            text: "Executive Summary"
          }),

          new Paragraph(summary || "No summary available."),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            text: "Detailed Analysis"
          }),

          new Paragraph(analysis || "No analysis available."),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            text: "Recommendations"
          }),

          new Paragraph(recommendations || "No recommendations available."),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            text: "Sources"
          }),

          new Paragraph(
            Array.isArray(sources)
              ? sources.join("\n")
              : (sources || "No external sources.")
          )

        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);

  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}