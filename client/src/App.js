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
import { useDropzone } from "react-dropzone";

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


/* TRUVORA BACKEND */

const API_BASE = (
  process.env.REACT_APP_API_BASE_URL ||
  "https://truvora-backend.onrender.com"
).replace(/\/$/, "");

const apiUrl = (path) =>
  `${API_BASE}${path}`;


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

      citationNumber:
        index + 1,

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
        decodeURIComponent(
          youtubeUrl
        );


      handleYouTube(url);

    }

  }, []);


  /* =====================================================
     AUTH
  ===================================================== */

  const [user, setUser] =
    useState(auth.currentUser);


  const [authLoading, setAuthLoading] =
    useState(true);


  const [authMode, setAuthMode] =
    useState("login");


  const [email, setEmail] =
    useState("");


  const [password, setPassword] =
    useState("");


  const [authError, setAuthError] =
    useState("");


  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          setUser(currentUser);

          setAuthLoading(false);

        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* =====================================================
     SIDEBAR
  ===================================================== */

  const [sidebarOpen, setSidebarOpen] =
    useState(false);


  const toggleSidebar = () => {

    setSidebarOpen(
      (previous) =>
        !previous
    );

  };


  /* =====================================================
     CHAT
  ===================================================== */

  const [messages, setMessages] =
    useState([]);


  const [input, setInput] =
    useState("");


  const [loading, setLoading] =
    useState(false);


  const [searchChats, setSearchChats] =
    useState("");


  const [chats, setChats] =
    useState([]);


  const [streaming, setStreaming] =
    useState(false);


  const [abortController, setAbortController] =
    useState(null);


  const messagesEndRef =
    useRef(null);


  const inputRef =
    useRef(null);


  /* =====================================================
     WEB + AGENT
  ===================================================== */

  const [webEnabled, setWebEnabled] =
    useState(false);


  const [agentMode, setAgentMode] =
    useState(false);


  const [automaticWeb, setAutomaticWeb] =
    useState(true);


  const [automaticAgent, setAutomaticAgent] =
    useState(true);


  /* =====================================================
     LANGUAGE
  ===================================================== */

  const [selectedLanguage, setSelectedLanguage] =
    useState("auto");


  /* =====================================================
     VOICE
  ===================================================== */

  const [selectedVoice, setSelectedVoice] =
    useState("alloy");


  const [speaking, setSpeaking] =
    useState(false);


  /* =====================================================
     FILES
  ===================================================== */

  const [uploadedFile, setUploadedFile] =
    useState(null);


  const [documentContext, setDocumentContext] =
    useState("");


  const [imagePreview, setImagePreview] =
    useState(null);


  const [audioFile, setAudioFile] =
    useState(null);


  const [videoFile, setVideoFile] =
    useState(null);


  const [audioAnalysis, setAudioAnalysis] =
    useState("");


  const [videoAnalysis, setVideoAnalysis] =
    useState("");


  const fileInputRef =
    useRef(null);


  const imageInputRef =
    useRef(null);


  const audioInputRef =
    useRef(null);


  const videoInputRef =
    useRef(null);


  /* =====================================================
     ANALYZE
  ===================================================== */

  const [showAnalyzeMenu, setShowAnalyzeMenu] =
    useState(false);


  /* =====================================================
     CAMERA
  ===================================================== */

  const [showCamera, setShowCamera] =
    useState(false);


  const videoRef =
    useRef(null);


  const cameraStreamRef =
    useRef(null);


  /* =====================================================
     PERSONAL VOICE
  ===================================================== */

  const [showPersonalVoice, setShowPersonalVoice] =
    useState(false);


  /* =====================================================
     FILE GENERATION
  ===================================================== */

  const [generatingFile, setGeneratingFile] =
    useState(false);


  /* =====================================================
     SPEECH RECOGNITION
  ===================================================== */

  const {
    listening,
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } =
    useSpeechRecognition();


  /* =====================================================
     DROPZONE
  ===================================================== */

  const onDrop = async (acceptedFiles) => {

    if (!acceptedFiles?.length) {
      return;
    }


    const file =
      acceptedFiles[0];


    setUploadedFile(file);


    if (
      file.type.startsWith("image/")
    ) {

      await handleImageUpload({
        target: {
          files: [file],
        },
      });

      return;

    }


    await handleDocumentUpload({
      target: {
        files: [file],
      },
    });

  };


  const {
  getRootProps,
  getInputProps,
  isDragActive,
} = useDropzone({
  onDrop,
  multiple: false,
  noClick: true,
});


  /* =====================================================
     LANGUAGE GROUP NORMALIZATION
  ===================================================== */

  const languageOptions = (() => {

    try {

      if (
        Array.isArray(
          languageGroups
        )
      ) {

        return languageGroups.flatMap(
          (group) => {

            const options =
              Array.isArray(
                group?.options
              )
                ? group.options
                : [];


            return options.map(
              (language) => ({

                value:
                  language?.value ||
                  language?.code ||
                  language?.id ||
                  "",

                label:
                  language?.label ||
                  language?.name ||
                  language?.code ||
                  language?.value ||
                  "Language",

                group:
                  group?.label ||
                  group?.name ||
                  "Languages",

              })
            );

          }
        );

      }


      if (
        languageGroups &&
        typeof languageGroups ===
          "object"
      ) {

        return Object.entries(
          languageGroups
        ).flatMap(
          ([group, languages]) => {

            if (
              !Array.isArray(
                languages
              )
            ) {

              return [];

            }


            return languages.map(
              (language) => ({

                value:
                  language?.value ||
                  language?.code ||
                  language?.id ||
                  "",

                label:
                  language?.label ||
                  language?.name ||
                  language?.code ||
                  language?.value ||
                  "Language",

                group,

              })
            );

          }
        );

      }


      return [];

    } catch (error) {

      console.error(
        "Truvora language options error:",
        error
      );


      return [];

    }

  })();


  const selectedLanguageOption =
    languageOptions.find(
      (option) =>
        option.value ===
        selectedLanguage
    ) ||
    languageOptions[0] ||
    null;


  /* =====================================================
     LANGUAGE DETECTION
  ===================================================== */

  const detectLanguage = (
    text = ""
  ) => {

    if (!text.trim()) {
      return "auto";
    }


    if (
      /[\u0C00-\u0C7F]/.test(
        text
      )
    ) {

      return "te";

    }


    if (
      /[\u0C80-\u0CFF]/.test(
        text
      )
    ) {

      return "kn";

    }


    if (
      /[\u0900-\u097F]/.test(
        text
      )
    ) {

      return "hi";

    }


    if (
      /[\u0B80-\u0BFF]/.test(
        text
      )
    ) {

      return "ta";

    }


    if (
      /[\u0D00-\u0D7F]/.test(
        text
      )
    ) {

      return "ml";

    }


    if (
      /[\u0980-\u09FF]/.test(
        text
      )
    ) {

      return "bn";

    }


    if (
      /[\u0A80-\u0AFF]/.test(
        text
      )
    ) {

      return "gu";

    }


    if (
      /[\u0A00-\u0A7F]/.test(
        text
      )
    ) {

      return "pa";

    }


    if (
      /[\u0600-\u06FF]/.test(
        text
      )
    ) {

      return "ur";

    }


    return "en";

  };


  const handleLanguageChange =
    (option) => {

      setSelectedLanguage(
        option?.value ||
        "auto"
      );

    };


  /* =====================================================
     VOICES
  ===================================================== */

  const voiceOptions = [

    {
      id: "alloy",
      name: "Alloy",
    },

    {
      id: "nova",
      name: "Nova",
    },

    {
      id: "shimmer",
      name: "Shimmer",
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
      id: "onyx",
      name: "Onyx",
    },

  ];


  const handleVoiceChange =
    (event) => {

      setSelectedVoice(
        event.target.value
      );

    };


  /* =====================================================
     MESSAGE SCROLL
  ===================================================== */

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages, loading]);


  /* =====================================================
     LOAD USER CHATS
  ===================================================== */

  useEffect(() => {

    if (!user) {

      setChats([]);

      return;

    }


    const loadChats =
      async () => {

        try {

          const result =
            await loadUserChats(
              user.uid
            );


          if (
            Array.isArray(result)
          ) {

            setChats(result);

          }

        } catch (error) {

          console.error(
            "Failed to load chats:",
            error
          );

        }

      };


    loadChats();

  }, [user]);


  /* =====================================================
     FILTER CHATS
  ===================================================== */

  const filteredChats =
    chats.filter(
      (chat) => {

        if (
          !searchChats.trim()
        ) {

          return true;

        }


        const text =
          JSON.stringify(
            chat
          ).toLowerCase();


        return text.includes(
          searchChats
            .toLowerCase()
        );

      }
    );


  /* =====================================================
     PART 1 END
  ===================================================== */

  /* =====================================================
     AUTHENTICATION
  ===================================================== */

  const handleGoogleLogin =
    async () => {

      try {

        setAuthError("");

        await signInWithPopup(
          auth,
          googleProvider
        );

      } catch (error) {

        console.error(
          "Google login failed:",
          error
        );

        setAuthError(
          error?.message ||
          "Google sign-in failed."
        );

      }

    };


  const handleEmailAuth =
    async (event) => {

      event.preventDefault();

      setAuthError("");


      if (!email.trim()) {

        setAuthError(
          "Please enter your email."
        );

        return;

      }


      if (
        !password ||
        password.length < 6
      ) {

        setAuthError(
          "Password must contain at least 6 characters."
        );

        return;

      }


      try {

        if (
          authMode === "signup"
        ) {

          await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password
          );

        } else {

          await signInWithEmailAndPassword(
            auth,
            email.trim(),
            password
          );

        }

      } catch (error) {

        console.error(
          "Authentication failed:",
          error
        );


        setAuthError(
          error?.message ||
          "Authentication failed."
        );

      }

    };


  const handleLogout =
    async () => {

      try {

        await signOut(auth);

        setMessages([]);

        setChats([]);

        setSidebarOpen(
          false
        );

      } catch (error) {

        console.error(
          "Logout failed:",
          error
        );

      }

    };


  /* =====================================================
     NEW CHAT
  ===================================================== */

  const handleNewChat =
    () => {

      setMessages([]);

      setInput("");

      setUploadedFile(null);

      setDocumentContext("");

      setImagePreview(null);

      setAudioFile(null);

      setVideoFile(null);

      setAudioAnalysis("");

      setVideoAnalysis("");

      setSidebarOpen(
        false
      );

      setShowAnalyzeMenu(
        false
      );

      inputRef.current?.focus();

    };


  /* =====================================================
     OPEN SAVED CHAT
  ===================================================== */

  const openChat =
    (chat) => {

      try {

        const chatMessages =
          Array.isArray(chat)
            ? chat
            : Array.isArray(
                chat?.messages
              )
            ? chat.messages
            : [];


        setMessages(
          chatMessages
        );


        setSidebarOpen(
          false
        );

        setTimeout(() => {

          inputRef.current?.focus();

        }, 100);

      } catch (error) {

        console.error(
          "Unable to open chat:",
          error
        );

      }

    };


  /* =====================================================
     INPUT
  ===================================================== */

  const handleInputChange =
    (event) => {

      setInput(
        event.target.value
      );

    };


  const handleInputKeyDown =
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        handleSend();

      }

    };


  /* =====================================================
     STOP GENERATION
  ===================================================== */

  const handleStopGeneration =
    () => {

      try {

        abortController?.abort();

      } catch (error) {

        console.error(
          "Abort error:",
          error
        );

      }


      setLoading(false);

      setStreaming(false);

      setAbortController(
        null
      );

    };


  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  const handleSend =
    async () => {

      if (
        loading
      ) {

        return;

      }


      const text =
        input.trim();


      const hasAttachment =
        Boolean(
          documentContext ||
          imagePreview ||
          audioAnalysis ||
          videoAnalysis ||
          uploadedFile
        );


      if (
        !text &&
        !hasAttachment
      ) {

        return;

      }


      const detectedLanguage =
        selectedLanguage === "auto"
          ? detectLanguage(text)
          : selectedLanguage;


      const userMessage = {

        role:
          "user",

        text:
          text ||
          "Please analyze the uploaded file.",

        language:
          detectedLanguage,

        timestamp:
          Date.now(),

      };


      const nextMessages =
        [
          ...messages,
          userMessage,
        ];


      setMessages(
        nextMessages
      );

      setInput("");

      setLoading(true);

      setStreaming(true);


      const controller =
        new AbortController();


      setAbortController(
        controller
      );


      try {

        /*
         * Web and Agent are sent to the backend.
         *
         * Automatic mode is enabled by default,
         * so the server can decide whether a web
         * search or agent task is actually required.
         */

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

              signal:
                controller.signal,

              body:
                JSON.stringify({

                  message:
                    text,

                  history:
                    nextMessages
                      .slice(-10)
                      .map(
                        (message) => ({

                          role:
                            message.role,

                          content:
                            message.text ||
                            message.content ||
                            "",

                        })
                      ),

                  web:
                    webEnabled,

                  agentMode:
                    agentMode,

                  automaticWeb:
                    automaticWeb,

                  automaticAgent:
                    automaticAgent,

                  imageUrl:
                    imagePreview || null,

                  imageUrls:
                    imagePreview
                      ? [
                          imagePreview,
                        ]
                      : [],

                  language:
                    detectedLanguage,

                  documentContext:
                    documentContext ||
                    "",

                  audioAnalysis:
                    audioAnalysis ||
                    "",

                  videoAnalysis:
                    videoAnalysis ||
                    "",

                }),

            }
          );


        if (
          !response.ok
        ) {

          const errorText =
            await response.text();

          throw new Error(
            errorText ||
            `Request failed with status ${response.status}`
          );

        }


        const data =
          await response.json();


        const answer =
          data.answer ||
          data.response ||
          data.message ||
          data.analysis ||
          data.text ||
          "I couldn't generate an answer.";


        const sources =
          citationRefs(
            data.sources ||
            data.webResults ||
            data.citations ||
            []
          );


        const assistantMessage = {

          role:
            "assistant",

          text:
            answer,

          content:
            answer,

          sources,

          webResults:
            data.webResults ||
            [],

          citations:
            data.citations ||
            [],

          imageUrl:
            data.imageUrl ||
            null,

          document:
            data.document ||
            null,

          documentUrl:
            data.documentUrl ||
            null,

          type:
            data.type ||
            null,

          timestamp:
            Date.now(),

        };


        setMessages(
          (previous) => [
            ...previous,
            assistantMessage,
          ]
        );


        /*
         * Keep the automatic mode information
         * available for the UI without forcing
         * the user to press Web or Agent manually.
         */

        if (
          data.webUsed === true
        ) {

          setAutomaticWeb(
            true
          );

        }


        if (
          data.agentUsed === true
        ) {

          setAutomaticAgent(
            true
          );

        }


        /*
         * Save the conversation locally.
         */

        const finalMessages = [
          ...nextMessages,
          assistantMessage,
        ];


        saveChat(
          finalMessages
        );


        /*
         * Save to Firebase when authenticated.
         */

        if (user) {

          try {

            await saveChatToCloud(
              user.uid,
              finalMessages
            );

          } catch (firebaseError) {

            console.error(
              "Firebase chat save failed:",
              firebaseError
            );

          }

        }

      } catch (error) {

        if (
          error?.name ===
          "AbortError"
        ) {

          return;

        }


        console.error(
          "Truvora request failed:",
          error
        );


        const errorMessage = {

          role:
            "assistant",

          text:
            `I couldn't complete that request. ${
              error?.message ||
              "Please try again."
            }`,

          content:
            `I couldn't complete that request. ${
              error?.message ||
              "Please try again."
            }`,

          error:
            true,

          timestamp:
            Date.now(),

        };


        setMessages(
          (previous) => [
            ...previous,
            errorMessage,
          ]
        );

      } finally {

        setLoading(false);

        setStreaming(false);

        setAbortController(
          null
        );

      }

    };


  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  const handleImageUpload =
    async (event) => {

      const file =
        event?.target?.files?.[0];


      if (!file) {

        return;

      }


      try {

        setUploadedFile(
          file
        );


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


        if (
          !response.ok
        ) {

          throw new Error(
            `Image upload failed: ${response.status}`
          );

        }


        const data =
          await response.json();


        const imageUrl =
          data.imageUrl ||
          data.url;


        if (!imageUrl) {

          throw new Error(
            "Server did not return an image URL."
          );

        }


        setImagePreview(
          imageUrl
        );


        setDocumentContext(
          ""
        );


        setAudioAnalysis(
          ""
        );


        setVideoAnalysis(
          ""
        );

      } catch (error) {

        console.error(
          "Image upload failed:",
          error
        );


        setImagePreview(
          null
        );

      }

    };


  /* =====================================================
     DOCUMENT UPLOAD
  ===================================================== */

  const handleDocumentUpload =
    async (event) => {

      const file =
        event?.target?.files?.[0];


      if (!file) {

        return;

      }


      try {

        setUploadedFile(
          file
        );


        const formData =
          new FormData();


        formData.append(
          "document",
          file
        );


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


        if (
          !response.ok
        ) {

          throw new Error(
            `Document analysis failed: ${response.status}`
          );

        }


        const data =
          await response.json();


        const context =
          data.text ||
          data.content ||
          data.documentContext ||
          data.analysis ||
          "";


        setDocumentContext(
          context
        );


        setImagePreview(
          null
        );


        setAudioAnalysis(
          ""
        );


        setVideoAnalysis(
          ""
        );

      } catch (error) {

        console.error(
          "Document upload failed:",
          error
        );

      }

    };


  /* =====================================================
     AUDIO UPLOAD
  ===================================================== */

  const handleAudioUpload =
    async (event) => {

      const file =
        event?.target?.files?.[0];


      if (!file) {

        return;

      }


      try {

        setAudioFile(
          file
        );


        const formData =
          new FormData();


        formData.append(
          "audio",
          file
        );


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


        if (
          !response.ok
        ) {

          throw new Error(
            `Audio upload failed: ${response.status}`
          );

        }


        const data =
          await response.json();


        const analysis =
          data.analysis ||
          data.summary ||
          data.transcript ||
          "";


        setAudioAnalysis(
          analysis
        );


        setVideoAnalysis(
          ""
        );


        setDocumentContext(
          ""
        );


        setImagePreview(
          null
        );

      } catch (error) {

        console.error(
          "Audio upload failed:",
          error
        );

      }

    };


  /* =====================================================
     VIDEO UPLOAD
  ===================================================== */

  const handleVideoUpload =
    async (event) => {

      const file =
        event?.target?.files?.[0];


      if (!file) {

        return;

      }


      try {

        setVideoFile(
          file
        );


        const formData =
          new FormData();


        formData.append(
          "video",
          file
        );


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


        if (
          !response.ok
        ) {

          throw new Error(
            `Video upload failed: ${response.status}`
          );

        }


        const data =
          await response.json();


        const analysis =
          data.summary ||
          data.analysis ||
          data.transcript ||
          "";


        setVideoAnalysis(
          analysis
        );


        setAudioAnalysis(
          ""
        );


        setDocumentContext(
          ""
        );


        setImagePreview(
          null
        );

      } catch (error) {

        console.error(
          "Video upload failed:",
          error
        );

      }

    };


  /* =====================================================
     CLEAR ATTACHMENTS
  ===================================================== */

  const clearAttachments =
    () => {

      setUploadedFile(
        null
      );

      setDocumentContext(
        ""
      );

      setImagePreview(
        null
      );

      setAudioFile(
        null
      );

      setVideoFile(
        null
      );

      setAudioAnalysis(
        ""
      );

      setVideoAnalysis(
        "" 
      );


      if (
        fileInputRef.current
      ) {

        fileInputRef.current.value =
          "";

      }


      if (
        imageInputRef.current
      ) {

        imageInputRef.current.value =
          "";

      }


      if (
        audioInputRef.current
      ) {

        audioInputRef.current.value =
          "";

      }


      if (
        videoInputRef.current
      ) {

        videoInputRef.current.value =
          "";

      }

    };


  /* =====================================================
     PART 2 END
  ===================================================== */

/* =====================================================
   CAMERA
===================================================== */

  const startCamera =
    async () => {

      try {

        setShowCamera(
          true
        );


        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });


        cameraStreamRef.current =
          stream;


        if (
          videoRef.current
        ) {

          videoRef.current.srcObject =
            stream;

        }

      } catch (error) {

        console.error(
          "Camera access failed:",
          error
        );


        setShowCamera(
          false
        );

      }

    };


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


      setShowCamera(
        false
      );

    };


  const captureCameraImage =
    async () => {

      try {

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


        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );


        const blob =
          await new Promise(
            (resolve) =>
              canvas.toBlob(
                resolve,
                "image/jpeg",
                0.92
              )
          );


        if (!blob) {

          throw new Error(
            "Unable to capture camera image."
          );

        }


        const file =
          new File(
            [blob],
            `truvora-camera-${Date.now()}.jpg`,
            {
              type:
                "image/jpeg",
            }
          );


        await handleImageUpload({
          target: {
            files: [file],
          },
        });


        stopCamera();

      } catch (error) {

        console.error(
          "Camera capture failed:",
          error
        );

      }

    };


  /* =====================================================
     YOUTUBE
  ===================================================== */

  const handleYouTube =
    async (url) => {

      if (!url) {

        return;

      }


      setLoading(
        true
      );


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
                  url,
                  language:
                    selectedLanguage,
                }),

            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            `YouTube analysis failed: ${response.status}`
          );

        }


        const data =
          await response.json();


        const answer =
          data.analysis ||
          data.summary ||
          data.transcript ||
          "YouTube analysis completed.";


        setMessages(
          (previous) => [
            ...previous,

            {
              role:
                "user",

              text:
                `Analyze this YouTube video:\n${url}`,

              timestamp:
                Date.now(),

            },

            {
              role:
                "assistant",

              text:
                answer,

              content:
                answer,

              sources:
                citationRefs(
                  data.sources ||
                  data.webResults ||
                  []
                ),

              videoUrl:
                data.videoUrl ||
                url,

              timestamp:
                Date.now(),

            },

          ]
        );

      } catch (error) {

        console.error(
          "YouTube analysis failed:",
          error
        );


        setMessages(
          (previous) => [
            ...previous,

            {
              role:
                "assistant",

              text:
                `YouTube analysis failed: ${
                  error?.message ||
                  "Please try again."
                }`,

              error:
                true,

              timestamp:
                Date.now(),

            },

          ]
        );

      } finally {

        setLoading(
          false
        );

      }

    };


  /* =====================================================
     WEBSITE ANALYSIS
  ===================================================== */

  const handleWebsiteAnalysis =
    async (url) => {

      const website =
        url?.trim();


      if (!website) {

        return;

      }


      setLoading(
        true
      );


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
                    website,

                  language:
                    selectedLanguage,
                }),

            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            `Website analysis failed: ${response.status}`
          );

        }


        const data =
          await response.json();


        const answer =
          data.analysis ||
          data.summary ||
          data.text ||
          "Website analysis completed.";


        setMessages(
          (previous) => [
            ...previous,

            {
              role:
                "user",

              text:
                `Analyze this website:\n${website}`,

              timestamp:
                Date.now(),

            },

            {
              role:
                "assistant",

              text:
                answer,

              content:
                answer,

              sources:
                citationRefs(
                  data.sources ||
                  data.webResults ||
                  []
                ),

              timestamp:
                Date.now(),

            },

          ]
        );

      } catch (error) {

        console.error(
          "Website analysis failed:",
          error
        );


        setMessages(
          (previous) => [
            ...previous,

            {
              role:
                "assistant",

              text:
                `Website analysis failed: ${
                  error?.message ||
                  "Please try again."
                }`,

              error:
                true,

              timestamp:
                Date.now(),

            },

          ]
        );

      } finally {

        setLoading(
          false
        );

      }

    };


  /* =====================================================
     READ ALOUD
  ===================================================== */

  const stopSpeaking =
    () => {

      try {

        window.speechSynthesis.cancel();

      } catch (error) {

        console.error(
          "Speech stop failed:",
          error
        );

      }


      setSpeaking(
        false
      );

    };


  const speakText =
    (text) => {

      if (
        !text
      ) {

        return;

      }


      if (
        !window.speechSynthesis
      ) {

        return;

      }


      stopSpeaking();


      const languageMap = {

        auto:
          "en-US",

        en:
          "en-US",

        hi:
          "hi-IN",

        kn:
          "kn-IN",

        te:
          "te-IN",

        ta:
          "ta-IN",

        ml:
          "ml-IN",

        mr:
          "mr-IN",

        gu:
          "gu-IN",

        bn:
          "bn-IN",

        pa:
          "pa-IN",

        ur:
          "ur-PK",

        ar:
          "ar-SA",

        zh:
          "zh-CN",

        ja:
          "ja-JP",

        ko:
          "ko-KR",

        fr:
          "fr-FR",

        de:
          "de-DE",

        es:
          "es-ES",

        it:
          "it-IT",

        pt:
          "pt-PT",

        ru:
          "ru-RU",

      };


      const language =
        languageMap[
          selectedLanguage
        ] ||
        "en-US";


      /*
       * Split long responses into manageable
       * chunks so mobile browsers don't silently
       * stop speech.
       */

      const cleanText =
        String(text)
          .replace(
            /```[\s\S]*?```/g,
            ""
          )
          .replace(
            /\[[0-9]+\]/g,
            ""
          )
          .trim();


      const chunks = [];


      for (
        let index = 0;
        index < cleanText.length;
        index += 180
      ) {

        chunks.push(
          cleanText.substring(
            index,
            index + 180
          )
        );

      }


      if (
        !chunks.length
      ) {

        return;

      }


      setSpeaking(
        true
      );


      let current =
        0;


      const speakNext =
        () => {

          if (
            current >=
            chunks.length
          ) {

            setSpeaking(
              false
            );

            return;

          }


          const utterance =
            new SpeechSynthesisUtterance(
              chunks[current]
            );


          utterance.lang =
            language;


          utterance.rate =
            0.95;


          utterance.pitch =
            1;


          utterance.onend =
            () => {

              current += 1;

              speakNext();

            };


          utterance.onerror =
            () => {

              setSpeaking(
                false
              );

            };


          window.speechSynthesis
            .speak(
              utterance
            );

        };


      speakNext();

    };


  /* =====================================================
     COPY
  ===================================================== */

  const copyAnswer =
    async (text) => {

      try {

        await navigator.clipboard.writeText(
          text || ""
        );

      } catch (error) {

        console.error(
          "Copy failed:",
          error
        );

      }

    };


  /* =====================================================
     SHARE
  ===================================================== */

  const shareAnswer =
    async (text) => {

      try {

        if (
          navigator.share
        ) {

          await navigator.share({

            title:
              "Truvora AI",

            text:
              text || "",

          });

          return;

        }


        await copyAnswer(
          text
        );

      } catch (error) {

        if (
          error?.name !==
          "AbortError"
        ) {

          console.error(
            "Share failed:",
            error
          );

        }

      }

    };


  /* =====================================================
     SAVE CHAT
  ===================================================== */

  const saveCurrentChat =
    async (
      currentMessages
    ) => {

      try {

        const data =
          Array.isArray(
            currentMessages
          )
            ? currentMessages
            : messages;


        saveChat(
          data
        );


        if (user) {

          await saveChatToCloud(
            user.uid,
            data
          );

        }

      } catch (error) {

        console.error(
          "Save chat failed:",
          error
        );

      }

    };


  /* =====================================================
     DOCUMENT GENERATION
  ===================================================== */

  const handleGenerateDocument =
    async (
      type,
      messageText
    ) => {

      if (
        !messageText
      ) {

        return;

      }


      setGeneratingFile(
        true
      );


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
                    messageText,

                  recommendations:
                    "",

                  sources:
                    [],

                }),

            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            `Document generation failed: ${response.status}`
          );

        }


        const data =
          await response.json();


        const documentUrl =
          data.document ||
          data.documentUrl ||
          data.url;


        if (
          documentUrl
        ) {

          const finalUrl =
            documentUrl.startsWith(
              "http"
            )
              ? documentUrl
              : `${API_BASE}${documentUrl}`;


          window.open(
            finalUrl,
            "_blank",
            "noopener,noreferrer"
          );

        }


        return data;

      } catch (error) {

        console.error(
          "Document generation failed:",
          error
        );

        return null;

      } finally {

        setGeneratingFile(
          false
        );

      }

    };


  /* =====================================================
     VOICE INPUT
  ===================================================== */

  useEffect(() => {

    if (
      transcript
    ) {

      setInput(
        transcript
      );

    }

  }, [transcript]);


  const toggleVoiceInput =
    () => {

      if (
        !browserSupportsSpeechRecognition
      ) {

        return;

      }


      if (
        listening
      ) {

        SpeechRecognition.stopListening();

        return;

      }


      resetTranscript();


      SpeechRecognition.startListening({

        continuous:
          true,

        language:
          selectedLanguage === "auto"
            ? "en-US"
            : (
                {
                  en: "en-US",
                  hi: "hi-IN",
                  kn: "kn-IN",
                  te: "te-IN",
                  ta: "ta-IN",
                  ml: "ml-IN",
                }[
                  selectedLanguage
                ] ||
                "en-US"
              ),

      });

    };


  /* =====================================================
     PART 3 END
  ===================================================== */

  /* =====================================================
     UI HELPERS
  ===================================================== */

  const getMessageText =
    (message) =>
      message?.text ||
      message?.content ||
      "";


  const getMessageSources =
    (message) =>
      citationRefs(
        message?.sources ||
        message?.webResults ||
        message?.citations ||
        []
      );


  const renderSources =
    (message) => {

      const sources =
        getMessageSources(
          message
        );


      if (
        !sources.length
      ) {

        return null;

      }


      return (

        <div className="truvora-sources">

          <div className="sources-title">

            <span>📚</span>

            <span>
              Sources
            </span>

          </div>


          <div className="sources-list">

            {sources.map(
              (
                source,
                index
              ) => {

                const url =
                  source.sourceUrl ||
                  source.url ||
                  "#";


                const title =
                  source.title ||
                  source.name ||
                  source.domain ||
                  `Source ${index + 1}`;


                let hostname =
                  "";

                try {

                  hostname =
                    new URL(
                      url
                    ).hostname;

                } catch {

                  hostname =
                    source.domain ||
                    "";

                }


                return (

                  <a
                    key={
                      `${url}-${index}`
                    }
                    className="source-item"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {

                      setActiveCitation(
                        source
                      );

                      setCitationPreviewOpen(
                        true
                      );

                    }}
                  >

                    <span className="source-number">

                      {index + 1}

                    </span>


                    <span className="source-content">

                      <strong>
                        {title}
                      </strong>

                      <small>
                        {hostname}
                      </small>

                    </span>


                    <span className="source-arrow">

                      ↗

                    </span>

                  </a>

                );

              }
            )}

          </div>

        </div>

      );

    };


  /* =====================================================
     RENDER MESSAGE
  ===================================================== */

  const renderMessage =
    (message, index) => {

      const isUser =
        message?.role ===
        "user";


      const text =
        getMessageText(
          message
        );


      if (
        isUser
      ) {

        return (

          <div
            key={
              message.timestamp ||
              index
            }
            className="truvora-message truvora-user-message"
          >

            <div className="message-body">

              <div className="message-text">

                {text}

              </div>

            </div>


            <div className="message-avatar user-avatar">

              <FiUser />

            </div>

          </div>

        );

      }


      return (

        <div
          key={
            message.timestamp ||
            index
          }
          className="truvora-message truvora-ai-message"
        >

          <div className="message-avatar">

            T

          </div>


          <div className="message-body">

            <div className="message-text">

              <ReactMarkdown
                remarkPlugins={[
                  remarkGfm,
                ]}
              >
                {text}
              </ReactMarkdown>


              {message.imageUrl && (

                <div className="message-image-container">

                  <img
                    className="message-image"
                    src={
                      message.imageUrl
                    }
                    alt="Generated by Truvora"
                  />

                </div>

              )}


              {message.documentUrl && (

                <a
                  className="generated-document"
                  href={
                    message.documentUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >

                  📄

                  <span>
                    Open generated file
                  </span>

                </a>

              )}

            </div>


            {!message.error && (

              <div className="message-actions">

                <button
                  type="button"
                  className="message-action-btn"
                  title="Copy"
                  onClick={() =>
                    copyAnswer(text)
                  }
                >

                  <FiCopy />

                </button>


                <button
                  type="button"
                  className="message-action-btn"
                  title={
                    speaking
                      ? "Stop reading"
                      : "Read aloud"
                  }
                  onClick={() => {

                    if (
                      speaking
                    ) {

                      stopSpeaking();

                    } else {

                      speakText(
                        text
                      );

                    }

                  }}
                >

                  <FiVolume2 />

                </button>


                <button
                  type="button"
                  className="message-action-btn"
                  title="Share"
                  onClick={() =>
                    shareAnswer(text)
                  }
                >

                  ↗

                </button>


                <button
                  type="button"
                  className="message-action-btn"
                  title="Save chat"
                  onClick={() =>
                    saveCurrentChat(
                      messages
                    )
                  }
                >

                  💾

                </button>


                <button
                  type="button"
                  className="message-action-btn"
                  title="PDF"
                  onClick={() =>
                    handleGenerateDocument(
                      "pdf",
                      text
                    )
                  }
                >

                  PDF

                </button>


                <button
                  type="button"
                  className="message-action-btn"
                  title="DOCX"
                  onClick={() =>
                    handleGenerateDocument(
                      "docx",
                      text
                    )
                  }
                >

                  DOCX

                </button>

              </div>

            )}


            {renderSources(
              message
            )}

          </div>

        </div>

      );

    };


  /* =====================================================
     EMPTY STATE
  ===================================================== */

  const renderEmptyState =
    () => (

      <div className="truvora-empty-state">

        <div className="empty-logo">

          <div className="empty-logo-symbol">

            T

          </div>

        </div>


        <h1>
          How can Truvora help?
        </h1>


        <p>
          Intelligence • Innovation • Trust
        </p>


        <div className="empty-suggestions">

          <button
            type="button"
            onClick={() =>
              setInput(
                "Explain artificial intelligence in simple terms."
              )
            }
          >

            Explain AI

          </button>


          <button
            type="button"
            onClick={() =>
              setInput(
                "Analyze the latest important news."
              )
            }
          >

            Latest news

          </button>


          <button
            type="button"
            onClick={() =>
              setInput(
                "Help me create a professional document."
              )
            }
          >

            Create document

          </button>


          <button
            type="button"
            onClick={() =>
              setInput(
                "Give me a detailed research summary."
              )
            }
          >

            Research

          </button>

        </div>

      </div>

    );


  /* =====================================================
     COMPOSER ATTACHMENTS
  ===================================================== */

  const renderAttachmentStatus =
    () => {

      const hasAny =
        uploadedFile ||
        audioFile ||
        videoFile ||
        documentContext ||
        imagePreview ||
        audioAnalysis ||
        videoAnalysis;


      if (
        !hasAny
      ) {

        return null;

      }


      return (

        <div className="composer-attachment-status">

          {uploadedFile && (

            <span>

              📎

              {uploadedFile.name}

            </span>

          )}


          {audioFile && (

            <span>

              🎵

              {audioFile.name}

            </span>

          )}


          {videoFile && (

            <span>

              🎥

              {videoFile.name}

            </span>

          )}


          {imagePreview && (

            <span>

              🖼️ Image attached

            </span>

          )}


          {documentContext && (

            <span>

              📄 Document ready

            </span>

          )}


          {audioAnalysis && (

            <span>

              🎙️ Audio analyzed

            </span>

          )}


          {videoAnalysis && (

            <span>

              🎥 Video analyzed

            </span>

          )}


          <button
            type="button"
            title="Remove attachments"
            onClick={
              clearAttachments
            }
          >

            ×

          </button>

        </div>

      );

    };


  /* =====================================================
     MODE INDICATORS
  ===================================================== */

  const renderModeIndicators =
    () => (

      <div className="composer-analysis-preview">

        {webEnabled && (

          <>

            <strong>
              🌐 Web ON
            </strong>

            <span>
              Live web search enabled
            </span>

          </>

        )}


        {!webEnabled &&
          automaticWeb && (

            <>

              <strong>
                🌐 Web Auto
              </strong>

              <span>
                Truvora searches when needed
              </span>

            </>

          )}


        {agentMode && (

          <>

            <strong>
              🤖 Agent ON
            </strong>

            <span>
              Agent tasks enabled
            </span>

          </>

        )}


        {!agentMode &&
          automaticAgent && (

            <>

              <strong>
                🤖 Agent Auto
              </strong>

              <span>
                Truvora uses agents when needed
              </span>

            </>

          )}

      </div>

    );


  /* =====================================================
     AUTH SCREEN
  ===================================================== */

  if (
    authLoading
  ) {

    return (

      <div className="truvora-login-screen">

        <div className="truvora-login-card">

          <div className="empty-logo-symbol">

            T

          </div>

          <h1>
            TRUVORA
          </h1>

          <p>
            Intelligence • Innovation • Trust
          </p>

          <span>
            Loading...
          </span>

        </div>

      </div>

    );

  }


  if (
    !user
  ) {

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
                GLOBAL AI
              </span>

            </div>

          </div>


          <div className="truvora-login-content">

            <h1>

              {authMode === "login"
                ? "Welcome back"
                : "Create your account"}

            </h1>


            <p>
              Intelligence • Innovation • Trust
            </p>


            <button
              type="button"
              onClick={
                handleGoogleLogin
              }
              className="google-login-button"
            >

              Continue with Google

            </button>


            <div className="auth-divider">

              <span>
                OR
              </span>

            </div>


            <form
              onSubmit={
                handleEmailAuth
              }
            >

              <input
                className="login-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) =>
                  setEmail(
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
              />


              {authError && (

                <div className="auth-error">

                  {authError}

                </div>

              )}


              <button
                type="submit"
                className="login-submit-button"
              >

                {authMode === "login"
                  ? "Sign in"
                  : "Create account"}

              </button>

            </form>


            <button
              type="button"
              className="auth-switch-button"
              onClick={() => {

                setAuthError("");

                setAuthMode(
                  authMode === "login"
                    ? "signup"
                    : "login"
                );

              }}
            >

              {authMode === "login"
                ? "Create a new account"
                : "Already have an account? Sign in"}

            </button>

          </div>

        </div>

      </div>

    );

  }


  /* =====================================================
     MAIN APPLICATION
  ===================================================== */

  return (

    <div className="truvora-app">


      {/* =================================================
         MOBILE SIDEBAR BACKDROP
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


      {/* =================================================
         SIDEBAR
      ================================================= */}

      <aside
        className={`truvora-sidebar ${
          sidebarOpen
            ? "sidebar-visible"
            : "sidebar-hidden"
        }`}
      >

        <div className="sidebar-header">

          <div className="truvora-logo">

            <div className="truvora-logo-symbol">

              T

            </div>


            <div className="truvora-logo-text">

              <strong>
                TRUVORA
              </strong>

              <span>
                GLOBAL AI
              </span>

            </div>

          </div>


          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={() =>
              setSidebarOpen(
                false
              )
            }
          >

            ×

          </button>

        </div>


        <button
          type="button"
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

          <input
            type="text"
            placeholder="Search chats"
            value={searchChats}
            onChange={(event) =>
              setSearchChats(
                event.target.value
              )
            }
          />

        </div>


        <div className="sidebar-section-title">

          Recent

        </div>


        <div className="sidebar-chat-list">

          {filteredChats.length ===
          0 ? (

            <div className="sidebar-empty">

              No saved chats yet.

            </div>

          ) : (

            filteredChats.map(
              (chat, index) => (

                <button
                  type="button"
                  key={
                    chat?.id ||
                    chat?.timestamp ||
                    index
                  }
                  className="sidebar-chat-item"
                  onClick={() =>
                    openChat(
                      chat
                    )
                  }
                >

                  <span>

                    {chat?.title ||
                      chat?.messages?.[0]?.text ||
                      `Chat ${index + 1}`}

                  </span>

                </button>

              )
            )

          )}

        </div>


        <div className="sidebar-footer">

          <div className="sidebar-user">

            <div className="sidebar-user-avatar">

              {(user?.displayName ||
                user?.email ||
                "U")
                .charAt(0)
                .toUpperCase()}

            </div>


            <div className="sidebar-user-info">

              <strong>

                {user?.displayName ||
                  "Truvora User"}

              </strong>

              <span>

                {user?.email ||
                  ""}

              </span>

            </div>

          </div>


          <button
            type="button"
            className="sidebar-logout"
            onClick={
              handleLogout
            }
          >

            Sign out

          </button>

        </div>

      </aside>


      {/* =================================================
         MAIN
      ================================================= */}

      <main className="truvora-main">


        {/* ===============================================
           TOP BAR
        =============================================== */}

        <header className="truvora-topbar">

          <div className="topbar-left">

            <button
              type="button"
              className="mobile-menu-button"
              onClick={
                toggleSidebar
              }
              aria-label="Open menu"
            >

              <FiMenu />

            </button>


            <div className="mobile-brand">

              <div className="truvora-logo-symbol">

                T

              </div>


              <div>

                <strong>
                  TRUVORA
                </strong>

                <span>
                  GLOBAL AI
                </span>

              </div>

            </div>

          </div>


          <div className="topbar-center">

            <span className="topbar-slogan">

              Intelligence • Innovation • Trust

            </span>

          </div>


          <div className="topbar-right">

            <div className="topbar-avatar">

              {(user?.displayName ||
                user?.email ||
                "U")
                .charAt(0)
                .toUpperCase()}

            </div>

          </div>

        </header>


        {/* ===============================================
           CHAT AREA
        =============================================== */}

        <section className="truvora-chat-area">

          {messages.length === 0
            ? renderEmptyState()
            : messages.map(
                renderMessage
              )}


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

        </section>


        {/* ===============================================
           COMPOSER
        =============================================== */}

        <section className="truvora-composer-area">

          <div
            className={`truvora-composer ${
              isDragActive
                ? "composer-drag-active"
                : ""
            }`}
            {...getRootProps()}
          >

            <input
              {...getInputProps()}
            />


            <div className="composer-toolbar">

              <div className="composer-toolbar-left">


                {/* UPLOAD */}

                <button
                  type="button"
                  className="composer-icon-button"
                  title="Upload file"
                  onClick={(event) => {

                    event.stopPropagation();

                    fileInputRef.current?.click();

                  }}
                >

                  <FiUpload />

                </button>


                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.json,.xml,.rtf,.odt,image/*"
                  style={{
                    display:
                      "none",
                  }}
                  onChange={
                    handleDocumentUpload
                  }
                />


                {/* IMAGE */}

                <button
                  type="button"
                  className="composer-icon-button"
                  title="Image"
                  onClick={(event) => {

                    event.stopPropagation();

                    imageInputRef.current?.click();

                  }}
                >

                  🖼️

                </button>


                <input
                  ref={
                    imageInputRef
                  }
                  type="file"
                  accept="image/*"
                  style={{
                    display:
                      "none",
                  }}
                  onChange={
                    handleImageUpload
                  }
                />


                {/* AUDIO */}

                <button
                  type="button"
                  className="composer-icon-button"
                  title="Audio"
                  onClick={(event) => {

                    event.stopPropagation();

                    audioInputRef.current?.click();

                  }}
                >

                  🎙️

                </button>


                <input
                  ref={
                    audioInputRef
                  }
                  type="file"
                  accept="audio/*"
                  style={{
                    display:
                      "none",
                  }}
                  onChange={
                    handleAudioUpload
                  }
                />


                {/* VIDEO */}

                <button
                  type="button"
                  className="composer-icon-button"
                  title="Video"
                  onClick={(event) => {

                    event.stopPropagation();

                    videoInputRef.current?.click();

                  }}
                >

                  🎥

                </button>


                <input
                  ref={
                    videoInputRef
                  }
                  type="file"
                  accept="video/*"
                  style={{
                    display:
                      "none",
                  }}
                  onChange={
                    handleVideoUpload
                  }
                />


                {/* ANALYZE */}

                <button
                  type="button"
                  className={`composer-mode-button ${
                    showAnalyzeMenu
                      ? "mode-active"
                      : ""
                  }`}
                  title="Analyze"
                  onClick={(event) => {

                    event.stopPropagation();

                    setShowAnalyzeMenu(
                      (previous) =>
                        !previous
                    );

                  }}
                >

                  🔍

                  <span>
                    Analyze
                  </span>

                </button>


                {/* WEB */}

                <button
                  type="button"
                  className={`composer-mode-button ${
                    webEnabled
                      ? "mode-active"
                      : ""
                  }`}
                  title="Web"
                  onClick={(event) => {

                    event.stopPropagation();

                    setWebEnabled(
                      (previous) =>
                        !previous
                    );

                  }}
                >

                  🌐

                  <span>
                    Web
                  </span>

                </button>


                {/* AGENT */}

                <button
                  type="button"
                  className={`composer-mode-button ${
                    agentMode
                      ? "mode-active"
                      : ""
                  }`}
                  title="Agent"
                  onClick={(event) => {

                    event.stopPropagation();

                    setAgentMode(
                      (previous) =>
                        !previous
                    );

                  }}
                >

                  🤖

                  <span>
                    Agent
                  </span>

                </button>


                {/* AUTOMATIC WEB */}

                <button
                  type="button"
                  className={`composer-mode-button ${
                    automaticWeb
                      ? "mode-active"
                      : ""
                  }`}
                  title="Automatic Web"
                  onClick={(event) => {

                    event.stopPropagation();

                    setAutomaticWeb(
                      (previous) =>
                        !previous
                    );

                  }}
                >

                  ⚡

                  <span>
                    Auto
                  </span>

                </button>


              </div>


              <div className="composer-toolbar-right">


                {/* LANGUAGE */}

                <div
                  className="language-selector"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >

                  <Select
                    value={
                      selectedLanguageOption
                    }
                    options={
                      languageOptions
                    }
                    onChange={
                      handleLanguageChange
                    }
                    placeholder="Language"
                    isSearchable
                    classNamePrefix="truvora-select"
                    styles={{

                      control:
                        (base) => ({

                          ...base,

                          background:
                            "rgba(255,255,255,0.035)",

                          borderColor:
                            "rgba(148,163,184,0.13)",

                          minHeight:
                            36,

                          boxShadow:
                            "none",

                        }),

                      menu:
                        (base) => ({

                          ...base,

                          zIndex:
                            2000,

                        }),

                      singleValue:
                        (base) => ({

                          ...base,

                          color:
                            "#c9d8e7",

                          fontSize:
                            11,

                        }),

                      input:
                        (base) => ({

                          ...base,

                          color:
                            "#ffffff",

                        }),

                      placeholder:
                        (base) => ({

                          ...base,

                          color:
                            "#71869e",

                          fontSize:
                            11,

                        }),

                      menuList:
                        (base) => ({

                          ...base,

                          background:
                            "#0f1d30",

                        }),

                      option:
                        (base, state) => ({

                          ...base,

                          background:
                            state.isFocused
                              ? "rgba(21,101,192,0.20)"
                              : "#0f1d30",

                          color:
                            "#dcecff",

                          fontSize:
                            11,

                        }),

                    }}
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
                  onClick={(event) =>
                    event.stopPropagation()
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


                {/* VOICE INPUT */}

                <button
                  type="button"
                  className={`composer-icon-button ${
                    listening
                      ? "mode-active"
                      : ""
                  }`}
                  title="Voice input"
                  onClick={(event) => {

                    event.stopPropagation();

                    toggleVoiceInput();

                  }}
                >

                  {listening
                    ? <FiSquare />
                    : <FiMic />}

                </button>

              </div>

            </div>


            {renderAttachmentStatus()}


            {renderModeIndicators()}


            {/* ANALYZE MENU */}

            {showAnalyzeMenu && (

              <div
                className="analyze-menu"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >

                <div className="analyze-menu-header">

                  <strong>
                    Analyze
                  </strong>


                  <button
                    type="button"
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
                  type="button"
                  onClick={() => {

                    setShowAnalyzeMenu(
                      false
                    );

                    fileInputRef.current?.click();

                  }}
                >

                  <span>
                    📄
                  </span>

                  <span>
                    Document
                  </span>

                </button>


                <button
                  type="button"
                  onClick={() => {

                    setShowAnalyzeMenu(
                      false
                    );

                    imageInputRef.current?.click();

                  }}
                >

                  <span>
                    🖼️
                  </span>

                  <span>
                    Image
                  </span>

                </button>


                <button
                  type="button"
                  onClick={() => {

                    setShowAnalyzeMenu(
                      false
                    );

                    startCamera();

                  }}
                >

                  <span>
                    📷
                  </span>

                  <span>
                    Camera
                  </span>

                </button>


                <button
                  type="button"
                  onClick={() => {

                    setShowAnalyzeMenu(
                      false
                    );

                    videoInputRef.current?.click();

                  }}
                >

                  <span>
                    🎥
                  </span>

                  <span>
                    Video
                  </span>

                </button>


                <button
                  type="button"
                  onClick={() => {

                    setShowAnalyzeMenu(
                      false
                    );

                    audioInputRef.current?.click();

                  }}
                >

                  <span>
                    🎙️
                  </span>

                  <span>
                    Audio
                  </span>

                </button>


                <button
                  type="button"
                  onClick={() => {

                    const url =
                      window.prompt(
                        "Paste YouTube URL"
                      );


                    setShowAnalyzeMenu(
                      false
                    );


                    if (url) {

                      handleYouTube(
                        url
                      );

                    }

                  }}
                >

                  <span>
                    ▶️
                  </span>

                  <span>
                    YouTube
                  </span>

                </button>


                <button
                  type="button"
                  onClick={() => {

                    const url =
                      window.prompt(
                        "Paste website URL"
                      );


                    setShowAnalyzeMenu(
                      false
                    );


                    if (url) {

                      handleWebsiteAnalysis(
                        url
                      );

                    }

                  }}
                >

                  <span>
                    🌐
                  </span>

                  <span>
                    Website
                  </span>

                </button>

              </div>

            )}


            {/* INPUT */}

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
                  isDragActive
                    ? "Drop your file here..."
                    : "Message Truvora..."
                }
                rows={
                  1
                }
                disabled={
                  loading
                }
              />


              <button
                type="button"
                className={`composer-send-button ${
                  loading
                    ? "stop-button"
                    : ""
                }`}
                onClick={(event) => {

                  event.stopPropagation();

                  if (
                    loading
                  ) {

                    handleStopGeneration();

                  } else {

                    handleSend();

                  }

                }}
                disabled={
                  !loading &&
                  !input.trim() &&
                  !uploadedFile &&
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

                {loading
                  ? <FiSquare />
                  : <FiSend />}

              </button>

            </div>


            <div className="composer-disclaimer">

              Truvora may make mistakes. Verify important information.

            </div>

          </div>

        </section>


      </main>


      {/* =================================================
         CAMERA MODAL
      ================================================= */}

      {showCamera && (

        <div
          className="camera-overlay"
          onClick={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              stopCamera();

            }

          }}
        >

          <div className="camera-modal">

            <div className="camera-header">

              <strong>
                Truvora Camera
              </strong>


              <button
                type="button"
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
              className="camera-video"
              autoPlay
              playsInline
              muted
            />


            <div className="camera-actions">

              <button
                type="button"
                className="camera-cancel-button"
                onClick={
                  stopCamera
                }
              >

                Cancel

              </button>


              <button
                type="button"
                className="camera-capture-button"
                onClick={
                  captureCameraImage
                }
              >

                Capture & Analyze

              </button>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
         CITATION PREVIEW
      ================================================= */}

      {citationPreviewOpen &&
        activeCitation && (

        <div
          className="citation-preview-overlay"
          onClick={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              setCitationPreviewOpen(
                false
              );

            }

          }}
        >

          <div className="citation-preview">

            <div className="citation-preview-header">

              <strong>
                Source
              </strong>


              <button
                type="button"
                onClick={() =>
                  setCitationPreviewOpen(
                    false
                  )
                }
              >

                ×

              </button>

            </div>


            <div className="citation-preview-body">

              <strong>

                {activeCitation.title ||
                  activeCitation.name ||
                  "Web source"}

              </strong>


              <p>

                {activeCitation.url ||
                  activeCitation.sourceUrl ||
                  ""}

              </p>


              {(activeCitation.url ||
                activeCitation.sourceUrl) && (

                <a
                  href={
                    activeCitation.url ||
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


      {/* =================================================
         GENERATION OVERLAY
      ================================================= */}

      {generatingFile && (

        <div className="truvora-generation-overlay">

          <div className="truvora-generation-card">

            <div className="generation-spinner" />


            <strong>
              Creating your file
            </strong>


            <span>
              Truvora is preparing a professional document.
            </span>

          </div>

        </div>

      )}

    </div>

  );

}


export default App;
