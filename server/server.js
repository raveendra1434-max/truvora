import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
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
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobe.path);
const app = express();
let documentContext = "";
let projectMemory = {};
app.use(cors());

app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));
app.use("/uploads", express.static("uploads"));


/* UPLOADS FOLDER */

if (!fs.existsSync("uploads")) {

  fs.mkdirSync("uploads");
}



/* MULTER */

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
          "uploads/"
        );
      },

    filename:
      function (
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



/* STATIC IMAGES */

app.use(
  "/uploads",

  express.static(
    "uploads"
  )
);


/* OPENAI */
const openai =
  new OpenAI({

    apiKey:
      process.env.OPENAI_API_KEY,
  });

  /* GEMINI */
const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function askGemini(prompt) {
  const interaction = await gemini.interactions.create({
    model: "gemini-3.6-flash",
    input: prompt,
  });

  return interaction.output_text;
}


// ==========================================
// TRUVORA AI COST-SAVING ROUTER
// ==========================================

async function askTruvoraAgent(prompt, task) {
  const text = String(prompt || "").toLowerCase();

  // Complex tasks stay with OpenAI
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

  const isComplex = complexKeywords.some(
    keyword => text.includes(keyword)
  );

  // ==========================================
  // OPENAI FOR COMPLEX TASKS
  // ==========================================

  if (isComplex) {
    console.log("🔵 AI ROUTER: OPENAI");

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
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
`
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return (
      response.choices?.[0]?.message?.content?.trim() ||
      prompt
    );
  }

  // ==========================================
  // GEMINI FOR NORMAL / LOWER-COST TASKS
  // ==========================================

  try {
    console.log("🟢 AI ROUTER: GEMINI");

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

    const result = await askGemini(geminiPrompt);

    if (result && result.trim()) {
      return result.trim();
    }

    throw new Error("Gemini returned an empty response");

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
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: `
You are Truvora's document-generation agent.

Generate useful content for a ${task} file.

Return only the document content.
`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

    return (
      response.choices?.[0]?.message?.content?.trim() ||
      prompt
    );
  }
}


/* IMAGE UPLOAD ROUTE */

app.post(
  "/upload-image",

  upload.single("image"),

  async (
    req,
    res
  ) => {

    try {

      const imageUrl =
        `http://localhost:5000/uploads/${req.file.filename}`;

      res.json({
        imageUrl,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        error:
          "Image upload failed",
      });
    }
  }
);
app.post("/analyze-image", async (req, res) => {
  try {
    const { image } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image professionally.

Generate a well-structured report using these sections:

Title

Overview

Detailed Analysis

Key Objects

Colors and Lighting

Environment

Important Observations

Conclusion

Write professionally using proper paragraphs and headings.

Do not use markdown symbols like ** or #.`
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

    res.json({
      answer: response.choices[0].message.content
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Image analysis failed"
    });
  }
});

async function extractFrame(videoPath, outputImage) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ["2", "5", "8", "12", "16"],
        filename: "frame-%i.png",
        folder: "uploads",
        size: "1280x?"
      })
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });
}
async function getMediaDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(metadata.format.duration);
    });
  });
}
async function splitAudioIntoChunks(inputFile) {
  return new Promise((resolve, reject) => {
    const outputPattern = "uploads/chunk-%03d.mp3";

    ffmpeg(inputFile)
      .outputOptions([
  "-f segment",
  "-segment_time 600",
  "-c:a libmp3lame",
  "-b:a 192k",
])
      .output(outputPattern)
      .on("end", () => {
        const chunks = fs
          .readdirSync("uploads")
          .filter((file) => file.startsWith("chunk-"))
          .map((file) => `uploads/${file}`);

        resolve(chunks);
      })
      .on("error", reject)
      .run();
  });
}
app.post("/analyze-youtube", async (req, res) => {
  try {
    console.log("🔥 NEW YOUTUBE ANALYSIS REQUEST");
    const { url } = req.body;
console.log("YOUTUBE URL RECEIVED:", url);
    if (!url) {
      return res.status(400).json({
        success: false,
        error: "YouTube URL is required",
      });
    }

    let text = "";

try {
  const videoId = url.match(
  /(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/
)?.[1];

if (!videoId) {
  return res.status(400).json({
    success: false,
    error: "Invalid YouTube URL"
  });
}

console.log("YOUTUBE VIDEO ID:", videoId);


  const subtitleFile = `youtube-${videoId}.en.vtt`;
const outputTemplate = `youtube-${videoId}.%(ext)s`;

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
      encoding: "utf8",
      stdio: "pipe",
    }
  );

  const subtitleText = fs.readFileSync(subtitleFile, "utf8");

  text = subtitleText
  .replace(/^WEBVTT.*$/gm, "")
  .replace(/^Kind:.*$/gm, "")
  .replace(/^Language:.*$/gm, "")
  .replace(/^\d{2}:\d{2}(?::\d{2})?\.\d{3} --> .*$/gm, "")
  .replace(/<[^>]*>/g, "")
  .replace(/\r?\n+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

console.log("✅ FINAL TRANSCRIPT LENGTH:", text.length);
console.log(
  "✅ FINAL TRANSCRIPT PREVIEW:",
  text.substring(0, 500)
);

  fs.unlinkSync(subtitleFile);

  console.log("✅ YouTube subtitles extracted:", text.length, "characters");

} catch (err) {
  console.error("YouTube subtitle extraction failed:", err);

  return res.status(200).json({
    success: false,
    error: "This YouTube video does not have an accessible transcript. Please try another video."
  });
}

const transcriptForAI = text.trim();

console.log("TRANSCRIPT SENT TO AI:", transcriptForAI.length);
console.log("AI TRANSCRIPT PREVIEW:", transcriptForAI.substring(0, 300));

let analysis;

try {
  analysis = await askGemini(
    `You are Truvora AI, a professional learning and knowledge assistant.

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

Now analyze the transcript above. Do not ask the user to provide a transcript.
`
);

} catch (error) {
  console.error("YouTube AI analysis failed:", error);
  throw error;
}
console.log("TRANSCRIPT LENGTH BEFORE GEMINI:", text.length);
console.log("TRANSCRIPT PREVIEW:", text.substring(0, 500));
console.log("YOUTUBE ANALYSIS READY:", analysis);
    res.json({
  success: true,
  transcript: text,
  analysis,
});

  } catch (error) {
    console.error("YouTube Error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
      }
  });
/* VIDEO ANALYSIS ROUTE */
console.log("VIDEO ROUTE LOADED");
app.post(
  "/upload-video",

  upload.single("video"),

  async (req, res) => {

    try {

      const videoUrl =
        `http://localhost:5000/uploads/${req.file.filename}`;
        const type = req.body.type || "video";
const videoPath = `uploads/${req.file.filename}`;
const frameName = "frame-1.png";

await extractFrame(videoPath, frameName);

const frameUrl =
  `http://localhost:5000/uploads/${frameName}`;
  const frameBase64 = fs.readFileSync(
  `uploads/${frameName}`,
  {
    encoding: "base64",
  }
);
      // For now, return a placeholder analysis.
      // In the next step we'll replace this with AI analysis.

      const response = await openai.chat.completions.create({
  model: "gpt-4.1",
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Describe this video frame in detail."
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${frameBase64}`
          }
        }
      ]
    }
  ]
});

const summary =
  response.choices[0].message.content;
const analysis = summary;


  "Review this AI-generated report before making important decisions.";
if (
  req.body.type &&
  ["pdf", "docx", "xlsx", "csv", "pptx", "html", "md", "txt", "json", "xml", "rtf", "odt"].includes(req.body.type)
) {

  const file =
  await generatePDF({
    type: req.body.type,
    summary,
    title: "AI Analysis Report"
  });

  return res.json({
  videoUrl,
  frameUrl,
  summary,
  type,
  document: `http://localhost:5000${file}`,
});
}

res.json({
  videoUrl,
  frameUrl,
  summary,
});

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error: "Video upload failed"
      });

    }

  }

);

app.post(
  "/upload-audio",

  upload.single("audio"),

  async (req, res) => {

    try {

      const audioUrl =
        `http://localhost:5000/uploads/${req.file.filename}`;
const duration =
  await getMediaDuration(req.file.path);

console.log(
  "Audio Duration:",
  duration,
  "seconds"
);
      const chunks = await splitAudioIntoChunks(req.file.path);

let transcript = "";

for (const chunk of chunks) {
  const transcription =
    await openai.audio.transcriptions.create({
      file: fs.createReadStream(chunk),
      model: "whisper-1",
    });

  transcript += transcription.text + "\n";
}
// for (const chunk of chunks) {
//   if (fs.existsSync(chunk)) {
//     fs.unlinkSync(chunk);
//   }
// }
const completion =
  await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
  role: "system",
  content: `You are Truvora AI.

Analyze the audio transcript professionally.

Return your answer in exactly this format:

🌍 Language
(Name of the detected language)

🌐 English Translation
(Translate to English if needed. If already English, write "Already in English.")

😊 Sentiment
(Positive, Negative, Neutral or Mixed)

📋 Summary
(3-5 sentences)

📌 Key Points
• Point 1
• Point 2
• Point 3

🎯 Action Items
(If there are no action items, write "None.")`,
},
      {
        role: "user",
        content: transcript,
      },
    ],
  });

const summary = `🎤 Transcript:

${transcript}

📋 AI Summary:

${completion.choices[0].message.content}`;

      res.json({
        audioUrl,
        summary,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error: "Audio upload failed",
      });

    }

  }

);

/* WEBSITE ANALYSIS ROUTE */


/* MAIN AI ROUTE */

app.post("/ask", async (req, res) => {
  try {
let {
  message,
  history,
  web,
  agentMode,
  imageUrl,
  language,
} = req.body;
const userId = "default-user";
const memory = getMemory(userId);
const projectMemory = memory.projects || {};
const truvoraProject = projectMemory.truvora;
console.log("PROJECT MEMORY:", truvoraProject);
console.log("MEMORY LOADED:");
console.log(memory);
console.log("LANGUAGE:", language);
let responseLanguage = language;

if (
  !responseLanguage ||
  responseLanguage === "auto"
) {
  responseLanguage = "Auto Detect";
}

console.log("RESPONSE LANGUAGE:", responseLanguage);
let autoWeb = false;
console.log("==============");
console.log("WEB VALUE:", web);
console.log("==============");
const lowerMessage = message.toLowerCase();
console.log("🤖 MESSAGE SENT TO AGENT:", JSON.stringify(message));
const agentTasks = detectAgentTasks(message);

console.log("AGENT TASKS:", agentTasks);
// ===============================
// AGENT MODE TASK EXECUTION
// ===============================
// ==========================================
// AUTOMATIC AGENT TASK EXECUTION
// ==========================================

if (agentTasks.length > 0) {
  console.log("🤖 AUTOMATIC AGENT MODE");
  console.log("🤖 TASKS:", agentTasks);

  const agentResults = [];

  for (const task of agentTasks) {
    try {
      const reportId = Date.now().toString();
      const outputPath = `./uploads/${reportId}.${task}`;

      console.log("🤖 EXECUTING:", task);



const generatedContent = await askTruvoraAgent(
  message,
  task
);

console.log("🤖 GENERATED CONTENT:");
console.log(generatedContent);
      const result = await executeAgentTask({
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
        generateMarkdown,
        generateTXT,
        generateJSON,
        generateXML,
        generateRTF,
        generateODT,
      });

      agentResults.push({
  ...result,
  summary: generatedContent,
});

      console.log("✅ AGENT CREATED:", result);
    } catch (error) {
      console.error("❌ AGENT TASK FAILED:", task, error);

      agentResults.push({
        success: false,
        type: task,
        error: error.message,
      });
    }
  }

  const successful = agentResults.filter(
    (result) => result.success
  );

  return res.json({
  success: successful.length > 0,
  agentMode: true,
  tasks: agentTasks,
  documents: successful,
  reply:
    successful.length > 0
      ? `✅ ${successful.map((item) => item.type.toUpperCase()).join(", ")} created successfully.\n\n${successful.map((item) => item.summary || "").join("\n\n")}`
      : "❌ Agent could not create the requested file.",
  sources: [],
});
}
const analysis = await analyzeQuestion(message, openai);

console.log("QUESTION ANALYSIS:", analysis);

// Always use web search when the user enables it,
// otherwise use the analyzer.
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
  "updates"
];

const needsCurrentInfo =
  currentInfoWords.some(word =>
    lowerMessage.includes(word)
  );

autoWeb =
  web ||
  (
    (analysis.needsWeb || needsCurrentInfo) &&
    !projectMemory.truvora &&
    !lowerMessage.includes("continue truvora")
  );
if (
  lowerMessage.includes("continue truvora")
) {

  const project =
  projectMemory.truvora;
console.log("PROJECT:", project);
   {if (!project)
    return res.json({
      reply:
        "No project found. Start a project first."
    });
  }
}
const consultationWords = [
  "start a company",
  "start a business",
  "build a website",
  "create a website",
  "create an app",
  "build an app",
  "launch a startup",
  "build a project",
  "help me create",
  "i want to start",
  "i want to build",
  "i want to create"
];

if (lowerMessage.includes("website")) {
  return res.json({
    reply: `🌐 Website Project

Before I help, tell me:

1. What type of website? (Business, Blog, Portfolio, Ecommerce)
2. Do you want coding or no-code?
3. What is your budget?`
  });
}

if (lowerMessage.includes("company") || lowerMessage.includes("business")) {
  return res.json({
    reply: `🏢 Business Project

Before I help, tell me:

1. What business do you want to start?
2. Which country?
3. What is your budget?`
  });
}

if (
  lowerMessage === "app" ||
  lowerMessage.startsWith("build app") ||
  lowerMessage.startsWith("create app")
) {
  return res.json({
    reply: `📱 App Project

Before I help, tell me:

1. Android, iPhone, or both?
2. What should the app do?
3. What is your budget?`
  });
}

if (
  consultationWords.some(word =>
    lowerMessage.includes(word)
  )
) {
  return res.json({
    reply: `🚀 Great! I can help.

1. What exactly do you want to build?
2. What is your budget?
3. What is your goal?`
  });
}
    let webResults = "";
let results = "";
let citations = [];
/* IMAGE GENERATION */

const imageWords = [
  "image",
  "generate image",
  "generate an image",
  "create image",
  "create an image",
  "make image",
  "make an image",
  "show image",
"image of",
"picture of",
"photo of",
  "draw",
  "paint",
  "illustrate",
  "logo",
  "wallpaper",
  "poster",
  "thumbnail"
];

const wantsImage = imageWords.some((word) =>
  lowerMessage.includes(word)
);
/* DOCUMENT GENERATION */

const wantsPdf =
lowerMessage.includes("pdf");

const wantsDocx =
lowerMessage.includes("docx") ||
lowerMessage.includes("word");

const wantsExcel =
lowerMessage.includes("excel") ||
lowerMessage.includes("xlsx") ||
lowerMessage.includes("sheet");

const wantsPpt =
lowerMessage.includes("powerpoint") ||
lowerMessage.includes("ppt") ||
lowerMessage.includes("presentation");
    /* WEB SEARCH */
    if (web || autoWeb) {
      try {
        const search = await axios.get(
          "https://serpapi.com/search.json",
          {
            params: {
              q: message,
              api_key: process.env.SERPAPI_KEY,
            },
          }
        );

        results = "";

if (search.data.answer_box) {
  results +=
    "ANSWER BOX:\n" +
    JSON.stringify(search.data.answer_box) +
    "\n\n";
}

if (search.data.organic_results) {
  citations = search.data.organic_results
  .slice(0, 8)
  .map((item, index) => ({
    id: index + 1,
    title: item.title,
    url: item.link,
    snippet: item.snippet || "",
    source: new URL(item.link).hostname.replace("www.", ""),
    favicon: `https://www.google.com/s2/favicons?domain=${new URL(item.link).hostname}&sz=64`,
  }));
  results += search.data.organic_results
  .slice(0, 5)
  .map((item, index) => {
    return `
[${index + 1}] ${item.title}

${item.snippet}

URL: ${item.link}
`;
  })
  .join("\n");
}
        webResults = `
LIVE WEB DATA:

${results}
`;


        console.log("WEB RESULTS:");
        console.log(webResults);

      } catch (webError) {
        console.log("WEB SEARCH ERROR:");
        console.log(
          webError.response?.data ||
          webError.message
        );
      }
    }   
     let systemPrompt = `
You are Truvora AI.
Language Instructions:

- If responseLanguage === "Auto Detect":
  Detect the language of the user's message automatically.
  Reply completely in that same language.
  Never translate unless the user explicitly asks.

- Otherwise:
  Reply completely in ${responseLanguage}.
  Never mix languages.
Your mission is to help users understand, learn, build, solve problems, and complete projects.



1. Always answer in simple, clear human language.
2. Give the direct answer first.
3. Explain things step-by-step.
4. Assume the user is a beginner unless they request expert details.
5. Never use complicated words when simpler words work.
6. Never invent facts, sources, statistics, dates, or information.
7. If you are uncertain, clearly say so.
8. If live web data is available, use it as the primary source.
9. Focus on helping users complete their goal.
10. Remember the conversation context.
11. Be friendly, professional, and easy to understand.
12. For coding, provide working solutions and explain them clearly.
13. For research, summarize first, then provide details.
14. For documents, answer based on the document contents.
15. For projects, act like a project assistant and continue work logically.
16. Before answering, identify exactly what the user is asking.
17. If multiple reliable answers exist, compare them and recommend the best one with a reason.
18. Think carefully before responding, but do not reveal your internal reasoning. Only provide the final answer.
19. Verify the user's intent before answering.
20. When web search is OFF, rely on your own knowledge and reasoning to provide the most accurate answer possible.
21. Never guess facts. If uncertain, clearly state the uncertainty instead of inventing information.
22. For factual questions, prioritize correctness over confidence.
23. For technical questions, think through the solution carefully before writing the answer.
24. For coding questions, generate complete, production-ready code whenever possible.
25. If multiple solutions exist, compare them briefly and recommend the best one with a reason.
26. Maintain context from the conversation and continue ongoing projects naturally.
27. Give practical, actionable advice rather than generic explanations.
28. Adapt the level of detail to the user's experience.
29. Do not repeat information unnecessarily.
30. Always optimize for accuracy, usefulness, and clarity.
RESPONSE STYLE:

Choose the best response format automatically.

- For simple questions:
  Give a short direct answer.

- For explanations:
  Use:
  ✅ Quick Answer
  📖 Explanation

- For tutorials or how-to questions:
  Use:
  ✅ Quick Answer
  📖 Explanation
  🛠 Steps
  ➡️ Next Step

- For coding:
  Explain briefly, then provide complete working code.

- For comparisons:
  Use a comparison table when helpful.

- For planning or projects:
  Provide a clear step-by-step plan with priorities.

Do not force sections that are unnecessary.
Keep answers natural, concise, and easy to read.
RULES:

- Provide complete, in-depth answers by default. Only keep answers concise when the user explicitly requests a brief answer.
- Avoid huge walls of text.
- Use short paragraphs.
- Use bullet points.
- Focus on the most useful information first.
- Recommend the best solution when multiple options exist.
- Make answers easy for beginners.
- Unless the user specifically asks for a short answer, always provide a complete, detailed explanation with headings, examples, key points, and a conclusion.
- Adapt the response structure automatically.

Examples:

News:
✅ Quick Summary
📖 Detailed Coverage
🌍 Why It Matters
📊 Key Facts

Technology:
✅ Overview
⚙️ How It Works
💡 Features
🌍 Real-world Uses
⚠️ Limitations

Coding:
✅ Solution
💻 Code
📝 Explanation
🛠 Best Practices

Travel:
📍 Overview
🗺 Places
💰 Budget
🍽 Food
🏨 Hotels

Health:
✅ Overview
🔍 Causes
💊 Treatment
⚠️ Prevention

Only include sections that are relevant to the user's question. Never force unnecessary headings.

- Use headings and formatting to improve readability.

- If live web data exists, combine it with your own knowledge instead of only summarizing the search results.
If LIVE WEB DATA is provided:
- Use it as the primary source.
- Never ignore verified web results.
- Use LIVE WEB DATA as the primary source whenever it is available.
- Every factual statement from web results must end with an inline citation like [1], [2], [3].
- Number citations in the same order as the Sources array.
- Never invent citations or sources.
- Never include raw URLs inside the answer.
- Do not print a Sources section in the answer because the frontend will display professional source cards automatically.
- If no web results exist, answer normally without citation numbers.
- Focus on answering the user's question clearly and accurately.
Your goal is not just answering questions.
Your goal is helping users successfully complete tasks and projects.
Always act like a personal assistant.

For questions about business, coding, projects, websites, learning, planning, startups, companies, products, or goals:

IMPORTANT:

First determine whether you already have enough information.

If the user's request is clear, answer immediately.

Only ask clarifying questions when they are genuinely required to produce a correct answer.

Never delay simple questions by asking unnecessary questions.

For ongoing projects, continue from the existing conversation whenever possible.

If assumptions are necessary, state them clearly instead of refusing to answer.

Act like an experienced consultant, engineer, researcher, and project partner.

Your goal is to help users complete their work efficiently while remaining accurate.
`;
  
const isContinueTruvora =
  message.toLowerCase().trim() === "continue truvora";
  const originalMessage = message;
    let userContent = "";
    if (
  isContinueTruvora &&
  truvoraProject &&
  truvoraProject.nextStep
) {
  console.log("CONTINUING TRUVORA FROM SAVED NEXT STEP...");
  message = truvoraProject.nextStep;
}

if (webResults) {
  userContent += `
==========================
LIVE WEB DATA
==========================

The following sources are already numbered.

When using information from them:

- End each factual statement with the correct citation number.
- Example:
  OpenAI released a new model.[1]
  Reuters reported market changes.[2]

Never invent citation numbers.

${webResults}

==========================
END OF LIVE WEB DATA
==========================
`;
}
 if (
  documentContext &&
  (
    message.toLowerCase().includes("document") ||
    message.toLowerCase().includes("pdf") ||
    message.toLowerCase().includes("file") ||
    message.toLowerCase().includes("summarize") ||
    message.toLowerCase().includes("summary")
  )
) {
  userContent += `
DOCUMENT DATA:

${documentContext.substring(0, 15000)}

--------------------

`;
}

if (imageUrl) {
  userContent += `
User uploaded an image.
`;
}

userContent += `
IMPORTANT LANGUAGE INSTRUCTION:

The selected language from the application is the user's required response language.

Always answer the user's current question in the selected language.

Do NOT require the user to explicitly request the language again.

The selected language applies to EVERY response until the user changes the language selector.

If English is selected, answer in English.

If Kannada is selected, answer in Kannada.
If Telugu is selected, answer in Telugu.
If Hindi is selected, answer in Hindi.
If Tamil is selected, answer in Tamil.
If Malayalam is selected, answer in Malayalam.
If Spanish is selected, answer in Spanish.
If another language is selected, answer in that language.

User Request:

${message}

User Request:

${message}

`;

if (
  isContinueTruvora &&
  truvoraProject?.lastAIReply
) {
  userContent += `

PREVIOUS AI REPLY:

${truvoraProject.lastAIReply}

Continue from exactly where the previous reply ended.

Do NOT repeat previous content.
Do NOT restart.
Only continue with the next unfinished step.

`;
}
console.log("FINAL USER CONTENT:");
console.log(userContent);
/* IMAGE REQUEST */
console.log("IMAGE DETECTION:", wantsImage);
console.log("USER MESSAGE:", lowerMessage);
if (wantsImage) {

  const image = await openai.images.generate({
  model: "gpt-image-1",
  prompt: message,
  size: "1024x1024",
});

const base64 = image.data[0].b64_json;
console.log("BASE64 EXISTS:", !!base64);
console.log("BASE64 LENGTH:", base64.length);
const buffer = Buffer.from(base64, "base64");
console.log("BUFFER LENGTH:", buffer.length);
const fileName = `truvora-${Date.now()}.png`;

fs.writeFileSync(`uploads/${fileName}`, buffer);

return res.json({
  reply: "✅ Image generated successfully.",
  image: `/uploads/${fileName}`,
});

}
/* DOCUMENT CREATION */

if (
  wantsPdf ||
  wantsDocx ||
  wantsExcel ||
  wantsPpt
) {

  let type = "pdf";

  if (wantsDocx) type = "docx";
  if (wantsExcel) type = "xlsx";
  if (wantsPpt) type = "pptx";

  // Generate full AI content first

const documentCompletion =
  await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
content: `
You are a professional technical writer.

Write a complete professional document.

Rules:

- Output ONLY the final document.
- Never say "Below is..."
- Never say "You can use this..."
- Never explain what you are doing.
- Do not mention formatting instructions.
- Write as if this is the final published document.

Structure:

Title

Table of Contents

Introduction

Detailed chapters

Examples where appropriate

Advantages

Disadvantages

Applications

Future Scope

Conclusion

If the user asks for a specific number of pages (for example 20 pages or 50 pages), generate enough detailed content to approximately fill that many pages.

Return plain text only.
`,
      },
      {
        role: "user",
      content: `
User request:

${message}

IMPORTANT:

Start directly with the document.

Do NOT say:
- Creating...
- I cannot...
- Below is...
- You can use...
- This can be converted...
- Ready for conversion...

Return ONLY the finished document.
`,
      },
    ],
  });

const fullContent =
  documentCompletion.choices[0].message.content;
  console.log("================================");
console.log("FULL CONTENT:");
console.log(fullContent);
console.log("================================");
const summary = fullContent;

const analysis = fullContent;

const recommendations = `Recommendations

• Verify important information using official sources.

• Review all AI-generated content before making business or legal decisions.

• Use multiple trusted news sources for critical updates.

• Continue monitoring this topic because information may change.
`;
const sources = [
  "https://news.google.com",
  "https://www.reuters.com",
  "https://apnews.com"
];
const reportId = Date.now().toString();
const outputPath = `./uploads/${reportId}.pdf`;
console.log(outputPath);
console.log("SUMMARY BEFORE PDF:");
console.log(summary);

console.log("ANALYSIS BEFORE PDF:");
console.log(analysis);console.log("SUMMARY BEFORE PDF:");
console.log(summary);

console.log("ANALYSIS BEFORE PDF:");
console.log(analysis);
console.log("================================");
console.log("SUMMARY SENT TO PDF:");
console.log(summary);
console.log("SUMMARY LENGTH:", summary.length);

console.log("ANALYSIS SENT TO PDF:");
console.log(analysis);
console.log("ANALYSIS LENGTH:", analysis.length);
console.log("================================");
const report = {
  reportId,

  title: `${type.toUpperCase()} Analysis Report`,

  summary,

  analysis,

  recommendations,

  sources,

  generatedAt: new Date().toISOString(),

  aiEngine: "Truvora AI",

  version: "1.0"
};
const file = await generatePDF({
  outputPath,
  ...report
});
return res.json({
  reply: `✅ ${type.toUpperCase()} created successfully.`,
  document: `http://localhost:5000${file}`,
});

}
const memoryPrompt = `
Known user information:
${JSON.stringify(memory, null, 2)}

Use this information whenever the user asks about themselves.
If the user asks "What is my name?", "Where do I live?", "Where do I work?", etc.,
answer using this stored memory.
`;

const projectPrompt = truvoraProject
  ? `
You are currently working on the user's Truvora project.

Previous Project:

${JSON.stringify(truvoraProject, null, 2)}

When the user says "Continue Truvora":

- Continue from the saved nextStep.
- Never ask what to work on next.
- Never summarize previous replies.
- Continue exactly where the previous response stopped.
- Treat this project as the active project.
- Never end your response with follow-up questions.
- Continue automatically until the current nextStep is fully completed.

IMPORTANT:

Always end every Truvora response with exactly one line in this format:

Next Step: <one short sentence describing the immediate next development task>

Do not omit this line.
Do not write multiple Next Step lines.
This line is for Truvora memory only.
`
  : "";

const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
max_completion_tokens: 12000,
    messages: [
  {
    role: "system",
    content:
systemPrompt +
"\n\n" +
memoryPrompt +
"\n\n" +
projectPrompt +
"\n\nPrevious conversation:\n" +
JSON.stringify(memory.conversations || [])
  },

  ...(history || []).flatMap(chat => {
  const messages = [];

  if (typeof chat.text === "string" && chat.text.trim()) {
  messages.push({
    role: chat.role,
    content: chat.text,
  });
}

  return messages;
}),

  {
  role: "user",
  content: userContent,
},
],
  });
  const reply = completion?.choices?.[0]?.message?.content || "";
    let nextStep = "";

const match = reply.match(/Next Step:\s*(.*)/i);

if (match) {
  nextStep = match[1].trim();
} else {
  nextStep = "";
}

const lines = reply.split("\n");

const nextLine = lines.find(line =>
  line.trim().toLowerCase().startsWith("next step:")
);

if (nextLine) {
  nextStep = nextLine.replace(/next step:/i, "").trim();
}

console.log("NEXT STEP SAVED:", nextStep);
console.log("OPENAI WAS CALLED");
console.log("REPLY CREATED:", reply);
console.log("CALLING MEMORY...");
addConversation(userId, message, reply);
console.log("USER MESSAGE:", message);
if (
  message.toLowerCase().includes("truvora") ||
  message.toLowerCase().startsWith("continue")
) {
  console.log("SAVING TRUVORA PROJECT...");
  console.log("MESSAGE:", message);
  console.log("SAVE PROJECT BLOCK REACHED");
  const history = truvoraProject?.history || [];

history.push({
  user: originalMessage,
  assistant: reply,
  completedAt: new Date().toISOString(),
});

saveProject(userId, "truvora", {
  lastUserMessage: originalMessage,
  lastAIReply: reply,
  currentTask: nextStep || message,
  nextStep,
  history,
  updatedAt: new Date().toISOString(),
});
}
const memoryPatterns = [
  { prefix: "my name is ", key: "name", start: 11 },
  { prefix: "i live in ", key: "city", start: 10 },
  { prefix: "i'm from ", key: "city", start: 9 },
  { prefix: "i work at ", key: "company", start: 10 },
  { prefix: "i am a ", key: "profession", start: 7 },
  { prefix: "i am ", key: "age", start: 5 },
  { prefix: "my email is ", key: "email", start: 12 },
  { prefix: "my phone number is ", key: "phone", start: 19 },
{ prefix: "my favourite color is ", key: "favoriteColor", start: 22 },
{ prefix: "my favorite color is ", key: "favoriteColor", start: 21 },
{ prefix: "my favourite food is ", key: "favoriteFood", start: 21 },
{ prefix: "my favorite food is ", key: "favoriteFood", start: 20 },
{ prefix: "i study at ", key: "college", start: 11 },
{ prefix: "i studied at ", key: "college", start: 13 },
{ prefix: "my hobby is ", key: "hobby", start: 12 },
{ prefix: "my birthday is ", key: "birthday", start: 15 },
{ prefix: "i speak ", key: "language", start: 8 },
];

for (const pattern of memoryPatterns) {
  if (message.toLowerCase().startsWith(pattern.prefix)) {
    saveMemory(
      userId,
      pattern.key,
      message.substring(pattern.start).trim()
    );
  }
}
console.log("MEMORY FUNCTION FINISHED");
console.log("WEB:", web);
console.log("WEB RESULTS LENGTH:", webResults.length);
console.log("RESULTS LENGTH:", results.length);


if (
  message.toLowerCase().includes("android") ||
  message.toLowerCase().includes("iphone") ||
  message.toLowerCase().includes("budget")
) {
  projectMemory["currentProject"] = {
    userMessage: message,
    aiReply: reply,
    updatedAt: new Date(),
  };

  console.log(
    "PROJECT SAVED:",
    projectMemory["currentProject"]
  );
}
console.log("CITATIONS:");
console.log(citations);

res.json({
    reply,
    sources: formatCitations(citations),
});

  } catch (error) {
  console.error("========== SERVER ERROR ==========");
  console.error(error);
  console.error(error.stack);

  res.status(500).json({
    reply: "Server error",
    error: error.message,
  });
}
});

app.post(
  "/analyze-document",
  upload.single("file"),
  async (req, res) => {
    try {
      let text = "";

      const filePath = req.file.path;
      const fileName =
        req.file.originalname.toLowerCase();

      if (fileName.endsWith(".pdf")) {

  const dataBuffer =
    fs.readFileSync(filePath);

  const pdfData =
    await pdfParse(dataBuffer);

  text = pdfData.text;
}

      else if (fileName.endsWith(".docx")) {
        const result =
          await mammoth.extractRawText({
            path: filePath,
          });

        text = result.value;
      }

      else if (
        fileName.endsWith(".xlsx") ||
        fileName.endsWith(".xls")
      ) {
        const workbook =
          XLSX.readFile(filePath);

        workbook.SheetNames.forEach(
          (sheetName) => {
            const sheet =
              workbook.Sheets[sheetName];

            text += JSON.stringify(
              XLSX.utils.sheet_to_json(sheet)
            );
          }
        );
      }

      else {
        return res.status(400).json({
          error:
            "Only PDF, DOCX, XLSX and XLS files are supported",
        });
      }
documentContext = text;
console.log("Document Length:", text.length);
      const completion =
        await openai.chat.completions.create({

          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Analyze this document and provide a detailed summary.",
            },
            {
              role: "user",
              content: text.substring(0, 75000),
            },
          ],
        });

      res.json({
  success: true,
  analysis: completion.choices[0].message.content,
  documentText: text,
});

} catch (error) {
  console.error("================================");
  console.error("DOCUMENT ANALYSIS ERROR");
  console.error(error);
  console.error("================================");

    res.status(500).json({
    error: "Document analysis failed",
  });
}
});   
app.post("/save-project", (req, res) => {
  const { projectName, data } = req.body;

  projectMemory[projectName] = data;

  res.json({
    success: true,
    message: "Project saved",
  });
});

app.get("/project/:name", (req, res) => {
  const project = projectMemory[req.params.name];

  res.json({
    success: true,
    project,
  });
});

app.post("/generate-document", async (req, res) => {

  try {
    console.log("================================");
console.log("GENERATE-DOCUMENT API CALLED");
console.log(req.body);
console.log("================================");
    const {
  type,
  summary,
  recommendations,
  sources
} = req.body;

console.log("REQUEST BODY:");
console.log(req.body);

console.log("REQUEST RECOMMENDATIONS:");
console.log(recommendations);

console.log("REQUEST SOURCES:");
console.log(sources);
    const reportId = Date.now().toString();
    const outputPath = `./uploads/${reportId}.${type}`;

  if (type === "pdf") {
  await generatePDF({
    outputPath,
    reportId,
    title: "AI Analysis Report",
    summary,
    analysis: summary,
    recommendations,
    sources: [
      "https://news.google.com",
      "https://www.reuters.com",
      "https://apnews.com"
    ],
  });
}

if (type === "docx") {
  await generateDOCX({
    outputPath,
    reportId,
    title: "AI Analysis Report",
    summary,
    analysis: summary,
    recommendations,
    sources: [
      "https://news.google.com",
      "https://www.reuters.com",
      "https://apnews.com"
    ],
  });
}
if (type === "xlsx") {
  await generateXLSX({
    outputPath,
    reportId,
    title: "AI Analysis Report",
    summary,
    analysis: summary,
    recommendations,
    sources,
  });
}
if (type === "pptx") {
  await generatePPTX({
    outputPath,
    reportId,
    title: "AI Analysis Report",
    summary,
    analysis: summary,
    recommendations,
    sources,
  });
  console.log("PPT CREATED:", outputPath);
console.log("FILE EXISTS:", fs.existsSync(outputPath));
const stats = fs.statSync(outputPath);

console.log("PPT SIZE:", stats.size, "bytes");
}
if (type === "html") {
  await generateHTML({
  outputPath,
  reportId,
  title: "AI Analysis Report",
  summary,
  analysis: summary,
  recommendations,
  sources,
});

  console.log("HTML CREATED:", outputPath);
  console.log("FILE EXISTS:", fs.existsSync(outputPath));

  const stats = fs.statSync(outputPath);
  console.log("HTML SIZE:", stats.size, "bytes");
}
if (type === "md") {
  await generateMarkdown({
    outputPath,
    reportId,
    title: "AI Analysis Report",
    summary,
    analysis: summary,
    recommendations,
    sources,
  });

  console.log("MARKDOWN CREATED:", outputPath);
  console.log("FILE EXISTS:", fs.existsSync(outputPath));

  const stats = fs.statSync(outputPath);
  console.log("MARKDOWN SIZE:", stats.size, "bytes");
}
if (type === "txt") {
  await generateTXT({
    outputPath,
    reportId,
    title: "AI Analysis Report",
    summary,
    analysis: summary,
    recommendations,
    sources,
  });

  console.log("TXT CREATED:", outputPath);
  console.log("FILE EXISTS:", fs.existsSync(outputPath));

  const stats = fs.statSync(outputPath);
  console.log("TXT SIZE:", stats.size, "bytes");
}
if (type === "csv") {
  await generateCSV({
    outputPath,
    reportId,
    title: "AI Analysis Report",
    summary,
    analysis: summary,
    recommendations,
    sources,
  });
}
if (type === "json") {
  const jsonData = await generateJSON({
    reportId,
    title: "AI Analysis Report",
    summary,
    analysis: summary,
    recommendations,
    sources,
  });

  fs.writeFileSync(
    outputPath,
    JSON.stringify(jsonData, null, 2),
    "utf8"
  );

  console.log("JSON CREATED:", outputPath);
  console.log("FILE EXISTS:", fs.existsSync(outputPath));

  const stats = fs.statSync(outputPath);
  console.log("JSON SIZE:", stats.size, "bytes");
}
if (type === "xml") {
  const xmlData = await generateXML({
    reportId,
    title: "AI Analysis Report",
    summary,
    analysis: summary,
    recommendations,
    sources,
  });

  fs.writeFileSync(outputPath, xmlData, "utf8");

  console.log("XML CREATED:", outputPath);
  console.log("FILE EXISTS:", fs.existsSync(outputPath));

  const stats = fs.statSync(outputPath);
  console.log("XML SIZE:", stats.size, "bytes");
}
if (type === "rtf") {
  const rtfData = await generateRTF({
    reportId,
    title: "AI Analysis Report",
    summary,
    analysis: summary,
    recommendations,
    sources,
  });

  fs.writeFileSync(outputPath, rtfData, "utf8");

  console.log("RTF CREATED:", outputPath);
  console.log("FILE EXISTS:", fs.existsSync(outputPath));

  const stats = fs.statSync(outputPath);
  console.log("RTF SIZE:", stats.size, "bytes");
}
if (type === "odt") {
  const odtData = await generateODT({
    reportId,
    title: "AI Analysis Report",
    summary,
    analysis: summary,
    recommendations,
    sources,
  });

  fs.writeFileSync(outputPath, odtData, "utf8");

  console.log("ODT CREATED:", outputPath);
  console.log("FILE EXISTS:", fs.existsSync(outputPath));

  const stats = fs.statSync(outputPath);
  console.log("ODT SIZE:", stats.size, "bytes");
}
return res.json({
  success: true,
  document: `/uploads/${reportId}.${type}`,
});

} catch (err) {
  console.log(err);

  res.status(500).json({
    success: false,
    error: err.message,
  });
}
});

/* START SERVER */



app.post("/tts", async (req, res) => {
  const { text, voice } = req.body;

  if (!text) {
    return res.status(400).json({
      error: "No text provided for TTS",
    });
  }

  console.log("TTS Length:", text.length);
  console.log(text);
console.log("TTS Voice:", voice);
  try {
  const ttsVoice = voice === "personal" ? "alloy" : voice;

console.log(
  "🔍 VOICE SENT TO GENERATESPEECH:",
  ttsVoice
);

const filename = await generateSpeech(
  openai,
  text,
  ttsVoice
);

  res.json({
    audioUrl: `http://localhost:5000/uploads/${filename}`,
  });
} catch (error) {
  console.error(error);

  res.status(500).json({
    error: "TTS generation failed",
  });
}
});
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Demo login
    if (
  username === "raveendra1434@gmail.com" &&
  password === "truvora1234"
) {
      return res.json({
        success: true,
        username,
        token: "truvora-demo-token",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid username or password",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
app.post(
  "/upload-personal-voice",
  upload.single("voice"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No personal voice file received",
        });
      }

      console.log("🎙️ Personal voice received:", req.file.filename);
      console.log("🎙️ Voice size:", req.file.size, "bytes");
personalVoiceFile = req.file.filename;
      res.json({
        success: true,
        message: "Personal voice uploaded successfully",
        filename: req.file.filename,
        audioUrl: `http://localhost:5000/uploads/${req.file.filename}`,
      });

    } catch (error) {
      console.error("❌ Personal voice upload error:", error);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`✅ Truvora server running on port ${PORT}`);
});