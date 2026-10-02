import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateSpeech(openai, text, voice = "alloy") {
  let selectedVoice = voice;

  // Truvora "personal" voice currently uses OpenAI's Alloy voice.
  // This prevents the invalid "personal" voice error.
  if (voice === "personal") {
    selectedVoice = "alloy";
  }

  const response = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: selectedVoice,
    input: text,
  });

    const buffer = Buffer.from(await response.arrayBuffer());

  const uploadsPath = path.join(__dirname, "..", "uploads");

  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  const filename = `speech-${Date.now()}.mp3`;

  const filePath = path.join(uploadsPath, filename);

  fs.writeFileSync(filePath, buffer);
console.log("✅ TTS FILE SAVED:", filePath);

return filename;
}