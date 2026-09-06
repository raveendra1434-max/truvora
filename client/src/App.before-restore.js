import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import "./App.css";


// ============================================================
// TRUVORA GLOBAL AI
// COMPLETE FRONTEND
// ============================================================


// ============================================================
// API CONFIG
// ============================================================

const API_BASE =
  (
    process.env.REACT_APP_API_URL ||
    (window.location.hostname === "localhost" ||
     window.location.hostname === "127.0.0.1"
      ? "http://localhost:5000"
      : "https://truvora-api.onrender.com")
  ).replace(/\/$/, "");


// ============================================================
// HELPERS
// ============================================================

function getText(message) {
  return (
    message?.text ??
    message?.content ??
    message?.answer ??
    message?.reply ??
    ""
  );
}


function downloadBlob(
  blob,
  filename
) {
  const url =
    window.URL.createObjectURL(
      blob
    );

  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}


function formatTime() {
  return new Date().toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


// ============================================================
// MAIN APP
// ============================================================

export default function App() {

  // ==========================================================
  // CHAT
  // ==========================================================

  const [
    messages,
    setMessages,
  ] = useState([]);


  const [
    chats,
    setChats,
  ] = useState([]);


  const [
    input,
    setInput,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  // ==========================================================
  // LANGUAGE / VOICE
  // ==========================================================

  const [
    selectedLanguage,
    setSelectedLanguage,
  ] = useState("Auto Detect");


  const [
    selectedVoice,
    setSelectedVoice,
  ] = useState("alloy");


  // ==========================================================
  // UI
  // ==========================================================

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(true);


  const [
    activeTool,
    setActiveTool,
  ] = useState(null);


  const [
    error,
    setError,
  ] = useState("");


  const [
    speakingId,
    setSpeakingId,
  ] = useState(null);


  // ==========================================================
  // FILES
  // ==========================================================

  const [
    uploadedImage,
    setUploadedImage,
  ] = useState(null);


  const [
    uploadedFile,
    setUploadedFile,
  ] = useState(null);


  const [
    selectedAudio,
    setSelectedAudio,
  ] = useState(null);


  const [
    selectedVideo,
    setSelectedVideo,
  ] = useState(null);


  // ==========================================================
  // WEBSITE / YOUTUBE
  // ==========================================================

  const [
    websiteUrl,
    setWebsiteUrl,
  ] = useState("");


  const [
    youtubeUrl,
    setYoutubeUrl,
  ] = useState("");


  // ==========================================================
  // REFS
  // ==========================================================

  const inputRef =
    useRef(null);

  const imageInputRef =
    useRef(null);

  const documentInputRef =
    useRef(null);

  const audioInputRef =
    useRef(null);

  const videoInputRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  const currentChatIdRef =
    useRef(
      `chat-${Date.now()}`
    );


  // ==========================================================
  // LANGUAGES
  // ==========================================================

  const languages = [
    {
      code: "auto",
      name: "Auto Detect",
    },
    {
      code: "en",
      name: "English",
    },
    {
      code: "hi",
      name: "हिन्दी",
    },
    {
      code: "te",
      name: "తెలుగు",
    },
    {
      code: "kn",
      name: "ಕನ್ನಡ",
    },
    {
      code: "ta",
      name: "தமிழ்",
    },
    {
      code: "ml",
      name: "മലയാളം",
    },
    {
      code: "mr",
      name: "मराठी",
    },
    {
      code: "gu",
      name: "ગુજરાતી",
    },
    {
      code: "bn",
      name: "বাংলা",
    },
    {
      code: "pa",
      name: "ਪੰਜਾਬੀ",
    },
    {
      code: "ur",
      name: "اردو",
    },
    {
      code: "ar",
      name: "العربية",
    },
    {
      code: "zh",
      name: "中文",
    },
    {
      code: "ja",
      name: "日本語",
    },
    {
      code: "ko",
      name: "한국어",
    },
    {
      code: "fr",
      name: "Français",
    },
    {
      code: "de",
      name: "Deutsch",
    },
    {
      code: "es",
      name: "Español",
    },
    {
      code: "it",
      name: "Italiano",
    },
    {
      code: "pt",
      name: "Português",
    },
    {
      code: "ru",
      name: "Русский",
    },
  ];


  // ==========================================================
  // VOICES
  // ==========================================================

  const voices = [
    {
      code: "alloy",
      name: "Alloy",
    },
    {
      code: "ash",
      name: "Ash",
    },
    {
      code: "coral",
      name: "Coral",
    },
    {
      code: "echo",
      name: "Echo",
    },
    {
      code: "fable",
      name: "Fable",
    },
    {
      code: "onyx",
      name: "Onyx",
    },
    {
      code: "nova",
      name: "Nova",
    },
    {
      code: "sage",
      name: "Sage",
    },
    {
      code: "shimmer",
      name: "Shimmer",
    },
    {
      code: "personal",
      name: "Personal",
    },
  ];


  // ==========================================================
  // DOCUMENT TYPES
  // ==========================================================

  const documentTypes = [
    {
      type: "pdf",
      label: "PDF",
    },
    {
      type: "docx",
      label: "DOCX",
    },
    {
      type: "xlsx",
      label: "XLSX",
    },
    {
      type: "pptx",
      label: "PPTX",
    },
    {
      type: "csv",
      label: "CSV",
    },
    {
      type: "html",
      label: "HTML",
    },
    {
      type: "md",
      label: "Markdown",
    },
    {
      type: "txt",
      label: "TXT",
    },
    {
      type: "json",
      label: "JSON",
    },
    {
      type: "xml",
      label: "XML",
    },
    {
      type: "rtf",
      label: "RTF",
    },
    {
      type: "odt",
      label: "ODT",
    },
  ];


  // ==========================================================
  // LOAD CHAT HISTORY
  // ==========================================================

  useEffect(() => {

    try {

      const saved =
        localStorage.getItem(
          "truvora-chats"
        );

      if (!saved) {
        return;
      }

      const parsed =
        JSON.parse(saved);

      if (
        Array.isArray(parsed)
      ) {

        setChats(
          parsed
        );

      }

    } catch (err) {

      console.error(
        "Unable to load Truvora chats:",
        err
      );

    }

  }, []);


  // ==========================================================
  // SAVE CHAT HISTORY
  // ==========================================================

  useEffect(() => {

    try {

      localStorage.setItem(
        "truvora-chats",
        JSON.stringify(chats)
      );

    } catch (err) {

      console.error(
        "Unable to save Truvora chats:",
        err
      );

    }

  }, [chats]);


  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages, loading]);


  // ==========================================================
  // API REQUEST
  // ==========================================================

  async function apiRequest(
    endpoint,
    options = {}
  ) {

    const response =
      await fetch(
        `${API_BASE}${endpoint}`,
        {
          ...options,

          headers: {
            ...(options.body instanceof FormData
              ? {}
              : {
                  "Content-Type":
                    "application/json",
                }),

            ...(options.headers || {}),
          },
        }
      );


    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    let data;


    if (
      contentType.includes(
        "application/json"
      )
    ) {

      data =
        await response.json();

    } else {

      const text =
        await response.text();

      data = {
        success:
          response.ok,

        raw:
          text,

        error:
          response.ok
            ? null
            : text,
      };

    }


    if (!response.ok) {

      throw new Error(
        data?.error ||
        data?.message ||
        `Request failed with status ${response.status}`
      );

    }


    return data;
  }


  // ==========================================================
  // CHAT HISTORY UPDATE
  // ==========================================================

  function saveChatMessages(
    nextMessages
  ) {

    if (
      !nextMessages?.length
    ) {
      return;
    }


    const user =
      [...nextMessages]
        .reverse()
        .find(
          message =>
            message.role ===
            "user"
        );


    const title =
      getText(user)
        .slice(0, 60)
        .trim() ||
      "New Chat";


    const id =
      currentChatIdRef.current;


    const chat = {
      id,
      title,
      messages:
        nextMessages,
      updatedAt:
        new Date().toISOString(),
    };


    setChats(
      previous => {

        const without =
          previous.filter(
            item =>
              item.id !== id
          );

        return [
          chat,
          ...without,
        ];
      }
    );
  }


  // ==========================================================
  // NEW CHAT
  // ==========================================================

  function newChat() {

    setMessages([]);

    setInput("");

    setError("");

    setUploadedImage(null);

    setUploadedFile(null);

    setSelectedAudio(null);

    setSelectedVideo(null);

    setWebsiteUrl("");

    setYoutubeUrl("");

    setActiveTool(null);

    currentChatIdRef.current =
      `chat-${Date.now()}`;

    if (
      window.innerWidth <= 900
    ) {

      setSidebarOpen(false);

    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }


  // ==========================================================
  // LOAD EXISTING CHAT
  // ==========================================================

  function openChat(chat) {

    if (!chat) {
      return;
    }


    currentChatIdRef.current =
      chat.id;


    setMessages(
      Array.isArray(chat.messages)
        ? chat.messages
        : []
    );


    setError("");

    setActiveTool(null);

    if (
      window.innerWidth <= 900
    ) {

      setSidebarOpen(false);

    }

  }


  // ==========================================================
  // DELETE CHAT
  // ==========================================================

  function deleteChat(
    event,
    chatId
  ) {

    event?.stopPropagation();


    setChats(
      previous =>
        previous.filter(
          chat =>
            chat.id !== chatId
        )
    );


    if (
      currentChatIdRef.current ===
      chatId
    ) {

      newChat();

    }

  }


  // ==========================================================
  // SEND TEXT MESSAGE
  // ==========================================================

  async function sendMessage(
    providedText = null
  ) {

    const text =
      String(
        providedText ??
        input
      ).trim();


    if (
      !text ||
      loading
    ) {
      return;
    }


    setError("");

    setInput("");


    const userMessage = {
      id:
        `user-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      role:
        "user",

      text,

      content:
        text,

      time:
        formatTime(),
    };


    const nextMessages = [
      ...messages,
      userMessage,
    ];


    setMessages(
      nextMessages
    );


    setLoading(true);


    try {

      const history =
        messages
          .slice(-10)
          .map(
            message => ({
              role:
                message.role ===
                "assistant"
                  ? "assistant"
                  : "user",

              content:
                getText(
                  message
                ),
            })
          )
          .filter(
            item =>
              item.content.trim()
          );


      console.log(
        "TRUVORA CHAT:",
        text
      );


      const data =
        await apiRequest(
          "/ask",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                message:
                  text,

                history,

                language:
                  selectedLanguage,

                // IMPORTANT:
                // Web research is automatic.
                // Advanced reasoning / Agent mode
                // is automatic on the server.
                webEnabled:
                  true,

                agentMode:
                  true,
              }),
          }
        );


      const answer =
        data?.answer ||
        data?.analysis ||
        data?.reply ||
        data?.content ||
        "Truvora could not generate an answer.";


      const assistantMessage = {

        id:
          `assistant-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        role:
          "assistant",

        text:
          answer,

        content:
          answer,

        answer:
          answer,

        sources:
          Array.isArray(
            data?.sources
          )
            ? data.sources
            : [],

        image:
          data?.imageUrl ||
          data?.image ||
          null,

        imageUrl:
          data?.imageUrl ||
          data?.image ||
          null,

        type:
          data?.type ||
          "chat",

        model:
          data?.model ||
          null,

        usedWeb:
          Boolean(
            data?.usedWeb
          ),

        usedAgent:
          Boolean(
            data?.usedAgent
          ),

        time:
          formatTime(),
      };


      const completedMessages = [
        ...nextMessages,
        assistantMessage,
      ];


      setMessages(
        completedMessages
      );


      saveChatMessages(
        completedMessages
      );


    } catch (err) {

      console.error(
        "Truvora chat error:",
        err
      );


      setError(
        err?.message ||
        "Unable to connect to Truvora API."
      );


      const errorMessage = {

        id:
          `assistant-error-${Date.now()}`,

        role:
          "assistant",

        text:
          "Sorry, I couldn't complete that request.",

        content:
          "Sorry, I couldn't complete that request.",

        error:
          true,

        time:
          formatTime(),
      };


      setMessages(
        current => [
          ...current,
          errorMessage,
        ]
      );

    } finally {

      setLoading(false);

    }

  }


  // ==========================================================
  // KEYBOARD
  // ==========================================================

  function handleKeyDown(
    event
  ) {

    if (
      event.key ===
      "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }


  // ==========================================================
  // COPY
  // ==========================================================

  async function copyMessage(
    message
  ) {

    const text =
      getText(message);


    if (!text.trim()) {
      return;
    }


    try {

      await navigator.clipboard.writeText(
        text
      );

    } catch (err) {

      console.error(
        "Copy failed:",
        err
      );

    }

  }


  // ==========================================================
  // TEXT TO SPEECH
  // ==========================================================

  async function speakMessage(
    message
  ) {

    const text =
      getText(message);


    if (!text.trim()) {
      return;
    }


    if (
      speakingId ===
      message.id
    ) {

      if (
        "speechSynthesis" in
        window
      ) {

        window.speechSynthesis.cancel();

      }

      setSpeakingId(null);

      return;
    }


    try {

      if (
        "speechSynthesis" in
        window
      ) {

        window.speechSynthesis.cancel();

        const utterance =
          new SpeechSynthesisUtterance(
            text
          );


        const browserLanguage =
          selectedLanguage ===
          "te"
            ? "te-IN"
            : selectedLanguage ===
              "hi"
              ? "hi-IN"
              : selectedLanguage ===
                "kn"
                ? "kn-IN"
                : selectedLanguage ===
                  "ta"
                  ? "ta-IN"
                  : selectedLanguage ===
                    "ml"
                    ? "ml-IN"
                    : selectedLanguage ===
                      "mr"
                      ? "mr-IN"
                      : selectedLanguage ===
                        "gu"
                        ? "gu-IN"
                        : selectedLanguage ===
                          "bn"
                          ? "bn-IN"
                          : selectedLanguage ===
                            "pa"
                            ? "pa-IN"
                            : selectedLanguage ===
                              "ur"
                              ? "ur-PK"
                              : selectedLanguage ===
                                "ar"
                                ? "ar-SA"
                                : selectedLanguage ===
                                  "zh"
                                  ? "zh-CN"
                                  : selectedLanguage ===
                                    "ja"
                                    ? "ja-JP"
                                    : selectedLanguage ===
                                      "ko"
                                      ? "ko-KR"
                                      : selectedLanguage ===
                                        "fr"
                                        ? "fr-FR"
                                        : selectedLanguage ===
                                          "de"
                                          ? "de-DE"
                                          : selectedLanguage ===
                                            "es"
                                            ? "es-ES"
                                            : selectedLanguage ===
                                              "it"
                                              ? "it-IT"
                                              : selectedLanguage ===
                                                "pt"
                                                ? "pt-PT"
                                                : selectedLanguage ===
                                                  "ru"
                                                  ? "ru-RU"
                                                  : "en-US";


        utterance.lang =
          browserLanguage;


        utterance.rate =
          1;


        utterance.pitch =
          1;


        utterance.onstart =
          () =>
            setSpeakingId(
              message.id
            );


        utterance.onend =
          () =>
            setSpeakingId(
              null
            );


        utterance.onerror =
          () =>
            setSpeakingId(
              null
            );


        window.speechSynthesis.speak(
          utterance
        );


        return;
      }


      const data =
        await apiRequest(
          "/tts",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                text,

                voice:
                  selectedVoice,
              }),
          }
        );


      if (
        data?.audioUrl
      ) {

        const audio =
          new Audio(
            data.audioUrl.startsWith(
              "http"
            )
              ? data.audioUrl
              : `${API_BASE}${data.audioUrl}`
          );


        setSpeakingId(
          message.id
        );


        audio.onended =
          () =>
            setSpeakingId(
              null
            );


        audio.onerror =
          () =>
            setSpeakingId(
              null
            );


        await audio.play();

      }

    } catch (err) {

      console.error(
        "TTS error:",
        err
      );

      setSpeakingId(null);

      setError(
        err?.message ||
        "Text-to-speech failed."
      );

    }

  }
    // ==========================================================
  // IMAGE UPLOAD / IMAGE UNDERSTANDING
  // ==========================================================

  async function handleImageUpload(event) {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setLoading(true);

    const formData =
      new FormData();

    formData.append(
      "image",
      file
    );

    formData.append(
      "language",
      selectedLanguage
    );

    try {

      const data =
        await apiRequest(
          "/analyze-image",
          {
            method:
              "POST",

            body:
              formData,
          }
        );

      const assistantText =
        data?.analysis ||
        data?.answer ||
        data?.reply ||
        "Image analysis completed.";

      const nextMessages = [
        ...messages,

        {
          id:
            `user-${Date.now()}`,

          role:
            "user",

          text:
            `🖼️ Analyze image: ${file.name}`,

          content:
            `🖼️ Analyze image: ${file.name}`,

          time:
            formatTime(),
        },

        {
          id:
            `assistant-${Date.now()}`,

          role:
            "assistant",

          text:
            assistantText,

          content:
            assistantText,

          sources:
            data?.sources || [],

          image:
            data?.imageUrl ||
            data?.image ||
            null,

          imageUrl:
            data?.imageUrl ||
            data?.image ||
            null,

          time:
            formatTime(),
        },
      ];

      setMessages(
        nextMessages
      );

      saveChatMessages(
        nextMessages
      );

      setUploadedImage(
        data?.imageUrl ||
        data?.image ||
        null
      );

    } catch (err) {

      console.error(
        "TRUVORA IMAGE ERROR:",
        err
      );

      setError(
        err?.message ||
        "Image analysis failed."
      );

    } finally {

      setLoading(false);

      event.target.value = "";

    }
  }


  // ==========================================================
  // DOCUMENT ANALYSIS
  // ==========================================================

  async function handleDocumentUpload(
    event
  ) {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setLoading(true);

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "language",
      selectedLanguage
    );

    try {

      const data =
        await apiRequest(
          "/analyze-document",
          {
            method:
              "POST",

            body:
              formData,
          }
        );

      setUploadedFile(
        file.name
      );

      const assistantText =
        data?.analysis ||
        data?.answer ||
        data?.reply ||
        "Document analysis completed.";

      setMessages(
        previous => {

          const nextMessages = [
            ...previous,

            {
              id:
                `user-${Date.now()}`,

              role:
                "user",

              text:
                `📄 Analyze document: ${file.name}`,

              content:
                `📄 Analyze document: ${file.name}`,

              time:
                formatTime(),
            },

            {
              id:
                `assistant-${Date.now()}`,

              role:
                "assistant",

              text:
                assistantText,

              content:
                assistantText,

              sources:
                data?.sources ||
                [],

              time:
                formatTime(),
            },
          ];

          saveChatMessages(
            nextMessages
          );

          return nextMessages;
        }
      );

    } catch (err) {

      console.error(
        "TRUVORA DOCUMENT ERROR:",
        err
      );

      setError(
        err?.message ||
        "Document analysis failed."
      );

    } finally {

      setLoading(false);

      event.target.value = "";

    }
  }


  // ==========================================================
  // AUDIO UPLOAD
  // ==========================================================

  async function handleAudioUpload(
    event
  ) {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedAudio(
      file.name
    );

    setError("");
    setLoading(true);

    const formData =
      new FormData();

    formData.append(
      "audio",
      file
    );

    formData.append(
      "language",
      selectedLanguage
    );

    try {

      const data =
        await apiRequest(
          "/upload-audio",
          {
            method:
              "POST",

            body:
              formData,
          }
        );

      const assistantText =
        data?.analysis ||
        data?.answer ||
        data?.summary ||
        "Audio analysis completed.";

      setMessages(
        previous => {

          const nextMessages = [
            ...previous,

            {
              id:
                `user-${Date.now()}`,

              role:
                "user",

              text:
                `🎵 Analyze audio: ${file.name}`,

              content:
                `🎵 Analyze audio: ${file.name}`,

              time:
                formatTime(),
            },

            {
              id:
                `assistant-${Date.now()}`,

              role:
                "assistant",

              text:
                assistantText,

              content:
                assistantText,

              transcript:
                data?.transcript ||
                data?.text ||
                "",

              sources:
                data?.sources ||
                [],

              time:
                formatTime(),
            },
          ];

          saveChatMessages(
            nextMessages
          );

          return nextMessages;
        }
      );

    } catch (err) {

      console.error(
        "TRUVORA AUDIO ERROR:",
        err
      );

      setError(
        err?.message ||
        "Audio analysis failed."
      );

    } finally {

      setLoading(false);

      event.target.value = "";

    }
  }


  // ==========================================================
  // VIDEO UPLOAD
  // ==========================================================

  async function handleVideoUpload(
    event
  ) {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedVideo(
      file.name
    );

    setError("");
    setLoading(true);

    const formData =
      new FormData();

    formData.append(
      "video",
      file
    );

    formData.append(
      "language",
      selectedLanguage
    );

    try {

      const data =
        await apiRequest(
          "/upload-video",
          {
            method:
              "POST",

            body:
              formData,
          }
        );

      const assistantText =
        data?.analysis ||
        data?.answer ||
        data?.summary ||
        "Video analysis completed.";

      setMessages(
        previous => {

          const nextMessages = [
            ...previous,

            {
              id:
                `user-${Date.now()}`,

              role:
                "user",

              text:
                `🎬 Analyze video: ${file.name}`,

              content:
                `🎬 Analyze video: ${file.name}`,

              time:
                formatTime(),
            },

            {
              id:
                `assistant-${Date.now()}`,

              role:
                "assistant",

              text:
                assistantText,

              content:
                assistantText,

              transcript:
                data?.transcript ||
                data?.text ||
                "",

              frameUrl:
                data?.frameUrl ||
                data?.frame ||
                null,

              sources:
                data?.sources ||
                [],

              time:
                formatTime(),
            },
          ];

          saveChatMessages(
            nextMessages
          );

          return nextMessages;
        }
      );

    } catch (err) {

      console.error(
        "TRUVORA VIDEO ERROR:",
        err
      );

      setError(
        err?.message ||
        "Video analysis failed."
      );

    } finally {

      setLoading(false);

      event.target.value = "";

    }
  }


  // ==========================================================
  // WEBSITE ANALYSIS
  // ==========================================================

  async function handleWebsiteAnalysis() {

    const url =
      websiteUrl.trim();

    if (!url) {
      setError(
        "Please enter a website URL."
      );

      return;
    }

    setActiveTool(null);
    setError("");
    setLoading(true);

    try {

      const data =
        await apiRequest(
          "/analyze-website",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                url,

                language:
                  selectedLanguage,
              }),
          }
        );

      const assistantText =
        data?.analysis ||
        data?.answer ||
        data?.reply ||
        "Website analysis completed.";

      setMessages(
        previous => {

          const nextMessages = [
            ...previous,

            {
              id:
                `user-${Date.now()}`,

              role:
                "user",

              text:
                `🌐 Analyze website: ${url}`,

              content:
                `🌐 Analyze website: ${url}`,

              time:
                formatTime(),
            },

            {
              id:
                `assistant-${Date.now()}`,

              role:
                "assistant",

              text:
                assistantText,

              content:
                assistantText,

              sources:
                data?.sources ||
                [],

              usedWeb:
                true,

              time:
                formatTime(),
            },
          ];

          saveChatMessages(
            nextMessages
          );

          return nextMessages;
        }
      );

      setWebsiteUrl("");

    } catch (err) {

      console.error(
        "TRUVORA WEBSITE ERROR:",
        err
      );

      setError(
        err?.message ||
        "Website analysis failed."
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================================
  // YOUTUBE ANALYSIS
  // ==========================================================

  async function handleYoutubeAnalysis() {

    const url =
      youtubeUrl.trim();

    if (!url) {

      setError(
        "Please enter a YouTube URL."
      );

      return;
    }

    setActiveTool(null);
    setError("");
    setLoading(true);

    try {

      const data =
        await apiRequest(
          "/analyze-youtube",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                url,

                language:
                  selectedLanguage,
              }),
          }
        );

      const assistantText =
        data?.analysis ||
        data?.answer ||
        data?.summary ||
        "YouTube analysis completed.";

      setMessages(
        previous => {

          const nextMessages = [
            ...previous,

            {
              id:
                `user-${Date.now()}`,

              role:
                "user",

              text:
                `▶️ Analyze YouTube: ${url}`,

              content:
                `▶️ Analyze YouTube: ${url}`,

              time:
                formatTime(),
            },

            {
              id:
                `assistant-${Date.now()}`,

              role:
                "assistant",

              text:
                assistantText,

              content:
                assistantText,

              transcript:
                data?.transcript ||
                data?.text ||
                "",

              sources:
                data?.sources ||
                [],

              time:
                formatTime(),
            },
          ];

          saveChatMessages(
            nextMessages
          );

          return nextMessages;
        }
      );

      setYoutubeUrl("");

    } catch (err) {

      console.error(
        "TRUVORA YOUTUBE ERROR:",
        err
      );

      setError(
        err?.message ||
        "YouTube analysis failed."
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================================
  // IMAGE GENERATION
  // ==========================================================

  async function generateImage(
    suppliedPrompt = null
  ) {

    let prompt =
      suppliedPrompt;

    if (
      !prompt
    ) {

      prompt =
        window.prompt(
          "What image should Truvora create?"
        );

    }

    prompt =
      String(
        prompt || ""
      ).trim();

    if (!prompt) {
      return;
    }

    setError("");
    setLoading(true);

    try {

      const data =
        await apiRequest(
          "/generate-image",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                prompt,

                language:
                  selectedLanguage,
              }),
          }
        );

      const imageUrl =
        data?.imageUrl ||
        data?.image ||
        data?.url ||
        null;

      const nextMessages = [
        ...messages,

        {
          id:
            `user-${Date.now()}`,

          role:
            "user",

          text:
            `🎨 Create image: ${prompt}`,

          content:
            `🎨 Create image: ${prompt}`,

          time:
            formatTime(),
        },

        {
          id:
            `assistant-${Date.now()}`,

          role:
            "assistant",

          text:
            data?.answer ||
            data?.message ||
            "Image generated successfully.",

          content:
            data?.answer ||
            data?.message ||
            "Image generated successfully.",

          image:
            imageUrl,

          imageUrl:
            imageUrl,

          time:
            formatTime(),
        },
      ];

      setMessages(
        nextMessages
      );

      saveChatMessages(
        nextMessages
      );

    } catch (err) {

      console.error(
        "TRUVORA IMAGE GENERATION ERROR:",
        err
      );

      setError(
        err?.message ||
        "Image generation failed."
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================================
  // DOCUMENT GENERATION
  // ==========================================================

  async function generateDocument(
    type,
    message
  ) {

    const content =
      String(
        message || ""
      ).trim();

    if (!content) {

      setError(
        "There is no content to generate."
      );

      return;
    }

    setError("");
    setLoading(true);

    try {

      const data =
        await apiRequest(
          "/generate-document",
          {
            method:
              "POST",

            body:
              JSON.stringify({

                type,

                summary:
                  content,

                analysis:
                  content,

                recommendations:
                  "",

                sources:
                  [],
              }),
          }
        );

      const returnedUrl =
        data?.url ||
        data?.downloadUrl ||
        data?.fileUrl ||
        null;

      if (!returnedUrl) {

        throw new Error(
          "The server did not return a file URL."
        );

      }

      const downloadUrl =
        /^https?:\/\//i.test(
          returnedUrl
        )
          ? returnedUrl
          : `${API_BASE}${
              returnedUrl.startsWith("/")
                ? ""
                : "/"
            }${returnedUrl}`;

      try {

        const response =
          await fetch(
            downloadUrl
          );

        if (
          response.ok
        ) {

          const blob =
            await response.blob();

          const filename =
            data?.filename ||
            `truvora.${type}`;

          downloadBlob(
            blob,
            filename
          );

        } else {

          window.open(
            downloadUrl,
            "_blank",
            "noopener,noreferrer"
          );

        }

      } catch {

        window.open(
          downloadUrl,
          "_blank",
          "noopener,noreferrer"
        );

      }

    } catch (err) {

      console.error(
        "TRUVORA DOCUMENT GENERATION ERROR:",
        err
      );

      setError(
        err?.message ||
        "Document generation failed."
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================================
  // SOURCE OPEN
  // ==========================================================

  function openSource(
    url
  ) {

    if (!url) {
      return;
    }

    try {

      const safeUrl =
        new URL(
          url,
          window.location.origin
        );

      window.open(
        safeUrl.href,
        "_blank",
        "noopener,noreferrer"
      );

    } catch {

      console.warn(
        "Invalid source URL:",
        url
      );

    }
  }


  // ==========================================================
  // CLOSE TOOL
  // ==========================================================

  function closeTool() {

    setActiveTool(
      null
    );

  }


  // ==========================================================
  // TOOL MODAL
  // ==========================================================

  function renderToolModal() {

    if (!activeTool) {
      return null;
    }

    return (
      <div
        className="truvora-modal-backdrop"
        onClick={closeTool}
      >

        <div
          className="truvora-modal"
          onClick={event =>
            event.stopPropagation()
          }
        >

          {activeTool ===
            "website" && (
            <>

              <div className="modal-title">
                🌐 Website Analysis
              </div>

              <div className="modal-description">
                Enter a website URL and Truvora will analyze it.
              </div>

              <input
                className="modal-input"
                value={
                  websiteUrl
                }
                onChange={event =>
                  setWebsiteUrl(
                    event.target.value
                  )
                }
                placeholder="https://example.com"
                autoFocus
                onKeyDown={event => {

                  if (
                    event.key ===
                    "Enter"
                  ) {

                    handleWebsiteAnalysis();

                  }

                }}
              />

              <button
                className="modal-primary"
                onClick={
                  handleWebsiteAnalysis
                }
                disabled={
                  loading ||
                  !websiteUrl.trim()
                }
              >
                🔎 Analyze Website
              </button>

            </>
          )}


          {activeTool ===
            "youtube" && (
            <>

              <div className="modal-title">
                ▶️ YouTube Analysis
              </div>

              <div className="modal-description">
                Paste a YouTube video URL and Truvora will analyze it.
              </div>

              <input
                className="modal-input"
                value={
                  youtubeUrl
                }
                onChange={event =>
                  setYoutubeUrl(
                    event.target.value
                  )
                }
                placeholder="https://www.youtube.com/watch?v=..."
                autoFocus
                onKeyDown={event => {

                  if (
                    event.key ===
                    "Enter"
                  ) {

                    handleYoutubeAnalysis();

                  }

                }}
              />

              <button
                className="modal-primary"
                onClick={
                  handleYoutubeAnalysis
                }
                disabled={
                  loading ||
                  !youtubeUrl.trim()
                }
              >
                ▶️ Analyze YouTube
              </button>

            </>
          )}


          <button
            className="modal-cancel"
            onClick={
              closeTool
            }
          >
            Cancel
          </button>

        </div>

      </div>
    );
  }


  // ==========================================================
  // MESSAGE RENDERER
  // ==========================================================

  function renderMessage(
    message
  ) {

    const isUser =
      message.role ===
      "user";

    const text =
      getText(message);

    return (
      <div
        key={
          message.id
        }
        className={
          `message-row ${
            isUser
              ? "user-row"
              : "assistant-row"
          }`
        }
      >

        <div
          className={
            `message-avatar ${
              isUser
                ? "user-avatar"
                : "assistant-avatar"
            }`
          }
        >
          {isUser
            ? "U"
            : "T"}
        </div>


        <div className="message-bubble-wrapper">

          {!isUser && (
            <div className="assistant-label">
              <span className="assistant-dot" />
              Truvora
            </div>
          )}


          <div
            className={
              `message-bubble ${
                isUser
                  ? "user-bubble"
                  : "assistant-bubble"
              }`
            }
          >

            {message.image && (
              <div className="generated-image-wrapper">

                <img
                  className="generated-image"
                  src={
                    message.image
                  }
                  alt="Truvora generated"
                  loading="lazy"
                />

                <a
                  className="image-download-link"
                  href={
                    message.image
                  }
                  target="_blank"
                  rel="noreferrer"
                  download
                >
                  ↓ Open image
                </a>

              </div>
            )}


            {message.frameUrl && (
              <div className="generated-image-wrapper">

                <img
                  className="generated-image"
                  src={
                    message.frameUrl
                  }
                  alt="Video frame"
                  loading="lazy"
                />

              </div>
            )}


            {text && (
              <div className="message-content">
                {text}
              </div>
            )}


            {!isUser &&
              message.transcript && (

              <details
                className="transcript-details"
              >

                <summary>
                  📝 Transcript
                </summary>

                <div className="transcript-content">
                  {
                    message.transcript
                  }
                </div>

              </details>

            )}


            {!isUser &&
              Array.isArray(
                message.sources
              ) &&
              message.sources.length >
                0 && (

              <div className="sources-section">

                <div className="sources-title">
                  📚 Sources
                </div>

                <div className="sources-list">

                  {message.sources.map(
                    (
                      source,
                      index
                    ) => {

                      const url =
                        source?.url ||
                        source?.link ||
                        source?.href;

                      return (
                        <button
                          key={
                            source?.id ||
                            index
                          }
                          className="source-link"
                          onClick={() =>
                            openSource(
                              url
                            )
                          }
                          type="button"
                        >

                          <span>
                            [
                            {
                              source?.id ||
                              index + 1
                            }
                            ]
                          </span>

                          <span>
                            {
                              source?.title ||
                              source?.source ||
                              url ||
                              "Source"
                            }
                          </span>

                        </button>
                      );

                    }
                  )}

                </div>

              </div>

            )}


            {!isUser &&
              (
                message.usedWeb ||
                message.usedAgent ||
                message.model
              ) && (

              <div className="message-meta-badges">

                {message.usedWeb && (
                  <span>
                    🌐 Web
                  </span>
                )}

                {message.usedAgent && (
                  <span>
                    🤖 Advanced
                  </span>
                )}

                {message.model && (
                  <span>
                    {message.model}
                  </span>
                )}

              </div>

            )}

          </div>


          {!isUser && (
            <div className="message-actions">

              <button
                className="message-action-button"
                type="button"
                title="Copy"
                onClick={() =>
                  copyMessage(
                    message
                  )
                }
              >
                📋
              </button>


              <button
                className="message-action-button"
                type="button"
                title={
                  speakingId ===
                  message.id
                    ? "Stop reading"
                    : "Read aloud"
                }
                onClick={() =>
                  speakMessage(
                    message
                  )
                }
              >
                {speakingId ===
                message.id
                  ? "⏹️"
                  : "🔊"}
              </button>


              {documentTypes.map(
                item => (
                  <button
                    key={
                      item.type
                    }
                    className="message-action-button document-action"
                    type="button"
                    title={
                      `Download ${item.label}`
                    }
                    onClick={() =>
                      generateDocument(
                        item.type,
                        text
                      )
                    }
                  >
                    ↓ {item.label}
                  </button>
                )
              )}

            </div>
          )}

        </div>

      </div>
    );
  }
    // ==========================================================
  // TOOL BUTTONS
  // ==========================================================

  function ToolButton({
    icon,
    label,
    onClick,
  }) {
    return (
      <button
        type="button"
        className="composer-tool"
        onClick={onClick}
        disabled={loading}
      >
        <span className="composer-tool-icon">
          {icon}
        </span>

        <span>
          {label}
        </span>
      </button>
    );
  }


  // ==========================================================
  // SIDEBAR
  // ==========================================================

  function renderSidebar() {

    return (
      <aside
        className={
          `app-sidebar ${
            sidebarOpen
              ? "sidebar-open"
              : "sidebar-closed"
          }`
        }
      >

        <div className="sidebar-header">

          <div className="brand">

            <div className="brand-logo">
              T
            </div>

            <div className="brand-text">

              <strong>
                TRUVORA
              </strong>

              <span>
                Global AI
              </span>

            </div>

          </div>


          <button
            className="sidebar-close"
            type="button"
            aria-label="Close sidebar"
            onClick={() =>
              setSidebarOpen(
                false
              )
            }
          >
            ×
          </button>

        </div>


        <div className="sidebar-content">

          <button
            className="new-chat-button"
            type="button"
            onClick={
              newChat
            }
          >
            <span>
              +
            </span>

            <span>
              New Chat
            </span>
          </button>


          <div className="chat-search">

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search chats"
              onChange={event => {

                const value =
                  event.target.value
                    .toLowerCase();

                if (
                  !value
                ) {

                  // Restore all chats naturally
                  setChats(
                    previous =>
                      [...previous]
                  );

                }

              }}
            />

          </div>


          <div className="sidebar-section-title">
            RECENT
          </div>


          <div className="chat-list">

            {chats.length ===
              0 ? (

              <div className="empty-chats">
                No chats yet
              </div>

            ) : (

              chats.map(
                chat => (

                  <div
                    key={
                      chat.id
                    }
                    className={
                      `chat-list-item ${
                        currentChatIdRef.current ===
                        chat.id
                          ? "active"
                          : ""
                      }`
                    }
                    onClick={() =>
                      openChat(
                        chat
                      )
                    }
                  >

                    <div className="chat-list-icon">
                      💬
                    </div>

                    <div className="chat-list-title">
                      {
                        chat.title ||
                        "New Chat"
                      }
                    </div>

                    <button
                      className="chat-delete"
                      type="button"
                      title="Delete chat"
                      onClick={event =>
                        deleteChat(
                          event,
                          chat.id
                        )
                      }
                    >
                      ×
                    </button>

                  </div>

                )
              )

            )}

          </div>

        </div>


        <div className="sidebar-footer">

          <div className="online-indicator">
            <span />
            Truvora AI
          </div>

          <div className="sidebar-footer-text">
            Intelligence • Innovation • Trust
          </div>

        </div>

      </aside>
    );
  }


  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  function renderEmptyState() {

    return (
      <div className="empty-state">

        <div className="empty-logo">
          T
        </div>

        <h1>
          How can I help you?
        </h1>

        <p>
          Ask Truvora anything, analyze files,
          create images, process audio and video,
          or research the web automatically.
        </p>


        <div className="suggestion-grid">

          <button
            type="button"
            onClick={() =>
              sendMessage(
                "Explain artificial intelligence in simple words."
              )
            }
          >
            Explain AI
          </button>


          <button
            type="button"
            onClick={() =>
              sendMessage(
                "Write a clean modern example of code."
              )
            }
          >
            Write code
          </button>


          <button
            type="button"
            onClick={() =>
              setActiveTool(
                "website"
              )
            }
          >
            Analyze website
          </button>


          <button
            type="button"
            onClick={() =>
              generateImage(
                "A beautiful futuristic city at sunset."
              )
            }
          >
            Create image
          </button>

        </div>

      </div>
    );
  }


  // ==========================================================
  // HEADER
  // ==========================================================

  function renderHeader() {

    return (
      <header className="topbar">

        <div className="topbar-left">

          <button
            className="menu-button"
            type="button"
            aria-label="Open menu"
            onClick={() =>
              setSidebarOpen(
                previous =>
                  !previous
              )
            }
          >
            ☰
          </button>

          <div className="topbar-title">
            {
              messages.length
                ? (
                  chats.find(
                    chat =>
                      chat.id ===
                      currentChatIdRef.current
                  )?.title ||
                  "Truvora"
                )
                : "New Chat"
            }
          </div>

        </div>


        <div className="topbar-controls">

          <select
            value={
              selectedLanguage
            }
            onChange={event =>
              setSelectedLanguage(
                event.target.value
              )
            }
            aria-label="Language"
          >

            {languages.map(
              language => (

                <option
                  key={
                    language.code
                  }
                  value={
                    language.code ===
                    "auto"
                      ? "Auto Detect"
                      : language.code
                  }
                >
                  {
                    language.name
                  }
                </option>

              )
            )}

          </select>


          <select
            value={
              selectedVoice
            }
            onChange={event =>
              setSelectedVoice(
                event.target.value
              )
            }
            aria-label="Voice"
          >

            {voices.map(
              voice => (

                <option
                  key={
                    voice.code
                  }
                  value={
                    voice.code
                  }
                >
                  {
                    voice.name
                  }
                </option>

              )
            )}

          </select>

        </div>

      </header>
    );
  }


  // ==========================================================
  // COMPOSER
  // ==========================================================

  function renderComposer() {

    return (
      <div className="composer-area">

        <div className="composer-tools">

          <ToolButton
            icon="📎"
            label="Files"
            onClick={() =>
              documentInputRef.current?.click()
            }
          />


          <ToolButton
            icon="🖼️"
            label="Image"
            onClick={() =>
              imageInputRef.current?.click()
            }
          />


          <ToolButton
            icon="🎤"
            label="Voice"
            onClick={() => {

              if (
                !("webkitSpeechRecognition" in window) &&
                !("SpeechRecognition" in window)
              ) {

                setError(
                  "Voice input is not supported by this browser."
                );

                return;
              }


              const Recognition =
                window.SpeechRecognition ||
                window.webkitSpeechRecognition;


              const recognition =
                new Recognition();


              recognition.lang =
                selectedLanguage ===
                "te"
                  ? "te-IN"
                  : selectedLanguage ===
                    "hi"
                    ? "hi-IN"
                    : selectedLanguage ===
                      "kn"
                      ? "kn-IN"
                      : selectedLanguage ===
                        "ta"
                        ? "ta-IN"
                        : "en-US";


              recognition.interimResults =
                false;


              recognition.maxAlternatives =
                1;


              recognition.onresult =
                event => {

                  const spoken =
                    event.results?.[0]?.[0]?.transcript ||
                    "";

                  setInput(
                    previous =>
                      previous
                        ? `${previous} ${spoken}`
                        : spoken
                  );

                };


              recognition.onerror =
                event => {

                  console.error(
                    "Voice input error:",
                    event.error
                  );

                };


              recognition.start();

            }}
          />


          <ToolButton
            icon="🔊"
            label="Audio"
            onClick={() =>
              audioInputRef.current?.click()
            }
          />


          <ToolButton
            icon="🎬"
            label="Video"
            onClick={() =>
              videoInputRef.current?.click()
            }
          />


          <ToolButton
            icon="▶️"
            label="YouTube"
            onClick={() =>
              setActiveTool(
                "youtube"
              )
            }
          />


          <ToolButton
            icon="🌐"
            label="Website"
            onClick={() =>
              setActiveTool(
                "website"
              )
            }
          />

        </div>


        <div className="composer-box">

          <textarea
            ref={
              inputRef
            }
            value={
              input
            }
            onChange={event =>
              setInput(
                event.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            placeholder="Message Truvora..."
            rows={1}
            disabled={
              loading
            }
            aria-label="Message Truvora"
          />


          <button
            className={
              `send-button ${
                loading
                  ? "sending"
                  : ""
              }`
            }
            type="button"
            onClick={() =>
              sendMessage()
            }
            disabled={
              loading ||
              !input.trim()
            }
            aria-label="Send message"
          >
            {loading
              ? "..."
              : "↑"}
          </button>

        </div>


        <div className="composer-footer">

          <span>
            {uploadedFile
              ? `📄 ${uploadedFile}`
              : selectedAudio
                ? `🎵 ${selectedAudio}`
                : selectedVideo
                  ? `🎬 ${selectedVideo}`
                  : "Auto AI"}
          </span>

          <span>
            Truvora can make mistakes.
            Check important information.
          </span>

        </div>

      </div>
    );
  }


  // ==========================================================
  // ERROR BANNER
  // ==========================================================

  function renderError() {

    if (!error) {
      return null;
    }

    return (
      <div className="error-banner">

        <span>
          ⚠️
        </span>

        <div>
          {error}
        </div>

        <button
          type="button"
          onClick={() =>
            setError("")
          }
          aria-label="Close error"
        >
          ×
        </button>

      </div>
    );
  }


  // ==========================================================
  // HIDDEN INPUTS
  // ==========================================================

  function renderHiddenInputs() {

    return (
      <>

        <input
          ref={
            imageInputRef
          }
          type="file"
          accept="image/*"
          className="hidden-input"
          onChange={
            handleImageUpload
          }
        />


        <input
          ref={
            documentInputRef
          }
          type="file"
          accept="
            .pdf,
            .doc,
            .docx,
            .xls,
            .xlsx,
            .csv,
            .txt,
            .rtf,
            .md,
            .json,
            .xml,
            .html,
            .ppt,
            .pptx,
            .odt
          "
          className="hidden-input"
          onChange={
            handleDocumentUpload
          }
        />


        <input
          ref={
            audioInputRef
          }
          type="file"
          accept="
            audio/*
          "
          className="hidden-input"
          onChange={
            handleAudioUpload
          }
        />


        <input
          ref={
            videoInputRef
          }
          type="file"
          accept="
            video/*
          "
          className="hidden-input"
          onChange={
            handleVideoUpload
          }
        />

      </>
    );
  }


  // ==========================================================
  // MAIN RENDER
  // ==========================================================

  return (
    <div
      className={
        `truvora-app ${
          sidebarOpen
            ? "sidebar-visible"
            : "sidebar-hidden"
        }`
      }
    >

      {renderSidebar()}


      <main className="main-area">

        {renderHeader()}


        <section className="chat-area">

          {messages.length ===
            0 ? (

            renderEmptyState()

          ) : (

            <div className="messages-container">

              {messages.map(
                message =>
                  renderMessage(
                    message
                  )
              )}


              {loading && (
                <div className="message-row assistant-row">

                  <div className="message-avatar assistant-avatar">
                    T
                  </div>

                  <div className="message-bubble-wrapper">

                    <div className="assistant-label">
                      <span className="assistant-dot" />
                      Truvora
                    </div>

                    <div className="message-bubble assistant-bubble">

                      <div className="typing-indicator">

                        <span />
                        <span />
                        <span />

                      </div>

                    </div>

                  </div>

                </div>
              )}


              <div
                ref={
                  messagesEndRef
                }
              />

            </div>

          )}

        </section>


        {renderError()}


        {renderComposer()}

      </main>


      {renderToolModal()}


      {renderHiddenInputs()}


      {sidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() =>
            setSidebarOpen(
              false
            )
          }
        />
      )}

    </div>
  );
}