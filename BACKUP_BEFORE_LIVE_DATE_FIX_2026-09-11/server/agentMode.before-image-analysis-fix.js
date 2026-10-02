function detectAgentTasks(prompt) {
  const text = String(prompt || "").toLowerCase();

  const tasks = [];

  // Excel
  if (
    /\b(excel|xlsx|xls|spreadsheet|xl\s*sheet)\b/.test(text) &&
    /\b(create|make|generate|prepare|export|download|build)\b/.test(text)
  ) {
    tasks.push("xlsx");
  }

  // PDF
  if (
    /\b(pdf|portable document)\b/.test(text) &&
    /\b(create|make|generate|prepare|export|download|build)\b/.test(text)
  ) {
    tasks.push("pdf");
  }

  // Word / DOCX
  if (
    /\b(word|docx|document)\b/.test(text) &&
    /\b(create|make|generate|prepare|export|download|build)\b/.test(text)
  ) {
    tasks.push("docx");
  }

  // PowerPoint
  if (
    /\b(powerpoint|power point|ppt|pptx|presentation|slides)\b/.test(text) &&
    /\b(create|make|generate|prepare|export|download|build)\b/.test(text)
  ) {
    tasks.push("pptx");
  }

  // CSV
  if (
    /\b(csv|comma separated)\b/.test(text) &&
    /\b(create|make|generate|prepare|export|download|build)\b/.test(text)
  ) {
    tasks.push("csv");
  }

  // Markdown
  if (
    /\b(markdown|md file)\b/.test(text) &&
    /\b(create|make|generate|prepare|export|download|build)\b/.test(text)
  ) {
    tasks.push("md");
  }

  // Text
  if (
    /\b(txt|text file)\b/.test(text) &&
    /\b(create|make|generate|prepare|export|download|build)\b/.test(text)
  ) {
    tasks.push("txt");
  }

  // JSON
  if (
    /\b(json)\b/.test(text) &&
    /\b(create|make|generate|prepare|export|download|build)\b/.test(text)
  ) {
    tasks.push("json");
  }

  // XML
  if (
    /\b(xml)\b/.test(text) &&
    /\b(create|make|generate|prepare|export|download|build)\b/.test(text)
  ) {
    tasks.push("xml");
  }

  // RTF
  if (
    /\b(rtf)\b/.test(text) &&
    /\b(create|make|generate|prepare|export|download|build)\b/.test(text)
  ) {
    tasks.push("rtf");
  }

  // Image generation
if (
  /\b(create|make|generate|draw|design|render|show|give|produce|build)\b/.test(text) &&
  /\b(image|picture|photo|illustration|logo|poster|wallpaper|artwork|drawing|portrait|icon|banner|graphic)\b/.test(text)
) {
  tasks.push("image");
}
  return [...new Set(tasks)];
}

export { detectAgentTasks };