async function analyzeQuestion(message, openai) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-nano",
    messages: [
      {
        role: "system",
        content: `
You are the Trulexity Question Analyzer.

Analyze the user's question.

Reply ONLY in JSON.

{
  "needsWeb": true,
  "category": "general",
  "confidence": "high"
}

Rules:
- Set needsWeb=true only if current or changing information is required.
- Questions about the user's saved memory (name, age, city, hometown, company, profession, email, phone, favourite color, favourite food, hobby, birthday, college, language) are NOT web questions.
- For memory questions, always return "needsWeb": false.
- Only use web search for information that cannot come from memory.
- Otherwise set false.
- Do not explain.
- Return JSON only.
`
      },
      {
        role: "user",
        content: message
      }
    ],
    temperature: 0
  });

  try {
  return JSON.parse(completion.choices[0].message.content);
} catch (error) {
  console.error("Question Analyzer JSON Error:", error);

  return {
    needsWeb: false,
    category: "general",
    confidence: "low",
  };
}
}   // ← This closes analyzeQuestion()

export { analyzeQuestion };