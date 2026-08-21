import "./App.css";
import { languageGroups } from "./data/languageGroups";
import Select from "react-select";

import {
  useState,
  useRef,
  useEffect,
} from "react";

import {
  FiSend,
  FiGlobe,
  FiPlus,
  FiMenu,
  FiCopy,
  FiUser,
  FiCpu,
  FiUpload,
  FiMic,
  FiSquare,
  FiVolume2,
} from "react-icons/fi";

import {
  CopyToClipboard,
} from "react-copy-to-clipboard";

import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

import { useDropzone }
from "react-dropzone";

// import * as pdfjsLib from "pdfjs-dist";

import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";



/* FIREBASE */

import {
  auth,
  googleProvider,
  saveChatToCloud,
  loadUserChats,
} from "./firebase";

import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

// pdfjsLib.GlobalWorkerOptions.workerSrc =
//   "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
function saveChat(chat) {
  localStorage.setItem(
    `truvora-chat-${Date.now()}`,
    JSON.stringify(chat)
  );

  alert("✅ Chat saved successfully!");
}
function App() {
  const citationRefs = (sources = []) =>
    sources.map((source, index) => ({
      ...source,
      citationNumber: index + 1,
      sourceUrl:
        source.url ||
        source.videoUrl ||
        source.youtubeUrl ||
        "#",
    }));

  const [activeCitation, setActiveCitation] =
    useState(null);

  const [citationPreviewOpen, setCitationPreviewOpen] =
    useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const youtubeUrl = params.get("youtube");

    if (youtubeUrl) {
      const url = decodeURIComponent(youtubeUrl);

      handleYouTube(url);

      window.history.replaceState({}, "", "/");
    }
  }, []);

  const [input, setInput] =
    useState("");
    const [selectedVoice, setSelectedVoice] = useState("alloy");
    const [personalVoice, setPersonalVoice] = useState(null);
    const [showPersonalVoice, setShowPersonalVoice] = useState(false);

    const voiceOptions = [
  { id: "alloy", name: "Alloy" },
  { id: "ash", name: "Ash" },
  { id: "ballad", name: "Ballad" },
  { id: "coral", name: "Coral" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "nova", name: "Nova" },
  { id: "onyx", name: "Onyx" },
  { id: "sage", name: "Sage" },
  { id: "shimmer", name: "Shimmer" },
  { id: "verse", name: "Verse" },
  { id: "marin", name: "Marin" },
  { id: "cedar", name: "Cedar" },

  { id: "personal", name: "🎤 Add Personal Voice" },
];
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [loggedIn, setLoggedIn] = useState(
  localStorage.getItem("truvoraLoggedIn") === "true"
);
const [loginError, setLoginError] = useState("");
  const [messages,
    setMessages] =
    useState([]);
    const [sidebarOpen,
  setSidebarOpen] =
  useState(true);
const [chats,
  setChats] =
  useState([]);
useEffect(() => {
  const saved = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key.startsWith("truvora-chat-")) {
      saved.push(
        JSON.parse(localStorage.getItem(key))
      );
    }
  }

  setChats(saved);
}, []);
const [currentChatId,
  setCurrentChatId] =
  useState(null);
  const [loading,
    setLoading] =
    useState(false);

  const [webEnabled,
    setWebEnabled] =
    useState(false);

  const [agentMode,
    setAgentMode] =
    useState(false);

  const [user,
    setUser] =
    useState(null);

  const [chatHistory,
    setChatHistory] =
    useState([]);
    const [searchTerm,
  setSearchTerm] =
  useState("");

  const [pdfText,
    setPdfText] =
    useState("");

  const [image,
    setImage] =
    useState(null);

  const [typingText,
    setTypingText] =
    useState("");

  const [stopGeneration,
    setStopGeneration] =
    useState(false);
const [voiceEnabled, setVoiceEnabled] = useState(true);
const [showAnalyzeMenu, setShowAnalyzeMenu] = useState(false);

const [showYouTubeSearch, setShowYouTubeSearch] = useState(false);
const [youtubeQuery, setYoutubeQuery] = useState("");

const [showWebsiteSearch, setShowWebsiteSearch] = useState(false);
const [websiteUrl, setWebsiteUrl] = useState("");
const [showCamera, setShowCamera] = useState(false);

const [selectedLanguage, setSelectedLanguage] = useState("English");
const languageOptions = languageGroups;
console.log("Language Options:", languageOptions);
const getLanguageCode = () => {
  for (const group of languageOptions) {
    const found = group.options.find(
      (lang) => lang.label === selectedLanguage
    );

    if (found) {
      return found.value;
    }
  }

  return "en";
};
const videoRef = useRef(null);
const canvasRef = useRef(null);

const documentUploadRef = useRef(null);
const imageUploadRef = useRef(null);

const messagesEndRef = useRef(null);
const audioRef = useRef(null);


  /* VOICE */

  const {
  transcript,
  resetTranscript,
  listening,
} = useSpeechRecognition();



  useEffect(() => {

    setInput(
      transcript
    );

  }, [transcript]);
useEffect(() => {
  if (transcript.trim()) {
    console.log("Voice detected:", transcript);
  }
}, [transcript]);
useEffect(() => {
  if (!listening && transcript.trim()) {

    handleSend(transcript);

    resetTranscript();
  }
}, [listening]);

  /* AUTO SCROLL */

  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior:
          "smooth",
      });

  }, [messages, loading]);



  /* FIREBASE AUTH */

useEffect(() => {

  const unsubscribe =
    onAuthStateChanged(
      auth,
      async (currentUser) => {

        if (currentUser) {

          setUser(currentUser);

          const userChats =
            await loadUserChats(
              currentUser.uid
            );

          setChats(userChats);
setChatHistory(
  userChats.map(
    (chat) => chat.messages
  )
);
          console.log(
            "Loaded Chats:",
            userChats
          );

        } else {

          setUser(null);

          setChats([]);
        }
      }
    );

  return () =>
    unsubscribe();

}, []);
useEffect(() => {

  if (!showCamera) return;

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

    })
    .catch((err) => {
      console.log(err);
    });

}, [showCamera]);


  /* LOGIN */

  const handleGoogleLogin =
    async () => {

      try {

        await signInWithPopup(
          auth,
          googleProvider
        );

      } catch (error) {

        console.log(error);
      }
    };



  /* LOGOUT */

  const handleLogout =
    async () => {

      await signOut(auth);
    };



 /* SAVE CHAT */

const saveCurrentChat =
  async (
    updatedMessages
  ) => {

    if (!user) return;

    const savedChatId =
      await saveChatToCloud(
        user.uid,
        currentChatId,
        updatedMessages
      );

    if (savedChatId) {
      setCurrentChatId(savedChatId);
    }

    const chats =
      await loadUserChats(
        user.uid
      );

    console.log("LOADED CHATS:");
    console.log(chats[0]);

    setChats(
      chats
    );

    setChatHistory(
      chats.map(
        (chat) => chat.messages
      )
    );

    console.log(
      "Chats Saved:",
      chats
    );
  };


/* SPEAK */

const speakText = async (text) => {
  try {

    if (!text || !text.trim()) {
      return;
    }

    /* Stop previous audio */

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      audioRef.current = null;
    }


    /* Generate speech */

    const response = await fetch(
      "https://truvora-backend.onrender.com/tts",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice,
        }),
      }
    );


    if (!response.ok) {
      throw new Error(
        `TTS request failed: ${response.status}`
      );
    }


    const data = await response.json();


    if (!data.audioUrl) {
      throw new Error(
        "No audio URL returned"
      );
    }


    /*
      IMPORTANT:

      Download the COMPLETE audio file first.

      This prevents Render/network buffering
      from causing cut-cut playback.
    */

    const audioResponse =
      await fetch(data.audioUrl);


    if (!audioResponse.ok) {
      throw new Error(
        "Audio file download failed"
      );
    }


    const audioBlob =
      await audioResponse.blob();


    /*
      Convert downloaded MP3 into
      a local browser object URL.
    */

    const audioUrl =
      URL.createObjectURL(audioBlob);


    const audio =
      new Audio(audioUrl);


    audioRef.current = audio;


    /*
      Clean up memory after playback.
    */

    audio.onended = () => {

      URL.revokeObjectURL(audioUrl);

      if (audioRef.current === audio) {
        audioRef.current = null;
      }

    };


    audio.onerror = () => {

      console.error(
        "❌ AUDIO PLAYBACK ERROR"
      );

      URL.revokeObjectURL(audioUrl);

      if (audioRef.current === audio) {
        audioRef.current = null;
      }

    };


    /*
      Start only after the COMPLETE
      audio file has been downloaded.
    */

    await audio.play();


  } catch (error) {

    console.error(
      "❌ TTS Error:",
      error
    );

    alert(
      "Voice generation failed."
    );

  }
};

  
  /* PDF */
const capturePhoto = async () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!video || !canvas) return;

  try {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.95);

    console.log("📷 CAMERA IMAGE CAPTURED");

    setImage(imageData);

    const userImageMessage = {
      role: "user",
      text: "📷 Captured Image",
      content: imageData,
    };

    const response = await fetch(
      "https://truvora-backend.onrender.com/analyze-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageData,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Camera analysis failed: ${response.status}`
      );
    }

    const data = await response.json();

    console.log("📷 CAMERA RESPONSE:", data);

    let answer = data.answer || "";

    // PRODUCT PRICE RESULTS
    if (
      data.type === "product" &&
      Array.isArray(data.shoppingResults) &&
      data.shoppingResults.length > 0
    ) {
      const results = data.shoppingResults;

      const numericPrices = results
        .map((item) => {
          if (!item.price) return null;

          const match = String(item.price).match(
            /[\d,]+/
          );

          if (!match) return null;

          return Number(
            match[0].replace(/,/g, "")
          );
        })
        .filter(
          (price) =>
            Number.isFinite(price) &&
            price > 0
        );

      let priceRange = "";

      if (numericPrices.length > 0) {
        const minPrice = Math.min(...numericPrices);
        const maxPrice = Math.max(...numericPrices);

        priceRange =
          minPrice === maxPrice
            ? `₹${minPrice.toLocaleString("en-IN")}`
            : `₹${minPrice.toLocaleString(
                "en-IN"
              )} – ₹${maxPrice.toLocaleString(
                "en-IN"
              )}`;
      }

      const productName =
        data.product?.name ||
        data.productName ||
        "Product";

      const confidence =
        data.product?.confidence ||
        data.confidence ||
        "MEDIUM";

      const identification =
        data.product?.identification ||
        data.identification ||
        "";

      answer = `
📦 What I found

${productName}

🔎 Identification

${identification}

🎯 Confidence

${confidence}

💰 Current Market Price

${priceRange || "Price unavailable"}

⚠️ Price Note

The exact model was not necessarily identified. The range below is based on matching products found in live shopping results.

🛒 Matching Products

${results
  .map(
    (item, index) =>
      `${index + 1}. ${item.title || "Product"}
💵 ${item.price || "Price unavailable"}
🏪 ${item.source || "Seller unavailable"}`
  )
  .join("\n\n")}
      `.trim();
    }

    // QUESTION RESULT
    if (data.type === "question") {
  answer = data.answer || "Unable to determine the answer.";
}

    // GENERAL IMAGE
    if (
      data.type !== "product" &&
      data.type !== "question" &&
      !answer
    ) {
      answer =
        data.identification ||
        data.answer ||
        "Image analyzed successfully.";
    }

    setMessages((prev) => [
      ...prev,
      userImageMessage,
      {
        role: "assistant",
        text: answer,
      },
    ]);

    setShowCamera(false);

  } catch (error) {
    console.error(
      "❌ CAMERA ERROR:",
      error
    );

    alert(
      "Camera analysis failed. Please try again."
    );
  }
};
const handlePdfUpload = async (file) => {

  const formData = new FormData();

  formData.append("file", file);

  try {

    const response = await fetch(
      "https://truvora-backend.onrender.com/analyze-document",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    console.log("DOCUMENT RESPONSE:", data);

    if (!response.ok) {
      throw new Error(
        data.error || "Document analysis failed"
      );
    }

    setPdfText(
      data.documentText || data.analysis || ""
    );

    setMessages((prev) => [
      ...prev,

      {
        role: "user",
        text: `📄 Uploaded: ${file.name}`,
      },

      {
        role: "assistant",
        text:
          data.analysis ||
          "Document analyzed successfully.",
      },
    ]);

    setShowAnalyzeMenu(false);

  } catch (error) {

    console.error(
      "DOCUMENT UPLOAD ERROR:",
      error
    );

    alert(
      "Document upload failed."
    );
  }
};


const handleVideoUpload = async (file) => {

  const formData = new FormData();

  formData.append("video", file);
const lowerMessage = input.toLowerCase();

if (lowerMessage.includes("pdf"))
  formData.append("type", "pdf");

else if (
  lowerMessage.includes("word") ||
  lowerMessage.includes("doc")
)
  formData.append("type", "docx");

else if (
  lowerMessage.includes("excel") ||
  lowerMessage.includes("xlsx")
)
  formData.append("type", "xlsx");

else if (
  lowerMessage.includes("powerpoint") ||
  lowerMessage.includes("ppt")
)
  formData.append("type", "pptx");
  const response = await fetch(
  "https://truvora-backend.onrender.com/upload-video",
  {
    method: "POST",
    body: formData,
  }
);

const text = await response.text();

console.log("SERVER RESPONSE:", text);

const data = JSON.parse(text);

  

  setMessages((prev) => [
  ...prev,
  {
    role: "assistant",
    text: data.summary,
    image: data.frameUrl || null,
    document: data.document || null,
  },
]);

  setShowAnalyzeMenu(false);

};
const handleYouTube = async (query) => {
  if (!query?.trim()) return;

  const trimmedQuery = query.trim();

  const urlMatch = trimmedQuery.match(
    /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{10,11})/
  );

  try {
    if (urlMatch) {
      const videoId = urlMatch[1];

      const youtubeUrl =
        `https://www.youtube.com/watch?v=${videoId}`;

      console.log("YOUTUBE URL:", youtubeUrl);

      const response = await fetch(
        "https://truvora-backend.onrender.com/analyze-youtube",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: youtubeUrl,
          }),
        }
      );

      const data = await response.json();

      console.log("YOUTUBE RESPONSE:", data);

      if (!data.success) {
        alert(data.error || "YouTube analysis failed.");
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.analysis || "No analysis returned.",
        },
      ]);

      setShowYouTubeSearch(false);
      setYoutubeQuery("");

      return;
    }


  } catch (err) {
    console.error("YOUTUBE ERROR:", err);
    alert("Unable to process YouTube.");
  }
};

const handleWebsite = async (url) => {
  if (!url?.trim()) return;

  const websiteUrl = url.trim();

  try {
    const response = await fetch(
      "https://truvora-backend.onrender.com/analyze-website",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: websiteUrl,
        }),
      }
    );

    const data = await response.json();

    console.log("WEBSITE RESPONSE:", data);

    if (!data.success) {
      alert(data.error || "Website analysis failed.");
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: `🌐 Website: ${websiteUrl}`,
      },
      {
        role: "assistant",
        text: data.analysis || "No analysis returned.",
      },
    ]);

    setShowWebsiteSearch(false);
    setWebsiteUrl("");

  } catch (err) {
    console.error("WEBSITE ERROR:", err);
    alert("Unable to process website.");
  }
};

const handleAudioUpload = async (file) => {

  const formData = new FormData();

  formData.append("audio", file);

  const response = await fetch(
    "https://truvora-backend.onrender.com/upload-audio",
    {
      method: "POST",
      body: formData,
    }
  );

  const text = await response.text();

  console.log("SERVER RESPONSE:", text);

  const data = JSON.parse(text);

  setMessages((prev) => [
    ...prev,
    {
      role: "assistant",
      text: data.summary,
      document: data.document || null,
    },
  ]);

  setShowAnalyzeMenu(false);

};

  /* UPLOAD */

  const {
    getRootProps,
    getInputProps,
  } = useDropzone({

    accept: {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "image/*": [],
},

    onDrop: async (acceptedFiles) => {

  const file = acceptedFiles[0];

  if (!file) return;

  try {

    if (
      file.type === "application/pdf" ||
      file.name.endsWith(".docx") ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".doc") ||
      file.name.endsWith(".xls")
    ) {

      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "https://truvora-backend.onrender.com/analyze-document",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.analysis) {

  setPdfText(data.documentText);

  setMessages((prev) => [
    ...prev,

    {
      role: "user",
      text: `📊 Uploaded: ${file.name}`,
    },

    {
      role: "assistant",
      text: data.analysis,
    },
  ]);

  // speakText(data.analysis);
}

      return;
    }

    const imageFormData = new FormData();

    imageFormData.append("image", file);

    const imageResponse = await fetch(
      "https://truvora-backend.onrender.com/upload-image",
      {
        method: "POST",
        body: imageFormData,
      }
    );

    const imageData = await imageResponse.json();

console.log("🖼️ IMAGE UPLOAD RESPONSE:", imageData);

const uploadedImageUrl = imageData.imageUrl;

if (!uploadedImageUrl) {
  throw new Error("Image URL was not returned by server");
}

setImage(uploadedImageUrl);

console.log("🤖 SENDING IMAGE TO AI:", uploadedImageUrl);

// Automatically analyze image
await handleSend(
  input?.trim() || "Analyze this image in detail.",
  uploadedImageUrl
);

    } catch (error) {

    console.error("UPLOAD ERROR:", error);

    alert("Upload failed");
  }

},
});


const handleLogin = async () => {
  try {
    const response = await fetch("https://truvora-backend.onrender.com/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
  setLoggedIn(true);
  localStorage.setItem("truvoraLoggedIn", "true");
  setLoginError("");
  alert("✅ Login successful");
} else {
      setLoginError(data.message);
    }
  } catch (err) {
    setLoginError("Network error");
  }
};

 /* SEND */

const handleSend = async (voiceText = null, imageUrlOverride = null) => {

const finalPrompt =
  typeof voiceText === "string"
    ? voiceText
    : input;
const conversationImageUrl =
  imageUrlOverride ||
  image ||
  [...messages]
    .reverse()
    .find((msg) => msg.image)?.image ||
  null;

console.log("🖼️ IMAGE TO SEND:", conversationImageUrl);
  if (
  !finalPrompt?.trim() &&
  !pdfText &&
  !image &&
  !imageUrlOverride
)
  return;

  setStopGeneration(false);

  const userMessage = {
  role: "user",
  text:
    conversationImageUrl
      ? `🖼️ Image Uploaded\n\n${finalPrompt}`
      : pdfText
      ? `📄 PDF Uploaded\n\n${finalPrompt}`
      : finalPrompt,

  image: conversationImageUrl || null,
};

  const updatedMessages = [
    ...messages,
    userMessage,
  ];

  setMessages(updatedMessages);

  setInput("");

  setLoading(true);
// CHECK FOR DOCUMENT REQUEST
const promptLower = finalPrompt.toLowerCase();

let requestedDocumentType = null;

if (
  /\b(xlsx|excel|xl\s*sheet|spreadsheet)\b/.test(promptLower) &&
  /\b(create|make|generate|prepare|export|download|build)\b/.test(promptLower)
) {
  requestedDocumentType = "xlsx";
}

console.log(
  "REQUESTED DOCUMENT TYPE:",
  requestedDocumentType
);
  try {

    const response =
      await fetch(
        "https://truvora-backend.onrender.com/ask",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
  message: finalPrompt,
  history: updatedMessages,
  language: getLanguageCode(),
  web: webEnabled,
  agentMode: agentMode,

  // Current uploaded image
  imageUrl: conversationImageUrl,

  // All image references available in the conversation
  imageUrls: [
    imageUrlOverride || image,
    ...updatedMessages
      .filter((msg) => msg.image)
      .map((msg) => msg.image)
      .filter(Boolean),
  ],
}),
        }
      );

    const data =
      await response.json();
console.log("SERVER RESPONSE:");
console.log(data);

console.log("SOURCES:");
console.log(data.sources);
    console.log("SOURCES:");
console.log(data.sources);


let currentText = "";

    for (
      let char of data.reply
    ) {

      if (
        stopGeneration
      )
        break;

      currentText += char;

      setTypingText(
        currentText
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            8
          )
      );
    }

    const finalMessages = [
  ...updatedMessages,
  {
  role: "assistant",
  text: currentText,
  image: data.image || (data.type === "image" ? data.document : null),
  document: data.document || null,
  sources: data.sources || [],
},
];

    setMessages(
      finalMessages
    );

    await saveCurrentChat(
      finalMessages
    );
    // if (voiceEnabled) {
//     speakText(currentText);
// }

    setTypingText("");
    

  } catch (error) {

    console.log(error);

    alert("Server error");

  }

  setLoading(false);
};


const handleGenerateDocument = async (type, text) => {
  console.log("DOCUMENT TEXT:");
  console.log(text);
  console.log(typeof text);
  console.log(messages[messages.length - 1]);

  const lastMessage = [...messages]
    .reverse()
    .find((msg) => msg.role === "assistant");

  const summary = (
  text ||
  lastMessage?.text ||
  lastMessage?.summary ||
  lastMessage?.content ||
  ""
)
    .replace(/^☑\s*Quick Answer\s*/i, "")
    .replace(/^✅\s*Quick Answer\s*/i, "")
    .trim();

  console.log("FINAL SUMMARY:");
  console.log(summary);
  console.log("SUMMARY LENGTH:", summary.length);

  try {
    // Find the latest AI answer
    
const recommendations = `
• Verify important information using official sources.

• Review AI-generated content before making important decisions.

• Cross-check facts from multiple trusted sources.

• Continue monitoring this topic because information may change.
`;

const sources = [
  "https://news.google.com",
  "https://www.reuters.com",
  "https://apnews.com",
];
console.log("SENDING SUMMARY:");
console.log(summary);
console.log("LENGTH:", summary.length);
    const response = await fetch(
      "https://truvora-backend.onrender.com/generate-document",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  type,
  summary: summary,
analysis: summary,
  recommendations,
  sources,
}),
      }
    );

    const data = await response.json();

    console.log("DOCUMENT RESPONSE:");
    console.log(data);

    if (!data.success) {
      alert("Document generation failed.");
      return;
    }

    const url = `https://truvora-backend.onrender.com${data.document}?t=${Date.now()}`;
const link = document.createElement("a");
link.href = url;
link.download = data.document.split("/").pop();
document.body.appendChild(link);
link.click();
document.body.removeChild(link);

  } catch (err) {

    console.log(err);

    alert("Server error");

  }

};


   if (!loggedIn) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        background: "#111",
        color: "#fff",
      }}
    >
      <h1>TRUVORA LOGIN</h1>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          margin: "10px",
          padding: "10px",
          width: "250px",
        }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          margin: "10px",
          padding: "10px",
          width: "250px",
        }}
      />

      <button
        onClick={handleLogin}
        style={{
          marginTop: "20px",
          padding: "10px 30px",
        }}
      >
        Login
      </button>

      {loginError && (
        <p style={{ color: "red" }}>
          {loginError}
        </p>
      )}
    </div>
  );
}

return (
  <>
    {showAnalyzeMenu && (
      <div className="analyze-overlay">
        <div className="analyze-menu">

          <h2>🔍 Analyze Anything</h2>

  <button
  type="button"
  onClick={() => documentUploadRef.current?.click()}
>
  📄 Document
</button>
  <button
  type="button"
  onClick={() => imageUploadRef.current?.click()}
>
  🖼 Image
</button>

  <button
  onClick={() => {
    setShowAnalyzeMenu(false);
setShowCamera(true);
  }}
>
  📷 Live Camera
</button>

  <button
  onClick={() => document.getElementById("videoUpload").click()}
>
  🎥 Video
</button>

  <button
  onClick={() =>
    document.getElementById("audioUpload").click()
  }
>
  🎙 Audio
</button>

  <button
  onClick={() => {
  setShowAnalyzeMenu(false);
  setShowYouTubeSearch(true);
}}
>
  ▶️ YouTube
</button>

  <button
  onClick={() => {
    setShowAnalyzeMenu(false);
    setShowWebsiteSearch(true);
  }}
>
  🌐 Website
</button>

<button
  onClick={() => setShowAnalyzeMenu(false)}
>
  ❌ Cancel
</button>
    <input
  ref={documentUploadRef}
  id="documentUpload"
  type="file"
  accept=".pdf,.doc,.docx,.xls,.xlsx"
  style={{ display: "none" }}
  onChange={async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      await handlePdfUpload(file);
      setShowAnalyzeMenu(false);
    } catch (error) {
      console.error("DOCUMENT UPLOAD ERROR:", error);
      alert("Document upload failed.");
    }

    e.target.value = "";
  }}
/>
<input
  id="videoUpload"
  type="file"
  accept="video/*"
  style={{ display: "none" }}
  onChange={(e) => {
    if (e.target.files[0]) {
      handleVideoUpload(e.target.files[0]);
    }
  }}
/>
<input
  ref={imageUploadRef}
  id="imageUpload"
  type="file"
  accept="image/*"
  style={{ display: "none" }}
  onChange={async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        "https://truvora-backend.onrender.com/upload-image",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Image upload failed: ${response.status}`);
      }

      const data = await response.json();

      console.log("IMAGE UPLOAD RESPONSE:", data);

      setImage(data.imageUrl);

setMessages((prev) => [
  ...prev,
  {
    role: "user",
    text: `🖼️ Image Uploaded: ${file.name}`,
    image: data.imageUrl,
  },
]);

setShowAnalyzeMenu(false);
// 🤖 Analyze uploaded image with AI
await handleSend(
  "Analyze this image in detail. Describe what you see, identify important objects, read visible text, and give me a clear summary.",
  data.imageUrl
);
    } catch (error) {
      console.error("IMAGE UPLOAD ERROR:", error);
      alert("Image upload failed.");
    }

    e.target.value = "";
  }}
/>
<input
  id="audioUpload"
  type="file"
  accept="audio/*"
  style={{ display: "none" }}
  onChange={(e) => {
    if (e.target.files[0]) {
      handleAudioUpload(e.target.files[0]);
    }
  }}
/>
</div>
  </div>
)}
{showYouTubeSearch && (
  <div className="analyze-overlay">
    <div className="analyze-menu">
      <h2>🎥 YouTube</h2>

<p
  style={{
    color: "#ccc",
    textAlign: "center",
    marginBottom: "15px",
    fontSize: "14px",
  }}
>
  Search YouTube or paste a YouTube video URL
</p>

      <input
        type="text"
        placeholder="🔍 Search YouTube videos..."
        value={youtubeQuery}
        onChange={(e) => {
  const value = e.target.value;
  setYoutubeQuery(value);
  if (
  value.includes("youtube.com/watch") ||
  value.includes("youtu.be/")
) {
  console.log("🎥 YouTube URL detected:", value);
}
}}
/>

<button
  onClick={async () => {
    const value = youtubeQuery.trim();

    if (!value) return;

    if (
      value.includes("youtube.com/watch") ||
      value.includes("youtu.be/")
    ) {
      await handleYouTube(value);
      return;
    }

    window.open(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(value)}`,
      "_blank"
    );
  }}
>
  🚀 Search YouTube
</button>

{youtubeQuery.trim() && (
  <div
    style={{
      marginTop: "20px",
      padding: "15px",
      background: "#1a1a1a",
      borderRadius: "10px",
      color: "#fff",
    }}
  >
    <h3>📺 Search Preview</h3>

    <p>
      Search YouTube for:
      <br />
      <strong>{youtubeQuery}</strong>
    </p>

    <button
      onClick={() =>
        window.open(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(
            youtubeQuery
          )}`,
          "_blank"
        )
      }
    >
      ▶ Open YouTube
    </button>
  </div>
)}
      <button onClick={() => setShowYouTubeSearch(false)}>
        ❌ Cancel
      </button>
    </div>
  </div>
)}
{showWebsiteSearch && (
  <div className="analyze-overlay">
    <div className="analyze-menu">
      <h2>🌐 Website</h2>

      <p
        style={{
          color: "#ccc",
          textAlign: "center",
          marginBottom: "15px",
          fontSize: "14px",
        }}
      >
        Enter a website URL to analyze
      </p>

      <input
        type="text"
        value={websiteUrl}
        onChange={(e) => setWebsiteUrl(e.target.value)}
        placeholder="https://example.com"
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "12px",
          borderRadius: "8px",
          border: "1px solid #555",
          background: "#111827",
          color: "#fff",
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={() => handleWebsite(websiteUrl)}
      >
        🌐 Analyze Website
      </button>

      <button
        onClick={() => {
          setShowWebsiteSearch(false);
          setWebsiteUrl("");
        }}
      >
        ❌ Cancel
      </button>
    </div>
  </div>
)}
    <div className="app">

      <div
  className="sidebar"
  style={{
    width: sidebarOpen ? "260px" : "0",
    minWidth: sidebarOpen ? "260px" : "0",
    padding: sidebarOpen ? "20px" : "0",
    overflow: "hidden",
    transition: "all .3s ease"
  }}
>

        <div className="logo">

          <div className="logo-icon">
            
          </div>

          <div className="logo-text">

            <h2>TRUVORA</h2>

            <p>GLOBAL AI</p>

          </div>
        </div>



        <button
  className="new-chat"
  onClick={() => {
    setMessages([]);
    setInput("");
    setPdfText("");
    setImage(null);
  }}
>
  <FiPlus />
  New Chat
</button>

<input
  type="text"
  placeholder="Search chats..."
  value={searchTerm}
  onChange={(e) =>
    setSearchTerm(e.target.value)
  }
/>

        <p className="chat-title">

          CLOUD CHATS

        </p>



        <div className="chat-list">

      {chats &&
chats
  .filter((chat) =>
  Array.isArray(chat.messages) &&
  chat.messages.some((msg) =>
      msg.text?.toLowerCase().includes(
        searchTerm.toLowerCase()
      )
    )
  )
  .map((chat, index) => (
    <div
  key={index}
  className="chat-item"
  onClick={() => {
  const restoredMessages = Array.isArray(chat.messages)
  ? chat.messages
  : [];

setMessages(restoredMessages);

const restoredImage = [...restoredMessages]
  .reverse()
  .find((msg) => msg.image)?.image || null;

setImage(restoredImage);
  localStorage.setItem(
    "current-chat",
    JSON.stringify(chat)
  );
}}
>
      {chat.messages?.[0]?.text?.slice(0, 25)}
    </div>
  ))
}
        </div>
      </div>



      <div className="main">
{showCamera && (
  <div className="camera-box">
    <video
  ref={videoRef}
  autoPlay
  playsInline
  width="100%"
  style={{
    borderRadius: "15px",
    maxHeight: "400px"
  }}
/>

<canvas
  ref={canvasRef}
  style={{ display: "none" }}
/>

<button
  onClick={capturePhoto}
  style={{
    marginTop: "15px",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer"
  }}
>
  📸 Capture
</button>
  </div>
)}
  <div className="topbar">

    <div
      className="menu-btn"
      onClick={() => setSidebarOpen(!sidebarOpen)}
    >
      <FiMenu />
    </div>

    <div className="top-title">
      TRUVORA GLOBAL AI
    </div>



          {user ? (

            <div
              className="logout"

              onClick={
                handleLogout
              }
            >

              Logout

            </div>

          ) : (

            <div
              className="logout"

              onClick={
                handleGoogleLogin
              }
            >

              Login

            </div>
          )}
        </div>



        <div className="messages">

  {messages.map((msg, index) => (

    <div
  key={index}
  className={`message ${
    msg.role === "user"
      ? "user-message"
      : ""
  }`}
>
  <div className="avatar">
    {msg.role === "user" ? <FiUser /> : "T"}
  </div>

  <div className="bubble">

    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#4da6ff",
              textDecoration: "underline",
            }}
          >
            {children}
          </a>
        ),
      }}
    >
      {(msg.text ?? "").replace(
        /(https?:\/\/[^\s]+)/g,
        "[$1]($1)"
      )}
        </ReactMarkdown>

    {(msg.image || msg.content) && (
      <div style={{ marginTop: "15px" }}>
        <img
          src={
            msg.content
  ? (
      msg.content.startsWith("data:")
        ? msg.content
        : msg.content.startsWith("http")
          ? msg.content
          : `https://truvora-backend.onrender.com${msg.content}`
    )
              : (
                  msg.image.startsWith("http")
                    ? msg.image
                    : `https://truvora-backend.onrender.com${msg.image}`
                )
          }
          alt="Generated"
          style={{
            width: "100%",
            maxWidth: "420px",
            borderRadius: "16px",
            display: "block",
            marginTop: "10px",
            objectFit: "cover",
          }}
        />

        {msg.image && (
          <div
            style={{
              marginTop: "10px",
              textAlign: "center",
            }}
          >
            <button
              className="copy-btn"
              onClick={async () => {
                const imageUrl = msg.image.startsWith("http")
                  ? msg.image
                  : `https://truvora-backend.onrender.com${msg.image}`;

                const response = await fetch(imageUrl);
                const blob = await response.blob();

                const url = window.URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = "truvora-image.png";
                document.body.appendChild(a);
                a.click();
                a.remove();

                window.URL.revokeObjectURL(url);
              }}
            >
              ⬇ Download Image
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: "15px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="copy-btn"
            onClick={() =>
              handleGenerateDocument(
                "pdf",
                msg.text || msg.content || ""
              )
            }
          >
            📄 PDF
          </button>

          <button
            className="copy-btn"
            onClick={() => handleGenerateDocument("docx", msg.text)}
          >
            📝 DOCX
          </button>

          <button
            className="copy-btn"
            onClick={() => handleGenerateDocument("xlsx", msg.text)}
          >
            📊 XLSX
          </button>

          <button
            className="copy-btn"
            onClick={() => handleGenerateDocument("pptx", msg.text)}
          >
            📽 PPTX
          </button>
          <button
  className="copy-btn"
  onClick={() =>
    handleGenerateDocument(
      "md",
      msg.text || msg.content || ""
    )
  }
>
  📝 MD
</button>
        </div>

        {msg.document && (
          <div style={{ marginTop: "10px" }}>
            <a
              href={`https://truvora-backend.onrender.com${msg.document}`}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="source-link"
            >
              ⬇ Download Generated File
            </a>
          </div>
        )}
      </div>
    )}
{/* 🔗 TRUVORA CITATIONS — PREMIUM, READABLE SOURCE FEED */}
{msg.sources && msg.sources.length > 0 && (
  <div
    style={{
      marginTop: "18px",
      paddingTop: "14px",
      borderTop: "1px solid rgba(148,163,184,0.10)",
    }}
  >
    {/* HEADER */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "9px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg,#0ea5e9,#2563eb)",
            color: "#fff",
            fontSize: "14px",
            boxShadow:
              "0 4px 14px rgba(14,165,233,0.25)",
            flexShrink: 0,
          }}
        >
          🔗
        </div>

        <span
          style={{
            color: "#e2e8f0",
            fontSize: "14px",
            fontWeight: "650",
          }}
        >
          Sources
        </span>

        <span
          style={{
            color: "#64748b",
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          {msg.sources.length}
        </span>
      </div>

      <span
        style={{
          color: "#64748b",
          fontSize: "11px",
        }}
      >
        Click a source
      </span>
    </div>

    {/* SOURCE FEED */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "7px",

        maxHeight: "330px",

        overflowY: "auto",
        overflowX: "hidden",

        paddingRight: "4px",

        scrollBehavior: "smooth",
        WebkitOverflowScrolling: "touch",

        scrollbarWidth: "thin",
        scrollbarColor:
          "rgba(14,165,233,0.45) transparent",
      }}
      className="truvora-source-feed"
    >
      {msg.sources.map((source, index) => {
        const sourceUrl =
          source.url ||
          source.videoUrl ||
          source.youtubeUrl;

        if (!sourceUrl) return null;

        let domain = source.source || "";

        try {
          if (!domain) {
            domain = new URL(sourceUrl)
              .hostname
              .replace(/^www\./, "");
          }
        } catch {
          domain = "web source";
        }

        const title =
          source.title ||
          source.name ||
          domain ||
          "Web Source";

        return (
          <a
            key={index}
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            draggable="true"
            title={`Open ${title}`}
            style={{
              display: "flex",
              alignItems: "center",

              minHeight: "58px",
              width: "100%",
              boxSizing: "border-box",

              padding: "8px 10px",

              borderRadius: "12px",

              textDecoration: "none",

              background:
                "linear-gradient(90deg,rgba(15,23,42,0.94),rgba(18,35,58,0.76))",

              border:
                "1px solid rgba(56,189,248,0.16)",

              cursor: "pointer",

              transition:
                "transform 180ms cubic-bezier(.2,.8,.2,1), background 180ms ease, border-color 180ms ease, box-shadow 180ms ease",

              userSelect: "none",

              position: "relative",

              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                "translateX(4px)";

              e.currentTarget.style.borderColor =
                "rgba(56,189,248,0.48)";

              e.currentTarget.style.background =
                "linear-gradient(90deg,rgba(14,165,233,0.15),rgba(30,64,175,0.11))";

              e.currentTarget.style.boxShadow =
                "0 5px 18px rgba(14,165,233,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                "translateX(0)";

              e.currentTarget.style.borderColor =
                "rgba(56,189,248,0.16)";

              e.currentTarget.style.background =
                "linear-gradient(90deg,rgba(15,23,42,0.94),rgba(18,35,58,0.76))";

              e.currentTarget.style.boxShadow =
                "none";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform =
                "translateX(2px) scale(0.995)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform =
                "translateX(4px)";
            }}
          >
            {/* CITATION NUMBER */}
            <div
              style={{
                flex: "0 0 auto",

                width: "34px",
                height: "34px",

                borderRadius: "10px",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                background:
                  "linear-gradient(135deg,#0ea5e9,#2563eb)",

                color: "#fff",

                fontSize: "13px",
                fontWeight: "700",

                boxShadow:
                  "0 3px 10px rgba(14,165,233,0.28)",
              }}
            >
              {index + 1}
            </div>

            {/* SOURCE CONTENT */}
            <div
              style={{
                flex: "1",
                minWidth: 0,

                marginLeft: "11px",

                display: "flex",
                flexDirection: "column",
                justifyContent: "center",

                gap: "4px",
              }}
            >
              {/* TITLE */}
              <div
                style={{
                  color: "#e2e8f0",

                  fontSize: "14px",
                  fontWeight: "600",

                  lineHeight: "1.3",

                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {title}
              </div>

              {/* DOMAIN */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",

                  color: "#38bdf8",

                  fontSize: "11px",
                  fontWeight: "500",

                  lineHeight: "1.2",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",

                    borderRadius: "50%",

                    background: "#38bdf8",

                    boxShadow:
                      "0 0 8px rgba(56,189,248,0.65)",

                    flexShrink: 0,
                  }}
                />

                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {domain}
                </span>
              </div>
            </div>

            {/* OPEN BUTTON */}
            <div
              style={{
                flex: "0 0 auto",

                width: "32px",
                height: "32px",

                borderRadius: "9px",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                background:
                  "rgba(14,165,233,0.08)",

                border:
                  "1px solid rgba(56,189,248,0.20)",

                color: "#38bdf8",

                fontSize: "15px",
                fontWeight: "600",

                transition:
                  "all 180ms ease",
              }}
            >
              ↗
            </div>
          </a>
        );
      })}
    </div>

    {/* SCROLL HINT */}
    {msg.sources.length > 5 && (
      <div
        style={{
          marginTop: "8px",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          color: "#64748b",
          fontSize: "10px",
        }}
      >
        ↓ Scroll for more sources
      </div>
    )}
  </div>
)}
    <CopyToClipboard text={msg.text}>
      <button className="copy-btn">
        <FiCopy />
      </button>
    </CopyToClipboard>
    <button
  className="copy-btn"
  onClick={() =>
    handleGenerateDocument(
      "pdf",
      msg.text || msg.content || ""
    )
  }
>
  📕 PDF
</button>
<button
  className="copy-btn"
  onClick={() =>
    handleGenerateDocument(
      "docx",
      msg.text || msg.content || ""
    )
  }
>

  📝 DOCX
</button>

<button
  className="copy-btn"
  onClick={() =>
    handleGenerateDocument(
      "xlsx",
      msg.text || msg.content || ""
    )
  }
>
  📊 XLSX
</button>

<button
  className="copy-btn"
  onClick={() =>
    handleGenerateDocument(
      "pptx",
      msg.text || msg.content || ""
    )
  }
>
  📽 PPTX
</button>

<button
  className="copy-btn"
  onClick={() =>
    handleGenerateDocument(
      "html",
      msg.text || msg.content || ""
    )
  }
>
  🌐 HTML
</button>

<button
  className="copy-btn"
  onClick={() =>
    handleGenerateDocument(
      "md",
      msg.text || msg.content || ""
    )
  }
>
  📝 MD
</button>

<button
  className="copy-btn"
  onClick={() =>
    handleGenerateDocument(
      "txt",
      msg.text || msg.content || ""
    )
  }
>
  📄 TXT
</button>
<button
  className="copy-btn"
  onClick={() =>
    handleGenerateDocument(
      "json",
      msg.text || msg.content || ""
    )
  }
>
  📄 JSON
</button>
<button
  className="copy-btn"
  onClick={() =>
    handleGenerateDocument(
      "xml",
      msg.text || msg.content || ""
    )
  }
>
  📄 XML
</button>
<button
  className="copy-btn"
  onClick={() =>
    handleGenerateDocument(
      "rtf",
      msg.text || msg.content || ""
    )
  }
>
  📄 RTF
</button>

    <button
      className="copy-btn"
      onClick={() => speakText(msg.text)}
    >
      <FiVolume2 />
    </button>

    <button
      className="copy-btn"
      onClick={() => {
        navigator.clipboard.writeText(msg.text);
        alert("✅ Answer copied and ready to share");
      }}
    >
      📤
    </button>
<button
  className="copy-btn"
  onClick={() => saveChat(messages)}
>
  💾
</button>
  </div>
</div>
))}

{typingText && (
  <div className="message">
    <div className="avatar">
      T
    </div>

    <div className="bubble">
      {typingText}
    </div>
  </div>
)}

<div ref={messagesEndRef} />

</div>

<div className="input-area">

  <div className="input-box">

    <div className="left-buttons">

              <button
                className={`icon-btn ${
                  webEnabled
                    ? "active-btn"
                    : ""
                }`}

                onClick={() =>
                  setWebEnabled(
                    !webEnabled
                  )
                }
              >

                <FiGlobe />

              </button>



              <button
                className={`icon-btn ${
                  agentMode
                    ? "active-btn"
                    : ""
                }`}

                onClick={() =>
                  setAgentMode(
                    !agentMode
                  )
                }
              >

                <FiCpu />

              </button>



              <div
                {...getRootProps()}
              >

                <input
                  {...getInputProps()}
                />

                <button
  type="button"
  className="icon-btn"
  onClick={(e) => {
  e.stopPropagation();
  setShowAnalyzeMenu(true);
}}
>
  🔍
</button>
              </div>



              <button
  className="icon-btn"
  onClick={() => {
    alert("BUTTON CLICKED");
    console.log("Starting mic");

    SpeechRecognition.startListening({
  continuous: false,
  interimResults: true,
  language: "en-IN",
});
  }}
>
  <FiMic />
</button>

              <button
  className="icon-btn"
  onClick={() =>
    setVoiceEnabled(!voiceEnabled)
  }
>
  {voiceEnabled ? "🔊" : "🔇"}
</button>

            </div>

<Select
  className="language-select"
  classNamePrefix="language"
  options={languageOptions}
  value={
    languageOptions
      .flatMap((group) => group.options)
      .find((option) => option.label === selectedLanguage) || null
  }
  onChange={(selectedOption) => {
    if (selectedOption) {
      setSelectedLanguage(selectedOption.label);
    }
  }}
  placeholder="🌍 Select Language"
isSearchable
menuPlacement="auto"
/>
<Select
  className="voice-select"
  classNamePrefix="voice"
  options={voiceOptions}
  value={
    voiceOptions.find(
      (option) => option.id === selectedVoice
    ) || null
  }
  getOptionLabel={(option) => option.name}
  getOptionValue={(option) => option.id}
  onChange={(selectedOption) => {
  if (!selectedOption) return;

  if (selectedOption.id === "personal") {
    setShowPersonalVoice(true);
return;
  }

  setSelectedVoice(selectedOption.id);
}}
  placeholder="🎙️ Select Voice"
  isSearchable={false}
  menuPlacement="top"
/>
{showPersonalVoice && (
  <div className="personal-voice-overlay">
    <div className="personal-voice-modal">

      <h2>🎙️ Personal Voice</h2>

      <p>Create your personal voice for Truvora.</p>

      <input
        type="text"
        placeholder="Enter voice name"
        className="personal-voice-name"
      />

      <div className="personal-voice-buttons">

        <button
          type="button"
          onClick={async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    console.log("🎙️ Microphone access granted");

    const recorder = new MediaRecorder(stream);
const audioChunks = [];

recorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    audioChunks.push(event.data);
  }
};

recorder.onstop = async () => {
  const audioBlob = new Blob(audioChunks, {
    type: "audio/webm",
  });

  console.log("🎵 Personal voice recording captured");
  console.log("Audio size:", audioBlob.size, "bytes");
  const formData = new FormData();

formData.append("voice", audioBlob, "personal-voice.webm");

const response = await fetch("https://truvora-backend.onrender.com/upload-personal-voice", {
  method: "POST",
  body: formData,
});

const data = await response.json();

console.log("✅ Personal voice uploaded:", data);
if (data.success) {
  setPersonalVoice(data.audioUrl);
  setSelectedVoice("personal");
  setShowPersonalVoice(false);
}
};

recorder.start();

console.log("🔴 Recording started");

    setTimeout(() => {
      recorder.stop();
      stream.getTracks().forEach(track => track.stop());
      console.log("⏹️ Recording stopped");
    }, 5000);

  } catch (error) {
    console.error("❌ Microphone error:", error);
    alert("Microphone permission is required.");
  }
}}
        >
          🎙️ Record Voice
        </button>

        <button
          type="button"
          onClick={() => setShowPersonalVoice(false)}
        >
          Cancel
        </button>

      </div>

    </div>
  </div>
)}

            <input
              type="text"

              className="main-input"

              placeholder="Ask Truvora anything..."

              value={input}

              onChange={(e) =>


                setInput(
                  e.target.value
                )
              }

              onKeyDown={(e) => {

                if (
                  e.key ===
                  "Enter"
                ) {

                  handleSend();
                }
              }}
            />



            <button
              className="send-btn"

              onClick={
                handleSend
              }
            >

              <FiSend />

            </button>
                    </div>
                </div>
      </div>
    </div>
  </>
  );
}
export default App;
