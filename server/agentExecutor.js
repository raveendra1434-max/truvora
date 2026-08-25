import OpenAI from "openai";
import fs from "fs";
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
async function executeAgentTask({
  type,
  summary,
  recommendations = "",
  sources = [],
  reportId,
  outputPath,

  // Existing generators are passed in from server.js
  generatePDF,
  generateDOCX,
  generateXLSX,
  generatePPTX,
  generateCSV,
  generateMarkdown,
  generateTXT,
  generateJSON,
  generateXML,
  generateRTF,
  generateODT,
}) {
  const commonData = {
    outputPath,
    reportId,
    title: "AI Analysis Report",
    summary,
    analysis: summary,
    recommendations,
    sources,
  };

  switch (type) {
    case "pdf":
      await generatePDF(commonData);
      break;

    case "docx":
      await generateDOCX(commonData);
      break;

    case "xlsx":
      await generateXLSX(commonData);
      break;

    case "pptx":
      await generatePPTX(commonData);
      break;

    case "csv":
      await generateCSV(commonData);
      break;

    case "md":
      await generateMarkdown(commonData);
      break;

    case "txt":
      await generateTXT(commonData);
      break;

    case "json": {
      const data = await generateJSON({
        reportId,
        title: "AI Analysis Report",
        summary,
        analysis: summary,
        recommendations,
        sources,
      });

      // JSON generator returns data rather than writing the file
      const fs = await import("fs");

      fs.writeFileSync(
        outputPath,
        JSON.stringify(data, null, 2),
        "utf8"
      );

      break;
    }

    case "xml": {
      const data = await generateXML({
        reportId,
        title: "AI Analysis Report",
        summary,
        analysis: summary,
        recommendations,
        sources,
      });

      const fs = await import("fs");

      fs.writeFileSync(outputPath, data, "utf8");

      break;
    }

    case "rtf": {
      const data = await generateRTF({
        reportId,
        title: "AI Analysis Report",
        summary,
        analysis: summary,
        recommendations,
        sources,
      });

      const fs = await import("fs");

      fs.writeFileSync(outputPath, data, "utf8");

      break;
    }

case "image": {
  const image = await openai.images.generate({
    model: "gpt-image-1",
    prompt: summary,
    size: "1024x1024",
  });

  const base64 = image.data?.[0]?.b64_json;

  if (!base64) {
    throw new Error("Image generation returned no image data");
  }

  const buffer = Buffer.from(base64, "base64");

console.log("🖼️ IMAGE OUTPUT PATH:", outputPath);
console.log("🖼️ IMAGE BUFFER SIZE:", buffer.length);

fs.writeFileSync(outputPath, buffer);

  break;
}

    default:
      throw new Error(`Unsupported agent task: ${type}`);
  }

  return {
  success: true,
  type,
  document: `/uploads/${reportId}.${type === "image" ? "png" : type}`,
  image: type === "image"
    ? `/uploads/${reportId}.png`
    : null,
};
}

export { executeAgentTask };