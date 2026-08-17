import fs from "fs";

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

  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }

  const filename = `speech-${Date.now()}.mp3`;

  fs.writeFileSync(`uploads/${filename}`, buffer);

  return filename;
}