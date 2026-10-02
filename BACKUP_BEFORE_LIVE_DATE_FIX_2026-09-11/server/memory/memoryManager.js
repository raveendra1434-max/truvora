import fs from "fs";

const MEMORY_FILE = "./memory/memory.json";

const memoryStore = new Map();

/* Save Memory */
function saveMemory(userId, key, value) {
  if (!memoryStore.has(userId)) {
    memoryStore.set(userId, {});
  }

  const userMemory = memoryStore.get(userId);
userMemory[key] = value;
console.log("WRITING MEMORY TO FILE...");
fs.writeFileSync(
  MEMORY_FILE,
  JSON.stringify(
    Object.fromEntries(memoryStore),
    null,
    2
  )
);

}

/* Get Memory */
function getMemory(userId) {

  if (fs.existsSync(MEMORY_FILE)) {

    const data = JSON.parse(
      fs.readFileSync(
        MEMORY_FILE,
        "utf8"
      )
    );

    if (data[userId]) {
      memoryStore.set(
        userId,
        data[userId]
      );
    }

  }

  return (
    memoryStore.get(userId) ||
    {}
  );

}

/* Clear Memory */
function clearMemory(userId) {
  memoryStore.delete(userId);
}
function addConversation(userId, userMessage, aiReply) {
  const memory = getMemory(userId);

  if (!memory.conversations) {
    memory.conversations = [];
  }

  memory.conversations.push({
    user: userMessage,
    assistant: aiReply,
    time: new Date().toISOString(),
  });

  saveMemory(userId, "conversations", memory.conversations);
  console.log("MEMORY SAVED:", memory.conversations.length);
}
function saveProject(userId, projectName, data) {
const memory = getMemory(userId);

if (!memory.projects) {
  memory.projects = {};
}

memory.projects[projectName] = data;

saveMemory(userId, "projects", memory.projects);

console.log("PROJECT SAVED:", projectName);
}

export {
  saveMemory,
  getMemory,
  clearMemory,
  addConversation,
  saveProject,
};