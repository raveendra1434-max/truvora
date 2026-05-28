import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import axios from "axios";
import multer from "multer";
import fs from "fs";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());



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

const upload =
  multer({
    storage,
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



/* MAIN AI ROUTE */

app.post(
  "/ask",

  async (
    req,
    res
  ) => {

    try {

      const {
        message,
        web,
        agentMode,
        imageUrl,
      } = req.body;

      let webResults =
        "";



      /* WEB SEARCH */

      if (web) {

        try {

          const search =
            await axios.get(
              "https://serpapi.com/search.json",
              {
                params: {
                  q: message,

                  api_key:
                    process.env.SERPAPI_KEY,
                },
              }
            );

          const results =
            search.data
              .organic_results
              ?.slice(0, 5)
              .map(
                (
                  item
                ) =>
                  `${item.title}: ${item.snippet}`
              )
              .join("\n");

          webResults =
            `LIVE WEB DATA:\n${results}`;

        } catch (webError) {

          console.log(
            webError
          );
        }
      }



      let systemPrompt =
        "You are Truvora AI, a futuristic global AI assistant.";



      if (agentMode) {

        systemPrompt =
          "You are Truvora Agent AI. Think deeply and provide advanced answers.";
      }



      /* GPT IMAGE VISION */

      let userContent;

      if (imageUrl) {

        userContent = [

          {
            type: "text",

            text:
`
${message}

${webResults}

Analyze this image in detail.
            `,
          },

          {
            type: "image_url",

            image_url: {
              url: imageUrl,
            },
          },
        ];

      } else {

        userContent =
`
${message}

${webResults}
        `;
      }



      /* OPENAI */

      const completion =
        await openai.chat.completions.create({

          model:
            "gpt-4.1-mini",

          messages: [

            {
              role:
                "system",

              content:
                systemPrompt,
            },

            {
              role:
                "user",

              content:
                userContent,
            },
          ],
        });



      const reply =
        completion
          .choices[0]
          .message.content;



      res.json({
        reply,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        reply:
          "Server error",
      });
    }
  }
);



/* START SERVER */

const PORT = 5000;

app.listen(
  PORT,

  () => {

    console.log(
      `✅ Truvora server running on port ${PORT}`
    );
  }
);