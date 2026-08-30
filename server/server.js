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

ffmpeg.setFfmpegPath(
  ffmpegPath
);

ffmpeg.setFfprobePath(
  ffprobe.path
);

const app = express();

let documentContext = "";
let projectMemory = {};


/* =====================================================
   CORS
===================================================== */

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);


/* =====================================================
   BODY LIMITS
===================================================== */

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


/* =====================================================
   UPLOADS
===================================================== */

const uploadsPath =
  path.resolve("uploads");

if (
  !fs.existsSync(
    uploadsPath
  )
) {

  fs.mkdirSync(
    uploadsPath,
    {
      recursive: true,
    }
  );

}


app.use(
  "/uploads",
  express.static(
    uploadsPath
  )
);


/* =====================================================
   MULTER
===================================================== */

const storage =
  multer.diskStorage({

    destination:
      function (
        req,
        file,
        cb
      ) {

        cb(
          null,
          uploadsPath
        );

      },


    filename:
      function (
        req,
        file,
        cb
      ) {

        const safeName =
          String(
            file.originalname ||
            "file"
          )
            .replace(
              /[^a-zA-Z0-9._-]/g,
              "_"
            );


        cb(
          null,
          `${Date.now()}-${safeName}`
        );

      },

  });


const upload =
  multer({

    storage,

    limits: {
      fileSize:
        Infinity,
    },

  });


/* =====================================================
   PUBLIC FILE URL
===================================================== */

function getPublicBaseUrl(
  req
) {

  return (
    process.env.PUBLIC_BASE_URL ||
    `${req.protocol}://${req.get("host")}`
  ).replace(
    /\/$/,
    ""
  );

}


function getUploadUrl(
  req,
  filename
) {

  return `${getPublicBaseUrl(
    req
  )}/uploads/${encodeURIComponent(
    filename
  )}`;

}


/* =====================================================
   OPENAI
===================================================== */

const openai =
  new OpenAI({

    apiKey:
      process.env.OPENAI_API_KEY,

  });


/* =====================================================
   GEMINI
===================================================== */

const gemini =
  new GoogleGenAI({

    apiKey:
      process.env.GEMINI_API_KEY,

  });


async function askGemini(
  prompt
) {

  const interaction =
    await gemini.interactions.create({

      model:
        "gemini-3.6-flash",

      input:
        prompt,

    });


  return interaction.output_text;

}


/* =====================================================
   TRUVORA AI COST-SAVING ROUTER
===================================================== */

async function askTruvoraAgent(
  prompt,
  task
) {

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

    "algorithm",

  ];


  const isComplex =
    complexKeywords.some(
      (keyword) =>
        text.includes(
          keyword
        )
    );


  /* =================================================
     OPENAI FOR COMPLEX TASKS
  ================================================= */

  if (
    isComplex
  ) {

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
You are Truvora's advanced document-generation agent.

The user wants a ${task} file.

Generate useful and accurate content.
Do not simply repeat the user's request.

Include:
- Clear title
- Executive summary
- Detailed content
- Key points where appropriate
- Recommendations where appropriate

Return only the document content.
`,

          },

          {

            role:
              "user",

            content:
              prompt,

          },

        ],

      });


    return (
      response
        .choices?.[0]
        ?.message
        ?.content
        ?.trim() ||
      prompt
    );

  }


  /* =================================================
     GEMINI FOR NORMAL / LOWER-COST TASKS
  ================================================= */

  try {

    console.log(
      "🟢 AI ROUTER: GEMINI"
    );


    const geminiPrompt = `
You are Truvora's document-generation agent.

The user wants a ${task} file.

Generate the actual useful content that should go inside the file.

Do NOT simply repeat the user's request.

Create:
- Clear title
- Executive summary
- Detailed content
- Key points where appropriate
- Recommendations where appropriate

If specific data is requested, generate realistic sample data.

Return only the content for the document.

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


  } catch (
    error
  ) {

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
You are Truvora's document-generation agent.

Generate useful content for a ${task} file.

Return only the document content.
`,

          },

          {

            role:
              "user",

            content:
              prompt,

          },

        ],

      });


    return (
      response
        .choices?.[0]
        ?.message
        ?.content
        ?.trim() ||
      prompt
    );

  }

}


/* =====================================================
   IMAGE UPLOAD
===================================================== */

app.post(
  "/upload-image",

  upload.single(
    "image"
  ),

  async (
    req,
    res
  ) => {

    try {

      if (
        !req.file
      ) {

        return res
          .status(400)
          .json({

            error:
              "No image received",

          });

      }


      const imageUrl =
        getUploadUrl(
          req,
          req.file.filename
        );


      console.log(
        "🖼️ IMAGE UPLOADED:",
        imageUrl
      );


      res.json({

        imageUrl,

        url:
          imageUrl,

        filename:
          req.file.filename,

      });


    } catch (
      error
    ) {

      console.error(
        "Image upload failed:",
        error
      );


      res
        .status(500)
        .json({

          error:
            "Image upload failed",

        });

    }

  }
);


/* =====================================================
   CAMERA IMAGE ANALYSIS
===================================================== */

app.post(
  "/analyze-image",

  async (
    req,
    res
  ) => {

    try {

      const {
        image,
      } = req.body;


      if (!image) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "No image received",

          });

      }


      console.log(
        "📷 CAMERA IMAGE RECEIVED"
      );


      const visionResponse =
        await openai.chat.completions.create({

          model:
            "gpt-4.1",

          response_format: {
            type:
              "json_object",
          },

          messages: [

            {

              role:
                "system",

              content: `
You are Truvora AI's highly accurate visual identification engine.

Your job is to inspect the image carefully and determine exactly what is visible.

CLASSIFY THE IMAGE INTO EXACTLY ONE CATEGORY:

1. PRODUCT
2. QUESTION
3. GENERAL_IMAGE

========================
PRODUCT IDENTIFICATION
========================

When the image contains a product or object:

FIRST inspect the image for visible:

- Brand logos
- Brand names
- Product names
- Model numbers
- Model names
- Serial/product labels
- Printed text
- Packaging text
- Distinctive visual markings

VISIBLE TEXT HAS HIGH PRIORITY.

If a logo or brand name is visible, use the visible brand rather than guessing another brand.

Separate your identification into:

- brand
- product type
- model
- visibleText

IMPORTANT:

Do NOT invent an exact model.

If the model cannot be read or visually determined:

model = "Unknown"

If the brand is unclear:

brand = "Unknown"

If there are multiple plausible brands:

do NOT choose one with HIGH confidence.

Use MEDIUM or LOW confidence.

========================
QUESTION DETECTION
========================

If the image contains a question:

Read the visible question carefully.

This can include:

- Mathematics
- Physics
- Chemistry
- Biology
- Engineering
- Coding
- Programming
- School homework
- College questions
- Exam questions
- Printed questions
- Handwritten questions

Extract the question accurately.

Solve it carefully.

For mathematics and technical problems:

show the important reasoning/calculation steps.

Do not invent text that cannot be read.

========================
GENERAL IMAGE
========================

If the image is not primarily a product or question, classify it as GENERAL_IMAGE.

Describe only what can reasonably be observed.

Do not identify real people by name.

========================
CONFIDENCE
========================

HIGH:
The brand/product/model is clearly visible or strongly supported.

MEDIUM:
The product type or brand is reasonably identifiable but some details are uncertain.

LOW:
The image is unclear or multiple identifications are possible.

Never use HIGH confidence for an uncertain brand or model.

========================
OUTPUT
========================

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

IMPORTANT RULES:

- Never invent a brand.
- Never invent a model.
- Never guess a price.
- Never claim an exact product when the image does not support it.
- Read visible logos and text carefully.
- If text is blurry, report it as uncertain.
- Price will be searched separately using live shopping data.
`,

            },

            {

              role:
                "user",

              content: [

                {

                  type:
                    "text",

                  text:
                    "Analyze this camera image.",

                },

                {

                  type:
                    "image_url",

                  image_url: {

                    url:
                      image,

                  },

                },

              ],

            },

          ],

        });


      const rawVision =
        visionResponse
          .choices?.[0]
          ?.message
          ?.content ||
        "{}";


      console.log(
        "🤖 CAMERA AI RAW RESULT:"
      );

      console.log(
        rawVision
      );


      let vision;


      try {

        vision =
          JSON.parse(
            rawVision
          );


        if (
          vision.category ===
            "PRODUCT" &&
          (
            !vision.model ||
            vision.model ===
              "Unknown" ||
            vision.model ===
              "unknown" ||
            String(
              vision.model
            )
              .toLowerCase()
              .includes(
                "unknown"
              )
          )
        ) {

          vision.confidence =
            "MEDIUM";

        }

      } catch (
        parseError
      ) {

        console.error(
          "❌ CAMERA JSON PARSE ERROR:",
          parseError
        );


        return res
          .status(500)
          .json({

            success:
              false,

            error:
              "Unable to understand image analysis result.",

          });

      }


      /* ===============================================
         QUESTION IMAGE
      =============================================== */

      if (
        vision.category ===
        "QUESTION"
      ) {

        return res.json({

          success:
            true,

          type:
            "question",

          question:
            vision.questionText ||
            "",

          answer: `
❓ Question

${vision.questionText || "Question detected in image."}

✅ Answer

${vision.answer || "I could not determine the answer reliably."}

🎯 Confidence

${vision.confidence || "MEDIUM"}
          `.trim(),

        });

      }


      /* ===============================================
         PRODUCT IMAGE
      =============================================== */

      if (
        vision.category ===
        "PRODUCT"
      ) {

        console.log(
          "📦 PRODUCT DETECTED:",
          vision.productName
        );


        let shoppingResults =
          [];


        try {

          if (
            process.env.SERPAPI_KEY
          ) {

            console.log(
              "🔎 SEARCHING LIVE PRODUCT PRICES"
            );


            const brand =
              String(
                vision.brand ||
                ""
              ).trim();


            const productType =
              String(
                vision.productType ||
                ""
              ).trim();


            const productName =
              String(
                vision.productName ||
                ""
              ).trim();


            const searchQuery =
              [
                brand,
                productType,
              ]
                .filter(
                  Boolean
                )
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

                  },

                }
              );


            const results =
              shoppingResponse
                .data
                ?.shopping_results ||
              [];


            shoppingResults =
              results
                .map(
                  (item) => ({

                    title:
                      String(
                        item.title ||
                        ""
                      ),

                    price:
                      item.price ||
                      "",

                    source:
                      String(
                        item.source ||
                        ""
                      ),

                    link:
                      item.product_link ||
                      item.link ||
                      "",

                    thumbnail:
                      item.thumbnail ||
                      "",

                  })
                )
                .slice(
                  0,
                  5
                );

          }

        } catch (
          priceError
        ) {

          console.error(
            "⚠️ PRICE SEARCH FAILED:",
            priceError
              .response
              ?.data ||
              priceError.message
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
                (item) =>
                  item.price
              )
              .map(
                (item) =>
                  item.price
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


        return res.json({

          success:
            true,

          type:
            "product",

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

          answer: `
📦 What I found

${
  vision.productName ||
  vision.identification ||
  "Unknown product"
}

🔎 Identification

${
  vision.identification ||
  "The exact product could not be determined."
}

💰 Current Price

${priceText}

🎯 Identification Confidence

${
  vision.confidence ||
  "MEDIUM"
}

⚠️ Price Note

Prices can change. The prices shown above come from live search results and should be checked with the seller before purchasing.
          `.trim(),

        });

      }


      /* ===============================================
         GENERAL IMAGE
      =============================================== */

      const generalResponse =
        await openai.chat.completions.create({

          model:
            "gpt-4.1",

          messages: [

            {

              role:
                "system",

              content: `
You are Truvora AI's camera analysis assistant.

Analyze the image professionally.

Provide:

📋 Overview
👁️ What I See
📦 Key Objects
🎨 Colors and Lighting
🏠 Environment
📝 Important Observations
🎯 Conclusion

Only describe things that can reasonably be determined from the image.

Do not identify a real person by name.

Do not invent information.
`,

            },

            {

              role:
                "user",

              content: [

                {

                  type:
                    "text",

                  text:
                    "Analyze this image.",

                },

                {

                  type:
                    "image_url",

                  image_url: {

                    url:
                      image,

                  },

                },

              ],

            },

          ],

        });


      const generalAnswer =
        generalResponse
          .choices?.[0]
          ?.message
          ?.content ||
        "Unable to analyze this image.";


      return res.json({

        success:
          true,

        type:
          "general",

        answer:
          generalAnswer,

      });


    } catch (
      error
    ) {

      console.error(
        "❌ CAMERA ANALYSIS ERROR:",
        error
      );


      res
        .status(500)
        .json({

          success:
            false,

          error:
            error.message ||
            "Camera image analysis failed",

        });

    }

  }
);


/* =====================================================
   MEDIA HELPERS
===================================================== */

async function extractFrame(
  videoPath,
  outputImage
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      ffmpeg(
        videoPath
      )

        .screenshots({

          timestamps:
            ["2"],

          filename:
            outputImage,

          folder:
            uploadsPath,

          size:
            "1280x?",

        })

        .on(
          "end",
          () => {

            console.log(
              "✅ Frame extraction completed:",
              outputImage
            );


            resolve();

          }
        )

        .on(
          "error",
          (err) => {

            console.error(
              "❌ Frame extraction failed:",
              err
            );


            reject(
              err
            );

          }
        );

    }
  );

}


async function getMediaDuration(
  filePath
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      ffmpeg.ffprobe(
        filePath,
        (
          err,
          metadata
        ) => {

          if (
            err
          ) {

            reject(
              err
            );

            return;

          }


          resolve(
            metadata
              .format
              .duration
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
    (
      resolve,
      reject
    ) => {

      const outputPattern =
        path.join(
          uploadsPath,
          "chunk-%03d.mp3"
        );


      ffmpeg(
        inputFile
      )

        .outputOptions([

          "-f segment",

          "-segment_time 600",

          "-c:a libmp3lame",

          "-b:a 192k",

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
                  uploadsPath
                )
                .filter(
                  (file) =>
                    file.startsWith(
                      "chunk-"
                    )
                )
                .map(
                  (file) =>
                    path.join(
                      uploadsPath,
                      file
                    )
                );


            resolve(
              chunks
            );

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


/* =====================================================
   PART 1 END
===================================================== */

/* =====================================================
   YOUTUBE ANALYSIS
===================================================== */

app.post(
  "/analyze-youtube",
  async (req, res) => {

    try {

      console.log(
        "🔥 NEW YOUTUBE ANALYSIS REQUEST"
      );

      const { url } = req.body;

      console.log(
        "YOUTUBE URL RECEIVED:",
        url
      );

      if (!url) {

        return res.status(400).json({
          success: false,
          error:
            "YouTube URL is required",
        });

      }

      let text = "";

      try {

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
          "YOUTUBE VIDEO ID:",
          videoId
        );

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
            `https://www.youtube.com/watch?v=${videoId}`,
          ],
          {
            encoding:
              "utf8",
            stdio:
              "pipe",
          }
        );

        if (
          !fs.existsSync(
            subtitleFile
          )
        ) {

          return res.status(200).json({
            success: false,
            error:
              "This YouTube video does not have an accessible transcript. Please try another video.",
          });

        }

        const subtitleText =
          fs.readFileSync(
            subtitleFile,
            "utf8"
          );

        text =
          subtitleText
            .replace(
              /^WEBVTT.*$/gm,
              ""
            )
            .replace(
              /^Kind:.*$/gm,
              ""
            )
            .replace(
              /^Language:.*$/gm,
              ""
            )
            .replace(
              /^\d{2}:\d{2}(?::\d{2})?\.\d{3} --> .*$/gm,
              ""
            )
            .replace(
              /<[^>]*>/g,
              ""
            )
            .replace(
              /\r?\n+/g,
              " "
            )
            .replace(
              /\s+/g,
              " "
            )
            .trim();

        console.log(
          "✅ FINAL TRANSCRIPT LENGTH:",
          text.length
        );

        console.log(
          "✅ FINAL TRANSCRIPT PREVIEW:",
          text.substring(
            0,
            500
          )
        );

        fs.unlinkSync(
          subtitleFile
        );

        console.log(
          "✅ YouTube subtitles extracted:",
          text.length,
          "characters"
        );

      } catch (
        err
      ) {

        console.error(
          "YouTube subtitle extraction failed:",
          err
        );

        return res.status(200).json({
          success: false,
          error:
            "This YouTube video does not have an accessible transcript. Please try another video.",
        });

      }

      const transcriptForAI =
        text.trim();

      console.log(
        "TRANSCRIPT SENT TO AI:",
        transcriptForAI.length
      );

      console.log(
        "AI TRANSCRIPT PREVIEW:",
        transcriptForAI.substring(
          0,
          300
        )
      );

      let analysis;

      try {

        analysis =
          await askGemini(
            `
You are Truvora AI, a professional learning and knowledge assistant.

Analyze the following YouTube transcript and create useful content for the user.

Your response must contain these sections:

📋 SUMMARY

Give a clear, easy-to-understand summary of the entire video.

📚 DETAILED EXPLANATION

Explain the important concepts from the video in simple language.

📌 KEY POINTS

List the most important things the user should remember.

📖 IMPORTANT TERMS

List important technical or subject-specific terms and explain each one.

💡 EXAMPLES

Include useful examples mentioned or explained in the video.

📝 STUDY NOTES

Create organized notes that a student can use for revision.

❓ QUESTIONS AND ANSWERS

Create useful questions and answers based only on the video content.

🧠 QUICK QUIZ

Create 5 multiple-choice questions with the correct answers.

🎯 IMPORTANT TAKEAWAYS

Give the final lessons or conclusions from the video.

Rules:

- Base the analysis on the transcript.
- Do not invent information that is not supported by the transcript.
- Use simple, clear language.
- Make the result useful for students as well as general users.
- Use headings and readable formatting.

TRANSCRIPT START

${transcriptForAI}

TRANSCRIPT END

Now analyze the transcript above.
Do not ask the user to provide a transcript.
`
          );

      } catch (
        error
      ) {

        console.error(
          "YouTube AI analysis failed:",
          error
        );

        throw error;

      }

      console.log(
        "YOUTUBE ANALYSIS READY"
      );

      return res.json({

        success:
          true,

        transcript:
          text,

        analysis,

      });

    } catch (
      error
    ) {

      console.error(
        "YouTube Error:",
        error
      );

      return res.status(500).json({

        success:
          false,

        error:
          error.message,

      });

    }

  }
);


/* =====================================================
   WEBSITE ANALYSIS
===================================================== */

app.post(
  "/analyze-website",
  async (req, res) => {

    try {

      console.log(
        "🌐 NEW WEBSITE ANALYSIS REQUEST"
      );

      const {
        url,
      } = req.body;

      if (!url) {

        return res.status(400).json({
          success: false,
          error:
            "Website URL is required",
        });

      }

      let websiteUrl =
        String(url).trim();

      if (
        !/^https?:\/\//i.test(
          websiteUrl
        )
      ) {

        websiteUrl =
          "https://" +
          websiteUrl;

      }

      console.log(
        "🌐 FETCHING WEBSITE:",
        websiteUrl
      );

      const response =
        await fetch(
          websiteUrl
        );

      if (!response.ok) {

        return res.status(400).json({
          success: false,
          error:
            `Unable to access website. Status: ${response.status}`,
        });

      }

      const html =
        await response.text();

      const text =
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
            /<[^>]*>/g,
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
            /&lt;/gi,
            "<"
          )
          .replace(
            /&gt;/gi,
            ">"
          )
          .replace(
            /\s+/g,
            " "
          )
          .trim();

      if (!text) {

        return res.status(400).json({
          success: false,
          error:
            "No readable content found on this website.",
        });

      }

      const websiteText =
        text.substring(
          0,
          30000
        );

      const analysis =
        await askGemini(
          `
You are Truvora AI, a professional website analysis assistant.

Analyze the following website content and provide useful information.

Your response must contain:

📋 SUMMARY

🎯 PURPOSE

📚 DETAILED EXPLANATION

📌 KEY POINTS

💡 IMPORTANT INFORMATION

📝 STUDY NOTES

🎯 IMPORTANT TAKEAWAYS

Rules:

- Base the analysis only on the website content provided.
- Do not invent information.
- Use simple, clear language.
- If information is missing, say that it was not found.
- Use headings and readable formatting.

WEBSITE CONTENT START

${websiteText}

WEBSITE CONTENT END

Now analyze the website content.
`
        );

      return res.json({

        success:
          true,

        url:
          websiteUrl,

        analysis,

      });

    } catch (
      error
    ) {

      console.error(
        "🌐 WEBSITE ERROR:",
        error
      );

      return res.status(500).json({

        success:
          false,

        error:
          error.message ||
          "Unable to process website.",

      });

    }

  }
);


/* =====================================================
   VIDEO ANALYSIS
===================================================== */

console.log(
  "VIDEO ROUTE LOADED"
);


app.post(
  "/upload-video",

  upload.single(
    "video"
  ),

  async (
    req,
    res
  ) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          success: false,
          error:
            "No video file uploaded",
        });

      }

      const videoPath =
        req.file.path;

      const videoUrl =
        getUploadUrl(
          req,
          req.file.filename
        );

      console.log(
        "🎬 VIDEO RECEIVED:",
        videoPath
      );


      let duration = 0;

      try {

        duration =
          await getMediaDuration(
            videoPath
          );

      } catch (
        durationError
      ) {

        console.log(
          "⚠️ Could not get video duration:",
          durationError.message
        );

      }


      const frameName =
        `video-frame-${Date.now()}.png`;

      await extractFrame(
        videoPath,
        frameName
      );

      const framePath =
        path.join(
          uploadsPath,
          frameName
        );

      const frameUrl =
        getUploadUrl(
          req,
          frameName
        );


      const frameBase64 =
        fs.readFileSync(
          framePath,
          {
            encoding:
              "base64",
          }
        );


      const audioName =
        `video-audio-${Date.now()}.mp3`;

      const audioPath =
        path.join(
          uploadsPath,
          audioName
        );


      await new Promise(
        (
          resolve,
          reject
        ) => {

          const ffmpegProcess =
            spawn(
              ffmpegPath,
              [
                "-y",
                "-i",
                videoPath,
                "-vn",
                "-acodec",
                "libmp3lame",
                "-q:a",
                "4",
                audioPath,
              ]
            );


          ffmpegProcess.on(
            "close",
            (code) => {

              if (
                code === 0
              ) {

                resolve();

              } else {

                reject(
                  new Error(
                    `FFmpeg exited with code ${code}`
                  )
                );

              }

            }
          );


          ffmpegProcess.on(
            "error",
            reject
          );

        }
      );


      let transcript =
        "No spoken audio detected.";


      try {

        if (
          fs.existsSync(
            audioPath
          ) &&
          fs.statSync(
            audioPath
          ).size > 1000
        ) {

          const transcription =
            await openai.audio.transcriptions.create({

              file:
                fs.createReadStream(
                  audioPath
                ),

              model:
                "whisper-1",

            });


          transcript =
            transcription.text ||
            "No spoken audio detected.";

        }

      } catch (
        transcriptionError
      ) {

        console.log(
          "⚠️ Video transcription failed:",
          transcriptionError.message
        );

        transcript =
          "Audio transcription was unavailable.";

      }


      const response =
        await openai.chat.completions.create({

          model:
            "gpt-4.1",

          messages: [

            {

              role:
                "system",

              content: `
You are Truvora AI's video analysis engine.

Analyze BOTH:

1. The supplied video frame.
2. The supplied audio transcript.

Do not invent information.

Return the result in exactly this structure:

🎤 Transcript

🌍 Language

📋 AI Summary

👁️ Visual Analysis

📌 Key Points

😊 Sentiment

🎯 Action Items

If the video has no understandable speech, clearly say:

"No spoken audio detected."

Only describe what can reasonably be determined from the provided frame and transcript.
`,

            },

            {

              role:
                "user",

              content: [

                {

                  type:
                    "text",

                  text:
                    `
Analyze this video.

Video duration:
${duration} seconds

Audio transcript:
${transcript}

Also analyze the supplied video frame visually.
`,

                },

                {

                  type:
                    "image_url",

                  image_url: {

                    url:
                      `data:image/png;base64,${frameBase64}`,

                  },

                },

              ],

            },

          ],

        });


      const summary =
        response
          .choices?.[0]
          ?.message
          ?.content ||
        "Unable to analyze video.";


      return res.json({

        success:
          true,

        videoUrl,

        frameUrl,

        duration,

        transcript,

        summary,

      });


    } catch (
      error
    ) {

      console.error(
        "❌ VIDEO ANALYSIS ERROR:",
        error
      );

      return res.status(500).json({

        success:
          false,

        error:
          "Video analysis failed",

        details:
          error.message,

      });

    }

  }
);


/* =====================================================
   AUDIO ANALYSIS
===================================================== */

app.post(
  "/upload-audio",

  upload.single(
    "audio"
  ),

  async (
    req,
    res
  ) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          success: false,
          error:
            "No audio file uploaded",
        });

      }

      const audioUrl =
        getUploadUrl(
          req,
          req.file.filename
        );


      const duration =
        await getMediaDuration(
          req.file.path
        );


      console.log(
        "🎤 Audio Duration:",
        duration,
        "seconds"
      );


      const chunks =
        await splitAudioIntoChunks(
          req.file.path
        );


      let transcript = "";


      for (
        const chunk
        of chunks
      ) {

        const transcription =
          await openai.audio.transcriptions.create({

            file:
              fs.createReadStream(
                chunk
              ),

            model:
              "whisper-1",

          });


        transcript +=
          (
            transcription.text ||
            ""
          ) +
          "\n";

      }


      const completion =
        await openai.chat.completions.create({

          model:
            "gpt-4.1-mini",

          messages: [

            {

              role:
                "system",

              content: `
You are Truvora AI.

Analyze the audio transcript professionally.

Return your answer in exactly this format:

🌍 Language

🌐 English Translation

😊 Sentiment

📋 Summary

📌 Key Points

🎯 Action Items

If there are no action items, write "None."
`,

            },

            {

              role:
                "user",

              content:
                transcript,

            },

          ],

        });


      const analysis =
        completion
          .choices?.[0]
          ?.message
          ?.content ||
        "Unable to analyze audio.";


      const summary =
        `🎤 Transcript:

${transcript}

📋 AI Summary:

${analysis}`;


      return res.json({

        success:
          true,

        audioUrl,

        duration,

        transcript,

        summary,

      });


    } catch (
      error
    ) {

      console.error(
        "❌ AUDIO ERROR:",
        error
      );

      return res.status(500).json({

        success:
          false,

        error:
          "Audio upload failed",

        details:
          error.message,

      });

    }

  }
);


/* =====================================================
   PART 2 END
===================================================== */

/* =====================================================
   MAIN AI ROUTE
===================================================== */

app.post(
  "/ask",
  async (req, res) => {

    try {

      let {
        message,
        history,
        web,
        agentMode,
        imageUrl,
        imageUrls,
        language,
      } = req.body;


      message =
        String(
          message || ""
        ).trim();


      if (!message) {

        return res.status(400).json({

          success:
            false,

          error:
            "Message is required",

        });

      }


      /* =================================================
         NORMALIZE IMAGE
      ================================================= */

      imageUrl =
        imageUrl ||
        (
          Array.isArray(
            imageUrls
          )
            ? imageUrls.find(
                Boolean
              )
            : null
        );


      console.log(
        "🖼️ NORMALIZED IMAGE URL:",
        imageUrl
      );


      /* =================================================
         MEMORY
      ================================================= */

      const userId =
        "default-user";


      const memory =
        getMemory(
          userId
        ) || {};


      const projectMemory =
        memory.projects ||
        {};


      const truvoraProject =
        projectMemory.truvora;


      console.log(
        "PROJECT MEMORY:",
        truvoraProject
      );


      /* =================================================
         LANGUAGE
      ================================================= */

      let responseLanguage =
        language;


      if (
        !responseLanguage ||
        responseLanguage ===
          "auto"
      ) {

        responseLanguage =
          "Auto Detect";

      }


      console.log(
        "LANGUAGE:",
        responseLanguage
      );


      /* =================================================
         MESSAGE ANALYSIS
      ================================================= */

      const lowerMessage =
        message.toLowerCase();


      console.log(
        "🤖 MESSAGE SENT TO AGENT:",
        JSON.stringify(
          message
        )
      );


      const agentTasks =
        detectAgentTasks(
          message
        );


      console.log(
        "AGENT TASKS:",
        agentTasks
      );


      /* =================================================
         AUTOMATIC AGENT MODE
      ================================================= */

      if (
        agentMode &&
        agentTasks.length > 0
      ) {

        console.log(
          "🤖 AUTOMATIC AGENT MODE"
        );


        const agentResults =
          [];


        for (
          const task
          of agentTasks
        ) {

          try {

            const reportId =
              Date.now()
                .toString();


            const extension =
              task ===
              "image"
                ? "png"
                : task;


            const outputPath =
              path.join(
                uploadsPath,
                `${reportId}.${extension}`
              );


            console.log(
              "🤖 EXECUTING:",
              task
            );


            const generatedContent =
              task ===
              "image"

                ? `Create a high-quality photorealistic image based on this request: ${message}`

                : await askTruvoraAgent(
                    message,
                    task
                  );


            const result =
              await executeAgentTask({

                type:
                  task,

                summary:
                  generatedContent,

                recommendations:
                  "",

                sources:
                  [],

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

                generateODT,

              });


            agentResults.push({

              ...result,

              summary:
                generatedContent,

            });


            console.log(
              "✅ AGENT CREATED:",
              result
            );


          } catch (
            error
          ) {

            console.error(
              "❌ AGENT TASK FAILED:",
              task,
              error
            );


            agentResults.push({

              success:
                false,

              type:
                task,

              error:
                error.message,

            });

          }

        }


        const successful =
          agentResults.filter(
            (result) =>
              result.success
          );


        return res.json({

          success:
            successful.length > 0,

          agentMode:
            true,

          tasks:
            agentTasks,

          documents:
            successful,

          images:
            successful
              .filter(
                (item) =>
                  item.type ===
                  "image"
              )
              .map(
                (item) =>
                  item.document
              ),

          reply:
            successful.length > 0

              ? `✅ ${successful
                  .map(
                    (item) =>
                      item.type
                        .toUpperCase()
                  )
                  .join(", ")} created successfully.\n\n${successful
                  .map(
                    (item) =>
                      item.summary ||
                      ""
                  )
                  .join(
                    "\n\n"
                  )}`

              : "❌ Agent could not create the requested file.",

          sources:
            [],

        });

      }


      /* =================================================
         QUESTION ANALYSIS
      ================================================= */

      const analysis =
        await analyzeQuestion(
          message,
          openai
        );


      console.log(
        "QUESTION ANALYSIS:",
        analysis
      );


      /* =================================================
         CURRENT INFORMATION DETECTION
      ================================================= */

      const currentInfoWords = [

        "latest",

        "today",

        "current",

        "recent",

        "news",

        "breaking",

        "this week",

        "this month",

        "now",

        "update",

        "updates",

      ];


      const needsCurrentInfo =
        currentInfoWords.some(
          (word) =>
            lowerMessage.includes(
              word
            )
        );


      /* =================================================
         WEB MODE
      ================================================= */

      let autoWeb =
        Boolean(
          web ||
          (
            (
              analysis.needsWeb ||
              needsCurrentInfo
            ) &&
            !truvoraProject &&
            !lowerMessage.includes(
              "continue truvora"
            )
          )
        );


      console.log(
        "🌐 WEB MODE:",
        autoWeb
      );


      /* =================================================
         CONTINUE TRUVORA
      ================================================= */

      if (
        lowerMessage.includes(
          "continue truvora"
        )
      ) {

        if (
          !truvoraProject
        ) {

          return res.json({

            success:
              true,

            reply:
              "No Truvora project memory was found. Start the project first.",

            sources:
              [],

          });

        }


        autoWeb =
          false;

      }


      /* =================================================
         SIMPLE PROJECT CONSULTATION
      ================================================= */

      if (
        lowerMessage.includes(
          "website"
        )
      ) {

        return res.json({

          success:
            true,

          reply:
            `🌐 Website Project

Before I help, tell me:

1. What type of website?
2. What features do you need?
3. Do you want coding or no-code?
4. Which technology are you using?

I can then create the complete implementation plan.`,

          sources:
            [],

        });

      }


      if (
        lowerMessage.includes(
          "company"
        ) ||
        lowerMessage.includes(
          "business"
        )
      ) {

        return res.json({

          success:
            true,

          reply:
            `🏢 Business Project

Before I help, tell me:

1. What business do you want to start?
2. Which country?
3. What is your target customer?
4. What budget or resources do you have?

I can then create the business plan.`,

          sources:
            [],

        });

      }


      if (
        lowerMessage ===
          "app" ||
        lowerMessage.startsWith(
          "build app"
        ) ||
        lowerMessage.startsWith(
          "create app"
        )
      ) {

        return res.json({

          success:
            true,

          reply:
            `📱 App Project

Tell me:

1. Android, iOS, Web or all three?
2. What should the app do?
3. Do you already have the UI?
4. Which technology are you using?

I can then help build it step by step.`,

          sources:
            [],

        });

      }


      /* =================================================
         WEB SEARCH
      ================================================= */

      let webResults =
        [];


      if (
        autoWeb
      ) {

        console.log(
          "🌐 RUNNING LIVE WEB SEARCH"
        );


        if (
          !process.env.SERPAPI_KEY
        ) {

          console.warn(
            "⚠️ SERPAPI_KEY is missing"
          );

        } else {

          try {

            const searchResponse =
              await axios.get(
                "https://serpapi.com/search.json",
                {

                  params: {

                    engine:
                      "google",

                    q:
                      message,

                    location:
                      "India",

                    gl:
                      "in",

                    hl:
                      "en",

                    num:
                      8,

                    api_key:
                      process.env.SERPAPI_KEY,

                  },

                }
              );


            const organicResults =
              searchResponse
                .data
                ?.organic_results ||
              [];


            webResults =
              organicResults
                .slice(
                  0,
                  8
                )
                .map(
                  (
                    item,
                    index
                  ) => ({

                    id:
                      index + 1,

                    title:
                      item.title ||
                      "",

                    snippet:
                      item.snippet ||
                      "",

                    url:
                      item.link ||
                      "",

                  })
                );


            console.log(
              "🌐 WEB RESULTS:",
              webResults.length
            );


          } catch (
            webError
          ) {

            console.error(
              "❌ WEB SEARCH ERROR:",
              webError
                .response
                ?.data ||
                webError.message
            );

          }

        }

      }


      /* =================================================
         HISTORY
      ================================================= */

      const safeHistory =
        Array.isArray(
          history
        )
          ? history.slice(
              -10
            )
          : [];


      const historyMessages =
        safeHistory
          .map(
            (
              item
            ) => {

              const role =
                item?.role ===
                "assistant"

                  ? "assistant"

                  : "user";


              const content =
                item?.content ??
                item?.text ??
                "";


              return {

                role,

                content:
                  String(
                    content
                  ),

              };

            }
          )
          .filter(
            (
              item
            ) =>
              item.content.trim()
                .length > 0
          );


      /* =================================================
         PROJECT CONTEXT
      ================================================= */

      let projectContext =
        "";


      if (
        truvoraProject
      ) {

        projectContext = `

PROJECT MEMORY:

${JSON.stringify(
  truvoraProject,
  null,
  2
)}

Use this project memory when relevant.

Do not claim that you remember information
that is not present in the project memory.
`;

      }


      /* =================================================
         DOCUMENT CONTEXT
      ================================================= */

      let documentPrompt =
        "";


      if (
        documentContext
      ) {

        documentPrompt = `

UPLOADED DOCUMENT CONTEXT:

${documentContext.substring(
  0,
  15000
)}

Use the uploaded document as a primary source
when the user's question is about that document.

Do not invent information that is not supported
by the document.
`;

      }


      /* =================================================
         IMAGE CONTEXT
      ================================================= */

      let imageContent =
        [];


      if (
        imageUrl
      ) {

        imageContent.push({

          type:
            "image_url",

          image_url: {

            url:
              imageUrl,

          },

        });

      }


      /* =================================================
         WEB CONTEXT
      ================================================= */

      let webContext =
        "";


      if (
        autoWeb &&
        webResults.length > 0
      ) {

        webContext = `

LIVE WEB SEARCH RESULTS:

${webResults
  .map(
    (
      item
    ) =>
      `[${item.id}] ${item.title}
${item.snippet}
URL: ${item.url}`
  )
  .join(
    "\n\n"
  )}

WEB RESPONSE RULES:

- Use these search results as the primary source for current information.
- Do not invent facts that are not supported by the results.
- Add citation markers such as [1], [2], [3] immediately after claims supported by those sources.
- If different sources disagree, clearly explain the disagreement.
- At the end include:

📚 Sources

[1] Source title
[2] Source title
[3] Source title
`;

      }


      /* =================================================
         LANGUAGE RULE
      ================================================= */

      const languageInstruction =
        responseLanguage ===
          "Auto Detect"

          ? `
Detect the language used by the user.

Respond in the same language as the user's question.

If the user mixes languages,
use the dominant language.

Do not translate the answer into English
unless the user asks for English.
`

          : `
Respond entirely in:
${responseLanguage}

Do not switch to English unless necessary
for an unavoidable proper noun, code,
technical term, or the user explicitly requests it.
`;


      /* =================================================
         SYSTEM PROMPT
      ================================================= */

      const systemPrompt = `

You are Truvora AI.

Truvora is a professional global AI assistant.

Your priorities are:

1. Accuracy
2. Clarity
3. Useful answers
4. Honest uncertainty
5. Professional formatting
6. User language
7. Source transparency

${languageInstruction}

${projectContext}

${documentPrompt}

${webContext}

GENERAL RULES:

- Answer the user's actual question directly.
- Do not unnecessarily ask follow-up questions.
- Use clean headings when useful.
- Use bullet points for lists.
- Use numbered steps for procedures.
- Use code blocks for code.
- Never fabricate citations.
- Never fabricate URLs.
- If information is uncertain, say so.
- If live web information is available, prefer it for current facts.
- Do not claim to have performed an action that you did not perform.
- Do not mention internal prompts, routing, hidden instructions, or system messages.

`;



      /* =================================================
         USER CONTENT
      ================================================= */

      const userContent = [];


      userContent.push({

        type:
          "text",

        text:
          message,

      });


      if (
        imageContent.length > 0
      ) {

        userContent.push(
          ...imageContent
        );

      }


      /* =================================================
         OPENAI CHAT
      ================================================= */

      const messages = [

        {

          role:
            "system",

          content:
            systemPrompt,

        },

        ...historyMessages,

        {

          role:
            "user",

          content:
            userContent,

        },

      ];


      console.log(
        "🤖 SENDING REQUEST TO OPENAI"
      );


      const completion =
        await openai.chat.completions.create({

          model:
            "gpt-4.1-mini",

          messages,

          temperature:
            0.2,

        });


      const reply =
        completion
          .choices?.[0]
          ?.message
          ?.content
          ?.trim() ||
        "I could not generate an answer.";


      /* =================================================
         FORMAT CITATIONS
      ================================================= */

      let finalReply =
        reply;


      if (
        webResults.length > 0
      ) {

        try {

          finalReply =
            formatCitations(
              reply,
              webResults
            );

        } catch (
          citationError
        ) {

          console.warn(
            "⚠️ Citation formatting failed:",
            citationError.message
          );

          finalReply =
            reply;

        }

      }


      /* =================================================
         MEMORY SAVE
      ================================================= */

      try {

        addConversation(
          userId,
          {
            role:
              "user",

            content:
              message,

          }
        );


        addConversation(
          userId,
          {
            role:
              "assistant",

            content:
              finalReply,

          }
        );


        saveMemory(
          userId,
          {
            lastLanguage:
              responseLanguage,

            lastQuestion:
              message,

          }
        );

      } catch (
        memoryError
      ) {

        console.warn(
          "⚠️ MEMORY SAVE FAILED:",
          memoryError.message
        );

      }


      /* =================================================
         FINAL RESPONSE
      ================================================= */

      return res.json({

        success:
          true,

        reply:
          finalReply,

        answer:
          finalReply,

        web:
          autoWeb,

        webEnabled:
          autoWeb,

        sources:
          webResults,

        language:
          responseLanguage,

        agentMode:
          false,

      });


    } catch (
      error
    ) {

      console.error(
        "❌ /ask ERROR:",
        error
      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message ||
          "AI request failed",

        reply:
          "Sorry, I couldn't process your request right now.",

      });

    }

  }
);


/* =====================================================
   PART 3 END
===================================================== */

/* =====================================================
   DOCUMENT UPLOAD / ANALYSIS
===================================================== */

app.post(
  "/analyze-document",

  upload.single("file"),

  async (
    req,
    res
  ) => {

    try {

      if (
        !req.file
      ) {

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
        req.file.originalname ||
        req.file.filename;


      const extension =
        path.extname(
          originalName
        ).toLowerCase();


      console.log(
        "📄 DOCUMENT RECEIVED:",
        originalName
      );


      let extractedText =
        "";


      /* =================================================
         PDF
      ================================================= */

      if (
        extension ===
        ".pdf"
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
          parsed.text ||
          "";

      }


      /* =================================================
         DOCX
      ================================================= */

      else if (
        extension ===
          ".docx" ||
        extension ===
          ".doc"
      ) {

        const result =
          await mammoth.extractRawText(
            {
              path:
                filePath,
            }
          );


        extractedText =
          result.value ||
          "";

      }


      /* =================================================
         XLSX / XLS
      ================================================= */

      else if (
        extension ===
          ".xlsx" ||
        extension ===
          ".xls"
      ) {

        const workbook =
          XLSX.readFile(
            filePath
          );


        const sheets =
          workbook.SheetNames;


        extractedText =
          sheets
            .map(
              (
                sheetName
              ) => {

                const worksheet =
                  workbook.Sheets[
                    sheetName
                  ];


                const csv =
                  XLSX.utils.sheet_to_csv(
                    worksheet
                  );


                return `SHEET: ${sheetName}\n${csv}`;

              }
            )
            .join(
              "\n\n"
            );

      }


      /* =================================================
         TEXT-BASED FILES
      ================================================= */

      else if (
        [
          ".txt",
          ".md",
          ".json",
          ".xml",
          ".rtf",
          ".html",
          ".htm",
          ".csv",
          ".odt",
        ].includes(
          extension
        )
      ) {

        extractedText =
          fs.readFileSync(
            filePath,
            "utf8"
          );

      }


      /* =================================================
         UNKNOWN
      ================================================= */

      else {

        try {

          extractedText =
            fs.readFileSync(
              filePath,
              "utf8"
            );

        } catch {

          extractedText =
            "";

        }

      }


      extractedText =
        String(
          extractedText ||
          ""
        )
          .replace(
            /\u0000/g,
            ""
          )
          .trim();


      if (
        !extractedText
      ) {

        return res.status(400).json({

          success:
            false,

          error:
            "No readable text was found in this document.",

        });

      }


      /* =================================================
         STORE DOCUMENT CONTEXT
      ================================================= */

      documentContext =
        extractedText.substring(
          0,
          50000
        );


      console.log(
        "📄 DOCUMENT TEXT LENGTH:",
        extractedText.length
      );


      /* =================================================
         AI ANALYSIS
      ================================================= */

      const analysis =
        await openai.chat.completions.create({

          model:
            "gpt-4.1-mini",

          messages: [

            {

              role:
                "system",

              content: `
You are Truvora AI's professional document-analysis assistant.

Analyze the uploaded document accurately.

Use this structure:

📋 SUMMARY

📌 KEY POINTS

📚 DETAILED ANALYSIS

📝 IMPORTANT INFORMATION

🎯 CONCLUSION

Rules:

- Base the answer only on the uploaded document.
- Do not invent information.
- If something cannot be determined from the document, say so.
- Preserve important names, numbers, dates and terminology.
- Make the answer clear and professional.
`,

            },

            {

              role:
                "user",

              content:
                extractedText.substring(
                  0,
                  30000
                ),

            },

          ],

        });


      const answer =
        analysis
          .choices?.[0]
          ?.message
          ?.content ||
        "Document analyzed successfully.";


      const documentUrl =
        getUploadUrl(
          req,
          req.file.filename
        );


      return res.json({

        success:
          true,

        filename:
          originalName,

        documentUrl,

        documentText:
          extractedText,

        analysis:
          answer,

      });


    } catch (
      error
    ) {

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

/* =====================================================
   GENERATE DOCUMENT
===================================================== */

app.post(
  "/generate-document",

  async (
    req,
    res
  ) => {

    try {

      const {
        type,
        summary,
        analysis,
        recommendations,
        sources,
        title,
        content
      } = req.body;


      const requestedType =
        String(
          type || ""
        )
          .toLowerCase()
          .replace(
            /^\./,
            ""
          );


      const documentContent =
        String(
          content ||
          summary ||
          analysis ||
          ""
        ).trim();


      if (
        !requestedType
      ) {

        return res.status(400).json({

          success:
            false,

          error:
            "Document type is required"

        });

      }


      if (
        !documentContent
      ) {

        return res.status(400).json({

          success:
            false,

          error:
            "Document content is empty"

        });

      }


      const safeTitle =
        String(
          title ||
          "Truvora Document"
        ).trim();


      const reportId =
        `truvora-${Date.now()}`;


      const extension =
        requestedType ===
          "markdown"
          ? "md"
          : requestedType;


      const filename =
        `${reportId}.${extension}`;


      const outputPath =
        path.join(
          uploadsPath,
          filename
        );


      console.log(
        "=========================================="
      );

      console.log(
        "📄 GENERATING:",
        requestedType,
        safeTitle
      );

      console.log(
        "📁 OUTPUT:",
        outputPath
      );


      const commonData = {

        outputPath,

        reportId,

        title:
          safeTitle,

        summary:
          documentContent,

        analysis:
          analysis ||
          documentContent,

        recommendations:
          recommendations ||
          "",

        sources:
          Array.isArray(
            sources
          )
            ? sources
            : []

      };


      let generatedFile =
        outputPath;


      /* =================================================
         PDF
      ================================================= */

      if (
        requestedType ===
        "pdf"
      ) {

        generatedFile =
          await generatePDF(
            commonData
          );

      }


      /* =================================================
         DOCX
      ================================================= */

      else if (
        requestedType ===
        "docx"
      ) {

        generatedFile =
          await generateDOCX(
            commonData
          );

      }


      /* =================================================
         XLSX
      ================================================= */

      else if (
        requestedType ===
        "xlsx"
      ) {

        generatedFile =
          await generateXLSX(
            commonData
          );

      }


      /* =================================================
         PPTX
      ================================================= */

      else if (
        requestedType ===
        "pptx"
      ) {

        generatedFile =
          await generatePPTX(
            commonData
          );

      }


      /* =================================================
         CSV
      ================================================= */

      else if (
        requestedType ===
        "csv"
      ) {

        generatedFile =
          await generateCSV(
            commonData
          );

      }


      /* =================================================
         MARKDOWN
      ================================================= */

      else if (
        requestedType ===
          "md" ||
        requestedType ===
          "markdown"
      ) {

        generatedFile =
          await generateMarkdown(
            commonData
          );

      }


      /* =================================================
         TXT
      ================================================= */

      else if (
        requestedType ===
        "txt"
      ) {

        generatedFile =
          await generateTXT(
            commonData
          );

      }


      /* =================================================
         JSON
      ================================================= */

      else if (
        requestedType ===
        "json"
      ) {

        const data =
          await generateJSON(
            commonData
          );


        if (
          data !==
          undefined
        ) {

          fs.writeFileSync(
            outputPath,
            typeof data ===
              "string"
              ? data
              : JSON.stringify(
                  data,
                  null,
                  2
                ),
            "utf8"
          );

        }

      }


      /* =================================================
         XML
      ================================================= */

      else if (
        requestedType ===
        "xml"
      ) {

        const data =
          await generateXML(
            commonData
          );


        if (
          data !==
          undefined
        ) {

          fs.writeFileSync(
            outputPath,
            String(data),
            "utf8"
          );

        }

      }


      /* =================================================
         RTF
      ================================================= */

      else if (
        requestedType ===
        "rtf"
      ) {

        const data =
          await generateRTF(
            commonData
          );


        if (
          data !==
          undefined
        ) {

          fs.writeFileSync(
            outputPath,
            String(data),
            "utf8"
          );

        }

      }


      /* =================================================
         ODT
      ================================================= */

      else if (
        requestedType ===
        "odt"
      ) {

        generatedFile =
          await generateODT(
            commonData
          );

      }


      else {

        return res.status(400).json({

          success:
            false,

          error:
            `Unsupported document type: ${requestedType}`

        });

      }


      /*
       * Some generators return a path.
       * Others write directly to outputPath.
       */

      if (
        typeof generatedFile ===
          "string" &&
        generatedFile.trim()
      ) {

        if (
          fs.existsSync(
            generatedFile
          )
        ) {

          generatedFile =
            generatedFile;

        }

      }


      /*
       * If generator did not return a path,
       * use the path we supplied to it.
       */

      if (
        !fs.existsSync(
          outputPath
        )
      ) {

        if (
          generatedFile &&
          typeof generatedFile ===
            "object"
        ) {

          const returnedPath =
            generatedFile.path ||
            generatedFile.file ||
            generatedFile.filename;


          if (
            returnedPath &&
            fs.existsSync(
              returnedPath
            )
          ) {

            generatedFile =
              returnedPath;

          }

        }

      }


      const finalPath =
        fs.existsSync(
          outputPath
        )
          ? outputPath
          : (
              typeof generatedFile ===
                "string" &&
              fs.existsSync(
                generatedFile
              )
                ? generatedFile
                : null
            );


      if (
        !finalPath
      ) {

        throw new Error(
          "Document generator did not create a file."
        );

      }


      const finalFilename =
        path.basename(
          finalPath
        );


      const documentUrl =
        getUploadUrl(
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

        success:
          true,

        type:
          requestedType,

        filename:
          finalFilename,

        document:
          documentUrl,

        url:
          documentUrl,

        downloadUrl:
          documentUrl

      });


    } catch (
      error
    ) {

      console.error(
        "❌ DOCUMENT GENERATION ERROR:",
        error
      );


      return res.status(
        500
      ).json({

        success:
          false,

        error:
          error.message ||
          "Document generation failed"

      });

    }

  }
);

/* =====================================================
   TEXT-TO-SPEECH
===================================================== */

app.post(
  "/generate-speech",

  async (
    req,
    res
  ) => {

    try {

      const {
        text,
        voice,
        language,
      } = req.body;


      if (
        !text ||
        !String(
          text
        ).trim()
      ) {

        return res.status(400).json({

          success:
            false,

          error:
            "Text is required",

        });

      }


      const speechFile =
        await generateSpeech(
          openai,
          String(
            text
          ),
          voice ||
            "alloy",
          language ||
            "en-US"
        );


      const filename =
        path.basename(
          speechFile
        );


      const audioUrl =
        getUploadUrl(
          req,
          filename
        );


      return res.json({

        success:
          true,

        audioUrl,

        url:
          audioUrl,

      });


    } catch (
      error
    ) {

      console.error(
        "❌ TTS ERROR:",
        error
      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message ||
          "Speech generation failed",

      });

    }

  }
);


/* =====================================================
   HEALTH CHECK
===================================================== */

app.get(
  "/health",

  (
    req,
    res
  ) => {

    res.json({

      success:
        true,

      service:
        "Truvora Global AI",

      status:
        "online",

      timestamp:
        new Date().toISOString(),

    });

  }
);


/* =====================================================
   ROOT
===================================================== */

app.get(
  "/",

  (
    req,
    res
  ) => {

    res.json({

      success:
        true,

      name:
        "TRUVORA",

      product:
        "Truvora Global AI",

      slogan:
        "Intelligence • Innovation • Trust",

      status:
        "online",

    });

  }
);


/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "❌ UNHANDLED SERVER ERROR:",
      error
    );


    if (
      res.headersSent
    ) {

      return next(
        error
      );

    }


    return res.status(
      500
    ).json({

      success:
        false,

      error:
        error.message ||
        "Internal server error",

    });

  }
);


/* =====================================================
   SERVER START
===================================================== */

const PORT =
  process.env.PORT ||
  5000;


app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "=========================================="
    );

    console.log(
      "🚀 TRUVORA GLOBAL AI SERVER"
    );

    console.log(
      `🚀 Server running on port ${PORT}`
    );

    console.log(
      `🌐 Uploads: ${uploadsPath}`
    );

    console.log(
      `🤖 OpenAI: ${
        !!process.env.OPENAI_API_KEY
      }`
    );

    console.log(
      `🟢 Gemini: ${
        !!process.env.GEMINI_API_KEY
      }`
    );

    console.log(
      `🔎 SerpAPI: ${
        !!process.env.SERPAPI_KEY
      }`
    );

    console.log(
      "=========================================="
    );

  }
);
