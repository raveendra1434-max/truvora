import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI, { toFile } from "openai";
import axios from "axios";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobe from "@ffprobe-installer/ffprobe";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import XLSX from "xlsx";
import { YoutubeTranscript } from "@danielxceron/youtube-transcript";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || "0.0.0.0";

const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/$/, "");

const UPLOAD_DIR = path.join(__dirname, "uploads");

const MAX_JSON =
  process.env.MAX_JSON || "50mb";

const MAX_FILE_BYTES = Number(
  process.env.MAX_FILE_BYTES ||
  1024 * 1024 * 1024
);

fs.mkdirSync(UPLOAD_DIR, {
  recursive: true,
});

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobe.path);

const app = express();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.disable("x-powered-by");

app.set("trust proxy", 1);


// ============================================================
// CORS
// ============================================================

const allowedOrigins =
  (process.env.CORS_ORIGINS || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {

      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS origin not allowed")
      );
    },

    credentials: true,
  })
);


// ============================================================
// BODY PARSING
// ============================================================

app.use(
  express.json({
    limit: MAX_JSON,
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: MAX_JSON,
  })
);


// ============================================================
// STATIC UPLOADS
// ============================================================

app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "1h",

    setHeaders(res) {
      res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
      );
    },
  })
);


// ============================================================
// MULTER
// ============================================================

const storage =
  multer.diskStorage({

    destination: (_req, _file, cb) => {
      cb(null, UPLOAD_DIR);
    },

    filename: (_req, file, cb) => {

      const safe =
        path
          .basename(file.originalname)
          .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          );

      cb(
        null,
        `${Date.now()}-${crypto
          .randomBytes(4)
          .toString("hex")}-${safe}`
      );
    },
  });


const upload =
  multer({

    storage,

    limits: {
      fileSize: MAX_FILE_BYTES,
    },

  });


// ============================================================
// HELPERS
// ============================================================

function publicFileUrl(
  req,
  filename
) {

  if (PUBLIC_URL) {
    return `${PUBLIC_URL}/uploads/${encodeURIComponent(
      filename
    )}`;
  }

  return `${req.protocol}://${req.get(
    "host"
  )}/uploads/${encodeURIComponent(
    filename
  )}`;
}


function safeString(
  value,
  max = 200000
) {

  return String(
    value ?? ""
  ).slice(0, max);
}


function normalizeHistory(history) {

  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .slice(-20)

    .filter(
      m =>
        m &&
        (
          m.role === "user" ||
          m.role === "assistant"
        )
    )

    .map(m => ({
      role: m.role,

      content: safeString(
        m.content ?? m.text,
        20000
      ),
    }))

    .filter(
      m =>
        m.content.trim()
    );
}


function requestedLanguage(value) {

  return (
    safeString(
      value || "English",
      100
    ).trim() ||
    "English"
  );
}


// ============================================================
// TRUVORA SYSTEM PROMPT
// ============================================================

function baseSystemPrompt(
  language
) {

  return `
You are Truvora Global AI,
a professional multilingual AI assistant.

Response language:
${language}

CORE RULES:

- Answer directly first.
- Explain clearly and professionally.
- Use Markdown headings when useful.
- Use bullet points for multiple items.
- Use tables when they improve clarity.
- Never invent facts.
- Never invent sources.
- Never invent citations.
- Never invent numbers.
- Never invent dates.
- Never invent quotations.
- If information is uncertain, clearly say so.
- If web sources are supplied, use them carefully.
- Cite web-supported claims using [1], [2], [3], etc.
- Do not claim to have accessed information that was not supplied.
- Respect the requested language.
- Give useful answers rather than unnecessarily short answers.
`;
}


// ============================================================
// OPENAI CHAT
// ============================================================

async function chatCompletion({
  messages,
  model = "gpt-4.1",
  temperature = 0.2,
  max_tokens,
}) {

  const response =
    await openai.chat.completions.create({

      model,

      messages,

      temperature,

      ...(max_tokens
        ? { max_tokens }
        : {}),
    });

  return (
    response
      .choices?.[0]
      ?.message
      ?.content
      ?.trim() ||
    ""
  );
}


// ============================================================
// SERPAPI WEB SEARCH
// ============================================================

async function searchWeb(
  query,
  limit = 8
) {

  const key =
    process.env.SERPAPI_KEY;

  if (!key) {
    return [];
  }

  const { data } =
    await axios.get(
      "https://serpapi.com/search.json",
      {
        timeout: 15000,

        params: {
          engine: "google",
          q: query,
          api_key: key,
          num: Math.min(
            limit,
            10
          ),
          hl: "en",
        },
      }
    );

  return (
    data.organic_results || []
  )
    .slice(0, limit)

    .map((r, i) => ({

      id: i + 1,

      title:
        r.title ||
        r.source ||
        "Web source",

      url:
        r.link ||
        r.url ||
        "",

      source:
        r.source ||
        (() => {

          try {

            return new URL(
              r.link
            )
              .hostname
              .replace(
                /^www\./,
                ""
              );

          } catch {

            return "web";

          }

        })(),

      snippet:
        r.snippet || "",

      date:
        r.date || "",
    }))

    .filter(
      s => s.url
    );
}


// ============================================================
// CITATION CONTEXT
// ============================================================

function citationContext(
  sources
) {

  if (!sources.length) {
    return "";
  }

  return `

WEB SOURCES:

${sources
  .map(
    s =>
      `[${s.id}] ${s.title} — ${s.url}${
        s.snippet
          ? `\n${s.snippet}`
          : ""
      }`
  )
  .join("\n\n")}


CITATION RULE:

Only cite a claim when
the supplied source supports it.

Use:
[1]
[2]
[3]

Never invent citation numbers.
`;
}


// ============================================================
// MEDIA DURATION
// ============================================================

async function getMediaDuration(
  filePath
) {

  const {
    stdout,
  } =
    await execFileAsync(
      ffprobe.path,
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filePath,
      ]
    );

  return (
    Number.parseFloat(
      stdout.trim()
    ) || 0
  );
}


// ============================================================
// AUDIO CHUNKING
// ============================================================

async function splitAudioIntoChunks(
  inputPath,
  seconds = 480
) {

  const stat =
    await fs.promises.stat(
      inputPath
    );

  const approxChunks =
    Math.max(
      1,
      Math.ceil(
        stat.size /
          (24 * 1024 * 1024)
      )
    );

  const duration =
    await getMediaDuration(
      inputPath
    );

  const chunkCount =
    Math.max(
      approxChunks,
      Math.ceil(
        duration / seconds
      )
    );

  const chunkDuration =
    Math.max(
      seconds,
      Math.ceil(
        duration /
          chunkCount
      )
    );

  const chunks = [];


  for (
    let i = 0;
    i < chunkCount;
    i++
  ) {

    const output =
      path.join(
        UPLOAD_DIR,
        `chunk-${Date.now()}-${i}-${crypto
          .randomBytes(3)
          .toString("hex")}.mp3`
      );

    const start =
      i * chunkDuration;


    await new Promise(
      (
        resolve,
        reject
      ) => {

        ffmpeg(inputPath)

          .setStartTime(
            start
          )

          .duration(
            chunkDuration
          )

          .noVideo()

          .audioCodec(
            "libmp3lame"
          )

          .audioBitrate(
            "128k"
          )

          .output(output)

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


    chunks.push(
      output
    );
  }

  return chunks;
}


// ============================================================
// AUDIO TRANSCRIPTION
// ============================================================

async function transcribeAudio(
  filePath,
  originalName = "audio.mp3"
) {

  const stat =
    await fs.promises.stat(
      filePath
    );

  const directLimit =
    24 *
    1024 *
    1024;


  // Small file
  if (
    stat.size <=
    directLimit
  ) {

    const file =
      await toFile(
        fs.createReadStream(
          filePath
        ),
        originalName
      );

    const result =
      await openai.audio.transcriptions.create(
        {
          file,

          model:
            process.env.WHISPER_MODEL ||
            "whisper-1",
        }
      );

    return result.text || "";
  }


  // Large file
  const chunks =
    await splitAudioIntoChunks(
      filePath
    );

  const transcripts = [];


  try {

    for (
      const chunk of chunks
    ) {

      try {

        const file =
          await toFile(
            fs.createReadStream(
              chunk
            ),
            path.basename(
              chunk
            )
          );

        const result =
          await openai.audio.transcriptions.create(
            {
              file,

              model:
                process.env.WHISPER_MODEL ||
                "whisper-1",
            }
          );

        if (
          result.text
        ) {
          transcripts.push(
            result.text
          );
        }

      } catch (err) {

        console.error(
          "Audio chunk transcription failed:",
          err.message
        );
      }
    }

  } finally {

    await Promise.all(
      chunks.map(
        c =>
          fs.promises
            .unlink(c)
            .catch(
              () => {}
            )
      )
    );
  }


  return transcripts.join(
    "\n\n"
  );
}


// ============================================================
// DETAILED ANALYSIS PROMPT
// ============================================================

function detailedPrompt(
  type,
  language
) {

  return `
${baseSystemPrompt(
  language
)}

You are analyzing
a ${type}.

Perform a thorough,
evidence-based analysis.

Use these sections when
appropriate:

# Overview

# Detailed Analysis

# Key Findings

# Important Details

# Evidence / Data

# Issues / Risks / Limitations

# Insights

# Recommendations

# Final Conclusion

Do not invent missing
information.

If something cannot be
determined from the supplied
material, explicitly say so.
`;
}


// ============================================================
// TEXT ANALYSIS
// ============================================================

async function analyzeText(
  type,
  content,
  language,
  extra = ""
) {

  const safe =
    safeString(
      content,
      150000
    );

  return chatCompletion({

    model: "gpt-4.1",

    temperature: 0.2,

    messages: [

      {
        role: "system",

        content:
          detailedPrompt(
            type,
            language
          ) +
          "\n" +
          extra,
      },

      {
        role: "user",

        content: safe,
      },

    ],
  });
}


// ============================================================
// HTML CLEANING
// ============================================================

function stripHtml(
  html
) {

  return String(
    html
  )

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
      /<svg[\s\S]*?<\/svg>/gi,
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
}


// ============================================================
// YOUTUBE ID
// ============================================================

function extractYoutubeId(
  url
) {

  return (
    String(url).match(
      /(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/
    )?.[1] ||
    null
  );
}


// ============================================================
// XML ESCAPE
// ============================================================

function escapeXml(
  text
) {

  return safeString(
    text
  ).replace(
    /[<>&'"]/g,
    ch =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      }[ch])
  );
}


// ============================================================
// MARKDOWN → TEXT
// ============================================================

function markdownToPlain(
  text
) {

  return safeString(
    text
  )

    .replace(
      /!\[.*?\]\(.*?\)/g,
      ""
    )

    .replace(
      /\[([^\]]+)\]\((.*?)\)/g,
      "$1 ($2)"
    )

    .replace(
      /#{1,6}\s*/g,
      ""
    )

    .replace(
      /[*_`~]/g,
      ""
    )

    .trim();
}


// ============================================================
// DOCUMENT OBJECT
// ============================================================

function contentObject(
  summary,
  analysis,
  recommendations,
  sources
) {

  return {

    title:
      "Truvora AI Report",

    generatedAt:
      new Date().toISOString(),

    summary:
      safeString(
        summary,
        300000
      ),

    analysis:
      safeString(
        analysis ||
          summary,
        300000
      ),

    recommendations:
      safeString(
        recommendations,
        50000
      ),

    sources:
      Array.isArray(
        sources
      )
        ? sources
        : [],
  };
}


// ============================================================
// DOCUMENT GENERATION
// ============================================================

async function generateDocumentFile(
  type,
  payload,
  req
) {

  const content =
    contentObject(
      payload.summary,
      payload.analysis,
      payload.recommendations,
      payload.sources
    );

  const base =
    `truvora-${Date.now()}`;

  let filename;
  let buffer;
  let mime;


  // ==========================================================
  // TXT
  // ==========================================================

  if (
    type === "txt"
  ) {

    filename =
      `${base}.txt`;

    buffer =
      Buffer.from(
        content.summary +
          "\n\n" +
          content.recommendations,
        "utf8"
      );

    mime =
      "text/plain";
  }


  // ==========================================================
  // MARKDOWN
  // ==========================================================

  else if (
    type === "md" ||
    type === "markdown"
  ) {

    filename =
      `${base}.md`;

    buffer =
      Buffer.from(
        `# ${content.title}

${content.summary}

## Recommendations

${content.recommendations}
`,
        "utf8"
      );

    mime =
      "text/markdown";
  }


  // ==========================================================
  // HTML
  // ==========================================================

  else if (
    type === "html"
  ) {

    filename =
      `${base}.html`;

    const body =
      markdownToPlain(
        content.summary
      ).replace(
        /\n/g,
        "<br>"
      );

    buffer =
      Buffer.from(
        `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeXml(
  content.title
)}</title>
</head>

<body>

<h1>${escapeXml(
  content.title
)}</h1>

<p>${escapeXml(
  body
)}</p>

<h2>
Recommendations
</h2>

<p>${escapeXml(
  content.recommendations
)}</p>

</body>
</html>`,
        "utf8"
      );

    mime =
      "text/html";
  }


  // ==========================================================
  // JSON
  // ==========================================================

  else if (
    type === "json"
  ) {

    filename =
      `${base}.json`;

    buffer =
      Buffer.from(
        JSON.stringify(
          content,
          null,
          2
        ),
        "utf8"
      );

    mime =
      "application/json";
  }


  // ==========================================================
  // XML
  // ==========================================================

  else if (
    type === "xml"
  ) {

    filename =
      `${base}.xml`;

    buffer =
      Buffer.from(
        `<?xml version="1.0" encoding="UTF-8"?>

<truvoraReport>

<title>
${escapeXml(
  content.title
)}
</title>

<generatedAt>
${escapeXml(
  content.generatedAt
)}
</generatedAt>

<summary>
${escapeXml(
  content.summary
)}
</summary>

<recommendations>
${escapeXml(
  content.recommendations
)}
</recommendations>

</truvoraReport>`,
        "utf8"
      );

    mime =
      "application/xml";
  }


  // ==========================================================
  // RTF
  // ==========================================================

  else if (
    type === "rtf"
  ) {

    filename =
      `${base}.rtf`;

    const rtf =
      `{\\rtf1\\ansi\\deff0
{\\fonttbl
{\\f0 Arial;}
}

\\fs28
${escapeXml(
  content.title
)}

\\par

\\fs22
${escapeXml(
  content.summary
).replace(
  /\n/g,
  "\\par "
)}

\\par

\\b Recommendations
\\b0

\\par

${escapeXml(
  content.recommendations
).replace(
  /\n/g,
  "\\par "
)}

}`;

    buffer =
      Buffer.from(
        rtf,
        "utf8"
      );

    mime =
      "application/rtf";
  }


  // ==========================================================
  // EXISTING TRUVORA GENERATORS
  // ==========================================================

  else {

    const generatorMap = {

      pdf: [
        "./generators/pdfGenerator.js",
        "generatePDF",
        "application/pdf",
        "pdf",
      ],

      docx: [
        "./generators/docxGenerator.js",
        "generateDOCX",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "docx",
      ],

      xlsx: [
        "./generators/xlsxGenerator.js",
        "generateXLSX",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xlsx",
      ],

      pptx: [
        "./generators/pptxGenerator.js",
        "generatePPTX",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "pptx",
      ],

      csv: [
        "./generators/csvGenerator.js",
        "generateCSV",
        "text/csv",
        "csv",
      ],

      odt: [
        "./generators/odtGenerator.js",
        "generateODT",
        "application/vnd.oasis.opendocument.text",
        "odt",
      ],

    };


    const spec =
      generatorMap[type];


    if (!spec) {

      throw new Error(
        `Unsupported document type: ${type}`
      );
    }


    const module =
      await import(
        spec[0]
      );


    const fn =
      module[
        spec[1]
      ];


    if (
      typeof fn !==
      "function"
    ) {

      throw new Error(
        `Generator unavailable for ${type}`
      );
    }


    const result =
      await fn(
        content.summary,
        content.recommendations,
        content.sources
      );


    if (
      Buffer.isBuffer(
        result
      )
    ) {

      buffer =
        result;

    }

    else if (
      result?.buffer
    ) {

      buffer =
        Buffer.from(
          result.buffer
        );

    }

    else if (
      typeof result ===
        "string" &&
      fs.existsSync(
        result
      )
    ) {

      buffer =
        await fs.promises.readFile(
          result
        );

    }

    else if (
      typeof result ===
      "string"
    ) {

      buffer =
        Buffer.from(
          result
        );

    }

    else {

      throw new Error(
        `Generator returned no file for ${type}`
      );
    }


    filename =
      `${base}.${spec[3]}`;

    mime =
      spec[2];
  }


  const outputPath =
    path.join(
      UPLOAD_DIR,
      filename
    );


  await fs.promises.writeFile(
    outputPath,
    buffer
  );


  return {

    filename,

    mime,

    url:
      publicFileUrl(
        req,
        filename
      ),
  };
}


// ============================================================
// HEALTH
// ============================================================

app.get(
  "/health",
  (_req, res) => {

    res.json({

      success: true,

      service:
        "Truvora API",

      version:
        "2.0",

      time:
        new Date().toISOString(),

      features: {

        chat:
          !!process.env.OPENAI_API_KEY,

        webSearch:
          !!process.env.SERPAPI_KEY,

        tts:
          !!process.env.OPENAI_API_KEY,

        uploads:
          true,

        youtube:
          true,
      },

    });
  }
);


// ============================================================
// MAIN CHAT
// ============================================================

app.post(
  "/ask",
  async (
    req,
    res,
    next
  ) => {

    try {

      const message =
        safeString(
          req.body.message,
          30000
        ).trim();


      const history =
        normalizeHistory(
          req.body.history
        );


      const webEnabled =
        Boolean(
          req.body.webEnabled ??
          req.body.web
        );


      const agentMode =
        Boolean(
          req.body.agentMode
        );


      const language =
        requestedLanguage(
          req.body.language
        );


      if (!message) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "Message is required",

          });
      }


      console.log(
        "TRUVORA CHAT:",
        message
      );

      console.log(
        "WEB:",
        webEnabled
      );

      console.log(
        "LANGUAGE:",
        language
      );


      let sources = [];


      if (
        webEnabled
      ) {

        try {

          sources =
            await searchWeb(
              message
            );

        } catch (err) {

          console.error(
            "Web search failed:",
            err.message
          );
        }
      }


      const agentInstruction =
        agentMode
          ? `

Agent mode is enabled.

Break complex requests into
sensible steps.

Perform only supported
operations.

Clearly distinguish:

- completed work
- information obtained
- work requiring user action
`
          : "";


      const completionMessages = [

        {

          role:
            "system",

          content:
            baseSystemPrompt(
              language
            ) +
            agentInstruction +
            citationContext(
              sources
            ),
        },

        ...history,

        {

          role:
            "user",

          content:
            message,
        },

      ];


      const answer =
        await chatCompletion({

          model:
            process.env.CHAT_MODEL ||
            "gpt-4.1",

          temperature:
            0.25,

          messages:
            completionMessages,
        });


      return res.json({

        success:
          true,

        reply:
          answer,

        answer:
          answer,

        response:
          answer,

        message:
          answer,

        language,

        sources,

        agentMode,

      });

    } catch (err) {

      next(err);

    }

  }
);


// ============================================================
// IMAGE UPLOAD
// ============================================================

app.post(
  "/upload-image",
  upload.single("image"),

  async (
    req,
    res,
    next
  ) => {

    try {

      if (!req.file) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "No image uploaded",

          });
      }


      const imageUrl =
        publicFileUrl(
          req,
          req.file.filename
        );


      res.json({

        success:
          true,

        imageUrl,

        filename:
          req.file.filename,

      });

    } catch (err) {

      next(err);

    }
  }
);


// ============================================================
// IMAGE / CAMERA ANALYSIS
// ============================================================

app.post(
  "/analyze-image",

  async (
    req,
    res,
    next
  ) => {

    try {

      const image =
        safeString(
          req.body.image,
          40000000
        );


      const language =
        requestedLanguage(
          req.body.language
        );


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


      const result =
        await openai.chat.completions.create({

          model:
            process.env.VISION_MODEL ||
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

You are Truvora's
visual analysis engine.

Classify the image into:

PRODUCT
QUESTION
GENERAL_IMAGE

Never invent:

- text
- brand
- model
- person name
- price
- facts

If uncertain,
say so clearly.

Return JSON:

{
  "category": "",
  "brand": "",
  "productType": "",
  "model": "",
  "visibleText": "",
  "productName": "",
  "questionText": "",
  "answer": "",
  "confidence": "",
  "description": ""
}

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
                    "Analyze and classify this image.",
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


      let vision = {};


      try {

        vision =
          JSON.parse(
            result
              .choices?.[0]
              ?.message
              ?.content ||
              "{}"
          );

      } catch {

        vision = {};

      }


      let shoppingResults =
        [];


      // ========================================================
      // PRODUCT SEARCH
      // ========================================================

      if (
        vision.category ===
          "PRODUCT" &&
        process.env.SERPAPI_KEY
      ) {

        const query = [

          vision.brand,

          vision.productName,

          vision.productType,

          vision.model,

        ]
          .filter(Boolean)
          .join(" ");


        if (query) {

          try {

            const {
              data,
            } =
              await axios.get(
                "https://serpapi.com/search.json",
                {

                  timeout:
                    15000,

                  params: {

                    engine:
                      "google_shopping",

                    q:
                      query,

                    api_key:
                      process.env.SERPAPI_KEY,

                    hl:
                      "en",
                  },

                }
              );


            shoppingResults =
              (
                data.shopping_results ||
                []
              )

                .slice(0, 8)

                .map(
                  (
                    x,
                    i
                  ) => ({

                    id:
                      i + 1,

                    title:
                      x.title,

                    price:
                      x.price ||
                      "",

                    source:
                      x.source ||
                      "",

                    link:
                      x.link ||
                      "",

                    thumbnail:
                      x.thumbnail ||
                      "",
                  })
                );

          } catch (err) {

            console.error(
              "Shopping lookup failed:",
              err.message
            );

          }
        }
      }


      const analysis =
        await analyzeText(

          "image",

          JSON.stringify(
            {
              vision,
              shoppingResults,
            },
            null,
            2
          ),

          language,

          `

For images:

- describe visible objects
- explain visible text
- describe environment
- answer visible questions
- identify products only when supported

Never identify a real
person by name.

Shopping results are
candidates, not proof.

`
        );


      return res.json({

        success:
          true,

        type:
          "image",

        category:
          vision.category ||
          "GENERAL_IMAGE",

        answer:
          analysis,

        analysis,

        vision,

        shoppingResults,

        sources:
          shoppingResults.map(
            (x, i) => ({

              id:
                i + 1,

              title:
                x.title,

              url:
                x.link,

              source:
                x.source,

            })
          ),

      });

    } catch (err) {

      next(err);

    }

  }
);


// ============================================================
// DOCUMENT ANALYSIS
// ============================================================

app.post(
  "/analyze-document",

  upload.single("file"),

  async (
    req,
    res,
    next
  ) => {

    try {

      if (!req.file) {

        return res
          .status(400)
          .json({

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


      let extractedText =
        "";


      let structuredData =
        null;


      // PDF
      if (
        extension ===
        ".pdf"
      ) {

        const parsed =
          await pdfParse(
            await fs.promises.readFile(
              filePath
            )
          );

        extractedText =
          parsed.text ||
          "";
      }


      // DOCX
      else if (
        extension ===
        ".docx"
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


      // EXCEL
      else if (
        [
          ".xlsx",
          ".xls",
          ".csv",
        ].includes(
          extension
        )
      ) {

        const workbook =
          XLSX.readFile(
            filePath
          );


        structuredData =
          {};


        extractedText =
          workbook
            .SheetNames
            .map(
              sheet => {

                const rows =
                  XLSX.utils.sheet_to_json(
                    workbook.Sheets[
                      sheet
                    ],
                    {
                      header: 1,
                      defval: "",
                    }
                  );


                structuredData[
                  sheet
                ] = rows;


                return `
SHEET: ${sheet}

${rows
  .map(
    row =>
      row.join(
        " | "
      )
  )
  .join(
    "\n"
  )}
`;

              }
            )
            .join(
              "\n\n"
            );
      }


      // TEXT FILES
      else if (
        [
          ".txt",
          ".md",
          ".json",
          ".xml",
          ".rtf",
        ].includes(
          extension
        )
      ) {

        extractedText =
          await fs.promises.readFile(
            filePath,
            "utf8"
          );
      }


      else {

        throw new Error(
          `Unsupported document type: ${
            extension ||
            "unknown"
          }`
        );
      }


      if (
        !extractedText.trim()
      ) {

        return res
          .status(422)
          .json({

            success:
              false,

            error:
              "No readable content could be extracted from this file.",

          });
      }


      const language =
        requestedLanguage(
          req.body.language
        );


      const analysis =
        await analyzeText(

          "document",

          `
FILE:
${originalName}

TYPE:
${extension}

CONTENT:

${extractedText}
`,

          language,

          `

For documents include:

- document purpose
- executive summary
- detailed analysis
- important sections
- tables and data
- dates
- numbers
- financial information
- contradictions
- missing information
- insights
- recommendations

`
        );


      return res.json({

        success:
          true,

        type:
          "document",

        filename:
          originalName,

        fileType:
          extension,

        documentText:
          extractedText,

        analysis,

        answer:
          analysis,

        structuredData,

      });

    } catch (err) {

      next(err);

    }

  }
);


// ============================================================
// AUDIO ANALYSIS
// ============================================================

app.post(
  "/upload-audio",

  upload.single("audio"),

  async (
    req,
    res,
    next
  ) => {

    try {

      if (!req.file) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "No audio file uploaded",

          });
      }


      const duration =
        await getMediaDuration(
          req.file.path
        ).catch(
          () => 0
        );


      const transcript =
        await transcribeAudio(
          req.file.path,
          req.file.originalname
        );


      if (
        !transcript.trim()
      ) {

        return res
          .status(422)
          .json({

            success:
              false,

            error:
              "The audio could not be transcribed.",

          });
      }


      const language =
        requestedLanguage(
          req.body.language
        );


      const analysis =
        await analyzeText(

          "audio recording",

          `
FILE:
${req.file.originalname}

DURATION:
${duration} seconds

TRANSCRIPT:

${transcript}
`,

          language,

          `

For audio include:

- overview
- detailed summary
- main topics
- important statements
- facts
- numbers
- actionable takeaways
- unclear information
- conclusion

Only mention speakers
when supported.

`
        );


      return res.json({

        success:
          true,

        type:
          "audio",

        filename:
          req.file.originalname,

        duration,

        transcript,

        analysis,

        answer:
          analysis,

        summary:
          analysis,

      });

    } catch (err) {

      next(err);

    }

  }
);


// ============================================================
// VIDEO ANALYSIS
// ============================================================

app.post(
  "/upload-video",

  upload.single("video"),

  async (
    req,
    res,
    next
  ) => {

    let extractedAudio =
      null;

    let framePath =
      null;


    try {

      if (!req.file) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "No video file uploaded",

          });
      }


      const duration =
        await getMediaDuration(
          req.file.path
        ).catch(
          () => 0
        );


      const frameName =
        `frame-${Date.now()}-${crypto
          .randomBytes(3)
          .toString("hex")}.jpg`;


      framePath =
        path.join(
          UPLOAD_DIR,
          frameName
        );


      // Extract middle frame
      await new Promise(
        (
          resolve,
          reject
        ) => {

          ffmpeg(
            req.file.path
          )

            .screenshots({

              timestamps: [
                Math.max(
                  0,
                  duration / 2
                ),
              ],

              filename:
                frameName,

              folder:
                UPLOAD_DIR,

              size:
                "1280x?",
            })

            .on(
              "end",
              resolve
            )

            .on(
              "error",
              reject
            );

        }
      );


      // Extract audio
      extractedAudio =
        path.join(
          UPLOAD_DIR,
          `video-audio-${Date.now()}-${crypto
            .randomBytes(3)
            .toString("hex")}.mp3`
        );


      await new Promise(
        (
          resolve,
          reject
        ) => {

          ffmpeg(
            req.file.path
          )

            .noVideo()

            .audioCodec(
              "libmp3lame"
            )

            .audioBitrate(
              "128k"
            )

            .output(
              extractedAudio
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


      const transcript =
        await transcribeAudio(
          extractedAudio,
          "video-audio.mp3"
        ).catch(
          () => ""
        );


      let imageData =
        null;


      if (
        fs.existsSync(
          framePath
        )
      ) {

        imageData =
          `data:image/jpeg;base64,${(
            await fs.promises.readFile(
              framePath
            )
          ).toString(
            "base64"
          )}`;
      }


      const language =
        requestedLanguage(
          req.body.language
        );


      const response =
        await openai.chat.completions.create({

          model:
            process.env.VISION_MODEL ||
            "gpt-4.1",

          messages: [

            {

              role:
                "system",

              content:
                detailedPrompt(
                  "video",
                  language
                ) +

                `

Analyze the supplied
representative frame
and transcript.

Include:

- visual analysis
- audio analysis
- important events
- sequence
- relationship between audio and visuals
- key moments
- useful takeaways
- limitations

Never identify real
people by name.

`,
            },

            {

              role:
                "user",

              content: [

                {

                  type:
                    "text",

                  text: `

VIDEO:
${req.file.originalname}

DURATION:
${duration} seconds

TRANSCRIPT:

${safeString(
  transcript,
  120000
) ||
  "No transcript available."}

`,
                },

                ...(imageData
                  ? [

                      {
                        type:
                          "image_url",

                        image_url: {
                          url:
                            imageData,
                        },
                      },

                    ]
                  : []),

              ],

            },

          ],

        });


      const analysis =
        response
          .choices?.[0]
          ?.message
          ?.content
          ?.trim() ||
        "Unable to analyze this video.";


      return res.json({

        success:
          true,

        type:
          "video",

        filename:
          req.file.originalname,

        duration,

        transcript,

        frameUrl:
          publicFileUrl(
            req,
            frameName
          ),

        analysis,

        answer:
          analysis,

        summary:
          analysis,

      });

    } catch (err) {

      next(err);

    } finally {

      if (
        extractedAudio
      ) {

        await fs.promises
          .unlink(
            extractedAudio
          )
          .catch(
            () => {}
          );
      }

      await fs.promises
        .unlink(
          req.file?.path ||
          ""
        )
        .catch(
          () => {}
        );
    }

  }
);


// ============================================================
// YOUTUBE ANALYSIS
// ============================================================

app.post(
  "/analyze-youtube",

  async (
    req,
    res,
    next
  ) => {

    try {

      const url =
        safeString(
          req.body.url,
          2000
        ).trim();


      const language =
        requestedLanguage(
          req.body.language
        );


      const videoId =
        extractYoutubeId(
          url
        );


      if (!videoId) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "Invalid YouTube URL",

          });
      }


      let transcript =
        "";


      // First method
      try {

        const data =
          await YoutubeTranscript.fetchTranscript(
            videoId
          );


        transcript =
          Array.isArray(data)
            ? data
                .map(
                  x =>
                    x.text ||
                    ""
                )
                .join(
                  " "
                )
            : "";

      } catch (err) {

        console.warn(
          "YouTube transcript unavailable:",
          err.message
        );
      }


      if (
        !transcript.trim()
      ) {

        console.warn(
          "No YouTube transcript available."
        );

      }


      if (
        !transcript.trim()
      ) {

        return res
          .status(422)
          .json({

            success:
              false,

            error:
              "No transcript or captions could be obtained from this YouTube video.",

            videoId,

          });
      }


      const analysis =
        await analyzeText(

          "YouTube video transcript",

          `

VIDEO URL:
${url}

VIDEO ID:
${videoId}

TRANSCRIPT:

${transcript.slice(
  0,
  120000
)}

`,

          language,

          `

Include:

- video summary
- main topics
- detailed explanation
- key ideas
- facts
- numbers
- claims
- important statements
- balanced assessment
- practical takeaways
- transcript limitations

`
        );


      return res.json({

        success:
          true,

        type:
          "youtube",

        videoId,

        url,

        transcriptLength:
          transcript.length,

        transcript,

        analysis,

        answer:
          analysis,

        summary:
          analysis,

      });

    } catch (err) {

      next(err);

    }

  }
);


// ============================================================
// WEBSITE ANALYSIS
// ============================================================

app.post(
  "/analyze-website",

  async (
    req,
    res,
    next
  ) => {

    try {

      const url =
        safeString(
          req.body.url,
          4000
        ).trim();


      const language =
        requestedLanguage(
          req.body.language
        );


      if (
        !/^https?:\/\//i.test(
          url
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "URL must start with http:// or https://",

          });
      }


      const response =
        await axios.get(
          url,
          {

            timeout:
              20000,

            maxContentLength:
              20 *
              1024 *
              1024,

            headers: {

              "User-Agent":
                "Mozilla/5.0 TruvoraGlobalAI/2.0",

            },

            validateStatus:
              status =>
                status >= 200 &&
                status < 400,
          }
        );


      const text =
        stripHtml(
          response.data
        );


      if (
        !text
      ) {

        return res
          .status(422)
          .json({

            success:
              false,

            error:
              "No readable content could be extracted from this website.",

          });
      }


      const analysis =
        await analyzeText(

          "website",

          `

URL:
${url}

WEBSITE CONTENT:

${text.slice(
  0,
  120000
)}

`,

          language,

          `

Include:

- website purpose
- main sections
- important information
- visible links
- claims
- data
- insights
- limitations
- practical takeaways
- overall assessment

`
        );


      let hostname =
        "website";


      try {

        hostname =
          new URL(
            url
          )
            .hostname;

      } catch {}


      return res.json({

        success:
          true,

        type:
          "website",

        url,

        analysis,

        answer:
          analysis,

        summary:
          analysis,

        sources: [

          {

            id:
              1,

            title:
              url,

            url,

            source:
              hostname,

          },

        ],

      });

    } catch (err) {

      next(err);

    }

  }
);


// ============================================================
// PERSONAL VOICE UPLOAD
// ============================================================

app.post(
  "/upload-personal-voice",

  upload.single("voice"),

  async (
    req,
    res,
    next
  ) => {

    try {

      if (!req.file) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "No voice recording uploaded",

          });
      }


      res.json({

        success:
          true,

        filename:
          req.file.filename,

        audioUrl:
          publicFileUrl(
            req,
            req.file.filename
          ),

        message:
          "Voice sample uploaded. It is stored as a sample; it is not automatically cloned.",

      });

    } catch (err) {

      next(err);

    }

  }
);


// ============================================================
// TEXT TO SPEECH
// ============================================================

app.post(
  "/tts",

  async (
    req,
    res,
    next
  ) => {

    try {

      const text =
        safeString(
          req.body.text,
          12000
        ).trim();


      const voice =
        safeString(
          req.body.voice ||
            "alloy",
          50
        );


      if (!text) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "Text is required",

          });
      }


      const allowedVoices =
        new Set([

          "alloy",
          "ash",
          "ballad",
          "coral",
          "echo",
          "fable",
          "nova",
          "onyx",
          "sage",
          "shimmer",
          "verse",
          "marin",
          "cedar",

        ]);


      const selected =
        allowedVoices.has(
          voice
        )
          ? voice
          : "alloy";


      const speech =
        await openai.audio.speech.create(
          {

            model:
              process.env.TTS_MODEL ||
              "gpt-4o-mini-tts",

            voice:
              selected,

            input:
              text,

            response_format:
              "mp3",

          }
        );


      const filename =
        `tts-${Date.now()}-${crypto
          .randomBytes(3)
          .toString("hex")}.mp3`;


      await fs.promises.writeFile(

        path.join(
          UPLOAD_DIR,
          filename
        ),

        Buffer.from(
          await speech.arrayBuffer()
        )

      );


      return res.json({

        success:
          true,

        audioUrl:
          publicFileUrl(
            req,
            filename
          ),

        filename,

        voice:
          selected,

      });

    } catch (err) {

      next(err);

    }

  }
);


// ============================================================
// DOCUMENT GENERATION API
// ============================================================

app.post(
  "/generate-document",

  async (
    req,
    res,
    next
  ) => {

    try {

      const type =
        safeString(
          req.body.type,
          20
        ).toLowerCase();


      const supported = [

        "pdf",
        "docx",
        "xlsx",
        "pptx",
        "csv",
        "html",
        "md",
        "txt",
        "json",
        "xml",
        "rtf",
        "odt",

      ];


      if (
        !supported.includes(
          type
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              `Unsupported document type: ${type}`,

          });
      }


      const file =
        await generateDocumentFile(
          type,
          req.body,
          req
        );


      return res.json({

        success:
          true,

        document:
          `/uploads/${file.filename}`,

        url:
          file.url,

        filename:
          file.filename,

        mime:
          file.mime,

      });

    } catch (err) {

      next(err);

    }

  }
);


// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (
    err,
    _req,
    res,
    _next
  ) => {

    console.error(
      "TRUVORA API ERROR:",
      err
    );


    const status =
      err instanceof
      multer.MulterError

        ? (
            err.code ===
            "LIMIT_FILE_SIZE"
              ? 413
              : 400
          )

        : 500;


    res
      .status(status)
      .json({

        success:
          false,

        error:
          err.message ||
          "Truvora server error",

      });

  }
);


// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,
  HOST,
  () => {

    console.log(
      "=============================================="
    );

    console.log(
      "TRUVORA GLOBAL AI API"
    );

    console.log(
      `Listening: http://${HOST}:${PORT}`
    );

    console.log(
      `Uploads: ${UPLOAD_DIR}`
    );

    console.log(
      `OpenAI: ${Boolean(
        process.env.OPENAI_API_KEY
      )}`
    );

    console.log(
      `SerpAPI: ${Boolean(
        process.env.SERPAPI_KEY
      )}`
    );

    console.log(
      "=============================================="
    );

  }
);