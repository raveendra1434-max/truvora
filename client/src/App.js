/*
 * TRUVORA GLOBAL AI — CLEAN APP.JS
 * Preserves the existing Truvora frontend/backend contract.
 * Web search and agent capability are enabled automatically;
 * the backend decides when they are actually needed.
 */

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
  FiPlus,
  FiMenu,
  FiCopy,
  FiUser,
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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";


function saveChat(chat) {
  localStorage.setItem(
    `truvora-chat-${Date.now()}`,
    JSON.stringify(chat)
  );
}


function App() {

  /* =====================================================
     CITATIONS
  ===================================================== */

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


  /* =====================================================
     YOUTUBE URL HANDLING
  ===================================================== */

  useEffect(() => {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const youtubeUrl =
      params.get("youtube");

    if (youtubeUrl) {

      const url =
        decodeURIComponent(youtubeUrl);

      handleYouTube(url);

      window.history.replaceState(
        {},
        "",
        "/"
      );
    }

  }, []);


  /* =====================================================
     BASIC STATE
  ===================================================== */

  const [input, setInput] =
    useState("");

  const [selectedVoice,
    setSelectedVoice] =
    useState("alloy");

  const [personalVoice,
    setPersonalVoice] =
    useState(null);

  const [showPersonalVoice,
    setShowPersonalVoice] =
    useState(false);


  /* =====================================================
     VOICE OPTIONS
  ===================================================== */

  const voiceOptions = [

    {
      id: "alloy",
      name: "Alloy"
    },

    {
      id: "ash",
      name: "Ash"
    },

    {
      id: "ballad",
      name: "Ballad"
    },

    {
      id: "coral",
      name: "Coral"
    },

    {
      id: "echo",
      name: "Echo"
    },

    {
      id: "fable",
      name: "Fable"
    },

    {
      id: "nova",
      name: "Nova"
    },

    {
      id: "onyx",
      name: "Onyx"
    },

    {
      id: "sage",
      name: "Sage"
    },

    {
      id: "shimmer",
      name: "Shimmer"
    },

    {
      id: "verse",
      name: "Verse"
    },

    {
      id: "marin",
      name: "Marin"
    },

    {
      id: "cedar",
      name: "Cedar"
    },

    {
      id: "personal",
      name: "🎤 Add Personal Voice"
    },

  ];


  /* =====================================================
     LOGIN
  ===================================================== */

  const [username,
    setUsername] =
    useState("");

  const [password,
    setPassword] =
    useState("");

  const [loginError,
    setLoginError] =
    useState("");

  const [loggedIn,
    setLoggedIn] =
    useState(false);


  /* =====================================================
     CHAT
  ===================================================== */

  const [messages,
    setMessages] =
    useState([]);

  const [loading,
    setLoading] =
    useState(false);

  const [streaming,
    setStreaming] =
    useState(false);

  const [stopRequested,
    setStopRequested] =
    useState(false);


  /* =====================================================
     WEB + AGENT
  ===================================================== */

  const [webEnabled,
    setWebEnabled] =
    useState(false);

  const [agentMode,
    setAgentMode] =
    useState(false);


  /* =====================================================
     LANGUAGE
  ===================================================== */

  const [selectedLanguage,
    setSelectedLanguage] =
    useState("en");


  /* =====================================================
     ANALYZE
  ===================================================== */

  const [showAnalyzeMenu,
    setShowAnalyzeMenu] =
    useState(false);


  /* =====================================================
     SIDEBAR
  ===================================================== */

  const [sidebarOpen,
    setSidebarOpen] =
    useState(false);


  /* =====================================================
     CHAT HISTORY
  ===================================================== */

  const [chatHistory,
    setChatHistory] =
    useState([]);


  /* =====================================================
     SEARCH
  ===================================================== */

  const [searchQuery,
    setSearchQuery] =
    useState("");


  /* =====================================================
     FILES
  ===================================================== */

  const [uploadedFile,
    setUploadedFile] =
    useState(null);

  const [imagePreview,
    setImagePreview] =
    useState(null);

  const [documentContext,
    setDocumentContext] =
    useState("");


  /* =====================================================
     AUDIO / VIDEO
  ===================================================== */

  const [audioFile,
    setAudioFile] =
    useState(null);

  const [videoFile,
    setVideoFile] =
    useState(null);


  /* =====================================================
     TTS
  ===================================================== */

  const [speaking,
    setSpeaking] =
    useState(false);


  /* =====================================================
     REFS
  ===================================================== */

  const messagesEndRef =
    useRef(null);

  const inputRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  const imageInputRef =
    useRef(null);

  const audioInputRef =
    useRef(null);

  const videoInputRef =
    useRef(null);


  /* =====================================================
     SPEECH RECOGNITION
  ===================================================== */

  const {
    transcript,
    listening,
    resetTranscript,
  } =
    useSpeechRecognition();


  /* =====================================================
     LANGUAGE OPTIONS
  ===================================================== */

  const languageOptions =
    Object.entries(
      languageGroups || {}
    ).flatMap(
      ([group, languages]) =>
        (languages || []).map(
          (language) => ({
            value:
              language.code ||
              language.value ||
              language.id,

            label:
              language.name ||
              language.label ||
              language.code,

            group,
          })
        )
    );


  /* =====================================================
     AUTO LANGUAGE FROM INPUT
  ===================================================== */

  const detectLanguage =
    (text = "") => {

      if (!text.trim()) {
        return "en";
      }

      const value =
        text.toLowerCase();

      if (
        /[\u0C00-\u0C7F]/.test(
          value
        )
      ) {
        return "te";
      }

      if (
        /[\u0C80-\u0CFF]/.test(
          value
        )
      ) {
        return "kn";
      }

      if (
        /[\u0900-\u097F]/.test(
          value
        )
      ) {
        return "hi";
      }

      if (
        /[\u0B80-\u0BFF]/.test(
          value
        )
      ) {
        return "ta";
      }

      if (
        /[\u0D00-\u0D7F]/.test(
          value
        )
      ) {
        return "ml";
      }

      return selectedLanguage ||
        "en";
    };


  /* =====================================================
     VOICE MAP
  ===================================================== */

  const voiceMap = {
    en: "en-US",
    hi: "hi-IN",
    te: "te-IN",
    kn: "kn-IN",
    ta: "ta-IN",
    ml: "ml-IN",
    mr: "mr-IN",
    gu: "gu-IN",
    bn: "bn-IN",
    pa: "pa-IN",
    ur: "ur-PK",
    ar: "ar-SA",
    zh: "zh-CN",
    ja: "ja-JP",
    ko: "ko-KR",
    fr: "fr-FR",
    de: "de-DE",
    es: "es-ES",
    it: "it-IT",
    pt: "pt-PT",
    ru: "ru-RU",
  };


  /* =====================================================
     AUTO SCROLL
  ===================================================== */

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [
    messages,
    loading,
    streaming,
  ]);


  /* =====================================================
     SPEECH → INPUT
  ===================================================== */

  useEffect(() => {

    if (
      transcript &&
      transcript.trim()
    ) {

      setInput(
        transcript
      );

    }

  }, [transcript]);


  /* =====================================================
     FIREBASE AUTH
  ===================================================== */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          if (currentUser) {

            setLoggedIn(true);

            setUsername(
              currentUser.email ||
              currentUser.displayName ||
              ""
            );

            try {

              const chats =
                await loadUserChats(
                  currentUser.uid
                );

              setChatHistory(
                Array.isArray(chats)
                  ? chats
                  : []
              );

            } catch (error) {

              console.error(
                "Chat history loading error:",
                error
              );

            }

          } else {

            setLoggedIn(false);

            setUsername("");

            setChatHistory([]);

          }

        }
      );

    return () =>
      unsubscribe();

  }, []);


  /* =====================================================
     GOOGLE LOGIN
  ===================================================== */

  const handleGoogleLogin =
    async () => {

      try {

        const result =
          await signInWithPopup(
            auth,
            googleProvider
          );

        setLoggedIn(true);

        setUsername(
          result.user.email ||
          result.user.displayName ||
          ""
        );

      } catch (error) {

        console.error(
          "Google login error:",
          error
        );

        setLoginError(
          error.message ||
          "Google login failed."
        );

      }

    };


  /* =====================================================
     EMAIL LOGIN
  ===================================================== */

  const handleEmailLogin =
    async () => {

      setLoginError("");

      if (
        !username.trim() ||
        !password
      ) {

        setLoginError(
          "Enter email and password."
        );

        return;

      }

      try {

        const result =
          await signInWithEmailAndPassword(
            auth,
            username.trim(),
            password
          );

        setLoggedIn(true);

        setUsername(
          result.user.email ||
          ""
        );

      } catch (error) {

        console.error(
          "Email login error:",
          error
        );

        setLoginError(
          error.message ||
          "Login failed."
        );

      }

    };


  /* =====================================================
     CREATE ACCOUNT
  ===================================================== */

  const handleCreateAccount =
    async () => {

      setLoginError("");

      if (
        !username.trim() ||
        !password
      ) {

        setLoginError(
          "Enter email and password."
        );

        return;

      }

      try {

        const result =
          await createUserWithEmailAndPassword(
            auth,
            username.trim(),
            password
          );

        setLoggedIn(true);

        setUsername(
          result.user.email ||
          ""
        );

      } catch (error) {

        console.error(
          "Create account error:",
          error
        );

        setLoginError(
          error.message ||
          "Account creation failed."
        );

      }

    };


  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout =
    async () => {

      try {

        await signOut(auth);

        setLoggedIn(false);

        setMessages([]);

        setInput("");

        setSidebarOpen(false);

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

      }

    };


  /* =====================================================
     SAVE CLOUD CHAT
  ===================================================== */

  const saveCloudChat =
    async (chatMessages) => {

      try {

        if (
          auth.currentUser
        ) {

          await saveChatToCloud(
            auth.currentUser.uid,
            chatMessages
          );

        }

      } catch (error) {

        console.error(
          "Cloud chat save error:",
          error
        );

      }

    };


  /* =====================================================
     LANGUAGE CODE
  ===================================================== */

  const getLanguageCode =
    () => {

      return (
        selectedLanguage ||
        "en"
      );

    };


  /* =====================================================
     READ ALOUD
  ===================================================== */

  const speakText =
    (text) => {

      if (
        !text ||
        !text.trim()
      ) {

        return;

      }

      try {

        window.speechSynthesis.cancel();

        const utterance =
          new SpeechSynthesisUtterance(
            text
          );

        utterance.lang =
          voiceMap[
            getLanguageCode()
          ] ||
          "en-US";

        utterance.rate =
          1;

        utterance.pitch =
          1;

        utterance.onstart =
          () => {

            setSpeaking(true);

          };

        utterance.onend =
          () => {

            setSpeaking(false);

          };

        utterance.onerror =
          () => {

            setSpeaking(false);

          };

        window.speechSynthesis.speak(
          utterance
        );

      } catch (error) {

        console.error(
          "Speech error:",
          error
        );

        setSpeaking(false);

      }

    };


  /* =====================================================
     STOP SPEAKING
  ===================================================== */

  const stopSpeaking =
    () => {

      try {

        window.speechSynthesis.cancel();

      } catch (error) {

        console.error(
          "Speech stop error:",
          error
        );

      }

      setSpeaking(false);

    };


  /* =====================================================
     START VOICE INPUT
  ===================================================== */

  const startVoiceInput =
    () => {

      try {

        resetTranscript();

        SpeechRecognition.startListening({
          continuous: false,
          interimResults: true,
          language:
            voiceMap[
              getLanguageCode()
            ] ||
            "en-US",
        });

      } catch (error) {

        console.error(
          "Voice input error:",
          error
        );

      }

    };


  /* =====================================================
     STOP VOICE INPUT
  ===================================================== */

  const stopVoiceInput =
    () => {

      try {

        SpeechRecognition.stopListening();

      } catch (error) {

        console.error(
          "Voice stop error:",
          error
        );

      }

    };


  /* =====================================================
     OPEN FILE PICKER
  ===================================================== */

  const openFilePicker =
    () => {

      fileInputRef.current?.click();

    };


  /* =====================================================
     OPEN IMAGE PICKER
  ===================================================== */

  const openImagePicker =
    () => {

      imageInputRef.current?.click();

    };


  /* =====================================================
     OPEN AUDIO PICKER
  ===================================================== */

  const openAudioPicker =
    () => {

      audioInputRef.current?.click();

    };


  /* =====================================================
     OPEN VIDEO PICKER
  ===================================================== */

  const openVideoPicker =
    () => {

      videoInputRef.current?.click();

    };


  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  const handleImageUpload =
    async (event) => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setUploadedFile(file);

      try {

        const preview =
          URL.createObjectURL(file);

        setImagePreview(preview);

        const formData =
          new FormData();

        formData.append(
          "image",
          file
        );

        const response =
          await fetch(
            "https://truvora-backend.onrender.com/upload-image",
            {
              method: "POST",
              body: formData,
            }
          );

        if (!response.ok) {

          throw new Error(
            `Image upload failed: ${response.status}`
          );

        }

        const data =
          await response.json();

        if (
          data.imageUrl
        ) {

          setImagePreview(
            data.imageUrl
          );

        }

      } catch (error) {

        console.error(
          "Image upload error:",
          error
        );

      }

    };


  /* =====================================================
     PDF / DOCUMENT UPLOAD
  ===================================================== */

  const handleDocumentUpload =
    async (event) => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setUploadedFile(file);

      try {

        const formData =
          new FormData();

        formData.append(
          "file",
          file
        );

        const response =
          await fetch(
            "https://truvora-backend.onrender.com/analyze-document",
            {
              method: "POST",
              body: formData,
            }
          );

        if (!response.ok) {

          throw new Error(
            `Document upload failed: ${response.status}`
          );

        }

        const data =
          await response.json();

        setDocumentContext(
          data.text ||
          data.analysis ||
          data.content ||
          ""
        );

      } catch (error) {

        console.error(
          "Document upload error:",
          error
        );

      }

    };


  /* =====================================================
     DROPZONE
  ===================================================== */

  const {
    getRootProps,
    getInputProps,
  } = useDropzone({

    multiple: false,

    onDrop: async (
      acceptedFiles
    ) => {

      const file =
        acceptedFiles?.[0];

      if (!file) {
        return;
      }

      if (
        file.type.startsWith(
          "image/"
        )
      ) {

        const fakeEvent = {
          target: {
            files: [file],
          },
        };

        await handleImageUpload(
          fakeEvent
        );

        return;

      }

      const fakeEvent = {
        target: {
          files: [file],
        },
      };

      await handleDocumentUpload(
        fakeEvent
      );

    },

  });


  /* =====================================================
     PART 1 ENDS
  ===================================================== */

/* =====================================================
   CHAT HISTORY + UI STATE
===================================================== */

  const [chats,
    setChats] =
    useState([]);

  const [showSearch,
    setShowSearch] =
    useState(false);

  const [searchChats,
    setSearchChats] =
    useState("");

  const [showProfileMenu,
    setShowProfileMenu] =
    useState(false);

  const [showLogin,
    setShowLogin] =
    useState(false);

  const [showSignup,
    setShowSignup] =
    useState(false);


  /* =====================================================
     VIDEO / AUDIO PROCESSING
===================================================== */

  const [videoAnalysis,
    setVideoAnalysis] =
    useState("");

  const [audioAnalysis,
    setAudioAnalysis] =
    useState("");

  const [analysisLoading,
    setAnalysisLoading] =
    useState(false);


  /* =====================================================
     DOCUMENT GENERATION
===================================================== */

  const [generatedFile,
    setGeneratedFile] =
    useState(null);

  const [generatingFile,
    setGeneratingFile] =
    useState(false);

  const [showFileMenu,
    setShowFileMenu] =
    useState(false);


  /* =====================================================
     CAMERA
===================================================== */

  const [cameraOpen,
    setCameraOpen] =
    useState(false);

  const videoRef =
    useRef(null);

  const cameraStreamRef =
    useRef(null);


  /* =====================================================
     PERSONAL VOICE
===================================================== */

  const [recordingVoice,
    setRecordingVoice] =
    useState(false);

  const [voiceRecorder,
    setVoiceRecorder] =
    useState(null);

  const voiceChunksRef =
    useRef([]);


  /* =====================================================
     AUTOMATIC WEB / AGENT DETECTION
===================================================== */

  const shouldUseWebAutomatically =
    (text = "") => {

      const value =
        text
          .toLowerCase()
          .trim();

      if (!value) {
        return false;
      }

      const webTriggers = [

        "latest",
        "current",
        "currently",
        "today",
        "tonight",
        "tomorrow",
        "yesterday",
        "recent",
        "breaking",
        "news",

        "weather",
        "price",
        "prices",
        "stock",
        "stocks",
        "bitcoin",
        "crypto",

        "score",
        "scores",
        "live",

        "schedule",
        "standings",

        "president",
        "prime minister",
        "ceo",

        "release date",
        "latest version",

        "search the web",
        "search online",
        "look online",
        "find online",

      ];

      return webTriggers.some(
        (trigger) =>
          value.includes(trigger)
      );

    };


  const shouldUseAgentAutomatically =
    (text = "") => {

      const value =
        text
          .toLowerCase()
          .trim();

      if (!value) {
        return false;
      }

      const agentTriggers = [

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
        "organize and",
        "plan and",
        "automate",
        "complete this task",

      ];

      return agentTriggers.some(
        (trigger) =>
          value.includes(trigger)
      );

    };


  /* =====================================================
     NEW CHAT
===================================================== */

  const handleNewChat =
    () => {

      stopSpeaking();

      setMessages([]);

      setInput("");

      setUploadedFile(null);

      setImagePreview(null);

      setDocumentContext("");

      setAudioFile(null);

      setVideoFile(null);

      setVideoAnalysis("");

      setAudioAnalysis("");

      setGeneratedFile(null);

      setShowAnalyzeMenu(false);

      setShowFileMenu(false);

      setSidebarOpen(false);

      setStopRequested(false);

      setStreaming(false);

    };


  /* =====================================================
     OPEN EXISTING CHAT
===================================================== */

  const openChat =
    (chat) => {

      if (!chat) {
        return;
      }

      let chatMessages = [];

      if (
        Array.isArray(chat)
      ) {

        chatMessages =
          chat;

      } else if (
        Array.isArray(
          chat.messages
        )
      ) {

        chatMessages =
          chat.messages;

      }

      setMessages(
        chatMessages
      );

      setInput("");

      setDocumentContext("");

      setUploadedFile(null);

      setImagePreview(null);

      setAudioFile(null);

      setVideoFile(null);

      setSidebarOpen(false);

    };


  /* =====================================================
     LOAD CLOUD CHATS
===================================================== */

  const refreshChats =
    async () => {

      if (
        !auth.currentUser
      ) {

        return;

      }

      try {

        const result =
          await loadUserChats(
            auth.currentUser.uid
          );

        if (
          Array.isArray(result)
        ) {

          setChatHistory(
            result
          );

          setChats(
            result
          );

        }

      } catch (error) {

        console.error(
          "Unable to load chats:",
          error
        );

      }

    };


  /* =====================================================
     KEEP CHAT HISTORY IN SYNC
===================================================== */

  useEffect(() => {

    if (
      Array.isArray(
        chatHistory
      )
    ) {

      setChats(
        chatHistory
      );

    }

  }, [
    chatHistory
  ]);


  /* =====================================================
     SAVE CURRENT CHAT
===================================================== */

  const saveCurrentChat =
    async (
      updatedMessages
    ) => {

      if (
        !Array.isArray(
          updatedMessages
        )
      ) {

        return;

      }

      saveChat(
        updatedMessages
      );

      if (
        auth.currentUser
      ) {

        try {

          await saveChatToCloud(
            auth.currentUser.uid,
            updatedMessages
          );

          await refreshChats();

        } catch (error) {

          console.error(
            "Save chat error:",
            error
          );

        }

      }

    };


  /* =====================================================
     SEARCH CHAT HISTORY
===================================================== */

  const filteredChats =
    chats.filter(
      (chat) => {

        if (
          !searchChats.trim()
        ) {

          return true;

        }

        const messagesInChat =
          Array.isArray(chat)
            ? chat
            : Array.isArray(
                chat?.messages
              )
            ? chat.messages
            : [];

        const text =
          messagesInChat
            .map(
              (message) =>
                message?.text ||
                message?.content ||
                ""
            )
            .join(" ")
            .toLowerCase();

        return text.includes(
          searchChats
            .toLowerCase()
        );

      }
    );


  /* =====================================================
     COPY MESSAGE
===================================================== */

  const copyMessage =
    async (
      text
    ) => {

      if (!text) {
        return;
      }

      try {

        await navigator.clipboard.writeText(
          text
        );

      } catch (error) {

        console.error(
          "Copy failed:",
          error
        );

      }

    };


  /* =====================================================
     CLEAR INPUT ATTACHMENTS
===================================================== */

  const clearAttachments =
    () => {

      setUploadedFile(null);

      setImagePreview(null);

      setDocumentContext("");

      setAudioFile(null);

      setVideoFile(null);

      setVideoAnalysis("");

      setAudioAnalysis("");

    };


  /* =====================================================
     HANDLE AUDIO FILE
===================================================== */

  const handleAudioUpload =
    async (
      event
    ) => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setAudioFile(file);

      setAnalysisLoading(true);

      try {

        const formData =
          new FormData();

        formData.append(
          "audio",
          file
        );

        const response =
          await fetch(
            "https://truvora-backend.onrender.com/upload-audio",
            {
              method: "POST",
              body: formData,
            }
          );

        if (!response.ok) {

          throw new Error(
            `Audio upload failed: ${response.status}`
          );

        }

        const data =
          await response.json();

        const result =
          data.analysis ||
          data.summary ||
          data.text ||
          "";

        setAudioAnalysis(
          result
        );

      } catch (error) {

        console.error(
          "Audio processing error:",
          error
        );

        setAudioAnalysis(
          "Audio analysis could not be completed."
        );

      } finally {

        setAnalysisLoading(
          false
        );

      }

    };


  /* =====================================================
     HANDLE VIDEO FILE
===================================================== */

  const handleVideoUpload =
    async (
      event
    ) => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setVideoFile(file);

      setAnalysisLoading(true);

      try {

        const formData =
          new FormData();

        formData.append(
          "video",
          file
        );

        const response =
          await fetch(
            "https://truvora-backend.onrender.com/upload-video",
            {
              method: "POST",
              body: formData,
            }
          );

        if (!response.ok) {

          throw new Error(
            `Video upload failed: ${response.status}`
          );

        }

        const data =
          await response.json();

        const result =
          data.analysis ||
          data.summary ||
          data.text ||
          "";

        setVideoAnalysis(
          result
        );

      } catch (error) {

        console.error(
          "Video processing error:",
          error
        );

        setVideoAnalysis(
          "Video analysis could not be completed."
        );

      } finally {

        setAnalysisLoading(
          false
        );

      }

    };


  /* =====================================================
     CAMERA START
===================================================== */

  const startCamera =
    async () => {

      try {

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: true,
              audio: false,
            }
          );

        cameraStreamRef.current =
          stream;

        setCameraOpen(true);

        setTimeout(() => {

          if (
            videoRef.current
          ) {

            videoRef.current.srcObject =
              stream;

          }

        }, 100);

      } catch (error) {

        console.error(
          "Camera error:",
          error
        );

        alert(
          "Camera permission is required."
        );

      }

    };


  /* =====================================================
     CAMERA STOP
===================================================== */

  const stopCamera =
    () => {

      if (
        cameraStreamRef.current
      ) {

        cameraStreamRef.current
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        cameraStreamRef.current =
          null;

      }

      if (
        videoRef.current
      ) {

        videoRef.current.srcObject =
          null;

      }

      setCameraOpen(false);

    };


  /* =====================================================
     CAMERA CAPTURE
===================================================== */

  const captureCameraImage =
    async () => {

      if (
        !videoRef.current
      ) {

        return;

      }

      const video =
        videoRef.current;

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        video.videoWidth ||
        1280;

      canvas.height =
        video.videoHeight ||
        720;

      const context =
        canvas.getContext(
          "2d"
        );

      if (!context) {
        return;
      }

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(
        async (
          blob
        ) => {

          if (!blob) {
            return;
          }

          const file =
            new File(
              [blob],
              "truvora-camera.jpg",
              {
                type:
                  "image/jpeg",
              }
            );

          const fakeEvent = {
            target: {
              files: [file],
            },
          };

          await handleImageUpload(
            fakeEvent
          );

          stopCamera();

        },
        "image/jpeg",
        0.92
      );

    };


  /* =====================================================
     PERSONAL VOICE RECORDING
===================================================== */

  const startPersonalVoiceRecording =
    async () => {

      try {

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        const recorder =
          new MediaRecorder(
            stream
          );

        voiceChunksRef.current =
          [];

        recorder.ondataavailable =
          (event) => {

            if (
              event.data.size > 0
            ) {

              voiceChunksRef.current.push(
                event.data
              );

            }

          };

        recorder.onstop =
          async () => {

            const blob =
              new Blob(
                voiceChunksRef.current,
                {
                  type:
                    "audio/webm",
                }
              );

            const file =
              new File(
                [blob],
                "truvora-personal-voice.webm",
                {
                  type:
                    "audio/webm",
                }
              );

            setPersonalVoice(
              file
            );

            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );

          };

        recorder.start();

        setVoiceRecorder(
          recorder
        );

        setRecordingVoice(
          true
        );

      } catch (error) {

        console.error(
          "Personal voice error:",
          error
        );

        alert(
          "Microphone permission is required."
        );

      }

    };


  /* =====================================================
     STOP PERSONAL VOICE RECORDING
===================================================== */

  const stopPersonalVoiceRecording =
    () => {

      if (
        voiceRecorder
      ) {

        voiceRecorder.stop();

      }

      setVoiceRecorder(
        null
      );

      setRecordingVoice(
        false
      );

    };


  /* =====================================================
     VOICE SELECTOR
===================================================== */

  const handleVoiceChange =
    (
      event
    ) => {

      const value =
        event.target.value;

      setSelectedVoice(
        value
      );

      if (
        value === "personal"
      ) {

        setShowPersonalVoice(
          true
        );

      } else {

        setShowPersonalVoice(
          false
        );

      }

    };


  /* =====================================================
     PART 2 ENDS
===================================================== */

/* =====================================================
   WEBSITE ANALYSIS
===================================================== */

  const handleWebsiteAnalysis =
    async () => {

      const url =
        window.prompt(
          "Enter the website URL:"
        );

      if (!url) {
        return;
      }

      setShowAnalyzeMenu(false);

      setAnalysisLoading(true);

      try {

        const response =
          await fetch(
            "https://truvora-backend.onrender.com/analyze-website",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                url,
              }),
            }
          );

        if (!response.ok) {

          throw new Error(
            `Website analysis failed: ${response.status}`
          );

        }

        const data =
          await response.json();

        const result =
          data.analysis ||
          data.summary ||
          data.text ||
          data.content ||
          "";

        if (result) {

          const websiteMessage = {
            role: "assistant",
            text: result,
            sources:
              Array.isArray(
                data.sources
              )
                ? data.sources
                : [],
          };

          const updatedMessages = [
            ...messages,
            {
              role: "user",
              text:
                `Analyze this website: ${url}`,
            },
            websiteMessage,
          ];

          setMessages(
            updatedMessages
          );

          await saveCurrentChat(
            updatedMessages
          );

        }

      } catch (error) {

        console.error(
          "Website analysis error:",
          error
        );

        const errorMessage = {
          role: "assistant",
          text:
            "I couldn't analyze that website right now. Please check the URL and try again.",
          sources: [],
        };

        const updatedMessages = [
          ...messages,
          {
            role: "user",
            text:
              `Analyze this website: ${url}`,
          },
          errorMessage,
        ];

        setMessages(
          updatedMessages
        );

        await saveCurrentChat(
          updatedMessages
        );

      } finally {

        setAnalysisLoading(
          false
        );

      }

    };


  /* =====================================================
     YOUTUBE ANALYSIS
===================================================== */

  const handleYouTube =
    async (
      youtubeUrl
    ) => {

      if (!youtubeUrl) {
        return;
      }

      setShowAnalyzeMenu(false);

      setAnalysisLoading(true);

      try {

        const response =
          await fetch(
            "https://truvora-backend.onrender.com/analyze-youtube",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                url:
                  youtubeUrl,
              }),
            }
          );

        if (!response.ok) {

          throw new Error(
            `YouTube analysis failed: ${response.status}`
          );

        }

        const data =
          await response.json();

        const result =
          data.analysis ||
          data.summary ||
          data.transcript ||
          data.text ||
          "";

        const sources =
          Array.isArray(
            data.sources
          )
            ? data.sources
            : [
                {
                  title:
                    "YouTube",
                  url:
                    youtubeUrl,
                },
              ];

        const updatedMessages = [
          ...messages,

          {
            role: "user",
            text:
              `Analyze this YouTube video:\n${youtubeUrl}`,
          },

          {
            role: "assistant",
            text:
              result ||
              "I couldn't extract enough information from this YouTube video.",

            sources,
          },

        ];

        setMessages(
          updatedMessages
        );

        await saveCurrentChat(
          updatedMessages
        );

      } catch (error) {

        console.error(
          "YouTube analysis error:",
          error
        );

        const updatedMessages = [
          ...messages,

          {
            role: "user",
            text:
              `Analyze this YouTube video:\n${youtubeUrl}`,
          },

          {
            role: "assistant",
            text:
              "I couldn't analyze that YouTube video right now.",
            sources: [],
          },

        ];

        setMessages(
          updatedMessages
        );

        await saveCurrentChat(
          updatedMessages
        );

      } finally {

        setAnalysisLoading(
          false
        );

      }

    };


  /* =====================================================
     DOCUMENT ANALYSIS
===================================================== */

  const analyzeUploadedDocument =
    async () => {

      if (!uploadedFile) {
        return;
      }

      setShowAnalyzeMenu(false);

      await handleDocumentUpload({
        target: {
          files: [
            uploadedFile,
          ],
        },
      });

    };


  /* =====================================================
     IMAGE ANALYSIS
===================================================== */

  const analyzeUploadedImage =
    async () => {

      if (!uploadedFile) {
        openImagePicker();
        return;
      }

      setShowAnalyzeMenu(false);

      await handleImageUpload({
        target: {
          files: [
            uploadedFile,
          ],
        },
      });

    };


  /* =====================================================
     OPEN ANALYZER
===================================================== */

  const openAnalyzer =
    () => {

      setShowAnalyzeMenu(
        (previous) =>
          !previous
      );

      setShowFileMenu(
        false
      );

    };


  /* =====================================================
     SEND MESSAGE
===================================================== */

  const handleSend =
    async () => {

      const trimmedInput =
        input.trim();

      if (
        !trimmedInput &&
        !documentContext &&
        !imagePreview &&
        !audioAnalysis &&
        !videoAnalysis
      ) {

        return;

      }


      if (loading) {
        return;
      }


      setStopRequested(
        false
      );

      setStreaming(
        true
      );

      setLoading(
        true
      );


      const automaticWeb =
        shouldUseWebAutomatically(
          trimmedInput
        );

      const automaticAgent =
        shouldUseAgentAutomatically(
          trimmedInput
        );


      /*
       * Manual switches remain available.
       * Automatic detection can also activate
       * the corresponding backend capability.
       */

      const finalWeb =
        webEnabled ||
        automaticWeb;

      const finalAgent =
        agentMode ||
        automaticAgent;


      const detectedLanguage =
        detectLanguage(
          trimmedInput
        );


      const userMessage = {

        role:
          "user",

        text:
          trimmedInput ||
          (
            documentContext
              ? "Analyze the uploaded document."
              : imagePreview
              ? "Analyze the uploaded image."
              : audioAnalysis
              ? "Analyze the uploaded audio."
              : videoAnalysis
              ? "Analyze the uploaded video."
              : "Analyze the uploaded content."
          ),

      };


      const previousMessages =
        [
          ...messages,
          userMessage,
        ];


      setMessages(
        previousMessages
      );


      setInput("");


      try {

        const response =
          await fetch(
            "https://truvora-backend.onrender.com/ask",
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
                    trimmedInput ||
                    userMessage.text,

                  history:
                    previousMessages
                      .slice(-10),

                  web:
                    finalWeb,

                  agentMode:
                    finalAgent,

                  automaticWeb:
                    automaticWeb,

                  automaticAgent:
                    automaticAgent,

                  language:
                    detectedLanguage,

                  selectedLanguage:
                    detectedLanguage,

                  voice:
                    selectedVoice,

                  imageUrl:
                    imagePreview,

                  documentContext:
                    documentContext,

                  audioAnalysis:
                    audioAnalysis,

                  videoAnalysis:
                    videoAnalysis,

                }),

            }
          );


        if (!response.ok) {

          throw new Error(
            `Truvora server returned ${response.status}`
          );

        }


        const contentType =
          response.headers.get(
            "content-type"
          ) || "";


        /*
         * Normal JSON response.
         */

        let data;


        if (
          contentType.includes(
            "application/json"
          )
        ) {

          data =
            await response.json();

        } else {

          const rawText =
            await response.text();

          data = {
            reply:
              rawText,
          };

        }


        const answer =
          data.reply ||
          data.answer ||
          data.analysis ||
          data.response ||
          "";


        if (!answer) {

          throw new Error(
            "Truvora returned an empty answer."
          );

        }


        /*
         * Preserve citations/sources returned
         * by the backend.
         */

        const sources =
          Array.isArray(
            data.sources
          )
            ? data.sources
            : [];


        /*
         * Display the response progressively.
         */

        let visibleAnswer =
          "";


        for (
          let index = 0;
          index < answer.length;
          index++
        ) {

          if (
            stopRequested
          ) {

            break;

          }


          visibleAnswer +=
            answer[index];


          setMessages(
            [
              ...previousMessages,

              {
                role:
                  "assistant",

                text:
                  visibleAnswer,

                sources,
              },

            ]
          );


          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                5
              )
          );

        }


        /*
         * Always finish with the complete
         * answer unless the user stopped it.
         */

        const finalAnswer =
          stopRequested
            ? visibleAnswer
            : answer;


        const assistantMessage = {

          role:
            "assistant",

          text:
            finalAnswer,

          sources,

          image:
            data.image ||
            null,

          document:
            data.document ||
            null,

        };


        const finalMessages = [

          ...previousMessages,

          assistantMessage,

        ];


        setMessages(
          finalMessages
        );


        await saveCurrentChat(
          finalMessages
        );


        /*
         * Clear temporary attachments
         * after successful processing.
         */

        clearAttachments();


      } catch (error) {

        console.error(
          "Truvora request error:",
          error
        );


        const errorMessage = {

          role:
            "assistant",

          text:
            "Sorry, Truvora could not process your request right now. Please try again.",

          sources: [],

        };


        const finalMessages = [

          ...previousMessages,

          errorMessage,

        ];


        setMessages(
          finalMessages
        );


        await saveCurrentChat(
          finalMessages
        );

      } finally {

        setLoading(
          false
        );

        setStreaming(
          false
        );

        setStopRequested(
          false
        );

      }

    };


  /* =====================================================
     STOP GENERATION
===================================================== */

  const handleStopGeneration =
    () => {

      setStopRequested(
        true
      );

      setLoading(
        false
      );

      setStreaming(
        false
      );

    };


  /* =====================================================
     FILE GENERATION
===================================================== */

  const handleGenerateDocument =
    async (
      type,
      text
    ) => {

      if (!text?.trim()) {
        return;
      }

      setGeneratingFile(
        true
      );

      setShowFileMenu(
        false
      );

      try {

        const response =
          await fetch(
            "https://truvora-backend.onrender.com/generate-document",
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

                  content:
                    text,

                  summary:
                    text,

                }),

            }
          );


        if (!response.ok) {

          throw new Error(
            `Document generation failed: ${response.status}`
          );

        }


        const data =
          await response.json();


        const url =
          data.fileUrl ||
          data.url ||
          data.downloadUrl ||
          null;


        if (url) {

          setGeneratedFile(
            url
          );

          window.open(
            url.startsWith("http")
              ? url
              : `https://truvora-backend.onrender.com${url}`,
            "_blank",
            "noopener,noreferrer"
          );

        }

      } catch (error) {

        console.error(
          "Document generation error:",
          error
        );

        alert(
          "The requested file could not be generated."
        );

      } finally {

        setGeneratingFile(
          false
        );

      }

    };


  /* =====================================================
     SHARE ANSWER
===================================================== */

  const shareAnswer =
    async (
      text
    ) => {

      if (!text) {
        return;
      }

      try {

        if (
          navigator.share
        ) {

          await navigator.share({
            title:
              "Truvora Global AI",
            text,
          });

        } else {

          await navigator.clipboard.writeText(
            text
          );

          alert(
            "Answer copied to clipboard."
          );

        }

      } catch (error) {

        console.error(
          "Share error:",
          error
        );

      }

    };


  /* =====================================================
     FILE MENU
===================================================== */

  const toggleFileMenu =
    () => {

      setShowFileMenu(
        (previous) =>
          !previous
      );

      setShowAnalyzeMenu(
        false
      );

    };


  /* =====================================================
     SIDEBAR
===================================================== */

  const toggleSidebar =
    () => {

      setSidebarOpen(
        (previous) =>
          !previous
      );

    };


  /* =====================================================
     PART 3 ENDS
===================================================== */

/* =====================================================
   ANALYZE MENU HANDLERS
===================================================== */

  const handleAnalyzeDocument =
    () => {

      setShowAnalyzeMenu(false);

      fileInputRef.current?.click();

    };


  const handleAnalyzeImage =
    () => {

      setShowAnalyzeMenu(false);

      imageInputRef.current?.click();

    };


  const handleAnalyzeAudio =
    () => {

      setShowAnalyzeMenu(false);

      audioInputRef.current?.click();

    };


  const handleAnalyzeVideo =
    () => {

      setShowAnalyzeMenu(false);

      videoInputRef.current?.click();

    };


  const handleAnalyzeCamera =
    async () => {

      setShowAnalyzeMenu(false);

      await startCamera();

    };


  const handleAnalyzeYouTube =
    async () => {

      setShowAnalyzeMenu(false);

      const url =
        window.prompt(
          "Paste the YouTube URL:"
        );

      if (!url) {
        return;
      }

      await handleYouTube(
        url.trim()
      );

    };


  const handleAnalyzeWebsite =
    async () => {

      setShowAnalyzeMenu(false);

      await handleWebsiteAnalysis();

    };


  /* =====================================================
     INPUT HANDLER
===================================================== */

  const handleInputChange =
    (event) => {

      setInput(
        event.target.value
      );

    };


  /* =====================================================
     ENTER TO SEND
===================================================== */

  const handleInputKeyDown =
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        if (!loading) {

          handleSend();

        }

      }

    };


  /* =====================================================
     LANGUAGE CHANGE
===================================================== */

  const handleLanguageChange =
    (option) => {

      if (!option) {
        return;
      }

      setSelectedLanguage(
        option.value
      );

    };


  /* =====================================================
     SELECTED LANGUAGE OBJECT
===================================================== */

  const selectedLanguageOption =
    languageOptions.find(
      (option) =>
        option.value ===
        selectedLanguage
    ) ||
    {
      value: "en",
      label: "English",
    };


  /* =====================================================
     REACT SELECT STYLES
===================================================== */

  const languageSelectStyles = {

    control:
      (base, state) => ({

        ...base,

        minHeight:
          36,

        width:
          150,

        background:
          "rgba(255,255,255,0.035)",

        border:
          state.isFocused
            ? "1px solid rgba(41,182,246,0.42)"
            : "1px solid rgba(148,163,184,0.13)",

        borderRadius:
          10,

        boxShadow:
          "none",

        cursor:
          "pointer",

      }),


    menu:
      (base) => ({

        ...base,

        zIndex:
          3000,

        background:
          "#0f1d30",

        border:
          "1px solid rgba(148,163,184,0.14)",

        borderRadius:
          12,

        overflow:
          "hidden",

      }),


    option:
      (
        base,
        state
      ) => ({

        ...base,

        background:
          state.isFocused
            ? "rgba(21,101,192,0.22)"
            : "#0f1d30",

        color:
          "#eaf3fc",

        cursor:
          "pointer",

        fontSize:
          12,

      }),


    singleValue:
      (base) => ({

        ...base,

        color:
          "#dbe7f5",

        fontSize:
          12,

      }),


    placeholder:
      (base) => ({

        ...base,

        color:
          "#71869e",

        fontSize:
          12,

      }),


    input:
      (base) => ({

        ...base,

        color:
          "#fff",

      }),


    indicatorSeparator:
      () => ({

        display:
          "none",

      }),

  };


  /* =====================================================
     LOGIN SCREEN
===================================================== */

  if (!loggedIn) {

    return (

      <div className="truvora-login-screen">

        <div className="truvora-login-card">

          <div className="truvora-logo">

            <div className="truvora-logo-symbol">
              T
            </div>

            <div className="truvora-logo-text">

              <strong>
                TRUVORA
              </strong>

              <span>
                INTELLIGENCE • INNOVATION • TRUST
              </span>

            </div>

          </div>


          <div className="truvora-login-content">

            <h1>
              Welcome to Truvora
            </h1>

            <p>
              Your global AI workspace for
              chat, research, analysis,
              creation and productivity.
            </p>


            <button
              className="google-login-button"
              onClick={
                handleGoogleLogin
              }
            >

              Continue with Google

            </button>


            <div className="login-divider">
              <span>
                or
              </span>
            </div>


            <input
              className="login-input"
              type="email"
              placeholder="Email"
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value
                )
              }
            />


            <input
              className="login-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              onKeyDown={(event) => {

                if (
                  event.key === "Enter"
                ) {

                  handleEmailLogin();

                }

              }}
            />


            {loginError && (

              <div className="login-error">

                {loginError}

              </div>

            )}


            <button
              className="email-login-button"
              onClick={
                handleEmailLogin
              }
            >

              Sign in

            </button>


            <button
              className="signup-link-button"
              onClick={
                handleCreateAccount
              }
            >

              Create account

            </button>


          </div>


          <div className="truvora-login-footer">

            Truvora Global AI

          </div>

        </div>

      </div>

    );

  }


  /* =====================================================
     RENDER SOURCE LIST
===================================================== */

  const renderSources =
    (sources = []) => {

      const normalizedSources =
        citationRefs(
          Array.isArray(sources)
            ? sources
            : []
        );

      if (
        normalizedSources.length === 0
      ) {

        return null;

      }


      return (

        <div className="truvora-sources">

          <div className="sources-title">

            <span>
              📚
            </span>

            <span>
              Sources
            </span>

          </div>


          <div className="sources-list">

            {normalizedSources.map(
              (source, index) => (

                <a
                  key={
                    `${source.sourceUrl}-${index}`
                  }

                  className="source-item"

                  href={
                    source.sourceUrl
                  }

                  target="_blank"

                  rel="noopener noreferrer"

                  onClick={() =>
                    setActiveCitation(
                      source
                    )
                  }
                >

                  <span className="source-number">

                    {source.citationNumber}

                  </span>


                  <span className="source-content">

                    <strong>

                      {
                        source.title ||
                        source.name ||
                        source.domain ||
                        `Source ${index + 1}`
                      }

                    </strong>


                    <small>

                      {
                        source.domain ||
                        source.sourceUrl
                      }

                    </small>

                  </span>


                  <span className="source-arrow">

                    ↗

                  </span>

                </a>

              )
            )}

          </div>

        </div>

      );

    };


  /* =====================================================
     RENDER MESSAGE
===================================================== */

  const renderMessage =
    (
      message,
      index
    ) => {

      const isUser =
        message.role ===
        "user";


      const messageText =
        message.text ||
        message.content ||
        "";


      return (

        <div
          key={
            message.id ||
            `${message.role}-${index}`
          }

          className={
            `truvora-message ${
              isUser
                ? "truvora-user-message"
                : "truvora-ai-message"
            }`
          }
        >

          {!isUser && (

            <div className="message-avatar">

              T

            </div>

          )}


          <div className="message-body">

            <div className="message-text">

              {isUser ? (

                <div>
                  {messageText}
                </div>

              ) : (

                <ReactMarkdown
                  remarkPlugins={[
                    remarkGfm
                  ]}
                >

                  {messageText}

                </ReactMarkdown>

              )}


              {message.image && (

                <div className="message-image-container">

                  <img
                    src={
                      message.image
                    }

                    alt="Generated by Truvora"

                    className="message-image"
                  />

                </div>

              )}


              {message.document && (

                <a
                  className="generated-document"

                  href={
                    message.document
                  }

                  target="_blank"

                  rel="noopener noreferrer"
                >

                  📄 Open generated document

                </a>

              )}


              {!isUser &&
                renderSources(
                  message.sources
                )}

            </div>


            {!isUser && (

              <div className="message-actions">

                <CopyToClipboard
                  text={
                    messageText
                  }
                >

                  <button
                    className="message-action-btn"
                    title="Copy"
                  >

                    <FiCopy />

                  </button>

                </CopyToClipboard>


                <button
                  className="message-action-btn"
                  title={
                    speaking
                      ? "Stop speaking"
                      : "Read aloud"
                  }

                  onClick={() => {

                    if (speaking) {

                      stopSpeaking();

                    } else {

                      speakText(
                        messageText
                      );

                    }

                  }}
                >

                  <FiVolume2 />

                </button>


                <button
                  className="message-action-btn"
                  title="Share"
                  onClick={() =>
                    shareAnswer(
                      messageText
                    )
                  }
                >

                  ↗

                </button>


                <button
                  className="message-action-btn"
                  title="Save"
                  onClick={() =>
                    saveCurrentChat(
                      messages
                    )
                  }
                >

                  ☆

                </button>


                <button
                  className="message-action-btn"
                  title="PDF"
                  onClick={() =>
                    handleGenerateDocument(
                      "pdf",
                      messageText
                    )
                  }
                >

                  📄

                </button>

              </div>

            )}

          </div>


          {isUser && (

            <div className="message-avatar user-avatar">

              <FiUser />

            </div>

          )}

        </div>

      );

    };


  /* =====================================================
     ANALYZE MENU
===================================================== */

  const renderAnalyzeMenu =
    () => {

      if (
        !showAnalyzeMenu
      ) {

        return null;

      }


      return (

        <div className="analyze-menu">

          <div className="analyze-menu-header">

            <strong>
              Analyze anything
            </strong>

            <button
              onClick={() =>
                setShowAnalyzeMenu(
                  false
                )
              }
            >

              ×

            </button>

          </div>


          <button
            onClick={
              handleAnalyzeDocument
            }
          >

            <span>
              📄
            </span>

            <span>
              Document
            </span>

          </button>


          <button
            onClick={
              handleAnalyzeImage
            }
          >

            <span>
              🖼️
            </span>

            <span>
              Image
            </span>

          </button>


          <button
            onClick={
              handleAnalyzeCamera
            }
          >

            <span>
              📷
            </span>

            <span>
              Live Camera
            </span>

          </button>


          <button
            onClick={
              handleAnalyzeVideo
            }
          >

            <span>
              🎥
            </span>

            <span>
              Video
            </span>

          </button>


          <button
            onClick={
              handleAnalyzeAudio
            }
          >

            <span>
              🎙️
            </span>

            <span>
              Audio
            </span>

          </button>


          <button
            onClick={
              handleAnalyzeYouTube
            }
          >

            <span>
              ▶️
            </span>

            <span>
              YouTube
            </span>

          </button>


          <button
            onClick={
              handleAnalyzeWebsite
            }
          >

            <span>
              🌐
            </span>

            <span>
              Website
            </span>

          </button>

        </div>

      );

    };


  /* =====================================================
     CAMERA MODAL
===================================================== */

  const renderCamera =
    () => {

      if (!cameraOpen) {
        return null;
      }


      return (

        <div className="camera-overlay">

          <div className="camera-modal">

            <div className="camera-header">

              <strong>
                Live Camera
              </strong>

              <button
                onClick={
                  stopCamera
                }
              >

                ×

              </button>

            </div>


            <video
              ref={
                videoRef
              }

              autoPlay

              playsInline

              muted

              className="camera-video"
            />


            <div className="camera-actions">

              <button
                className="camera-capture-button"
                onClick={
                  captureCameraImage
                }
              >

                Capture

              </button>


              <button
                className="camera-cancel-button"
                onClick={
                  stopCamera
                }
              >

                Cancel

              </button>

            </div>

          </div>

        </div>

      );

    };


  /* =====================================================
     PERSONAL VOICE MODAL
===================================================== */

  const renderPersonalVoice =
    () => {

      if (
        !showPersonalVoice
      ) {

        return null;

      }


      return (

        <div className="personal-voice-panel">

          <div className="personal-voice-header">

            <strong>
              Personal Voice
            </strong>

            <button
              onClick={() =>
                setShowPersonalVoice(
                  false
                )
              }
            >

              ×

            </button>

          </div>


          <p>

            Record a short voice sample
            to use as your personal voice.

          </p>


          {!recordingVoice ? (

            <button
              className="personal-voice-record"
              onClick={
                startPersonalVoiceRecording
              }
            >

              🎤 Start recording

            </button>

          ) : (

            <button
              className="personal-voice-stop"
              onClick={
                stopPersonalVoiceRecording
              }
            >

              ■ Stop recording

            </button>

          )}


          {personalVoice && (

            <div className="personal-voice-success">

              ✓ Voice sample ready

            </div>

          )}

        </div>

      );

    };


  /* =====================================================
     PART 4 ENDS
===================================================== */

/* =====================================================
   SIDEBAR
===================================================== */

  const renderSidebar =
    () => {

      return (

        <>

          <aside
            className={
              `truvora-sidebar ${
                sidebarOpen
                  ? "sidebar-visible"
                  : "sidebar-hidden"
              }`
            }
          >

            <div className="sidebar-brand">

              <div className="sidebar-brand-symbol">
                T
              </div>

              <div className="sidebar-brand-text">

                <strong>
                  TRUVORA
                </strong>

                <span>
                  GLOBAL AI
                </span>

              </div>


              <button
                className="sidebar-mobile-close"

                onClick={() =>
                  setSidebarOpen(
                    false
                  )
                }

                aria-label="Close sidebar"
              >

                ×

              </button>

            </div>


            <button
              className="new-chat-button"

              onClick={
                handleNewChat
              }
            >

              <FiPlus />

              <span>
                New Chat
              </span>

            </button>


            <div className="sidebar-search">

              <FiCopy />

              <input
                value={
                  searchChats
                }

                onChange={(event) =>
                  setSearchChats(
                    event.target.value
                  )
                }

                placeholder="Search chats..."
              />

            </div>


            <div className="sidebar-section">

              <div className="sidebar-section-title">

                RECENTS

              </div>


              <div className="sidebar-chat-list">

                {filteredChats.length === 0 ? (

                  <div className="sidebar-empty">

                    No conversations yet.

                  </div>

                ) : (

                  filteredChats.map(
                    (chat, index) => {

                      const chatMessages =
                        Array.isArray(chat)
                          ? chat
                          : Array.isArray(
                              chat?.messages
                            )
                          ? chat.messages
                          : [];

                      const firstMessage =
                        chatMessages.find(
                          (message) =>
                            message?.text ||
                            message?.content
                        );

                      const title =
                        firstMessage?.text ||
                        firstMessage?.content ||
                        `Conversation ${index + 1}`;

                      return (

                        <button
                          key={
                            chat?.id ||
                            chat?.chatId ||
                            index
                          }

                          className="sidebar-chat-item"

                          onClick={() =>
                            openChat(
                              chat
                            )
                          }
                        >

                          {title}

                        </button>

                      );

                    }
                  )

                )}

              </div>

            </div>


            <div className="sidebar-bottom">

              <div className="sidebar-user">

                <div className="sidebar-user-avatar">

                  {auth.currentUser?.photoURL ? (

                    <img
                      src={
                        auth.currentUser.photoURL
                      }

                      alt="Profile"
                    />

                  ) : (

                    <FiUser />

                  )}

                </div>


                <div className="sidebar-user-info">

                  <strong>

                    {
                      auth.currentUser?.displayName ||
                      auth.currentUser?.email ||
                      "Truvora User"
                    }

                  </strong>

                  <span>
                    Free account
                  </span>

                </div>

              </div>


              <button
                className="sidebar-logout"

                onClick={
                  handleLogout
                }
              >

                Sign out

              </button>

            </div>

          </aside>


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

        </>

      );

    };


  /* =====================================================
     TOP BAR
===================================================== */

  const renderTopbar =
    () => {

      return (

        <header className="truvora-topbar">

          <div className="topbar-left">

            <button
              className="mobile-menu-button"

              onClick={
                toggleSidebar
              }

              aria-label="Open sidebar"
            >

              <FiMenu />

            </button>


            <div className="mobile-brand">

              <strong>
                TRUVORA
              </strong>

              <span>
                GLOBAL AI
              </span>

            </div>

          </div>


          <div className="topbar-right">

            <span className="topbar-slogan">

              Intelligence • Innovation • Trust

            </span>


            <div className="topbar-avatar">

              {auth.currentUser?.photoURL ? (

                <img
                  src={
                    auth.currentUser.photoURL
                  }

                  alt="Profile"
                />

              ) : (

                <FiUser />

              )}

            </div>

          </div>

        </header>

      );

    };


  /* =====================================================
     COMPOSER
===================================================== */

  const renderComposer =
    () => {

      const selectedLanguageLabel =
        selectedLanguageOption?.label ||
        "English";


      return (

        <div className="truvora-composer-area">

          <div className="truvora-composer">


            {/* =========================================
               TOOLBAR
            ========================================= */}

            <div className="composer-toolbar">


              <div className="composer-toolbar-left">


                {/* FILE */}

                <label
                  className="composer-icon-button"
                  title="Upload document"
                >

                  <FiUpload />

                  <input
                    ref={
                      fileInputRef
                    }

                    type="file"

                    accept="
                      .pdf,
                      .doc,
                      .docx,
                      .txt,
                      .md,
                      .rtf,
                      .csv,
                      .xlsx,
                      .xls,
                      .pptx,
                      .ppt
                    "

                    onChange={
                      handleDocumentUpload
                    }
                  />

                </label>


                {/* IMAGE */}

                <label
                  className="composer-icon-button"
                  title="Upload image"
                >

                  🖼️

                  <input
                    ref={
                      imageInputRef
                    }

                    type="file"

                    accept="
                      image/*
                    "

                    onChange={
                      handleImageUpload
                    }
                  />

                </label>


                {/* AUDIO */}

                <label
                  className="composer-icon-button"
                  title="Upload audio"
                >

                  🎙️

                  <input
                    ref={
                      audioInputRef
                    }

                    type="file"

                    accept="
                      audio/*
                    "

                    onChange={
                      handleAudioUpload
                    }
                  />

                </label>


                {/* VIDEO */}

                <label
                  className="composer-icon-button"
                  title="Upload video"
                >

                  🎥

                  <input
                    ref={
                      videoInputRef
                    }

                    type="file"

                    accept="
                      video/*
                    "

                    onChange={
                      handleVideoUpload
                    }
                  />

                </label>


                {/* VOICE INPUT */}

                <button
                  className={
                    `composer-icon-button ${
                      listening
                        ? "mode-active"
                        : ""
                    }`
                  }

                  title={
                    listening
                      ? "Stop voice input"
                      : "Voice input"
                  }

                  onClick={() => {

                    if (
                      listening
                    ) {

                      stopVoiceInput();

                    } else {

                      startVoiceInput();

                    }

                  }}
                >

                  <FiMic />

                </button>


                {/* ANALYZE */}

                <button
                  className={
                    `composer-mode-button ${
                      showAnalyzeMenu
                        ? "mode-active"
                        : ""
                    }`
                  }

                  onClick={
                    openAnalyzer
                  }

                  title="Analyze anything"
                >

                  🔍

                  <span>
                    Analyze
                  </span>

                </button>


                {/* WEB */}

                <button
                  className={
                    `composer-mode-button ${
                      webEnabled
                        ? "mode-active"
                        : ""
                    }`
                  }

                  onClick={() =>
                    setWebEnabled(
                      (previous) =>
                        !previous
                    )
                  }

                  title="Web search"
                >

                  🌐

                  <span>
                    Web
                  </span>

                </button>


                {/* AGENT */}

                <button
                  className={
                    `composer-mode-button ${
                      agentMode
                        ? "mode-active"
                        : ""
                    }`
                  }

                  onClick={() =>
                    setAgentMode(
                      (previous) =>
                        !previous
                    )
                  }

                  title="Agent mode"
                >

                  🤖

                  <span>
                    Agent
                  </span>

                </button>


              </div>


              <div className="composer-toolbar-right">


                {/* LANGUAGE */}

                <div className="language-selector">

                  <Select

                    value={
                      selectedLanguageOption
                    }

                    onChange={
                      handleLanguageChange
                    }

                    options={
                      languageOptions
                    }

                    isSearchable

                    placeholder="Language"

                    styles={
                      languageSelectStyles
                    }

                    classNamePrefix="truvora-select"

                    aria-label={
                      `Language: ${selectedLanguageLabel}`
                    }

                  />

                </div>


                {/* VOICE */}

                <select
                  className="voice-selector"

                  value={
                    selectedVoice
                  }

                  onChange={
                    handleVoiceChange
                  }

                  aria-label="Voice"
                >

                  {voiceOptions.map(
                    (voice) => (

                      <option
                        key={
                          voice.id
                        }

                        value={
                          voice.id
                        }
                      >

                        {voice.name}

                      </option>

                    )
                  )}

                </select>


              </div>

            </div>


            {/* =========================================
               ATTACHMENT STATUS
            ========================================= */}

            {(uploadedFile ||
              imagePreview ||
              audioFile ||
              videoFile ||
              documentContext ||
              audioAnalysis ||
              videoAnalysis) && (

              <div className="composer-attachment-status">


                {uploadedFile && (

                  <span>

                    📄

                    {uploadedFile.name}

                    <button
                      onClick={
                        clearAttachments
                      }

                      title="Remove"
                    >

                      ×

                    </button>

                  </span>

                )}


                {imagePreview && (

                  <span>

                    🖼️ Image ready

                    <button
                      onClick={
                        clearAttachments
                      }

                      title="Remove"
                    >

                      ×

                    </button>

                  </span>

                )}


                {audioFile && (

                  <span>

                    🎙️

                    {audioFile.name}

                    <button
                      onClick={
                        clearAttachments
                      }

                      title="Remove"
                    >

                      ×

                    </button>

                  </span>

                )}


                {videoFile && (

                  <span>

                    🎥

                    {videoFile.name}

                    <button
                      onClick={
                        clearAttachments
                      }

                      title="Remove"
                    >

                      ×

                    </button>

                  </span>

                )}


              </div>

            )}


            {/* =========================================
               INPUT
            ========================================= */}

            <div className="composer-input-container">


              <textarea
                ref={
                  inputRef
                }

                className="truvora-input"

                value={
                  input
                }

                onChange={
                  handleInputChange
                }

                onKeyDown={
                  handleInputKeyDown
                }

                placeholder={
                  listening
                    ? "Listening..."
                    : webEnabled
                    ? "Ask Truvora to search the web..."
                    : agentMode
                    ? "Tell Truvora what you want done..."
                    : "Ask Truvora anything..."
                }

                rows={
                  2
                }

              />


              <button
                className={
                  `composer-send-button ${
                    loading
                      ? "stop-button"
                      : ""
                  }`
                }

                onClick={
                  loading
                    ? handleStopGeneration
                    : handleSend
                }

                disabled={
                  !loading &&
                  !input.trim() &&
                  !documentContext &&
                  !imagePreview &&
                  !audioAnalysis &&
                  !videoAnalysis
                }

                title={
                  loading
                    ? "Stop"
                    : "Send"
                }
              >

                {loading ? (

                  <FiSquare />

                ) : (

                  <FiSend />

                )}

              </button>

            </div>


            {/* =========================================
               ATTACHMENT ANALYSIS PREVIEW
            ========================================= */}

            {documentContext && (

              <div className="composer-analysis-preview">

                <strong>
                  Document ready
                </strong>

                <span>
                  Truvora can use the uploaded
                  document as context.
                </span>

              </div>

            )}


            {audioAnalysis && (

              <div className="composer-analysis-preview">

                <strong>
                  Audio analyzed
                </strong>

                <span>
                  Audio analysis is ready.
                </span>

              </div>

            )}


            {videoAnalysis && (

              <div className="composer-analysis-preview">

                <strong>
                  Video analyzed
                </strong>

                <span>
                  Video analysis is ready.
                </span>

              </div>

            )}


            <div className="composer-disclaimer">

              Truvora may make mistakes.
              Verify important information.

            </div>


            {/* ANALYZE MENU */}

            {renderAnalyzeMenu()}


          </div>

        </div>

      );

    };


  /* =====================================================
     PART 5 ENDS
===================================================== */

/* =====================================================
   MAIN APPLICATION UI
===================================================== */

  return (

    <div className="truvora-app">


      {/* ===============================================
         SIDEBAR
      =============================================== */}

      {renderSidebar()}


      {/* ===============================================
         MAIN
      =============================================== */}

      <main className="truvora-main">


        {/* =============================================
           TOP BAR
        ============================================= */}

        {renderTopbar()}


        {/* =============================================
           CHAT AREA
        ============================================= */}

        <section className="truvora-chat-area">


          {/* ===========================================
             EMPTY STATE
          =========================================== */}

          {messages.length === 0 ? (

            <div className="truvora-empty-state">


              <div className="empty-logo">

                <div className="empty-logo-symbol">

                  T

                </div>

              </div>


              <h1>

                How can Truvora help you?

              </h1>


              <p>

                Ask questions, analyze documents,
                images, audio and video, research
                the web, or create professional files.

              </p>


              <div className="empty-suggestions">


                <button
                  onClick={() =>
                    setInput(
                      "Explain artificial intelligence in simple terms."
                    )
                  }
                >

                  Explain AI

                </button>


                <button
                  onClick={() =>
                    setInput(
                      "Analyze this image in detail."
                    )
                  }
                >

                  Analyze an image

                </button>


                <button
                  onClick={() =>
                    setInput(
                      "Research the latest developments in artificial intelligence."
                    )
                  }
                >

                  Research latest AI

                </button>


                <button
                  onClick={() =>
                    setInput(
                      "Create a professional business plan."
                    )
                  }
                >

                  Create a business plan

                </button>


              </div>


            </div>


          ) : (


            /* =========================================
               MESSAGES
            ========================================= */

            <div className="message-list">

              {messages.map(
                (
                  message,
                  index
                ) =>
                  renderMessage(
                    message,
                    index
                  )
              )}


              {/* =======================================
                 THINKING INDICATOR
              ======================================= */}

              {loading && (

                <div className="truvora-thinking">

                  <div className="message-avatar">

                    T

                  </div>


                  <div className="thinking-content">

                    <span>

                      Truvora is thinking

                    </span>


                    <span className="thinking-dots">

                      <i />
                      <i />
                      <i />

                    </span>

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


        {/* =============================================
           COMPOSER
        ============================================= */}

        {renderComposer()}


      </main>


      {/* ===============================================
         CAMERA
      =============================================== */}

      {renderCamera()}


      {/* ===============================================
         PERSONAL VOICE
      =============================================== */}

      {renderPersonalVoice()}


      {/* ===============================================
         ACTIVE CITATION PREVIEW
      =============================================== */}

      {citationPreviewOpen &&
        activeCitation && (

          <div
            className="citation-preview-overlay"

            onClick={() => {

              setCitationPreviewOpen(
                false
              );

              setActiveCitation(
                null
              );

            }}
          >

            <div
              className="citation-preview"

              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="citation-preview-header">

                <strong>

                  Source

                </strong>


                <button
                  onClick={() => {

                    setCitationPreviewOpen(
                      false
                    );

                    setActiveCitation(
                      null
                    );

                  }}
                >

                  ×

                </button>

              </div>


              <div className="citation-preview-body">

                <strong>

                  {
                    activeCitation.title ||
                    activeCitation.name ||
                    "Source"
                  }

                </strong>


                <p>

                  {
                    activeCitation.domain ||
                    activeCitation.sourceUrl ||
                    ""
                  }

                </p>


                {activeCitation.sourceUrl &&
                  activeCitation.sourceUrl !== "#" && (

                    <a
                      href={
                        activeCitation.sourceUrl
                      }

                      target="_blank"

                      rel="noopener noreferrer"
                    >

                      Open source ↗

                    </a>

                  )}

              </div>

            </div>

          </div>

        )}


      {/* ===============================================
         GENERATING FILE INDICATOR
      =============================================== */}

      {generatingFile && (

        <div className="truvora-generation-overlay">

          <div className="truvora-generation-card">

            <div className="generation-spinner" />

            <strong>

              Creating your file...

            </strong>

            <span>

              Truvora is preparing a professional
              document for you.

            </span>

          </div>

        </div>

      )}


    </div>

  );


}


/* =====================================================
   EXPORT
===================================================== */

export default App;
