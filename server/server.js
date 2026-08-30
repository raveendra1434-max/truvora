import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI, { toFile } from "openai";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import multer from "multer";
import fs from "fs";
import { detectAgentTasks } from "./agentMode.js";
import { executeAgentTask } from "./agentExecutor.js";
import path from "path";

let personalVoiceFile = null;

import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import XLSX from "xlsx";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "child_process";
import ffprobe from "@ffprobe-installer/ffprobe";
import { YoutubeTranscript } from "@danielxceron/youtube-transcript";
import { execFileSync } from "child_process";

import { generateDOCX } from "./generators/docxGenerator.js";
import { generatePDF } from "./generators/pdfGenerator.js";
import { generateXLSX } from "./generators/xlsxGenerator.js";
import { generatePPTX } from "./generators/pptxGenerator.js";
import { generateCSV } from "./generators/csvGenerator.js";
import { generateHTML } from "./generators/htmlGenerator.js";
import { generateMarkdown } from "./generators/markdownGenerator.js";
import { generateTXT } from "./generators/txtGenerator.js";
import { generateJSON } from "./generators/jsonGenerator.js";
import { generateXML } from "./generators/xmlGenerator.js";
import { generateRTF } from "./generators/rtfGenerator.js";
import { generateODT } from "./generators/odtGenerator.js";

import { analyzeQuestion } from "./questionAnalyzer.js";
import { generateSpeech } from "./services/tts.js";
import { formatCitations } from "./services/citationFormatter.js";

import {
  saveMemory,
  addConversation,
  saveProject,
  getMemory,
} from "./memory/memoryManager.js";

dotenv.config();

console.log(
  "SERPAPI KEY LOADED:",
  !!process.env.SERPAPI_KEY
);

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobe.path);

const app = express();

let documentContext = "";
let projectMemory = {};

app.use(cors());

app.use(
  express.json({
    limit: "500mb",
  })
);

app.use(
  express.urlencoded({
    limit: "500mb",
    extended: true,
  })
);

app.use(
  "/uploads",
  express.static("uploads")
);


// ============================================================
// UPLOADS FOLDER
// ============================================================

const uploadsPath = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}


// ============================================================
// MULTER STORAGE
// ============================================================

const storage =
  multer.diskStorage({

    destination: function (
      req,
      file,
      cb
    ) {
      cb(
        null,
        "uploads/"
      );
    },

    filename: function (
      req,
      file,
      cb
    ) {
      cb(
        null,
        Date.now() +
          "-" +
          file.originalname
      );
    },

  });


const upload = multer({
  storage,

  limits: {
    fileSize: Infinity,
  },

});


// ============================================================
// STATIC UPLOADS
// ============================================================

app.use(
  "/uploads",
  express.static(
    "uploads"
  )
);


// ============================================================
// OPENAI
// ============================================================

const openai =
  new OpenAI({
    apiKey:
      process.env.OPENAI_API_KEY,
  });


// ============================================================
// GEMINI
// ============================================================

const gemini =
  new GoogleGenAI({
    apiKey:
      process.env.GEMINI_API_KEY,
  });


async function askGemini(prompt) {

  const interaction =
    await gemini.interactions.create({

      model:
        "gemini-3.6-flash",

      input:
        prompt,

    });

  return interaction.output_text;
}


// ============================================================
// TRUVORA UNIVERSAL DETAILED ANALYSIS STANDARD
// ============================================================

function truvoraDetailedAnalysisPrompt(
  type,
  language = "English"
) {

  return `
You are Truvora Global AI's advanced
${type} analysis engine.

Analyze the supplied ${type}
carefully, professionally and completely.

==================================================
CORE ACCURACY RULES
==================================================

1. Do not invent facts.

2. Do not invent names.

3. Do not invent numbers.

4. Do not invent dates.

5. Do not invent objects.

6. Do not invent events.

7. Do not invent claims.

8. Use only information supported
   by the supplied content.

9. Clearly distinguish:
   - direct observations
   - extracted information
   - reasonable conclusions

10. If something cannot be determined,
    explicitly say:

    "This cannot be determined
     from the supplied content."

11. Preserve important:
    - names
    - dates
    - numbers
    - measurements
    - technical terms
    - URLs
    - visible text

12. Detect the source language
    whenever possible.

13. Respond in the requested language
    whenever possible.

14. Never give a shallow generic answer
    when enough source material exists.

15. Use clear Markdown headings.

16. Use bullet points when useful.

17. Use tables when they improve clarity.

18. Do not identify real people by name
    from an image.

==================================================
ANALYSIS STRUCTURE
==================================================

# 🔎 Overview

Clearly explain what the ${type}
contains and its overall purpose,
subject or meaning.

# 📋 Detailed Analysis

Analyze the supplied content
thoroughly and logically.

Explain important details instead
of giving only a short summary.

# 📌 Key Findings

List the most important findings
supported by the source.

# 🔍 Important Details

Include important:

- names
- dates
- numbers
- facts
- objects
- events
- visible text
- technical details
- measurements
- claims

when available.

# 📊 Evidence / Data

Present useful factual,
measurable or extracted information.

If no useful data exists,
clearly say so.

# ⚠️ Issues / Risks / Limitations

Identify:

- uncertainty
- missing information
- contradictions
- unsupported claims
- unclear sections
- technical limitations

ONLY when supported by
the supplied content.

Do not invent problems.

# 💡 Insights

Explain useful patterns,
relationships or conclusions
that can reasonably be derived.

# 🎯 Recommendations

Give practical recommendations
when appropriate.

Recommendations must be based
on the supplied content.

# 🌍 Language

Detected/source language:
identify it when possible.

Requested response language:
${language}

# ✅ Final Conclusion

Give a clear final conclusion
based only on the supplied content.

==================================================
QUALITY REQUIREMENT
==================================================

The final answer must be:

- clear
- detailed
- accurate
- structured
- useful
- easy to understand

Do not respond with a generic sentence
such as "Here is the analysis."

Actually perform the analysis.
`;
}


// ============================================================
// TRUVORA AI COST-SAVING ROUTER
// ============================================================

async function askTruvoraAgent(
  prompt,
  task
) {

  if (task === "image") {
    return `Create a high-quality photorealistic image based on this request: ${prompt}`;
  }

  const text =
    String(
      prompt || ""
    ).toLowerCase();


  const complexKeywords = [

    "debug",
    "debugging",
    "fix this code",
    "production code",
    "architecture",
    "system design",
    "complex reasoning",
    "analyze deeply",
    "advanced coding",
    "security vulnerability",
    "algorithm"

  ];


  const isComplex =
    complexKeywords.some(
      keyword =>
        text.includes(keyword)
    );


  // ==========================================================
  // OPENAI FOR COMPLEX TASKS
  // ==========================================================

  if (isComplex) {

    console.log(
      "🔵 AI ROUTER: OPENAI"
    );


    const response =
      await openai.chat.completions.create({

        model:
          "gpt-4.1-mini",

        messages: [

          {
            role:
              "system",

            content: `
You are Truvora's advanced
document-generation agent.

The user wants a ${task} file.

Generate useful and accurate content.

Do not simply repeat
the user's request.

Include:

- Clear title
- Executive summary
- Detailed content
- Key points where appropriate
- Recommendations where appropriate

Return only the document content.
`
          },

          {
            role:
              "user",

            content:
              prompt
          }

        ]

      });


    return (
      response
        .choices?.[0]
        ?.message
        ?.content
        ?.trim()
      ||
      prompt
    );
  }


  // ==========================================================
  // GEMINI FOR NORMAL / LOWER-COST TASKS
  // ==========================================================

  try {

    console.log(
      "🟢 AI ROUTER: GEMINI"
    );


    const geminiPrompt = `
You are Truvora's document-generation agent.

The user wants a ${task} file.

Generate the actual useful content
that should go inside the file.

Do NOT simply repeat the user's request.

Create:

- Clear title
- Executive summary
- Detailed content
- Key points where appropriate
- Recommendations where appropriate

If specific data is requested,
generate realistic sample data.

Return only the content
for the document.

USER REQUEST:

${prompt}
`;


    const result =
      await askGemini(
        geminiPrompt
      );


    if (
      result &&
      result.trim()
    ) {

      return result.trim();

    }


    throw new Error(
      "Gemini returned an empty response"
    );


  } catch (error) {

    console.error(
      "⚠️ GEMINI FAILED:",
      error.message
    );


    console.log(
      "🔵 AI ROUTER: OPENAI FALLBACK"
    );


    const response =
      await openai.chat.completions.create({

        model:
          "gpt-4.1-mini",

        messages: [

          {
            role:
              "system",

            content: `
You are Truvora's
document-generation agent.

Generate useful content
for a ${task} file.

Return only the
document content.
`
          },

          {
            role:
              "user",

            content:
              prompt
          }

        ]

      });


    return (
      response
        .choices?.[0]
        ?.message
        ?.content
        ?.trim()
      ||
      prompt
    );

  }

}

// ============================================================
// MAIN TRUVORA CHAT
// ============================================================

app.post("/ask", async (req, res) => {
  try {
    const {
  message = "",
  history = [],
  webEnabled = false,
  agentMode = false,
  language = "English"
} = req.body;

    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }
// ============================================================
// TRUVORA AGENT MODE
// ============================================================

const agentTasks = detectAgentTasks(message);

console.log("🤖 AGENT TASKS:", agentTasks);

if (agentMode && agentTasks.length > 0) {

  console.log("🤖 TRUVORA AGENT MODE ACTIVATED");

  const agentResults = [];

  for (const task of agentTasks) {

    try {

      const reportId = Date.now().toString();

      const extension =
        task === "image"
          ? "png"
          : task;

      const outputPath = path.join(
        uploadsPath,
        `${reportId}.${extension}`
      );

      console.log(
        "🤖 EXECUTING AGENT TASK:",
        task
      );

      const generatedContent =
        task === "image"
          ? `Create a high-quality photorealistic image based on this request: ${message}`
          : await askTruvoraAgent(
              message,
              task
            );

      const result =
        await executeAgentTask({
          type: task,
          summary: generatedContent,
          recommendations: "",
          sources: [],
          reportId,
          outputPath,

          generatePDF,
          generateDOCX,
          generateXLSX,
          generatePPTX,
          generateCSV,
          generateHTML,
          generateMarkdown,
          generateTXT,
          generateJSON,
          generateXML,
          generateRTF,
          generateODT
        });

      agentResults.push({
        ...result,
        summary: generatedContent
      });

      console.log(
        "✅ AGENT CREATED:",
        result
      );

    } catch (error) {

      console.error(
        "❌ AGENT TASK FAILED:",
        task,
        error
      );

      agentResults.push({
        success: false,
        type: task,
        error:
          error.message ||
          "Agent task failed"
      });
    }
  }

  return res.json({
    success: true,
    agentMode: true,
    agentTasks,
    agentResults,
    answer: agentResults
      .map(result =>
        result.success
          ? `✅ ${result.type.toUpperCase()} created successfully.`
          : `❌ ${result.type.toUpperCase()} failed: ${result.error}`
      )
      .join("\n"),
    language
  });
}
    console.log("💬 TRUVORA CHAT:", message);
    console.log("🌐 WEB ENABLED:", webEnabled);
    console.log("🗣️ LANGUAGE:", language);

    const messages = [
      {
        role: "system",
        content: `
You are Truvora Global AI.

Give clear, accurate, useful and detailed answers.

Always answer in the user's requested language.

When explaining something:
- Start with a direct answer.
- Then explain clearly.
- Use headings when useful.
- Use bullet points for multiple items.
- Give examples when helpful.
- Do not give a vague two-line answer when the user asks for explanation.
- Never invent facts.
- If information is uncertain, say so clearly.

If web information is provided, use it carefully and cite the relevant sources.

User language:
${language}
`
      }
    ];

    // Preserve recent conversation
    if (Array.isArray(history)) {
      history
        .slice(-10)
        .forEach(item => {
          if (
            item &&
            (item.role === "user" ||
              item.role === "assistant") &&
            typeof item.content === "string" &&
            item.content.trim()
          ) {
            messages.push({
              role: item.role,
              content: item.content
            });
          }
        });
    }

    messages.push({
      role: "user",
      content: message
    });

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1",
        messages,
        temperature: 0.3
      });

    const answer =
      completion.choices?.[0]?.message?.content ||
      "I couldn't generate an answer.";

    return res.json({
      success: true,
      answer,
      response: answer,
      message: answer,
      language
    });

  } catch (error) {
    console.error(
      "❌ /ask ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Truvora could not process your request."
    });
  }
});
// ============================================================
// IMAGE UPLOAD
// ============================================================

app.post(
  "/upload-image",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image uploaded",
        });
      }

      const imageUrl =
        `http://localhost:5000/uploads/${req.file.filename}`;

      res.json({
        success: true,
        imageUrl,
      });

    } catch (error) {
      console.error("IMAGE UPLOAD ERROR:", error);

      res.status(500).json({
        success: false,
        error: "Image upload failed",
      });
    }
  }
);


// ============================================================
// IMAGE / CAMERA ANALYSIS
// ============================================================

app.post(
  "/analyze-image",
  async (req, res) => {

    try {

      const {
        image,
        language = "English"
      } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          error: "No image received",
        });
      }

      console.log(
        "📷 IMAGE ANALYSIS REQUEST"
      );


      // ======================================================
      // STEP 1 — IMAGE CLASSIFICATION
      // ======================================================

      const visionResponse =
        await openai.chat.completions.create({

          model: "gpt-4.1",

          response_format: {
            type: "json_object",
          },

          messages: [

            {
              role: "system",

              content: `
You are Truvora AI's visual analysis engine.

Inspect the supplied image carefully.

Classify it into exactly one category:

PRODUCT
QUESTION
GENERAL_IMAGE

Rules:

- Never invent information.
- Never invent a brand.
- Never invent a model.
- Never invent visible text.
- Never identify a real person by name.
- If something is unclear, mark it uncertain.
- Visible text has high priority.
- Mathematical or technical questions must be solved carefully.

Return ONLY valid JSON:

{
  "category": "PRODUCT | QUESTION | GENERAL_IMAGE",
  "brand": "",
  "productType": "",
  "model": "",
  "visibleText": "",
  "identification": "",
  "productName": "",
  "questionText": "",
  "answer": "",
  "confidence": "HIGH | MEDIUM | LOW"
}
`
            },

            {
              role: "user",

              content: [

                {
                  type: "text",

                  text:
                    "Analyze and classify this image."
                },

                {
                  type: "image_url",

                  image_url: {
                    url: image
                  }
                }

              ]
            }

          ]

        });


      const rawVision =
        visionResponse
          .choices?.[0]
          ?.message
          ?.content || "{}";


      let vision;

      try {

        vision =
          JSON.parse(rawVision);

      } catch (error) {

        console.error(
          "IMAGE JSON PARSE ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          error:
            "Unable to understand image analysis result.",
        });

      }


      // ======================================================
      // QUESTION IMAGE
      // ======================================================

      if (
        vision.category ===
        "QUESTION"
      ) {

        const answer = `
# ❓ Question

${vision.questionText || "Question detected in image."}

# 📋 Detailed Answer

${vision.answer || "I could not determine the answer reliably."}

# 🎯 Confidence

${vision.confidence || "MEDIUM"}
        `.trim();


        return res.json({

          success: true,

          type: "question",

          question:
            vision.questionText || "",

          answer,

        });

      }


      // ======================================================
      // PRODUCT IMAGE
      // ======================================================

      if (
        vision.category ===
        "PRODUCT"
      ) {

        let shoppingResults = [];

        try {

          if (
            process.env.SERPAPI_KEY
          ) {

            const brand =
              String(
                vision.brand || ""
              ).trim();

            const productType =
              String(
                vision.productType || ""
              ).trim();

            const productName =
              String(
                vision.productName || ""
              ).trim();


            const searchQuery =
              [
                brand,
                productType
              ]
                .filter(Boolean)
                .join(" ");


            const shoppingResponse =
              await axios.get(
                "https://serpapi.com/search.json",
                {
                  params: {

                    engine:
                      "google_shopping",

                    q:
                      searchQuery ||
                      productName ||
                      vision.identification,

                    location:
                      "India",

                    gl:
                      "in",

                    hl:
                      "en",

                    api_key:
                      process.env.SERPAPI_KEY,

                  }
                }
              );


            shoppingResults =
              (
                shoppingResponse
                  .data
                  ?.shopping_results ||
                []
              )
                .map(item => ({

                  title:
                    String(
                      item.title || ""
                    ),

                  price:
                    item.price || "",

                  source:
                    String(
                      item.source || ""
                    ),

                  link:
                    item.product_link ||
                    item.link ||
                    "",

                  thumbnail:
                    item.thumbnail ||
                    "",

                }))
                .slice(0, 5);

          }

        } catch (error) {

          console.error(
            "PRODUCT PRICE SEARCH ERROR:",
            error.message
          );

        }


        let priceText =
          "Current price could not be verified.";


        if (
          shoppingResults.length
        ) {

          const prices =
            shoppingResults
              .filter(
                item => item.price
              )
              .map(
                item => item.price
              );


          if (
            prices.length
          ) {

            priceText =
              `Live prices found: ${prices.join(
                " • "
              )}`;

          }

        }


        const answer = `
# 📦 Product Identification

**Product:** ${
  vision.productName ||
  vision.identification ||
  "Unknown product"
}

**Brand:** ${
  vision.brand ||
  "Unknown"
}

**Product Type:** ${
  vision.productType ||
  "Unknown"
}

**Model:** ${
  vision.model ||
  "Unknown"
}

# 🔍 Identification

${
  vision.identification ||
  "The exact product could not be determined."
}

# 📝 Visible Text

${
  vision.visibleText ||
  "No clearly readable text detected."
}

# 💰 Current Price

${priceText}

# 🎯 Confidence

${
  vision.confidence ||
  "MEDIUM"
}

# ⚠️ Price Note

Prices can change. Verify the current seller price before purchasing.
        `.trim();


        return res.json({

          success: true,

          type: "product",

          product: {

            name:
              vision.productName ||
              vision.identification ||
              "Unknown product",

            identification:
              vision.identification ||
              "",

            confidence:
              vision.confidence ||
              "MEDIUM",

          },

          price:
            priceText,

          shoppingResults,

          answer,

        });

      }


      // ======================================================
      // GENERAL IMAGE — DETAILED ANALYSIS
      // ======================================================

      const detailedPrompt =
        truvoraDetailedAnalysisPrompt(
          "image",
          language
        );


      const generalResponse =
        await openai.chat.completions.create({

          model: "gpt-4.1",

          messages: [

            {
              role: "system",

              content:
                detailedPrompt + `

For this image specifically, also include:

# 👁️ What I See

Describe the complete visible scene.

# 👤 People

Describe visible people only by observable characteristics.
Do not identify anyone by name.

# 📦 Objects

Identify important visible objects.

# 📝 Visible Text

Read clearly visible text when possible.

# 🏠 Environment

Describe the surroundings and setting.

# 🎨 Visual Characteristics

Describe relevant colors, lighting, clothing, materials,
positions and other useful visual details.

# 🔍 Important Observations

List details that a normal quick description might miss.

# ❓ Uncertainty

Clearly explain anything that cannot be determined.
`
            },

            {
              role: "user",

              content: [

                {
                  type: "text",

                  text:
                    "Perform a detailed analysis of this image."
                },

                {
                  type: "image_url",

                  image_url: {
                    url: image
                  }
                }

              ]
            }

          ]

        });


      const generalAnswer =
        generalResponse
          .choices?.[0]
          ?.message
          ?.content ||
        "Unable to analyze this image.";


      return res.json({

        success: true,

        type: "general",

        answer:
          generalAnswer,

      });


    } catch (error) {

      console.error(
        "❌ IMAGE ANALYSIS ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        error:
          error.message ||
          "Image analysis failed",

      });

    }

  }
);


// ============================================================
// MEDIA HELPERS
// ============================================================

async function extractFrame(
  videoPath,
  outputImage
) {

  return new Promise(
    (resolve, reject) => {

      ffmpeg(videoPath)

        .screenshots({

          timestamps: ["2"],

          filename:
            outputImage,

          folder:
            "uploads",

          size:
            "1280x?"

        })

        .on(
          "end",
          () => {

            console.log(
              "✅ Frame extraction completed:",
              `uploads/${outputImage}`
            );

            resolve();

          }
        )

        .on(
          "error",
          error => {

            console.error(
              "❌ Frame extraction failed:",
              error
            );

            reject(error);

          }
        );

    }
  );

}


async function getMediaDuration(
  filePath
) {

  return new Promise(
    (resolve, reject) => {

      ffmpeg.ffprobe(
        filePath,
        (error, metadata) => {

          if (error) {

            reject(error);

            return;

          }

          resolve(
            metadata
              ?.format
              ?.duration || 0
          );

        }
      );

    }
  );

}


async function splitAudioIntoChunks(
  inputFile
) {

  return new Promise(
    (resolve, reject) => {

      const outputPattern =
        "uploads/chunk-%03d.mp3";


      ffmpeg(inputFile)

        .outputOptions([

          "-f segment",

          "-segment_time 600",

          "-c:a libmp3lame",

          "-b:a 192k"

        ])

        .output(
          outputPattern
        )

        .on(
          "end",
          () => {

            const chunks =
              fs
                .readdirSync(
                  "uploads"
                )
                .filter(
                  file =>
                    file.startsWith(
                      "chunk-"
                    )
                )
                .map(
                  file =>
                    `uploads/${file}`
                );


            resolve(chunks);

          }
        )

        .on(
          "error",
          reject
        )

        .run();

    }
  );

}
// ============================================================
// YOUTUBE ANALYSIS
// ============================================================

app.post(
  "/analyze-youtube",
  async (req, res) => {

    try {

      const {
        url,
        language = "English"
      } = req.body;


      console.log(
        "🔥 YOUTUBE ANALYSIS REQUEST:",
        url
      );


      if (!url) {

        return res.status(400).json({
          success: false,
          error:
            "YouTube URL is required",
        });

      }


      // ======================================================
      // EXTRACT VIDEO ID
      // ======================================================

      const videoId =
        url.match(
          /(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/
        )?.[1];


      if (!videoId) {

        return res.status(400).json({
          success: false,
          error:
            "Invalid YouTube URL",
        });

      }


      console.log(
        "🎬 YOUTUBE VIDEO ID:",
        videoId
      );


      // ======================================================
      // GET TRANSCRIPT
      // ======================================================

      let transcript = "";


      try {

        const transcriptData =
          await YoutubeTranscript.fetchTranscript(
            videoId
          );


        if (
          Array.isArray(
            transcriptData
          )
        ) {

          transcript =
            transcriptData
              .map(
                item =>
                  item.text || ""
              )
              .join(" ");

        }

      } catch (transcriptError) {

        console.log(
          "⚠️ YouTube transcript unavailable:",
          transcriptError.message
        );

      }


      // ======================================================
      // FALLBACK — yt-dlp SUBTITLES
      // ======================================================

      if (
        !transcript.trim()
      ) {

        try {

          const subtitleFile =
            `youtube-${videoId}.en.vtt`;


          const outputTemplate =
            `youtube-${videoId}.%(ext)s`;


          execFileSync(
            "yt-dlp",
            [

              "--skip-download",

              "--write-auto-subs",

              "--sub-langs",
              "en",

              "--sub-format",
              "vtt",

              "--no-playlist",

              "-o",
              outputTemplate,

              `https://www.youtube.com/watch?v=${videoId}`

            ],

            {
              stdio:
                "ignore"
            }

          );


          if (
            fs.existsSync(
              subtitleFile
            )
          ) {

            const vtt =
              fs.readFileSync(
                subtitleFile,
                "utf8"
              );


            transcript =
              vtt

                .split("\n")

                .filter(
                  line =>
                    line.trim() &&
                    !line.includes(
                      "-->"
                    ) &&
                    !line.startsWith(
                      "WEBVTT"
                    ) &&
                    !/^\d+$/.test(
                      line.trim()
                    )
                )

                .join(" ");

          }

        } catch (ytError) {

          console.log(
            "⚠️ yt-dlp subtitle fallback failed:",
            ytError.message
          );

        }

      }


      if (
        !transcript.trim()
      ) {

        return res.status(422).json({

          success: false,

          error:
            "No transcript or captions could be obtained from this YouTube video.",

          videoId,

        });

      }


      console.log(
        "📝 TRANSCRIPT LENGTH:",
        transcript.length
      );


      // ======================================================
      // LIMIT EXTREMELY LARGE TRANSCRIPTS
      // ======================================================

      const safeTranscript =
        transcript.substring(
          0,
          120000
        );


      // ======================================================
      // DETAILED YOUTUBE ANALYSIS
      // ======================================================

      const analysisPrompt =
        truvoraDetailedAnalysisPrompt(
          "YouTube video transcript",
          language
        );


      const response =
        await openai.chat.completions.create({

          model:
            "gpt-4.1",

          messages: [

            {
              role:
                "system",

              content:
                analysisPrompt + `

You are analyzing a YouTube video
using its transcript.

In addition to the standard structure,
include:

# 🎬 Video Summary

Explain what the video is mainly about.

# 🧭 Main Topics

List the major topics discussed.

# 📝 Detailed Explanation

Explain the important content in logical order.

# 💡 Key Ideas

Extract the most important ideas.

# 📊 Facts, Numbers & Claims

Extract important factual claims,
numbers, dates and statistics.

Do not assume claims are true simply
because they appear in the transcript.

# 🗣️ Important Statements

Identify important statements or
arguments made in the video.

# ⚖️ Balanced Assessment

Separate:

- what the speaker claims
- what is directly stated
- what cannot be verified from the transcript

# 🎯 Practical Takeaways

Explain what a viewer can learn
or practically take away.

# ⚠️ Limitations

Mention that transcript-based analysis
may miss visual information, tone,
on-screen graphics or context.
`
            },

            {
              role:
                "user",

              content: `
Analyze this YouTube transcript
in detail.

VIDEO URL:
${url}

VIDEO ID:
${videoId}

TRANSCRIPT:
${safeTranscript}
`
            }

          ]

        });


      const answer =
        response
          .choices?.[0]
          ?.message
          ?.content ||
        "Unable to analyze this YouTube video.";


      return res.json({

        success:
          true,

        type:
          "youtube",

        videoId,

        url,

        transcriptLength:
          transcript.length,

        answer,

      });


    } catch (error) {

      console.error(
        "❌ YOUTUBE ANALYSIS ERROR:",
        error
      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message ||
          "YouTube analysis failed",

      });

    }

  }
);


// ============================================================
// AUDIO UPLOAD
// ============================================================

app.post(
  "/upload-audio",
  upload.single("audio"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({

          success:
            false,

          error:
            "No audio file uploaded",

        });

      }


      const audioPath =
        req.file.path;


      console.log(
        "🎙️ AUDIO RECEIVED:",
        audioPath
      );


      // ======================================================
      // GET AUDIO DURATION
      // ======================================================

      let duration = 0;


      try {

        duration =
          await getMediaDuration(
            audioPath
          );

      } catch (error) {

        console.log(
          "⚠️ Could not determine audio duration:",
          error.message
        );

      }


      console.log(
        "🎵 AUDIO DURATION:",
        duration,
        "seconds"
      );


      // ======================================================
      // TRANSCRIBE AUDIO
      // ======================================================

      let transcript = "";


      // For normal-size files,
      // transcribe directly.

      const fileStats =
        fs.statSync(
          audioPath
        );


      const MAX_DIRECT_SIZE =
        24 * 1024 * 1024;


      if (
        fileStats.size <=
        MAX_DIRECT_SIZE
      ) {

        try {

          const audioFile =
            await toFile(
              fs.createReadStream(
                audioPath
              ),
              req.file.originalname
            );


          const transcription =
            await openai.audio.transcriptions.create({

              file:
                audioFile,

              model:
                "whisper-1",

            });


          transcript =
            transcription.text ||
            "";

        } catch (error) {

          console.error(
            "❌ DIRECT AUDIO TRANSCRIPTION ERROR:",
            error
          );

        }

      }


      // ======================================================
      // LARGE AUDIO — CHUNKING
      // ======================================================

      if (
        !transcript.trim()
      ) {

        console.log(
          "✂️ USING AUDIO CHUNKING"
        );


        const chunks =
          await splitAudioIntoChunks(
            audioPath
          );


        console.log(
          "🎵 AUDIO CHUNKS:",
          chunks.length
        );


        const transcripts = [];


        for (
          let i = 0;
          i < chunks.length;
          i++
        ) {

          const chunk =
            chunks[i];


          console.log(
            `🎤 Transcribing chunk ${i + 1}/${chunks.length}`
          );


          try {

            const chunkFile =
              await toFile(
                fs.createReadStream(
                  chunk
                ),
                path.basename(
                  chunk
                )
              );


            const result =
              await openai.audio.transcriptions.create({

                file:
                  chunkFile,

                model:
                  "whisper-1",

              });


            if (
              result.text
            ) {

              transcripts.push(
                result.text
              );

            }

          } catch (chunkError) {

            console.error(
              `❌ Chunk ${i + 1} failed:`,
              chunkError.message
            );

          }

        }


        transcript =
          transcripts.join(
            "\n\n"
          );


        // Clean generated chunks.

        for (
          const chunk of chunks
        ) {

          try {

            if (
              fs.existsSync(
                chunk
              )
            ) {

              fs.unlinkSync(
                chunk
              );

            }

          } catch {}

        }

      }


      if (
        !transcript.trim()
      ) {

        return res.status(422).json({

          success:
            false,

          error:
            "The audio could not be transcribed.",

        });

      }


      console.log(
        "📝 AUDIO TRANSCRIPT LENGTH:",
        transcript.length
      );


      // ======================================================
      // DETAILED AUDIO ANALYSIS
      // ======================================================

      const safeTranscript =
        transcript.substring(
          0,
          120000
        );


      const analysisPrompt =
        truvoraDetailedAnalysisPrompt(
          "audio transcript",
          req.body.language ||
            "English"
        );


      const analysis =
        await openai.chat.completions.create({

          model:
            "gpt-4.1",

          messages: [

            {
              role:
                "system",

              content:
                analysisPrompt + `

For audio analysis, additionally provide:

# 🎙️ Audio Overview

Explain what the audio is about.

# 📝 Full Content Summary

Give a detailed summary of the spoken content.

# 🧭 Main Topics

List all major topics.

# 👥 Speakers / Participants

Only describe speakers when the transcript
provides enough evidence.

Do not invent identities.

# 💡 Key Ideas

Extract important ideas.

# 📊 Facts & Data

Extract dates, numbers, statistics,
names and factual claims.

# 🗣️ Important Statements

Highlight important statements.

# 🎯 Actionable Takeaways

Explain useful practical takeaways.

# ⚠️ Unclear / Missing Information

Identify sections that are unclear,
incomplete or impossible to determine
from the transcript.

# ✅ Final Conclusion

Give the overall meaning of the audio.
`
            },

            {
              role:
                "user",

              content: `
Analyze the following audio transcript
in detail.

AUDIO FILE:
${req.file.originalname}

DURATION:
${duration} seconds

TRANSCRIPT:
${safeTranscript}
`
            }

          ]

        });


      const answer =
        analysis
          .choices?.[0]
          ?.message
          ?.content ||
        "Unable to analyze the audio.";


      return res.json({

        success:
          true,

        type:
          "audio",

        filename:
          req.file.originalname,

        duration,

        transcript,

        analysis:
          answer,

        answer,

      });


    } catch (error) {

      console.error(
        "❌ AUDIO ANALYSIS ERROR:",
        error
      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message ||
          "Audio analysis failed",

      });

    }

  }
);
// ============================================================
// VIDEO UPLOAD + DETAILED ANALYSIS
// ============================================================

app.post(
  "/upload-video",
  upload.single("video"),
  async (req, res) => {

    try {

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No video file uploaded",
        });
      }

      const videoPath = req.file.path;

      console.log(
        "🎥 VIDEO RECEIVED:",
        videoPath
      );


      // ======================================================
      // 1. VIDEO DURATION
      // ======================================================

      let duration = 0;

      try {
        duration =
          await getMediaDuration(
            videoPath
          );
      } catch (error) {
        console.log(
          "⚠️ Video duration unavailable:",
          error.message
        );
      }


      console.log(
        "🎬 VIDEO DURATION:",
        duration,
        "seconds"
      );


      // ======================================================
      // 2. EXTRACT REPRESENTATIVE FRAME
      // ======================================================

      const frameName =
        `video-frame-${Date.now()}.png`;

      await extractFrame(
        videoPath,
        frameName
      );

      const framePath =
        path.join(
          "uploads",
          frameName
        );


      const frameBase64 =
        fs.readFileSync(
          framePath
        ).toString(
          "base64"
        );


      const frameDataUrl =
        `data:image/png;base64,${frameBase64}`;


      // ======================================================
      // 3. EXTRACT AUDIO
      // ======================================================

      const audioName =
        `video-audio-${Date.now()}.mp3`;

      const audioPath =
        path.join(
          "uploads",
          audioName
        );


      await new Promise(
        (resolve, reject) => {

          ffmpeg(videoPath)

            .noVideo()

            .audioCodec(
              "libmp3lame"
            )

            .audioBitrate(
              "192k"
            )

            .output(
              audioPath
            )

            .on(
              "end",
              resolve
            )

            .on(
              "error",
              reject
            )

            .run();

        }
      );


      // ======================================================
      // 4. TRANSCRIBE VIDEO AUDIO
      // ======================================================

      let transcript = "";


      try {

        const stats =
          fs.statSync(
            audioPath
          );


        const MAX_DIRECT_SIZE =
          24 * 1024 * 1024;


        if (
          stats.size <=
          MAX_DIRECT_SIZE
        ) {

          const audioFile =
            await toFile(
              fs.createReadStream(
                audioPath
              ),
              audioName
            );


          const result =
            await openai.audio.transcriptions.create({

              file:
                audioFile,

              model:
                "whisper-1",

            });


          transcript =
            result.text || "";

        }

      } catch (error) {

        console.error(
          "❌ VIDEO AUDIO TRANSCRIPTION ERROR:",
          error.message
        );

      }


      // ======================================================
      // 5. LARGE VIDEO AUDIO FALLBACK
      // ======================================================

      if (
        !transcript.trim()
      ) {

        try {

          const chunks =
            await splitAudioIntoChunks(
              audioPath
            );


          const results = [];


          for (
            const chunk of chunks
          ) {

            try {

              const chunkFile =
                await toFile(
                  fs.createReadStream(
                    chunk
                  ),
                  path.basename(
                    chunk
                  )
                );


              const result =
                await openai.audio.transcriptions.create({

                  file:
                    chunkFile,

                  model:
                    "whisper-1",

                });


              if (
                result.text
              ) {

                results.push(
                  result.text
                );

              }

            } catch (error) {

              console.error(
                "VIDEO CHUNK ERROR:",
                error.message
              );

            }

          }


          transcript =
            results.join(
              "\n\n"
            );


          for (
            const chunk of chunks
          ) {

            try {

              if (
                fs.existsSync(
                  chunk
                )
              ) {

                fs.unlinkSync(
                  chunk
                );

              }

            } catch {}

          }

        } catch (error) {

          console.error(
            "VIDEO CHUNKING ERROR:",
            error.message
          );

        }

      }


      // ======================================================
      // 6. DETAILED VIDEO + VISUAL ANALYSIS
      // ======================================================

      const analysisPrompt =
        truvoraDetailedAnalysisPrompt(
          "video",
          req.body.language ||
            "English"
        );


      const analysis =
        await openai.chat.completions.create({

          model:
            "gpt-4.1",

          messages: [

            {
              role:
                "system",

              content:
                analysisPrompt + `

For this video, provide:

# 🎥 Video Overview

Explain what the video appears to show.

# 👁️ Visual Analysis

Analyze the supplied video frame.

Describe:

- people
- objects
- environment
- actions
- visible text
- important visual details

Do not identify real people by name.

# 🎤 Audio / Transcript Analysis

Analyze the available spoken content.

# 🎬 Important Events

Describe important events or actions.

# 🧭 Sequence / Timeline

Explain the apparent order of important events
when this can reasonably be determined.

# 🔗 Audio + Visual Relationship

Explain how the spoken content relates to
what is visible.

# 📌 Key Moments

List the most important moments.

# 😊 Tone / Sentiment

Describe overall tone or sentiment only
when reasonably supported.

# 🎯 Action Items

List actions, instructions or next steps
mentioned in the video.

# ⚠️ Limitations

Clearly identify information that cannot
be determined from one extracted frame,
the transcript or the available media.
`
            },

            {
              role:
                "user",

              content: [

                {
                  type:
                    "text",

                  text: `
Analyze this video in detail.

VIDEO FILE:
${req.file.originalname}

DURATION:
${duration} seconds

TRANSCRIPT:
${transcript || "No transcript available."}
`
                },

                {
                  type:
                    "image_url",

                  image_url: {
                    url:
                      frameDataUrl
                  }

                }

              ]

            }

          ]

        });


      const answer =
        analysis
          .choices?.[0]
          ?.message
          ?.content ||
        "Unable to analyze this video.";


      const frameUrl =
        `http://localhost:5000/uploads/${frameName}`;


      // ======================================================
      // CLEAN AUDIO
      // ======================================================

      try {

        if (
          fs.existsSync(
            audioPath
          )
        ) {

          fs.unlinkSync(
            audioPath
          );

        }

      } catch {}


      return res.json({

        success:
          true,

        type:
          "video",

        filename:
          req.file.originalname,

        duration,

        transcript,

        frameUrl,

        analysis:
          answer,

        answer,

      });


    } catch (error) {

      console.error(
        "❌ VIDEO ANALYSIS ERROR:",
        error
      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message ||
          "Video analysis failed",

      });

    }

  }
);


// ============================================================
// DOCUMENT ANALYSIS
// ============================================================

app.post(
  "/analyze-document",
  upload.single("file"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({

          success:
            false,

          error:
            "No document uploaded",

        });

      }


      const filePath =
        req.file.path;

      const originalName =
        req.file.originalname;

      const extension =
        path
          .extname(
            originalName
          )
          .toLowerCase();


      console.log(
        "📄 DOCUMENT RECEIVED:",
        originalName
      );


      let extractedText = "";

      let structuredData = null;


      // ======================================================
      // PDF
      // ======================================================

      if (
        extension === ".pdf"
      ) {

        const buffer =
          fs.readFileSync(
            filePath
          );


        const parsed =
          await pdfParse(
            buffer
          );


        extractedText =
          parsed.text || "";

      }


      // ======================================================
      // DOCX
      // ======================================================

      else if (
        extension === ".docx"
      ) {

        const result =
          await mammoth.extractRawText({
            path:
              filePath
          });


        extractedText =
          result.value || "";

      }


      // ======================================================
      // XLSX / XLS / CSV
      // ======================================================

      else if (
        extension === ".xlsx" ||
        extension === ".xls" ||
        extension === ".csv"
      ) {

        const workbook =
          XLSX.readFile(
            filePath
          );


        const sheets = {};


        workbook.SheetNames.forEach(
          sheetName => {

            const worksheet =
              workbook.Sheets[
                sheetName
              ];


            sheets[
              sheetName
            ] =
              XLSX.utils.sheet_to_json(
                worksheet,
                {
                  header:
                    1,
                  defval:
                    ""
                }
              );

          }
        );


        structuredData =
          sheets;


        extractedText =
          Object.entries(
            sheets
          )
            .map(
              ([sheet, rows]) => {

                return `
SHEET: ${sheet}

${rows
  .map(row =>
    row.join(" | ")
  )
  .join("\n")}
`;

              }
            )
            .join("\n");

      }


      // ======================================================
      // TXT / MD / JSON / XML / RTF
      // ======================================================

      else {

        extractedText =
          fs.readFileSync(
            filePath,
            "utf8"
          );

      }


      if (
        !extractedText.trim()
      ) {

        return res.status(422).json({

          success:
            false,

          error:
            "No readable content could be extracted from this file.",

        });

      }


      // ======================================================
      // LIMIT MODEL INPUT
      // ======================================================

      const safeDocument =
        extractedText.substring(
          0,
          150000
        );


      // ======================================================
      // DETAILED DOCUMENT ANALYSIS
      // ======================================================

      const analysisPrompt =
        truvoraDetailedAnalysisPrompt(
          "document",
          req.body.language ||
            "English"
        );


      const analysis =
        await openai.chat.completions.create({

          model:
            "gpt-4.1",

          messages: [

            {
              role:
                "system",

              content:
                analysisPrompt + `

For this document specifically include:

# 📄 Document Information

Identify:

- document type
- apparent purpose
- structure
- language

# 🧾 Executive Summary

Provide a clear summary of the entire document.

# 📚 Section-by-Section Analysis

Explain every important section.

# 📊 Tables and Data

Analyze important:

- tables
- numbers
- totals
- percentages
- trends
- relationships

# 🔑 Important Facts

Extract important facts accurately.

# 📅 Dates

List important dates when present.

# 💰 Financial Information

When applicable, identify:

- prices
- costs
- revenue
- expenses
- totals
- percentages

Do not invent missing financial information.

# ⚠️ Contradictions / Missing Information

Identify actual inconsistencies or missing information.

# 💡 Insights

Provide useful conclusions derived from the document.

# 🎯 Recommendations

Provide practical recommendations when appropriate.

# ✅ Final Conclusion

Clearly explain what the document ultimately tells us.
`
            },

            {
              role:
                "user",

              content: `
FILE NAME:
${originalName}

FILE TYPE:
${extension}

DOCUMENT CONTENT:

${safeDocument}
`
            }

          ]

        });


      const answer =
        analysis
          .choices?.[0]
          ?.message
          ?.content ||
        "Unable to analyze this document.";


      return res.json({

        success:
          true,

        type:
          "document",

        filename:
          originalName,

        fileType:
          extension,

        analysis:
          answer,

        answer,

        structuredData,

      });


    } catch (error) {

      console.error(
        "❌ DOCUMENT ANALYSIS ERROR:",
        error
      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message ||
          "Document analysis failed",

      });

    }

  }
);
// ============================================================
// WEBSITE ANALYSIS
// ============================================================

app.post(
  "/analyze-website",
  async (req, res) => {

    try {

      const {
        url,
        language = "English"
      } = req.body;


      if (!url) {

        return res.status(400).json({

          success: false,

          error:
            "Website URL is required",

        });

      }


      console.log(
        "🌐 WEBSITE ANALYSIS REQUEST:",
        url
      );


      // ======================================================
      // FETCH WEBSITE
      // ======================================================

      const response =
        await axios.get(
          url,
          {
            timeout:
              20000,

            maxContentLength:
              20 * 1024 * 1024,

            headers: {
              "User-Agent":
                "Mozilla/5.0 TruvoraAI/1.0",
            },
          }
        );


      const html =
        String(
          response.data || ""
        );


      // ======================================================
      // REMOVE HTML NOISE
      // ======================================================

      const cleanText =
        html

          .replace(
            /<script[\s\S]*?<\/script>/gi,
            " "
          )

          .replace(
            /<style[\s\S]*?<\/style>/gi,
            " "
          )

          .replace(
            /<noscript[\s\S]*?<\/noscript>/gi,
            " "
          )

          .replace(
            /<[^>]+>/g,
            " "
          )

          .replace(
            /&nbsp;/gi,
            " "
          )

          .replace(
            /&amp;/gi,
            "&"
          )

          .replace(
            /\s+/g,
            " "
          )

          .trim();


      if (
        !cleanText
      ) {

        return res.status(422).json({

          success:
            false,

          error:
            "No readable content could be extracted from this website.",

        });

      }


      // ======================================================
      // LIMIT WEBSITE CONTENT
      // ======================================================

      const safeWebsiteText =
        cleanText.substring(
          0,
          120000
        );


      // ======================================================
      // DETAILED WEBSITE ANALYSIS
      // ======================================================

      const analysisPrompt =
        truvoraDetailedAnalysisPrompt(
          "website",
          language
        );


      const analysis =
        await openai.chat.completions.create({

          model:
            "gpt-4.1",

          messages: [

            {
              role:
                "system",

              content:
                analysisPrompt + `

For this website specifically include:

# 🌐 Website Purpose

Explain what the website is for.

# 🧭 Main Sections

Identify and explain the important sections
of the website.

# 📋 Main Information

Summarize the important information
presented on the page.

# 🔗 Important Links

Identify important links or destinations
when they are visible in the supplied content.

# 📊 Claims and Data

Identify:

- statistics
- numbers
- dates
- factual claims
- product/service information

Do not assume claims are true simply
because the website states them.

# 💡 Useful Insights

Explain useful conclusions or observations.

# ⚠️ Limitations

Mention:

- inaccessible content
- missing information
- dynamic content that could not be retrieved
- information that requires verification

# 🎯 Practical Takeaways

Explain what a user should understand
after reading this website.

# ✅ Overall Assessment

Give a balanced final assessment.
`
            },

            {
              role:
                "user",

              content: `
Analyze this website in detail.

URL:
${url}

WEBSITE CONTENT:

${safeWebsiteText}
`
            }

          ]

        });


      const answer =
        analysis
          .choices?.[0]
          ?.message
          ?.content ||
        "Unable to analyze this website.";


      return res.json({

        success:
          true,

        type:
          "website",

        url,

        analysis:
          answer,

        answer,

        sources: [
          {
            title:
              url,

            url,

          }
        ],

      });


    } catch (error) {

      console.error(
        "❌ WEBSITE ANALYSIS ERROR:",
        error
      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message ||
          "Website analysis failed",

      });

    }

  }
);
/* =====================================================
   GENERATE DOCUMENT
===================================================== */

app.post("/generate-document", async (req, res) => {
  try {
    const {
      type,
      summary,
      analysis,
      recommendations,
      sources,
      title,
      content,
    } = req.body;

    const requestedType = String(type || "")
      .toLowerCase()
      .replace(/^\./, "");

    const documentContent = String(
      content || summary || analysis || ""
    ).trim();

    if (!requestedType) {
      return res.status(400).json({
        success: false,
        error: "Document type is required",
      });
    }

    if (!documentContent) {
      return res.status(400).json({
        success: false,
        error: "Document content is empty",
      });
    }

    const supportedTypes = [
      "pdf",
      "docx",
      "xlsx",
      "csv",
      "pptx",
      "html",
      "md",
      "txt",
      "json",
      "xml",
      "rtf",
    ];

    if (!supportedTypes.includes(requestedType)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported document type: ${requestedType}`,
      });
    }

    const safeTitle = String(
      title || "Truvora Document"
    ).trim();

    const reportId = `truvora-${Date.now()}`;

    const extension =
      requestedType === "markdown"
        ? "md"
        : requestedType;

    const filename = `${reportId}.${extension}`;

    const outputPath = path.join(
      uploadsPath,
      filename
    );

    console.log("==========================================");
    console.log("📄 GENERATING:", requestedType, safeTitle);
    console.log("📁 OUTPUT:", outputPath);

    const commonData = {
      outputPath,
      reportId,
      title: safeTitle,
      summary: documentContent,
      analysis: analysis || documentContent,
      recommendations: recommendations || "",
      sources: Array.isArray(sources) ? sources : [],
    };

    let generatedFile = outputPath;

    if (requestedType === "pdf") {
      generatedFile = await generatePDF(commonData);
    }

    else if (requestedType === "docx") {
      generatedFile = await generateDOCX(commonData);
    }

    else if (requestedType === "xlsx") {
      generatedFile = await generateXLSX(commonData);
    }

    else if (requestedType === "pptx") {
      generatedFile = await generatePPTX(commonData);
    }

    else if (requestedType === "csv") {
      generatedFile = await generateCSV(commonData);
    }

    else if (requestedType === "html") {
      generatedFile = await generateHTML(commonData);
    }

    else if (
      requestedType === "md" ||
      requestedType === "markdown"
    ) {
      generatedFile = await generateMarkdown(commonData);
    }

    else if (requestedType === "txt") {
      generatedFile = await generateTXT(commonData);
    }

    else if (requestedType === "json") {
      const data = await generateJSON(commonData);

      if (data !== undefined) {
        fs.writeFileSync(
          outputPath,
          typeof data === "string"
            ? data
            : JSON.stringify(data, null, 2),
          "utf8"
        );
      }
    }

    else if (requestedType === "xml") {
      const data = await generateXML(commonData);

      if (data !== undefined) {
        fs.writeFileSync(
          outputPath,
          String(data),
          "utf8"
        );
      }
    }

    else if (requestedType === "rtf") {
      const data = await generateRTF(commonData);

      if (data !== undefined) {
        fs.writeFileSync(
          outputPath,
          String(data),
          "utf8"
        );
      }
    }

    const finalPath = fs.existsSync(outputPath)
      ? outputPath
      : (
          typeof generatedFile === "string" &&
          fs.existsSync(generatedFile)
            ? generatedFile
            : null
        );

    if (!finalPath) {
      throw new Error(
        "Document generator did not create a file."
      );
    }

    const finalFilename = path.basename(finalPath);

    const documentUrl = getUploadUrl(
      req,
      finalFilename
    );

    console.log(
      "✅ DOCUMENT CREATED:",
      finalPath
    );

    console.log(
      "🔗 DOWNLOAD:",
      documentUrl
    );

    return res.json({
      success: true,
      type: requestedType,
      filename: finalFilename,
      document: documentUrl,
      url: documentUrl,
      downloadUrl: documentUrl,
    });

  } catch (error) {
    console.error(
      "❌ DOCUMENT GENERATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Document generation failed",
    });
  }
});
// ============================================================
// TRUVORA TEXT TO SPEECH
// ============================================================

app.post("/tts", async (req, res) => {
  try {
    const { text, voice = "alloy" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: "No text provided",
      });
    }

    console.log("🔊 TRUVORA TTS REQUEST");

    const filename = await generateSpeech(
      openai,
      text,
      voice
    );
console.log("🔊 TTS GENERATED FILE:", filename);
    const audioUrl =
      `${req.protocol}://${req.get("host")}/uploads/${filename}`;

    return res.json({
      success: true,
      audioUrl,
      filename,
    });

  } catch (error) {
    console.error("❌ TTS ERROR:", error);

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "TTS generation failed",
    });
  }
});
const PORT = 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Truvora server running on port ${PORT}`);
});