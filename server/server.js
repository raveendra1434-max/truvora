import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import axios from "axios";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());



/* OPENAI */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



/* MAIN ROUTE */

app.post("/ask", async (req, res) => {

  try {

    const {
      message,
      web,
      agentMode,
    } = req.body;

    let webResults = "";



    /* LIVE WEB SEARCH */

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
              (item) =>
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



    /* AI RESPONSE */

    const completion =
      await openai.chat.completions.create({

        model: "gpt-4.1-mini",

        messages: [

          {
            role: "system",

            content:
              agentMode
                ? "You are Truvora Agent AI. Think deeply and provide advanced answers."
                : "You are Truvora AI, a futuristic global AI assistant.",
          },

          {
            role: "user",

            content:
              `
${message}

${webResults}
              `,
          },
        ],
      });



    res.json({

      reply:
        completion
          .choices[0]
          .message.content,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      reply:
        "Server error",
    });
  }
});



/* START SERVER */

const PORT = 5000;

app.listen(PORT, () => {

  console.log(
    `✅ Truvora server running on port ${PORT}`
  );
});