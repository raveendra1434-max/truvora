import OpenAI, { toFile } from "openai";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env"),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
async function executeAgentTask({
  type,
  summary,
  imageUrl,
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
  let image;

  if (imageUrl) {
    console.log("🖼️ IMAGE EDIT REQUEST");
    console.log("🖼️ SOURCE IMAGE:", imageUrl);

    const localImagePath = imageUrl.startsWith("http")
      ? new URL(imageUrl).pathname
      : imageUrl;

    const cleanPath = decodeURIComponent(localImagePath)
  .replace(/^\/+/, "")
  .replace(/\//g, path.sep);

    const possiblePaths = [
      path.join(__dirname, "..", cleanPath),
      path.resolve(cleanPath),
      imageUrl,
    ];

    const sourcePath = possiblePaths.find((p) =>
      fs.existsSync(p)
    );

    if (!sourcePath) {
      throw new Error(
        `Source image not found: ${imageUrl}`
      );
    }

    console.log("🖼️ LOCAL SOURCE PATH:", sourcePath);

    image = await openai.images.edit({
      model: "gpt-image-1",
      image: await toFile(
  fs.createReadStream(sourcePath),
  "image.png",
  { type: "image/png" }
),
      prompt: `
You are TRULEXITY AI Image Editor.

Edit the provided image according to the user's request.

User request:
${summary}

Requirements:
- Preserve the main subject unless the user asks to change it.
- Make only the requested modifications.
- Maintain realistic proportions and natural details.
- Preserve important facial/object/product details when possible.
- Use professional lighting and composition.
- Do not add text or watermarks unless requested.
`,
      size: "1024x1024",
    });
  } else {
    console.log("🖼️ IMAGE GENERATION REQUEST");

    image = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `
You are TRULEXITY AI Image Generator.

Create one high-quality image that exactly matches the user's request.

User request:
${summary}

Requirements:
- Ultra HD quality.
- Photorealistic when appropriate.
- Accurate colors and lighting.
- Professional composition.
- No text or watermark unless requested.
- Follow the user's style (realistic, anime, 3D, logo, poster, wallpaper, icon, etc.).
`,
      size: "1024x1024",
    });
  }

  const base64 = image.data?.[0]?.b64_json;

  if (!base64) {
    throw new Error(
      "Image operation returned no image data"
    );
  }

  const buffer = Buffer.from(base64, "base64");

  console.log(
    "🖼️ IMAGE OUTPUT PATH:",
    outputPath
  );

  console.log(
    "🖼️ IMAGE BUFFER SIZE:",
    buffer.length
  );

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