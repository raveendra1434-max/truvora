/*
========================================================
TRUVORA GLOBAL AI
Enterprise Frontend — App.js
========================================================

Brand:
TRUVORA GLOBAL AI
Intelligence • Innovation • Trust

Core principles:
- Clean UI
- Responsive/mobile-first behavior
- Automatic Web capability
- Automatic Agent capability
- Manual Web/Agent controls remain available
- Clean citations
- Multimodal input
- Firebase cloud chats
- Document generation
- Voice/TTS
- Image/video/audio/YouTube/website analysis
========================================================
*/

import "./App.css";

import { languageGroups } from "./data/languageGroups";

import Select from "react-select";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";

import {
  FiSend,
  FiPlus,
  FiMenu,
  FiCopy,
  FiUser,
  FiUpload,
  FiMic,
  FiSquare,
  FiVolume2,
  FiGlobe,
  FiCpu,
  FiX,
  FiSearch,
  FiCamera,
  FiVideo,
  FiFileText,
  FiMusic,
  FiExternalLink,
  FiDownload,
  FiShare2,
  FiSave,
} from "react-icons/fi";

import {
  CopyToClipboard,
} from "react-copy-to-clipboard";

import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

import { useDropzone } from "react-dropzone";

import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";


/* ======================================================
   FIREBASE
====================================================== */

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


/* ======================================================
   CONSTANTS
====================================================== */

const API_BASE =
  "https://truvora-backend.onrender.com";


const TRUVORA_BRAND = {
  name: "TRUVORA",
  product: "GLOBAL AI",
  slogan:
    "Intelligence • Innovation • Trust",
};


const VOICE_OPTIONS = [

  {
    id: "alloy",
    name: "Alloy",
  },

  {
    id: "ash",
    name: "Ash",
  },

  {
    id: "ballad",
    name: "Ballad",
  },

  {
    id: "coral",
    name: "Coral",
  },

  {
    id: "echo",
    name: "Echo",
  },

  {
    id: "fable",
    name: "Fable",
  },

  {
    id: "nova",
    name: "Nova",
  },

  {
    id: "onyx",
    name: "Onyx",
  },

  {
    id: "sage",
    name: "Sage",
  },

  {
    id: "shimmer",
    name: "Shimmer",
  },

  {
    id: "verse",
    name: "Verse",
  },

  {
    id: "marin",
    name: "Marin",
  },

  {
    id: "cedar",
    name: "Cedar",
  },

  {
    id: "personal",
    name: "🎤 Personal Voice",
  },

];


/* ======================================================
   HELPERS
====================================================== */

function safeJsonParse(value, fallback = null) {

  try {

    return JSON.parse(value);

  } catch {

    return fallback;

  }

}


function getFileUrl(path) {

  if (!path)
    return null;

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {

    return path;

  }

  return `${API_BASE}${path}`;

}


function getDomain(url) {

  if (!url)
    return "";

  try {

    return new URL(url)
      .hostname
      .replace(/^www\./, "");

  } catch {

    return "";

  }

}


/* ======================================================
   AUTOMATIC WEB DETECTION
====================================================== */

function shouldAutomaticallyUseWeb(text = "") {

  const value =
    text
      .toLowerCase()
      .trim();


  if (!value)
    return false;


  const currentInformationPatterns = [

    "today",
    "right now",
    "currently",
    "current",
    "latest",
    "recent",
    "breaking",
    "this week",
    "this month",
    "this year",
    "tomorrow",
    "yesterday",

    "price",
    "stock price",
    "share price",
    "bitcoin price",
    "crypto price",

    "weather",
    "news",

    "who is the current",
    "who's the current",

    "president",
    "prime minister",
    "ceo",

    "score",
    "live score",

    "schedule",
    "standings",

    "availability",

    "release date",

    "version",
    "latest version",

    "compare prices",

    "buy",
    "shopping",

  ];


  return currentInformationPatterns.some(
    (pattern) =>
      value.includes(pattern)
  );

}


/* ======================================================
   AUTOMATIC AGENT DETECTION
====================================================== */

function shouldAutomaticallyUseAgent(text = "") {

  const value =
    text
      .toLowerCase()
      .trim();


  if (!value)
    return false;


  const agentPatterns = [

    "step by step",
    "do everything",
    "handle everything",
    "research and",
    "find and",
    "compare and",
    "analyze and",
    "create and",
    "generate and",
    "prepare and",
    "build and",
    "plan and",
    "organize and",
    "multiple tasks",
    "complete this task",
    "automate",

  ];


  return agentPatterns.some(
    (pattern) =>
      value.includes(pattern)
  );

}


/* ======================================================
   LOCAL CHAT STORAGE
====================================================== */

function saveLocalChat(chat) {

  try {

    const key =
      `truvora-chat-${Date.now()}`;

    localStorage.setItem(
      key,
      JSON.stringify(chat)
    );

  } catch (error) {

    console.error(
      "Local chat save error:",
      error
    );

  }

}


/* ======================================================
   APP
====================================================== */

function App() {


  /* ====================================================
     AUTH
  ==================================================== */

  const [loggedIn,
    setLoggedIn] =
    useState(false);

  const [user,
    setUser] =
    useState(null);


  /* ====================================================
     CHAT
  ==================================================== */

  const [messages,
    setMessages] =
    useState([]);

  const [chats,
    setChats] =
    useState([]);

  const [currentChatId,
    setCurrentChatId] =
    useState(null);

  const [searchTerm,
    setSearchTerm] =
    useState("");

  const [input,
    setInput] =
    useState("");


  /* ====================================================
     UI
  ==================================================== */

  const [sidebarOpen,
    setSidebarOpen] =
    useState(true);

  const [loading,
    setLoading] =
    useState(false);

  const [typingText,
    setTypingText] =
    useState("");

  const [stopGeneration,
    setStopGeneration] =
    useState(false);


  /* ====================================================
     WEB + AGENT
  ==================================================== */

  const [webEnabled,
    setWebEnabled] =
    useState(false);

  const [agentMode,
    setAgentMode] =
    useState(false);


  /* ====================================================
     LANGUAGE
  ==================================================== */

  const [selectedLanguage,
    setSelectedLanguage] =
    useState("English");


  /* ====================================================
     VOICE
  ==================================================== */

  const [selectedVoice,
    setSelectedVoice] =
    useState("alloy");

  const [voiceEnabled,
    setVoiceEnabled] =
    useState(true);

  const [personalVoice,
    setPersonalVoice] =
    useState(null);

  const [showPersonalVoice,
    setShowPersonalVoice] =
    useState(false);


  /* ====================================================
     FILE / MEDIA
  ==================================================== */

  const [pdfText,
    setPdfText] =
    useState("");

  const [image,
    setImage] =
    useState(null);

  const [showCamera,
    setShowCamera] =
    useState(false);

  const [showAnalyzeMenu,
    setShowAnalyzeMenu] =
    useState(false);

  const [showYouTubeSearch,
    setShowYouTubeSearch] =
    useState(false);

  const [youtubeQuery,
    setYoutubeQuery] =
    useState("");

  const [showWebsiteSearch,
    setShowWebsiteSearch] =
    useState(false);

  const [websiteUrl,
    setWebsiteUrl] =
    useState("");


  /* ====================================================
     REFS
  ==================================================== */

  const videoRef =
    useRef(null);

  const canvasRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  const audioRef =
    useRef(null);

  const documentUploadRef =
    useRef(null);

  const imageUploadRef =
    useRef(null);


  /* ====================================================
     SPEECH RECOGNITION
  ==================================================== */

  const {
    transcript,
    resetTranscript,
    listening,
  } =
    useSpeechRecognition();


  /* ====================================================
     LANGUAGE OPTIONS
  ==================================================== */

  const languageOptions =
    useMemo(
      () =>
        languageGroups || [],
      []
    );


  const flattenedLanguages =
    useMemo(
      () =>
        languageOptions.flatMap(
          (group) =>
            group.options || []
        ),
      [languageOptions]
    );


  const selectedLanguageOption =
    flattenedLanguages.find(
      (option) =>
        option.label ===
        selectedLanguage
    ) || null;


  const getLanguageCode =
    () =>
      selectedLanguageOption?.value ||
      "en";


  /* ====================================================
     AUTH STATE
  ==================================================== */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          if (currentUser) {

            setUser(
              currentUser
            );

            setLoggedIn(
              true
            );


            try {

              const cloudChats =
                await loadUserChats(
                  currentUser.uid
                );


              if (
                Array.isArray(
                  cloudChats
                )
              ) {

                setChats(
                  cloudChats
                );

              }

            } catch (error) {

              console.error(
                "Cloud chat loading error:",
                error
              );

            }

          } else {

            setUser(null);

            setLoggedIn(
              false
            );

          }

        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* ====================================================
     LOCAL CHATS
  ==================================================== */

  useEffect(() => {

    const localChats = [];


    try {

      for (
        let index = 0;
        index < localStorage.length;
        index++
      ) {

        const key =
          localStorage.key(index);


        if (
          !key?.startsWith(
            "truvora-chat-"
          )
        )
          continue;


        const chat =
          safeJsonParse(
            localStorage.getItem(
              key
            )
          );


        if (chat) {

          localChats.push(
            chat
          );

        }

      }


      setChats(
        (previous) => {

          if (
            previous.length
          ) {

            return previous;

          }

          return localChats;

        }
      );

    } catch (error) {

      console.error(
        "Local chat loading error:",
        error
      );

    }

  }, []);


  /* ====================================================
     SPEECH → INPUT
  ==================================================== */

  useEffect(() => {

    if (
      typeof transcript ===
      "string"
    ) {

      setInput(
        transcript
      );

    }

  }, [transcript]);


  /* ====================================================
     SPEECH → SEND
  ==================================================== */

  useEffect(() => {

    if (
      !listening &&
      transcript?.trim()
    ) {

      const spokenText =
        transcript.trim();


      resetTranscript();


      handleSend(
        spokenText
      );

    }

  }, [listening]);


  /* ====================================================
     AUTO SCROLL
  ==================================================== */

  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior:
          "smooth",
      });

  }, [
    messages,
    loading,
    typingText,
  ]);


  /* ====================================================
     CAMERA
  ==================================================== */

  useEffect(() => {

    if (!showCamera)
      return;


    if (
      !navigator.mediaDevices
        ?.getUserMedia
    ) {

      console.error(
        "Camera API unavailable."
      );

      return;

    }


    let stream;


    navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then(
        (cameraStream) => {

          stream =
            cameraStream;


          if (
            videoRef.current
          ) {

            videoRef.current.srcObject =
              cameraStream;

          }

        }
      )
      .catch(
        (error) => {

          console.error(
            "Camera error:",
            error
          );

        }
      );


    return () => {

      stream
        ?.getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

    };

  }, [showCamera]);


  /* ====================================================
     GOOGLE LOGIN
  ==================================================== */

  const handleGoogleLogin =
    async () => {

      try {

        await signInWithPopup(
          auth,
          googleProvider
        );


      } catch (error) {

        console.error(
          "Google login error:",
          error
        );


        alert(
          "Google login failed. Please try again."
        );

      }

    };


  /* ====================================================
     LOGOUT
  ==================================================== */

  const handleLogout =
    async () => {

      try {

        await signOut(
          auth
        );


        setMessages([]);

        setUser(null);

        setLoggedIn(
          false
        );


      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

      }

    };


  /* ====================================================
     SAVE CHAT
  ==================================================== */

  const saveCurrentChat =
    async (
      updatedMessages
    ) => {

      const chat = {

        id:
          currentChatId ||
          Date.now(),

        messages:
          updatedMessages,

        updatedAt:
          new Date().toISOString(),

      };


      saveLocalChat(
        chat
      );


      setChats(
        (previous) => [

          chat,

          ...previous.filter(
            (item) =>
              item.id !==
              chat.id
          ),

        ]
      );


      if (!user)
        return;


      try {

        const savedId =
          await saveChatToCloud(
            user.uid,
            currentChatId,
            updatedMessages
          );


        if (
          savedId
        ) {

          setCurrentChatId(
            savedId
          );

        }


        const cloudChats =
          await loadUserChats(
            user.uid
          );


        if (
          Array.isArray(
            cloudChats
          )
        ) {

          setChats(
            cloudChats
          );

        }

      } catch (error) {

        console.error(
          "Cloud save error:",
          error
        );

      }

    };


  /* ====================================================
     NEW CHAT
  ==================================================== */

  const handleNewChat =
    () => {

      if (
        audioRef.current
      ) {

        audioRef.current.pause();

        audioRef.current.currentTime =
          0;

        audioRef.current =
          null;

      }


      setMessages([]);

      setInput("");

      setPdfText("");

      setImage(null);

      setCurrentChatId(
        null
      );

      setTypingText("");

      setSidebarOpen(
        false
      );

    };


  /* ====================================================
     SPEAK TEXT
  ==================================================== */

  const speakText =
    async (text) => {

      if (
        !voiceEnabled ||
        !text?.trim()
      )
        return;


      try {

        if (
          audioRef.current
        ) {

          audioRef.current.pause();

          audioRef.current.currentTime =
            0;

          audioRef.current =
            null;

        }


        const response =
          await fetch(
            `${API_BASE}/tts`,
            {

              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({

                  text:
                    text.trim(),

                  voice:
                    selectedVoice,

                  personalVoice,

                }),

            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            `TTS failed: ${response.status}`
          );

        }


        const data =
          await response.json();


        if (
          !data.audioUrl
        ) {

          throw new Error(
            "No audio URL returned."
          );

        }


        const audioResponse =
          await fetch(
            data.audioUrl
          );


        const blob =
          await audioResponse.blob();


        const audioUrl =
          URL.createObjectURL(
            blob
          );


        const audio =
          new Audio(
            audioUrl
          );


        audioRef.current =
          audio;


        audio.onended =
          () => {

            URL.revokeObjectURL(
              audioUrl
            );


            if (
              audioRef.current ===
              audio
            ) {

              audioRef.current =
                null;

            }

          };


        await audio.play();


      } catch (error) {

        console.error(
          "TTS error:",
          error
        );

      }

    };


  /* ====================================================
     CAPTURE CAMERA PHOTO
  ==================================================== */

  const capturePhoto =
    async () => {

      const video =
        videoRef.current;

      const canvas =
        canvasRef.current;


      if (
        !video ||
        !canvas
      )
        return;


      try {

        canvas.width =
          video.videoWidth;

        canvas.height =
          video.videoHeight;


        const context =
          canvas.getContext(
            "2d"
          );


        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );


        const imageData =
          canvas.toDataURL(
            "image/jpeg",
            0.95
          );


        setImage(
          imageData
        );


        setShowCamera(
          false
        );


        await handleSend(
          "Analyze this image in detail. Describe what you see, identify important objects, read visible text, and give me a clear summary.",
          imageData
        );


      } catch (error) {

        console.error(
          "Camera capture error:",
          error
        );

      }

    };


  /* ====================================================
     DOCUMENT ANALYSIS
  ==================================================== */

  const handlePdfUpload =
    async (file) => {

      if (!file)
        return;


      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      try {

        const response =
          await fetch(
            `${API_BASE}/analyze-document`,
            {

              method:
                "POST",

              body:
                formData,

            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          throw new Error(
            data.error ||
            "Document analysis failed."
          );

        }


        setPdfText(
          data.documentText ||
          ""
        );


        const documentMessage = {

          role:
            "user",

          text:
            `📄 Uploaded: ${file.name}`,

        };


        const analysisMessage = {

          role:
            "assistant",

          text:
            data.analysis ||
            "Document analyzed successfully.",

          sources:
            data.sources ||
            [],

        };


        const updatedMessages = [

          ...messages,

          documentMessage,

          analysisMessage,

        ];


        setMessages(
          updatedMessages
        );


        await saveCurrentChat(
          updatedMessages
        );


        setShowAnalyzeMenu(
          false
        );


      } catch (error) {

        console.error(
          "Document analysis error:",
          error
        );


        alert(
          "Document analysis failed."
        );

      }

    };


  /* ====================================================
     VIDEO UPLOAD
  ==================================================== */

  const handleVideoUpload =
    async (file) => {

      if (!file)
        return;


      const formData =
        new FormData();


      formData.append(
        "video",
        file
      );


      try {

        const response =
          await fetch(
            `${API_BASE}/upload-video`,
            {

              method:
                "POST",

              body:
                formData,

            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          throw new Error(
            data.error ||
            "Video processing failed."
          );

        }


        const updatedMessages = [

          ...messages,

          {

            role:
              "user",

            text:
              `🎥 Uploaded: ${file.name}`,

          },

          {

            role:
              "assistant",

            text:
              data.summary ||
              "Video processed successfully.",

            image:
              data.frameUrl ||
              null,

            document:
              data.document ||
              null,

          },

        ];


        setMessages(
          updatedMessages
        );


        await saveCurrentChat(
          updatedMessages
        );


        setShowAnalyzeMenu(
          false
        );


      } catch (error) {

        console.error(
          "Video upload error:",
          error
        );


        alert(
          "Video processing failed."
        );

      }

    };


  /* ====================================================
     AUDIO UPLOAD
  ==================================================== */

  const handleAudioUpload =
    async (file) => {

      if (!file)
        return;


      const formData =
        new FormData();


      formData.append(
        "audio",
        file
      );


      try {

        const response =
          await fetch(
            `${API_BASE}/upload-audio`,
            {

              method:
                "POST",

              body:
                formData,

            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          throw new Error(
            data.error ||
            "Audio processing failed."
          );

        }


        const updatedMessages = [

          ...messages,

          {

            role:
              "user",

            text:
              `🎙️ Uploaded: ${file.name}`,

          },

          {

            role:
              "assistant",

            text:
              data.summary ||
              data.analysis ||
              "Audio processed successfully.",

            document:
              data.document ||
              null,

          },

        ];


        setMessages(
          updatedMessages
        );


        await saveCurrentChat(
          updatedMessages
        );


        setShowAnalyzeMenu(
          false
        );


      } catch (error) {

        console.error(
          "Audio upload error:",
          error
        );


        alert(
          "Audio processing failed."
        );

      }

    };


  /* ====================================================
     YOUTUBE
  ==================================================== */

  const handleYouTube =
    async (url) => {

      if (!url?.trim())
        return;


      try {

        const response =
          await fetch(
            `${API_BASE}/analyze-youtube`,
            {

              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  url:
                    url.trim(),
                }),

            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          throw new Error(
            data.error ||
            "YouTube analysis failed."
          );

        }


        const updatedMessages = [

          ...messages,

          {

            role:
              "user",

            text:
              `▶️ YouTube: ${url}`,

          },

          {

            role:
              "assistant",

            text:
              data.analysis ||
              "YouTube analysis completed.",

            sources:
              data.sources ||
              [],

          },

        ];


        setMessages(
          updatedMessages
        );


        await saveCurrentChat(
          updatedMessages
        );


        setShowYouTubeSearch(
          false
        );

        setYoutubeQuery(
          ""
        );


      } catch (error) {

        console.error(
          "YouTube error:",
          error
        );


        alert(
          "YouTube analysis failed."
        );

      }

    };


  /* ====================================================
     WEBSITE
  ==================================================== */

  const handleWebsite =
    async (url) => {

      if (!url?.trim())
        return;


      try {

        const response =
          await fetch(
            `${API_BASE}/analyze-website`,
            {

              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  url:
                    url.trim(),
                }),

            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          throw new Error(
            data.error ||
            "Website analysis failed."
          );

        }


        const updatedMessages = [

          ...messages,

          {

            role:
              "user",

            text:
              `🌐 Website: ${url}`,

          },

          {

            role:
              "assistant",

            text:
              data.analysis ||
              "Website analysis completed.",

            sources:
              data.sources ||
              [],

          },

        ];


        setMessages(
          updatedMessages
        );


        await saveCurrentChat(
          updatedMessages
        );


        setShowWebsiteSearch(
          false
        );

        setWebsiteUrl(
          ""
        );


      } catch (error) {

        console.error(
          "Website error:",
          error
        );


        alert(
          "Website analysis failed."
        );

      }

    };


  /* ====================================================
     IMAGE UPLOAD
  ==================================================== */

  const handleImageUpload =
    async (file) => {

      if (!file)
        return;


      try {

        const formData =
          new FormData();


        formData.append(
          "image",
          file
        );


        const response =
          await fetch(
            `${API_BASE}/upload-image`,
            {

              method:
                "POST",

              body:
                formData,

            }
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.imageUrl
        ) {

          throw new Error(
            data.error ||
            "Image upload failed."
          );

        }


        setImage(
          data.imageUrl
        );


        setShowAnalyzeMenu(
          false
        );


        await handleSend(

          "Analyze this image in detail. Describe what you see, identify important objects, read visible text, and give me a clear summary.",

          data.imageUrl

        );


      } catch (error) {

        console.error(
          "Image upload error:",
          error
        );


        alert(
          "Image upload failed."
        );

      }

    };


  /* ====================================================
     DROPZONE
  ==================================================== */

  const {
    getRootProps,
    getInputProps,
  } =
    useDropzone({

      multiple:
        false,

      onDrop:
        async (
          acceptedFiles
        ) => {

          const file =
            acceptedFiles?.[0];


          if (!file)
            return;


          const name =
            file.name
              .toLowerCase();


          if (
            file.type ===
              "application/pdf" ||

            name.endsWith(
              ".pdf"
            ) ||

            name.endsWith(
              ".doc"
            ) ||

            name.endsWith(
              ".docx"
            ) ||

            name.endsWith(
              ".xls"
            ) ||

            name.endsWith(
              ".xlsx"
            )

          ) {

            await handlePdfUpload(
              file
            );

            return;

          }


          if (
            file.type.startsWith(
              "image/"
            )
          ) {

            await handleImageUpload(
              file
            );

            return;

          }


          if (
            file.type.startsWith(
              "video/"
            )
          ) {

            await handleVideoUpload(
              file
            );

            return;

          }


          if (
            file.type.startsWith(
              "audio/"
            )
          ) {

            await handleAudioUpload(
              file
            );

            return;

          }


          alert(
            "This file type is not supported yet."
          );

        },

    });


  /* ====================================================
     MAIN SEND
  ==================================================== */

  const handleSend =
    async (
      voiceText = null,
      imageUrlOverride = null
    ) => {

      const finalPrompt =
        typeof voiceText ===
        "string"

          ? voiceText.trim()

          : input.trim();


      const imageUrl =
        imageUrlOverride ||
        image ||
        [...messages]
          .reverse()
          .find(
            (message) =>
              message.image
          )
          ?.image ||
        null;


      if (

        !finalPrompt &&

        !pdfText &&

        !imageUrl

      ) {

        return;

      }


      setStopGeneration(
        false
      );

      setLoading(
        true
      );


      const userMessage = {

        role:
          "user",

        text:
          finalPrompt ||
          "Please analyze the uploaded content.",

        image:
          imageUrl ||
          null,

      };


      const updatedMessages = [

        ...messages,

        userMessage,

      ];


      setMessages(
        updatedMessages
      );


      setInput("");


      try {

        /*
        --------------------------------------------------
        AUTOMATIC CAPABILITY DETECTION
        --------------------------------------------------

        The buttons remain available.

        Even when they are OFF, Truvora can determine
        that a question requires current web information
        or an agent-style workflow.

        Backend receives both explicit and automatic
        signals.
        --------------------------------------------------
        */

        const automaticWeb =
          shouldAutomaticallyUseWeb(
            finalPrompt
          );


        const automaticAgent =
          shouldAutomaticallyUseAgent(
            finalPrompt
          );


        const web =
          webEnabled ||
          automaticWeb;


        const agent =
          agentMode ||
          automaticAgent;


        const response =
          await fetch(
            `${API_BASE}/ask`,
            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json",

              },

              body:
                JSON.stringify({

                  message:
                    finalPrompt,

                  history:
                    updatedMessages.slice(
                      -10
                    ),

                  language:
                    getLanguageCode(),

                  web,

                  agentMode:
                    agent,

                  automaticWeb,

                  automaticAgent,

                  imageUrl,

                  imageUrls:
                    updatedMessages

                      .filter(
                        (
                          message
                        ) =>
                          message.image
                      )

                      .map(
                        (
                          message
                        ) =>
                          message.image
                      )

                      .filter(
                        Boolean
                      ),

                }),

            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            `Request failed: ${response.status}`
          );

        }


        const data =
          await response.json();


        const reply =
          data.reply ||
          data.answer ||
          data.analysis ||
          "I couldn't generate a response.";


        /*
        --------------------------------------------------
        CLEAN TYPE EFFECT
        --------------------------------------------------
        */

        let visibleText =
          "";


        for (
          const character
          of reply
        ) {

          if (
            stopGeneration
          ) {

            break;

          }


          visibleText +=
            character;


          setTypingText(
            visibleText
          );


          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                7
              )
          );

        }


        const assistantMessage = {

          role:
            "assistant",

          text:
            visibleText,

          image:
            data.image ||
            null,

          document:
            data.document ||
            null,

          sources:
            Array.isArray(
              data.sources
            )

              ? data.sources

              : [],

        };


        const finalMessages = [

          ...updatedMessages,

          assistantMessage,

        ];


        setMessages(
          finalMessages
        );


        setTypingText("");


        await saveCurrentChat(
          finalMessages
        );


      } catch (error) {

        console.error(
          "Truvora request error:",
          error
        );


        const errorMessage = {

          role:
            "assistant",

          text:
            "Sorry, I couldn't process that request right now. Please try again.",

        };


        setMessages(
          (previous) => [

            ...previous,

            errorMessage,

          ]
        );


      } finally {

        setLoading(
          false
        );

        setTypingText("");

      }

    };


  /* ====================================================
     DOCUMENT GENERATION
  ==================================================== */

  const handleGenerateDocument =
    async (
      type,
      text
    ) => {

      const lastAssistant =
        [...messages]
          .reverse()
          .find(
            (message) =>
              message.role ===
              "assistant"
          );


      const content =
        (
          text ||
          lastAssistant?.text ||
          ""
        ).trim();


      if (!content) {

        alert(
          "There is no content to generate."
        );

        return;

      }


      try {

        const response =
          await fetch(
            `${API_BASE}/generate-document`,
            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json",

              },

              body:
                JSON.stringify({

                  type,

                  summary:
                    content,

                  analysis:
                    content,

                  sources:
                    lastAssistant?.sources ||
                    [],

                  recommendations:
                    "",

                }),

            }
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.document
        ) {

          throw new Error(
            data.error ||
            "Document generation failed."
          );

        }


        const url =
          getFileUrl(
            data.document
          );


        const link =
          document.createElement(
            "a"
          );


        link.href =
          url;


        link.target =
          "_blank";


        link.rel =
          "noopener noreferrer";


        link.download =
          data.document
            .split("/")
            .pop();


        document.body.appendChild(
          link
        );


        link.click();


        link.remove();


      } catch (error) {

        console.error(
          "Document generation error:",
          error
        );


        alert(
          "Document generation failed."
        );

      }

    };


  /* ====================================================
     LOGIN SCREEN
  ==================================================== */

  if (!loggedIn) {

    return (

      <div
        className="truvora-login-screen"
      >

        <div
          className="truvora-login-card"
        >

          <div
            className="truvora-brand-mark"
          >

            <div
              className="truvora-brand-symbol"
            />

            <div>

              <h1>
                {TRUVORA_BRAND.name}
              </h1>

              <p>
                {TRUVORA_BRAND.product}
              </p>

            </div>

          </div>


          <div
            className="truvora-login-divider"
          />


          <h2>
            Welcome to Truvora
          </h2>


          <p>
            {TRUVORA_BRAND.slogan}
          </p>


          <button
            className="truvora-google-login"
            onClick={
              handleGoogleLogin
            }
          >

            Continue with Google

          </button>

        </div>

      </div>

    );

  }


  /* ====================================================
     APP UI
  ==================================================== */

  return (

    <div
      className="app"
    >

      {/* ================================================
          MOBILE BACKDROP
      ================================================= */}

      {sidebarOpen && (

        <div

          className="mobile-sidebar-backdrop"

          onClick={() =>
            setSidebarOpen(
              false
            )
          }

        />

      )}


      {/* ================================================
          SIDEBAR
      ================================================= */}

      <aside

        className={`sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : "sidebar-closed"
        }`}

      >

        <div
          className="sidebar-brand"
        >

          <div
            className="sidebar-brand-symbol"
          />

          <div>

            <strong>
              TRUVORA
            </strong>

            <span>
              GLOBAL AI
            </span>

          </div>


          <button

            className="mobile-sidebar-close"

            onClick={() =>
              setSidebarOpen(
                false
              )
            }

          >

            <FiX />

          </button>

        </div>


        {/* NEW CHAT */}

        <button

          className="new-chat"

          onClick={
            handleNewChat
          }

        >

          <FiPlus />

          <span>
            New Chat
          </span>

        </button>


        {/* SEARCH */}

        <div
          className="sidebar-search"
        >

          <FiSearch />

          <input

            type="text"

            placeholder="Search chats..."

            value={
              searchTerm
            }

            onChange={
              (event) =>
                setSearchTerm(
                  event.target.value
                )
            }

          />

        </div>


        <div
          className="sidebar-section-title"
        >
          RECENT CHATS
        </div>


        <div
          className="chat-list"
        >

          {chats

            .filter(
              (chat) => {

                if (
                  !searchTerm.trim()
                )
                  return true;


                return (
                  chat.messages
                    ?.some(
                      (message) =>
                        message.text
                          ?.toLowerCase()
                          .includes(
                            searchTerm
                              .toLowerCase()
                          )
                    )
                );

              }
            )

            .map(
              (
                chat,
                index
              ) => (

                <button

                  key={
                    chat.id ||
                    index
                  }

                  className="chat-item"

                  onClick={() => {

                    const restored =
                      Array.isArray(
                        chat.messages
                      )

                        ? chat.messages

                        : [];


                    setMessages(
                      restored
                    );


                    setCurrentChatId(
                      chat.id ||
                      null
                    );


                    const restoredImage =
                      [
                        ...restored,
                      ]

                        .reverse()

                        .find(
                          (
                            message
                          ) =>
                            message.image
                        )
                        ?.image ||
                      null;


                    setImage(
                      restoredImage
                    );


                    setSidebarOpen(
                      false
                    );

                  }}

                >

                  <span>

                    {
                      chat
                        .messages
                        ?.find(
                          (
                            message
                          ) =>
                            message.role ===
                            "user"
                        )
                        ?.text
                        ?.slice(
                          0,
                          42
                        ) ||
                      "New conversation"
                    }

                  </span>

                </button>

              )
            )

          }

        </div>


        {/* SIDEBAR FOOTER */}

        <div
          className="sidebar-footer"
        >

          <div>
            {TRUVORA_BRAND.slogan}
          </div>


          <button
            onClick={
              handleLogout
            }
          >
            Logout
          </button>

        </div>

      </aside>


      {/* ================================================
          MAIN
      ================================================= */}

      <main
        className="main"
      >

        {/* TOPBAR */}

        <header
          className="topbar"
        >

          <button

            className="menu-btn"

            onClick={() =>
              setSidebarOpen(
                true
              )
            }

          >

            <FiMenu />

          </button>


          <div
            className="topbar-brand"
          >

            <strong>
              TRUVORA
            </strong>

            <span>
              GLOBAL AI
            </span>

          </div>


          <div
            className="topbar-user"
          >

            <FiUser />

          </div>

        </header>


        {/* ==============================================
            CAMERA
        =============================================== */}

        {showCamera && (

          <div
            className="camera-panel"
          >

            <video

              ref={
                videoRef
              }

              autoPlay

              playsInline

            />


            <canvas

              ref={
                canvasRef
              }

              style={{
                display:
                  "none",
              }}

            />


            <div
              className="camera-actions"
            >

              <button
                onClick={
                  capturePhoto
                }
              >

                <FiCamera />

                Capture

              </button>


              <button
                onClick={() =>
                  setShowCamera(
                    false
                  )
                }
              >

                <FiX />

                Close

              </button>

            </div>

          </div>

        )}


        {/* ==============================================
            MESSAGES
        =============================================== */}

        <section
          className="messages"
        >

          {messages.map(
            (
              message,
              index
            ) => (

              <article

                key={
                  message.id ||
                  index
                }

                className={`message ${
                  message.role ===
                  "user"
                    ? "user-message"
                    : "assistant-message"
                }`}

              >

                <div
                  className="message-avatar"
                >

                  {
                    message.role ===
                    "user"

                      ? <FiUser />

                      : "T"
                  }

                </div>


                <div
                  className="message-content"
                >

                  {message.image && (

                    <img

                      src={
                        getFileUrl(
                          message.image
                        )
                      }

                      alt="Uploaded"

                      className="chat-image"

                    />

                  )}


                  <div
                    className="message-text"
                  >

                    <ReactMarkdown
                      remarkPlugins={[
                        remarkGfm
                      ]}
                    >

                      {
                        message.text ||
                        ""
                      }

                    </ReactMarkdown>

                  </div>


                  {/* SOURCES */}

                  {Array.isArray(
                    message.sources
                  ) &&
                  message.sources.length >
                    0 && (

                    <div
                      className="truvora-sources"
                    >

                      <div
                        className="sources-header"
                      >

                        <span>
                          🔗 Sources
                        </span>

                        <small>
                          {
                            message.sources.length
                          }
                        </small>

                      </div>


                      <div
                        className="source-list"
                      >

                        {message.sources.map(
                          (
                            source,
                            sourceIndex
                          ) => {

                            const url =
                              source.url ||
                              source.videoUrl ||
                              source.youtubeUrl;


                            if (!url)
                              return null;


                            const title =
                              source.title ||
                              source.name ||
                              getDomain(
                                url
                              ) ||
                              "Web Source";


                            return (

                              <a

                                key={
                                  sourceIndex
                                }

                                href={
                                  url
                                }

                                target="_blank"

                                rel="noopener noreferrer"

                                className="source-card"

                              >

                                <span
                                  className="source-number"
                                >

                                  {
                                    sourceIndex +
                                    1
                                  }

                                </span>


                                <span
                                  className="source-info"
                                >

                                  <strong>
                                    {title}
                                  </strong>

                                  <small>
                                    {
                                      getDomain(
                                        url
                                      )
                                    }
                                  </small>

                                </span>


                                <FiExternalLink />

                              </a>

                            );

                          }
                        )}

                      </div>

                    </div>

                  )}


                  {/* GENERATED IMAGE */}

                  {message.document && (

                    <a

                      href={
                        getFileUrl(
                          message.document
                        )
                      }

                      target="_blank"

                      rel="noopener noreferrer"

                      className="generated-file-link"

                    >

                      <FiDownload />

                      Download generated file

                    </a>

                  )}


                  {/* ACTIONS */}

                  {message.role ===
                    "assistant" && (

                    <div
                      className="message-actions"
                    >

                      <CopyToClipboard
                        text={
                          message.text ||
                          ""
                        }
                      >

                        <button
                          title="Copy"
                        >

                          <FiCopy />

                        </button>

                      </CopyToClipboard>


                      <button

                        title="Read aloud"

                        onClick={() =>
                          speakText(
                            message.text
                          )
                        }

                      >

                        <FiVolume2 />

                      </button>


                      <button

                        title="Share"

                        onClick={
                          async () => {

                            try {

                              if (
                                navigator.share
                              ) {

                                await navigator.share({
                                  title:
                                    "Truvora AI",

                                  text:
                                    message.text ||
                                    "",
                                });

                              } else {

                                await navigator.clipboard.writeText(
                                  message.text ||
                                  ""
                                );

                              }

                            } catch (
                              error
                            ) {

                              console.error(
                                "Share error:",
                                error
                              );

                            }

                          }
                        }

                      >

                        <FiShare2 />

                      </button>


                      <button

                        title="Save"

                        onClick={() =>
                          saveLocalChat({
                            messages,
                            updatedAt:
                              new Date().toISOString(),
                          })
                        }

                      >

                        <FiSave />

                      </button>

                    </div>

                  )}


                  {/* DOCUMENT GENERATION */}

                  {message.role ===
                    "assistant" && (

                    <div
                      className="document-actions"
                    >

                      <button
                        onClick={() =>
                          handleGenerateDocument(
                            "pdf",
                            message.text
                          )
                        }
                      >
                        PDF
                      </button>

                      <button
                        onClick={() =>
                          handleGenerateDocument(
                            "docx",
                            message.text
                          )
                        }
                      >
                        DOCX
                      </button>

                      <button
                        onClick={() =>
                          handleGenerateDocument(
                            "xlsx",
                            message.text
                          )
                        }
                      >
                        XLSX
                      </button>

                      <button
                        onClick={() =>
                          handleGenerateDocument(
                            "pptx",
                            message.text
                          )
                        }
                      >
                        PPTX
                      </button>

                      <button
                        onClick={() =>
                          handleGenerateDocument(
                            "html",
                            message.text
                          )
                        }
                      >
                        HTML
                      </button>

                      <button
                        onClick={() =>
                          handleGenerateDocument(
                            "md",
                            message.text
                          )
                        }
                      >
                        MD
                      </button>

                      <button
                        onClick={() =>
                          handleGenerateDocument(
                            "txt",
                            message.text
                          )
                        }
                      >
                        TXT
                      </button>

                      <button
                        onClick={() =>
                          handleGenerateDocument(
                            "json",
                            message.text
                          )
                        }
                      >
                        JSON
                      </button>

                      <button
                        onClick={() =>
                          handleGenerateDocument(
                            "xml",
                            message.text
                          )
                        }
                      >
                        XML
                      </button>

                      <button
                        onClick={() =>
                          handleGenerateDocument(
                            "rtf",
                            message.text
                          )
                        }
                      >
                        RTF
                      </button>

                      <button
                        onClick={() =>
                          handleGenerateDocument(
                            "odt",
                            message.text
                          )
                        }
                      >
                        ODT
                      </button>

                      <button
                        onClick={() =>
                          handleGenerateDocument(
                            "ods",
                            message.text
                          )
                        }
                      >
                        ODS
                      </button>

                      <button
                        onClick={() =>
                          handleGenerateDocument(
                            "odp",
                            message.text
                          )
                        }
                      >
                        ODP
                      </button>

                    </div>

                  )}

                </div>

              </article>

            )
          )}


          {typingText && (

            <article
              className="message assistant-message"
            >

              <div
                className="message-avatar"
              >
                T
              </div>


              <div
                className="message-content"
              >

                <div
                  className="message-text"
                >

                  {typingText}

                </div>

              </div>

            </article>

          )}


          <div
            ref={
              messagesEndRef
            }
          />

        </section>


        {/* ==============================================
            INPUT AREA
        =============================================== */}

        <footer
          className="input-area"
        >

          <div
            className="composer"
          >

            {/* TOP CONTROL ROW */}

            <div
              className="composer-controls"
            >

              <div
                className="composer-left"
              >

                {/* ANALYZE */}

                <div
                  {...getRootProps()}
                >

                  <input
                    {...getInputProps()}
                  />


                  <button

                    type="button"

                    className="composer-button"

                    onClick={(event) => {

                      event.stopPropagation();

                      setShowAnalyzeMenu(
                        true
                      );

                    }}

                    title="Analyze"

                  >

                    🔍

                  </button>

                </div>


                {/* MICROPHONE */}

                <button

                  className="composer-button"

                  onClick={() => {

                    SpeechRecognition.startListening({

                      continuous:
                        false,

                      interimResults:
                        true,

                      language:
                        getLanguageCode() ===
                        "en"
                          ? "en-IN"
                          : getLanguageCode(),

                    });

                  }}

                  title="Voice input"

                >

                  <FiMic />

                </button>


                {/* WEB */}

                <button

                  className={`composer-button ${
                    webEnabled
                      ? "active"
                      : ""
                  }`}

                  onClick={() =>
                    setWebEnabled(
                      (value) =>
                        !value
                    )
                  }

                  title="Live Web"

                >

                  <FiGlobe />

                  <span>
                    Web
                  </span>

                </button>


                {/* AGENT */}

                <button

                  className={`composer-button ${
                    agentMode
                      ? "active"
                      : ""
                  }`}

                  onClick={() =>
                    setAgentMode(
                      (value) =>
                        !value
                    )
                  }

                  title="Agent"

                >

                  <FiCpu />

                  <span>
                    Agent
                  </span>

                </button>

              </div>


              {/* LANGUAGE */}

              <Select

                className="language-select"

                classNamePrefix="language"

                options={
                  flattenedLanguages
                }

                value={
                  selectedLanguageOption
                }

                onChange={
                  (option) => {

                    if (
                      option
                    ) {

                      setSelectedLanguage(
                        option.label
                      );

                    }

                  }
                }

                placeholder="🌍 Language"

                isSearchable

                menuPlacement="top"

              />


              {/* VOICE */}

              <Select

                className="voice-select"

                classNamePrefix="voice"

                options={
                  VOICE_OPTIONS
                }

                value={

                  VOICE_OPTIONS.find(
                    (voice) =>
                      voice.id ===
                      selectedVoice
                  ) || null

                }

                getOptionLabel={
                  (voice) =>
                    voice.name
                }

                getOptionValue={
                  (voice) =>
                    voice.id
                }

                onChange={
                  (option) => {

                    if (
                      !option
                    )
                      return;


                    if (
                      option.id ===
                      "personal"
                    ) {

                      setShowPersonalVoice(
                        true
                      );

                      return;

                    }


                    setSelectedVoice(
                      option.id
                    );

                  }
                }

                placeholder="🎙 Voice"

                isSearchable={
                  false
                }

                menuPlacement="top"

              />

            </div>


            {/* INPUT ROW */}

            <div
              className="composer-input-row"
            >

              <input

                className="main-input"

                value={
                  input
                }

                onChange={
                  (event) =>
                    setInput(
                      event.target.value
                    )
                }

                onKeyDown={
                  (event) => {

                    if (
                      event.key ===
                      "Enter"
                    ) {

                      event.preventDefault();

                      handleSend();

                    }

                  }
                }

                placeholder="Ask Truvora anything..."

              />


              {loading ? (

                <button

                  className="send-button stop"

                  onClick={() =>
                    setStopGeneration(
                      true
                    )
                  }

                  title="Stop"

                >

                  <FiSquare />

                </button>

              ) : (

                <button

                  className="send-button"

                  onClick={
                    handleSend
                  }

                  title="Send"

                >

                  <FiSend />

                </button>

              )}

            </div>

          </div>

        </footer>

      </main>


      {/* ================================================
          ANALYZE MENU
      ================================================= */}

      {showAnalyzeMenu && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowAnalyzeMenu(
              false
            )
          }
        >

          <div
            className="analyze-menu"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div
              className="modal-header"
            >

              <div>

                <span>
                  TRUVORA
                </span>

                <h2>
                  Analyze Anything
                </h2>

              </div>


              <button
                onClick={() =>
                  setShowAnalyzeMenu(
                    false
                  )
                }
              >

                <FiX />

              </button>

            </div>


            <div
              className="analyze-grid"
            >

              <button
                onClick={() =>
                  documentUploadRef.current?.click()
                }
              >

                <FiFileText />

                <span>
                  Document
                </span>

              </button>


              <button
                onClick={() =>
                  imageUploadRef.current?.click()
                }
              >

                <FiUpload />

                <span>
                  Image
                </span>

              </button>


              <button
                onClick={() => {

                  setShowAnalyzeMenu(
                    false
                  );

                  setShowCamera(
                    true
                  );

                }}
              >

                <FiCamera />

                <span>
                  Camera
                </span>

              </button>


              <button
                onClick={() =>
                  document
                    .getElementById(
                      "videoUpload"
                    )
                    ?.click()
                }
              >

                <FiVideo />

                <span>
                  Video
                </span>

              </button>


              <button
                onClick={() =>
                  document
                    .getElementById(
                      "audioUpload"
                    )
                    ?.click()
                }
              >

                <FiMusic />

                <span>
                  Audio
                </span>

              </button>


              <button
                onClick={() => {

                  setShowAnalyzeMenu(
                    false
                  );

                  setShowYouTubeSearch(
                    true
                  );

                }}
              >

                ▶️

                <span>
                  YouTube
                </span>

              </button>


              <button
                onClick={() => {

                  setShowAnalyzeMenu(
                    false
                  );

                  setShowWebsiteSearch(
                    true
                  );

                }}
              >

                🌐

                <span>
                  Website
                </span>

              </button>

            </div>


            {/* HIDDEN FILE INPUTS */}

            <input

              ref={
                documentUploadRef
              }

              type="file"

              accept=".pdf,.doc,.docx,.xls,.xlsx"

              style={{
                display:
                  "none",
              }}

              onChange={
                async (event) => {

                  const file =
                    event.target.files?.[0];


                  if (
                    file
                  ) {

                    await handlePdfUpload(
                      file
                    );

                  }


                  event.target.value =
                    "";

                }
              }

            />


            <input

              ref={
                imageUploadRef
              }

              type="file"

              accept="image/*"

              style={{
                display:
                  "none",
              }}

              onChange={
                async (event) => {

                  const file =
                    event.target.files?.[0];


                  if (
                    file
                  ) {

                    await handleImageUpload(
                      file
                    );

                  }


                  event.target.value =
                    "";

                }
              }

            />


            <input

              id="videoUpload"

              type="file"

              accept="video/*"

              style={{
                display:
                  "none",
              }}

              onChange={
                async (event) => {

                  const file =
                    event.target.files?.[0];


                  if (
                    file
                  ) {

                    await handleVideoUpload(
                      file
                    );

                  }


                  event.target.value =
                    "";

                }
              }

            />


            <input

              id="audioUpload"

              type="file"

              accept="audio/*"

              style={{
                display:
                  "none",
              }}

              onChange={
                async (event) => {

                  const file =
                    event.target.files?.[0];


                  if (
                    file
                  ) {

                    await handleAudioUpload(
                      file
                    );

                  }


                  event.target.value =
                    "";

                }
              }

            />

          </div>

        </div>

      )}


      {/* ================================================
          YOUTUBE MODAL
      ================================================= */}

      {showYouTubeSearch && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowYouTubeSearch(
              false
            )
          }
        >

          <div
            className="analyze-menu"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div
              className="modal-header"
            >

              <div>

                <span>
                  TRUVORA
                </span>

                <h2>
                  YouTube Analysis
                </h2>

              </div>


              <button
                onClick={() =>
                  setShowYouTubeSearch(
                    false
                  )
                }
              >

                <FiX />

              </button>

            </div>


            <input

              className="modal-input"

              value={
                youtubeQuery
              }

              onChange={
                (event) =>
                  setYoutubeQuery(
                    event.target.value
                  )
              }

              placeholder="Paste YouTube URL or search..."

            />


            <button

              className="modal-primary-button"

              onClick={
                async () => {

                  const value =
                    youtubeQuery.trim();


                  if (!value)
                    return;


                  if (

                    value.includes(
                      "youtube.com/watch"
                    ) ||

                    value.includes(
                      "youtu.be/"
                    ) ||

                    value.includes(
                      "youtube.com/shorts"
                    )

                  ) {

                    await handleYouTube(
                      value
                    );

                  } else {

                    window.open(

                      `https://www.youtube.com/results?search_query=${encodeURIComponent(
                        value
                      )}`,

                      "_blank"

                    );

                  }

                }
              }

            >

              ▶ Search YouTube

            </button>

          </div>

        </div>

      )}


      {/* ================================================
          WEBSITE MODAL
      ================================================= */}

      {showWebsiteSearch && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowWebsiteSearch(
              false
            )
          }
        >

          <div
            className="analyze-menu"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div
              className="modal-header"
            >

              <div>

                <span>
                  TRUVORA
                </span>

                <h2>
                  Website Analysis
                </h2>

              </div>


              <button
                onClick={() =>
                  setShowWebsiteSearch(
                    false
                  )
                }
              >

                <FiX />

              </button>

            </div>


            <input

              className="modal-input"

              value={
                websiteUrl
              }

              onChange={
                (event) =>
                  setWebsiteUrl(
                    event.target.value
                  )
              }

              placeholder="https://example.com"

            />


            <button

              className="modal-primary-button"

              onClick={() =>
                handleWebsite(
                  websiteUrl
                )
              }

            >

              🌐 Analyze Website

            </button>

          </div>

        </div>

      )}


      {/* ================================================
          PERSONAL VOICE MODAL
      ================================================= */}

      {showPersonalVoice && (

        <PersonalVoiceModal

          onClose={() =>
            setShowPersonalVoice(
              false
            )
          }

          onCreated={(
            voiceUrl
          ) => {

            setPersonalVoice(
              voiceUrl
            );

            setSelectedVoice(
              "personal"
            );

            setShowPersonalVoice(
              false
            );

          }}

        />

      )}

    </div>

  );

}


/* ======================================================
   PERSONAL VOICE MODAL
====================================================== */

function PersonalVoiceModal({
  onClose,
  onCreated,
}) {

  const [recording,
    setRecording] =
    useState(false);

  const [processing,
    setProcessing] =
    useState(false);

  const recorderRef =
    useRef(null);

  const streamRef =
    useRef(null);

  const chunksRef =
    useRef([]);


  const startRecording =
    async () => {

      try {

        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio:
              true,
          });


        streamRef.current =
          stream;


        chunksRef.current =
          [];


        const recorder =
          new MediaRecorder(
            stream
          );


        recorderRef.current =
          recorder;


        recorder.ondataavailable =
          (event) => {

            if (
              event.data.size
            ) {

              chunksRef.current.push(
                event.data
              );

            }

          };


        recorder.onstop =
          async () => {

            const blob =
              new Blob(
                chunksRef.current,
                {
                  type:
                    "audio/webm",
                }
              );


            const formData =
              new FormData();


            formData.append(
              "voice",
              blob,
              "personal-voice.webm"
            );


            try {

              setProcessing(
                true
              );


              const response =
                await fetch(
                  `${API_BASE}/upload-personal-voice`,
                  {

                    method:
                      "POST",

                    body:
                      formData,

                  }
                );


              const data =
                await response.json();


              if (
                !response.ok ||
                !data.audioUrl
              ) {

                throw new Error(
                  data.error ||
                  "Personal voice creation failed."
                );

              }


              onCreated(
                data.audioUrl
              );


            } catch (error) {

              console.error(
                "Personal voice error:",
                error
              );


              alert(
                "Personal voice creation failed."
              );

            } finally {

              setProcessing(
                false
              );

            }

          };


        recorder.start();

        setRecording(
          true
        );


      } catch (error) {

        console.error(
          "Microphone error:",
          error
        );


        alert(
          "Microphone permission is required."
        );

      }

    };


  const stopRecording =
    () => {

      if (
        recorderRef.current
      ) {

        recorderRef.current.stop();

      }


      streamRef.current
        ?.getTracks()
        .forEach(
          (track) =>
            track.stop()
        );


      setRecording(
        false
      );

    };


  return (

    <div
      className="modal-overlay"
    >

      <div
        className="personal-voice-modal"
      >

        <div
          className="modal-header"
        >

          <div>

            <span>
              TRUVORA
            </span>

            <h2>
              Personal Voice
            </h2>

          </div>


          <button
            onClick={
              onClose
            }
          >

            <FiX />

          </button>

        </div>


        <p>

          Create a personal voice for Truvora.

        </p>


        {processing ? (

          <div
            className="voice-processing"
          >

            Creating your voice...

          </div>

        ) : recording ? (

          <button

            className="voice-recording-button"

            onClick={
              stopRecording
            }

          >

            <FiSquare />

            Stop Recording

          </button>

        ) : (

          <button

            className="modal-primary-button"

            onClick={
              startRecording
            }

          >

            <FiMic />

            Record Personal Voice

          </button>

        )}


        <button

          className="modal-secondary-button"

          onClick={
            onClose
          }

        >

          Cancel

        </button>

      </div>

    </div>

  );

}


export default App;
/* ======================================================
   END OF PART 2
====================================================== */
