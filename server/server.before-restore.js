// ============================================================
// TRUVORA GLOBAL AI
// SERVER.JS — PART 1/6
// ============================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import axios from "axios";

import OpenAI from "openai";


// ============================================================
// ENVIRONMENT
// ============================================================

dotenv.config();


// ============================================================
// PATHS
// ============================================================

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);


const ROOT_DIR =
  path.join(
    __dirname,
    ".."
  );


const UPLOADS_DIR =
  path.join(
    __dirname,
    "uploads"
  );


const GENERATED_DIR =
  path.join(
    UPLOADS_DIR,
    "generated"
  );


// ============================================================
// CREATE DIRECTORIES
// ============================================================

for (
  const directory of [
    UPLOADS_DIR,
    GENERATED_DIR,
  ]
) {

  if (
    !fs.existsSync(
      directory
    )
  ) {

    fs.mkdirSync(
      directory,
      {
        recursive: true,
      }
    );

  }

}


// ============================================================
// EXPRESS
// ============================================================

const app =
  express();


// ============================================================
// PORT
// ============================================================

const PORT =
  Number(
    process.env.PORT ||
    5000
  );


// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin:
      true,

    credentials:
      true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);


// ============================================================
// BODY LIMITS
// ============================================================

app.use(
  express.json({
    limit:
      "100mb",
  })
);


app.use(
  express.urlencoded({
    extended:
      true,

    limit:
      "100mb",
  })
);


// ============================================================
// STATIC FILES
// ============================================================

app.use(
  "/uploads",
  express.static(
    UPLOADS_DIR
  )
);


// ============================================================
// MULTER
// ============================================================

const storage =
  multer.diskStorage({

    destination:
      (
        req,
        file,
        callback
      ) => {

        callback(
          null,
          UPLOADS_DIR
        );

      },

    filename:
      (
        req,
        file,
        callback
      ) => {

        const extension =
          path.extname(
            file.originalname
          );


        const base =
          path
            .basename(
              file.originalname,
              extension
            )
            .replace(
              /[^a-zA-Z0-9_-]/g,
              "_"
            )
            .slice(
              0,
              80
            );


        callback(
          null,
          `${base}-${Date.now()}${extension}`
        );

      },

  });


const upload =
  multer({

    storage,

    limits: {

      fileSize:
        100 *
        1024 *
        1024,

    },

  });


// ============================================================
// OPENAI
// ============================================================

const openai =
  process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey:
          process.env.OPENAI_API_KEY,
      })
    : null;


// ============================================================
// GEMINI
// ============================================================

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  "";


const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash";


const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";


// ============================================================
// OTHER API KEYS
// ============================================================

const SERPAPI_KEY =
  process.env.SERPAPI_KEY ||
  "";


const YOUTUBE_API_KEY =
  process.env.YOUTUBE_API_KEY ||
  process.env.GOOGLE_YOUTUBE_API_KEY ||
  "";


// ============================================================
// FEATURE FLAGS
// ============================================================

const ENABLE_WEB =
  process.env.ENABLE_WEB !==
  "false";


const ENABLE_GEMINI =
  process.env.ENABLE_GEMINI !==
  "false";


const ENABLE_OPENAI =
  process.env.ENABLE_OPENAI !==
  "false";


// ============================================================
// LOGGING
// ============================================================

console.log(
  "=============================================="
);

console.log(
  "TRUVORA SERVER STARTING"
);

console.log(
  "PORT:",
  PORT
);

console.log(
  "OPENAI:",
  Boolean(
    openai &&
    ENABLE_OPENAI
  )
);

console.log(
  "GEMINI:",
  Boolean(
    GEMINI_API_KEY &&
    ENABLE_GEMINI
  )
);

console.log(
  "SERPAPI:",
  Boolean(
    SERPAPI_KEY &&
    ENABLE_WEB
  )
);

console.log(
  "YOUTUBE API:",
  Boolean(
    YOUTUBE_API_KEY
  )
);

console.log(
  "UPLOADS:",
  UPLOADS_DIR
);

console.log(
  "=============================================="
);


// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  "/",
  (req, res) => {

    res.json({

      success:
        true,

      service:
        "Truvora Global AI",

      status:
        "online",

      version:
        "1.0.0",

      features: {

        openai:
          Boolean(
            openai &&
            ENABLE_OPENAI
          ),

        gemini:
          Boolean(
            GEMINI_API_KEY &&
            ENABLE_GEMINI
          ),

        web:
          Boolean(
            SERPAPI_KEY &&
            ENABLE_WEB
          ),

        youtube:
          Boolean(
            YOUTUBE_API_KEY
          ),

        uploads:
          true,

        imageGeneration:
          Boolean(
            openai
          ),

      },

    });

  }
);


// ============================================================
// HEALTH API
// ============================================================

app.get(
  "/health",
  (req, res) => {

    res.json({

      success:
        true,

      status:
        "healthy",

      timestamp:
        new Date().toISOString(),

    });

  }
);


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function cleanText(
  value
) {

  return String(
    value ??
    ""
  )
    .replace(
      /\u0000/g,
      ""
    )
    .trim();

}


function safeFilename(
  value,
  fallback = "truvora-file"
) {

  const cleaned =
    cleanText(
      value
    )
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      )
      .slice(
        0,
        120
      );

  return (
    cleaned ||
    fallback
  );

}


function absoluteUploadPath(
  filename
) {

  if (
    !filename
  ) {

    throw new Error(
      "Generated filename is missing."
    );

  }


  return path.join(
    GENERATED_DIR,
    safeFilename(
      filename
    )
  );

}


function publicUploadUrl(
  filename
) {

  return (
    `/uploads/generated/${encodeURIComponent(
      filename
    )}`
  );

}


function normalizeSources(
  sources
) {

  if (
    !Array.isArray(
      sources
    )
  ) {

    return [];

  }


  return sources
    .map(
      (
        source,
        index
      ) => {

        if (
          typeof source ===
          "string"
        ) {

          return {

            id:
              index + 1,

            title:
              source,

            url:
              source,

          };

        }


        return {

          id:
            source?.id ??
            index + 1,

          title:
            source?.title ||
            source?.name ||
            source?.source ||
            source?.url ||
            `Source ${index + 1}`,

          url:
            source?.url ||
            source?.link ||
            source?.href ||
            "",

          snippet:
            source?.snippet ||
            source?.description ||
            "",

        };

      }
    )
    .filter(
      source =>
        source.url ||
        source.title
    );

}


// ============================================================
// MODEL SELECTION
// ============================================================

function chooseModel(
  {
    preferGemini = false,
    complex = false,
  } = {}
) {

  if (
    preferGemini &&
    GEMINI_API_KEY &&
    ENABLE_GEMINI
  ) {

    return {
      provider:
        "gemini",

      model:
        GEMINI_MODEL,
    };

  }


  if (
    openai &&
    ENABLE_OPENAI
  ) {

    return {

      provider:
        "openai",

      model:
        complex
          ? "gpt-4.1"
          : "gpt-4.1-mini",

    };

  }


  if (
    GEMINI_API_KEY &&
    ENABLE_GEMINI
  ) {

    return {

      provider:
        "gemini",

      model:
        GEMINI_MODEL,

    };

  }


  throw new Error(
    "No AI provider is configured. Add OPENAI_API_KEY or GEMINI_API_KEY to the server .env file."
  );

}


// ============================================================
// GEMINI REQUEST
// ============================================================

async function callGemini(
  prompt,
  {
    system = "",
    model = GEMINI_MODEL,
    temperature = 0.3,
  } = {}
) {

  if (
    !GEMINI_API_KEY ||
    !ENABLE_GEMINI
  ) {

    throw new Error(
      "Gemini is not configured."
    );

  }


  const contents = [];


  if (
    system
  ) {

    contents.push({

      role:
        "user",

      parts: [
        {
          text:
            `SYSTEM INSTRUCTIONS:\n${system}`,
        },
      ],

    });

  }


  contents.push({

    role:
      "user",

    parts: [
      {
        text:
          cleanText(
            prompt
          ),
      },
    ],

  });


  const url =
    `${GEMINI_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(
      GEMINI_API_KEY
    )}`;


  const response =
    await axios.post(
      url,
      {
        contents,

        generationConfig: {

          temperature,

        },

      },
      {
        timeout:
          120000,

        headers: {

          "Content-Type":
            "application/json",

        },

      }
    );


  const parts =
    response?.data
      ?.candidates?.[0]
      ?.content?.parts ||
    [];


  const text =
    parts
      .map(
        part =>
          part?.text ||
          ""
      )
      .join("\n")
      .trim();


  if (
    !text
  ) {

    throw new Error(
      "Gemini returned an empty response."
    );

  }


  return text;

}


// ============================================================
// OPENAI REQUEST
// ============================================================

async function callOpenAI(
  prompt,
  {
    system = "",
    model = "gpt-4.1-mini",
    temperature = 0.3,
  } = {}
) {

  if (
    !openai ||
    !ENABLE_OPENAI
  ) {

    throw new Error(
      "OpenAI is not configured."
    );

  }


  const response =
    await openai.chat.completions.create({

      model,

      temperature,

      messages: [

        {
          role:
            "system",

          content:
            system ||
            "You are Truvora, a helpful global AI assistant.",
        },

        {
          role:
            "user",

          content:
            cleanText(
              prompt
            ),
        },

      ],

    });


  return cleanText(
    response
      ?.choices?.[0]
      ?.message?.content
  );

}


// ============================================================
// GENERIC AI REQUEST
// ============================================================

async function callAI(
  prompt,
  options = {}
) {

  const selected =
    chooseModel(
      options
    );


  if (
    selected.provider ===
    "gemini"
  ) {

    return {

      text:
        await callGemini(
          prompt,
          {
            ...options,
            model:
              selected.model,
          }
        ),

      provider:
        "gemini",

      model:
        selected.model,

    };

  }


  return {

    text:
      await callOpenAI(
        prompt,
        {
          ...options,
          model:
            selected.model,
        }
      ),

    provider:
      "openai",

    model:
      selected.model,

  };

}
// ============================================================
// WEB SEARCH
// ============================================================

async function searchWeb(
  query
) {

  if (
    !SERPAPI_KEY ||
    !ENABLE_WEB
  ) {

    return [];

  }


  const response =
    await axios.get(
      "https://serpapi.com/search.json",
      {
        params: {

          engine:
            "google",

          q:
            cleanText(
              query
            ),

          api_key:
            SERPAPI_KEY,

          num:
            8,

        },

        timeout:
          30000,

      }
    );


  const results =
    Array.isArray(
      response?.data?.organic_results
    )
      ? response.data.organic_results
      : [];


  return results
    .map(
      (
        result,
        index
      ) => ({

        id:
          index + 1,

        title:
          cleanText(
            result?.title
          ),

        url:
          result?.link ||
          "",

        snippet:
          cleanText(
            result?.snippet
          ),

      })
    )
    .filter(
      result =>
        result.url
    );

}


// ============================================================
// DETECT WHETHER WEB RESEARCH IS USEFUL
// ============================================================

function needsWebSearch(
  message
) {

  const text =
    cleanText(
      message
    ).toLowerCase();


  if (!text) {
    return false;
  }


  const patterns = [

    /\b(latest|recent|today|yesterday|tomorrow)\b/i,

    /\b(current|currently|now|this week|this month)\b/i,

    /\b(news|breaking news|updates?)\b/i,

    /\b(price|prices|cost|stock|stocks|market)\b/i,

    /\b(weather|forecast)\b/i,

    /\b(score|scores|standings|schedule)\b/i,

    /\b(who is|what happened to)\b/i,

    /\b(search|look up|find online|research)\b/i,

    /\b(compare|comparison|reviews?|rating)\b/i,

    /\b(website|web page|online)\b/i,

    /\b(youtube|youtube video)\b/i,

    /\b(product|products|buy|shopping)\b/i,

    /\b(company|business)\b/i,

    /\b(trending|viral)\b/i,

    /\b(live)\b/i,

  ];


  return patterns.some(
    pattern =>
      pattern.test(text)
  );

}


// ============================================================
// DETECT COMPLEX / ADVANCED TASKS
// ============================================================

function needsAdvancedReasoning(
  message
) {

  const text =
    cleanText(
      message
    ).toLowerCase();


  if (!text) {
    return false;
  }


  const patterns = [

    /\b(debug|debugging|fix this code|find the bug)\b/i,

    /\b(architecture|architect|design a system)\b/i,

    /\b(analyze deeply|deep analysis|deep research)\b/i,

    /\b(step by step|reason through|reasoning)\b/i,

    /\b(complex|complicated|difficult)\b/i,

    /\b(build|create|develop|implement)\b/i,

    /\b(plan|strategy|roadmap)\b/i,

    /\b(compare in detail|detailed comparison)\b/i,

    /\b(explain in detail|analyze in detail)\b/i,

  ];


  return patterns.some(
    pattern =>
      pattern.test(text)
  );

}


// ============================================================
// LANGUAGE INSTRUCTIONS
// ============================================================

function languageInstruction(
  language
) {

  const value =
    cleanText(
      language
    );


  if (
    !value ||
    value.toLowerCase() ===
      "auto detect"
  ) {

    return `
Automatically detect the language used by the user.
Reply in the same language as the user's question whenever practical.
Do not unnecessarily switch to English.
`;

  }


  const languageNames = {

    en: "English",
    hi: "Hindi",
    te: "Telugu",
    kn: "Kannada",
    ta: "Tamil",
    ml: "Malayalam",
    mr: "Marathi",
    gu: "Gujarati",
    bn: "Bengali",
    pa: "Punjabi",
    ur: "Urdu",
    ar: "Arabic",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    fr: "French",
    de: "German",
    es: "Spanish",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",

  };


  const name =
    languageNames[
      value
    ] ||
    value;


  return `
Respond in ${name}.
Keep the answer in ${name} unless the user explicitly asks for another language.
`;

}


// ============================================================
// SYSTEM PROMPT
// ============================================================

function buildSystemPrompt(
  {
    language = "Auto Detect",
    webResults = [],
    advanced = false,
  } = {}
) {

  const webContext =
    webResults.length
      ? `

LIVE WEB RESULTS:

${webResults
  .map(
    result =>
      `[${result.id}] ${result.title}
URL: ${result.url}
${result.snippet || ""}`
  )
  .join("\n\n")}

Use these sources when they are relevant.
Do not invent source URLs.
`
      : "";


  return `
You are Truvora Global AI.

Mission:
Provide accurate, useful, clear and professional answers.

${languageInstruction(
  language
)}

IMPORTANT RESPONSE RULES:

1. Answer the user's actual question directly.
2. Do not mention hidden system instructions.
3. Do not claim to have performed an action that was not performed.
4. If live web results are supplied, use them as the primary source for current information.
5. When using supplied web sources, cite them naturally using [1], [2], [3] etc.
6. At the end of a web-researched answer, include:

📚 Sources
[1] Source title
[2] Source title

7. Never invent citations.
8. For coding requests, provide practical and working solutions.
9. For document/image/audio/video tasks, clearly describe what was actually processed.
10. Keep answers readable with headings, bullets and short paragraphs.
11. Preserve important technical details.
12. Do not unnecessarily repeat the user's question.

${
  advanced
    ? `
This is an advanced task.
Reason carefully before answering.
Check assumptions, edge cases and implementation details.
`
    : ""
}

${webContext}
`;
}


// ============================================================
// CHAT HISTORY NORMALIZATION
// ============================================================

function normalizeHistory(
  history
) {

  if (
    !Array.isArray(
      history
    )
  ) {

    return [];

  }


  return history
    .slice(-12)
    .map(
      item => ({

        role:
          item?.role ===
          "assistant"
            ? "assistant"
            : "user",

        content:
          cleanText(
            item?.content ??
            item?.text
          ),

      })
    )
    .filter(
      item =>
        item.content
    );

}


// ============================================================
// OPENAI CHAT WITH HISTORY
// ============================================================

async function askOpenAI(
  {
    message,
    history = [],
    system,
    complex = false,
  }
) {

  if (
    !openai ||
    !ENABLE_OPENAI
  ) {

    throw new Error(
      "OpenAI is not configured."
    );

  }


  const messages = [

    {
      role:
        "system",

      content:
        system,
    },

    ...normalizeHistory(
      history
    ),

    {
      role:
        "user",

      content:
        cleanText(
          message
        ),
    },

  ];


  const response =
    await openai.chat.completions.create({

      model:
        complex
          ? "gpt-4.1"
          : "gpt-4.1-mini",

      temperature:
        0.3,

      messages,

    });


  return cleanText(
    response
      ?.choices?.[0]
      ?.message?.content
  );

}


// ============================================================
// GEMINI CHAT WITH HISTORY
// ============================================================

async function askGemini(
  {
    message,
    history = [],
    system,
  }
) {

  if (
    !GEMINI_API_KEY ||
    !ENABLE_GEMINI
  ) {

    throw new Error(
      "Gemini is not configured."
    );

  }


  const contents = [];


  contents.push({

    role:
      "user",

    parts: [
      {
        text:
          system,
      },
    ],

  });


  for (
    const item of normalizeHistory(
      history
    )
  ) {

    contents.push({

      role:
        item.role ===
        "assistant"
          ? "model"
          : "user",

      parts: [
        {
          text:
            item.content,
        },
      ],

    });

  }


  contents.push({

    role:
      "user",

    parts: [
      {
        text:
          cleanText(
            message
          ),
      },
    ],

  });


  const response =
    await axios.post(
      `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
        GEMINI_API_KEY
      )}`,
      {
        contents,

        generationConfig: {

          temperature:
            0.3,

        },

      },
      {

        timeout:
          120000,

        headers: {

          "Content-Type":
            "application/json",

        },

      }
    );


  const parts =
    response?.data
      ?.candidates?.[0]
      ?.content?.parts ||
    [];


  return parts
    .map(
      part =>
        part?.text ||
        ""
    )
    .join("\n")
    .trim();

}


// ============================================================
// CHAT ROUTE
// ============================================================

app.post(
  "/ask",
  async (
    req,
    res
  ) => {

    try {

      const message =
        cleanText(
          req.body?.message
        );


      const history =
        req.body?.history ||
        [];


      const language =
        req.body?.language ||
        "Auto Detect";


      if (!message) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "Message is required.",

          });

      }


      console.log(
        "=============================================="
      );

      console.log(
        "TRUVORA CHAT:",
        message
      );

      console.log(
        "LANGUAGE:",
        language
      );


      // ------------------------------------------------------
      // AUTOMATIC WEB MODE
      // ------------------------------------------------------

      const webRequired =
        ENABLE_WEB &&
        needsWebSearch(
          message
        );


      let webResults = [];


      if (
        webRequired
      ) {

        try {

          webResults =
            await searchWeb(
              message
            );

        } catch (
          searchError
        ) {

          console.error(
            "WEB SEARCH ERROR:",
            searchError
          );

        }

      }


      // ------------------------------------------------------
      // AUTOMATIC ADVANCED MODE
      // ------------------------------------------------------

      const advanced =
        needsAdvancedReasoning(
          message
        );


      const system =
        buildSystemPrompt({

          language,

          webResults,

          advanced,

        });


      let answer = "";
      let provider = "";
      let model = "";


      // ------------------------------------------------------
      // AUTOMATIC PROVIDER ROUTING
      // ------------------------------------------------------

      // Complex reasoning:
      // OpenAI first, Gemini fallback.

      if (
        advanced &&
        openai &&
        ENABLE_OPENAI
      ) {

        try {

          answer =
            await askOpenAI({

              message,

              history,

              system,

              complex:
                true,

            });

          provider =
            "openai";

          model =
            "gpt-4.1";

        } catch (
          openAIError
        ) {

          console.error(
            "OPENAI ADVANCED ERROR:",
            openAIError
          );

        }

      }


      // Normal requests prefer Gemini
      // when it is configured.

      if (
        !answer &&
        GEMINI_API_KEY &&
        ENABLE_GEMINI
      ) {

        try {

          answer =
            await askGemini({

              message,

              history,

              system,

            });

          provider =
            "gemini";

          model =
            GEMINI_MODEL;

        } catch (
          geminiError
        ) {

          console.error(
            "GEMINI ERROR:",
            geminiError
          );

        }

      }


      // OpenAI fallback.

      if (
        !answer &&
        openai &&
        ENABLE_OPENAI
      ) {

        answer =
          await askOpenAI({

            message,

            history,

            system,

            complex:
              advanced,

          });

        provider =
          "openai";

        model =
          advanced
            ? "gpt-4.1"
            : "gpt-4.1-mini";

      }


      if (!answer) {

        throw new Error(
          "No AI provider could generate a response."
        );

      }


      const sources =
        normalizeSources(
          webResults
        );


      console.log(
        "PROVIDER:",
        provider
      );

      console.log(
        "MODEL:",
        model
      );

      console.log(
        "WEB USED:",
        webResults.length >
          0
      );

      console.log(
        "ADVANCED:",
        advanced
      );


      return res.json({

        success:
          true,

        answer,

        provider,

        model,

        usedWeb:
          webResults.length >
          0,

        usedAgent:
          advanced,

        sources,

      });

    } catch (
      error
    ) {

      console.error(
        "TRUVORA ASK ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            error?.message ||
            "Truvora could not process the request.",

        });

    }

  }
);// ============================================================
// DOCUMENT ANALYSIS
// ============================================================

function getExtension(
  filename
) {

  return path
    .extname(
      filename || ""
    )
    .toLowerCase();

}


async function extractDocumentText(
  filePath,
  originalName
) {

  const extension =
    getExtension(
      originalName ||
      filePath
    );


  // ----------------------------------------------------------
  // PDF
  // ----------------------------------------------------------

  if (
    extension === ".pdf"
  ) {

    const pdfParseModule =
      await import(
        "pdf-parse"
      );

    const pdfParse =
      pdfParseModule.default ||
      pdfParseModule;


    const buffer =
      fs.readFileSync(
        filePath
      );


    const result =
      await pdfParse(
        buffer
      );


    return cleanText(
      result?.text
    );

  }


  // ----------------------------------------------------------
  // DOC / DOCX
  // ----------------------------------------------------------

  if (
    extension === ".doc" ||
    extension === ".docx"
  ) {

    const mammothModule =
      await import(
        "mammoth"
      );

    const mammoth =
      mammothModule.default ||
      mammothModule;


    const result =
      await mammoth.extractRawText(
        {
          path:
            filePath,
        }
      );


    return cleanText(
      result?.value
    );

  }


  // ----------------------------------------------------------
  // XLS / XLSX / CSV
  // ----------------------------------------------------------

  if (
    extension === ".xls" ||
    extension === ".xlsx" ||
    extension === ".csv"
  ) {

    const XLSXModule =
      await import(
        "xlsx"
      );

    const XLSX =
      XLSXModule.default ||
      XLSXModule;


    const workbook =
      XLSX.readFile(
        filePath
      );


    const sheets =
      workbook.SheetNames
        .map(
          sheetName => {

            const worksheet =
              workbook.Sheets[
                sheetName
              ];


            return (
              `SHEET: ${sheetName}\n` +
              XLSX.utils.sheet_to_csv(
                worksheet
              )
            );

          }
        );


    return cleanText(
      sheets.join(
        "\n\n"
      )
    );

  }


  // ----------------------------------------------------------
  // TXT / MD / JSON / XML / HTML / RTF
  // ----------------------------------------------------------

  if (
    [
      ".txt",
      ".md",
      ".json",
      ".xml",
      ".html",
      ".htm",
      ".rtf",
    ].includes(
      extension
    )
  ) {

    return cleanText(
      fs.readFileSync(
        filePath,
        "utf8"
      )
    );

  }


  throw new Error(
    `Unsupported document type: ${extension || "unknown"}`
  );

}


// ============================================================
// DOCUMENT ANALYSIS ROUTE
// ============================================================

app.post(
  "/analyze-document",
  upload.single("file"),
  async (
    req,
    res
  ) => {

    let filePath =
      null;


    try {

      if (
        !req.file
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "No document was uploaded.",

          });

      }


      filePath =
        req.file.path;


      const language =
        req.body?.language ||
        "Auto Detect";


      const extractedText =
        await extractDocumentText(
          filePath,
          req.file.originalname
        );


      if (
        !extractedText
      ) {

        throw new Error(
          "No readable text was found in the document."
        );

      }


      const limitedText =
        extractedText.slice(
          0,
          50000
        );


      const prompt = `
Analyze the uploaded document.

Document name:
${req.file.originalname}

Document content:
${limitedText}

Provide a useful professional analysis.

Include, when appropriate:
- Summary
- Important information
- Key points
- Tables/data observations
- Risks or issues
- Recommended next steps

Do not invent information that is not present in the document.
`;


      const result =
        await callAI(
          prompt,
          {

            system:
              buildSystemPrompt({
                language,
                webResults: [],
                advanced: true,
              }),

            complex:
              true,

          }
        );


      return res.json({

        success:
          true,

        analysis:
          result.text,

        text:
          result.text,

        provider:
          result.provider,

        model:
          result.model,

        filename:
          req.file.originalname,

      });

    } catch (
      error
    ) {

      console.error(
        "TRUVORA DOCUMENT ANALYSIS ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            error?.message ||
            "Document analysis failed.",

        });

    } finally {

      if (
        filePath &&
        fs.existsSync(
          filePath
        )
      ) {

        try {

          fs.unlinkSync(
            filePath
          );

        } catch (
          cleanupError
        ) {

          console.warn(
            "Document cleanup failed:",
            cleanupError.message
          );

        }

      }

    }

  }
);


// ============================================================
// IMAGE ANALYSIS
// ============================================================

async function analyzeImageWithOpenAI(
  filePath,
  prompt,
  language
) {

  if (
    !openai ||
    !ENABLE_OPENAI
  ) {

    throw new Error(
      "OpenAI is required for image analysis."
    );

  }


  const imageBuffer =
    fs.readFileSync(
      filePath
    );


  const extension =
    getExtension(
      filePath
    );


  let mimeType =
    "image/jpeg";


  if (
    extension === ".png"
  ) {

    mimeType =
      "image/png";

  } else if (
    extension === ".webp"
  ) {

    mimeType =
      "image/webp";

  } else if (
    extension === ".gif"
  ) {

    mimeType =
      "image/gif";

  }


  const base64 =
    imageBuffer.toString(
      "base64"
    );


  const response =
    await openai.chat.completions.create({

      model:
        "gpt-4.1-mini",

      temperature:
        0.2,

      messages: [

        {
          role:
            "system",

          content:
            buildSystemPrompt({
              language,
              webResults: [],
              advanced: true,
            }),

        },

        {
          role:
            "user",

          content: [

            {
              type:
                "text",

              text:
                cleanText(
                  prompt
                ) ||
                "Analyze this image in detail. Describe what you see, identify important objects, read visible text, and provide a clear summary.",
            },

            {
              type:
                "image_url",

              image_url: {

                url:
                  `data:${mimeType};base64,${base64}`,

              },

            },

          ],

        },

      ],

    });


  return cleanText(
    response
      ?.choices?.[0]
      ?.message?.content
  );

}


// ============================================================
// IMAGE ANALYSIS ROUTE
// ============================================================

app.post(
  "/analyze-image",
  upload.single("image"),
  async (
    req,
    res
  ) => {

    let filePath =
      null;


    try {

      if (
        !req.file
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "No image was uploaded.",

          });

      }


      filePath =
        req.file.path;


      const language =
        req.body?.language ||
        "Auto Detect";


      const prompt =
        req.body?.prompt ||
        "Analyze this image in detail. Describe what you see, identify important objects, read visible text, and give me a clear summary.";


      const analysis =
        await analyzeImageWithOpenAI(
          filePath,
          prompt,
          language
        );


      return res.json({

        success:
          true,

        analysis,

        answer:
          analysis,

        filename:
          req.file.originalname,

      });

    } catch (
      error
    ) {

      console.error(
        "TRUVORA IMAGE ANALYSIS ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            error?.message ||
            "Image analysis failed.",

        });

    } finally {

      if (
        filePath &&
        fs.existsSync(
          filePath
        )
      ) {

        try {

          fs.unlinkSync(
            filePath
          );

        } catch (
          cleanupError
        ) {

          console.warn(
            "Image cleanup failed:",
            cleanupError.message
          );

        }

      }

    }

  }
);


// ============================================================
// IMAGE GENERATION
// ============================================================

app.post(
  "/generate-image",
  async (
    req,
    res
  ) => {

    try {

      if (
        !openai ||
        !ENABLE_OPENAI
      ) {

        return res
          .status(503)
          .json({

            success:
              false,

            error:
              "OpenAI image generation is not configured.",

          });

      }


      const prompt =
        cleanText(
          req.body?.prompt
        );


      if (
        !prompt
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "Image prompt is required.",

          });

      }


      const response =
        await openai.images.generate({

          model:
            "gpt-image-1",

          prompt,

          size:
            "1024x1024",

        });


      const imageData =
        response
          ?.data?.[0];


      if (
        imageData?.url
      ) {

        return res.json({

          success:
            true,

          imageUrl:
            imageData.url,

          image:
            imageData.url,

        });

      }


      if (
        imageData?.b64_json
      ) {

        const filename =
          `truvora-image-${Date.now()}.png`;


        const outputPath =
          absoluteUploadPath(
            filename
          );


        fs.writeFileSync(
          outputPath,
          Buffer.from(
            imageData.b64_json,
            "base64"
          )
        );


        const imageUrl =
          publicUploadUrl(
            filename
          );


        return res.json({

          success:
            true,

          imageUrl,

          image:
            imageUrl,

        });

      }


      throw new Error(
        "Image generation returned no image."
      );

    } catch (
      error
    ) {

      console.error(
        "TRUVORA IMAGE GENERATION ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            error?.message ||
            "Image generation failed.",

        });

    }

  }
);


// ============================================================
// SIMPLE FILE DOWNLOAD TEST
// ============================================================

app.get(
  "/files",
  (req, res) => {

    try {

      const files =
        fs.readdirSync(
          GENERATED_DIR
        );


      return res.json({

        success:
          true,

        files:

          files.map(
            filename => ({

              filename,

              url:
                publicUploadUrl(
                  filename
                ),

            })
          ),

      });

    } catch (
      error
    ) {

      return res
        .status(500)
        .json({

          success:
            false,

          error:
            error.message,

        });

    }

  }
);
// ============================================================
// AUDIO PROCESSING
// ============================================================

async function transcribeAudio(
  filePath,
  language = ""
) {

  if (
    !openai ||
    !ENABLE_OPENAI
  ) {

    throw new Error(
      "OpenAI is required for audio transcription."
    );

  }


  const audioStream =
    fs.createReadStream(
      filePath
    );


  const options = {

    file:
      audioStream,

    model:
      "whisper-1",

    response_format:
      "verbose_json",

  };


  // Whisper accepts a language code when supplied.
  // Auto-detection is used when language is not known.

  const languageCode =
    cleanText(
      language
    );


  if (
    languageCode &&
    languageCode !==
      "auto" &&
    languageCode !==
      "Auto Detect"
  ) {

    options.language =
      languageCode;

  }


  const result =
    await openai.audio.transcriptions.create(
      options
    );


  return {

    text:
      cleanText(
        result?.text
      ),

    duration:
      Number(
        result?.duration ||
        0
      ),

  };

}


// ============================================================
// AUDIO SUMMARY
// ============================================================

async function analyzeAudioTranscript(
  transcript,
  language
) {

  const text =
    cleanText(
      transcript
    );


  if (!text) {

    throw new Error(
      "Audio transcription returned no text."
    );

  }


  const prompt = `
Analyze the following audio transcript.

Transcript:
${text.slice(
  0,
  50000
)}

Provide a professional response containing:

1. A concise summary
2. Important points
3. Key information
4. Action items when present
5. Important names, dates or numbers when present

Do not invent information.
`;


  const result =
    await callAI(
      prompt,
      {

        system:
          buildSystemPrompt({
            language,
            webResults: [],
            advanced: true,
          }),

        complex:
          true,

      }
    );


  return result;

}


// ============================================================
// AUDIO UPLOAD ROUTE
// ============================================================

app.post(
  "/upload-audio",
  upload.single("audio"),
  async (
    req,
    res
  ) => {

    let filePath =
      null;


    try {

      if (
        !req.file
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "No audio file was uploaded.",

          });

      }


      filePath =
        req.file.path;


      const language =
        req.body?.language ||
        "Auto Detect";


      console.log(
        "TRUVORA AUDIO:",
        req.file.originalname
      );


      const transcription =
        await transcribeAudio(
          filePath,
          language
        );


      if (
        !transcription.text
      ) {

        throw new Error(
          "No speech could be detected in the audio."
        );

      }


      const analysis =
        await analyzeAudioTranscript(
          transcription.text,
          language
        );


      return res.json({

        success:
          true,

        transcript:
          transcription.text,

        text:
          transcription.text,

        analysis:
          analysis.text,

        answer:
          analysis.text,

        summary:
          analysis.text,

        duration:
          transcription.duration,

        provider:
          analysis.provider,

        model:
          analysis.model,

        filename:
          req.file.originalname,

      });

    } catch (
      error
    ) {

      console.error(
        "TRUVORA AUDIO ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            error?.message ||
            "Audio processing failed.",

        });

    } finally {

      if (
        filePath &&
        fs.existsSync(
          filePath
        )
      ) {

        try {

          fs.unlinkSync(
            filePath
          );

        } catch (
          cleanupError
        ) {

          console.warn(
            "Audio cleanup failed:",
            cleanupError.message
          );

        }

      }

    }

  }
);


// ============================================================
// VIDEO PROCESSING
// ============================================================

async function getVideoFrame(
  videoPath
) {

  let ffmpegModule;
  let ffmpegStaticModule;


  try {

    ffmpegModule =
      await import(
        "fluent-ffmpeg"
      );

  } catch {

    throw new Error(
      "fluent-ffmpeg is not installed. Run: npm install fluent-ffmpeg"
    );

  }


  try {

    ffmpegStaticModule =
      await import(
        "ffmpeg-static"
      );

  } catch {

    throw new Error(
      "ffmpeg-static is not installed. Run: npm install ffmpeg-static"
    );

  }


  const ffmpeg =
    ffmpegModule.default ||
    ffmpegModule;


  const ffmpegPath =
    ffmpegStaticModule.default ||
    ffmpegStaticModule;


  if (
    ffmpegPath
  ) {

    ffmpeg.setFfmpegPath(
      ffmpegPath
    );

  }


  const frameFilename =
    `video-frame-${Date.now()}.jpg`;


  const outputPath =
    path.join(
      GENERATED_DIR,
      frameFilename
    );


  await new Promise(
    (
      resolve,
      reject
    ) => {

      ffmpeg(
        videoPath
      )
        .on(
          "end",
          resolve
        )
        .on(
          "error",
          reject
        )
        .screenshots({

          timestamps:
            ["10%"],

          filename:
            frameFilename,

          folder:
            GENERATED_DIR,

          size:
            "1280x?",

        });

    }
  );


  if (
    !fs.existsSync(
      outputPath
    )
  ) {

    throw new Error(
      "Video frame could not be created."
    );

  }


  return {

    filename:
      frameFilename,

    path:
      outputPath,

    url:
      publicUploadUrl(
        frameFilename
      ),

  };

}


// ============================================================
// VIDEO FRAME IMAGE ANALYSIS
// ============================================================

async function analyzeVideoFrame(
  framePath,
  language
) {

  return analyzeImageWithOpenAI(

    framePath,

    `
Analyze this frame from a video.

Describe:
- Important objects
- People or subjects without identifying real people
- Visible text
- Scene/context
- Important visual details

Clearly state that this is analysis of a video frame rather than the entire video.
`,

    language

  );

}


// ============================================================
// VIDEO UPLOAD ROUTE
// ============================================================

app.post(
  "/upload-video",
  upload.single("video"),
  async (
    req,
    res
  ) => {

    let videoPath =
      null;

    let framePath =
      null;


    try {

      if (
        !req.file
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "No video file was uploaded.",

          });

      }


      videoPath =
        req.file.path;


      const language =
        req.body?.language ||
        "Auto Detect";


      console.log(
        "TRUVORA VIDEO:",
        req.file.originalname
      );


      const frame =
        await getVideoFrame(
          videoPath
        );


      framePath =
        frame.path;


      const analysis =
        await analyzeVideoFrame(
          framePath,
          language
        );


      return res.json({

        success:
          true,

        analysis,

        answer:
          analysis,

        frameUrl:
          frame.url,

        frame:
          frame.url,

        filename:
          req.file.originalname,

        provider:
          "openai",

        model:
          "gpt-4.1-mini",

      });

    } catch (
      error
    ) {

      console.error(
        "TRUVORA VIDEO ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            error?.message ||
            "Video processing failed.",

        });

    } finally {

      if (
        videoPath &&
        fs.existsSync(
          videoPath
        )
      ) {

        try {

          fs.unlinkSync(
            videoPath
          );

        } catch (
          cleanupError
        ) {

          console.warn(
            "Video cleanup failed:",
            cleanupError.message
          );

        }

      }


      // Keep the generated frame temporarily
      // because the frontend displays it.
      // It is stored under /uploads/generated.

    }

  }
);


// ============================================================
// WEBSITE ANALYSIS
// ============================================================

function normalizeWebsiteUrl(
  value
) {

  let url =
    cleanText(
      value
    );


  if (!url) {

    throw new Error(
      "Website URL is required."
    );

  }


  if (
    !/^https?:\/\//i.test(
      url
    )
  ) {

    url =
      `https://${url}`;

  }


  const parsed =
    new URL(
      url
    );


  if (
    ![
      "http:",
      "https:",
    ].includes(
      parsed.protocol
    )
  ) {

    throw new Error(
      "Only HTTP and HTTPS websites are supported."
    );

  }


  return parsed.href;

}


// ============================================================
// WEBSITE FETCH
// ============================================================

async function fetchWebsite(
  url
) {

  const response =
    await axios.get(
      url,
      {

        timeout:
          30000,

        maxContentLength:
          10 *
          1024 *
          1024,

        maxBodyLength:
          10 *
          1024 *
          1024,

        headers: {

          "User-Agent":
            "Mozilla/5.0 (compatible; TruvoraGlobalAI/1.0)",

          Accept:
            "text/html,application/xhtml+xml,text/plain",

        },

        responseType:
          "text",

      }
    );


  return cleanText(
    String(
      response.data
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
  );

}


// ============================================================
// WEBSITE ANALYSIS ROUTE
// ============================================================

app.post(
  "/analyze-website",
  async (
    req,
    res
  ) => {

    try {

      const url =
        normalizeWebsiteUrl(
          req.body?.url
        );


      const language =
        req.body?.language ||
        "Auto Detect";


      const websiteText =
        await fetchWebsite(
          url
        );


      if (
        !websiteText
      ) {

        throw new Error(
          "The website returned no readable content."
        );

      }


      const prompt = `
Analyze this website.

Website:
${url}

Extracted website content:
${websiteText.slice(
  0,
  45000
)}

Provide:
- What the website is
- Main purpose
- Important information
- Main sections/services
- Important claims
- Useful observations

Do not claim to have accessed information that was not present in the fetched content.
`;


      const result =
        await callAI(
          prompt,
          {

            system:
              buildSystemPrompt({
                language,
                webResults: [
                  {
                    id:
                      1,

                    title:
                      url,

                    url,

                    snippet:
                      "Website supplied directly by the user.",

                  },
                ],

                advanced:
                  true,

              }),

            complex:
              true,

          }
        );


      return res.json({

        success:
          true,

        analysis:
          result.text,

        answer:
          result.text,

        sources: [
          {
            id:
              1,

            title:
              url,

            url,

          },
        ],

        provider:
          result.provider,

        model:
          result.model,

      });

    } catch (
      error
    ) {

      console.error(
        "TRUVORA WEBSITE ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            error?.message ||
            "Website analysis failed.",

        });

    }

  }
);
// ============================================================
// YOUTUBE HELPERS
// ============================================================

function extractYouTubeVideoId(
  value
) {

  const url =
    cleanText(
      value
    );


  if (!url) {
    return null;
  }


  // Direct 11-character video ID
  if (
    /^[a-zA-Z0-9_-]{11}$/.test(
      url
    )
  ) {

    return url;

  }


  const patterns = [

    /[?&]v=([a-zA-Z0-9_-]{11})/,

    /youtu\.be\/([a-zA-Z0-9_-]{11})/,

    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,

    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,

    /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/,

  ];


  for (
    const pattern of patterns
  ) {

    const match =
      url.match(
        pattern
      );


    if (
      match?.[1]
    ) {

      return match[1];

    }

  }


  return null;

}


// ============================================================
// YOUTUBE OEMBED
// ============================================================

async function getYouTubeMetadata(
  videoId
) {

  const youtubeUrl =
    `https://www.youtube.com/watch?v=${videoId}`;


  try {

    const response =
      await axios.get(
        "https://www.youtube.com/oembed",
        {

          params: {

            url:
              youtubeUrl,

            format:
              "json",

          },

          timeout:
            15000,

        }
      );


    return {

      title:
        cleanText(
          response?.data?.title
        ),

      author:
        cleanText(
          response?.data?.author_name
        ),

      url:
        youtubeUrl,

    };

  } catch {

    return {

      title:
        `YouTube video ${videoId}`,

      author:
        "",

      url:
        youtubeUrl,

    };

  }

}


// ============================================================
// YOUTUBE TRANSCRIPT
// ============================================================

async function getYouTubeTranscript(
  videoId
) {

  /*
   * Truvora supports the youtube-transcript package
   * when it is installed.
   *
   * We intentionally load it dynamically so the entire
   * server does not crash when the optional dependency
   * is missing.
   */

  let transcriptModule;


  try {

    transcriptModule =
      await import(
        "youtube-transcript"
      );

  } catch {

    throw new Error(
      "YouTube transcript support is not installed. Run: npm install youtube-transcript"
    );

  }


  const TranscriptClass =
    transcriptModule.YoutubeTranscript ||
    transcriptModule.default ||
    transcriptModule;


  if (
    !TranscriptClass?.fetchTranscript
  ) {

    throw new Error(
      "The installed YouTube transcript package does not expose fetchTranscript()."
    );

  }


  const transcriptItems =
    await TranscriptClass.fetchTranscript(
      videoId
    );


  if (
    !Array.isArray(
      transcriptItems
    ) ||
    transcriptItems.length === 0
  ) {

    throw new Error(
      "No YouTube transcript was available for this video."
    );

  }


  const transcript =
    transcriptItems
      .map(
        item =>
          cleanText(
            item?.text ||
            item?.snippet ||
            ""
          )
      )
      .filter(
        Boolean
      )
      .join(" ");


  if (
    !transcript
  ) {

    throw new Error(
      "The YouTube transcript was empty."
    );

  }


  return transcript;

}


// ============================================================
// YOUTUBE ANALYSIS
// ============================================================

async function analyzeYouTubeTranscript(
  {
    videoId,
    transcript,
    metadata,
    language,
  }
) {

  const prompt = `
Analyze this YouTube video using the available transcript.

Video title:
${metadata?.title || "Unknown"}

Channel/author:
${metadata?.author || "Unknown"}

Video URL:
${metadata?.url || ""}

Transcript:
${cleanText(
  transcript
).slice(
  0,
  50000
)}

Provide:

1. A concise summary
2. Main topics
3. Important points
4. Key facts or claims mentioned
5. Important names, dates or numbers when present
6. Practical conclusions or takeaways

Do not invent information.
If something cannot be determined from the transcript, say so.
`;


  const result =
    await callAI(
      prompt,
      {

        system:
          buildSystemPrompt({
            language,

            webResults: [
              {
                id:
                  1,

                title:
                  metadata?.title ||
                  "YouTube video",

                url:
                  metadata?.url ||
                  `https://www.youtube.com/watch?v=${videoId}`,

                snippet:
                  "YouTube video analyzed from its available transcript.",

              },
            ],

            advanced:
              true,

          }),

        complex:
          true,

      }
    );


  return result;

}


// ============================================================
// YOUTUBE ANALYSIS ROUTE
// ============================================================

app.post(
  "/analyze-youtube",
  async (
    req,
    res
  ) => {

    try {

      const suppliedUrl =
        cleanText(
          req.body?.url ||
          req.body?.videoUrl
        );


      if (
        !suppliedUrl
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "YouTube URL is required.",

          });

      }


      const videoId =
        extractYouTubeVideoId(
          suppliedUrl
        );


      if (
        !videoId
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "Invalid YouTube URL. Please provide a valid YouTube video URL.",

          });

      }


      const language =
        req.body?.language ||
        "Auto Detect";


      console.log(
        "TRUVORA YOUTUBE VIDEO:",
        videoId
      );


      const metadata =
        await getYouTubeMetadata(
          videoId
        );


      const transcript =
        await getYouTubeTranscript(
          videoId
        );


      const result =
        await analyzeYouTubeTranscript({

          videoId,

          transcript,

          metadata,

          language,

        });


      return res.json({

        success:
          true,

        videoId,

        title:
          metadata.title,

        author:
          metadata.author,

        videoUrl:
          metadata.url,

        transcript,

        text:
          transcript,

        analysis:
          result.text,

        answer:
          result.text,

        summary:
          result.text,

        provider:
          result.provider,

        model:
          result.model,

        sources: [

          {
            id:
              1,

            title:
              metadata.title ||
              "YouTube video",

            url:
              metadata.url,

          },

        ],

      });

    } catch (
      error
    ) {

      console.error(
        "TRUVORA YOUTUBE ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            error?.message ||
            "YouTube analysis failed.",

        });

    }

  }
);


// ============================================================
// TEXT TO SPEECH
// ============================================================

async function generateSpeechFile(
  text
) {

  if (
    !openai ||
    !ENABLE_OPENAI
  ) {

    throw new Error(
      "OpenAI is not configured for text-to-speech."
    );

  }


  const cleanSpeech =
    cleanText(
      text
    );


  if (
    !cleanSpeech
  ) {

    throw new Error(
      "Text for speech is empty."
    );

  }


  const filename =
    `truvora-speech-${Date.now()}.mp3`;


  const outputPath =
    absoluteUploadPath(
      filename
    );


  const speech =
    await openai.audio.speech.create({

      model:
        "gpt-4o-mini-tts",

      voice:
        "alloy",

      input:
        cleanSpeech.slice(
          0,
          20000
        ),

      response_format:
        "mp3",

    });


  const buffer =
    Buffer.from(
      await speech.arrayBuffer()
    );


  fs.writeFileSync(
    outputPath,
    buffer
  );


  return {

    filename,

    path:
      outputPath,

    url:
      publicUploadUrl(
        filename
      ),

  };

}


// ============================================================
// TTS ROUTE
// ============================================================

app.post(
  "/generate-speech",
  async (
    req,
    res
  ) => {

    try {

      const text =
        cleanText(
          req.body?.text ||
          req.body?.content
        );


      if (
        !text
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "Text is required.",

          });

      }


      const speech =
        await generateSpeechFile(
          text
        );


      return res.json({

        success:
          true,

        url:
          speech.url,

        audioUrl:
          speech.url,

        filename:
          speech.filename,

      });

    } catch (
      error
    ) {

      console.error(
        "TRUVORA TTS ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            error?.message ||
            "Speech generation failed.",

        });

    }

  }
);


// ============================================================
// GENERIC FILE DOWNLOAD
// ============================================================

app.get(
  "/download/:filename",
  (req, res) => {

    try {

      const filename =
        safeFilename(
          req.params.filename
        );


      const filePath =
        path.join(
          GENERATED_DIR,
          filename
        );


      if (
        !fs.existsSync(
          filePath
        )
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            error:
              "File not found.",

          });

      }


      return res.download(
        filePath,
        filename
      );

    } catch (
      error
    ) {

      console.error(
        "FILE DOWNLOAD ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "Unable to download file.",

        });

    }

  }
);


// ============================================================
// FILE DELETE / CLEANUP
// ============================================================

app.delete(
  "/files/:filename",
  (req, res) => {

    try {

      const filename =
        safeFilename(
          req.params.filename
        );


      const filePath =
        path.join(
          GENERATED_DIR,
          filename
        );


      if (
        !fs.existsSync(
          filePath
        )
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            error:
              "File not found.",

          });

      }


      fs.unlinkSync(
        filePath
      );


      return res.json({

        success:
          true,

        deleted:
          filename,

      });

    } catch (
      error
    ) {

      console.error(
        "FILE DELETE ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "Unable to delete file.",

        });

    }

  }
);


// ============================================================
// GENERATOR HELPERS
// ============================================================

function normalizeDocumentType(
  value
) {

  const type =
    cleanText(
      value
    ).toLowerCase();


  const aliases = {

    pdf:
      "pdf",

    doc:
      "docx",

    docx:
      "docx",

    word:
      "docx",

    xls:
      "xlsx",

    xlsx:
      "xlsx",

    excel:
      "xlsx",

    csv:
      "xlsx",

    ppt:
      "pptx",

    pptx:
      "pptx",

    powerpoint:
      "pptx",

    html:
      "html",

    htm:
      "html",

    md:
      "md",

    markdown:
      "md",

    txt:
      "txt",

    text:
      "txt",

    json:
      "json",

    xml:
      "xml",

    rtf:
      "rtf",

  };


  return (
    aliases[type] ||
    null
  );

}


// ============================================================
// DOCUMENT CONTENT NORMALIZATION
// ============================================================

function getDocumentContent(
  body
) {

  const candidates = [

    body?.summary,

    body?.analysis,

    body?.content,

    body?.text,

    body?.answer,

    body?.message,

  ];


  for (
    const candidate of candidates
  ) {

    const value =
      cleanText(
        candidate
      );


    if (
      value
    ) {

      return value;

    }

  }


  return "";

}


// ============================================================
// SAFE GENERATOR INVOCATION
// ============================================================

async function loadGenerator(
  type
) {

  if (
    type ===
    "pdf"
  ) {

    const module =
      await import(
        "./generators/pdfGenerator.js"
      );

    return (
      module.generatePDF ||
      module.default
    );

  }


  if (
    type ===
    "docx"
  ) {

    const module =
      await import(
        "./generators/docxGenerator.js"
      );

    return (
      module.generateDOCX ||
      module.default
    );

  }


  if (
    type ===
    "xlsx"
  ) {

    try {

      const module =
        await import(
          "./generators/xlsxGenerator.js"
        );

      return (
        module.generateXLSX ||
        module.default
      );

    } catch {

      return null;

    }

  }


  if (
    type ===
    "pptx"
  ) {

    try {

      const module =
        await import(
          "./generators/pptxGenerator.js"
        );

      return (
        module.generatePPTX ||
        module.default
      );

    } catch {

      return null;

    }

  }


  return null;

}


// ============================================================
// FALLBACK FILE GENERATORS
// ============================================================

function createFallbackTextFile(
  type,
  content
) {

  const filename =
    `truvora-${type}-${Date.now()}.${type}`;


  const outputPath =
    absoluteUploadPath(
      filename
    );


  fs.writeFileSync(
    outputPath,
    content,
    "utf8"
  );


  return {

    filename,

    path:
      outputPath,

    url:
      publicUploadUrl(
        filename
      ),

  };

}


function createHTMLFile(
  content
) {

  const filename =
    `truvora-${Date.now()}.html`;


  const outputPath =
    absoluteUploadPath(
      filename
    );


  const html =
`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Truvora Document</title>
<style>
body {
  font-family: Arial, sans-serif;
  max-width: 900px;
  margin: 40px auto;
  padding: 20px;
  line-height: 1.7;
}
pre {
  white-space: pre-wrap;
}
</style>
</head>
<body>
<pre>${escapeHtml(
  content
)}</pre>
</body>
</html>`;


  fs.writeFileSync(
    outputPath,
    html,
    "utf8"
  );


  return {

    filename,

    path:
      outputPath,

    url:
      publicUploadUrl(
        filename
      ),

  };

}


function escapeHtml(
  value
) {

  return String(
    value
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}
// ============================================================
// DOCUMENT GENERATION
// ============================================================

async function generateDocumentFile(
  type,
  content,
  options = {}
) {

  const normalizedType =
    normalizeDocumentType(
      type
    );


  if (
    !normalizedType
  ) {

    throw new Error(
      "Unsupported document type."
    );

  }


  const documentContent =
    cleanText(
      content
    );


  if (
    !documentContent
  ) {

    throw new Error(
      "Document content is empty."
    );

  }


  // ----------------------------------------------------------
  // HTML
  // ----------------------------------------------------------

  if (
    normalizedType ===
    "html"
  ) {

    return createHTMLFile(
      documentContent
    );

  }


  // ----------------------------------------------------------
  // MARKDOWN
  // ----------------------------------------------------------

  if (
    normalizedType ===
    "md"
  ) {

    return createFallbackTextFile(
      "md",
      documentContent
    );

  }


  // ----------------------------------------------------------
  // TEXT
  // ----------------------------------------------------------

  if (
    normalizedType ===
    "txt"
  ) {

    return createFallbackTextFile(
      "txt",
      documentContent
    );

  }


  // ----------------------------------------------------------
  // JSON
  // ----------------------------------------------------------

  if (
    normalizedType ===
    "json"
  ) {

    let jsonContent;


    try {

      jsonContent =
        JSON.stringify(
          {
            truvora: true,

            generatedAt:
              new Date().toISOString(),

            content:
              documentContent,
          },

          null,

          2
        );

    } catch {

      jsonContent =
        JSON.stringify(
          {
            content:
              documentContent,
          },

          null,

          2
        );

    }


    return createFallbackTextFile(
      "json",
      jsonContent
    );

  }


  // ----------------------------------------------------------
  // XML
  // ----------------------------------------------------------

  if (
    normalizedType ===
    "xml"
  ) {

    const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<truvora>
  <generatedAt>${escapeXml(
    new Date().toISOString()
  )}</generatedAt>
  <content>${escapeXml(
    documentContent
  )}</content>
</truvora>`;


    return createFallbackTextFile(
      "xml",
      xml
    );

  }


  // ----------------------------------------------------------
  // RTF
  // ----------------------------------------------------------

  if (
    normalizedType ===
    "rtf"
  ) {

    const rtfText =
      documentContent
        .replace(
          /\\/g,
          "\\\\"
        )
        .replace(
          /{/g,
          "\\{"
        )
        .replace(
          /}/g,
          "\\}"
        )
        .replace(
          /\r?\n/g,
          "\\par "
        );


    const rtf =
`{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Arial;}}
\\f0\\fs24 ${rtfText}
}`;


    return createFallbackTextFile(
      "rtf",
      rtf
    );

  }


  // ----------------------------------------------------------
  // GENERATOR-BASED FORMATS
  // ----------------------------------------------------------

  const generator =
    await loadGenerator(
      normalizedType
    );


  if (
    !generator
  ) {

    throw new Error(
      `The ${normalizedType.toUpperCase()} generator is not available.`
    );

  }


  /*
   * IMPORTANT:
   *
   * The old server called the generators with an undefined
   * output path. That caused:
   *
   * ERR_INVALID_ARG_TYPE
   *
   * We ALWAYS create a real output path here.
   */

  const extension =
    normalizedType;


  const filename =
    `truvora-${normalizedType}-${Date.now()}.${extension}`;


  const outputPath =
    absoluteUploadPath(
      filename
    );


  /*
   * Different generator versions can use different
   * argument shapes.
   *
   * We first try the object form used by the newer
   * Truvora generator implementations.
   */

  let generated;


  try {

    generated =
      await generator({

        content:
          documentContent,

        text:
          documentContent,

        summary:
          documentContent,

        analysis:
          documentContent,

        outputPath,

        path:
          outputPath,

        filePath:
          outputPath,

        filename,

      });

  } catch (
    firstError
  ) {

    console.warn(
      `${normalizedType.toUpperCase()} generator object call failed:`,
      firstError?.message
    );


    /*
     * Compatibility fallback for generators that expect
     * positional arguments.
     */

    try {

      generated =
        await generator(
          documentContent,
          outputPath
        );

    } catch (
      secondError
    ) {

      console.error(
        `${normalizedType.toUpperCase()} GENERATOR ERROR:`,
        secondError
      );

      throw secondError;

    }

  }


  /*
   * Some generators return a path.
   * Others simply write to the path supplied above.
   */

  let finalPath =
    null;


  if (
    typeof generated ===
    "string"
  ) {

    finalPath =
      generated;

  } else {

    finalPath =
      generated?.path ||
      generated?.filePath ||
      generated?.outputPath ||
      generated?.filename
        ? (
            generated?.path ||
            generated?.filePath ||
            generated?.outputPath ||
            path.join(
              GENERATED_DIR,
              generated.filename
            )
          )
        : outputPath;

  }


  /*
   * If the returned path is relative, resolve it.
   */

  if (
    finalPath &&
    !path.isAbsolute(
      finalPath
    )
  ) {

    finalPath =
      path.resolve(
        __dirname,
        finalPath
      );

  }


  /*
   * If generator didn't actually create the file,
   * fail clearly instead of returning a broken download.
   */

  if (
    !finalPath ||
    !fs.existsSync(
      finalPath
    )
  ) {

    throw new Error(
      `${normalizedType.toUpperCase()} generator did not create a file. Expected: ${outputPath}`
    );

  }


  const finalFilename =
    path.basename(
      finalPath
    );


  return {

    filename:
      finalFilename,

    path:
      finalPath,

    url:
      publicUploadUrl(
        finalFilename
      ),

  };

}


// ============================================================
// XML ESCAPE
// ============================================================

function escapeXml(
  value
) {

  return String(
    value
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&apos;"
    );

}


// ============================================================
// GENERATE DOCUMENT ROUTE
// ============================================================

app.post(
  "/generate-document",
  async (
    req,
    res
  ) => {

    try {

      const type =
        normalizeDocumentType(
          req.body?.type
        );


      if (
        !type
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "Unsupported document type.",

            supportedTypes: [

              "pdf",
              "docx",
              "xlsx",
              "pptx",
              "html",
              "md",
              "txt",
              "json",
              "xml",
              "rtf",

            ],

          });

      }


      const content =
        getDocumentContent(
          req.body
        );


      if (
        !content
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            error:
              "No content was supplied for document generation.",

          });

      }


      console.log(
        "TRUVORA DOCUMENT:",
        type
      );


      const generated =
        await generateDocumentFile(
          type,
          content,
          req.body
        );


      return res.json({

        success:
          true,

        type,

        filename:
          generated.filename,

        filePath:
          generated.path,

        url:
          generated.url,

        downloadUrl:
          generated.url,

        fileUrl:
          generated.url,

      });

    } catch (
      error
    ) {

      console.error(
        "TRUVORA DOCUMENT GENERATION ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          error:
            error?.message ||
            "Document generation failed.",

        });

    }

  }
);


// ============================================================
// GENERATED FILE CLEANUP
// ============================================================

function cleanupGeneratedFiles() {

  try {

    if (
      !fs.existsSync(
        GENERATED_DIR
      )
    ) {

      return;

    }


    const now =
      Date.now();


    const MAX_AGE =
      24 *
      60 *
      60 *
      1000;


    const files =
      fs.readdirSync(
        GENERATED_DIR
      );


    for (
      const filename of files
    ) {

      const filePath =
        path.join(
          GENERATED_DIR,
          filename
        );


      try {

        const stats =
          fs.statSync(
            filePath
          );


        if (
          now -
            stats.mtimeMs >
          MAX_AGE
        ) {

          fs.unlinkSync(
            filePath
          );

        }

      } catch (
        fileError
      ) {

        console.warn(
          "Cleanup skipped:",
          filename,
          fileError.message
        );

      }

    }

  } catch (
    cleanupError
  ) {

    console.warn(
      "Generated-file cleanup error:",
      cleanupError.message
    );

  }

}


// ============================================================
// PERIODIC CLEANUP
// ============================================================

setInterval(
  cleanupGeneratedFiles,
  60 *
    60 *
    1000
);


// ============================================================
// 404 HANDLER
// ============================================================

app.use(
  (
    req,
    res
  ) => {

    res
      .status(404)
      .json({

        success:
          false,

        error:
          `Route not found: ${req.method} ${req.originalUrl}`,

      });

  }
);


// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "TRUVORA GLOBAL ERROR:",
      error
    );


    if (
      res.headersSent
    ) {

      return next(
        error
      );

    }


    return res
      .status(
        error?.status ||
        500
      )
      .json({

        success:
          false,

        error:
          error?.message ||
          "Internal server error.",

      });

  }
);


// ============================================================
// START SERVER
// ============================================================

const server =
  app.listen(
    PORT,
    "0.0.0.0",
    () => {

      console.log(
        "=============================================="
      );

      console.log(
        "🚀 TRUVORA GLOBAL AI SERVER ONLINE"
      );

      console.log(
        `Local:   http://localhost:${PORT}`
      );

      console.log(
        `Network: http://0.0.0.0:${PORT}`
      );

      console.log(
        "=============================================="
      );

    }
  );


// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

function shutdown(
  signal
) {

  console.log(
    `\n${signal} received. Shutting down Truvora...`
  );


  server.close(
    () => {

      console.log(
        "Truvora server stopped."
      );

      process.exit(
        0
      );

    }
  );


  setTimeout(
    () => {

      process.exit(
        1
      );

    },
    10000
  );

}


process.on(
  "SIGINT",
  () =>
    shutdown(
      "SIGINT"
    )
);


process.on(
  "SIGTERM",
  () =>
    shutdown(
      "SIGTERM"
    )
);


// ============================================================
// UNHANDLED ERRORS
// ============================================================

process.on(
  "unhandledRejection",
  error => {

    console.error(
      "UNHANDLED PROMISE REJECTION:",
      error
    );

  }
);


process.on(
  "uncaughtException",
  error => {

    console.error(
      "UNCAUGHT EXCEPTION:",
      error
    );

  }
);