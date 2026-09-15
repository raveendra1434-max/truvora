async function analyzeQuestion(message, openai) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-nano",
    messages: [
      {
        role: "system",
        content: `
You are the Trulexity Question Analyzer.

Analyze the user's question and determine whether Trulexity should use live web research.

Reply ONLY in valid JSON.

{
  "needsWeb": true,
  "category": "company",
  "confidence": "high"
}

Allowed categories:
- memory
- general
- current
- company
- person
- organization
- product
- brand
- place
- news
- website
- research

Rules:

1. MEMORY QUESTIONS
Questions asking about information specifically saved about the user are memory questions.

Examples:
- What is my name?
- What is my company?
- Where do I live?
- What is my profession?
- What is my birthday?
- What language do I speak?
- What is my favourite food?

For these:
- needsWeb=false
- category="memory"

2. ENTITY RESEARCH
If the user asks about a specific company, person, organization, product, brand, place, website, or other identifiable entity, use web research even if the user does NOT say "latest", "current", or "search".

Examples:
- Tell me about Online Instruments India Pvt Ltd
- Research Microsoft
- Who is Satya Nadella?
- Tell me about OpenAI
- What is the iPhone?
- Tell me about Bengaluru
- Research this company
- What does this organization do?

For these:
- needsWeb=true
- Use the most appropriate entity category.

3. CURRENT INFORMATION
Use web research for information that may have changed or requires current information.

Examples:
- What is the latest news about Microsoft?
- What is the current price?
- Who is the current CEO?
- What happened today?
- Latest information about this company

For these:
- needsWeb=true
- category="current" or "news" when appropriate.

4. GENERAL KNOWLEDGE
Do not require web research for stable general knowledge unless the question specifically asks for research, verification, sources, or current information.

Examples:
- What is photosynthesis?
- Explain gravity
- What is machine learning?

For these:
- needsWeb=false
- category="general"

5. EXPLICIT RESEARCH OR VERIFICATION
If the user asks to research, investigate, verify, check online, look up, find information about, or provide sources about a specific entity, use web research.

Examples:
- Research Online Instruments India Pvt Ltd
- Verify this company
- Investigate this person
- Find reliable information about this organization
- Check this company online

For these:
- needsWeb=true
- category="research"

6. IMPORTANT MEMORY PRIORITY
If the question is clearly asking about the user's own saved information, classify it as memory even if words such as "company", "city", or "profession" appear.

Example:
- What is my company?
=> needsWeb=false, category="memory"

But:
- Tell me about Online Instruments India Pvt Ltd
=> needsWeb=true, category="company"

7. DO NOT GUESS ENTITY TYPE
Only classify something as company, person, organization, product, brand, or place when the question provides enough indication.

8. CONFIDENCE
Use:
- "high" when the category and web requirement are clear.
- "medium" when reasonably clear but some ambiguity exists.
- "low" when the question is genuinely ambiguous.

9. Return JSON only.
Do not explain your decision.
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
}

export { analyzeQuestion };